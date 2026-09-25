"""WebRTC signaling contracts use open browser/mobile interoperability primitives."""
from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class SessionDescription:
    call_id: str
    sender_id: str
    sdp_type: str
    sdp: str


@dataclass(frozen=True)
class IceCandidate:
    call_id: str
    sender_id: str
    candidate: str
    sdp_mid: str | None = None
    sdp_mline_index: int | None = None


class WebRtcSignalingPort(Protocol):
    async def publish_description(self, description: SessionDescription) -> None: ...
    async def publish_candidate(self, candidate: IceCandidate) -> None: ...
