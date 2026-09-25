import sys
from pathlib import Path
import unittest

CONTROL_API_ROOT = Path(__file__).resolve().parents[1]
if str(CONTROL_API_ROOT) not in sys.path:
    sys.path.insert(0, str(CONTROL_API_ROOT))

from app.config import TelecomSettings
from app.services.webrtc_sessions import WebRtcSessionService


class FakeResponse:
    def __init__(self, status_code=200, data=None, text=""):
        self.status_code = status_code
        self._data = data if data is not None else {}
        self.text = text

    @property
    def is_success(self):
        return 200 <= self.status_code < 300

    def json(self):
        return self._data


class FakeAri:
    def __init__(self):
        self.requests = []

    async def request(self, method, path, *, params=None, body=None):
        self.requests.append((method, path, params or {}, body))
        if method == "GET" and path == "/endpoints/PJSIP":
            return FakeResponse(200, [])
        if method in {"PUT", "DELETE"} and path.startswith("/asterisk/config/dynamic/res_pjsip/"):
            return FakeResponse(204)
        return FakeResponse(200, {})


def settings():
    return TelecomSettings(
        api_token="token",
        webhook_secret="secret",
        webhook_url="",
        webhook_hosts=("iammagnanimousway.com",),
        ari_url="http://127.0.0.1:8088/ari",
        ari_user="ari",
        ari_password="password",
        caller_id="+15551234567",
        carrier_endpoint="pstn-primary",
        carrier_dial_context="magnanimous-outbound",
        carrier_timeout_ms=60000,
        monitor_interval_seconds=2.0,
        monitor_max_polls=1800,
        sip_domain="sip.example.com",
        webrtc_enabled=True,
        webrtc_public_url="wss://sip.example.com:8089/ws",
        webrtc_dynamic_sessions_enabled=True,
        webrtc_session_ttl_seconds=3600,
    )


class WebRtcSessionOwnershipTests(unittest.IsolatedAsyncioTestCase):
    async def test_owned_session_is_tenant_bound_and_revocation_clears_owner(self):
        service = WebRtcSessionService(FakeAri(), settings())
        created = await service.create(tenant_id="tenant-1", user_id="user-1")
        session_id = created["session_id"]

        self.assertTrue(service.owns_session(session_id, "tenant-1"))
        self.assertFalse(service.owns_session(session_id, "tenant-2"))
        self.assertNotIn("tenant_id", created)
        self.assertNotIn("user_id", created)

        await service.delete(session_id)
        self.assertFalse(service.owns_session(session_id, "tenant-1"))

    async def test_unowned_diagnostic_session_cannot_be_used_for_supervision(self):
        service = WebRtcSessionService(FakeAri(), settings())
        created = await service.create()
        self.assertFalse(service.owns_session(created["session_id"], "tenant-1"))


if __name__ == "__main__":
    unittest.main()
