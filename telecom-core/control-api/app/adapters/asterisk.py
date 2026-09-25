from __future__ import annotations

from typing import Any

import httpx

from ..config import TelecomSettings
from ..domain import map_channel_state
from ..errors import CarrierRejectedError, CarrierUnavailableError, TelecomConfigurationError, TelecomValidationError
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

    def routes(self) -> list[dict[str, Any]]:
        secondary_configured = bool(self._settings.carrier_secondary_endpoint)
        return [
            {
                "id": "auto",
                "mode": "compatibility-failover",
                "dial_context": self._settings.carrier_dial_context,
                "configured": bool(self._settings.carrier_endpoint),
                "primary_endpoint": self._settings.carrier_endpoint,
                "secondary_configured": secondary_configured,
            },
            {
                "id": "primary",
                "mode": "explicit",
                "dial_context": self._settings.carrier_primary_dial_context,
                "configured": bool(self._settings.carrier_endpoint),
                "endpoint": self._settings.carrier_endpoint,
            },
            {
                "id": "secondary",
                "mode": "explicit",
                "dial_context": self._settings.carrier_secondary_dial_context,
                "configured": secondary_configured,
                "endpoint": self._settings.carrier_secondary_endpoint,
            },
        ]

    def _route(self, route_id: str | None) -> dict[str, Any]:
        normalized = str(route_id or "auto").strip().lower()
        route = next((item for item in self.routes() if item["id"] == normalized), None)
        if route is None:
            raise TelecomValidationError("Unsupported carrier route. Use auto, primary, or secondary.")
        if not route.get("configured"):
            raise TelecomConfigurationError(f"Carrier route '{normalized}' is not configured.")
        return route

    def describe(self) -> dict[str, Any]:
        return {
            "identity": "Magnanimous Telecom",
            "bridge_type": "sip-interconnect",
            "control_owner": "Magnanimous",
            "carrier_endpoint": self._settings.carrier_endpoint,
            "dial_context": self._settings.carrier_dial_context,
            "routes": self.routes(),
            "route_planner_live_execution": False,
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
        route = self._route(call.route_id)
        params = {
            "endpoint": f"Local/{call.destination}@{route['dial_context']}/n",
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
            "MAG_ROUTE_ID": route["id"],
            "MAG_ROUTE_CONTEXT": route["dial_context"],
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

    async def _endpoint_health(self, endpoint_name: str) -> str:
        if not endpoint_name:
            return "not-configured"
        response = await self._ari.request("GET", f"/endpoints/PJSIP/{endpoint_name}")
        if response.status_code == 404:
            return "not-configured"
        if not response.is_success:
            return "unavailable"
        data = response.json()
        return str(data.get("state") or "available").lower()

    async def health(self, route_id: str | None = None) -> dict[str, Any]:
        requested = str(route_id or "").strip().lower()
        if requested and requested not in {"auto", "primary", "secondary"}:
            raise TelecomValidationError("Unsupported carrier route. Use auto, primary, or secondary.")
        asterisk = await self._ari.request("GET", "/asterisk/info")
        asterisk_ready = asterisk.is_success

        primary_state = "unavailable"
        secondary_state = "not-configured"
        if asterisk_ready:
            primary_state = await self._endpoint_health(self._settings.carrier_endpoint)
            secondary_state = await self._endpoint_health(self._settings.carrier_secondary_endpoint)

        routes = []
        for route in self.routes():
            state = primary_state
            if route["id"] == "secondary":
                state = secondary_state
            elif route["id"] == "auto":
                state = primary_state if primary_state not in {"not-configured", "unavailable", "offline"} else secondary_state
            routes.append({**route, "health": state, "ready": asterisk_ready and state not in {"not-configured", "unavailable", "offline"}})

        selected = next((item for item in routes if item["id"] == requested), None) if requested else None
        return {
            "ok": asterisk_ready and (selected["ready"] if selected else any(item["ready"] for item in routes)),
            "asterisk": "ready" if asterisk_ready else "unavailable",
            "carrier_bridge": primary_state,
            "carrier_endpoint": self._settings.carrier_endpoint,
            "routes": routes,
            "selected_route": selected,
            "authenticated_health": True,
            "route_planner_live_execution": False,
        }
