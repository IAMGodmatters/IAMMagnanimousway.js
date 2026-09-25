from __future__ import annotations

import asyncio
from dataclasses import dataclass
import json
import time
from typing import Any
from urllib.parse import urlencode, urlsplit, urlunsplit
import uuid

from websockets.asyncio.client import connect

from ..config import TelecomSettings
from ..errors import CarrierRejectedError, CarrierUnavailableError, TelecomConfigurationError, TelecomNotFoundError, TelecomValidationError
from ..models import StasisRecordingStart, SupervisorSessionStart
from ..ports import CarrierCallRequest, CarrierCallState


@dataclass
class ManagedStasisCall:
    provider_call_id: str
    business_call_id: str
    tenant_id: str
    destination: str
    caller_id: str
    selected_endpoint: str
    bridge_id: str
    customer_channel_id: str
    agent_channel_id: str
    status: str = "dialing"
    customer_joined: bool = False
    agent_joined: bool = False
    agent_originated: bool = False
    cleaning: bool = False


class AsteriskStasisBridgeService:
    """Owns the gated ARI/Stasis mixing-bridge lifecycle for native Magnanimous calls."""

    def __init__(self, ari: Any, settings: TelecomSettings):
        self._ari = ari
        self._settings = settings
        self._calls: dict[str, ManagedStasisCall] = {}
        self._by_channel: dict[str, str] = {}
        self._state = "disabled" if not settings.stasis_bridge_enabled else "starting"
        self._ready = False
        self._last_error = ""
        self._consecutive_failures = 0
        self._supervisor_sessions: dict[str, dict[str, str]] = {}

    @property
    def enabled(self) -> bool:
        return bool(self._settings.stasis_bridge_enabled)

    def owns(self, provider_call_id: str) -> bool:
        return provider_call_id in self._calls

    def call_state(self, provider_call_id: str) -> CarrierCallState | None:
        call = self._calls.get(provider_call_id)
        if not call:
            return None
        return CarrierCallState(provider_call_id=provider_call_id, status=call.status)

    def call_topology(self, provider_call_id: str) -> dict[str, Any]:
        self._require_ready()
        call = self._calls.get(provider_call_id)
        if not call:
            raise TelecomNotFoundError("Managed Stasis call not found.")
        return {
            "provider_call_id": provider_call_id,
            "bridge_id": call.bridge_id,
            "customer_channel_id": call.customer_channel_id,
            "agent_channel_id": call.agent_channel_id,
            "status": call.status,
            "customer_joined": call.customer_joined,
            "agent_joined": call.agent_joined,
            "provider": "Magnanimous Telecom",
        }

    def status(self) -> dict[str, Any]:
        return {
            "configured": self.enabled,
            "state": self._state,
            "ready": self._ready,
            "app": self._settings.stasis_app if self.enabled else None,
            "active_bridges": len(self._calls),
            "consecutive_failures": self._consecutive_failures,
            "last_error": self._last_error or None,
            "supervisor_audio_configured": self._settings.supervisor_audio_enabled,
            "supervisor_audio_runtime_ready": bool(self._ready and self._settings.supervisor_audio_enabled),
            "supervisor_monitor_live": False,
            "supervisor_whisper_live": False,
            "supervisor_barge_live": False,
            "active_supervisor_sessions": len(self._supervisor_sessions),
            "bridge_recording_configured": self._settings.bridge_recording_enabled,
            "bridge_recording_runtime_ready": bool(self._ready and self._settings.bridge_recording_enabled),
            "bridge_recording_live": False,
            "recording_format": self._settings.bridge_recording_format,
            "recording_max_seconds": self._settings.bridge_recording_max_seconds,
            "recording_consent_required": True,
            "public_live_verified": False,
            "truth_boundary": (
                "Source and local runtime readiness do not prove public production media. "
                "Supervisor audio and recording remain separately gated and require consent, authorization, "
                "and external host verification before public activation."
            ),
        }

    def _require_ready(self) -> None:
        if not self.enabled:
            raise TelecomConfigurationError("Native Stasis bridge lifecycle is disabled.")
        if not self._ready:
            raise TelecomConfigurationError("Native Stasis bridge event stream is not ready.")

    def _require_supervisor(self) -> None:
        self._require_ready()
        if not self._settings.supervisor_audio_enabled:
            raise TelecomConfigurationError("Native supervisor audio is disabled.")

    def _require_recording(self) -> None:
        self._require_ready()
        if not self._settings.bridge_recording_enabled:
            raise TelecomConfigurationError("Native bridge recording is disabled.")

    @staticmethod
    def _require_consent(consent_confirmed: bool, jurisdiction: str) -> None:
        if not consent_confirmed:
            raise TelecomValidationError("Explicit recording/supervisor consent confirmation is required.")
        if not str(jurisdiction or "").strip():
            raise TelecomValidationError("Jurisdiction is required for recording or supervisor audio.")

    async def _expect(
        self,
        method: str,
        path: str,
        *,
        params: dict[str, Any] | None = None,
        body: Any = None,
        ok: tuple[int, ...] = (200, 201, 204),
        allow_missing: bool = False,
    ) -> Any:
        response = await self._ari.request(method, path, params=params, body=body)
        if allow_missing and response.status_code == 404:
            return None
        if response.status_code not in ok:
            raise CarrierRejectedError(response.text[:1000] or f"Asterisk rejected {method} {path}.")
        if response.status_code == 204 or not getattr(response, "content", b""):
            return None
        try:
            return response.json()
        except ValueError:
            return None

    async def bridge(self, bridge_id: str) -> dict[str, Any]:
        self._require_ready()
        data = await self._expect("GET", f"/bridges/{bridge_id}", ok=(200,))
        return data if isinstance(data, dict) else {"id": bridge_id}

    async def start_recording(self, bridge_id: str, request: StasisRecordingStart) -> dict[str, Any]:
        self._require_recording()
        self._require_consent(request.consent_confirmed, request.jurisdiction)
        recording_format = request.format or self._settings.bridge_recording_format
        max_duration = min(
            request.max_duration_seconds or self._settings.bridge_recording_max_seconds,
            self._settings.bridge_recording_max_seconds,
        )
        name = request.name or f"mag-{bridge_id[:48]}-{int(time.time())}-{uuid.uuid4().hex[:8]}"
        data = await self._expect(
            "POST",
            f"/bridges/{bridge_id}/record",
            params={
                "name": name,
                "format": recording_format,
                "maxDurationSeconds": max_duration,
                "maxSilenceSeconds": 0,
                "ifExists": "fail",
                "beep": str(bool(request.beep)).lower(),
                "terminateOn": "none",
            },
            ok=(200, 201),
        )
        return {
            "ok": True,
            "bridge_id": bridge_id,
            "recording_name": name,
            "format": recording_format,
            "max_duration_seconds": max_duration,
            "jurisdiction": request.jurisdiction,
            "state": data.get("state", "recording") if isinstance(data, dict) else "recording",
        }

    async def stop_recording(self, recording_name: str) -> dict[str, Any]:
        self._require_recording()
        await self._expect(
            "POST",
            f"/recordings/live/{recording_name}/stop",
            ok=(204,),
            allow_missing=True,
        )
        return {"ok": True, "recording_name": recording_name, "status": "stored-or-already-ended"}

    async def start_supervisor(self, request: SupervisorSessionStart) -> dict[str, Any]:
        self._require_supervisor()
        self._require_consent(request.consent_confirmed, request.jurisdiction)
        await self._expect("GET", f"/bridges/{request.call_bridge_id}", ok=(200,))
        await self._expect("GET", f"/channels/{request.supervisor_channel_id}", ok=(200,))
        await self._expect("GET", f"/channels/{request.target_channel_id}", ok=(200,))

        session_id = f"mag-supervisor-{uuid.uuid4().hex}"
        if request.mode == "barge":
            await self._expect(
                "POST",
                f"/bridges/{request.call_bridge_id}/addChannel",
                params={
                    "channel": request.supervisor_channel_id,
                    "role": "supervisor",
                    "absorbDTMF": "true",
                    "inhibitConnectedLineUpdates": "true",
                },
                ok=(204,),
            )
            self._supervisor_sessions[session_id] = {
                "mode": request.mode,
                "call_bridge_id": request.call_bridge_id,
                "target_channel_id": request.target_channel_id,
                "supervisor_channel_id": request.supervisor_channel_id,
                "supervisor_bridge_id": "",
                "snoop_channel_id": "",
            }
            return {
                "session_id": session_id,
                "mode": request.mode,
                "call_bridge_id": request.call_bridge_id,
                "target_channel_id": request.target_channel_id,
                "supervisor_channel_id": request.supervisor_channel_id,
                "jurisdiction": request.jurisdiction,
            }

        supervisor_bridge_id = f"mag-supervisor-bridge-{uuid.uuid4().hex}"
        snoop_channel_id = f"mag-snoop-{uuid.uuid4().hex}"
        await self._expect(
            "POST",
            f"/bridges/{supervisor_bridge_id}",
            params={"type": "mixing,proxy_media", "name": f"Magnanimous {request.mode}"},
            ok=(200, 201),
        )
        try:
            await self._expect(
                "POST",
                f"/channels/{request.target_channel_id}/snoop/{snoop_channel_id}",
                params={
                    "spy": "both",
                    "whisper": "out" if request.mode == "whisper" else "none",
                    "app": self._settings.stasis_app,
                    "appArgs": f"supervisor,{request.mode},{session_id}",
                },
                ok=(200, 201),
            )
            await self._expect(
                "POST",
                f"/bridges/{supervisor_bridge_id}/addChannel",
                params={
                    "channel": f"{request.supervisor_channel_id},{snoop_channel_id}",
                    "absorbDTMF": "true",
                    "inhibitConnectedLineUpdates": "true",
                },
                ok=(204,),
            )
        except Exception:
            await self._expect("DELETE", f"/channels/{snoop_channel_id}", allow_missing=True)
            await self._expect("DELETE", f"/bridges/{supervisor_bridge_id}", allow_missing=True)
            raise

        self._supervisor_sessions[session_id] = {
            "mode": request.mode,
            "call_bridge_id": request.call_bridge_id,
            "target_channel_id": request.target_channel_id,
            "supervisor_channel_id": request.supervisor_channel_id,
            "supervisor_bridge_id": supervisor_bridge_id,
            "snoop_channel_id": snoop_channel_id,
        }
        return {
            "session_id": session_id,
            "mode": request.mode,
            "call_bridge_id": request.call_bridge_id,
            "target_channel_id": request.target_channel_id,
            "supervisor_channel_id": request.supervisor_channel_id,
            "supervisor_bridge_id": supervisor_bridge_id,
            "snoop_channel_id": snoop_channel_id,
            "jurisdiction": request.jurisdiction,
        }

    async def _cleanup_supervisor(self, session_id: str) -> dict[str, Any]:
        session = self._supervisor_sessions.pop(session_id, None)
        if not session:
            return {"ok": True, "session_id": session_id, "status": "already-ended"}
        if session["mode"] == "barge":
            await self._expect(
                "POST",
                f"/bridges/{session['call_bridge_id']}/removeChannel",
                params={"channel": session["supervisor_channel_id"]},
                ok=(204,),
                allow_missing=True,
            )
        else:
            await self._expect("DELETE", f"/channels/{session['snoop_channel_id']}", allow_missing=True)
            await self._expect("DELETE", f"/bridges/{session['supervisor_bridge_id']}", allow_missing=True)
        return {"ok": True, "session_id": session_id, "status": "ended"}

    async def stop_supervisor(self, session_id: str) -> dict[str, Any]:
        self._require_supervisor()
        return await self._cleanup_supervisor(session_id)

    async def close(self) -> None:
        for session_id in list(self._supervisor_sessions):
            try:
                await self._cleanup_supervisor(session_id)
            except Exception:
                self._supervisor_sessions.pop(session_id, None)
        for provider_call_id in list(self._calls):
            try:
                await self.hangup(provider_call_id)
            except Exception:
                self._calls.pop(provider_call_id, None)

    def _events_url(self) -> str:
        source = urlsplit(self._settings.ari_url)
        scheme = "wss" if source.scheme == "https" else "ws"
        path = source.path.rstrip("/") + "/events"
        query = urlencode({
            "app": self._settings.stasis_app,
            "api_key": f"{self._settings.ari_user}:{self._settings.ari_password}",
        })
        return urlunsplit((scheme, source.netloc, path, query, ""))

    @staticmethod
    def _bridge_id(provider_call_id: str) -> str:
        return f"mag-{provider_call_id}"

    @staticmethod
    def _agent_channel_id(provider_call_id: str) -> str:
        return str(uuid.uuid5(uuid.NAMESPACE_URL, f"magnanimous-stasis-agent:{provider_call_id}"))

    async def run(self) -> None:
        if not self.enabled:
            self._state = "disabled"
            return
        max_failures = max(1, self._settings.stasis_reconnect_attempts)
        while self._consecutive_failures < max_failures:
            self._state = "starting" if self._consecutive_failures == 0 else "reconnecting"
            try:
                async with connect(
                    self._events_url(),
                    open_timeout=10,
                    close_timeout=5,
                    ping_interval=20,
                    max_size=1_000_000,
                ) as socket:
                    self._ready = True
                    self._state = "ready"
                    self._last_error = ""
                    self._consecutive_failures = 0
                    async for raw in socket:
                        try:
                            event = json.loads(raw)
                        except (TypeError, json.JSONDecodeError):
                            continue
                        await self.handle_event(event)
                    raise ConnectionError("ARI event stream closed")
            except asyncio.CancelledError:
                self._ready = False
                self._state = "stopped"
                raise
            except Exception as exc:
                self._ready = False
                self._consecutive_failures += 1
                self._last_error = exc.__class__.__name__
                if self._consecutive_failures >= max_failures:
                    self._state = "faulted"
                    return
                await asyncio.sleep(
                    min(
                        self._settings.stasis_reconnect_delay_seconds * self._consecutive_failures,
                        15.0,
                    )
                )

    async def originate(self, call: CarrierCallRequest, selected_endpoint: str) -> CarrierCallState:
        if not self.enabled:
            raise CarrierUnavailableError("Native Stasis bridge lifecycle is not enabled.")
        if not self._ready:
            raise CarrierUnavailableError("Native Stasis bridge event stream is not ready.")

        bridge_id = self._bridge_id(call.provider_call_id)
        agent_channel_id = self._agent_channel_id(call.provider_call_id)
        managed = ManagedStasisCall(
            provider_call_id=call.provider_call_id,
            business_call_id=call.business_call_id,
            tenant_id=call.tenant_id,
            destination=call.destination,
            caller_id=call.caller_id,
            selected_endpoint=selected_endpoint,
            bridge_id=bridge_id,
            customer_channel_id=call.provider_call_id,
            agent_channel_id=agent_channel_id,
        )

        bridge = await self._ari.request(
            "POST",
            f"/bridges/{bridge_id}",
            params={"type": "mixing,proxy_media", "name": f"Magnanimous call {call.provider_call_id}"},
        )
        if not bridge.is_success:
            raise CarrierRejectedError(bridge.text[:1000] or "Unable to create the native call bridge.")

        self._calls[call.provider_call_id] = managed
        self._by_channel[managed.customer_channel_id] = call.provider_call_id
        self._by_channel[managed.agent_channel_id] = call.provider_call_id

        variables = {
            "MAG_CALL_ID": call.business_call_id,
            "MAG_PROVIDER_CALL_ID": call.provider_call_id,
            "MAG_TENANT_ID": call.tenant_id,
            "MAG_FROM": call.caller_id,
            "MAG_TO": call.destination,
            "MAG_AGENT_ID": call.agent_id,
            "MAG_QUEUE_ID": call.queue_id,
            "MAG_ROUTE_ID": call.route_id,
            "MAG_INTERCONNECT_ID": call.interconnect_id,
            "MAG_CARRIER_ENDPOINT": selected_endpoint if call.carrier_endpoint else "",
            "MAG_STASIS_ROLE": "customer",
        }
        response = await self._ari.request(
            "POST",
            "/channels",
            params={
                "endpoint": f"Local/{call.destination}@{self._settings.carrier_dial_context}/n",
                "app": self._settings.stasis_app,
                "appArgs": f"{call.provider_call_id},customer",
                "callerId": call.caller_id,
                "timeout": self._settings.carrier_timeout_ms,
                "channelId": managed.customer_channel_id,
            },
            body={"variables": variables},
        )
        if not response.is_success:
            await self._destroy(managed, ended_channel="")
            raise CarrierRejectedError(response.text[:1000] or "Unable to originate the native customer leg.")
        return CarrierCallState(provider_call_id=call.provider_call_id, status="dialing")

    async def handle_event(self, event: dict[str, Any]) -> None:
        event_type = str(event.get("type") or "")
        channel = event.get("channel") if isinstance(event.get("channel"), dict) else {}
        channel_id = str(channel.get("id") or "")
        provider_call_id = self._by_channel.get(channel_id)
        if not provider_call_id:
            return
        call = self._calls.get(provider_call_id)
        if not call:
            return

        if event_type == "StasisStart":
            if channel_id == call.customer_channel_id:
                if not call.customer_joined:
                    await self._add_to_bridge(call, channel_id)
                    call.customer_joined = True
                if not call.agent_originated:
                    call.agent_originated = True
                    try:
                        await self._originate_agent(call)
                    except Exception:
                        await self._destroy(call, ended_channel=channel_id)
                        raise
            elif channel_id == call.agent_channel_id:
                if not call.agent_joined:
                    await self._add_to_bridge(call, channel_id)
                    call.agent_joined = True
            if call.customer_joined and call.agent_joined:
                call.status = "connected"
            return

        if event_type == "StasisEnd":
            await self._destroy(call, ended_channel=channel_id)

    async def _add_to_bridge(self, call: ManagedStasisCall, channel_id: str) -> None:
        response = await self._ari.request(
            "POST",
            f"/bridges/{call.bridge_id}/addChannel",
            params={"channel": channel_id},
        )
        if not response.is_success:
            raise CarrierRejectedError(response.text[:1000] or "Unable to add a channel to the native bridge.")

    async def _originate_agent(self, call: ManagedStasisCall) -> None:
        response = await self._ari.request(
            "POST",
            "/channels",
            params={
                "endpoint": self._settings.stasis_agent_endpoint,
                "app": self._settings.stasis_app,
                "appArgs": f"{call.provider_call_id},agent",
                "callerId": call.caller_id,
                "timeout": self._settings.carrier_timeout_ms,
                "channelId": call.agent_channel_id,
            },
            body={
                "variables": {
                    "MAG_CALL_ID": call.business_call_id,
                    "MAG_PROVIDER_CALL_ID": call.provider_call_id,
                    "MAG_TENANT_ID": call.tenant_id,
                    "MAG_STASIS_ROLE": "agent",
                }
            },
        )
        if not response.is_success:
            raise CarrierRejectedError(response.text[:1000] or "Unable to originate the native agent leg.")

    async def hangup(self, provider_call_id: str) -> None:
        call = self._calls.get(provider_call_id)
        if not call:
            return
        await self._destroy(call, ended_channel="")

    async def _destroy(self, call: ManagedStasisCall, ended_channel: str) -> None:
        if call.cleaning:
            return
        call.cleaning = True
        call.status = "ended"
        try:
            for channel_id in (call.customer_channel_id, call.agent_channel_id):
                if not channel_id or channel_id == ended_channel:
                    continue
                response = await self._ari.request("DELETE", f"/channels/{channel_id}")
                if response.status_code not in (204, 404):
                    raise CarrierRejectedError(response.text[:1000] or "Unable to end a native bridge channel.")
            bridge = await self._ari.request("DELETE", f"/bridges/{call.bridge_id}")
            if bridge.status_code not in (204, 404):
                raise CarrierRejectedError(bridge.text[:1000] or "Unable to destroy the native call bridge.")
        finally:
            self._calls.pop(call.provider_call_id, None)
            self._by_channel.pop(call.customer_channel_id, None)
            self._by_channel.pop(call.agent_channel_id, None)
