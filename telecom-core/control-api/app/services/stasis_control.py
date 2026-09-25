from __future__ import annotations

import asyncio
import json
import re
import time
import uuid
from dataclasses import dataclass
from typing import Any
from urllib.parse import urlencode, urlsplit, urlunsplit

from websockets.asyncio.client import connect

from ..adapters.asterisk import AsteriskAriClient
from ..adapters.stasis_state import PostgresStasisStateStore
from ..config import TelecomSettings
from ..errors import (
    CarrierRejectedError,
    CarrierUnavailableError,
    TelecomConfigurationError,
    TelecomValidationError,
)


_ID = re.compile(r"^[A-Za-z0-9_.:-]{1,180}$")
_RECORDING = re.compile(r"^[A-Za-z0-9_.-]{1,180}$")


@dataclass(frozen=True)
class ManagedBridge:
    bridge_id: str
    call_id: str
    channel_ids: tuple[str, ...]
    created_at: int


@dataclass(frozen=True)
class SupervisorSession:
    session_id: str
    call_bridge_id: str
    supervisor_bridge_id: str
    snoop_channel_id: str
    target_channel_id: str
    supervisor_channel_id: str
    mode: str
    requested_by: str
    created_at: int


@dataclass(frozen=True)
class ManagedRecording:
    recording_name: str
    bridge_id: str
    requested_by: str
    consent_basis: str
    beep: bool
    max_duration_seconds: int
    created_at: int


class StasisEventListener:
    """Maintains the private ARI event subscription needed to own Stasis channels."""

    def __init__(self, ari: AsteriskAriClient, settings: TelecomSettings):
        self._ari = ari
        self._settings = settings
        self._connected = False
        self._channels: dict[str, dict[str, Any]] = {}
        self._event_count = 0
        self._last_event_at = 0
        self._condition = asyncio.Condition()

    @property
    def connected(self) -> bool:
        return self._connected

    @property
    def enabled(self) -> bool:
        return self._settings.stasis_enabled

    def owns_channel(self, channel_id: str) -> bool:
        return channel_id in self._channels

    def status(self) -> dict[str, Any]:
        return {
            "configured": self._settings.stasis_enabled,
            "connected": self._connected,
            "app": self._settings.stasis_app,
            "tracked_channels": len(self._channels),
            "event_count": self._event_count,
            "last_event_at": self._last_event_at or None,
            "truth_boundary": (
                "Supervisor/recording actions require a connected private ARI event stream "
                "and Stasis-owned channels."
            ),
        }

    def _event_url(self) -> str:
        parsed = urlsplit(self._settings.ari_url)
        scheme = "wss" if parsed.scheme == "https" else "ws"
        path = f"{parsed.path.rstrip('/')}/events"
        query = urlencode(
            {
                "app": self._settings.stasis_app,
                "api_key": f"{self._settings.ari_user}:{self._settings.ari_password}",
                "subscribeAll": "false",
            }
        )
        return urlunsplit((scheme, parsed.netloc, path, query, ""))

    async def _track(self, event: dict[str, Any]) -> None:
        event_type = str(event.get("type") or "")
        channel = event.get("channel") if isinstance(event.get("channel"), dict) else {}
        channel_id = str(channel.get("id") or "")
        self._event_count += 1
        self._last_event_at = int(time.time())

        async with self._condition:
            if event_type == "StasisStart" and channel_id:
                self._channels[channel_id] = {
                    "id": channel_id,
                    "name": str(channel.get("name") or ""),
                    "state": str(channel.get("state") or ""),
                    "args": list(event.get("args") or []),
                    "entered_at": self._last_event_at,
                }
            elif event_type in {"StasisEnd", "ChannelDestroyed"} and channel_id:
                self._channels.pop(channel_id, None)
            self._condition.notify_all()

    async def wait_for_channel(self, channel_id: str) -> bool:
        if self.owns_channel(channel_id):
            return True

        async def _wait() -> bool:
            async with self._condition:
                while not self.owns_channel(channel_id):
                    await self._condition.wait()
                return True

        try:
            return await asyncio.wait_for(_wait(), timeout=self._settings.stasis_channel_wait_seconds)
        except TimeoutError:
            return False

    async def _seed_existing_channels(self) -> None:
        try:
            response = await self._ari.request(
                "GET", f"/applications/{self._settings.stasis_app}"
            )
        except Exception:
            return
        if not response.is_success:
            return
        data = response.json()
        channel_ids = data.get("channel_ids") if isinstance(data, dict) else []
        if not isinstance(channel_ids, list):
            return
        async with self._condition:
            for raw in channel_ids:
                channel_id = str(raw or "")
                if channel_id:
                    self._channels.setdefault(
                        channel_id,
                        {
                            "id": channel_id,
                            "name": "",
                            "state": "",
                            "args": ["restored"],
                            "entered_at": int(time.time()),
                        },
                    )
            self._condition.notify_all()

    async def run(self) -> None:
        if not self._settings.stasis_enabled:
            return
        if not self._settings.ari_user or not self._settings.ari_password:
            return

        delay = self._settings.stasis_reconnect_seconds
        while True:
            try:
                async with connect(
                    self._event_url(),
                    open_timeout=10,
                    ping_interval=20,
                    ping_timeout=20,
                    max_size=1_000_000,
                ) as websocket:
                    await self._seed_existing_channels()
                    self._connected = True
                    delay = self._settings.stasis_reconnect_seconds
                    async for raw in websocket:
                        try:
                            event = json.loads(raw)
                        except (TypeError, json.JSONDecodeError):
                            continue
                        if isinstance(event, dict):
                            await self._track(event)
            except asyncio.CancelledError:
                self._connected = False
                raise
            except Exception:
                self._connected = False
                await asyncio.sleep(delay)
                delay = min(30.0, max(self._settings.stasis_reconnect_seconds, delay * 2))
            finally:
                self._connected = False


