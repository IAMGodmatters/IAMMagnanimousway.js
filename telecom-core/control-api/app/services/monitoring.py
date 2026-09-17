from __future__ import annotations

import asyncio
from typing import Any

from ..config import TelecomSettings
from ..errors import TelecomError
from ..ports import CarrierBridge, StatusPublisher


class CarrierCallMonitor:
    """Owns call-status polling lifecycle; it does not originate or terminate calls."""

    def __init__(self, bridge: CarrierBridge, publisher: StatusPublisher, settings: TelecomSettings):
        self._bridge = bridge
        self._publisher = publisher
        self._settings = settings
        self._tasks: set[asyncio.Task[Any]] = set()

    @property
    def active_count(self) -> int:
        return len(self._tasks)

    def start(self, provider_call_id: str, callback_url: str | None) -> None:
        if not callback_url or not self._settings.webhook_secret:
            return
        task = asyncio.create_task(self._run(provider_call_id, callback_url))
        self._tasks.add(task)
        task.add_done_callback(self._tasks.discard)

    async def _run(self, provider_call_id: str, callback_url: str) -> None:
        last_status = "dialing"
        await self._publisher.publish(
            callback_url,
            provider_call_id,
            last_status,
            "Call accepted by Magnanimous Telecom carrier bridge.",
        )
        for _ in range(self._settings.monitor_max_polls):
            await asyncio.sleep(self._settings.monitor_interval_seconds)
            try:
                state = await self._bridge.get_call(provider_call_id)
            except TelecomError:
                continue
            if state.status == "ended":
                await self._publisher.publish(callback_url, provider_call_id, "ended", "Carrier channel ended.")
                return
            if state.status != last_status:
                last_status = state.status
                await self._publisher.publish(callback_url, provider_call_id, state.status)
        await self._publisher.publish(
            callback_url,
            provider_call_id,
            "ended",
            "Call monitor reached its safety timeout.",
        )
