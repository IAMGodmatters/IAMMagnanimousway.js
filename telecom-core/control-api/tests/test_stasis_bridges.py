import sys
from pathlib import Path
import unittest

CONTROL_API_ROOT = Path(__file__).resolve().parents[1]
if str(CONTROL_API_ROOT) not in sys.path:
    sys.path.insert(0, str(CONTROL_API_ROOT))

from app.config import TelecomSettings
from app.errors import TelecomConfigurationError, TelecomNotFoundError, TelecomValidationError
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


SUPERVISOR_SESSION = "web_1800000000_0123456789abcdef"


class FakeWebRtcSessions:
    def owns_session(self, session_id, tenant_id):
        return session_id == SUPERVISOR_SESSION and tenant_id == "tenant-1"


class FakeAri:
    def __init__(self):
        self.requests = []
        self.supervisor_channels = [{
            "id": "supervisor-channel",
            "name": f"PJSIP/{SUPERVISOR_SESSION}-00000001",
            "dialplan": {
                "app_name": "Stasis",
                "app_data": "magnanimous-native-call,supervisor",
            },
        }]

    async def request(self, method, path, *, params=None, body=None):
        self.requests.append((method, path, params or {}, body))
        if method == "POST" and path.startswith("/recordings/live/"):
            return FakeResponse(204)
        if method == "GET" and path == "/channels":
            return FakeResponse(200, self.supervisor_channels)
        if method == "GET" and path.startswith("/bridges/"):
            return FakeResponse(200, {"id": path.rsplit("/", 1)[-1]})
        if method == "GET" and path.startswith("/channels/"):
            channel_id = path.rsplit("/", 1)[-1]
            return FakeResponse(200, {"id": channel_id, "name": f"PJSIP/{channel_id}-00000001"})
        if method == "POST" and path.endswith("/record"):
            return FakeResponse(200, {"state": "recording"})
        if method == "POST" and "/snoop/" in path:
            return FakeResponse(200, {"id": path.rsplit("/", 1)[-1]})
        if method == "POST" and path.startswith("/bridges/") and not path.endswith(("addChannel", "removeChannel")):
            return FakeResponse(200, {"id": path.rsplit("/", 1)[-1]})
        if method == "POST" and path.endswith(("addChannel", "removeChannel")):
            return FakeResponse(204)
        if method == "POST" and path == "/channels":
            return FakeResponse(200, {"id": (params or {}).get("channelId")})
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


async def prepare_managed_call(service):
    call = call_request()
    await service.originate(call, "pstn-primary")
    await service.handle_event({"type": "StasisStart", "channel": {"id": call.provider_call_id}})
    topology = service.call_topology(call.provider_call_id, call.tenant_id)
    await service.handle_event({"type": "StasisStart", "channel": {"id": topology["agent_channel_id"]}})
    return call, service.call_topology(call.provider_call_id, call.tenant_id)


