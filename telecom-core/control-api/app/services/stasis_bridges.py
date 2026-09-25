from __future__ import annotations

import asyncio
from dataclasses import dataclass
import json
from typing import Any
from urllib.parse import urlencode, urlsplit, urlunsplit
import uuid

from websockets.asyncio.client import connect

from ..config import TelecomSettings
from ..errors import CarrierRejectedError, CarrierUnavailableError
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

    def status(self) -> dict[str, Any]:
        return {
            "configured": self.enabled,
            "state": self._state,
            "ready": self._ready,
            "app": self._settings.stasis_app if self.enabled else None,
            "active_bridges": len(self._calls),
            "consecutive_failures": self._consecutive_failures,
            "last_error": self._last_error or None,
            "supervisor_monitor_live": False,
            "supervisor_whisper_live": False,
            "supervisor_barge_live": False,
            "bridge_recording_live": False,
            "truth_boundary": (
                "Bridge lifecycle readiness does not activate supervisor audio or recording. "
                "Those controls require their own consent, authorization, and production verification."
            ),
        }

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
