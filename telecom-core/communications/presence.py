"""Ephemeral presence events are intentionally not coupled to durable message storage."""
from dataclasses import dataclass


@dataclass(frozen=True)
class Presence:
    user_id: str
    state: str  # online, away, offline


@dataclass(frozen=True)
class TypingState:
    conversation_id: str
    user_id: str
    typing: bool
