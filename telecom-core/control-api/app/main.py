from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager, suppress
from typing import Any

from fastapi import Depends, FastAPI, Header
from fastapi.responses import JSONResponse

from .container import ApplicationContainer, get_container
from .errors import TelecomError
from .models import HangupRequest, OutboundCall, SipAccountCreate

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


app = FastAPI(
    title="Magnanimous Telecom Core",
    version="0.6.0",
    docs_url="/docs",
    redoc_url=None,
    lifespan=lifespan,
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


@app.get("/v1/sip", dependencies=[Depends(require_token)])
async def sip_core(container: ApplicationContainer = Depends(get_container)) -> dict[str, Any]:
    transports = ["udp", "tcp"]
    if container.settings.webrtc_enabled:
        transports.append("wss")
    return {
        "identity": "Magnanimous Telecom",
        "service": "Magnanimous SIP Core",
        "domain": container.settings.sip_domain,
        "registrar_port": 5060,
        "transports": transports,
        "pbx_media": "Magnanimous-owned Asterisk",
        "native_browser_media": "Asterisk WebRTC" if container.settings.webrtc_enabled else "disabled until TLS/runtime verification",
        "pstn_boundary": "replaceable interconnect until direct carrier authority is obtained",
    }


@app.get("/v1/webrtc", dependencies=[Depends(require_token)])
async def webrtc(container: ApplicationContainer = Depends(get_container)) -> dict[str, Any]:
    settings = container.settings
    public_url = settings.webrtc_public_url or (
        f"wss://{settings.sip_domain}:{settings.webrtc_https_port}/ws"
        if settings.webrtc_enabled and settings.sip_domain
        else ""
    )
    return {
        "identity": "Magnanimous Telecom",
        "provider": "Magnanimous Carrier",
        "configured": settings.webrtc_enabled,
        "signaling_url": public_url,
        "native_pbx": "Asterisk",
        "signaling": "SIP over secure WebSocket (WSS)",
        "media_security": ["DTLS-SRTP", "ICE", "RTCP mux"],
        "preferred_codec": "Opus",
        "credentials_included": False,
        "truth_boundary": "configured means the owned core was explicitly enabled; live status still requires a successful browser registration and media probe",
    }


@app.post("/v1/webrtc/sessions", status_code=201, dependencies=[Depends(require_token)])
async def create_webrtc_session(
    container: ApplicationContainer = Depends(get_container),
) -> dict[str, Any]:
    return await container.webrtc_sessions.create()


@app.delete("/v1/webrtc/sessions/{session_id}", dependencies=[Depends(require_token)])
async def delete_webrtc_session(
    session_id: str,
    container: ApplicationContainer = Depends(get_container),
) -> dict[str, Any]:
    return await container.webrtc_sessions.delete(session_id)


@app.get("/v1/sip/health", dependencies=[Depends(require_token)])
async def sip_health(container: ApplicationContainer = Depends(get_container)) -> dict[str, Any]:
    return await container.sip_accounts.health()


@app.get("/v1/sip/accounts", dependencies=[Depends(require_token)])
async def list_sip_accounts(container: ApplicationContainer = Depends(get_container)) -> dict[str, Any]:
    return await container.sip_accounts.list()


@app.post("/v1/sip/accounts", status_code=201, dependencies=[Depends(require_token)])
async def create_sip_account(
    request: SipAccountCreate,
    container: ApplicationContainer = Depends(get_container),
) -> dict[str, Any]:
    return await container.sip_accounts.create(request)


@app.delete("/v1/sip/accounts/{username}", dependencies=[Depends(require_token)])
async def delete_sip_account(
    username: str,
    container: ApplicationContainer = Depends(get_container),
) -> dict[str, Any]:
    return await container.sip_accounts.delete(username)


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
