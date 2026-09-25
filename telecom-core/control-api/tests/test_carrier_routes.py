import sys
from dataclasses import replace
from pathlib import Path
import unittest

CONTROL_API_ROOT = Path(__file__).resolve().parents[1]
if str(CONTROL_API_ROOT) not in sys.path:
    sys.path.insert(0, str(CONTROL_API_ROOT))

from app.adapters.asterisk import AsteriskSipCarrierBridge
from app.config import TelecomSettings
from app.errors import TelecomConfigurationError, TelecomValidationError
from app.ports import CarrierCallRequest


class FakeResponse:
    def __init__(self, status_code=200, payload=None, text=""):
        self.status_code = status_code
        self._payload = payload or {}
        self.text = text

    @property
    def is_success(self):
        return 200 <= self.status_code < 300

    def json(self):
        return self._payload


class FakeAri:
    def __init__(self):
        self.requests = []
        self.responses = {}

    def set(self, method, path, response):
        self.responses[(method, path)] = response

    async def request(self, method, path, *, params=None, body=None):
        self.requests.append((method, path, params, body))
        return self.responses.get((method, path), FakeResponse())


SETTINGS = TelecomSettings(
    api_token="test-token",
    webhook_secret="test-secret",
    webhook_url="",
    webhook_hosts=("iammagnanimousway.com",),
    ari_url="http://127.0.0.1:8088/ari",
    ari_user="ari",
    ari_password="secret",
    caller_id="+15551234567",
    carrier_endpoint="pstn-trunk",
    carrier_secondary_endpoint="pstn-secondary",
    carrier_dial_context="magnanimous-outbound",
    carrier_primary_dial_context="magnanimous-outbound-primary",
    carrier_secondary_dial_context="magnanimous-outbound-secondary",
    carrier_timeout_ms=60000,
    monitor_interval_seconds=2.0,
    monitor_max_polls=1800,
)


def call(route_id="auto"):
    return CarrierCallRequest(
        provider_call_id="12345678-1234-1234-1234-123456789abc",
        business_call_id="42",
        tenant_id="tenant-1",
        destination="+15559876543",
        caller_id="+15551234567",
        route_id=route_id,
    )


class CarrierRouteTests(unittest.IsolatedAsyncioTestCase):
    async def test_explicit_secondary_route_uses_secondary_only_context(self):
        ari = FakeAri()
        bridge = AsteriskSipCarrierBridge(ari, SETTINGS)
        state = await bridge.originate(call("secondary"))
        self.assertEqual(state.status, "dialing")
        method, path, params, body = ari.requests[-1]
        self.assertEqual((method, path), ("POST", "/channels"))
        self.assertEqual(params["endpoint"], "Local/+15559876543@magnanimous-outbound-secondary/n")
        self.assertEqual(body["variables"]["MAG_ROUTE_ID"], "secondary")
        self.assertEqual(body["variables"]["MAG_ROUTE_CONTEXT"], "magnanimous-outbound-secondary")

    async def test_secondary_route_fails_closed_when_not_configured(self):
        ari = FakeAri()
        bridge = AsteriskSipCarrierBridge(ari, replace(SETTINGS, carrier_secondary_endpoint=""))
        with self.assertRaises(TelecomConfigurationError):
            await bridge.originate(call("secondary"))
        self.assertEqual(ari.requests, [])

    async def test_invalid_route_fails_before_ari_io(self):
        ari = FakeAri()
        bridge = AsteriskSipCarrierBridge(ari, SETTINGS)
        with self.assertRaises(TelecomValidationError):
            await bridge.health("not-a-route")
        self.assertEqual(ari.requests, [])

    async def test_authenticated_health_reports_each_logical_route(self):
        ari = FakeAri()
        ari.set("GET", "/asterisk/info", FakeResponse(200, {"system": {}}))
        ari.set("GET", "/endpoints/PJSIP/pstn-trunk", FakeResponse(200, {"state": "online"}))
        ari.set("GET", "/endpoints/PJSIP/pstn-secondary", FakeResponse(200, {"state": "online"}))
        bridge = AsteriskSipCarrierBridge(ari, SETTINGS)
        result = await bridge.health("secondary")
        self.assertTrue(result["ok"])
        self.assertTrue(result["authenticated_health"])
        self.assertFalse(result["route_planner_live_execution"])
        self.assertEqual(result["selected_route"]["id"], "secondary")
        self.assertEqual(result["selected_route"]["health"], "online")
        ids = {item["id"] for item in result["routes"]}
        self.assertEqual(ids, {"auto", "primary", "secondary"})

    async def test_auto_health_uses_secondary_when_primary_is_offline(self):
        ari = FakeAri()
        ari.set("GET", "/asterisk/info", FakeResponse(200, {"system": {}}))
        ari.set("GET", "/endpoints/PJSIP/pstn-trunk", FakeResponse(200, {"state": "offline"}))
        ari.set("GET", "/endpoints/PJSIP/pstn-secondary", FakeResponse(200, {"state": "online"}))
        bridge = AsteriskSipCarrierBridge(ari, SETTINGS)
        result = await bridge.health("auto")
        self.assertTrue(result["ok"])
        self.assertEqual(result["selected_route"]["health"], "online")


if __name__ == "__main__":
    unittest.main()
