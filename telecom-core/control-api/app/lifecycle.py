from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager, suppress

from fastapi import FastAPI

from .container import get_container


@asynccontextmanager
async def lifespan(_app: FastAPI):
    container = get_container()
    await container.stasis_control.initialize()
    reaper = asyncio.create_task(container.webrtc_sessions.reap_loop())
    stasis_events = asyncio.create_task(container.stasis_events.run())
    stasis_reaper = asyncio.create_task(container.stasis_control.reap_loop())
    try:
        yield
    finally:
        for task in (reaper, stasis_events, stasis_reaper):
            task.cancel()
        for task in (reaper, stasis_events, stasis_reaper):
            with suppress(asyncio.CancelledError):
                await task
