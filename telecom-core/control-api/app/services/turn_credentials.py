from __future__ import annotations

import base64
import hashlib
import hmac
from typing import Any

from ..errors import TelecomConfigurationError


def build_turn_ice_servers(
    *,
    urls: tuple[str, ...],
    auth_secret: str,
    force_relay: bool,
    session_id: str,
    expires_at: int,
) -> list[dict[str, Any]]:
    if not urls:
        if force_relay:
            raise TelecomConfigurationError(
                "MAGNANIMOUS_TURN_FORCE_RELAY requires MAGNANIMOUS_TURN_URLS."
            )
        return []

    if not auth_secret:
        raise TelecomConfigurationError(
            "MAGNANIMOUS_TURN_AUTH_SECRET is required when TURN URLs are configured."
        )

    for url in urls:
        if not (url.startswith("turn:") or url.startswith("turns:")):
            raise TelecomConfigurationError(
                "MAGNANIMOUS_TURN_URLS entries must use turn: or turns:."
            )

    username = f"{expires_at}:{session_id}"
    digest = hmac.new(
        auth_secret.encode("utf-8"),
        username.encode("utf-8"),
        hashlib.sha1,
    ).digest()
    credential = base64.b64encode(digest).decode("ascii")

    return [
        {
            "urls": list(urls),
            "username": username,
            "credential": credential,
            "credentialType": "password",
        }
    ]