class StasisBridgeLifecycleTests(unittest.IsolatedAsyncioTestCase):
    async def test_disabled_status_never_claims_live_features(self):
        service = AsteriskStasisBridgeService(FakeAri(), settings())
        status = service.status()
        self.assertFalse(status["configured"])
        self.assertFalse(status["ready"])
        self.assertFalse(status["supervisor_monitor_live"])
        self.assertFalse(status["bridge_recording_live"])
        self.assertFalse(status["public_live_verified"])

    async def test_runtime_ready_is_not_public_live(self):
        service = AsteriskStasisBridgeService(
            FakeAri(),
            settings(
                stasis_bridge_enabled=True,
                supervisor_audio_enabled=True,
                bridge_recording_enabled=True,
            ),
            FakeWebRtcSessions(),
        )
        service._ready = True
        status = service.status()
        self.assertTrue(status["supervisor_audio_runtime_ready"])
        self.assertTrue(status["bridge_recording_runtime_ready"])
        self.assertFalse(status["supervisor_monitor_live"])
        self.assertFalse(status["supervisor_whisper_live"])
        self.assertFalse(status["supervisor_barge_live"])
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

        await service.handle_event({"type": "StasisStart", "channel": {"id": call.provider_call_id}})
        topology = service.call_topology(call.provider_call_id, call.tenant_id)
        self.assertTrue(topology["customer_joined"])
        self.assertFalse(topology["agent_joined"])

        await service.handle_event({"type": "StasisStart", "channel": {"id": topology["agent_channel_id"]}})
        self.assertEqual(service.call_state(call.provider_call_id).status, "connected")

        channel_posts = [x for x in ari.requests if x[0] == "POST" and x[1] == "/channels"]
        self.assertEqual(len(channel_posts), 2)
        self.assertEqual(channel_posts[0][2]["app"], "magnanimous-native-call")
        self.assertEqual(channel_posts[1][2]["endpoint"], "PJSIP/9000")

        await service.handle_event({"type": "StasisEnd", "channel": {"id": call.provider_call_id}})
        self.assertFalse(service.owns(call.provider_call_id))
        self.assertTrue(any(x[0] == "DELETE" and x[1] == f"/bridges/{topology['bridge_id']}" for x in ari.requests))

    async def test_topology_is_tenant_scoped(self):
        service = AsteriskStasisBridgeService(FakeAri(), settings(stasis_bridge_enabled=True))
        service._ready = True
        call, _ = await prepare_managed_call(service)
        with self.assertRaises(TelecomNotFoundError):
            service.call_topology(call.provider_call_id, "tenant-2")

    async def test_recording_requires_consent_tenant_and_jurisdiction(self):
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
        call, topology = await prepare_managed_call(service)
        requests_before = len(ari.requests)

        with self.assertRaises(TelecomValidationError):
            await service.start_recording(
                call.provider_call_id,
                StasisRecordingStart(
                    tenant_id=call.tenant_id,
                    consent_confirmed=False,
                    jurisdiction="US-CA",
                ),
            )
        self.assertEqual(len(ari.requests), requests_before)

        with self.assertRaises(TelecomNotFoundError):
            await service.start_recording(
                call.provider_call_id,
                StasisRecordingStart(
                    tenant_id="tenant-2",
                    consent_confirmed=True,
                    jurisdiction="US-CA",
                ),
            )

        result = await service.start_recording(
            call.provider_call_id,
            StasisRecordingStart(
                tenant_id=call.tenant_id,
                consent_confirmed=True,
                jurisdiction="US-CA",
                max_duration_seconds=1200,
                beep=True,
            ),
        )
        self.assertEqual(result["max_duration_seconds"], 600)
        record = next(x for x in ari.requests if x[1] == f"/bridges/{topology['bridge_id']}/record")
        self.assertEqual(record[2]["format"], "wav")
        self.assertEqual(record[2]["maxDurationSeconds"], 600)
        self.assertEqual(record[2]["beep"], "true")

        with self.assertRaises(TelecomNotFoundError):
            await service.stop_recording(result["recording_name"], "tenant-2")
        await service.stop_recording(result["recording_name"], call.tenant_id)
        self.assertTrue(any(x[1] == f"/recordings/live/{result['recording_name']}/stop" for x in ari.requests))

    async def test_monitor_and_whisper_use_isolated_snoop_bridge(self):
        for mode, expected_whisper in (("monitor", "none"), ("whisper", "out")):
            with self.subTest(mode=mode):
                ari = FakeAri()
                service = AsteriskStasisBridgeService(
                    ari,
                    settings(stasis_bridge_enabled=True, supervisor_audio_enabled=True),
                    FakeWebRtcSessions(),
                )
                service._ready = True
                call, topology = await prepare_managed_call(service)
                result = await service.start_supervisor(
                    SupervisorSessionStart(
                        mode=mode,
                        provider_call_id=call.provider_call_id,
                        tenant_id=call.tenant_id,
                        target_role="agent",
                        supervisor_session_id=SUPERVISOR_SESSION,
                    consent_confirmed=True,
                        jurisdiction="US-CA",
                    )
                )
                snoop = next(x for x in ari.requests if "/snoop/" in x[1])
                self.assertEqual(snoop[1], f"/channels/{topology['agent_channel_id']}/snoop/{result['snoop_channel_id']}")
                self.assertEqual(snoop[2]["spy"], "both")
                self.assertEqual(snoop[2]["whisper"], expected_whisper)
                self.assertEqual(snoop[2]["app"], "magnanimous-native-call")
                add = next(x for x in ari.requests if x[1] == f"/bridges/{result['supervisor_bridge_id']}/addChannel")
                self.assertIn("supervisor-channel", add[2]["channel"])
                self.assertIn(result["snoop_channel_id"], add[2]["channel"])
                with self.assertRaises(TelecomNotFoundError):
                    await service.stop_supervisor(result["session_id"], "tenant-2")
                await service.stop_supervisor(result["session_id"], call.tenant_id)
                self.assertTrue(any(x[0] == "DELETE" and x[1] == f"/channels/{result['snoop_channel_id']}" for x in ari.requests))

    async def test_barge_joins_supervisor_directly_to_tenant_call_bridge(self):
        ari = FakeAri()
        service = AsteriskStasisBridgeService(
            ari,
            settings(stasis_bridge_enabled=True, supervisor_audio_enabled=True),
            FakeWebRtcSessions(),
        )
        service._ready = True
        call, topology = await prepare_managed_call(service)
        result = await service.start_supervisor(
            SupervisorSessionStart(
                mode="barge",
                provider_call_id=call.provider_call_id,
                tenant_id=call.tenant_id,
                target_role="agent",
                supervisor_session_id=SUPERVISOR_SESSION,
                consent_confirmed=True,
                jurisdiction="US-CA",
            )
        )
        add = next(
            x for x in ari.requests
            if x[1] == f"/bridges/{topology['bridge_id']}/addChannel"
            and x[2].get("channel") == "supervisor-channel"
        )
        self.assertEqual(add[2]["role"], "supervisor")
        self.assertFalse(any("/snoop/" in x[1] for x in ari.requests))
        await service.stop_supervisor(result["session_id"], call.tenant_id)
        self.assertTrue(any(
            x[1] == f"/bridges/{topology['bridge_id']}/removeChannel"
            and x[2].get("channel") == "supervisor-channel"
            for x in ari.requests
        ))

    async def test_supervisor_requires_tenant_owned_webrtc_session_and_matching_channel(self):
        ari = FakeAri()
        service = AsteriskStasisBridgeService(
            ari,
            settings(stasis_bridge_enabled=True, supervisor_audio_enabled=True),
            FakeWebRtcSessions(),
        )
        service._ready = True
        call, _ = await prepare_managed_call(service)

        with self.assertRaises(TelecomNotFoundError):
            await service.start_supervisor(
                SupervisorSessionStart(
                    mode="monitor",
                    provider_call_id=call.provider_call_id,
                    tenant_id="tenant-2",
                    target_role="agent",
                    supervisor_session_id=SUPERVISOR_SESSION,
                    consent_confirmed=True,
                    jurisdiction="US-CA",
                )
            )

        ari.supervisor_channels = [{
            "id": "supervisor-channel",
            "name": "PJSIP/different-endpoint-00000001",
            "dialplan": {
                "app_name": "Stasis",
                "app_data": "magnanimous-native-call,supervisor",
            },
        }]
        with self.assertRaises(TelecomNotFoundError):
            await service.start_supervisor(
                SupervisorSessionStart(
                    mode="monitor",
                    provider_call_id=call.provider_call_id,
                    tenant_id=call.tenant_id,
                    target_role="agent",
                    supervisor_session_id=SUPERVISOR_SESSION,
                    consent_confirmed=True,
                    jurisdiction="US-CA",
                )
            )

        ari.supervisor_channels = [
            {
                "id": "supervisor-channel-a",
                "name": f"PJSIP/{SUPERVISOR_SESSION}-00000001",
                "dialplan": {
                    "app_name": "Stasis",
                    "app_data": "magnanimous-native-call,supervisor",
                },
            },
            {
                "id": "supervisor-channel-b",
                "name": f"PJSIP/{SUPERVISOR_SESSION}-00000002",
                "dialplan": {
                    "app_name": "Stasis",
                    "app_data": "magnanimous-native-call,supervisor",
                },
            },
        ]
        with self.assertRaises(TelecomNotFoundError):
            await service.start_supervisor(
                SupervisorSessionStart(
                    mode="monitor",
                    provider_call_id=call.provider_call_id,
                    tenant_id=call.tenant_id,
                    target_role="agent",
                    supervisor_session_id=SUPERVISOR_SESSION,
                    consent_confirmed=True,
                    jurisdiction="US-CA",
                )
            )

    async def test_supervisor_gate_fails_closed_before_ari(self):
        ari = FakeAri()
        service = AsteriskStasisBridgeService(
            ari,
            settings(stasis_bridge_enabled=True, supervisor_audio_enabled=False),
            FakeWebRtcSessions(),
        )
        service._ready = True
        with self.assertRaises(TelecomConfigurationError):
            await service.start_supervisor(
                SupervisorSessionStart(
                    mode="monitor",
                    provider_call_id=call_request().provider_call_id,
                    tenant_id="tenant-1",
                    target_role="agent",
                    supervisor_session_id=SUPERVISOR_SESSION,
                    consent_confirmed=True,
                    jurisdiction="US-CA",
                )
            )
        self.assertEqual(ari.requests, [])

    async def test_natural_call_end_cleans_recording_and_supervisor_children(self):
        ari = FakeAri()
        service = AsteriskStasisBridgeService(
            ari,
            settings(
                stasis_bridge_enabled=True,
                supervisor_audio_enabled=True,
                bridge_recording_enabled=True,
            ),
            FakeWebRtcSessions(),
        )
        service._ready = True
        call, topology = await prepare_managed_call(service)
        supervisor = await service.start_supervisor(
            SupervisorSessionStart(
                mode="monitor",
                provider_call_id=call.provider_call_id,
                tenant_id=call.tenant_id,
                target_role="agent",
                supervisor_session_id=SUPERVISOR_SESSION,
                consent_confirmed=True,
                jurisdiction="US-CA",
            )
        )
        recording = await service.start_recording(
            call.provider_call_id,
            StasisRecordingStart(
                tenant_id=call.tenant_id,
                consent_confirmed=True,
                jurisdiction="US-CA",
            ),
        )

        await service.handle_event({"type": "StasisEnd", "channel": {"id": call.provider_call_id}})

        self.assertFalse(service.owns(call.provider_call_id))
        self.assertEqual(service.status()["active_supervisor_sessions"], 0)
        self.assertEqual(service.status()["active_recordings"], 0)
        self.assertTrue(any(x[1] == f"/channels/{supervisor['snoop_channel_id']}" for x in ari.requests))
        self.assertTrue(any(x[1] == f"/recordings/live/{recording['recording_name']}/stop" for x in ari.requests))
        self.assertTrue(any(x[1] == f"/bridges/{topology['bridge_id']}" and x[0] == "DELETE" for x in ari.requests))

    async def test_shutdown_cleanup_does_not_depend_on_ready_flag(self):
        ari = FakeAri()
        service = AsteriskStasisBridgeService(
            ari,
            settings(
                stasis_bridge_enabled=True,
                supervisor_audio_enabled=True,
                bridge_recording_enabled=True,
            ),
            FakeWebRtcSessions(),
        )
        service._ready = True
        call, _ = await prepare_managed_call(service)
        supervisor = await service.start_supervisor(
            SupervisorSessionStart(
                mode="monitor",
                provider_call_id=call.provider_call_id,
                tenant_id=call.tenant_id,
                target_role="agent",
                supervisor_session_id=SUPERVISOR_SESSION,
                consent_confirmed=True,
                jurisdiction="US-CA",
            )
        )
        recording = await service.start_recording(
            call.provider_call_id,
            StasisRecordingStart(
                tenant_id=call.tenant_id,
                consent_confirmed=True,
                jurisdiction="US-CA",
            ),
        )
        service._ready = False
        await service.close()
        self.assertEqual(service.status()["active_supervisor_sessions"], 0)
        self.assertEqual(service.status()["active_recordings"], 0)
        self.assertFalse(service.owns(call.provider_call_id))
        self.assertTrue(any(x[1] == f"/channels/{supervisor['snoop_channel_id']}" for x in ari.requests))
        self.assertTrue(any(x[1] == f"/recordings/live/{recording['recording_name']}/stop" for x in ari.requests))


if __name__ == "__main__":
    unittest.main()
