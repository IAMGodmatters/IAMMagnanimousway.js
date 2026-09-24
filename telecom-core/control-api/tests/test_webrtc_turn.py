import base64
import hashlib
import hmac
import sys
from pathlib import Path
import unittest

CONTROL_API_ROOT = Path(__file__).resolve().parents[1]
if str(CONTROL_API_ROOT) not in sys.path:
    sys.path.insert(0, str(CONTROL_API_ROOT))

from app.config import TelecomSettings
from app.errors import TelecomConfigurationError
from app.services.webrtc_sessions import WebRtcSessionService


def settings(**overrides):
    values = dict(
        api_token="test-token",
        webhook_secret="test-secret",
        webhook_url="",
        webhook_hosts=("iammagnanimousway.com",),
        ari_url="http://127.0.0.1:8088/ari",
        ari_user="ari",
        ari_password="secret",
        caller_id="",
        carrier_endpoint="pstn-trunk",
        carrier_dial_context="magnanimous-outbound",
        carrier_timeout_ms=60000,
        monitor_interval_seconds=2.0,
        monitor_max_polls=1800,
        sip_domain="webrtc.test",
        webrtc_enabled=True,
        webrtc_public_url="wss://sip.example.com/ws",
        webrtc_dynamic_sessions_enabled=True,
        webrtc_session_ttl_seconds=900,
    )
    values.update(overrides)
    return TelecomSettings(**values)


class TurnCredentialTests(unittest.TestCase):
    def test_turn_rest_credentials_are_short_lived_and_secret_is_not_returned(self):
        secret = "server-only-turn-secret"
        service = WebRtcSessionService(
            None,
            settings(
                webrtc_turn_urls=(
                    "turns:turn.example.com:5349?transport=tcp",
                    "turn:turn.example.com:3478?transport=tcp",
                ),
                webrtc_turn_auth_secret=secret,
            ),
        )
        expires_at = 1_800_000_000
        session_id = "web_1800000000_0123456789abcdef"
        servers = service._turn_ice_servers(session_id, expires_at)

        self.assertEqual(len(servers), 1)
        self.assertEqual(
            servers[0]["urls"],
            [
                "turns:turn.example.com:5349?transport=tcp",
                "turn:turn.example.com:3478?transport=tcp",
            ],
        )
        username = f"{expires_at}:{session_id}"
        expected = base64.b64encode(
            hmac.new(secret.encode(), username.encode(), hashlib.sha1).digest()
        ).decode("ascii")
        self.assertEqual(servers[0]["username"], username)
        self.assertEqual(servers[0]["credential"], expected)
        self.assertNotIn(secret, str(servers))

    def test_turn_urls_require_server_side_auth_secret(self):
        service = WebRtcSessionService(
            None,
            settings(webrtc_turn_urls=("turns:turn.example.com:5349?transport=tcp",)),
        )
        with self.assertRaises(TelecomConfigurationError):
            service._turn_ice_servers("web_1800000000_0123456789abcdef", 1_800_000_000)

    def test_relay_only_cannot_be_enabled_without_turn(self):
        service = WebRtcSessionService(
            None,
            settings(webrtc_turn_force_relay=True),
        )
        with self.assertRaises(TelecomConfigurationError):
            service._turn_ice_servers("web_1800000000_0123456789abcdef", 1_800_000_000)

    def test_non_turn_urls_are_rejected(self):
        service = WebRtcSessionService(
            None,
            settings(
                webrtc_turn_urls=("https://not-a-turn-server.example.com",),
                webrtc_turn_auth_secret="secret",
            ),
        )
        with self.assertRaises(TelecomConfigurationError):
            service._turn_ice_servers("web_1800000000_0123456789abcdef", 1_800_000_000)


if __name__ == "__main__":
    unittest.main()
