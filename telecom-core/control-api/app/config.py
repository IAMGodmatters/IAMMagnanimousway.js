from __future__ import annotations

from dataclasses import dataclass
import os


def _env(name: str, default: str = "") -> str:
    return os.getenv(name, default).strip()


def _env_int(name: str, default: int) -> int:
    raw = _env(name)
    if not raw:
        return default
    try:
        return int(raw)
    except ValueError:
        return default


def _env_bool(name: str, default: bool = False) -> bool:
    raw = _env(name)
    if not raw:
        return default
    return raw.lower() in {"1", "true", "yes", "on"}


def _env_float(name: str, default: float) -> float:
    raw = _env(name)
    if not raw:
        return default
    try:
        return float(raw)
    except ValueError:
        return default


@dataclass(frozen=True)
class TelecomSettings:
    api_token: str
    webhook_secret: str
    webhook_url: str
    webhook_hosts: tuple[str, ...]
    ari_url: str
    ari_user: str
    ari_password: str
    caller_id: str
    carrier_endpoint: str
    carrier_dial_context: str
    carrier_timeout_ms: int
    monitor_interval_seconds: float
    monitor_max_polls: int
    sip_domain: str = ""
    webrtc_enabled: bool = False
    webrtc_public_url: str = ""
    webrtc_https_port: int = 8089
    webrtc_dynamic_sessions_enabled: bool = False
    webrtc_session_ttl_seconds: int = 3600
    webrtc_turn_urls: tuple[str, ...] = ()
    webrtc_turn_auth_secret: str = ""
    webrtc_turn_force_relay: bool = False
    webrtc_runtime_tls_cert_file: str = "/var/lib/asterisk/tls/fullchain.pem"
    webrtc_runtime_tls_key_file: str = "/var/lib/asterisk/tls/privkey.pem"
    sip_db_host: str = "127.0.0.1"
    sip_db_port: int = 5433
    sip_db_name: str = "magnanimous_sip"
    sip_db_user: str = "magnanimous_sip"
    sip_db_password: str = ""
    carrier_secondary_endpoint: str = ""
    carrier_allowed_endpoints: tuple[str, ...] = ()
    stasis_bridge_enabled: bool = False
    stasis_app: str = "magnanimous-native-call"
    stasis_agent_endpoint: str = "PJSIP/9000"
    stasis_reconnect_attempts: int = 5
    stasis_reconnect_delay_seconds: float = 1.0
    supervisor_audio_enabled: bool = False
    bridge_recording_enabled: bool = False
    bridge_recording_format: str = "wav"
    bridge_recording_max_seconds: int = 14400

    @classmethod
    def from_env(cls) -> "TelecomSettings":
        hosts = tuple(
            item.strip().lower()
            for item in _env("MAGNANIMOUS_WEBHOOK_HOSTS", "iammagnanimousway.com").split(",")
            if item.strip()
        )
        turn_urls = tuple(
            item.strip()
            for item in _env("MAGNANIMOUS_TURN_URLS").split(",")
            if item.strip()
        )
        carrier_endpoint = _env("CARRIER_SIP_ENDPOINT", "pstn-trunk")
        carrier_secondary_endpoint = _env("CARRIER_SIP_SECONDARY_ENDPOINT")
        carrier_allowed = tuple(dict.fromkeys(
            item for item in [
                carrier_endpoint,
                carrier_secondary_endpoint,
                *[x.strip() for x in _env("CARRIER_SIP_ALLOWED_ENDPOINTS").split(",") if x.strip()],
            ] if item
        ))
        ai_extension = _env("MAGNANIMOUS_AI_EXTENSION", "9000")
        return cls(
            api_token=_env("TELECOM_API_TOKEN"),
            webhook_secret=_env("TELECOM_WEBHOOK_SECRET"),
            webhook_url=_env("MAGNANIMOUS_WEBHOOK_URL"),
            webhook_hosts=hosts,
            ari_url=_env("ASTERISK_ARI_URL", "http://127.0.0.1:8088/ari").rstrip("/"),
            ari_user=_env("ASTERISK_ARI_USER"),
            ari_password=_env("ASTERISK_ARI_PASSWORD"),
            caller_id=_env("MAGNANIMOUS_CALLER_ID"),
            carrier_endpoint=carrier_endpoint,
            carrier_dial_context=_env("CARRIER_DIAL_CONTEXT", "magnanimous-outbound"),
            carrier_timeout_ms=max(1000, _env_int("CARRIER_CALL_TIMEOUT_MS", 60000)),
            monitor_interval_seconds=max(0.5, _env_float("CARRIER_MONITOR_INTERVAL_SECONDS", 2.0)),
            monitor_max_polls=max(1, _env_int("CARRIER_MONITOR_MAX_POLLS", 1800)),
            sip_domain=_env("MAGNANIMOUS_SIP_DOMAIN"),
            webrtc_enabled=_env_bool("ASTERISK_WEBRTC_ENABLED", False),
            webrtc_public_url=_env("ASTERISK_WEBRTC_PUBLIC_URL"),
            webrtc_https_port=max(1, _env_int("ASTERISK_HTTPS_PORT", 8089)),
            webrtc_dynamic_sessions_enabled=_env_bool("ASTERISK_WEBRTC_DYNAMIC_SESSIONS_ENABLED", False),
            webrtc_session_ttl_seconds=max(300, min(3600, _env_int("ASTERISK_WEBRTC_SESSION_TTL_SECONDS", 3600))),
            webrtc_turn_urls=turn_urls,
            webrtc_turn_auth_secret=_env("MAGNANIMOUS_TURN_AUTH_SECRET"),
            webrtc_turn_force_relay=_env_bool("MAGNANIMOUS_TURN_FORCE_RELAY", False),
            webrtc_runtime_tls_cert_file=_env("ASTERISK_RUNTIME_TLS_CERT_FILE", "/var/lib/asterisk/tls/fullchain.pem"),
            webrtc_runtime_tls_key_file=_env("ASTERISK_RUNTIME_TLS_KEY_FILE", "/var/lib/asterisk/tls/privkey.pem"),
            sip_db_host=_env("SIP_DB_HOST", "127.0.0.1"),
            sip_db_port=max(1, _env_int("SIP_DB_PORT", 5433)),
            sip_db_name=_env("SIP_DB_NAME", "magnanimous_sip"),
            sip_db_user=_env("SIP_DB_USER", "magnanimous_sip"),
            sip_db_password=_env("SIP_DB_PASSWORD"),
            carrier_secondary_endpoint=carrier_secondary_endpoint,
            carrier_allowed_endpoints=carrier_allowed,
            stasis_bridge_enabled=_env_bool("ASTERISK_STASIS_BRIDGE_ENABLED", False),
            stasis_app=_env("ASTERISK_STASIS_APP", "magnanimous-native-call") or "magnanimous-native-call",
            stasis_agent_endpoint=_env("ASTERISK_STASIS_AGENT_ENDPOINT", f"PJSIP/{ai_extension}"),
            stasis_reconnect_attempts=max(1, min(10, _env_int("ASTERISK_STASIS_RECONNECT_ATTEMPTS", 5))),
            stasis_reconnect_delay_seconds=max(0.25, min(5.0, _env_float("ASTERISK_STASIS_RECONNECT_DELAY_SECONDS", 1.0))),
            supervisor_audio_enabled=_env_bool("ASTERISK_SUPERVISOR_AUDIO_ENABLED", False),
            bridge_recording_enabled=_env_bool("ASTERISK_BRIDGE_RECORDING_ENABLED", False),
            bridge_recording_format=_env("ASTERISK_BRIDGE_RECORDING_FORMAT", "wav") or "wav",
            bridge_recording_max_seconds=max(60, min(28800, _env_int("ASTERISK_BRIDGE_RECORDING_MAX_SECONDS", 14400))),
        )
