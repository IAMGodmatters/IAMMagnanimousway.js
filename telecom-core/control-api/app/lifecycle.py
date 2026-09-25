from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager, suppress

from fastapi import FastAPI

from .container import get_container


@asynccontextmanager
async def lifespan(_app: FastAPI):
    container = get_container()
    reaper = asyncio.create_task(container.webrtc_sessions.reap_loop())
    stasis = asyncio.create_task(container.stasis_events.run()) if container.stasis_events.enabled else None
    try:
        yield
    finally:
        reaper.cancel()
        with suppress(asyncio.CancelledError):
            await reaper
        if stasis is not None:
            stasis.cancel()
            with suppress(asyncio.CancelledError):
                await stasis
        await container.supervision.shutdown()
