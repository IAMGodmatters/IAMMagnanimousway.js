import pytest

from communications.calls import CommunicationsCallService


class Signaling:
    async def create_session(self, caller_id, callee_id, media):
        return {"caller": caller_id, "callee": callee_id, "media": media}


class Telecom:
    async def place_authorized_pstn_call(self, caller_id, destination):
        return {"caller": caller_id, "destination": destination, "status": "requested"}


@pytest.mark.asyncio
async def test_video_call_uses_signaling_port():
    service = CommunicationsCallService(Signaling(), Telecom())
    result = await service.start_internet_call("alice", "bob", video=True)
    assert result["media"] == "video"


@pytest.mark.asyncio
async def test_pstn_requires_e164():
    service = CommunicationsCallService(Signaling(), Telecom())
    with pytest.raises(ValueError):
        await service.start_pstn_call("alice", "5551234")
    result = await service.start_pstn_call("alice", "+15551234567")
    assert result["status"] == "requested"
