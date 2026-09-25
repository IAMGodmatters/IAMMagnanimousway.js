#!/usr/bin/env python3
"""External Magnanimous Telecom Stasis supervision verification.

This script is intentionally fail-closed:
- requires HTTPS unless --allow-private-target is explicitly used for local testing;
- never prints or persists the API token;
- proves consent/notice rejection before positive media actions;
- recording verification is independent of browser WebRTC;
- supervisor-audio lifecycle requires an explicit --allow-supervisor-audio gate;
- always attempts cleanup for any created recording/supervision session.

It produces machine-readable JSON evidence without exposing ARI credentials or raw
recording file paths. A successful run is evidence of the tested lifecycle only;
it does not itself promote production feature flags.
"""
from __future__ import annotations

import argparse
import ipaddress
import json
import os
import socket
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any


class VerificationError(RuntimeError):
    pass


@dataclass
class Response:
    status: int
    data: dict[str, Any]


class Client:
    def __init__(self, base_url: str, token: str, timeout: float = 20.0):
        self.base_url = base_url.rstrip("/")
        self.token = token
        self.timeout = timeout

    def request(
        self,
        method: str,
        path: str,
        body: dict[str, Any] | None = None,
        expected: tuple[int, ...] = (200,),
    ) -> Response:
        payload = None if body is None else json.dumps(body).encode("utf-8")
        headers = {
            "accept": "application/json",
            "authorization": f"Bearer {self.token}",
            "user-agent": "Magnanimous-Telecom-Stasis-Live-Verifier/1.0",
        }
        if payload is not None:
            headers["content-type"] = "application/json"
        req = urllib.request.Request(
            self.base_url + path,
            data=payload,
            headers=headers,
            method=method,
        )
        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                raw = resp.read()
                status = int(resp.status)
        except urllib.error.HTTPError as exc:
            raw = exc.read()
            status = int(exc.code)
        except Exception as exc:
            raise VerificationError(f"{method} {path} request failed: {exc.__class__.__name__}") from exc

        try:
            data = json.loads(raw.decode("utf-8")) if raw else {}
        except Exception as exc:
            raise VerificationError(f"{method} {path} returned non-JSON HTTP {status}") from exc
        if status not in expected:
            detail = str(data.get("detail") or data.get("code") or "unexpected response")
            raise VerificationError(f"{method} {path} returned HTTP {status}: {detail[:240]}")
        return Response(status=status, data=data)


def require_public_https(base_url: str, allow_private: bool) -> dict[str, Any]:
    parsed = urllib.parse.urlsplit(base_url)
    if not parsed.hostname:
        raise VerificationError("Telecom Core URL must include a hostname.")
    if parsed.scheme != "https" and not allow_private:
        raise VerificationError("Real-host verification requires HTTPS.")
    resolved: list[str] = []
    try:
        for item in socket.getaddrinfo(parsed.hostname, parsed.port or (443 if parsed.scheme == "https" else 80)):
            address = item[4][0]
            if address not in resolved:
                resolved.append(address)
    except socket.gaierror as exc:
        raise VerificationError("Telecom Core hostname did not resolve.") from exc
    if not allow_private:
        for value in resolved:
            ip = ipaddress.ip_address(value)
            if (
                ip.is_private
                or ip.is_loopback
                or ip.is_link_local
                or ip.is_multicast
                or ip.is_unspecified
                or ip.is_reserved
            ):
                raise VerificationError(f"Telecom Core resolved to a non-public address: {value}")
    return {
        "scheme": parsed.scheme,
        "host": parsed.hostname,
        "port": parsed.port or (443 if parsed.scheme == "https" else 80),
        "resolved_addresses": resolved,
    }


def require_bool(data: dict[str, Any], key: str, expected: bool = True) -> None:
    if bool(data.get(key)) is not expected:
        raise VerificationError(f"Expected {key}={str(expected).lower()}.")


def wait_session_active(client: Client, session_id: str, timeout_seconds: int) -> dict[str, Any]:
    deadline = time.monotonic() + timeout_seconds
    last: dict[str, Any] = {}
    while time.monotonic() < deadline:
        last = client.request(
            "GET",
            f"/v1/supervision/sessions/{urllib.parse.quote(session_id, safe='')}",
        ).data
        if (
            last.get("bridge_active") is True
            and last.get("supervisor_channel_active") is True
            and last.get("snoop_channel_active") is True
            and last.get("event_stream_connected") is True
        ):
            return last
        time.sleep(1.0)
    raise VerificationError(
        "Supervision session did not reach active bridge/supervisor/snoop state "
        f"within {timeout_seconds}s: {json.dumps(last, sort_keys=True)[:500]}"
    )


