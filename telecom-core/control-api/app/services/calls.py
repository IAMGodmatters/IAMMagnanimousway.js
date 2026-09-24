from __future__ import annotations

import uuid
from typing import Any, Callable

from ..config import TelecomSettings
from ..domain import normalize_number, validate_call_id
from ..models import HangupRequest, OutboundCall
from ..ports import CallbackPolicy, CarrierBridge, CarrierCallRequest
from .monitoring import CarrierCallMonitor


class CallService:
    """Coordinates call use-cases while delegating transport, carrier and monitoring concerns."""

    def __init__(
        self,
        bridge: CarrierBridge,
        monitor: CarrierCallMonitor,
        callback_policy: CallbackPolicy,
        settings: TelecomSettings,
        id_factory: Callable[[], uuid.UUID] = uuid.uuid4,
    ):
        self._bridge = bridge
        self._monitor = monitor
        self._callback_policy = callback_policy
        self._settings = settings
        self._id_factory = id_factory

    async def place(self, request: OutboundCall) -> dict[str, Any]:
        destination = normalize_number(request.to)
        caller_id = normalize_number(request.from_ or self._settings.caller_id)
        provider_call_id = str(self._id_factory())
        state = await self._bridge.originate(
            CarrierCallRequest(
                provider_call_id=provider_call_id,
                business_call_id=str(request.call_id),
                tenant_id=request.tenant_id,
                destination=destination,
                caller_id=caller_id,
                agent_id=request.agent_id or "",
                queue_id=request.queue_id or "",
            )
        )
        self._monitor.start(provider_call_id, self._callback_policy.resolve(request.webhook_url))
        return {
            "provider_call_id": provider_call_id,
            "call_id": provider_call_id,
            "status": state.status,
            "provider": "Magnanimous Telecom",
            "to": destination,
            "from": caller_id,
        }

    async def hangup(self, provider_call_id: str, request: HangupRequest | None) -> dict[str, Any]:
        call_id = validate_call_id(provider_call_id)
        await self._bridge.hangup(call_id)
        return {
            "ok": True,
            "provider_call_id": call_id,
            "status": "ended",
            "reason": request.reason if request else "normal",
        }

    async def get(self, provider_call_id: str) -> dict[str, Any]:
        call_id = validate_call_id(provider_call_id)
        state = await self._bridge.get_call(call_id)
        payload: dict[str, Any] = {
            "provider_call_id": state.provider_call_id,
            "status": state.status,
        }
        if state.channel is not None:
            payload["channel"] = state.channel
            payload["caller"] = state.caller or {}
            payload["connected"] = state.connected or {}
        return payload


    async def hold(self, provider_call_id: str) -> dict[str, Any]:
        call_id = validate_call_id(provider_call_id)
        await self._bridge.hold(call_id)
        return {"ok": True, "provider_call_id": call_id, "status": "held"}

    async def unhold(self, provider_call_id: str) -> dict[str, Any]:
        call_id = validate_call_id(provider_call_id)
        await self._bridge.unhold(call_id)
        return {"ok": True, "provider_call_id": call_id, "status": "active"}

    async def transfer(self, provider_call_id: str, endpoint: str) -> dict[str, Any]:
        call_id = validate_call_id(provider_call_id)
        await self._bridge.transfer(call_id, endpoint)
        return {"ok": True, "provider_call_id": call_id, "status": "transferred", "endpoint": endpoint}

    async def start_recording(
        self,
        provider_call_id: str,
        *,
        consent_confirmed: bool,
        format: str,
        max_duration_seconds: int,
        beep: bool,
    ) -> dict[str, Any]:
        call_id = validate_call_id(provider_call_id)
        if not consent_confirmed:
            from ..errors import TelecomValidationError
            raise TelecomValidationError("Recording consent must be confirmed before recording starts.")
        recording_name = f"magnanimous-{call_id}"
        await self._bridge.start_recording(
            call_id,
            recording_name,
            format=format,
            max_duration_seconds=max_duration_seconds,
            beep=beep,
        )
        return {"ok": True, "provider_call_id": call_id, "recording_name": recording_name, "status": "recording"}

    async def stop_recording(self, provider_call_id: str) -> dict[str, Any]:
        call_id = validate_call_id(provider_call_id)
        recording_name = f"magnanimous-{call_id}"
        await self._bridge.stop_recording(recording_name)
        return {"ok": True, "provider_call_id": call_id, "recording_name": recording_name, "status": "stopped"}
