from __future__ import annotations

from typing import Any

import httpx

from ..config import TelecomSettings
from ..domain import map_channel_state
from ..errors import CarrierRejectedError, CarrierUnavailableError, TelecomConfigurationError
from ..ports import CarrierCallRequest, CarrierCallState


class AsteriskAriClient:
    """Small transport adapter responsible only for Asterisk ARI HTTP I/O."""

    def __init__(self, settings: TelecomSettings):
        self._settings = settings

    async def request(
        self,
        method: str,
        path: str,
        *,
        params: dict[str, Any] | None = None,
        body: Any = None,
    ) -> httpx.Response:
        if not self._settings.ari_user or not self._settings.ari_password:
            raise TelecomConfigurationError("Asterisk ARI credentials are not configured.")
        try:
            async with httpx.AsyncClient(
                timeout=15.0,
                auth=(self._settings.ari_user, self._settings.ari_password),
            ) as client:
                return await client.request(
                    method,
                    f"{self._settings.ari_url}{path}",
                    params=params,
                    json=body,
                )
        except httpx.HTTPError as exc:
            raise CarrierUnavailableError(f"Asterisk is unavailable: {exc.__class__.__name__}") from exc


class AsteriskSipCarrierBridge:
    """Carrier-neutral bridge: Magnanimous controls calls; Asterisk reaches the configured SIP interconnect."""

    def __init__(self, ari: AsteriskAriClient, settings: TelecomSettings):
        self._ari = ari
        self._settings = settings

    def describe(self) -> dict[str, Any]:
        return {
            "identity": "Magnanimous Telecom",
            "bridge_type": "sip-interconnect",
            "control_owner": "Magnanimous",
            "carrier_endpoint": self._settings.carrier_endpoint,
            "secondary_carrier_endpoint": self._settings.carrier_secondary_endpoint or None,
            "dial_context": self._settings.carrier_dial_context,
            "selected_route_contexts": {
                "primary": self._settings.carrier_primary_dial_context,
                "secondary": self._settings.carrier_secondary_dial_context,
            },
            "upstream_provider_exposed": False,
            "capabilities": {
                "outbound_voice": True,
                "inbound_voice": True,
                "sms": False,
                "sim_esim_provisioning": False,
                "number_provisioning": False,
            },
        }

    async def originate(self, call: CarrierCallRequest) -> CarrierCallState:
        route_key = str(call.route_key or "").lower()
        if route_key == "primary":
            dial_context = self._settings.carrier_primary_dial_context
        elif route_key == "secondary":
            if not self._settings.carrier_secondary_endpoint:
                raise CarrierRejectedError("The selected secondary carrier route is not configured.")
            dial_context = self._settings.carrier_secondary_dial_context
        else:
            dial_context = self._settings.carrier_dial_context
        params = {
            "endpoint": f"Local/{call.destination}@{dial_context}/n",
            "context": "magnanimous-ai",
            "extension": "s",
            "priority": 1,
            "callerId": call.caller_id,
            "timeout": self._settings.carrier_timeout_ms,
            "channelId": call.provider_call_id,
        }
        variables = {
            "MAG_CALL_ID": call.business_call_id,
            "MAG_PROVIDER_CALL_ID": call.provider_call_id,
            "MAG_TENANT_ID": call.tenant_id,
            "MAG_FROM": call.caller_id,
            "MAG_TO": call.destination,
            "MAG_AGENT_ID": call.agent_id,
            "MAG_QUEUE_ID": call.queue_id,
            "MAG_ROUTE_KEY": route_key,
            "MAG_ROUTE_ID": str(call.route_id or ""),
            "MAG_INTERCONNECT_ID": str(call.interconnect_id or ""),
        }
        response = await self._ari.request("POST", "/channels", params=params, body={"variables": variables})
        if not response.is_success:
            detail = response.text[:1000] or "Carrier bridge rejected the call."
            raise CarrierRejectedError(detail)
        return CarrierCallState(provider_call_id=call.provider_call_id, status="dialing")

    async def hangup(self, provider_call_id: str) -> None:
        response = await self._ari.request("DELETE", f"/channels/{provider_call_id}")
        if response.status_code not in (204, 404):
            raise CarrierRejectedError(response.text[:1000] or "Carrier bridge rejected the hangup.")

    async def get_call(self, provider_call_id: str) -> CarrierCallState:
        response = await self._ari.request("GET", f"/channels/{provider_call_id}")
        if response.status_code == 404:
            return CarrierCallState(provider_call_id=provider_call_id, status="ended")
        if not response.is_success:
            raise CarrierRejectedError(response.text[:1000] or "Unable to read carrier call state.")
        channel = response.json()
        return CarrierCallState(
            provider_call_id=provider_call_id,
            status=map_channel_state(str(channel.get("state", ""))),
            channel=channel.get("name"),
            caller=channel.get("caller", {}),
            connected=channel.get("connected", {}),
        )

    async def _endpoint_health(self, endpoint_name: str) -> dict[str, Any]:
        if not endpoint_name:
            return {"configured": False, "ready": False, "state": "not-configured", "endpoint": ""}
        response = await self._ari.request("GET", f"/endpoints/PJSIP/{endpoint_name}")
        if response.status_code == 404:
            return {"configured": False, "ready": False, "state": "not-configured", "endpoint": endpoint_name}
        if not response.is_success:
            return {"configured": True, "ready": False, "state": "unavailable", "endpoint": endpoint_name}
        data = response.json()
        state = str(data.get("state") or "available").lower()
        ready = state not in {"offline", "unavailable", "failed", "not-configured"}
        return {"configured": True, "ready": ready, "state": state, "endpoint": endpoint_name}

    async def health(self) -> dict[str, Any]:
        asterisk = await self._ari.request("GET", "/asterisk/info")
        asterisk_ready = asterisk.is_success
        primary = {"configured": False, "ready": False, "state": "asterisk-unavailable", "endpoint": self._settings.carrier_endpoint}
        secondary = {"configured": False, "ready": False, "state": "asterisk-unavailable", "endpoint": self._settings.carrier_secondary_endpoint}
        if asterisk_ready:
            primary = await self._endpoint_health(self._settings.carrier_endpoint)
            secondary = await self._endpoint_health(self._settings.carrier_secondary_endpoint)
        return {
            "ok": asterisk_ready and bool(primary.get("ready") or secondary.get("ready")),
            "asterisk": "ready" if asterisk_ready else "unavailable",
            "carrier_bridge": primary.get("state", "unknown"),
            "carrier_endpoint": self._settings.carrier_endpoint,
            "routes": {"primary": primary, "secondary": secondary},
            "selected_route_health_authenticated": True,
        }
