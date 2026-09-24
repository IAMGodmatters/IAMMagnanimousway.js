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
        self.held = None
        self.unheld = None
        self.transferred = None
        self.recording_started = None
        self.recording_stopped = None

    async def originate(self, call):
        self.originated = call
        return CarrierCallState(provider_call_id=call.provider_call_id, status="dialing")

    async def hangup(self, provider_call_id):
        self.hung_up = provider_call_id

    async def get_call(self, provider_call_id):
        return CarrierCallState(provider_call_id=provider_call_id, status="ended")

    async def hold(self, provider_call_id):
        self.held = provider_call_id

    async def unhold(self, provider_call_id):
        self.unheld = provider_call_id

    async def transfer(self, provider_call_id, endpoint):
        self.transferred = (provider_call_id, endpoint)

    async def start_recording(self, provider_call_id, recording_name, *, format, max_duration_seconds, beep):
        self.recording_started = (provider_call_id, recording_name, format, max_duration_seconds, beep)

    async def stop_recording(self, recording_name):
        self.recording_stopped = recording_name


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
            )
        )
        self.assertEqual(bridge.originated.destination, "+15559876543")
        self.assertEqual(bridge.originated.caller_id, "+15551234567")
        self.assertEqual(result["provider"], "Magnanimous Telecom")
        self.assertEqual(result["provider_call_id"], str(fixed_id))
        self.assertEqual(monitor.started[0], str(fixed_id))

    async def test_invalid_call_id_is_rejected_before_bridge_hangup(self):
        bridge = FakeBridge()
        service = CallService(bridge, FakeMonitor(), FakeCallbackPolicy(), SETTINGS)
        with self.assertRaises(TelecomValidationError):
            await service.hangup("not-a-call-id", None)
        self.assertIsNone(bridge.hung_up)

    async def test_native_call_controls_delegate_to_bridge(self):
        bridge = FakeBridge()
        service = CallService(bridge, FakeMonitor(), FakeCallbackPolicy(), SETTINGS)
        call_id = "12345678-1234-1234-1234-123456789abc"
        self.assertEqual((await service.hold(call_id))["status"], "held")
        self.assertEqual(bridge.held, call_id)
        self.assertEqual((await service.unhold(call_id))["status"], "active")
        self.assertEqual(bridge.unheld, call_id)
        transfer = await service.transfer(call_id, "PJSIP/2001")
        self.assertEqual(transfer["endpoint"], "PJSIP/2001")
        self.assertEqual(bridge.transferred, (call_id, "PJSIP/2001"))

    async def test_recording_requires_explicit_consent(self):
        bridge = FakeBridge()
        service = CallService(bridge, FakeMonitor(), FakeCallbackPolicy(), SETTINGS)
        call_id = "12345678-1234-1234-1234-123456789abc"
        with self.assertRaises(TelecomValidationError):
            await service.start_recording(call_id, consent_confirmed=False, format="wav", max_duration_seconds=120, beep=True)
        started = await service.start_recording(call_id, consent_confirmed=True, format="wav", max_duration_seconds=120, beep=True)
        self.assertEqual(started["status"], "recording")
        self.assertEqual(bridge.recording_started[0], call_id)
        stopped = await service.stop_recording(call_id)
        self.assertEqual(stopped["status"], "stopped")
        self.assertEqual(bridge.recording_stopped, f"magnanimous-{call_id}")

    async def test_get_returns_normalized_ended_state(self):
        bridge = FakeBridge()
        service = CallService(bridge, FakeMonitor(), FakeCallbackPolicy(), SETTINGS)
        call_id = "12345678-1234-1234-1234-123456789abc"
        result = await service.get(call_id)
        self.assertEqual(result, {"provider_call_id": call_id, "status": "ended"})


if __name__ == "__main__":
    unittest.main()
