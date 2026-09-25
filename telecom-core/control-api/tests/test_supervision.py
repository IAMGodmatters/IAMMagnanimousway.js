import sys
from pathlib import Path
import unittest

CONTROL_API_ROOT = Path(__file__).resolve().parents[1]
if str(CONTROL_API_ROOT) not in sys.path:
    sys.path.insert(0, str(CONTROL_API_ROOT))

from app.config import TelecomSettings
from app.errors import TelecomValidationError
from app.services.supervision import SupervisorService


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


class FakeEvents:
    ready = True

    def status(self):
        return {
            "enabled": True,
            "connected": True,
            "application": "magnanimous-supervisor",
            "credentials_exposed": False,
        }


class FakeAri:
    def __init__(self):
        self.requests = []

    async def request(self, method, path, *, params=None, body=None):
        self.requests.append((method, path, params, body))
        if method == "GET" and path.startswith("/channels/"):
            return FakeResponse(200, {"id": path.rsplit("/", 1)[-1], "state": "Up"})
        if method == "GET" and path.startswith("/endpoints/PJSIP/"):
            return FakeResponse(200, {"state": "online"})
        if method == "GET" and path.startswith("/bridges/"):
            return FakeResponse(200, {"id": path.rsplit("/", 1)[-1]})
        if method == "GET" and path.startswith("/recordings/live/"):
            return FakeResponse(404, {})
        if method == "POST" and "/snoop/" in path:
            return FakeResponse(200, {"id": path.rsplit("/", 1)[-1]})
        if method == "POST" and path.startswith("/bridges/") and path.endswith("/addChannel"):
            return FakeResponse(204, {})
        if method == "POST" and path.startswith("/bridges/") and path.endswith("/record"):
            return FakeResponse(200, {"name": params.get("name")})
        if method == "POST" and path.startswith("/bridges/"):
            return FakeResponse(200, {"id": path.rsplit("/", 1)[-1]})
        if method == "POST" and path == "/channels":
            return FakeResponse(200, {"id": params.get("channelId")})
        if method == "POST" and path.startswith("/recordings/live/") and path.endswith("/stop"):
            return FakeResponse(204, {})
        if method == "DELETE":
            return FakeResponse(204, {})
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
    supervisor_control_enabled=True,
    supervisor_stasis_app="magnanimous-supervisor",
    supervisor_recording_format="wav",
    supervisor_recording_max_seconds=3600,
)


class SupervisionTests(unittest.IsolatedAsyncioTestCase):
    async def test_supervisor_audio_rejects_missing_consent_before_ari(self):
        ari = FakeAri()
        service = SupervisorService(ari, FakeEvents(), SETTINGS)
        with self.assertRaises(TelecomValidationError):
            await service.start(
                target_channel_id="12345678-1234-1234-1234-123456789abc",
                supervisor_endpoint="web_1800000000_0123456789abcdef",
                mode="monitor",
                consent_confirmed=False,
                notice_confirmed=True,
            )
        self.assertEqual(ari.requests, [])

    async def test_barge_uses_snoop_bridge_and_registered_supervisor_endpoint(self):
        ari = FakeAri()
        service = SupervisorService(ari, FakeEvents(), SETTINGS)
        result = await service.start(
            target_channel_id="12345678-1234-1234-1234-123456789abc",
            supervisor_endpoint="web_1800000000_0123456789abcdef",
            mode="barge",
            consent_confirmed=True,
            notice_confirmed=True,
        )
        snoop = next(r for r in ari.requests if "/snoop/" in r[1])
        self.assertEqual(snoop[2]["spy"], "both")
        self.assertEqual(snoop[2]["whisper"], "both")
        supervisor = next(r for r in ari.requests if r[0] == "POST" and r[1] == "/channels")
        self.assertEqual(supervisor[2]["endpoint"], "PJSIP/web_1800000000_0123456789abcdef")
        self.assertTrue(result["consent_required"])
        self.assertFalse(result["covert_monitoring"])
        await service.shutdown()

    async def test_headless_recording_uses_bridge_beep_and_never_exposes_file(self):
        ari = FakeAri()
        service = SupervisorService(ari, FakeEvents(), SETTINGS)
        result = await service.start_call_recording(
            target_channel_id="12345678-1234-1234-1234-123456789abc",
            consent_confirmed=True,
            notice_confirmed=True,
            jurisdiction="US-CA",
            max_duration_seconds=600,
        )
        record = next(r for r in ari.requests if r[0] == "POST" and r[1].endswith("/record"))
        self.assertEqual(record[2]["beep"], "true")
        self.assertEqual(record[2]["format"], "wav")
        self.assertFalse(result["recording_file_exposed"])
        self.assertFalse(result["covert_recording"])
        stopped = await service.stop_call_recording(result["session_id"])
        self.assertFalse(stopped["recording"])
        self.assertFalse(stopped["recording_file_exposed"])

    async def test_invalid_session_id_never_reaches_ari(self):
        ari = FakeAri()
        service = SupervisorService(ari, FakeEvents(), SETTINGS)
        with self.assertRaises(TelecomValidationError):
            await service.status("../../bad-session")
        self.assertEqual(ari.requests, [])


if __name__ == "__main__":
    unittest.main()
