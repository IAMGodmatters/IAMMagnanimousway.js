from __future__ import annotations

from urllib.parse import urlparse

import httpx

from ..config import TelecomSettings


class CallbackUrlPolicy:
    """Validates callback destinations without mixing URL policy into call control."""

    def __init__(self, settings: TelecomSettings):
        self._settings = settings

    def resolve(self, requested_url: str | None) -> str | None:
        candidate = self._settings.webhook_url or (requested_url or "").strip()
        if not candidate:
            return None
        parsed = urlparse(candidate)
        if (
            parsed.scheme != "https"
            or not parsed.hostname
            or parsed.hostname.lower() not in self._settings.webhook_hosts
        ):
            return None
        return candidate


class WebhookStatusPublisher:
    """Publishes normalized carrier status events back to the Magnanimous Worker."""

    def __init__(self, settings: TelecomSettings):
        self._settings = settings

    async def publish(self, url: str, provider_call_id: str, status: str, detail: str = "") -> None:
        if not self._settings.webhook_secret:
            return
        payload = {
            "provider_call_id": provider_call_id,
            "call_id": provider_call_id,
            "status": status,
            "event_type": "carrier-status",
            "detail": detail,
            "provider": "Magnanimous Telecom",
        }
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                await client.post(
                    url,
                    headers={
                        "x-iam-webhook-secret": self._settings.webhook_secret,
                        "content-type": "application/json",
                    },
                    json=payload,
                )
        except httpx.HTTPError:
            # Carrier control must not fail only because a status callback could not be delivered.
            return
