import sys
from pathlib import Path
import unittest

CONTROL_API_ROOT = Path(__file__).resolve().parents[1]
if str(CONTROL_API_ROOT) not in sys.path:
    sys.path.insert(0, str(CONTROL_API_ROOT))

from app.config import TelecomSettings
from app.errors import TelecomConfigurationError, TelecomValidationError
from app.services.stasis_control import StasisCallControlService, StasisEventListener


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
    def __init__(self, listener=None):
        self.listener = listener
        self.requests = []
        self.missing_bridges = set()
        self.missing_recordings = set()

    async def request(self, method, path, *, params=None, body=None):
        self.requests.append((method, path, params, body))
        if method == "POST" and "/snoop/" in path:
            snoop_id = path.rsplit("/", 1)[-1]
            if self.listener is not None:
                self.listener._channels[snoop_id] = {"id": snoop_id, "args": ["supervisor"]}
            return FakeResponse(200, {"id": snoop_id})
        if method == "POST" and "/addChannel" in path:
            return FakeResponse(204)
        if method == "POST" and path.startswith("/bridges/") and path.endswith("/record"):
            return FakeResponse(200, {"name": params.get("name")})
        if method == "POST" and path.startswith("/recordings/live/") and path.endswith("/stop"):
            return FakeResponse(204)
        if method == "DELETE":
            return FakeResponse(204)
        if method == "GET" and path.startswith("/bridges/"):
            bridge_id = path.rsplit("/", 1)[-1]
            return FakeResponse(404 if bridge_id in self.missing_bridges else 200, {"id": bridge_id})
        if method == "GET" and path.startswith("/recordings/live/"):
            name = path.rsplit("/", 1)[-1]
            return FakeResponse(404 if name in self.missing_recordings else 200, {"name": name})
        if method == "POST" and path.startswith("/bridges/"):
            return FakeResponse(200, {"id": path.rsplit("/", 1)[-1]})
        return FakeResponse(200, {})


def settings(*, enabled=True):
    return TelecomSettings(
        api_token="test-token",
        webhook_secret="test-secret",
        webhook_url="",
        webhook_hosts=("iammagnanimousway.com",),
        ari_url="http://asterisk:8088/ari",
        ari_user="magnanimous-ari",
        ari_password="private-password",
        caller_id="+15551234567",
        carrier_endpoint="pstn-primary",
        carrier_dial_context="magnanimous-outbound",
        carrier_timeout_ms=60000,
        monitor_interval_seconds=2.0,
        monitor_max_polls=1800,
        stasis_enabled=enabled,
        stasis_app="magnanimous-call-control",
        stasis_reconnect_seconds=0.5,
        stasis_channel_wait_seconds=0.5,
    )


def ready_service():
    cfg = settings()
    listener = StasisEventListener(cfg)
    listener._connected = True
    listener._channels.update(
        {
            "agent-channel": {"id": "agent-channel"},
            "customer-channel": {"id": "customer-channel"},
            "supervisor-channel": {"id": "supervisor-channel"},
        }
    )
    ari = FakeAri(listener)
    return StasisCallControlService(ari, listener, cfg), ari, listener


class StasisEventListenerTests(unittest.IsolatedAsyncioTestCase):
    async def test_tracks_only_stasis_owned_channels(self):
        listener = StasisEventListener(settings())
        await listener._track(
            {
                "type": "StasisStart",
                "args": ["call", "42"],
                "channel": {"id": "chan-1", "name": "PJSIP/1000", "state": "Up"},
            }
        )
        self.assertTrue(listener.owns_channel("chan-1"))
        self.assertEqual(listener.status()["tracked_channels"], 1)
        self.assertNotIn("private-password", str(listener.status()))

        await listener._track({"type": "StasisEnd", "channel": {"id": "chan-1"}})
        self.assertFalse(listener.owns_channel("chan-1"))


