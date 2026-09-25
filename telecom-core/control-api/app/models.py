from typing import Any

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


class SupervisorSessionStart(BaseModel):
    target_channel_id: str = Field(min_length=1, max_length=160, pattern=r"^[A-Za-z0-9_.:-]+$")
    supervisor_endpoint: str = Field(min_length=2, max_length=80, pattern=r"^[A-Za-z0-9_.-]+$")
    mode: str = Field(default="monitor", pattern=r"^(monitor|whisper|barge)$")
    consent_confirmed: bool = False
    notice_confirmed: bool = False


class SupervisorRecordingStart(BaseModel):
    consent_confirmed: bool = False
    notice_confirmed: bool = False
    jurisdiction: str = Field(min_length=2, max_length=120)
    max_duration_seconds: int | None = Field(default=None, ge=60, le=28800)


class CallRecordingStart(BaseModel):
    target_channel_id: str = Field(min_length=1, max_length=160, pattern=r"^[A-Za-z0-9_.:-]+$")
    consent_confirmed: bool = False
    notice_confirmed: bool = False
    jurisdiction: str = Field(min_length=2, max_length=120)
    max_duration_seconds: int | None = Field(default=None, ge=60, le=28800)
