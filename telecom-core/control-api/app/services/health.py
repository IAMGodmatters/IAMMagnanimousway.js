from __future__ import annotations

from typing import Any

from ..config import TelecomSettings
from ..errors import TelecomError
from ..ports import CarrierBridge
from .monitoring import CarrierCallMonitor


class HealthService:
    def __init__(self, bridge: CarrierBridge, monitor: CarrierCallMonitor, settings: TelecomSettings):
        self._bridge = bridge
        self._monitor = monitor
        self._settings = settings

    async def public_health(self) -> dict[str, Any]:
        try:
            bridge = await self._bridge.health()
        except TelecomError:
            bridge = {"ok": False, "asterisk": "unavailable", "carrier_bridge": "unavailable"}
        return {
            "ok": bool(bridge.get("ok")),
            "service": "Magnanimous Telecom Core",
            "asterisk": bridge.get("asterisk", "unavailable"),
            "carrier_bridge": bridge.get("carrier_bridge", "unavailable"),
            "public_number": self._settings.caller_id or None,
            "identity": "Magnanimous",
            "active_monitors": self._monitor.active_count,
        }

    async def carrier_health(self) -> dict[str, Any]:
        try:
            health = await self._bridge.health()
        except TelecomError as exc:
            health = {"ok": False, "carrier_bridge": "unavailable", "detail": exc.detail}
        return {**self._bridge.describe(), "health": health}
