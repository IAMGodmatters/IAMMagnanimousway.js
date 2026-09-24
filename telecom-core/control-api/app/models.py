from pydantic import BaseModel, Field


class OutboundCall(BaseModel):
    call_id: int | str
    tenant_id: str = Field(min_length=1, max_length=200)
    to: str
    from_: str | None = Field(default=None, alias="from")
    agent_id: str | None = None
    queue_id: str | None = None
    webhook_url: str | None = None


class HangupRequest(BaseModel):
    reason: str = Field(default="normal", max_length=120)


class SipAccountCreate(BaseModel):
    username: str = Field(min_length=2, max_length=64, pattern=r"^[A-Za-z0-9_.-]+$")
    password: str | None = Field(default=None, min_length=12, max_length=128)


class TransferRequest(BaseModel):
    endpoint: str = Field(min_length=3, max_length=200, pattern=r"^[A-Za-z0-9_@:+./-]+$")


class RecordingRequest(BaseModel):
    consent_confirmed: bool = False
    format: str = Field(default="wav", pattern=r"^(wav|ulaw|alaw|gsm)$")
    max_duration_seconds: int = Field(default=3600, ge=1, le=14400)
    beep: bool = True
