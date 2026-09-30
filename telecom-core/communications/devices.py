"""Device-session primitives for revocable multi-device synchronization."""
from dataclasses import dataclass, field
from datetime import datetime, timezone
from uuid import uuid4


@dataclass(frozen=True)
class DeviceSession:
    user_id: str
    platform: str
    push_adapter: str | None = None
    id: str = field(default_factory=lambda: str(uuid4()))
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


@dataclass(frozen=True)
class SyncCursor:
    device_id: str
    sequence: int = 0
