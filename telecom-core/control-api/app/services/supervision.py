from __future__ import annotations

import asyncio
import re
import uuid
from typing import Any

from ..adapters.asterisk import AsteriskAriClient
from ..adapters.stasis_events import AriStasisEventStream
from ..config import TelecomSettings
from ..errors import (
    CarrierRejectedError,
    CarrierUnavailableError,
    TelecomConfigurationError,
    TelecomValidationError,
)


class SupervisorService:
    _ID = re.compile(r"^[A-Za-z0-9_.:-]{1,160}$")
    _ENDPOINT = re.compile(r"^[A-Za-z0-9_.-]{2,80}$")
    _MODES = {
        "monitor": ("both", "none"),
        "whisper": ("both", "out"),
        "barge": ("both", "both"),
    }

    def __init__(
        self,
        ari: AsteriskAriClient,
        events: AriStasisEventStream,
        settings: TelecomSettings,
    ):
        self._ari = ari
        self._events = events
        self._settings = settings
        self._tasks: set[asyncio.Task[Any]] = set()

    def capabilities(self) -> dict[str, Any]:
        return {
            "enabled": self._settings.supervisor_control_enabled,
            "event_stream": self._events.status(),
            "monitor": self._events.ready,
            "whisper": self._events.ready,
            "barge": self._events.ready,
            "bridge_recording": self._events.ready,
            "recording_policy": "explicit-consent-and-notice-required",
            "covert_monitoring": False,
        }

    def _require_ready(self) -> None:
        if not self._settings.supervisor_control_enabled:
            raise TelecomConfigurationError("Supervisor call control is disabled.")
        if not self._events.ready:
            raise TelecomConfigurationError("The private Asterisk Stasis event stream is not connected.")

    @staticmethod
    def _resources(session_id: str) -> dict[str, str]:
        token = session_id.replace("-", "")
        return {
            "session_id": session_id,
            "snoop_channel_id": f"mag-snoop-{token}",
            "supervisor_channel_id": f"mag-supervisor-{token}",
            "bridge_id": f"mag-supervision-{token}",
            "recording_name": f"mag-recording-{token}",
        }

    async def _channel_exists(self, channel_id: str) -> bool:
        response = await self._ari.request("GET", f"/channels/{channel_id}")
        return response.is_success

    async def _endpoint_ready(self, endpoint: str) -> bool:
        response = await self._ari.request("GET", f"/endpoints/PJSIP/{endpoint}")
        if not response.is_success:
            return False
        state = str(response.json().get("state") or "").strip().lower()
        return state == "online"

    async def start(
        self,
        *,
        target_channel_id: str,
        supervisor_endpoint: str,
        mode: str,
        consent_confirmed: bool,
        notice_confirmed: bool,
    ) -> dict[str, Any]:
        self._require_ready()
        if not consent_confirmed or not notice_confirmed:
            raise TelecomValidationError(
                "Supervisor audio requires confirmed participant consent and supervision notice."
            )
        target = target_channel_id.strip()
        endpoint = supervisor_endpoint.strip()
        if not self._ID.fullmatch(target):
            raise TelecomValidationError("Invalid target channel identifier.")
        if not self._ENDPOINT.fullmatch(endpoint):
            raise TelecomValidationError("Invalid supervisor SIP endpoint identifier.")
        if mode not in self._MODES:
            raise TelecomValidationError("Supervisor mode must be monitor, whisper, or barge.")
        if not await self._channel_exists(target):
            raise CarrierRejectedError("The target call channel is not active.")
        if not await self._endpoint_ready(endpoint):
            raise CarrierUnavailableError("The supervisor SIP endpoint is not registered and online.")

        session_id = str(uuid.uuid4())
        resources = self._resources(session_id)
        spy, whisper = self._MODES[mode]
        app = self._settings.supervisor_stasis_app

        created: list[tuple[str, str]] = []
        try:
            snoop = await self._ari.request(
                "POST",
                f"/channels/{target}/snoop/{resources['snoop_channel_id']}",
                params={
                    "spy": spy,
                    "whisper": whisper,
                    "app": app,
                    "appArgs": f"supervision,{session_id},{mode},snoop",
                },
            )
            if not snoop.is_success:
                raise CarrierRejectedError(snoop.text[:1000] or "Asterisk rejected the supervisor snoop channel.")
            created.append(("channel", resources["snoop_channel_id"]))

            bridge = await self._ari.request(
                "POST",
                f"/bridges/{resources['bridge_id']}",
                params={"type": "mixing", "name": f"Magnanimous supervision {session_id}"},
            )
            if not bridge.is_success:
                raise CarrierRejectedError(bridge.text[:1000] or "Asterisk rejected the supervision bridge.")
            created.append(("bridge", resources["bridge_id"]))

            add_snoop = await self._ari.request(
                "POST",
                f"/bridges/{resources['bridge_id']}/addChannel",
                params={"channel": resources["snoop_channel_id"]},
            )
            if not add_snoop.is_success:
                raise CarrierRejectedError(add_snoop.text[:1000] or "Unable to attach the supervisor snoop channel.")

            supervisor = await self._ari.request(
                "POST",
                "/channels",
                params={
                    "endpoint": f"PJSIP/{endpoint}",
                    "app": app,
                    "appArgs": f"supervision,{session_id},{mode},supervisor",
                    "channelId": resources["supervisor_channel_id"],
                    "callerId": "Magnanimous Supervisor",
                    "timeout": 30000,
                },
            )
            if not supervisor.is_success:
                raise CarrierRejectedError(supervisor.text[:1000] or "Unable to ring the supervisor endpoint.")
            created.append(("channel", resources["supervisor_channel_id"]))

            task = asyncio.create_task(
                self._attach_when_ready(resources["bridge_id"], resources["supervisor_channel_id"])
            )
            self._tasks.add(task)
            task.add_done_callback(self._tasks.discard)

            return {
                **resources,
                "mode": mode,
                "target_channel_id": target,
                "supervisor_endpoint": endpoint,
                "status": "ringing-supervisor",
                "consent_required": True,
                "covert_monitoring": False,
            }
        except Exception:
            await self._cleanup(created)
            raise

    async def _attach_when_ready(self, bridge_id: str, channel_id: str) -> None:
        for _ in range(120):
            await asyncio.sleep(0.5)
            response = await self._ari.request(
                "POST",
                f"/bridges/{bridge_id}/addChannel",
                params={"channel": channel_id},
            )
            if response.is_success:
                return
            if response.status_code in (404,):
                return
            if response.status_code not in (409, 422):
                return

    async def status(self, session_id: str) -> dict[str, Any]:
        self._require_ready()
        resources = self._resources(session_id)
        bridge = await self._ari.request("GET", f"/bridges/{resources['bridge_id']}")
        supervisor = await self._ari.request("GET", f"/channels/{resources['supervisor_channel_id']}")
        snoop = await self._ari.request("GET", f"/channels/{resources['snoop_channel_id']}")
        recording = await self._ari.request("GET", f"/recordings/live/{resources['recording_name']}")
        return {
            **resources,
            "bridge_active": bridge.is_success,
            "supervisor_channel_active": supervisor.is_success,
            "snoop_channel_active": snoop.is_success,
            "recording_active": recording.is_success,
            "event_stream_connected": self._events.ready,
        }

    async def start_recording(
        self,
        session_id: str,
        *,
        consent_confirmed: bool,
        notice_confirmed: bool,
        jurisdiction: str,
        max_duration_seconds: int | None,
    ) -> dict[str, Any]:
        self._require_ready()
        if not consent_confirmed or not notice_confirmed:
            raise TelecomValidationError(
                "Recording requires confirmed participant consent and recording notice."
            )
        jurisdiction = jurisdiction.strip()
        if len(jurisdiction) < 2:
            raise TelecomValidationError("Recording jurisdiction is required.")
        resources = self._resources(session_id)
        bridge = await self._ari.request("GET", f"/bridges/{resources['bridge_id']}")
        if not bridge.is_success:
            raise CarrierRejectedError("The supervision bridge is not active.")
        maximum = max_duration_seconds or self._settings.supervisor_recording_max_seconds
        maximum = max(60, min(maximum, self._settings.supervisor_recording_max_seconds))
        response = await self._ari.request(
            "POST",
            f"/bridges/{resources['bridge_id']}/record",
            params={
                "name": resources["recording_name"],
                "format": self._settings.supervisor_recording_format,
                "maxDurationSeconds": maximum,
                "ifExists": "fail",
                "beep": "true",
                "terminateOn": "none",
            },
        )
        if not response.is_success:
            raise CarrierRejectedError(response.text[:1000] or "Asterisk rejected bridge recording.")
        return {
            **resources,
            "recording": True,
            "jurisdiction": jurisdiction,
            "consent_confirmed": True,
            "notice_confirmed": True,
            "beep": True,
            "format": self._settings.supervisor_recording_format,
            "max_duration_seconds": maximum,
            "recording_file_exposed": False,
        }

    async def stop_recording(self, session_id: str) -> dict[str, Any]:
        self._require_ready()
        resources = self._resources(session_id)
        response = await self._ari.request(
            "POST",
            f"/recordings/live/{resources['recording_name']}/stop",
        )
        if response.status_code not in (204, 404):
            raise CarrierRejectedError(response.text[:1000] or "Asterisk rejected recording stop.")
        return {
            **resources,
            "recording": False,
            "stored": response.status_code == 204,
            "recording_file_exposed": False,
        }

    async def stop(self, session_id: str) -> dict[str, Any]:
        self._require_ready()
        resources = self._resources(session_id)
        live = await self._ari.request("GET", f"/recordings/live/{resources['recording_name']}")
        if live.is_success:
            await self._ari.request("POST", f"/recordings/live/{resources['recording_name']}/stop")
        await self._cleanup([
            ("channel", resources["supervisor_channel_id"]),
            ("channel", resources["snoop_channel_id"]),
            ("bridge", resources["bridge_id"]),
        ])
        return {**resources, "stopped": True}

    async def _cleanup(self, resources: list[tuple[str, str]]) -> None:
        for kind, resource_id in reversed(resources):
            path = f"/channels/{resource_id}" if kind == "channel" else f"/bridges/{resource_id}"
            try:
                await self._ari.request("DELETE", path)
            except Exception:
                pass
