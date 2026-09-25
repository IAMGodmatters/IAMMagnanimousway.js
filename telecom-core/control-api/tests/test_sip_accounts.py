import hashlib
import sys
from datetime import datetime, timezone
from pathlib import Path
import unittest

CONTROL_API_ROOT = Path(__file__).resolve().parents[1]
if str(CONTROL_API_ROOT) not in sys.path:
    sys.path.insert(0, str(CONTROL_API_ROOT))

from app.config import TelecomSettings
from app.errors import SipAccountNotFoundError
from app.models import SipAccountCreate
from app.ports import SipSubscriber
from app.services.sip_accounts import SipAccountService


class FakeStore:
    def __init__(self):
        self.records = {}
        self.last_ha1 = None

    async def list(self):
        return list(self.records.values())

    async def create(self, username, domain, ha1):
        self.last_ha1 = ha1
        record = SipSubscriber(
            username=username,
            domain=domain,
            active=True,
            created_at=datetime(2026, 9, 17, tzinfo=timezone.utc),
        )
        self.records[username] = record
        return record

    async def delete(self, username):
        return self.records.pop(username, None) is not None

    async def health(self):
        return True


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
    carrier_secondary_endpoint="pstn-secondary",
    carrier_dial_context="magnanimous-outbound",
    carrier_primary_dial_context="magnanimous-outbound-primary",
    carrier_secondary_dial_context="magnanimous-outbound-secondary",
    carrier_timeout_ms=60000,
    monitor_interval_seconds=2.0,
    monitor_max_polls=1800,
    sip_domain="sip.iammagnanimousway.com",
)


class SipAccountServiceTests(unittest.IsolatedAsyncioTestCase):
    async def test_create_returns_password_once_and_stores_only_ha1(self):
        store = FakeStore()
        service = SipAccountService(store, SETTINGS)
        result = await service.create(SipAccountCreate(username="2001", password="correct-horse-battery"))

        expected = hashlib.md5(
            b"2001:sip.iammagnanimousway.com:correct-horse-battery",
            usedforsecurity=False,
        ).hexdigest()
        self.assertEqual(store.last_ha1, expected)
        self.assertEqual(result["sip_uri"], "sip:2001@sip.iammagnanimousway.com")
        self.assertEqual(result["password"], "correct-horse-battery")
        self.assertTrue(result["password_returned_once"])

    async def test_list_never_returns_digest_material(self):
        store = FakeStore()
        service = SipAccountService(store, SETTINGS)
        await service.create(SipAccountCreate(username="2002", password="another-strong-password"))
        result = await service.list()
        serialized = str(result).lower()
        self.assertNotIn("ha1", serialized)
        self.assertNotIn("another-strong-password", serialized)

    async def test_delete_missing_account_is_not_silently_reported_as_success(self):
        service = SipAccountService(FakeStore(), SETTINGS)
        with self.assertRaises(SipAccountNotFoundError):
            await service.delete("2999")


if __name__ == "__main__":
    unittest.main()