def sanitize_session(data: dict[str, Any]) -> dict[str, Any]:
    allowed = {
        "session_id",
        "mode",
        "status",
        "target_channel_id",
        "supervisor_endpoint",
        "bridge_active",
        "supervisor_channel_active",
        "snoop_channel_active",
        "recording_active",
        "event_stream_connected",
        "recording",
        "stored",
        "beep",
        "format",
        "max_duration_seconds",
        "jurisdiction",
        "recording_file_exposed",
        "covert_recording",
        "covert_monitoring",
    }
    return {k: v for k, v in data.items() if k in allowed}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default=os.getenv("TELECOM_CORE_URL", ""))
    parser.add_argument("--token", default=os.getenv("TELECOM_API_TOKEN", ""))
    parser.add_argument("--target-channel-id", default=os.getenv("TELECOM_TARGET_CHANNEL_ID", ""))
    parser.add_argument("--supervisor-endpoint", default=os.getenv("TELECOM_SUPERVISOR_ENDPOINT", ""))
    parser.add_argument("--jurisdiction", default=os.getenv("TELECOM_RECORDING_JURISDICTION", ""))
    parser.add_argument("--evidence", default=os.getenv("TELECOM_SUPERVISION_EVIDENCE", "/tmp/magnanimous-supervision/evidence.json"))
    parser.add_argument("--session-timeout-seconds", type=int, default=45)
    parser.add_argument("--record-seconds", type=int, default=3)
    parser.add_argument("--verify-recording", action="store_true")
    parser.add_argument("--verify-supervisor-audio-lifecycle", action="store_true")
    parser.add_argument("--allow-supervisor-audio", action="store_true")
    parser.add_argument("--allow-private-target", action="store_true")
    args = parser.parse_args()

    if not args.base_url or not args.token:
        raise VerificationError("Telecom Core URL and API token are required.")
    if not args.target_channel_id:
        raise VerificationError("An active target Asterisk channel ID is required.")
    if not (args.verify_recording or args.verify_supervisor_audio_lifecycle):
        raise VerificationError("Select at least one verification path.")
    if args.verify_recording and len(args.jurisdiction.strip()) < 2:
        raise VerificationError("Recording verification requires a jurisdiction value.")
    if args.verify_supervisor_audio_lifecycle:
        if not args.allow_supervisor_audio:
            raise VerificationError(
                "Supervisor-audio lifecycle verification is blocked until the separate WebRTC live gate is explicitly allowed."
            )
        if not args.supervisor_endpoint:
            raise VerificationError("Supervisor-audio verification requires an online PJSIP supervisor endpoint.")

    target = require_public_https(args.base_url, args.allow_private_target)
    client = Client(args.base_url, args.token)
    evidence: dict[str, Any] = {
        "schema": "magnanimous.telecom.stasis-live-verification.v1",
        "started_at": int(time.time()),
        "target": target,
        "checks": [],
        "truth_boundary": (
            "Evidence proves only the executed real-host lifecycle. "
            "It does not promote TELECOM_NATIVE_WEBRTC_LIVE or ASTERISK_SUPERVISOR_CONTROL_ENABLED."
        ),
        "credentials_exposed": False,
        "recording_file_exposed": False,
    }

    caps = client.request("GET", "/v1/supervision").data
    event_stream = caps.get("event_stream") if isinstance(caps.get("event_stream"), dict) else {}
    require_bool(caps, "enabled")
    require_bool(event_stream, "connected")
    if caps.get("covert_monitoring") is not False:
        raise VerificationError("Supervision capability must explicitly reject covert monitoring.")
    evidence["checks"].append({
        "name": "private-stasis-event-stream",
        "passed": True,
        "application": event_stream.get("application"),
        "reconnects": event_stream.get("reconnects"),
        "credentials_exposed": event_stream.get("credentials_exposed"),
    })

    # Negative proof: consent/notice must fail before any ARI media action.
    negative = client.request(
        "POST",
        "/v1/recordings",
        {
            "target_channel_id": args.target_channel_id,
            "consent_confirmed": False,
            "notice_confirmed": False,
            "jurisdiction": args.jurisdiction or "verification",
            "max_duration_seconds": 60,
        },
        expected=(422,),
    )
    if negative.data.get("code") != "TELECOM_VALIDATION_ERROR":
        raise VerificationError("Consent/notice rejection did not return TELECOM_VALIDATION_ERROR.")
    evidence["checks"].append({"name": "consent-notice-fail-closed", "passed": True})

    if args.verify_recording:
        recording_session_id = ""
        try:
            started = client.request(
                "POST",
                "/v1/recordings",
                {
                    "target_channel_id": args.target_channel_id,
                    "consent_confirmed": True,
                    "notice_confirmed": True,
                    "jurisdiction": args.jurisdiction,
                    "max_duration_seconds": 60,
                },
                expected=(201,),
            ).data
            recording_session_id = str(started.get("session_id") or "")
            if not recording_session_id:
                raise VerificationError("Recording start did not return a session ID.")
            if started.get("beep") is not True:
                raise VerificationError("Recording start did not confirm the audible recording beep.")
            if started.get("recording_file_exposed") is not False:
                raise VerificationError("Recording API exposed a raw recording file.")
            time.sleep(max(1, min(args.record_seconds, 15)))
            stopped = client.request(
                "DELETE",
                f"/v1/recordings/{urllib.parse.quote(recording_session_id, safe='')}",
            ).data
            if stopped.get("recording") is not False:
                raise VerificationError("Recording stop did not report recording=false.")
            if stopped.get("stored") is not True:
                raise VerificationError("Recording stop did not verify stored Asterisk recording metadata.")
            if stopped.get("recording_file_exposed") is not False:
                raise VerificationError("Recording stop exposed a raw recording file.")
            evidence["checks"].append({
                "name": "headless-bridge-recording",
                "passed": True,
                "start": sanitize_session(started),
                "stop": sanitize_session(stopped),
            })
            recording_session_id = ""
        finally:
            if recording_session_id:
                try:
                    client.request(
                        "DELETE",
                        f"/v1/recordings/{urllib.parse.quote(recording_session_id, safe='')}",
                        expected=(200, 404),
                    )
                except Exception:
                    pass

    if args.verify_supervisor_audio_lifecycle:
        for mode in ("monitor", "whisper", "barge"):
            session_id = ""
            try:
                started = client.request(
                    "POST",
                    "/v1/supervision/sessions",
                    {
                        "target_channel_id": args.target_channel_id,
                        "supervisor_endpoint": args.supervisor_endpoint,
                        "mode": mode,
                        "consent_confirmed": True,
                        "notice_confirmed": True,
                    },
                    expected=(201,),
                ).data
                session_id = str(started.get("session_id") or "")
                if not session_id:
                    raise VerificationError(f"{mode} did not return a session ID.")
                if started.get("covert_monitoring") is not False:
                    raise VerificationError(f"{mode} did not explicitly reject covert monitoring.")
                active = wait_session_active(client, session_id, args.session_timeout_seconds)
                evidence["checks"].append({
                    "name": f"{mode}-bridge-lifecycle",
                    "passed": True,
                    "start": sanitize_session(started),
                    "active": sanitize_session(active),
                    "acoustic_semantics_automatically_proven": False,
                })
            finally:
                if session_id:
                    try:
                        stopped = client.request(
                            "DELETE",
                            f"/v1/supervision/sessions/{urllib.parse.quote(session_id, safe='')}",
                        ).data
                        evidence["checks"].append({
                            "name": f"{mode}-cleanup",
                            "passed": bool(stopped.get("stopped")),
                            "stop": sanitize_session(stopped),
                        })
                    except Exception as exc:
                        evidence["checks"].append({
                            "name": f"{mode}-cleanup",
                            "passed": False,
                            "error": exc.__class__.__name__,
                        })
                        raise

    evidence["completed_at"] = int(time.time())
    evidence["passed"] = all(bool(item.get("passed")) for item in evidence["checks"])
    output = Path(args.evidence)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(evidence, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps({
        "passed": evidence["passed"],
        "checks": [item["name"] for item in evidence["checks"]],
        "evidence": str(output),
        "credentials_exposed": False,
        "recording_file_exposed": False,
    }, sort_keys=True))
    return 0 if evidence["passed"] else 1


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except VerificationError as exc:
        print(f"verification failed: {exc}", file=sys.stderr)
        raise SystemExit(1)
