"""Replaceable notification boundary; platform push networks never become Magnanimous identity."""
from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class Notification:
    user_id: str
    title: str
    body: str
    conversation_id: str | None = None


class NotificationPort(Protocol):
    async def send(self, notification: Notification) -> None: ...