class StasisCallControlTests(unittest.IsolatedAsyncioTestCase):
    async def test_disabled_control_fails_closed(self):
        cfg = settings(enabled=False)
        listener = StasisEventListener(cfg)
        service = StasisCallControlService(FakeAri(listener), listener, cfg)
        with self.assertRaises(TelecomConfigurationError):
            await service.create_bridge("call-1", ["a", "b"])

    async def test_managed_bridge_requires_stasis_owned_channels(self):
        service, _, _ = ready_service()
        with self.assertRaises(TelecomValidationError):
            await service.create_bridge("call-1", ["agent-channel", "outside-channel"])

    async def test_create_supervise_record_and_cleanup_lifecycle(self):
        service, ari, listener = ready_service()
        bridge = await service.create_bridge("call-42", ["agent-channel", "customer-channel"])
        bridge_id = bridge["bridge_id"]
        self.assertTrue(bridge_id.startswith("mag-call-"))

        supervisor = await service.start_supervisor(
            call_bridge_id=bridge_id,
            target_channel_id="agent-channel",
            supervisor_channel_id="supervisor-channel",
            mode="whisper",
            requested_by="owner@example.com",
        )
        snoop_request = next(x for x in ari.requests if "/snoop/" in x[1])
        self.assertEqual(snoop_request[2]["spy"], "both")
        self.assertEqual(snoop_request[2]["whisper"], "out")
        self.assertEqual(snoop_request[2]["app"], "magnanimous-call-control")
        self.assertEqual(service.status()["supervisor_sessions"], 1)

        with self.assertRaises(TelecomValidationError):
            await service.start_recording(
                bridge_id=bridge_id,
                requested_by="owner@example.com",
                consent_confirmed=False,
                consent_basis="No affirmative consent",
                beep=True,
                max_duration_seconds=3600,
            )

        recording = await service.start_recording(
            bridge_id=bridge_id,
            requested_by="owner@example.com",
            consent_confirmed=True,
            consent_basis="Both parties gave affirmative recording consent.",
            beep=True,
            max_duration_seconds=99999,
        )
        self.assertEqual(recording["format"], "wav")
        self.assertEqual(recording["max_duration_seconds"], 14400)
        record_request = next(x for x in ari.requests if x[1] == f"/bridges/{bridge_id}/record")
        self.assertEqual(record_request[2]["ifExists"], "fail")
        self.assertEqual(record_request[2]["beep"], "true")

        with self.assertRaises(TelecomValidationError):
            await service.destroy_bridge(bridge_id)

        stopped_recording = await service.stop_recording(recording["recording_name"])
        self.assertTrue(stopped_recording["stored"])
        await service.stop_supervisor(supervisor["session_id"])
        destroyed = await service.destroy_bridge(bridge_id)
        self.assertTrue(destroyed["destroyed"])
        self.assertEqual(service.status()["managed_call_bridges"], 0)

    async def test_monitor_and_barge_direction_contracts(self):
        for mode, whisper in (("monitor", "none"), ("barge", "both")):
            service, ari, _ = ready_service()
            bridge = await service.create_bridge(f"call-{mode}", ["agent-channel", "customer-channel"])
            session = await service.start_supervisor(
                call_bridge_id=bridge["bridge_id"],
                target_channel_id="agent-channel",
                supervisor_channel_id="supervisor-channel",
                mode=mode,
                requested_by="supervisor-1",
            )
            snoop_request = next(x for x in ari.requests if "/snoop/" in x[1])
            self.assertEqual(snoop_request[2]["spy"], "both")
            self.assertEqual(snoop_request[2]["whisper"], whisper)
            await service.stop_supervisor(session["session_id"])

    async def test_orphan_reaper_removes_supervisor_and_finished_recording_state(self):
        service, ari, listener = ready_service()
        bridge = await service.create_bridge("call-reap", ["agent-channel", "customer-channel"])
        supervisor = await service.start_supervisor(
            call_bridge_id=bridge["bridge_id"],
            target_channel_id="agent-channel",
            supervisor_channel_id="supervisor-channel",
            mode="monitor",
            requested_by="supervisor-1",
        )
        recording = await service.start_recording(
            bridge_id=bridge["bridge_id"],
            requested_by="supervisor-1",
            consent_confirmed=True,
            consent_basis="Recorded after affirmative consent.",
            beep=False,
            max_duration_seconds=60,
        )

        listener._channels.pop("supervisor-channel", None)
        ari.missing_recordings.add(recording["recording_name"])
        await service.reap_once()
        self.assertEqual(service.status()["supervisor_sessions"], 0)
        self.assertEqual(service.status()["active_recordings"], 0)
        self.assertTrue(any(x[0] == "DELETE" and x[1].endswith(supervisor["snoop_channel_id"]) for x in ari.requests))


if __name__ == "__main__":
    unittest.main()
