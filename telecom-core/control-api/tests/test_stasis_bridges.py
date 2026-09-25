import sys
from pathlib import Path
import unittest

CONTROL_API_ROOT = Path(__file__).resolve().parents[1]
if str(CONTROL_API_ROOT) not in sys.path:
    sys.path.insert(0, str(CONTROL_API_ROOT))

from app.config import TelecomSettings
from app.errors import TelecomConfigurationError, TelecomValidationError
from app.models import StasisRecordingStart, SupervisorSessionStart
from app.ports import CarrierCallRequest
from app.services.stasis_bridges import AsteriskStasisBridgeService


class FakeResponse:
    def __init__(self, status_code=200, data=None, text=""):
        self.status_code = status_code
        self._data = data or {}
        self.text = text
        self.content = b"{}" if data is not None else b""

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
        if method == "GET" and (path.startswith("/bridges/") or path.startswith("/channels/")):
            return FakeResponse(200, {"id": path.rsplit("/", 1)[-1]})
        if method == "POST" and "/record" in path:
            return FakeResponse(200, {"state": "recording"})
        if method == "POST" and "/snoop/" in path:
            return FakeResponse(200, {"id": path.rsplit("/", 1)[-1]})
        if method == "POST" and path.startswith("/bridges/") and not path.endswith(("addChannel", "removeChannel")):
            return FakeResponse(200, {"id": path.rsplit("/", 1)[-1]})
        if method == "POST" and path.endswith(("addChannel", "removeChannel")):
            return FakeResponse(204)
        if method == "POST" and path == "/channels":
            return FakeResponse(200, {"id": (params or {}).get("channelId")})
        if method == "POST" and path.startswith("/recordings/live/"):
            return FakeResponse(204)
        if method == "DELETE":
            return FakeResponse(204)
        return FakeResponse(200, {})


def settings(**overrides):
    values = dict(
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
        carrier_allowed_endpoints=("pstn-primary",),
    )
    values.update(overrides)
    return TelecomSettings(**values)


def call_request():
    return CarrierCallRequest(
        provider_call_id="11111111-1111-1111-1111-111111111111",
        business_call_id="42",
        tenant_id="tenant-1",
        destination="+15559876543",
        caller_id="+15551234567",
        agent_id="agent-1",
        queue_id="queue-1",
        route_id="route-1",
        interconnect_id="interconnect-1",
        carrier_endpoint="pstn-primary",
    )


