from __future__ import annotations

from typing import Any

from fastapi import Depends, FastAPI, Header
from fastapi.responses import JSONResponse

from .container import ApplicationContainer, get_container
from .errors import TelecomError
from .models import HangupRequest, OutboundCall

app = FastAPI(
    title="Magnanimous Telecom Core",
    version="0.3.0",
    docs_url="/docs",
    redoc_url=None,
)


@app.exception_handler(TelecomError)
async def telecom_error_handler(_, exc: TelecomError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "code": exc.code},
    )


def require_token(
    authorization: str | None = Header(default=None),
    container: ApplicationContainer = Depends(get_container),
) -> None:
    container.auth.verify(authorization)


@app.get("/health")
async def health(container: ApplicationContainer = Depends(get_container)) -> dict[str, Any]:
    return await container.health.public_health()


@app.get("/v1/carrier", dependencies=[Depends(require_token)])
async def carrier(container: ApplicationContainer = Depends(get_container)) -> dict[str, Any]:
    return container.carrier_bridge.describe()


@app.get("/v1/carrier/health", dependencies=[Depends(require_token)])
async def carrier_health(container: ApplicationContainer = Depends(get_container)) -> dict[str, Any]:
    return await container.health.carrier_health()


@app.post("/v1/calls", status_code=201, dependencies=[Depends(require_token)])
async def place_call(
    request: OutboundCall,
    container: ApplicationContainer = Depends(get_container),
) -> dict[str, Any]:
    return await container.calls.place(request)


@app.delete("/v1/calls/{provider_call_id}", dependencies=[Depends(require_token)])
async def hangup_call(
    provider_call_id: str,
    request: HangupRequest | None = None,
    container: ApplicationContainer = Depends(get_container),
) -> dict[str, Any]:
    return await container.calls.hangup(provider_call_id, request)


@app.get("/v1/calls/{provider_call_id}", dependencies=[Depends(require_token)])
async def get_call(
    provider_call_id: str,
    container: ApplicationContainer = Depends(get_container),
) -> dict[str, Any]:
    return await container.calls.get(provider_call_id)
