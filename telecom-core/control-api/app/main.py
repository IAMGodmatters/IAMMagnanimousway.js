import asyncio
import hmac
import os
import re
import uuid
from typing import Any
from urllib.parse import urlparse

import httpx
from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(
    title="Magnanimous Telecom Core",
    version="0.2.0",
    docs_url="/docs",
    redoc_url=None,
)

E164 = re.compile(r"^\+[1-9]\d{6,14}$")
MONITOR_TASKS: set[asyncio.Task[Any]] = set()


def env(name: str, default: str = "") -> str:
    return os.getenv(name, default).strip()


def normalize_number(value: str) -> str:
    number = re.sub(r"[\s().-]", "", value or "")
    if not E164.fullmatch(number):
        raise HTTPException(status_code=422, detail="Phone numbers must use E.164 format, for example +15551234567.")
    return number


def require_token(authorization: str | None = Header(default=None)) -> None:
    configured = env("TELECOM_API_TOKEN")
    if not configured:
        raise HTTPException(status_code=503, detail="Telecom API authentication is not configured.")
    supplied = ""
    if authorization and authorization.lower().startswith("bearer "):
        supplied = authorization[7:].strip()
    if not supplied or not hmac.compare_digest(supplied, configured):
        raise HTTPException(status_code=401, detail="Invalid telecom API token.")


class OutboundCall(BaseModel):
    call_id: int | str
    tenant_id: str = Field(min_length=1, max_length=200)
    to: str
    from_: str | None = Field(default=None, alias="from")
    agent_id: str | None = None
    queue_id: str | None = None
    webhook_url: str | None = None


class HangupRequest(BaseModel):
    reason: str = Field(default="normal", max_length=120)


async def ari_request(method: str, path: str, *, params: dict[str, Any] | None = None, body: Any = None) -> httpx.Response:
    base = env("ASTERISK_ARI_URL", "http://127.0.0.1:8088/ari").rstrip("/")
    username = env("ASTERISK_ARI_USER")
    password = env("ASTERISK_ARI_PASSWORD")
    if not username or not password:
        raise HTTPException(status_code=503, detail="Asterisk ARI credentials are not configured.")
    try:
        async with httpx.AsyncClient(timeout=15.0, auth=(username, password)) as client:
            response = await client.request(method, f"{base}{path}", params=params, json=body)
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"Asterisk is unavailable: {exc.__class__.__name__}") from exc
    return response


def callback_url(request_url: str | None) -> str | None:
    candidate = env("MAGNANIMOUS_WEBHOOK_URL") or (request_url or "").strip()
    if not candidate:
        return None
    parsed = urlparse(candidate)
    allowed = {
        host.strip().lower()
        for host in env("MAGNANIMOUS_WEBHOOK_HOSTS", "iammagnanimousway.com").split(",")
        if host.strip()
    }
    if parsed.scheme != "https" or not parsed.hostname or parsed.hostname.lower() not in allowed:
        return None
    return candidate


