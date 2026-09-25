from __future__ import annotations

from typing import Any
import re

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

    _ENDPOINT = re.compile(r"^[A-Za-z0-9_.-]{1,80}$")

    def __init__(self, ari: AsteriskAriClient, settings: TelecomSettings, stasis: Any | None = None):
        self._ari = ari
        self._settings = settings
        self._stasis = stasis

    def _selected_endpoint(self, call: CarrierCallRequest) -> str:
        endpoint = str(call.carrier_endpoint or "").strip()
        if not endpoint:
            return self._settings.carrier_endpoint
        allowed = set(self._settings.carrier_allowed_endpoints or (self._settings.carrier_endpoint,))
        if not self._ENDPOINT.fullmatch(endpoint) or endpoint not in allowed:
            raise CarrierRejectedError("Selected carrier route is not authorized by this Telecom Core.")
        return endpoint

    async def _endpoint_health(self, endpoint: str) -> dict[str, Any]:
        response = await self._ari.request("GET", f"/endpoints/PJSIP/{endpoint}")
        if response.status_code == 404:
            return {"ok": False, "state": "not-configured", "endpoint": endpoint}
        if not response.is_success:
            return {"ok": False, "state": "unavailable", "endpoint": endpoint}
        data = response.json()
        state = str(data.get("state") or "available").strip().lower()
        unhealthy = state in {"down", "offline", "unavailable", "failed", "unknown"}
        return {"ok": not unhealthy, "state": state, "endpoint": endpoint}

    def describe(self) -> dict[str, Any]:
        return {
            "identity": "Magnanimous Telecom",
            "bridge_type": "sip-interconnect",
            "control_owner": "Magnanimous",
            "carrier_endpoint": self._settings.carrier_endpoint,
            "dial_context": self._settings.carrier_dial_context,
            "upstream_provider_exposed": False,
            "capabilities": {
                "outbound_voice": True,
                "inbound_voice": True,
                "sms": False,
                "sim_esim_provisioning": False,
                "number_provisioning": False,
                "managed_stasis_bridge": bool(self._stasis is not None and self._stasis.enabled),
                "supervisor_audio": bool(self._stasis is not None and self._stasis.status().get("supervisor_audio_configured")),
                "bridge_recording": bool(self._stasis is not None and self._stasis.status().get("bridge_recording_configured")),
            },
        }

    async def originate(self, call: CarrierCallRequest) -> CarrierCallState:
        selected_endpoint = self._selected_endpoint(call)
        if call.carrier_endpoint:
            route_health = await self._endpoint_health(selected_endpoint)
            if not route_health["ok"]:
                raise CarrierUnavailableError(
                    f"Selected carrier route {selected_endpoint} is not healthy ({route_health['state']})."
                )
        if self._stasis is not None and self._stasis.enabled:
            return await self._stasis.originate(call, selected_endpoint)

        params = {
            "endpoint": f"Local/{call.destination}@{self._settings.carrier_dial_context}/n",
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
            "MAG_ROUTE_ID": call.route_id,
            "MAG_INTERCONNECT_ID": call.interconnect_id,
            "MAG_CARRIER_ENDPOINT": selected_endpoint if call.carrier_endpoint else "",
        }
        response = await self._ari.request("POST", "/channels", params=params, body={"variables": variables})
        if not response.is_success:
            detail = response.text[:1000] or "Carrier bridge rejected the call."
            raise CarrierRejectedError(detail)
        return CarrierCallState(provider_call_id=call.provider_call_id, status="dialing")

    async def hangup(self, provider_call_id: str) -> None:
        if self._stasis is not None and self._stasis.owns(provider_call_id):
            await self._stasis.hangup(provider_call_id)
            return
        response = await self._ari.request("DELETE", f"/channels/{provider_call_id}")
        if response.status_code not in (204, 404):
            raise CarrierRejectedError(response.text[:1000] or "Carrier bridge rejected the hangup.")

    async def get_call(self, provider_call_id: str) -> CarrierCallState:
        if self._stasis is not None:
            managed = self._stasis.call_state(provider_call_id)
            if managed is not None:
                return managed
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

    async def health(self) -> dict[str, Any]:
        asterisk = await self._ari.request("GET", "/asterisk/info")
        asterisk_ready = asterisk.is_success
        route_health: list[dict[str, Any]] = []
        if asterisk_ready:
            for endpoint in self._settings.carrier_allowed_endpoints or (self._settings.carrier_endpoint,):
                route_health.append(await self._endpoint_health(endpoint))
        primary = next((item for item in route_health if item["endpoint"] == self._settings.carrier_endpoint), None)
        trunk_state = primary["state"] if primary else ("unknown" if asterisk_ready else "unavailable")
        return {
            "ok": asterisk_ready,
            "asterisk": "ready" if asterisk_ready else "unavailable",
            "carrier_bridge": trunk_state,
            "carrier_endpoint": self._settings.carrier_endpoint,
            "authenticated_route_health": route_health,
            "selected_route_health_supported": True,
            "stasis_bridge": self._stasis.status() if self._stasis is not None else {
                "configured": False,
                "ready": False,
            },
        }
