import importlib.util
from pathlib import Path
import sys
import unittest

SCRIPT = Path(__file__).resolve().parents[2] / "scripts" / "verify-supervision-live.py"
SPEC = importlib.util.spec_from_file_location("verify_supervision_live", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


class SupervisionLiveVerifierTests(unittest.TestCase):
    def test_private_target_is_rejected_without_explicit_local_override(self):
        with self.assertRaises(MODULE.VerificationError):
            MODULE.require_public_https("http://127.0.0.1:8788", False)

    def test_private_target_can_be_used_only_for_local_test_override(self):
        result = MODULE.require_public_https("http://127.0.0.1:8788", True)
        self.assertEqual(result["host"], "127.0.0.1")
        self.assertIn("127.0.0.1", result["resolved_addresses"])

    def test_evidence_sanitizer_drops_internal_resource_names_and_secrets(self):
        sanitized = MODULE.sanitize_session({
            "session_id": "session-1",
            "mode": "monitor",
            "target_channel_id": "target-1",
            "recording_file_exposed": False,
            "recording_path": "/var/spool/asterisk/monitor/private.wav",
            "api_token": "do-not-leak",
            "ari_password": "do-not-leak",
        })
        self.assertEqual(sanitized["session_id"], "session-1")
        self.assertFalse(sanitized["recording_file_exposed"])
        self.assertNotIn("recording_path", sanitized)
        self.assertNotIn("api_token", sanitized)
        self.assertNotIn("ari_password", sanitized)


if __name__ == "__main__":
    unittest.main()
