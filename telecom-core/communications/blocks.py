"""Safety-domain primitives for user blocking and abuse reports."""
from dataclasses import dataclass, field
from datetime import datetime, timezone
from uuid import uuid4


@dataclass(frozen=True)
class Block:
    blocker_id: str
    blocked_id: str
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


@dataclass(frozen=True)
class AbuseReport:
    reporter_id: str
    subject_user_id: str
    reason: str
    message_id: str | None = None
    id: str = field(default_factory=lambda: str(uuid4()))
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
