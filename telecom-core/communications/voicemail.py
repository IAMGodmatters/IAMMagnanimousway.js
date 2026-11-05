"""Voicemail integration boundary for Magnanimous-owned calling services."""
from dataclasses import dataclass
from datetime import datetime
from typing import Protocol


@dataclass(frozen=True)
class Voicemail:
    owner_id: str
    caller_id: str
    recording_key: str
    created_at: datetime
    duration_seconds: int


class VoicemailPort(Protocol):
    async def list_for_user(self, user_id: str, limit: int = 50) -> list[Voicemail]: ...
