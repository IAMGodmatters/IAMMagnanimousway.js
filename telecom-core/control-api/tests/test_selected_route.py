import sys
from pathlib import Path
import unittest

CONTROL_API_ROOT = Path(__file__).resolve().parents[1]
if str(CONTROL_API_ROOT) not in sys.path:
    sys.path.insert(0, str(CONTROL_API_ROOT))

from app.adapters.asterisk import AsteriskSipCarrierBridge
from app.config import TelecomSettings
from app.errors import CarrierRejectedError, CarrierUnavailableError
from app.ports import CarrierCallRequest


class FakeResponse:
    def __init__(self, status_code=200, data=None, text=""):
        self.status_code = status_code
        self._data = data or {}
        self.text = text

    @property
    def is_success(self):
        return 200 <= self.status_code < 300

    def json(self):
        return self._data


class FakeAri:
    def __init__(self, endpoint_state="online"):
        self.endpoint_state = endpoint_state
        self.requests = []

    async def request(self, method, path, *, params=None, body=None):
        self.requests.append((method, path, params, body))
        if path.startswith("/endpoints/PJSIP/"):
            return FakeResponse(200, {"state": self.endpoint_state})
        if method == "POST" and path == "/channels":
            return FakeResponse(200, {"id": params.get("channelId")})
        return FakeResponse(200, {})


SETTINGS = TelecomSettings(
    api_token="test-token",
    webhook_secret="test-secret",
    webhook_url="",
    webhook_hosts=("iammagnanimousway.com",),
    ari_url="http://127.0.0.1:8088/ari",
    ari_user="ari",
    ari_password="secret",
    caller_id="+15551234567",
    carrier_endpoint="pstn-primary",
    carrier_dial_context="magnanimous-outbound",
    carrier_timeout_ms=60000,
    monitor_interval_seconds=2.0,
    monitor_max_polls=1800,
    carrier_secondary_endpoint="pstn-secondary",
    carrier_allowed_endpoints=("pstn-primary", "pstn-secondary"),
)


def request(endpoint="pstn-secondary"):
    return CarrierCallRequest(
        provider_call_id="12345678-1234-1234-1234-123456789abc",
        business_call_id="42",
        tenant_id="tenant-1",
        destination="+15559876543",
        caller_id="+15551234567",
        route_id="7",
        interconnect_id="3",
        carrier_endpoint=endpoint,
    )


class SelectedRouteTests(unittest.IsolatedAsyncioTestCase):
    async def test_authorized_selected_route_is_health_checked_and_forwarded(self):
        ari = FakeAri("online")
        bridge = AsteriskSipCarrierBridge(ari, SETTINGS)
        state = await bridge.originate(request())
        self.assertEqual(state.status, "dialing")
        self.assertEqual(ari.requests[0][0:2], ("GET", "/endpoints/PJSIP/pstn-secondary"))
        post = ari.requests[1]
        self.assertEqual(post[0:2], ("POST", "/channels"))
        self.assertEqual(post[3]["variables"]["MAG_CARRIER_ENDPOINT"], "pstn-secondary")
        self.assertEqual(post[3]["variables"]["MAG_ROUTE_ID"], "7")
        self.assertEqual(post[3]["variables"]["MAG_INTERCONNECT_ID"], "3")

    async def test_unlisted_selected_route_fails_closed_before_ari(self):
        ari = FakeAri("online")
        bridge = AsteriskSipCarrierBridge(ari, SETTINGS)
        with self.assertRaises(CarrierRejectedError):
            await bridge.originate(request("untrusted-trunk"))
        self.assertEqual(ari.requests, [])

    async def test_unhealthy_selected_route_fails_before_origination(self):
        ari = FakeAri("unavailable")
        bridge = AsteriskSipCarrierBridge(ari, SETTINGS)
        with self.assertRaises(CarrierUnavailableError):
            await bridge.originate(request())
        self.assertEqual(len(ari.requests), 1)
        self.assertEqual(ari.requests[0][0:2], ("GET", "/endpoints/PJSIP/pstn-secondary"))


if __name__ == "__main__":
    unittest.main()
