import sys
from pathlib import Path
import unittest
import uuid

CONTROL_API_ROOT = Path(__file__).resolve().parents[1]
if str(CONTROL_API_ROOT) not in sys.path:
    sys.path.insert(0, str(CONTROL_API_ROOT))

from app.config import TelecomSettings
from app.errors import TelecomValidationError
from app.models import OutboundCall
from app.ports import CarrierCallState
from app.services.calls import CallService


class FakeBridge:
    def __init__(self):
        self.originated = None
        self.hung_up = None

    async def originate(self, call):
        self.originated = call
        return CarrierCallState(provider_call_id=call.provider_call_id, status="dialing")

    async def hangup(self, provider_call_id):
        self.hung_up = provider_call_id

    async def get_call(self, provider_call_id):
        return CarrierCallState(provider_call_id=provider_call_id, status="ended")


class FakeMonitor:
    def __init__(self):
        self.started = None

    def start(self, provider_call_id, callback_url):
        self.started = (provider_call_id, callback_url)


class FakeCallbackPolicy:
    def resolve(self, requested_url):
        return requested_url


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
    carrier_dial_context="magnanimous-outbound",
    carrier_timeout_ms=60000,
    monitor_interval_seconds=2.0,
    monitor_max_polls=1800,
)


class CallServiceTests(unittest.IsolatedAsyncioTestCase):
    async def test_place_normalizes_numbers_and_delegates_to_bridge(self):
        bridge = FakeBridge()
        monitor = FakeMonitor()
        fixed_id = uuid.UUID("12345678-1234-1234-1234-123456789abc")
        service = CallService(
            bridge,
            monitor,
            FakeCallbackPolicy(),
            SETTINGS,
            id_factory=lambda: fixed_id,
        )
        result = await service.place(
            OutboundCall(
                call_id=42,
                tenant_id="tenant-1",
                to="+1 (555) 987-6543",
                webhook_url="https://iammagnanimousway.com/api/voice/carrier/status",
                selected_route={"route_id": 7, "interconnect_id": 3, "endpoint": "pstn-secondary"},
            )
        )
        self.assertEqual(bridge.originated.destination, "+15559876543")
        self.assertEqual(bridge.originated.caller_id, "+15551234567")
        self.assertEqual(result["provider"], "Magnanimous Telecom")
        self.assertEqual(result["provider_call_id"], str(fixed_id))
        self.assertTrue(result["selected_route_applied"])
        self.assertEqual(result["route_id"], "7")
        self.assertEqual(result["interconnect_id"], "3")
        self.assertEqual(bridge.originated.carrier_endpoint, "pstn-secondary")
        self.assertEqual(monitor.started[0], str(fixed_id))

    async def test_invalid_call_id_is_rejected_before_bridge_hangup(self):
        bridge = FakeBridge()
        service = CallService(bridge, FakeMonitor(), FakeCallbackPolicy(), SETTINGS)
        with self.assertRaises(TelecomValidationError):
            await service.hangup("not-a-call-id", None)
        self.assertIsNone(bridge.hung_up)

    async def test_get_returns_normalized_ended_state(self):
        bridge = FakeBridge()
        service = CallService(bridge, FakeMonitor(), FakeCallbackPolicy(), SETTINGS)
        call_id = "12345678-1234-1234-1234-123456789abc"
        result = await service.get(call_id)
        self.assertEqual(result, {"provider_call_id": call_id, "status": "ended"})


if __name__ == "__main__":
    unittest.main()