class StasisBridgeLifecycleTests(unittest.IsolatedAsyncioTestCase):
    async def test_disabled_status_never_claims_live_features(self):
        service = AsteriskStasisBridgeService(FakeAri(), settings())
        status = service.status()
        self.assertFalse(status["configured"])
        self.assertFalse(status["ready"])
        self.assertFalse(status["supervisor_monitor_live"])
        self.assertFalse(status["bridge_recording_live"])
        self.assertFalse(status["public_live_verified"])

    async def test_managed_call_builds_two_leg_bridge_and_cleans_on_end(self):
        ari = FakeAri()
        service = AsteriskStasisBridgeService(
            ari,
            settings(stasis_bridge_enabled=True, stasis_agent_endpoint="PJSIP/9000"),
        )
        service._ready = True
        call = call_request()

        state = await service.originate(call, "pstn-primary")
        self.assertEqual(state.status, "dialing")
        self.assertTrue(service.owns(call.provider_call_id))

        await service.handle_event({
            "type": "StasisStart",
            "channel": {"id": call.provider_call_id},
        })
        topology = service.call_topology(call.provider_call_id)
        self.assertTrue(topology["customer_joined"])
        self.assertFalse(topology["agent_joined"])

        await service.handle_event({
            "type": "StasisStart",
            "channel": {"id": topology["agent_channel_id"]},
        })
        self.assertEqual(service.call_state(call.provider_call_id).status, "connected")

        channel_posts = [x for x in ari.requests if x[0] == "POST" and x[1] == "/channels"]
        self.assertEqual(len(channel_posts), 2)
        self.assertEqual(channel_posts[0][2]["app"], "magnanimous-native-call")
        self.assertEqual(channel_posts[1][2]["endpoint"], "PJSIP/9000")

        await service.handle_event({
            "type": "StasisEnd",
            "channel": {"id": call.provider_call_id},
        })
        self.assertFalse(service.owns(call.provider_call_id))
        self.assertTrue(any(x[0] == "DELETE" and x[1] == f"/bridges/{topology['bridge_id']}" for x in ari.requests))

    async def test_recording_requires_explicit_consent_and_jurisdiction(self):
        ari = FakeAri()
        service = AsteriskStasisBridgeService(
            ari,
            settings(
                stasis_bridge_enabled=True,
                bridge_recording_enabled=True,
                bridge_recording_max_seconds=600,
            ),
        )
        service._ready = True

        with self.assertRaises(TelecomValidationError):
            await service.start_recording(
                "bridge-1",
                StasisRecordingStart(consent_confirmed=False, jurisdiction="US-CA"),
            )
        self.assertEqual(ari.requests, [])

        result = await service.start_recording(
            "bridge-1",
            StasisRecordingStart(
                consent_confirmed=True,
                jurisdiction="US-CA",
                max_duration_seconds=1200,
                beep=True,
            ),
        )
        self.assertEqual(result["max_duration_seconds"], 600)
        record = next(x for x in ari.requests if x[1] == "/bridges/bridge-1/record")
        self.assertEqual(record[2]["format"], "wav")
        self.assertEqual(record[2]["maxDurationSeconds"], 600)
        self.assertEqual(record[2]["beep"], "true")

    async def test_monitor_and_whisper_use_isolated_snoop_bridge(self):
        for mode, expected_whisper in (("monitor", "none"), ("whisper", "out")):
            with self.subTest(mode=mode):
                ari = FakeAri()
                service = AsteriskStasisBridgeService(
                    ari,
                    settings(stasis_bridge_enabled=True, supervisor_audio_enabled=True),
                )
                service._ready = True
                result = await service.start_supervisor(
                    SupervisorSessionStart(
                        mode=mode,
                        call_bridge_id="call-bridge",
                        target_channel_id="agent-channel",
                        supervisor_channel_id="supervisor-channel",
                        consent_confirmed=True,
                        jurisdiction="US-CA",
                    )
                )
                snoop = next(x for x in ari.requests if "/snoop/" in x[1])
                self.assertEqual(snoop[2]["spy"], "both")
                self.assertEqual(snoop[2]["whisper"], expected_whisper)
                self.assertEqual(snoop[2]["app"], "magnanimous-native-call")
                add = [x for x in ari.requests if x[1].endswith("/addChannel")][-1]
                self.assertIn("supervisor-channel", add[2]["channel"])
                self.assertIn(result["snoop_channel_id"], add[2]["channel"])
                await service.stop_supervisor(result["session_id"])
                self.assertTrue(any(x[0] == "DELETE" and x[1] == f"/channels/{result['snoop_channel_id']}" for x in ari.requests))

    async def test_barge_joins_supervisor_directly_to_managed_call_bridge(self):
        ari = FakeAri()
        service = AsteriskStasisBridgeService(
            ari,
            settings(stasis_bridge_enabled=True, supervisor_audio_enabled=True),
        )
        service._ready = True
        result = await service.start_supervisor(
            SupervisorSessionStart(
                mode="barge",
                call_bridge_id="call-bridge",
                target_channel_id="agent-channel",
                supervisor_channel_id="supervisor-channel",
                consent_confirmed=True,
                jurisdiction="US-CA",
            )
        )
        add = next(x for x in ari.requests if x[1] == "/bridges/call-bridge/addChannel")
        self.assertEqual(add[2]["channel"], "supervisor-channel")
        self.assertEqual(add[2]["role"], "supervisor")
        self.assertFalse(any("/snoop/" in x[1] for x in ari.requests))
        await service.stop_supervisor(result["session_id"])
        self.assertTrue(any(x[1] == "/bridges/call-bridge/removeChannel" for x in ari.requests))

    async def test_supervisor_gate_fails_closed_before_ari(self):
        ari = FakeAri()
        service = AsteriskStasisBridgeService(
            ari,
            settings(stasis_bridge_enabled=True, supervisor_audio_enabled=False),
        )
        service._ready = True
        with self.assertRaises(TelecomConfigurationError):
            await service.start_supervisor(
                SupervisorSessionStart(
                    mode="monitor",
                    call_bridge_id="call-bridge",
                    target_channel_id="agent-channel",
                    supervisor_channel_id="supervisor-channel",
                    consent_confirmed=True,
                    jurisdiction="US-CA",
                )
            )
        self.assertEqual(ari.requests, [])


if __name__ == "__main__":
    unittest.main()
