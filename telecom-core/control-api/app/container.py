from __future__ import annotations

from dataclasses import dataclass

from .adapters.asterisk import AsteriskAriClient, AsteriskSipCarrierBridge
from .adapters.callbacks import CallbackUrlPolicy, WebhookStatusPublisher
from .adapters.sip_subscribers import PostgresSipSubscriberStore
from .config import TelecomSettings
from .security import TelecomTokenAuthenticator
from .services.calls import CallService
from .services.health import HealthService
from .services.monitoring import CarrierCallMonitor
from .services.sip_accounts import SipAccountService
from .services.stasis_bridges import AsteriskStasisBridgeService
from .services.webrtc_sessions import WebRtcSessionService


@dataclass(frozen=True)
class ApplicationContainer:
    settings: TelecomSettings
    auth: TelecomTokenAuthenticator
    carrier_bridge: AsteriskSipCarrierBridge
    calls: CallService
    health: HealthService
    sip_accounts: SipAccountService
    webrtc_sessions: WebRtcSessionService
    stasis: AsteriskStasisBridgeService


def build_container(settings: TelecomSettings | None = None) -> ApplicationContainer:
    """Composition root. Concrete infrastructure is assembled here and injected into services."""
    resolved = settings or TelecomSettings.from_env()
    ari = AsteriskAriClient(resolved)
    webrtc_sessions = WebRtcSessionService(ari, resolved)
    stasis = AsteriskStasisBridgeService(ari, resolved, webrtc_sessions)
    bridge = AsteriskSipCarrierBridge(ari, resolved, stasis)
    callback_policy = CallbackUrlPolicy(resolved)
    publisher = WebhookStatusPublisher(resolved)
    monitor = CarrierCallMonitor(bridge, publisher, resolved)
    calls = CallService(bridge, monitor, callback_policy, resolved)
    health = HealthService(bridge, monitor, resolved)
    auth = TelecomTokenAuthenticator(resolved)
    subscriber_store = PostgresSipSubscriberStore(resolved)
    sip_accounts = SipAccountService(subscriber_store, resolved)
    return ApplicationContainer(
        settings=resolved,
        auth=auth,
        carrier_bridge=bridge,
        calls=calls,
        health=health,
        sip_accounts=sip_accounts,
        webrtc_sessions=webrtc_sessions,
        stasis=stasis,
    )


_container: ApplicationContainer | None = None


def get_container() -> ApplicationContainer:
    global _container
    if _container is None:
        _container = build_container()
    return _container
