"""Magnanimous Communications domain models — provider-neutral and Magnanimous-owned."""
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from uuid import uuid4


class ConversationKind(str, Enum):
    DIRECT = "direct"
    GROUP = "group"
    COMMUNITY = "community"


class MessageKind(str, Enum):
    TEXT = "text"
    IMAGE = "image"
    VIDEO = "video"
    AUDIO = "audio"
    FILE = "file"
    VOICE_NOTE = "voice_note"


@dataclass(frozen=True)
class Conversation:
    member_ids: tuple[str, ...]
    kind: ConversationKind = ConversationKind.DIRECT
    title: str | None = None
    id: str = field(default_factory=lambda: str(uuid4()))
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


@dataclass(frozen=True)
class Message:
    conversation_id: str
    sender_id: str
    body: str = ""
    kind: MessageKind = MessageKind.TEXT
    attachment_url: str | None = None
    reply_to_id: str | None = None
    id: str = field(default_factory=lambda: str(uuid4()))
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


@dataclass(frozen=True)
class Receipt:
    message_id: str
    user_id: str
    state: str
    at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
