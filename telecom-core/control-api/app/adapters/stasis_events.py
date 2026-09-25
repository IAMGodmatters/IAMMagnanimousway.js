from __future__ import annotations

import asyncio
import json
from time import time
from urllib.parse import quote, urlsplit, urlunsplit

from websockets.asyncio.client import connect

from ..config import TelecomSettings


class AriStasisEventStream:
    """Keeps the private Magnanimous supervisor Stasis application registered."""

    def __init__(self, settings: TelecomSettings):
        self._settings = settings
        self.connected = False
        self.last_event_at = 0
        self.last_event_type = ""
        self.last_error = ""
        self.reconnects = 0

    @property
    def enabled(self) -> bool:
        return bool(
            self._settings.supervisor_control_enabled
            and self._settings.ari_user
            and self._settings.ari_password
            and self._settings.supervisor_stasis_app
        )

    @property
    def ready(self) -> bool:
        return self.enabled and self.connected

    def status(self) -> dict[str, object]:
        return {
            "enabled": self.enabled,
            "connected": self.connected,
            "application": self._settings.supervisor_stasis_app if self.enabled else "",
            "last_event_at": self.last_event_at or None,
            "last_event_type": self.last_event_type or None,
            "last_error": self.last_error or None,
            "reconnects": self.reconnects,
            "credentials_exposed": False,
        }

    def _event_uri(self) -> str:
        base = urlsplit(self._settings.ari_url)
        scheme = "wss" if base.scheme == "https" else "ws"
        path = (base.path.rstrip("/") or "/ari") + "/events"
        query = (
            f"app={quote(self._settings.supervisor_stasis_app, safe='')}"
            f"&api_key={quote(self._settings.ari_user + ':' + self._settings.ari_password, safe='')}"
        )
        return urlunsplit((scheme, base.netloc, path, query, ""))

    async def run(self) -> None:
        if not self.enabled:
            return
        backoff = 1.0
        while True:
            try:
                async with connect(
                    self._event_uri(),
                    proxy=None,
                    open_timeout=10,
                    close_timeout=5,
                    ping_interval=20,
                    ping_timeout=20,
                    max_size=1_048_576,
                ) as websocket:
                    self.connected = True
                    self.last_error = ""
                    backoff = 1.0
                    async for raw in websocket:
                        self.last_event_at = int(time())
                        try:
                            event = json.loads(raw)
                            self.last_event_type = str(event.get("type") or "")[:120]
                        except Exception:
                            self.last_event_type = "unparsed"
            except asyncio.CancelledError:
                self.connected = False
                raise
            except Exception as exc:
                self.connected = False
                self.last_error = exc.__class__.__name__
                self.reconnects += 1
                await asyncio.sleep(backoff)
                backoff = min(backoff * 2, 10.0)
