from __future__ import annotations

import asyncpg

from ..config import TelecomSettings
from ..errors import SipAccountConflictError, TelecomConfigurationError
from ..ports import SipSubscriber


class PostgresSipSubscriberStore:
    """PostgreSQL adapter for Magnanimous-owned SIP subscriber identities."""

    def __init__(self, settings: TelecomSettings):
        self._settings = settings

    async def _connect(self) -> asyncpg.Connection:
        if not self._settings.sip_db_password:
            raise TelecomConfigurationError("SIP database credentials are not configured.")
        return await asyncpg.connect(
            host=self._settings.sip_db_host,
            port=self._settings.sip_db_port,
            database=self._settings.sip_db_name,
            user=self._settings.sip_db_user,
            password=self._settings.sip_db_password,
            timeout=5,
        )

    @staticmethod
    def _record(row: asyncpg.Record) -> SipSubscriber:
        return SipSubscriber(
            username=str(row["username"]),
            domain=str(row["domain"]),
            active=bool(row["active"]),
            created_at=row["created_at"],
        )

    async def list(self) -> list[SipSubscriber]:
        conn = await self._connect()
        try:
            rows = await conn.fetch(
                "SELECT username,domain,active,created_at FROM subscriber ORDER BY username"
            )
            return [self._record(row) for row in rows]
        finally:
            await conn.close()

    async def create(self, username: str, domain: str, ha1: str) -> SipSubscriber:
        conn = await self._connect()
        try:
            try:
                row = await conn.fetchrow(
                    """
                    INSERT INTO subscriber(username,domain,password,ha1,ha1b,active)
                    VALUES($1,$2,'',$3,'',TRUE)
                    RETURNING username,domain,active,created_at
                    """,
                    username,
                    domain,
                    ha1,
                )
            except asyncpg.UniqueViolationError as exc:
                raise SipAccountConflictError(f"SIP account '{username}' already exists.") from exc
            assert row is not None
            return self._record(row)
        finally:
            await conn.close()

    async def delete(self, username: str) -> bool:
        conn = await self._connect()
        try:
            deleted = await conn.fetchval(
                "DELETE FROM subscriber WHERE username=$1 RETURNING username", username
            )
            return deleted is not None
        finally:
            await conn.close()

    async def health(self) -> bool:
        try:
            conn = await self._connect()
            try:
                return bool(await conn.fetchval("SELECT 1"))
            finally:
                await conn.close()
        except Exception:
            return False
