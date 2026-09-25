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


class WebRtcSessionCreate(BaseModel):
    tenant_id: str = Field(default="", max_length=200)
    user_id: str = Field(default="", max_length=200)

class StasisRecordingStart(BaseModel):
    tenant_id: str = Field(min_length=1, max_length=200)
    consent_confirmed: bool = False
    jurisdiction: str = Field(default="", max_length=120)
    name: str | None = Field(default=None, min_length=1, max_length=160, pattern=r"^[A-Za-z0-9_.-]+$")
    format: Literal["wav", "ulaw", "alaw"] | None = None
    beep: bool = True
    max_duration_seconds: int | None = Field(default=None, ge=60, le=28800)


class StasisRecordingStop(BaseModel):
    tenant_id: str = Field(min_length=1, max_length=200)


class SupervisorSessionStart(BaseModel):
    mode: Literal["monitor", "whisper", "barge"]
    provider_call_id: str = Field(min_length=1, max_length=160)
    tenant_id: str = Field(min_length=1, max_length=200)
    target_role: Literal["agent", "customer"] = "agent"
    supervisor_session_id: str = Field(min_length=1, max_length=160, pattern=r"^web_\d+_[a-f0-9]{16}$")
    consent_confirmed: bool = False
    jurisdiction: str = Field(default="", max_length=120)