class StasisCallControlService:
    """Fail-closed bridge, supervisor and bridge-recording controller."""

    _SUPERVISOR_MODES = {
        "monitor": ("both", "none"),
        "whisper": ("both", "out"),
        "barge": ("both", "both"),
    }

    def __init__(
        self,
        ari: AsteriskAriClient,
        listener: StasisEventListener,
        settings: TelecomSettings,
    ):
        self._ari = ari
        self._listener = listener
        self._settings = settings
        self._bridges: dict[str, ManagedBridge] = {}
        self._supervisor_sessions: dict[str, SupervisorSession] = {}
        self._recordings: dict[str, ManagedRecording] = {}
        self._lock = asyncio.Lock()

    def status(self) -> dict[str, Any]:
        return {
            **self._listener.status(),
            "managed_call_bridges": len(self._bridges),
            "supervisor_sessions": len(self._supervisor_sessions),
            "active_recordings": len(self._recordings),
            "supervisor_modes": sorted(self._SUPERVISOR_MODES),
            "recording_requires_explicit_consent": True,
            "public_ari_exposed": False,
        }

    def _require_ready(self) -> None:
        if not self._settings.stasis_enabled:
            raise TelecomConfigurationError("Stasis call control is disabled.")
        if not self._listener.connected:
            raise CarrierUnavailableError("Stasis event control is not connected to Asterisk.")

    @staticmethod
    def _clean_id(value: str, label: str) -> str:
        clean = str(value or "").strip()
        if not _ID.fullmatch(clean):
            raise TelecomValidationError(f"{label} is invalid.")
        return clean

    def _require_owned_channel(self, channel_id: str, label: str) -> str:
        clean = self._clean_id(channel_id, label)
        if not self._listener.owns_channel(clean):
            raise TelecomValidationError(f"{label} is not owned by the Magnanimous Stasis application.")
        return clean

    async def _ari_ok(
        self,
        method: str,
        path: str,
        *,
        params: dict[str, Any] | None = None,
        accepted: tuple[int, ...] = (200, 201, 204),
    ) -> Any:
        response = await self._ari.request(method, path, params=params)
        if response.status_code not in accepted:
            raise CarrierRejectedError(response.text[:1000] or f"Asterisk rejected {method} {path}.")
        if response.status_code == 204:
            return None
        try:
            return response.json()
        except Exception:
            return None

    async def create_bridge(self, call_id: str, channel_ids: list[str]) -> dict[str, Any]:
        self._require_ready()
        call = self._clean_id(call_id, "call_id")
        channels = tuple(dict.fromkeys(self._require_owned_channel(x, "channel_id") for x in channel_ids))
        if len(channels) < 2 or len(channels) > 8:
            raise TelecomValidationError("A managed call bridge requires between 2 and 8 Stasis-owned channels.")

        bridge_id = f"mag-call-{uuid.uuid4().hex}"
        try:
            await self._ari_ok(
                "POST",
                f"/bridges/{bridge_id}",
                params={"type": "mixing", "name": f"Magnanimous call {call[:80]}"},
            )
            for channel_id in channels:
                await self._ari_ok(
                    "POST",
                    f"/bridges/{bridge_id}/addChannel",
                    params={"channel": channel_id},
                )
        except Exception:
            try:
                await self._ari_ok("DELETE", f"/bridges/{bridge_id}", accepted=(204, 404))
            except Exception:
                pass
            raise

        managed = ManagedBridge(
            bridge_id=bridge_id,
            call_id=call,
            channel_ids=channels,
            created_at=int(time.time()),
        )
        async with self._lock:
            self._bridges[bridge_id] = managed
        return {
            "ok": True,
            "bridge_id": bridge_id,
            "call_id": call,
            "channel_ids": list(channels),
            "managed_by": "Magnanimous Telecom",
        }

    async def destroy_bridge(self, bridge_id: str) -> dict[str, Any]:
        self._require_ready()
        clean = self._clean_id(bridge_id, "bridge_id")
        async with self._lock:
            if clean not in self._bridges:
                raise TelecomValidationError("bridge_id is not a managed Magnanimous call bridge.")
            active_recordings = [x for x in self._recordings.values() if x.bridge_id == clean]
            active_supervision = [x for x in self._supervisor_sessions.values() if x.call_bridge_id == clean]
        if active_recordings or active_supervision:
            raise TelecomValidationError(
                "Stop active recording and supervisor sessions before destroying the managed call bridge."
            )
        await self._ari_ok("DELETE", f"/bridges/{clean}", accepted=(204, 404))
        async with self._lock:
            self._bridges.pop(clean, None)
        return {"ok": True, "bridge_id": clean, "destroyed": True}

    async def start_supervisor(
        self,
        *,
        call_bridge_id: str,
        target_channel_id: str,
        supervisor_channel_id: str,
        mode: str,
        requested_by: str,
    ) -> dict[str, Any]:
        self._require_ready()
        bridge_id = self._clean_id(call_bridge_id, "call_bridge_id")
        target = self._require_owned_channel(target_channel_id, "target_channel_id")
        supervisor = self._require_owned_channel(supervisor_channel_id, "supervisor_channel_id")
        if target == supervisor:
            raise TelecomValidationError("Supervisor and target channels must be different.")
        selected_mode = str(mode or "").strip().lower()
        if selected_mode not in self._SUPERVISOR_MODES:
            raise TelecomValidationError("mode must be monitor, whisper, or barge.")
        actor = str(requested_by or "").strip()[:200]
        if not actor:
            raise TelecomValidationError("requested_by is required for supervisor controls.")

        async with self._lock:
            managed = self._bridges.get(bridge_id)
        if not managed or target not in managed.channel_ids:
            raise TelecomValidationError("Target channel is not part of the managed call bridge.")

        session_id = f"sup-{uuid.uuid4().hex}"
        snoop_id = f"mag-snoop-{uuid.uuid4().hex}"
        supervisor_bridge_id = f"mag-supervisor-{uuid.uuid4().hex}"
        spy, whisper = self._SUPERVISOR_MODES[selected_mode]

        try:
            await self._ari_ok(
                "POST",
                f"/channels/{target}/snoop/{snoop_id}",
                params={
                    "spy": spy,
                    "whisper": whisper,
                    "app": self._settings.stasis_app,
                    "appArgs": f"supervisor,{selected_mode},{session_id}",
                },
            )
            if not await self._listener.wait_for_channel(snoop_id):
                raise CarrierUnavailableError("Asterisk created the snoop channel but it did not enter Stasis in time.")
            await self._ari_ok(
                "POST",
                f"/bridges/{supervisor_bridge_id}",
                params={"type": "mixing", "name": f"Magnanimous supervisor {session_id[:50]}"},
            )
            await self._ari_ok(
                "POST",
                f"/bridges/{supervisor_bridge_id}/addChannel",
                params={"channel": supervisor},
            )
            await self._ari_ok(
                "POST",
                f"/bridges/{supervisor_bridge_id}/addChannel",
                params={"channel": snoop_id},
            )
        except Exception:
            try:
                await self._ari_ok("DELETE", f"/channels/{snoop_id}", accepted=(204, 404))
            except Exception:
                pass
            try:
                await self._ari_ok("DELETE", f"/bridges/{supervisor_bridge_id}", accepted=(204, 404))
            except Exception:
                pass
            raise

        session = SupervisorSession(
            session_id=session_id,
            call_bridge_id=bridge_id,
            supervisor_bridge_id=supervisor_bridge_id,
            snoop_channel_id=snoop_id,
            target_channel_id=target,
            supervisor_channel_id=supervisor,
            mode=selected_mode,
            requested_by=actor,
            created_at=int(time.time()),
        )
        async with self._lock:
            self._supervisor_sessions[session_id] = session
        return {
            "ok": True,
            "session_id": session_id,
            "mode": selected_mode,
            "call_bridge_id": bridge_id,
            "supervisor_bridge_id": supervisor_bridge_id,
            "snoop_channel_id": snoop_id,
            "requested_by": actor,
        }

    async def _cleanup_supervisor_session(self, session: SupervisorSession) -> None:
        try:
            await self._ari_ok("DELETE", f"/channels/{session.snoop_channel_id}", accepted=(204, 404))
        except Exception:
            pass
        try:
            await self._ari_ok("DELETE", f"/bridges/{session.supervisor_bridge_id}", accepted=(204, 404))
        except Exception:
            pass
        async with self._lock:
            self._supervisor_sessions.pop(session.session_id, None)

    async def stop_supervisor(self, session_id: str) -> dict[str, Any]:
        self._require_ready()
        clean = self._clean_id(session_id, "session_id")
        async with self._lock:
            session = self._supervisor_sessions.get(clean)
        if not session:
            raise TelecomValidationError("Supervisor session was not found.")
        await self._cleanup_supervisor_session(session)
        return {"ok": True, "session_id": clean, "stopped": True}

    async def reap_once(self) -> None:
        if not self._settings.stasis_enabled or not self._listener.connected:
            return
        async with self._lock:
            sessions = list(self._supervisor_sessions.values())
            recordings = list(self._recordings.values())
            bridges = list(self._bridges.values())

        for session in sessions:
            if not self._listener.owns_channel(session.target_channel_id) or not self._listener.owns_channel(session.supervisor_channel_id):
                await self._cleanup_supervisor_session(session)

        for recording in recordings:
            try:
                response = await self._ari.request("GET", f"/recordings/live/{recording.recording_name}")
            except Exception:
                continue
            if response.status_code == 404:
                async with self._lock:
                    self._recordings.pop(recording.recording_name, None)

        missing_bridges: list[str] = []
        for bridge in bridges:
            try:
                response = await self._ari.request("GET", f"/bridges/{bridge.bridge_id}")
            except Exception:
                continue
            if response.status_code == 404:
                missing_bridges.append(bridge.bridge_id)
        if missing_bridges:
            async with self._lock:
                for bridge_id in missing_bridges:
                    self._bridges.pop(bridge_id, None)
                    for name, recording in list(self._recordings.items()):
                        if recording.bridge_id == bridge_id:
                            self._recordings.pop(name, None)

    async def reap_loop(self) -> None:
        if not self._settings.stasis_enabled:
            return
        while True:
            await asyncio.sleep(5)
            try:
                await self.reap_once()
            except asyncio.CancelledError:
                raise
            except Exception:
                continue

    async def start_recording(
        self,
        *,
        bridge_id: str,
        requested_by: str,
        consent_confirmed: bool,
        consent_basis: str,
        beep: bool,
        max_duration_seconds: int,
    ) -> dict[str, Any]:
        self._require_ready()
        clean_bridge = self._clean_id(bridge_id, "bridge_id")
        actor = str(requested_by or "").strip()[:200]
        basis = str(consent_basis or "").strip()[:500]
        if not actor:
            raise TelecomValidationError("requested_by is required for recording.")
        if not consent_confirmed or not basis:
            raise TelecomValidationError("Recording requires explicit consent confirmation and a consent basis.")
        async with self._lock:
            if clean_bridge not in self._bridges:
                raise TelecomValidationError("Recording is limited to a managed Magnanimous call bridge.")
            if any(x.bridge_id == clean_bridge for x in self._recordings.values()):
                raise TelecomValidationError("A recording is already active for this managed call bridge.")

        recording_name = f"mag-{uuid.uuid4().hex}"
        if not _RECORDING.fullmatch(recording_name):
            raise TelecomValidationError("Generated recording name is invalid.")
        duration = max(1, min(14400, int(max_duration_seconds or 3600)))
        await self._ari_ok(
            "POST",
            f"/bridges/{clean_bridge}/record",
            params={
                "name": recording_name,
                "format": "wav",
                "maxDurationSeconds": duration,
                "maxSilenceSeconds": 0,
                "ifExists": "fail",
                "beep": "true" if beep else "false",
                "terminateOn": "none",
            },
        )
        recording = ManagedRecording(
            recording_name=recording_name,
            bridge_id=clean_bridge,
            requested_by=actor,
            consent_basis=basis,
            created_at=int(time.time()),
        )
        async with self._lock:
            self._recordings[recording_name] = recording
        return {
            "ok": True,
            "recording_name": recording_name,
            "bridge_id": clean_bridge,
            "format": "wav",
            "beep": bool(beep),
            "max_duration_seconds": duration,
            "consent_confirmed": True,
            "requested_by": actor,
        }

    async def stop_recording(self, recording_name: str) -> dict[str, Any]:
        self._require_ready()
        clean = str(recording_name or "").strip()
        if not _RECORDING.fullmatch(clean):
            raise TelecomValidationError("recording_name is invalid.")
        async with self._lock:
            recording = self._recordings.get(clean)
        if not recording:
            raise TelecomValidationError("Managed recording was not found.")
        await self._ari_ok("POST", f"/recordings/live/{clean}/stop", accepted=(204, 404))
        async with self._lock:
            self._recordings.pop(clean, None)
        return {
            "ok": True,
            "recording_name": clean,
            "stored": True,
            "bridge_id": recording.bridge_id,
        }
