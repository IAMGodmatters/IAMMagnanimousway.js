from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Protocol


@dataclass(frozen=True)
class CarrierCallRequest:
    provider_call_id: str
    business_call_id: str
    tenant_id: str
    destination: str
    caller_id: str
    agent_id: str = ""
    queue_id: str = ""


@dataclass(frozen=True)
class CarrierCallState:
    provider_call_id: str
    status: str
    channel: str | None = None
    caller: dict[str, Any] | None = None
    connected: dict[str, Any] | None = None


class CarrierBridge(Protocol):
    async def originate(self, call: CarrierCallRequest) -> CarrierCallState: ...

    async def hangup(self, provider_call_id: str) -> None: ...

    async def get_call(self, provider_call_id: str) -> CarrierCallState: ...

    async def health(self) -> dict[str, Any]: ...

    def describe(self) -> dict[str, Any]: ...


class CallbackPolicy(Protocol):
    def resolve(self, requested_url: str | None) -> str | None: ...


class StatusPublisher(Protocol):
    async def publish(self, url: str, provider_call_id: str, status: str, detail: str = "") -> None: ...
