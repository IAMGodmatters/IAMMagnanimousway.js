from __future__ import annotations

import asyncio
import hashlib
import secrets
import time
from typing import Any, TYPE_CHECKING
from urllib.parse import quote

from ..config import TelecomSettings
from ..errors import CarrierRejectedError, TelecomConfigurationError
from .turn_credentials import build_turn_ice_servers

if TYPE_CHECKING:
    from ..adapters.asterisk import AsteriskAriClient


class WebRtcSessionService:
    """Issues short-lived per-browser PJSIP identities through Asterisk ARI."""

    PREFIX = "web_"

    def __init__(self, ari: AsteriskAriClient, settings: TelecomSettings):
        self._ari = ari
        self._settings = settings

    def _require_ready(self) -> None:
        if not self._settings.webrtc_enabled:
            raise TelecomConfigurationError("Native WebRTC is not enabled on the Telecom Core.")
        if not self._settings.webrtc_dynamic_sessions_enabled:
            raise TelecomConfigurationError("Dynamic native WebRTC sessions are not enabled.")
        if not self._settings.webrtc_public_url:
            raise TelecomConfigurationError("ASTERISK_WEBRTC_PUBLIC_URL is required for browser sessions.")
        if not self._settings.sip_domain:
            raise TelecomConfigurationError("MAGNANIMOUS_SIP_DOMAIN is required for browser sessions.")

    def _turn_ice_servers(self, session_id: str, expires_at: int) -> list[dict[str, Any]]:
        return build_turn_ice_servers(
            urls=self._settings.webrtc_turn_urls,
            auth_secret=self._settings.webrtc_turn_auth_secret,
            force_relay=self._settings.webrtc_turn_force_relay,
            session_id=session_id,
            expires_at=expires_at,
        )

    @staticmethod
    def _fields(values: dict[str, str]) -> dict[str, Any]:
        return {"fields": [{"attribute": key, "value": value} for key, value in values.items()]}

    async def _put(self, object_type: str, object_id: str, values: dict[str, str]) -> None:
        response = await self._ari.request(
            "PUT",
            f"/asterisk/config/dynamic/res_pjsip/{quote(object_type, safe='')}/{quote(object_id, safe='')}",
            body=self._fields(values),
        )
        if not response.is_success:
            raise CarrierRejectedError(
                response.text[:1000] or f"Asterisk rejected dynamic WebRTC {object_type} creation."
            )

    async def _delete(self, object_type: str, object_id: str) -> None:
        response = await self._ari.request(
            "DELETE",
            f"/asterisk/config/dynamic/res_pjsip/{quote(object_type, safe='')}/{quote(object_id, safe='')}",
        )
        if response.status_code not in (200, 204, 404):
            raise CarrierRejectedError(
                response.text[:1000] or f"Asterisk rejected dynamic WebRTC {object_type} removal."
            )

    async def delete(self, session_id: str) -> dict[str, Any]:
        if not session_id.startswith(self.PREFIX):
            raise CarrierRejectedError("Invalid native WebRTC session identifier.")
        for object_type in ("endpoint", "aor", "auth"):
            await self._delete(object_type, session_id)
        return {"ok": True, "session_id": session_id, "deleted": True}

    @classmethod
    def _expires_from_id(cls, resource: str) -> int | None:
        if not resource.startswith(cls.PREFIX):
            return None
        parts = resource.split("_", 2)
        if len(parts) != 3:
            return None
        try:
            return int(parts[1])
        except ValueError:
            return None

    async def reap_expired(self) -> int:
        response = await self._ari.request("GET", "/endpoints/PJSIP")
        if not response.is_success:
            return 0
        cutoff = int(time.time())
        deleted = 0
        for item in response.json() if isinstance(response.json(), list) else []:
            resource = str(item.get("resource") or "")
            expires = self._expires_from_id(resource)
            if expires is not None and expires <= cutoff:
                try:
                    await self.delete(resource)
                    deleted += 1
                except Exception:
                    continue
        return deleted

    async def reap_loop(self) -> None:
        while True:
            try:
                if self._settings.webrtc_dynamic_sessions_enabled:
                    await self.reap_expired()
            except Exception:
                pass
            await asyncio.sleep(30)

    async def create(self) -> dict[str, Any]:
        self._require_ready()
        await self.reap_expired()

        now = int(time.time())
        expires_at = now + self._settings.webrtc_session_ttl_seconds
        session_id = f"{self.PREFIX}{expires_at}_{secrets.token_hex(8)}"
        password = secrets.token_urlsafe(24)
        domain = self._settings.sip_domain
        digest = hashlib.md5(
            f"{session_id}:{domain}:{password}".encode("utf-8"),
            usedforsecurity=False,
        ).hexdigest()

        created: list[str] = []
        try:
            await self._put(
                "auth",
                session_id,
                {
                    "auth_type": "userpass",
                    "username": session_id,
                    "realm": domain,
                    "md5_cred": digest,
                },
            )
            created.append("auth")
            await self._put(
                "aor",
                session_id,
                {
                    "support_path": "yes",
                    "remove_existing": "yes",
                    "max_contacts": "1",
                    "qualify_frequency": "30",
                    "maximum_expiration": str(self._settings.webrtc_session_ttl_seconds),
                },
            )
            created.append("aor")
            await self._put(
                "endpoint",
                session_id,
                {
                    "from_user": session_id,
                    "allow": "!all,opus,ulaw,alaw",
                    "ice_support": "yes",
                    "force_rport": "yes",
                    "rewrite_contact": "yes",
                    "rtp_symmetric": "yes",
                    "direct_media": "no",
                    "context": "magnanimous-webrtc-session",
                    "auth": session_id,
                    "aors": session_id,
                    "transport": "transport-wss",
                    "webrtc": "yes",
                    "use_avpf": "yes",
                    "media_encryption": "dtls",
                    "dtls_verify": "fingerprint",
                    "dtls_setup": "actpass",
                    "dtls_cert_file": self._settings.webrtc_runtime_tls_cert_file,
                    "dtls_private_key": self._settings.webrtc_runtime_tls_key_file,
                    "media_use_received_transport": "yes",
                    "rtcp_mux": "yes",
                },
            )
            created.append("endpoint")
        except Exception:
            for object_type in reversed(created):
                try:
                    await self._delete(object_type, session_id)
                except Exception:
                    pass
            raise

        ice_servers = self._turn_ice_servers(session_id, expires_at)
        return {
            "identity": "Magnanimous Telecom",
            "provider": "Magnanimous Carrier",
            "session_id": session_id,
            "username": session_id,
            "password": password,
            "password_returned_once": True,
            "domain": domain,
            "wss_url": self._settings.webrtc_public_url,
            "ice_servers": ice_servers,
            "ice_transport_policy": "relay" if self._settings.webrtc_turn_force_relay else "all",
            "turn_relay_configured": bool(ice_servers),
            "relay_local_media": self._settings.webrtc_relay_local_media,
            "expires_at": expires_at,
            "expires_in": self._settings.webrtc_session_ttl_seconds,
            "allowed_call_scope": ["internal-magnanimous", "diagnostic-echo"],
            "pstn_direct": False,
            "truth_boundary": "This browser credential cannot directly dial PSTN; ordinary-number calling remains behind Magnanimous billing/compliance controls.",
        }
