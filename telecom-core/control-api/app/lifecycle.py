from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager, suppress

from fastapi import FastAPI

from .container import get_container


@asynccontextmanager
async def lifespan(_app: FastAPI):
    container = get_container()
    reaper = asyncio.create_task(container.webrtc_sessions.reap_loop())
    stasis_task = asyncio.create_task(container.stasis.run()) if container.stasis.enabled else None
    try:
        yield
    finally:
        await container.stasis.close()
        if stasis_task is not None:
            stasis_task.cancel()
            with suppress(asyncio.CancelledError):
                await stasis_task
        reaper.cancel()
        with suppress(asyncio.CancelledError):
            await reaper
