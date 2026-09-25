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
        if method == "GET" and path.startswith("/applications/"):
            return FakeResponse(200, {"channel_ids": ["restored-channel"]})
        if method == "GET" and path.startswith("/bridges/"):
            bridge_id = path.rsplit("/", 1)[-1]
            return FakeResponse(404 if bridge_id in self.missing_bridges else 200, {"id": bridge_id})
        if method == "GET" and path.startswith("/recordings/live/"):
            name = path.rsplit("/", 1)[-1]
            return FakeResponse(404 if name in self.missing_recordings else 200, {"name": name})
        if method == "POST" and path.startswith("/bridges/"):
            return FakeResponse(200, {"id": path.rsplit("/", 1)[-1]})
        return FakeResponse(200, {})


class FakeStateStore:
    def __init__(self, *, ready=True, active=None):
        self._ready = ready
        self.active = active or {"bridges": [], "supervisors": [], "recordings": []}
        self.events = []

    @property
    def ready(self):
        return self._ready

    async def ensure(self):
        self.events.append(("ensure",))
        self._ready = True

    async def load_active(self):
        self.events.append(("load_active",))
        return self.active

    async def put_bridge(self, bridge_id, call_id, channel_ids, created_at):
        self.events.append(("put_bridge", bridge_id, call_id, tuple(channel_ids), created_at))

    async def end_bridge(self, bridge_id, ended_at):
        self.events.append(("end_bridge", bridge_id, ended_at))

    async def put_supervisor(self, row):
        self.events.append(("put_supervisor", row["session_id"]))

    async def end_supervisor(self, session_id, ended_at):
        self.events.append(("end_supervisor", session_id, ended_at))

    async def put_recording(self, row):
        self.events.append(("put_recording", row["recording_name"], row["consent_basis"]))

    async def end_recording(self, recording_name, ended_at):
        self.events.append(("end_recording", recording_name, ended_at))


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
    listener = StasisEventListener(FakeAri(), cfg)
    listener._connected = True
    listener._channels.update(
        {
            "agent-channel": {"id": "agent-channel"},
            "customer-channel": {"id": "customer-channel"},
            "supervisor-channel": {"id": "supervisor-channel"},
        }
    )
    ari = FakeAri(listener)
    listener._ari = ari
    state = FakeStateStore(ready=True)
    return StasisCallControlService(ari, listener, state, cfg), ari, listener, state


class StasisEventListenerTests(unittest.IsolatedAsyncioTestCase):
    async def test_tracks_only_stasis_owned_channels(self):
        listener = StasisEventListener(FakeAri(), settings())
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

    async def test_reconnect_seeds_existing_application_channels(self):
        ari = FakeAri()
        listener = StasisEventListener(ari, settings())
        await listener._seed_existing_channels()
        self.assertTrue(listener.owns_channel("restored-channel"))


class StasisCallControlTests(unittest.IsolatedAsyncioTestCase):
    async def test_disabled_control_fails_closed(self):
        cfg = settings(enabled=False)
        listener = StasisEventListener(FakeAri(), cfg)
        ari = FakeAri(listener)
        listener._ari = ari
        service = StasisCallControlService(ari, listener, FakeStateStore(ready=False), cfg)
        with self.assertRaises(TelecomConfigurationError):
            await service.create_bridge("call-1", ["a", "b"])

    async def test_managed_bridge_requires_stasis_owned_channels(self):
        service, _, _, _ = ready_service()
        with self.assertRaises(TelecomValidationError):
            await service.create_bridge("call-1", ["agent-channel", "outside-channel"])

    async def test_create_supervise_record_and_cleanup_lifecycle(self):
        service, ari, listener, state = ready_service()
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
        self.assertTrue(any(e[0] == "put_bridge" for e in state.events))
        self.assertTrue(any(e[0] == "put_supervisor" for e in state.events))
        self.assertTrue(any(e[0] == "put_recording" for e in state.events))

        with self.assertRaises(TelecomValidationError):
            await service.destroy_bridge(bridge_id)

        stopped_recording = await service.stop_recording(recording["recording_name"])
        self.assertTrue(stopped_recording["stored"])
        await service.stop_supervisor(supervisor["session_id"])
        destroyed = await service.destroy_bridge(bridge_id)
        self.assertTrue(destroyed["destroyed"])
        self.assertEqual(service.status()["managed_call_bridges"], 0)

    async def test_enabled_control_requires_durable_state_ready(self):
        cfg = settings(enabled=True)
        listener = StasisEventListener(FakeAri(), cfg)
        listener._connected = True
        ari = FakeAri(listener)
        listener._ari = ari
        service = StasisCallControlService(ari, listener, FakeStateStore(ready=False), cfg)
        with self.assertRaises(TelecomConfigurationError):
            await service.create_bridge("call-1", ["agent-channel", "customer-channel"])

    async def test_initialize_restores_active_state_for_restart_recovery(self):
        cfg = settings(enabled=True)
        listener = StasisEventListener(FakeAri(), cfg)
        ari = FakeAri(listener)
        listener._ari = ari
        state = FakeStateStore(
            ready=False,
            active={
                "bridges": [
                    {
                        "bridge_id": "mag-call-restored",
                        "call_id": "call-restored",
                        "channel_ids": ["agent-channel", "customer-channel"],
                        "created_at": 100,
                    }
                ],
                "supervisors": [
                    {
                        "session_id": "sup-restored",
                        "call_bridge_id": "mag-call-restored",
                        "supervisor_bridge_id": "mag-supervisor-restored",
                        "snoop_channel_id": "mag-snoop-restored",
                        "target_channel_id": "agent-channel",
                        "supervisor_channel_id": "supervisor-channel",
                        "mode": "monitor",
                        "requested_by": "owner@example.com",
                        "created_at": 101,
                    }
                ],
                "recordings": [
                    {
                        "recording_name": "mag-restored",
                        "bridge_id": "mag-call-restored",
                        "requested_by": "owner@example.com",
                        "consent_basis": "Affirmative consent.",
                        "beep": True,
                        "max_duration_seconds": 3600,
                        "created_at": 102,
                    }
                ],
            },
        )
        service = StasisCallControlService(ari, listener, state, cfg)
        await service.initialize()
        status = service.status()
        self.assertTrue(status["persistent_state_ready"])
        self.assertTrue(status["restart_recovery_enabled"])
        self.assertEqual(status["managed_call_bridges"], 1)
        self.assertEqual(status["supervisor_sessions"], 1)
        self.assertEqual(status["active_recordings"], 1)
        self.assertEqual(state.events[:2], [("ensure",), ("load_active",)])

    async def test_monitor_and_barge_direction_contracts(self):
        for mode, whisper in (("monitor", "none"), ("barge", "both")):
            service, ari, _, state = ready_service()
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
        service, ari, listener, state = ready_service()
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
        self.assertTrue(any(e[0] == "end_supervisor" for e in state.events))
        self.assertTrue(any(e[0] == "end_recording" for e in state.events))


if __name__ == "__main__":
    unittest.main()
