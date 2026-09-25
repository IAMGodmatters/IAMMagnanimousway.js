from __future__ import annotations

import asyncio
import json
import time
from urllib.parse import urlencode, urlsplit, urlunsplit

from websockets.asyncio.client import connect

from ..config import TelecomSettings


class StasisEventLoop:
    """Keeps the configured ARI Stasis application registered without exposing ARI credentials."""

    def __init__(self, settings: TelecomSettings):
        self._settings = settings
        self.connected = False
        self.last_event_type = ""
        self.last_event_at = 0
        self.last_error = ""
        self.controlled_channels: set[str] = set()

    def _events_url(self) -> str:
        parsed = urlsplit(self._settings.ari_url)
        scheme = "wss" if parsed.scheme == "https" else "ws"
        path = parsed.path.rstrip("/") + "/events"
        query = urlencode({
            "app": self._settings.stasis_app,
            "api_key": f"{self._settings.ari_user}:{self._settings.ari_password}",
            "subscribeAll": "false",
        })
        return urlunsplit((scheme, parsed.netloc, path, query, ""))

    def status(self) -> dict[str, object]:
        return {
            "configured": self._settings.stasis_enabled,
            "application": self._settings.stasis_app,
            "connected": self.connected,
            "controlled_channel_count": len(self.controlled_channels),
            "last_event_type": self.last_event_type or None,
            "last_event_at": self.last_event_at or None,
            "last_error": self.last_error or None,
            "credentials_exposed": False,
        }

    async def run(self) -> None:
        if not self._settings.stasis_enabled:
            return
        delay = 1
        while True:
            try:
                async with connect(
                    self._events_url(),
                    open_timeout=10,
                    close_timeout=5,
                    ping_interval=20,
                    ping_timeout=20,
                    max_size=2_000_000,
                ) as socket:
                    self.connected = True
                    self.last_error = ""
                    delay = 1
                    async for raw in socket:
                        try:
                            event = json.loads(raw)
                        except (TypeError, json.JSONDecodeError):
                            continue
                        event_type = str(event.get("type") or "")
                        self.last_event_type = event_type
                        self.last_event_at = int(time.time())
                        channel = event.get("channel") if isinstance(event.get("channel"), dict) else {}
                        channel_id = str(channel.get("id") or "")
                        if event_type == "StasisStart" and channel_id:
                            self.controlled_channels.add(channel_id)
                        elif event_type == "StasisEnd" and channel_id:
                            self.controlled_channels.discard(channel_id)
            except asyncio.CancelledError:
                self.connected = False
                raise
            except Exception as exc:
                self.connected = False
                self.last_error = exc.__class__.__name__
                await asyncio.sleep(delay)
                delay = min(delay * 2, self._settings.stasis_reconnect_max_seconds)
