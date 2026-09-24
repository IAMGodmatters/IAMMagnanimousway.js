from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager, suppress

from fastapi import FastAPI

from .container import get_container


@asynccontextmanager
async def lifespan(_app: FastAPI):
    container = get_container()
    reaper = asyncio.create_task(container.webrtc_sessions.reap_loop())
    try:
        yield
    finally:
        reaper.cancel()
        with suppress(asyncio.CancelledError):
            await reaper
