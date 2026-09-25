from __future__ import annotations

from dataclasses import dataclass

from .adapters.asterisk import AsteriskAriClient, AsteriskSipCarrierBridge
from .adapters.stasis_events import AriStasisEventStream
from .adapters.callbacks import CallbackUrlPolicy, WebhookStatusPublisher
from .adapters.sip_subscribers import PostgresSipSubscriberStore
from .config import TelecomSettings
from .security import TelecomTokenAuthenticator
from .services.calls import CallService
from .services.health import HealthService
from .services.monitoring import CarrierCallMonitor
from .services.sip_accounts import SipAccountService
from .services.supervision import SupervisorService
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
    stasis_events: AriStasisEventStream
    supervision: SupervisorService


def build_container(settings: TelecomSettings | None = None) -> ApplicationContainer:
    """Composition root. Concrete infrastructure is assembled here and injected into services."""
    resolved = settings or TelecomSettings.from_env()
    ari = AsteriskAriClient(resolved)
    bridge = AsteriskSipCarrierBridge(ari, resolved)
    callback_policy = CallbackUrlPolicy(resolved)
    publisher = WebhookStatusPublisher(resolved)
    monitor = CarrierCallMonitor(bridge, publisher, resolved)
    calls = CallService(bridge, monitor, callback_policy, resolved)
    health = HealthService(bridge, monitor, resolved)
    auth = TelecomTokenAuthenticator(resolved)
    subscriber_store = PostgresSipSubscriberStore(resolved)
    sip_accounts = SipAccountService(subscriber_store, resolved)
    webrtc_sessions = WebRtcSessionService(ari, resolved)
    stasis_events = AriStasisEventStream(resolved)
    supervision = SupervisorService(ari, stasis_events, resolved)
    return ApplicationContainer(
        settings=resolved,
        auth=auth,
        carrier_bridge=bridge,
        calls=calls,
        health=health,
        sip_accounts=sip_accounts,
        webrtc_sessions=webrtc_sessions,
        stasis_events=stasis_events,
        supervision=supervision,
    )


_container: ApplicationContainer | None = None


def get_container() -> ApplicationContainer:
    global _container
    if _container is None:
        _container = build_container()
    return _container
