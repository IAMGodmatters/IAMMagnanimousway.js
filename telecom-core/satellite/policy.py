"""Magnanimous Telecom satellite backhaul policy.

Satellite providers are replaceable transport rails. They never become the public
Magnanimous identity and provider connectivity never implies telecom authority.
"""
from dataclasses import dataclass
from enum import Enum


class LinkState(str, Enum):
    UNKNOWN = "unknown"
    DOWN = "down"
    DEGRADED = "degraded"
    HEALTHY = "healthy"


@dataclass(frozen=True)
class SatelliteLink:
    adapter: str
    state: LinkState = LinkState.UNKNOWN
    latency_ms: float | None = None
    packet_loss_pct: float | None = None
    metered: bool = False


@dataclass(frozen=True)
class SatellitePolicy:
    enabled: bool = False
    automatic_failover: bool = True
    prefer_terrestrial_when_healthy: bool = True
    allow_voice: bool = True
    allow_video: bool = True
    allow_bulk_sync_on_metered: bool = False

    def route_class(self, terrestrial_healthy: bool, satellite: SatelliteLink) -> str:
        if not self.enabled or satellite.state is LinkState.DOWN:
            return "terrestrial"
        if terrestrial_healthy and self.prefer_terrestrial_when_healthy:
            return "terrestrial"
        if satellite.state in (LinkState.HEALTHY, LinkState.DEGRADED):
            return "satellite"
        return "terrestrial"

    def media_allowed(self, media: str, satellite: SatelliteLink) -> bool:
        if satellite.metered and media == "bulk-sync" and not self.allow_bulk_sync_on_metered:
            return False
        if media == "voice":
            return self.allow_voice
        if media == "video":
            return self.allow_video and satellite.state is not LinkState.DEGRADED
        return True
