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
    webrtc_runtime_tls_cert_file: str = "/var/lib/asterisk/tls/fullchain.pem"
    webrtc_runtime_tls_key_file: str = "/var/lib/asterisk/tls/privkey.pem"
    sip_db_host: str = "127.0.0.1"
    sip_db_port: int = 5433
    sip_db_name: str = "magnanimous_sip"
    sip_db_user: str = "magnanimous_sip"
    sip_db_password: str = ""

    @classmethod
    def from_env(cls) -> "TelecomSettings":
        hosts = tuple(
            item.strip().lower()
            for item in _env("MAGNANIMOUS_WEBHOOK_HOSTS", "iammagnanimousway.com").split(",")
            if item.strip()
        )
        return cls(
            api_token=_env("TELECOM_API_TOKEN"),
            webhook_secret=_env("TELECOM_WEBHOOK_SECRET"),
            webhook_url=_env("MAGNANIMOUS_WEBHOOK_URL"),
            webhook_hosts=hosts,
            ari_url=_env("ASTERISK_ARI_URL", "http://127.0.0.1:8088/ari").rstrip("/"),
            ari_user=_env("ASTERISK_ARI_USER"),
            ari_password=_env("ASTERISK_ARI_PASSWORD"),
            caller_id=_env("MAGNANIMOUS_CALLER_ID"),
            carrier_endpoint=_env("CARRIER_SIP_ENDPOINT", "pstn-trunk"),
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
            webrtc_runtime_tls_cert_file=_env("ASTERISK_RUNTIME_TLS_CERT_FILE", "/var/lib/asterisk/tls/fullchain.pem"),
            webrtc_runtime_tls_key_file=_env("ASTERISK_RUNTIME_TLS_KEY_FILE", "/var/lib/asterisk/tls/privkey.pem"),
            sip_db_host=_env("SIP_DB_HOST", "127.0.0.1"),
            sip_db_port=max(1, _env_int("SIP_DB_PORT", 5433)),
            sip_db_name=_env("SIP_DB_NAME", "magnanimous_sip"),
            sip_db_user=_env("SIP_DB_USER", "magnanimous_sip"),
            sip_db_password=_env("SIP_DB_PASSWORD"),
        )
