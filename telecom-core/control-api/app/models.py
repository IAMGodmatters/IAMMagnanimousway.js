from typing import Any, Literal

from pydantic import BaseModel, Field


class OutboundCall(BaseModel):
    call_id: int | str
    tenant_id: str = Field(min_length=1, max_length=200)
    to: str
    from_: str | None = Field(default=None, alias="from")
    agent_id: str | None = None
    queue_id: str | None = None
    webhook_url: str | None = None
    selected_route: dict[str, Any] | None = None


class HangupRequest(BaseModel):
    reason: str = Field(default="normal", max_length=120)


class SipAccountCreate(BaseModel):
    username: str = Field(min_length=2, max_length=64, pattern=r"^[A-Za-z0-9_.-]+$")
    password: str | None = Field(default=None, min_length=12, max_length=128)

class StasisBridgeCreate(BaseModel):
    call_id: str = Field(min_length=1, max_length=180)
    channel_ids: list[str] = Field(min_length=2, max_length=8)


class SupervisorSessionCreate(BaseModel):
    call_bridge_id: str = Field(min_length=1, max_length=180)
    target_channel_id: str = Field(min_length=1, max_length=180)
    supervisor_channel_id: str = Field(min_length=1, max_length=180)
    mode: Literal["monitor", "whisper", "barge"]
    requested_by: str = Field(min_length=1, max_length=200)


class BridgeRecordingStart(BaseModel):
    bridge_id: str = Field(min_length=1, max_length=180)
    requested_by: str = Field(min_length=1, max_length=200)
    consent_confirmed: bool = False
    consent_basis: str = Field(min_length=1, max_length=500)
    beep: bool = True
    max_duration_seconds: int = Field(default=3600, ge=1, le=14400)
