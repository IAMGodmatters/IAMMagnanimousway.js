from __future__ import annotations

import hashlib
import secrets
from typing import Any

from ..config import TelecomSettings
from ..errors import SipAccountNotFoundError, TelecomConfigurationError
from ..models import SipAccountCreate
from ..ports import SipSubscriber, SipSubscriberStore


class SipAccountService:
    """Owns SIP account lifecycle while storage remains an injected adapter."""

    def __init__(self, store: SipSubscriberStore, settings: TelecomSettings):
        self._store = store
        self._settings = settings

    def _domain(self) -> str:
        domain = self._settings.sip_domain.strip().lower()
        if not domain:
            raise TelecomConfigurationError("MAGNANIMOUS_SIP_DOMAIN is not configured.")
        return domain

    @staticmethod
    def _public(record: SipSubscriber) -> dict[str, Any]:
        return {
            "username": record.username,
            "domain": record.domain,
            "sip_uri": f"sip:{record.username}@{record.domain}",
            "active": record.active,
            "created_at": record.created_at.isoformat() if record.created_at else None,
        }

    async def create(self, request: SipAccountCreate) -> dict[str, Any]:
        domain = self._domain()
        password = request.password or secrets.token_urlsafe(24)
        # SIP Digest HA1 = MD5(username:realm:password). The cleartext password is
        # returned once to the owner and is not persisted in the subscriber table.
        ha1 = hashlib.md5(
            f"{request.username}:{domain}:{password}".encode("utf-8"), usedforsecurity=False
        ).hexdigest()
        record = await self._store.create(request.username, domain, ha1)
        payload = self._public(record)
        payload.update(
            {
                "password": password,
                "password_returned_once": True,
                "server": domain,
                "port": 5060,
                "transports": ["udp", "tcp"],
            }
        )
        return payload

    async def list(self) -> dict[str, Any]:
        records = await self._store.list()
        return {
            "identity": "Magnanimous Telecom",
            "sip_domain": self._domain(),
            "accounts": [self._public(record) for record in records],
        }

    async def delete(self, username: str) -> dict[str, Any]:
        deleted = await self._store.delete(username)
        if not deleted:
            raise SipAccountNotFoundError(f"SIP account '{username}' was not found.")
        return {"ok": True, "username": username, "deleted": True}

    async def health(self) -> dict[str, Any]:
        database = await self._store.health()
        return {
            "service": "Magnanimous SIP Core",
            "identity": "Magnanimous Telecom",
            "domain": self._settings.sip_domain,
            "database": "ok" if database else "unavailable",
            "registrar": "configured" if self._settings.sip_domain else "setup-required",
            "pstn_interconnect": "replaceable-external-boundary",
        }
