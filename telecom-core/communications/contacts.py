"""Privacy-oriented contact discovery boundary.

Raw address-book contents must not become server-side discovery identifiers.
Production adapters should use normalized, keyed/hashed identifiers with documented
privacy and deletion behavior.
"""
from typing import Protocol


class ContactDiscoveryPort(Protocol):
    async def resolve(self, actor_id: str, blinded_identifiers: list[str]) -> dict[str, str]: ...
