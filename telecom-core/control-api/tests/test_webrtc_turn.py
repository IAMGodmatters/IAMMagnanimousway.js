import base64
import hashlib
import hmac
import sys
from pathlib import Path
import unittest

CONTROL_API_ROOT = Path(__file__).resolve().parents[1]
if str(CONTROL_API_ROOT) not in sys.path:
    sys.path.insert(0, str(CONTROL_API_ROOT))

from app.errors import TelecomConfigurationError
from app.services.turn_credentials import build_turn_ice_servers



class TurnCredentialTests(unittest.TestCase):
    def test_turn_rest_credentials_are_short_lived_and_secret_is_not_returned(self):
        secret = "server-only-turn-secret"
        expires_at = 1_800_000_000
        session_id = "web_1800000000_0123456789abcdef"
        servers = build_turn_ice_servers(
            urls=(
                "turns:turn.example.com:5349?transport=tcp",
                "turn:turn.example.com:3478?transport=tcp",
            ),
            auth_secret=secret,
            force_relay=False,
            session_id=session_id,
            expires_at=expires_at,
        )

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
        with self.assertRaises(TelecomConfigurationError):
            build_turn_ice_servers(
                urls=("turns:turn.example.com:5349?transport=tcp",),
                auth_secret="",
                force_relay=False,
                session_id="web_1800000000_0123456789abcdef",
                expires_at=1_800_000_000,
            )

    def test_relay_only_cannot_be_enabled_without_turn(self):
        with self.assertRaises(TelecomConfigurationError):
            build_turn_ice_servers(
                urls=(),
                auth_secret="",
                force_relay=True,
                session_id="web_1800000000_0123456789abcdef",
                expires_at=1_800_000_000,
            )

    def test_non_turn_urls_are_rejected(self):
        with self.assertRaises(TelecomConfigurationError):
            build_turn_ice_servers(
                urls=("https://not-a-turn-server.example.com",),
                auth_secret="secret",
                force_relay=False,
                session_id="web_1800000000_0123456789abcdef",
                expires_at=1_800_000_000,
            )


if __name__ == "__main__":
    unittest.main()
