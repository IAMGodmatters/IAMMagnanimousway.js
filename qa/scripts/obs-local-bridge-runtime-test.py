from __future__ import annotations

import base64
import hashlib
import json
import socket
import struct
import sys
import threading
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "local-bridge"))
import bridge_agent  # noqa: E402


GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
PASSWORD = "Magnanimous OBS test password"


def recv_exact(sock, count):
    data = bytearray()
    while len(data) < count:
        chunk = sock.recv(count - len(data))
        if not chunk:
            raise RuntimeError("peer disconnected")
        data.extend(chunk)
    return bytes(data)


def recv_client_frame(sock):
    first, second = recv_exact(sock, 2)
    assert first & 0x80, "client frame must be final"
    opcode = first & 0x0F
    assert second & 0x80, "client-to-server frames must be masked"
    size = second & 0x7F
    if size == 126:
        size = struct.unpack("!H", recv_exact(sock, 2))[0]
    elif size == 127:
        size = struct.unpack("!Q", recv_exact(sock, 8))[0]
    assert size <= 2_000_000, "test frame exceeded safety bound"
    mask = recv_exact(sock, 4)
    payload = recv_exact(sock, size)
    return opcode, bytes(value ^ mask[index & 3] for index, value in enumerate(payload))


def send_server_text(sock, value):
    payload = json.dumps(value, separators=(",", ":")).encode("utf-8")
    size = len(payload)
    if size < 126:
        header = bytes([0x81, size])
    elif size < 65536:
        header = bytes([0x81, 126]) + struct.pack("!H", size)
    else:
        header = bytes([0x81, 127]) + struct.pack("!Q", size)
    sock.sendall(header + payload)


def expected_auth(password, salt, challenge):
    secret = base64.b64encode(hashlib.sha256((password + salt).encode()).digest()).decode()
    return base64.b64encode(hashlib.sha256((secret + challenge).encode()).digest()).decode()


def fake_obs_server(listener, errors):
    conn = None
    try:
        conn, _ = listener.accept()
        conn.settimeout(5)
        request = bytearray()
        while b"\r\n\r\n" not in request:
            request.extend(conn.recv(2048))
            assert len(request) <= 16384, "HTTP handshake header too large"
        headers = {}
        for line in bytes(request).decode("iso-8859-1").split("\r\n")[1:]:
            name, separator, value = line.partition(":")
            if separator:
                headers[name.strip().lower()] = value.strip()
        key = headers.get("sec-websocket-key")
        assert key, "missing WebSocket challenge key"
        accept = base64.b64encode(hashlib.sha1((key + GUID).encode()).digest()).decode()
        conn.sendall((
            "HTTP/1.1 101 Switching Protocols\r\n"
            "Upgrade: websocket\r\n"
            "Connection: Upgrade\r\n"
            f"Sec-WebSocket-Accept: {accept}\r\n\r\n"
        ).encode("ascii"))

        salt, challenge = "salt-value", "challenge-value"
        send_server_text(conn, {
            "op": 0,
            "d": {
                "rpcVersion": 1,
                "authentication": {"salt": salt, "challenge": challenge},
            },
        })
        opcode, payload = recv_client_frame(conn)
        assert opcode == 1
        identify = json.loads(payload.decode("utf-8"))
        assert identify.get("op") == 1
        assert identify["d"].get("rpcVersion") == 1
        assert identify["d"].get("eventSubscriptions") == 0
        assert identify["d"].get("authentication") == expected_auth(PASSWORD, salt, challenge)
        send_server_text(conn, {"op": 2, "d": {"negotiatedRpcVersion": 1}})

        opcode, payload = recv_client_frame(conn)
        assert opcode == 1
        request = json.loads(payload.decode("utf-8"))
        assert request.get("op") == 6
        details = request["d"]
        assert details.get("requestType") == "GetVersion"
        request_id = details.get("requestId")
        assert isinstance(request_id, str) and request_id.startswith("magnanimous-")
        send_server_text(conn, {
            "op": 7,
            "d": {
                "requestType": "GetVersion",
                "requestId": request_id,
                "requestStatus": {"result": True, "code": 100},
                "responseData": {"obsVersion": "31.0-test", "obsWebSocketVersion": "5.5-test"},
            },
        })
    except Exception as exc:
        errors.append(f"{type(exc).__name__}: {exc}")
    finally:
        if conn:
            try:
                conn.close()
            except Exception:
                pass
        listener.close()


def main():
    listener = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    listener.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    listener.bind(("127.0.0.1", 0))
    listener.listen(1)
    port = listener.getsockname()[1]
    errors = []
    thread = threading.Thread(target=fake_obs_server, args=(listener, errors), daemon=True)
    thread.start()
    with bridge_agent._ObsWebSocket(port, PASSWORD) as obs:
        version = obs.request("GetVersion")
    thread.join(timeout=6)
    assert not thread.is_alive(), "mock OBS server did not finish"
    assert not errors, "; ".join(errors)
    assert version["obsVersion"] == "31.0-test"
    assert version["obsWebSocketVersion"] == "5.5-test"
    assert bridge_agent._ObsWebSocket._obs_auth(PASSWORD, "salt-value", "challenge-value") == expected_auth(PASSWORD, "salt-value", "challenge-value")
    print("PASS OBS RFC6455 loopback upgrade")
    print("PASS OBS v5 Hello / Identify challenge-response authentication")
    print("PASS OBS v5 correlated GetVersion request and response")
    print("PASS client masks outbound frames and keeps event subscriptions disabled")
    print("Magnanimous OBS local bridge runtime test passed.")


if __name__ == "__main__":
    main()
