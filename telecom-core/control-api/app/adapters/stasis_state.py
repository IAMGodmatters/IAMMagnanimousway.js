from __future__ import annotations

from typing import Any
import json

import asyncpg

from ..config import TelecomSettings
from ..errors import TelecomConfigurationError


class PostgresStasisStateStore:
    """Durable state/audit store for Magnanimous-owned Stasis call control."""

    def __init__(self, settings: TelecomSettings):
        self._settings = settings
        self._ready = False

    @property
    def ready(self) -> bool:
        return self._ready

    async def _connect(self) -> asyncpg.Connection:
        if not self._settings.sip_db_password:
            raise TelecomConfigurationError(
                "Stasis call control requires the owned Telecom PostgreSQL credentials."
            )
        return await asyncpg.connect(
            host=self._settings.sip_db_host,
            port=self._settings.sip_db_port,
            database=self._settings.sip_db_name,
            user=self._settings.sip_db_user,
            password=self._settings.sip_db_password,
            timeout=5,
        )

    async def ensure(self) -> None:
        conn = await self._connect()
        try:
            await conn.execute(
                """
                CREATE TABLE IF NOT EXISTS stasis_managed_bridges(
                    bridge_id VARCHAR(180) PRIMARY KEY,
                    call_id VARCHAR(180) NOT NULL,
                    channel_ids JSONB NOT NULL,
                    status VARCHAR(32) NOT NULL DEFAULT 'active',
                    created_at BIGINT NOT NULL,
                    ended_at BIGINT
                );
                CREATE INDEX IF NOT EXISTS stasis_managed_bridges_status_idx
                    ON stasis_managed_bridges(status);

                CREATE TABLE IF NOT EXISTS stasis_supervisor_sessions(
                    session_id VARCHAR(180) PRIMARY KEY,
                    call_bridge_id VARCHAR(180) NOT NULL,
                    supervisor_bridge_id VARCHAR(180) NOT NULL,
                    snoop_channel_id VARCHAR(180) NOT NULL,
                    target_channel_id VARCHAR(180) NOT NULL,
                    supervisor_channel_id VARCHAR(180) NOT NULL,
                    mode VARCHAR(32) NOT NULL,
                    requested_by VARCHAR(200) NOT NULL,
                    status VARCHAR(32) NOT NULL DEFAULT 'active',
                    created_at BIGINT NOT NULL,
                    ended_at BIGINT
                );
                CREATE INDEX IF NOT EXISTS stasis_supervisor_sessions_status_idx
                    ON stasis_supervisor_sessions(status);
                CREATE INDEX IF NOT EXISTS stasis_supervisor_sessions_call_bridge_idx
                    ON stasis_supervisor_sessions(call_bridge_id);

                CREATE TABLE IF NOT EXISTS stasis_recordings(
                    recording_name VARCHAR(180) PRIMARY KEY,
                    bridge_id VARCHAR(180) NOT NULL,
                    requested_by VARCHAR(200) NOT NULL,
                    consent_basis VARCHAR(500) NOT NULL,
                    consent_confirmed BOOLEAN NOT NULL,
                    beep BOOLEAN NOT NULL DEFAULT TRUE,
                    max_duration_seconds INTEGER NOT NULL,
                    status VARCHAR(32) NOT NULL DEFAULT 'active',
                    created_at BIGINT NOT NULL,
                    ended_at BIGINT
                );
                CREATE INDEX IF NOT EXISTS stasis_recordings_status_idx
                    ON stasis_recordings(status);
                CREATE INDEX IF NOT EXISTS stasis_recordings_bridge_idx
                    ON stasis_recordings(bridge_id);
                """
            )
            self._ready = True
        finally:
            await conn.close()

    async def load_active(self) -> dict[str, list[dict[str, Any]]]:
        conn = await self._connect()
        try:
            bridges = await conn.fetch(
                """
                SELECT bridge_id,call_id,channel_ids,created_at
                FROM stasis_managed_bridges
                WHERE status='active'
                ORDER BY created_at
                """
            )
            supervisors = await conn.fetch(
                """
                SELECT session_id,call_bridge_id,supervisor_bridge_id,snoop_channel_id,
                       target_channel_id,supervisor_channel_id,mode,requested_by,created_at
                FROM stasis_supervisor_sessions
                WHERE status='active'
                ORDER BY created_at
                """
            )
            recordings = await conn.fetch(
                """
                SELECT recording_name,bridge_id,requested_by,consent_basis,
                       beep,max_duration_seconds,created_at
                FROM stasis_recordings
                WHERE status='active'
                ORDER BY created_at
                """
            )
            bridge_rows = []
            for row in bridges:
                item = dict(row)
                raw = item.get("channel_ids")
                if isinstance(raw, str):
                    try:
                        item["channel_ids"] = json.loads(raw)
                    except json.JSONDecodeError:
                        item["channel_ids"] = []
                bridge_rows.append(item)
            return {
                "bridges": bridge_rows,
                "supervisors": [dict(row) for row in supervisors],
                "recordings": [dict(row) for row in recordings],
            }
        finally:
            await conn.close()

    async def put_bridge(
        self,
        bridge_id: str,
        call_id: str,
        channel_ids: tuple[str, ...],
        created_at: int,
    ) -> None:
        conn = await self._connect()
        try:
            await conn.execute(
                """
                INSERT INTO stasis_managed_bridges(
                    bridge_id,call_id,channel_ids,status,created_at,ended_at
                ) VALUES($1,$2,$3::jsonb,'active',$4,NULL)
                ON CONFLICT(bridge_id) DO UPDATE SET
                    call_id=EXCLUDED.call_id,
                    channel_ids=EXCLUDED.channel_ids,
                    status='active',
                    created_at=EXCLUDED.created_at,
                    ended_at=NULL
                """,
                bridge_id,
                call_id,
                json.dumps(list(channel_ids)),
                created_at,
            )
        finally:
            await conn.close()

    async def end_bridge(self, bridge_id: str, ended_at: int) -> None:
        await self._mark_ended("stasis_managed_bridges", "bridge_id", bridge_id, ended_at)

    async def put_supervisor(self, row: dict[str, Any]) -> None:
        conn = await self._connect()
        try:
            await conn.execute(
                """
                INSERT INTO stasis_supervisor_sessions(
                    session_id,call_bridge_id,supervisor_bridge_id,snoop_channel_id,
                    target_channel_id,supervisor_channel_id,mode,requested_by,status,created_at,ended_at
                ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,'active',$9,NULL)
                ON CONFLICT(session_id) DO UPDATE SET
                    call_bridge_id=EXCLUDED.call_bridge_id,
                    supervisor_bridge_id=EXCLUDED.supervisor_bridge_id,
                    snoop_channel_id=EXCLUDED.snoop_channel_id,
                    target_channel_id=EXCLUDED.target_channel_id,
                    supervisor_channel_id=EXCLUDED.supervisor_channel_id,
                    mode=EXCLUDED.mode,
                    requested_by=EXCLUDED.requested_by,
                    status='active',
                    created_at=EXCLUDED.created_at,
                    ended_at=NULL
                """,
                row["session_id"],
                row["call_bridge_id"],
                row["supervisor_bridge_id"],
                row["snoop_channel_id"],
                row["target_channel_id"],
                row["supervisor_channel_id"],
                row["mode"],
                row["requested_by"],
                row["created_at"],
            )
        finally:
            await conn.close()

    async def end_supervisor(self, session_id: str, ended_at: int) -> None:
        await self._mark_ended(
            "stasis_supervisor_sessions", "session_id", session_id, ended_at
        )

    async def put_recording(self, row: dict[str, Any]) -> None:
        conn = await self._connect()
        try:
            await conn.execute(
                """
                INSERT INTO stasis_recordings(
                    recording_name,bridge_id,requested_by,consent_basis,
                    consent_confirmed,beep,max_duration_seconds,status,created_at,ended_at
                ) VALUES($1,$2,$3,$4,TRUE,$5,$6,'active',$7,NULL)
                ON CONFLICT(recording_name) DO UPDATE SET
                    bridge_id=EXCLUDED.bridge_id,
                    requested_by=EXCLUDED.requested_by,
                    consent_basis=EXCLUDED.consent_basis,
                    consent_confirmed=TRUE,
                    beep=EXCLUDED.beep,
                    max_duration_seconds=EXCLUDED.max_duration_seconds,
                    status='active',
                    created_at=EXCLUDED.created_at,
                    ended_at=NULL
                """,
                row["recording_name"],
                row["bridge_id"],
                row["requested_by"],
                row["consent_basis"],
                bool(row["beep"]),
                int(row["max_duration_seconds"]),
                row["created_at"],
            )
        finally:
            await conn.close()

    async def end_recording(self, recording_name: str, ended_at: int) -> None:
        await self._mark_ended(
            "stasis_recordings", "recording_name", recording_name, ended_at
        )

    async def _mark_ended(
        self,
        table: str,
        key_column: str,
        key: str,
        ended_at: int,
    ) -> None:
        allowed = {
            ("stasis_managed_bridges", "bridge_id"),
            ("stasis_supervisor_sessions", "session_id"),
            ("stasis_recordings", "recording_name"),
        }
        if (table, key_column) not in allowed:
            raise ValueError("Unsupported Stasis state table.")
        conn = await self._connect()
        try:
            await conn.execute(
                f"UPDATE {table} SET status='ended',ended_at=$2 WHERE {key_column}=$1",
                key,
                ended_at,
            )
        finally:
            await conn.close()