async def send_status_callback(url: str, provider_call_id: str, status: str, detail: str = "") -> None:
    secret = env("TELECOM_WEBHOOK_SECRET")
    if not secret:
        return
    payload = {
        "provider_call_id": provider_call_id,
        "call_id": provider_call_id,
        "status": status,
        "event_type": "carrier-status",
        "detail": detail,
        "provider": "Magnanimous Telecom",
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            await client.post(
                url,
                headers={"x-iam-webhook-secret": secret, "content-type": "application/json"},
                json=payload,
            )
    except httpx.HTTPError:
        # Call control must never fail only because a status callback could not be delivered.
        pass


def map_channel_state(state: str) -> str:
    normalized = (state or "").strip().lower()
    if normalized in {"ring", "ringing"}:
        return "ringing"
    if normalized == "up":
        return "connected"
    if normalized in {"down", "dialing", "dial"}:
        return "dialing"
    return normalized or "dialing"


async def monitor_call(provider_call_id: str, url: str) -> None:
    last_status = "dialing"
    await send_status_callback(url, provider_call_id, last_status, "Call accepted by Magnanimous Telecom.")
    # Poll ARI only for the lifetime of this call. A future multi-node carrier edge can replace
    # this with a durable event bus without changing the Worker callback contract.
    for _ in range(1800):
        await asyncio.sleep(2)
        try:
            response = await ari_request("GET", f"/channels/{provider_call_id}")
        except HTTPException:
            continue
        if response.status_code == 404:
            await send_status_callback(url, provider_call_id, "ended", "Asterisk channel ended.")
            return
        if not response.is_success:
            continue
        try:
            state = map_channel_state(str(response.json().get("state", "")))
        except (ValueError, TypeError):
            continue
        if state != last_status:
            last_status = state
            await send_status_callback(url, provider_call_id, state)
    await send_status_callback(url, provider_call_id, "ended", "Call monitor reached its safety timeout.")


def start_monitor(provider_call_id: str, url: str | None) -> None:
    if not url or not env("TELECOM_WEBHOOK_SECRET"):
        return
    task = asyncio.create_task(monitor_call(provider_call_id, url))
    MONITOR_TASKS.add(task)
    task.add_done_callback(MONITOR_TASKS.discard)


@app.get("/health")
async def health() -> dict[str, Any]:
    asterisk_ok = False
    try:
        response = await ari_request("GET", "/asterisk/info")
        asterisk_ok = response.is_success
    except HTTPException:
        asterisk_ok = False
    return {
        "ok": asterisk_ok,
        "service": "Magnanimous Telecom Core",
        "asterisk": "ready" if asterisk_ok else "unavailable",
        "public_number": env("MAGNANIMOUS_CALLER_ID") or None,
        "identity": "Magnanimous",
        "active_monitors": len(MONITOR_TASKS),
    }


@app.post("/v1/calls", status_code=201, dependencies=[Depends(require_token)])
async def place_call(request: OutboundCall) -> dict[str, Any]:
    destination = normalize_number(request.to)
    caller_id = normalize_number(request.from_ or env("MAGNANIMOUS_CALLER_ID"))
    provider_call_id = str(uuid.uuid4())

    params = {
        "endpoint": f"Local/{destination}@magnanimous-outbound/n",
        "context": "magnanimous-ai",
        "extension": "s",
        "priority": 1,
        "callerId": caller_id,
        "timeout": 60000,
        "channelId": provider_call_id,
    }
    variables = {
        "MAG_CALL_ID": str(request.call_id),
        "MAG_PROVIDER_CALL_ID": provider_call_id,
        "MAG_TENANT_ID": request.tenant_id,
        "MAG_FROM": caller_id,
        "MAG_TO": destination,
        "MAG_AGENT_ID": request.agent_id or "",
        "MAG_QUEUE_ID": request.queue_id or "",
    }
    response = await ari_request("POST", "/channels", params=params, body={"variables": variables})
    if not response.is_success:
        detail = response.text[:1000] or "Asterisk rejected the call."
        raise HTTPException(status_code=502, detail=detail)

    start_monitor(provider_call_id, callback_url(request.webhook_url))
    return {
        "provider_call_id": provider_call_id,
        "call_id": provider_call_id,
        "status": "dialing",
        "provider": "Magnanimous Telecom",
        "to": destination,
        "from": caller_id,
    }


@app.delete("/v1/calls/{provider_call_id}", dependencies=[Depends(require_token)])
async def hangup_call(provider_call_id: str, request: HangupRequest | None = None) -> dict[str, Any]:
    if not re.fullmatch(r"[0-9a-fA-F-]{36}", provider_call_id):
        raise HTTPException(status_code=422, detail="Invalid call id.")
    response = await ari_request("DELETE", f"/channels/{provider_call_id}")
    if response.status_code not in (204, 404):
        raise HTTPException(status_code=502, detail=response.text[:1000] or "Asterisk rejected the hangup.")
    return {
        "ok": True,
        "provider_call_id": provider_call_id,
        "status": "ended",
        "reason": (request.reason if request else "normal"),
    }


@app.get("/v1/calls/{provider_call_id}", dependencies=[Depends(require_token)])
async def get_call(provider_call_id: str) -> dict[str, Any]:
    response = await ari_request("GET", f"/channels/{provider_call_id}")
    if response.status_code == 404:
        return {"provider_call_id": provider_call_id, "status": "ended"}
    if not response.is_success:
        raise HTTPException(status_code=502, detail=response.text[:1000] or "Unable to read Asterisk channel.")
    channel = response.json()
    return {
        "provider_call_id": provider_call_id,
        "status": map_channel_state(str(channel.get("state", ""))),
        "channel": channel.get("name"),
        "caller": channel.get("caller", {}),
        "connected": channel.get("connected", {}),
    }
