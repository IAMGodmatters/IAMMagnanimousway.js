from __future__ import annotations

import re

from .errors import TelecomValidationError

E164 = re.compile(r"^\+[1-9]\d{6,14}$")
CALL_ID = re.compile(r"^[0-9a-fA-F-]{36}$")


def normalize_number(value: str) -> str:
    number = re.sub(r"[\s().-]", "", value or "")
    if not E164.fullmatch(number):
        raise TelecomValidationError("Phone numbers must use E.164 format, for example +15551234567.")
    return number


def validate_call_id(value: str) -> str:
    if not CALL_ID.fullmatch(value or ""):
        raise TelecomValidationError("Invalid call id.")
    return value


def map_channel_state(state: str) -> str:
    normalized = (state or "").strip().lower()
    if normalized in {"ring", "ringing"}:
        return "ringing"
    if normalized == "up":
        return "connected"
    if normalized in {"down", "dialing", "dial"}:
        return "dialing"
    return normalized or "dialing"
