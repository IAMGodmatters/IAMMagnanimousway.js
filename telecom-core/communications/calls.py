"""Calling orchestration stays independent of WebRTC and PSTN implementations."""
from .ports import CallSignalingPort, TelecomCallPort


class CommunicationsCallService:
    def __init__(self, signaling: CallSignalingPort, telecom: TelecomCallPort):
        self._signaling = signaling
        self._telecom = telecom

    async def start_internet_call(self, caller_id: str, callee_id: str, video: bool = False) -> dict:
        if caller_id == callee_id:
            raise ValueError("caller and callee must differ")
        return await self._signaling.create_session(caller_id, callee_id, "video" if video else "audio")

    async def start_pstn_call(self, caller_id: str, destination: str) -> dict:
        normalized = destination.strip()
        if not normalized.startswith("+") or not normalized[1:].isdigit():
            raise ValueError("PSTN destination must be E.164")
        # The injected Magnanimous Telecom adapter remains responsible for
        # authority, permissions, emergency-number, fraud and routing policy.
        return await self._telecom.place_authorized_pstn_call(caller_id, normalized)
