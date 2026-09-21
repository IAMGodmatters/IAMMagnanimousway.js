#!/usr/bin/env python3
"""Magnanimous Local Bridge.

Outbound-only local execution agent for I AM MAGNANIMOUS WAY™.
No inbound listener. No generic remote shell. Secrets remain on the local machine.
"""
from __future__ import annotations

import argparse
import base64
import ipaddress
import json
import os
import platform
import re
import shlex
import shutil
import socket
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

APP_DIR = Path.home() / ".magnanimous"
CONFIG_PATH = APP_DIR / "local-bridge.json"
BROWSER_DIR = APP_DIR / "browser-profiles"
MAX_OUTPUT = 250_000
DEFAULT_SERVER = "https://iammagnanimousway.com"
BROWSER_SESSIONS = {}
SAFE_PROJECT_SCRIPTS = {
    "project_test": "test",
    "project_lint": "lint",
    "project_typecheck": "typecheck",
    "project_build": "build",
}
BASE_CAPS = {
    "system_info","health","workspace_list","read_file","search_text",
    "git_status","git_diff","git_log","web_fetch",
    "apply_patch","git_create_branch","git_commit",
}


def _json_bytes(value):
    return json.dumps(value, separators=(",", ":")).encode("utf-8")


def _request(server, path, *, method="GET", data=None, token=None, timeout=35):
    url = server.rstrip("/") + path
    headers = {"Accept": "application/json", "User-Agent": "Magnanimous-Local-Bridge/1.0"}
    if data is not None:
        headers["Content-Type"] = "application/json"
    if token:
        headers["Authorization"] = f"Bridge {token}"
    req = urllib.request.Request(url, data=_json_bytes(data) if data is not None else None, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            raw = response.read(MAX_OUTPUT + 1)
            if len(raw) > MAX_OUTPUT:
                raise RuntimeError("Bridge response exceeded the local safety limit.")
            return response.status, json.loads(raw.decode("utf-8") or "{}")
    except urllib.error.HTTPError as exc:
        raw = exc.read(MAX_OUTPUT).decode("utf-8", "replace")
        try:
            detail = json.loads(raw)
        except Exception:
            detail = {"detail": raw or f"HTTP {exc.code}"}
        return exc.code, detail


def _save_config(config):
    APP_DIR.mkdir(parents=True, exist_ok=True)
    tmp = CONFIG_PATH.with_suffix(".tmp")
    tmp.write_text(json.dumps(config, indent=2), encoding="utf-8")
    if os.name != "nt":
        os.chmod(tmp, 0o600)
    tmp.replace(CONFIG_PATH)
    if os.name != "nt":
        os.chmod(CONFIG_PATH, 0o600)
    elif shutil.which("icacls"):
        user = os.environ.get("USERNAME")
        if user:
            subprocess.run(["icacls", str(CONFIG_PATH), "/inheritance:r", "/grant:r", f"{user}:(R,W)"], capture_output=True, text=True)


def _load_config():
    if not CONFIG_PATH.exists():
        raise RuntimeError(f"Bridge is not paired. Run: {Path(sys.argv[0]).name} pair ...")
    data = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    if not data.get("server") or not data.get("token"):
        raise RuntimeError("Local bridge config is incomplete.")
    return data


def _roots(config):
    out = []
    for item in config.get("roots") or []:
        p = Path(item).expanduser().resolve()
        if p.exists() and p.is_dir():
            out.append(p)
    return out


def _within(path: Path, root: Path):
    try:
        path.relative_to(root)
        return True
    except ValueError:
        return False


def _workspace(config, value):
    raw = str(value or "").strip()
    if not raw:
        raise RuntimeError("workspace is required")
    candidate = Path(raw).expanduser().resolve()
    for root in _roots(config):
        if candidate == root or _within(candidate, root):
            return candidate
    raise RuntimeError("Requested workspace is outside the bridge allowlisted roots.")


def _path_in_workspace(workspace: Path, value):
    raw = str(value or "").strip()
    if not raw:
        raise RuntimeError("path is required")
    candidate = (workspace / raw).resolve() if not Path(raw).is_absolute() else Path(raw).expanduser().resolve()
    if candidate != workspace and not _within(candidate, workspace):
        raise RuntimeError("Requested path escapes the selected workspace.")
    return candidate


def _run(argv, *, cwd=None, timeout=180, input_text=None):
    if not isinstance(argv, list) or not argv or any(not isinstance(x, str) for x in argv):
        raise RuntimeError("Invalid local command.")
    result = subprocess.run(
        argv,
        cwd=str(cwd) if cwd else None,
        input=input_text,
        capture_output=True,
        text=True,
        timeout=timeout,
        shell=False,
        env={**os.environ, "CI": os.environ.get("CI", "1")},
    )
    stdout = (result.stdout or "")[-MAX_OUTPUT:]
    stderr = (result.stderr or "")[-MAX_OUTPUT:]
    return {"code": result.returncode, "stdout": stdout, "stderr": stderr}


def _git(workspace, *args, timeout=120):
    if not shutil.which("git"):
        raise RuntimeError("git is not installed on this machine.")
    return _run(["git", *args], cwd=workspace, timeout=timeout)


def _package_scripts(workspace):
    package = workspace / "package.json"
    if not package.exists():
        return {}
    try:
        return (json.loads(package.read_text(encoding="utf-8")) or {}).get("scripts") or {}
    except Exception:
        return {}


def _detect_netwalk(config):
    configured = config.get("netwalk_toolkit") or os.environ.get("MAGNANIMOUS_NETWALK_TOOLKIT")
    if not configured:
        return None
    root = Path(configured).expanduser().resolve()
    return root if (root / "scripts").is_dir() else None


def capabilities(config):
    caps = set(BASE_CAPS)
    if shutil.which("git"):
        caps.update({"git_status","git_diff","git_log","apply_patch","git_create_branch","git_commit"})
    for root in _roots(config):
        scripts = _package_scripts(root)
        for action, script in SAFE_PROJECT_SCRIPTS.items():
            if script in scripts:
                caps.add(action)
    if _detect_netwalk(config):
        caps.update({"netwalk_probe","netwalk_scan","netwalk_diag","netwalk_map","netwalk_report"})
    if shutil.which("ssh"):
        caps.update({"ssh_profile_list","ssh_read","ssh_command"})
    try:
        import playwright.sync_api  # noqa: F401
        caps.update({
            "browser_search","browser_fetch","browser_fetch_batch","browser_research",
            "browser_read_flow","browser_action_flow",
            "browser_profile_list","browser_profile_setup","browser_profile_create","browser_profile_delete",
            "browser_session_start","browser_session_read","browser_session_action","browser_session_end"
        })
    except Exception:
        pass
    return sorted(caps)


def _ssh_alias(value):
    host = str(value or "").strip()
    if not re.fullmatch(r"[A-Za-z0-9._-]{1,128}", host):
        raise RuntimeError("SSH host must be a safe alias from local SSH config.")
    return host


def _ssh_config_aliases():
    path = Path.home() / ".ssh" / "config"
    if not path.exists():
        return []
    aliases = []
    try:
        text = path.read_text(encoding="utf-8", errors="replace")
    except Exception:
        return []
    for line in text.splitlines():
        match = re.match(r"^\\s*Host\\s+(.+)$", line, re.IGNORECASE)
        if not match:
            continue
        for token in match.group(1).split():
            if "*" in token or "?" in token:
                continue
            if re.fullmatch(r"[A-Za-z0-9._-]{1,128}", token):
                aliases.append(token)
    return sorted(set(aliases))


def _ssh_has_secret(command):
    return bool(
        re.search(r"-----BEGIN [A-Z ]*PRIVATE KEY-----", command, re.IGNORECASE)
        or re.search(r"\\b(?:password|passwd|token|secret|api[_-]?key)\\s*=\\s*\\S+", command, re.IGNORECASE)
        or re.search(r"\\b(?:sk-[A-Za-z0-9_-]{12,}|gh[pousr]_[A-Za-z0-9_]{20,})\\b", command)
    )


def _ssh_read_only(command):
    if re.search(r"[;&|><`\\n\\r]|\\$\\(|\\$\\{|\\|\\||&&", command):
        return False
    return bool(re.match(
        r"^(?:uptime|df(?:\\s|$)|free(?:\\s|$)|ps(?:\\s|$)|whoami(?:\\s|$)|hostname(?:\\s|$)|uname(?:\\s|$)|date(?:\\s|$)|id(?:\\s|$)|systemctl\\s+status\\b|journalctl(?:\\s|$))",
        command,
        re.IGNORECASE,
    ))


def action_ssh_profile_list(config, payload):
    return {
        "ok": True,
        "aliases": _ssh_config_aliases(),
        "credentials_local_only": True,
        "source": "~/.ssh/config",
    }


def _run_ssh(payload, *, read_only):
    if not shutil.which("ssh"):
        raise RuntimeError("OpenSSH client is not installed on this machine.")
    host = _ssh_alias(payload.get("host"))
    command = str(payload.get("command") or "").strip()
    if not command or len(command) > 12000:
        raise RuntimeError("SSH command is required and must be 12000 characters or fewer.")
    if _ssh_has_secret(command):
        raise RuntimeError("Do not place credentials, tokens, passwords, or private keys in SSH commands.")
    if read_only and not _ssh_read_only(command):
        raise RuntimeError("ssh_read only allows bounded diagnostic commands.")
    timeout = max(10, min(120, int(payload.get("timeout") or 45)))
    result = _run(
        ["ssh", "-o", "BatchMode=yes", "-o", "ConnectTimeout=10", host, command],
        timeout=timeout,
    )
    return {
        **result,
        "host_alias": host,
        "command": command,
        "read_only": bool(read_only),
        "credentials_local_only": True,
    }


def action_ssh_read(config, payload):
    return _run_ssh(payload, read_only=True)


def action_ssh_command(config, payload):
    return _run_ssh(payload, read_only=False)


def action_system_info(config, payload):
    return {
        "hostname": socket.gethostname(),
        "platform": platform.platform(),
        "python": sys.version.split()[0],
        "machine": platform.machine(),
        "processor": platform.processor(),
        "roots": [str(p) for p in _roots(config)],
        "netwalk_toolkit": bool(_detect_netwalk(config)),
    }


def action_health(config, payload):
    usage = shutil.disk_usage(Path.home())
    load = None
    if hasattr(os, "getloadavg"):
        try:
            load = list(os.getloadavg())
        except OSError:
            load = None
    return {
        "ok": True,
        "disk": {"total": usage.total, "used": usage.used, "free": usage.free},
        "load_average": load,
        "hostname": socket.gethostname(),
        "time": int(time.time()),
    }


def action_workspace_list(config, payload):
    rows = []
    for root in _roots(config):
        children = []
        try:
            for p in sorted(root.iterdir(), key=lambda x: x.name.lower())[:100]:
                children.append({"name": p.name, "type": "dir" if p.is_dir() else "file"})
        except PermissionError:
            pass
        rows.append({"path": str(root), "children": children})
    return {"roots": rows}


def action_read_file(config, payload):
    ws = _workspace(config, payload.get("workspace"))
    path = _path_in_workspace(ws, payload.get("path"))
    if not path.is_file():
        raise RuntimeError("Requested file does not exist.")
    size = path.stat().st_size
    if size > 1_000_000:
        raise RuntimeError("Requested file exceeds the 1 MB bridge read limit.")
    return {"workspace": str(ws), "path": str(path.relative_to(ws)), "size": size, "content": path.read_text(encoding="utf-8", errors="replace")}


def action_search_text(config, payload):
    ws = _workspace(config, payload.get("workspace"))
    query = str(payload.get("query") or "").strip()
    if not query:
        raise RuntimeError("query is required")
    regex = bool(payload.get("regex"))
    pattern = re.compile(query if regex else re.escape(query), re.IGNORECASE)
    matches, scanned = [], 0
    excluded = {".git","node_modules",".next","dist","build",".venv","venv","__pycache__"}
    for root, dirs, files in os.walk(ws):
        dirs[:] = [d for d in dirs if d not in excluded]
        for name in files:
            if len(matches) >= 200 or scanned >= 5000:
                break
            path = Path(root) / name
            scanned += 1
            try:
                if path.stat().st_size > 2_000_000:
                    continue
                text = path.read_text(encoding="utf-8", errors="ignore")
            except Exception:
                continue
            for no, line in enumerate(text.splitlines(), 1):
                if pattern.search(line):
                    matches.append({"path": str(path.relative_to(ws)), "line": no, "text": line[:500]})
                    if len(matches) >= 200:
                        break
        if len(matches) >= 200 or scanned >= 5000:
            break
    return {"query": query, "matches": matches, "files_scanned": scanned, "truncated": len(matches) >= 200 or scanned >= 5000}


def action_git_status(config, payload):
    ws = _workspace(config, payload.get("workspace"))
    return _git(ws, "status", "--porcelain=v1", "--branch")


def action_git_diff(config, payload):
    ws = _workspace(config, payload.get("workspace"))
    args = ["diff", "--no-ext-diff"]
    if payload.get("staged"):
        args.append("--cached")
    path = str(payload.get("path") or "").strip()
    if path:
        _path_in_workspace(ws, path)
        args += ["--", path]
    return _git(ws, *args)


def action_git_log(config, payload):
    ws = _workspace(config, payload.get("workspace"))
    limit = max(1, min(50, int(payload.get("limit") or 20)))
    return _git(ws, "log", f"-{limit}", "--oneline", "--decorate")


def _project_action(config, payload, action):
    ws = _workspace(config, payload.get("workspace"))
    script = SAFE_PROJECT_SCRIPTS[action]
    scripts = _package_scripts(ws)
    if script not in scripts:
        if action == "project_test" and (ws / "pytest.ini").exists() and shutil.which("pytest"):
            return _run(["pytest", "-q"], cwd=ws, timeout=600)
        raise RuntimeError(f"Project does not define the '{script}' script.")
    runner = "npm.cmd" if os.name == "nt" else "npm"
    if not shutil.which(runner) and not shutil.which("npm"):
        raise RuntimeError("npm is not installed.")
    return _run([runner, "run", script], cwd=ws, timeout=900)


def action_web_fetch(config, payload):
    raw = str(payload.get("url") or "").strip()
    u = urllib.parse.urlparse(raw)
    if u.scheme not in {"http","https"}:
        raise RuntimeError("Only http(s) URLs are allowed.")
    req = urllib.request.Request(raw, headers={"User-Agent":"Magnanimous-Local-Bridge/1.0"}, method="GET")
    with urllib.request.urlopen(req, timeout=30) as response:
        data = response.read(1_000_001)
        if len(data) > 1_000_000:
            raise RuntimeError("Fetched response exceeds the 1 MB limit.")
        return {"url": response.geturl(), "status": response.status, "content_type": response.headers.get("content-type",""), "body": data.decode("utf-8","replace")}


def _public_web_url(value):
    raw = str(value or "").strip()
    u = urllib.parse.urlparse(raw)
    if u.scheme not in {"http","https"} or not u.hostname:
        raise RuntimeError("Browser navigation requires an http(s) URL.")
    host = u.hostname.lower().rstrip(".")
    if host == "localhost" or host.endswith(".localhost") or host.endswith(".local"):
        raise RuntimeError("Local/private browser targets are blocked by the public-web safety boundary.")
    try:
        ip = ipaddress.ip_address(host)
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved or ip.is_multicast:
            raise RuntimeError("Local/private browser targets are blocked by the public-web safety boundary.")
    except ValueError:
        try:
            for item in socket.getaddrinfo(host, u.port or (443 if u.scheme == "https" else 80), type=socket.SOCK_STREAM):
                ip = ipaddress.ip_address(item[4][0])
                if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved or ip.is_multicast:
                    raise RuntimeError("Local/private browser targets are blocked by the public-web safety boundary.")
        except socket.gaierror as exc:
            raise RuntimeError(f"Browser target could not be resolved: {host}") from exc
    return raw


def _profile_name(value):
    name = str(value or "default").strip()
    if not re.fullmatch(r"[A-Za-z0-9._-]{1,64}", name):
        raise RuntimeError("Browser profile name may contain only letters, numbers, dot, underscore, and hyphen.")
    return name


def _browser_runtime():
    try:
        from playwright.sync_api import sync_playwright
        return sync_playwright
    except Exception as exc:
        raise RuntimeError("Magnanimous Native Browser is not installed. Re-run the Local Bridge activation to install Playwright and Chromium.") from exc


def _browser_proxy(config, payload=None):
    payload = payload or {}
    remote = str(payload.get("proxy_url") or "").strip()
    value = remote or str(config.get("browser_proxy") or os.environ.get("MAGNANIMOUS_BROWSER_PROXY") or "").strip()
    if not value:
        return None
    u = urllib.parse.urlparse(value)
    if u.scheme not in {"http","https","socks5"} or not u.hostname:
        raise RuntimeError("Configured browser proxy must use http, https, or socks5.")
    if remote and (u.username or u.password):
        raise RuntimeError("Remote browser tasks may not carry proxy credentials. Configure authenticated proxies locally on the bridge.")
    return {"server": value}


def _browser_open(config, payload, *, headed=False):
    sync_playwright = _browser_runtime()
    profile = _profile_name(payload.get("profile"))
    profile_dir = (BROWSER_DIR / profile).resolve()
    BROWSER_DIR.mkdir(parents=True, exist_ok=True)
    profile_dir.mkdir(parents=True, exist_ok=True)
    manager = sync_playwright().start()
    kwargs = {
        "user_data_dir": str(profile_dir),
        "headless": not headed,
        "viewport": {"width": 1440, "height": 1000},
        "locale": str(payload.get("locale") or "en-US")[:20],
    }
    proxy = _browser_proxy(config, payload)
    if proxy:
        kwargs["proxy"] = proxy
    try:
        context = manager.chromium.launch_persistent_context(**kwargs)
    except Exception:
        manager.stop()
        raise
    page = context.pages[0] if context.pages else context.new_page()
    page.set_default_timeout(max(3000, min(30000, int(payload.get("timeout_ms") or 15000))))
    return manager, context, page, profile


def _browser_close(manager, context):
    try:
        context.close()
    finally:
        manager.stop()


def _browser_snapshot(page, limit=80000):
    title = page.title()
    url = page.url
    text = page.locator("body").inner_text(timeout=10000)
    return {"title": title[:500], "url": url, "text": text[:limit]}


def _extract_links(page, limit=100):
    return page.locator("a[href]").evaluate_all(
        """(els, limit) => els.slice(0, limit).map(a => ({text:(a.innerText||a.textContent||'').trim().slice(0,300), url:a.href})).filter(x => x.url)""",
        limit
    )


def _locator(page, spec):
    spec = spec or {}
    if spec.get("css"):
        return page.locator(str(spec["css"])).first
    if spec.get("label"):
        return page.get_by_label(str(spec["label"]), exact=bool(spec.get("exact"))).first
    if spec.get("placeholder"):
        return page.get_by_placeholder(str(spec["placeholder"]), exact=bool(spec.get("exact"))).first
    if spec.get("text"):
        return page.get_by_text(str(spec["text"]), exact=bool(spec.get("exact"))).first
    if spec.get("testid"):
        return page.get_by_test_id(str(spec["testid"])).first
    role = str(spec.get("role") or "").strip()
    if role:
        name = spec.get("name")
        return page.get_by_role(role, name=str(name) if name is not None else None, exact=bool(spec.get("exact"))).first
    raise RuntimeError("Browser step requires one locator: css, label, placeholder, text, testid, or role.")


def action_browser_profile_list(config, payload):
    BROWSER_DIR.mkdir(parents=True, exist_ok=True)
    profiles = []
    for item in sorted(BROWSER_DIR.iterdir(), key=lambda p: p.name.lower()):
        if item.is_dir():
            profiles.append({"name": item.name, "updated_at": int(item.stat().st_mtime)})
    return {"profiles": profiles, "credential_storage": "local-browser-profile-only", "secrets_transmitted_to_platform": False}


def action_browser_profile_create(config, payload):
    profile = _profile_name(payload.get("profile"))
    profile_dir = (BROWSER_DIR / profile).resolve()
    BROWSER_DIR.mkdir(parents=True, exist_ok=True)
    profile_dir.mkdir(parents=True, exist_ok=True)
    return {"created": True, "profile": profile, "path_owned_by_bridge": True, "secrets_transmitted_to_platform": False}


def action_browser_profile_delete(config, payload):
    profile = _profile_name(payload.get("profile"))
    profile_dir = (BROWSER_DIR / profile).resolve()
    if profile == "default":
        raise RuntimeError("The default browser profile cannot be deleted remotely.")
    if profile_dir.exists():
        shutil.rmtree(profile_dir)
    return {"deleted": True, "profile": profile, "secrets_transmitted_to_platform": False}


def action_browser_profile_setup(config, payload):
    target = _public_web_url(payload.get("url"))
    seconds = max(30, min(300, int(payload.get("seconds") or 120)))
    manager, context, page, profile = _browser_open(config, payload, headed=True)
    try:
        page.goto(target, wait_until="domcontentloaded", timeout=30000)
        deadline = time.time() + seconds
        while time.time() < deadline:
            time.sleep(1)
        return {"ok": True, "profile": profile, "url": page.url, "note": "The local visible browser window was opened for manual sign-in. Credentials were never sent through Magnanimous."}
    finally:
        _browser_close(manager, context)


def action_browser_search(config, payload):
    query = str(payload.get("query") or "").strip()
    if not query:
        raise RuntimeError("browser_search requires query.")
    limit = max(1, min(20, int(payload.get("limit") or 10)))
    manager, context, page, profile = _browser_open(config, payload)
    try:
        page.goto("https://www.bing.com/search?q=" + urllib.parse.quote_plus(query), wait_until="domcontentloaded", timeout=30000)
        page.wait_for_timeout(600)
        rows = page.locator("li.b_algo").evaluate_all(
            """(els, limit) => els.slice(0, limit).map((el, i) => {
                const a=el.querySelector('h2 a'); const p=el.querySelector('.b_caption p');
                return a ? {position:i+1,title:(a.innerText||'').trim(),url:a.href,snippet:(p?.innerText||'').trim()} : null;
            }).filter(Boolean)""",
            limit
        )
        if not rows:
            page.goto("https://duckduckgo.com/?q=" + urllib.parse.quote_plus(query), wait_until="domcontentloaded", timeout=30000)
            page.wait_for_timeout(800)
            rows = page.locator("a[data-testid='result-title-a']").evaluate_all(
                """(els, limit) => els.slice(0, limit).map((a, i) => ({position:i+1,title:(a.innerText||'').trim(),url:a.href,snippet:''}))""",
                limit
            )
        return {"query": query, "results": rows[:limit], "profile": profile, "native": True, "provider_dependency": False}
    finally:
        _browser_close(manager, context)


def action_browser_fetch(config, payload):
    target = _public_web_url(payload.get("url"))
    selector = str(payload.get("selector") or "").strip()
    limit = max(1000, min(200000, int(payload.get("max_chars") or 80000)))
    manager, context, page, profile = _browser_open(config, payload)
    try:
        page.goto(target, wait_until="domcontentloaded", timeout=30000)
        page.wait_for_timeout(max(0, min(5000, int(payload.get("settle_ms") or 700))))
        root = page.locator(selector).first if selector else page.locator("main,article,[role='main'],body").first
        text = root.inner_text(timeout=12000)[:limit]
        result = {"url": page.url, "title": page.title()[:500], "text": text, "profile": profile, "native": True, "links": _extract_links(page, min(200, int(payload.get("link_limit") or 80)))}
        fields = payload.get("fields") or {}
        if isinstance(fields, dict):
            structured = {}
            for key, spec in list(fields.items())[:50]:
                try:
                    loc = page.locator(str(spec)).first
                    structured[str(key)[:100]] = loc.inner_text(timeout=5000)[:10000]
                except Exception:
                    structured[str(key)[:100]] = None
            result["structured"] = structured
        if payload.get("include_html"):
            result["html"] = root.inner_html(timeout=12000)[:limit]
        return result
    finally:
        _browser_close(manager, context)


def action_browser_fetch_batch(config, payload):
    urls = payload.get("urls") or []
    if not isinstance(urls, list) or not urls or len(urls) > 10:
        raise RuntimeError("browser_fetch_batch requires 1-10 urls.")
    results, errors = [], []
    for raw in urls:
        try:
            child = dict(payload)
            child["url"] = raw
            child.pop("urls", None)
            results.append(action_browser_fetch(config, child))
        except Exception as exc:
            errors.append({"url": str(raw)[:4000], "error": f"{type(exc).__name__}: {exc}"[:2000]})
    return {"results": results, "errors": errors, "native": True}


def action_browser_research(config, payload):
    query = str(payload.get("query") or "").strip()
    if not query:
        raise RuntimeError("browser_research requires query.")
    limit = max(1, min(8, int(payload.get("limit") or 5)))
    search = action_browser_search(config, {**payload, "query": query, "limit": limit})
    sources, errors = [], []
    for row in (search.get("results") or [])[:limit]:
        try:
            fetched = action_browser_fetch(config, {**payload, "url": row.get("url"), "max_chars": min(50000, int(payload.get("max_chars") or 18000)), "link_limit": 20})
            sources.append({
                "title": row.get("title") or fetched.get("title") or "",
                "url": fetched.get("url") or row.get("url") or "",
                "snippet": row.get("snippet") or "",
                "text": fetched.get("text") or "",
            })
        except Exception as exc:
            errors.append({"url": row.get("url") or "", "error": f"{type(exc).__name__}: {exc}"[:2000]})
    return {"query": query, "sources": sources, "errors": errors, "native": True, "source_backed": True}


def _session_cleanup(max_idle=1800):
    cutoff = time.time() - max_idle
    for session_id, item in list(BROWSER_SESSIONS.items()):
        if item.get("last_used", 0) >= cutoff:
            continue
        try:
            _browser_close(item["manager"], item["context"])
        except Exception:
            pass
        BROWSER_SESSIONS.pop(session_id, None)


def _session_id(payload):
    value = str(payload.get("session_id") or "").strip()
    if not re.fullmatch(r"[A-Za-z0-9._:-]{8,160}", value):
        raise RuntimeError("A valid browser session_id is required.")
    return value


def action_browser_session_start(config, payload):
    _session_cleanup()
    session_id = _session_id(payload)
    if session_id in BROWSER_SESSIONS:
        raise RuntimeError("Browser session already exists.")
    manager, context, page, profile = _browser_open(config, payload)
    try:
        if payload.get("url"):
            page.goto(_public_web_url(payload.get("url")), wait_until="domcontentloaded", timeout=30000)
        BROWSER_SESSIONS[session_id] = {"manager": manager, "context": context, "page": page, "profile": profile, "last_used": time.time()}
        return {"session_id": session_id, "profile": profile, "status": "active", "url": page.url, "native": True, "transport": "magnanimous-outbound-task-control"}
    except Exception:
        _browser_close(manager, context)
        raise


def _session_steps(config, payload, allow_actions):
    _session_cleanup()
    session_id = _session_id(payload)
    item = BROWSER_SESSIONS.get(session_id)
    if not item:
        raise RuntimeError("Browser session is not active on this bridge.")
    page = item["page"]
    steps = payload.get("steps") or []
    if not isinstance(steps, list) or not steps or len(steps) > 60:
        raise RuntimeError("Browser session command requires 1-60 steps.")
    outputs = []
    for index, step in enumerate(steps):
        op = str((step or {}).get("op") or "").strip().lower()
        if op == "goto":
            page.goto(_public_web_url(step.get("url")), wait_until="domcontentloaded", timeout=30000)
            outputs.append({"step": index+1, "op": op, "url": page.url})
        elif op == "wait_ms":
            ms = max(0, min(10000, int(step.get("ms") or 500))); page.wait_for_timeout(ms); outputs.append({"step": index+1, "op": op, "waited_ms": ms})
        elif op == "extract_text":
            loc = _locator(page, step) if any(step.get(k) for k in ("css","label","placeholder","text","testid","role")) else page.locator("body").first
            outputs.append({"step": index+1, "op": op, "text": loc.inner_text(timeout=10000)[:max(100, min(50000, int(step.get("max_chars") or 12000)))]})
        elif op == "extract_links":
            outputs.append({"step": index+1, "op": op, "links": _extract_links(page, max(1, min(100, int(step.get("limit") or 40))))})
        elif op == "snapshot":
            outputs.append({"step": index+1, "op": op, **_browser_snapshot(page, max(1000, min(80000, int(step.get("max_chars") or 20000))))})
        elif op == "scroll":
            amount = max(-6000, min(6000, int(step.get("pixels") or 800))); page.mouse.wheel(0, amount); outputs.append({"step": index+1, "op": op, "pixels": amount})
        elif op == "screenshot":
            data = page.screenshot(type="jpeg", quality=55, full_page=bool(step.get("full_page")))
            if len(data) > 350000: raise RuntimeError("Screenshot exceeds the safe bridge result size.")
            outputs.append({"step": index+1, "op": op, "content_type": "image/jpeg", "base64": base64.b64encode(data).decode("ascii")})
        elif allow_actions and op == "click":
            _locator(page, step).click(timeout=max(1000, min(30000, int(step.get("timeout_ms") or 10000)))); outputs.append({"step": index+1, "op": op, "url": page.url})
        elif allow_actions and op == "fill":
            loc = _locator(page, step); field_type = str(loc.get_attribute("type") or "").lower()
            if field_type == "password" or step.get("secret") is True: raise RuntimeError("Password/secret fields cannot be filled from a remote task. Use a local persistent browser profile instead.")
            value = str(step.get("value") or "")
            if len(value) > 20000: raise RuntimeError("Browser fill value exceeds the safety limit.")
            loc.fill(value); outputs.append({"step": index+1, "op": op, "filled": True})
        elif allow_actions and op == "press":
            key = str(step.get("key") or "").strip()
            if not key: raise RuntimeError("Browser press step requires key.")
            _locator(page, step).press(key); outputs.append({"step": index+1, "op": op, "key": key})
        elif allow_actions and op == "select":
            value = str(step.get("value") or ""); _locator(page, step).select_option(value=value); outputs.append({"step": index+1, "op": op, "selected": True})
        else:
            allowed = ["goto","wait_ms","extract_text","extract_links","snapshot","scroll","screenshot"] + (["click","fill","press","select"] if allow_actions else [])
            raise RuntimeError(f"Browser operation '{op}' is not allowed. Allowed: {', '.join(allowed)}")
    item["last_used"] = time.time()
    return {"session_id": session_id, "status": "active", "profile": item["profile"], "final": _browser_snapshot(page, 30000), "steps": outputs, "native": True}


def action_browser_session_read(config, payload):
    return _session_steps(config, payload, False)


def action_browser_session_action(config, payload):
    return _session_steps(config, payload, True)


def action_browser_session_end(config, payload):
    session_id = _session_id(payload)
    item = BROWSER_SESSIONS.pop(session_id, None)
    if item:
        _browser_close(item["manager"], item["context"])
    return {"session_id": session_id, "status": "ended", "native": True, "idempotent": True}


def _browser_flow(config, payload, *, allow_actions):
    steps = payload.get("steps") or []
    if not isinstance(steps, list) or not steps:
        raise RuntimeError("Browser flow requires a non-empty steps array.")
    if len(steps) > 60:
        raise RuntimeError("Browser flow exceeds the 60-step safety limit.")
    manager, context, page, profile = _browser_open(config, payload)
    outputs = []
    try:
        for index, step in enumerate(steps):
            if not isinstance(step, dict):
                raise RuntimeError(f"Browser step {index+1} is invalid.")
            op = str(step.get("op") or "").strip().lower()
            if op == "goto":
                target = _public_web_url(step.get("url"))
                page.goto(target, wait_until="domcontentloaded", timeout=30000)
                outputs.append({"step": index+1, "op": op, "url": page.url})
            elif op == "wait_ms":
                ms = max(0, min(10000, int(step.get("ms") or 500)))
                page.wait_for_timeout(ms)
                outputs.append({"step": index+1, "op": op, "waited_ms": ms})
            elif op == "wait_for":
                loc = _locator(page, step)
                loc.wait_for(state=str(step.get("state") or "visible"), timeout=max(1000, min(30000, int(step.get("timeout_ms") or 10000))))
                outputs.append({"step": index+1, "op": op, "ok": True})
            elif op == "extract_text":
                loc = _locator(page, step) if any(step.get(k) for k in ("css","label","placeholder","text","testid","role")) else page.locator("body").first
                outputs.append({"step": index+1, "op": op, "text": loc.inner_text(timeout=10000)[:max(100, min(50000, int(step.get("max_chars") or 12000)))]})
            elif op == "extract_links":
                outputs.append({"step": index+1, "op": op, "links": _extract_links(page, max(1, min(100, int(step.get("limit") or 40))))})
            elif op == "snapshot":
                outputs.append({"step": index+1, "op": op, **_browser_snapshot(page, max(1000, min(80000, int(step.get("max_chars") or 20000))))})
            elif op == "scroll":
                amount = max(-6000, min(6000, int(step.get("pixels") or 800)))
                page.mouse.wheel(0, amount)
                outputs.append({"step": index+1, "op": op, "pixels": amount})
            elif op == "extract_elements":
                selector = str(step.get("css") or "a,button,input,select,textarea,[role]").strip()
                limit = max(1, min(200, int(step.get("limit") or 80)))
                elements = page.locator(selector).evaluate_all(
                    """(els, limit) => els.slice(0, limit).map((el, i) => ({
                        index:i, tag:el.tagName.toLowerCase(), role:el.getAttribute('role')||'',
                        text:(el.innerText||el.textContent||'').trim().slice(0,500),
                        name:el.getAttribute('name')||'', type:el.getAttribute('type')||'',
                        placeholder:el.getAttribute('placeholder')||'', href:el.href||''
                    }))""",
                    limit
                )
                outputs.append({"step": index+1, "op": op, "elements": elements})
            elif op == "screenshot":
                data = page.screenshot(type="jpeg", quality=55, full_page=bool(step.get("full_page")))
                if len(data) > 350000:
                    raise RuntimeError("Screenshot exceeds the safe bridge result size.")
                outputs.append({"step": index+1, "op": op, "content_type": "image/jpeg", "base64": base64.b64encode(data).decode("ascii")})
            elif allow_actions and op == "click":
                _locator(page, step).click(timeout=max(1000, min(30000, int(step.get("timeout_ms") or 10000))))
                outputs.append({"step": index+1, "op": op, "url": page.url})
            elif allow_actions and op == "fill":
                loc = _locator(page, step)
                field_type = str(loc.get_attribute("type") or "").lower()
                if field_type == "password" or step.get("secret") is True:
                    raise RuntimeError("Password/secret fields cannot be filled from a remote task. Use a local persistent browser profile instead.")
                value = str(step.get("value") or "")
                if len(value) > 20000:
                    raise RuntimeError("Browser fill value exceeds the safety limit.")
                loc.fill(value)
                outputs.append({"step": index+1, "op": op, "filled": True})
            elif allow_actions and op == "press":
                key = str(step.get("key") or "").strip()
                if not key:
                    raise RuntimeError("Browser press step requires key.")
                _locator(page, step).press(key)
                outputs.append({"step": index+1, "op": op, "key": key})
            elif allow_actions and op == "select":
                value = str(step.get("value") or "")
                _locator(page, step).select_option(value=value)
                outputs.append({"step": index+1, "op": op, "selected": True})
            else:
                allowed = ["goto","wait_ms","wait_for","extract_text","extract_links","extract_elements","snapshot","scroll","screenshot"]
                if allow_actions:
                    allowed += ["click","fill","press","select"]
                raise RuntimeError(f"Browser operation '{op}' is not allowed. Allowed: {', '.join(allowed)}")
        return {"ok": True, "profile": profile, "final": _browser_snapshot(page, 30000), "steps": outputs, "native": True}
    finally:
        _browser_close(manager, context)


def action_browser_read_flow(config, payload):
    return _browser_flow(config, payload, allow_actions=False)


def action_browser_action_flow(config, payload):
    return _browser_flow(config, payload, allow_actions=True)


def _patch_paths(patch):
    paths = []
    for line in patch.splitlines():
        if line.startswith("+++ "):
            value = line[4:].split("\t",1)[0].strip()
            if value == "/dev/null":
                continue
            if value.startswith("b/"):
                value = value[2:]
            paths.append(value)
    return sorted(set(paths))


def action_apply_patch(config, payload):
    ws = _workspace(config, payload.get("workspace"))
    patch = str(payload.get("patch") or "")
    expected = str(payload.get("expected_head") or "").strip()
    head = _git(ws, "rev-parse", "HEAD")
    if head["code"] != 0:
        raise RuntimeError(head["stderr"] or "Could not read Git HEAD.")
    actual = head["stdout"].strip()
    if expected and actual != expected:
        raise RuntimeError(f"HEAD changed: expected {expected}, found {actual}.")
    files = _patch_paths(patch)
    if not files:
        raise RuntimeError("Patch contains no writable file paths.")
    for rel in files:
        _path_in_workspace(ws, rel)
        dirty = _git(ws, "status", "--porcelain", "--", rel)
        if dirty["stdout"].strip():
            raise RuntimeError(f"Refusing to patch locally modified file: {rel}")
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", suffix=".patch", delete=False) as fh:
        fh.write(patch)
        temp = fh.name
    try:
        check = _git(ws, "apply", "--check", temp)
        if check["code"] != 0:
            raise RuntimeError(check["stderr"] or "git apply --check failed.")
        result = _git(ws, "apply", "--whitespace=nowarn", temp)
        if result["code"] != 0:
            raise RuntimeError(result["stderr"] or "git apply failed.")
        diff = _git(ws, "diff", "--", *files)
        return {"applied": True, "head": actual, "files": files, "diff": diff}
    finally:
        try:
            os.unlink(temp)
        except OSError:
            pass


def action_git_create_branch(config, payload):
    ws = _workspace(config, payload.get("workspace"))
    name = str(payload.get("branch") or "").strip()
    if not re.fullmatch(r"[A-Za-z0-9._/-]{1,120}", name) or name in {"main","master"}:
        raise RuntimeError("Invalid or protected branch name.")
    current = _git(ws, "branch", "--show-current")["stdout"].strip()
    if current in {"main","master"}:
        result = _git(ws, "switch", "-c", name)
    else:
        result = _git(ws, "switch", "-c", name)
    if result["code"] != 0:
        raise RuntimeError(result["stderr"] or "Could not create branch.")
    return {"branch": name, "previous_branch": current}


def action_git_commit(config, payload):
    ws = _workspace(config, payload.get("workspace"))
    branch = _git(ws, "branch", "--show-current")["stdout"].strip()
    if branch in {"main","master",""}:
        raise RuntimeError("Refusing to commit directly on the protected default branch.")
    message = str(payload.get("message") or "").strip()[:300]
    paths = payload.get("paths") or []
    if not message or not isinstance(paths, list) or not paths:
        raise RuntimeError("git_commit requires a message and explicit paths.")
    safe_paths = []
    for value in paths[:100]:
        p = _path_in_workspace(ws, value)
        safe_paths.append(str(p.relative_to(ws)))
    add = _git(ws, "add", "--", *safe_paths)
    if add["code"] != 0:
        raise RuntimeError(add["stderr"] or "git add failed.")
    commit = _git(ws, "commit", "-m", message)
    if commit["code"] != 0:
        raise RuntimeError(commit["stderr"] or "git commit failed.")
    head = _git(ws, "rev-parse", "HEAD")["stdout"].strip()
    return {"committed": True, "branch": branch, "sha": head, "paths": safe_paths}


def _netwalk_root(config):
    root = _detect_netwalk(config)
    if not root:
        raise RuntimeError("Core-Dv1 / Netwalk toolkit is not configured on this local bridge.")
    return root


def _netwalk_script(root, name):
    path = (root / "scripts" / name).resolve()
    if not path.is_file() or not _within(path, root):
        raise RuntimeError(f"Required Netwalk script is unavailable: {name}")
    return path


def action_netwalk_probe(config, payload):
    root = _netwalk_root(config)
    site = str(payload.get("site") or "").strip()
    host = str(payload.get("host") or "").strip()
    if not site or not host:
        raise RuntimeError("Netwalk probe requires site and host.")
    return _run([sys.executable, str(_netwalk_script(root,"netwalk_exec.py")), "probe", "--site", site, "--host", host], cwd=root, timeout=120)


def action_netwalk_scan(config, payload):
    root = _netwalk_root(config)
    site = str(payload.get("site") or "").strip()
    operation = str(payload.get("operation") or "hosts").strip()
    if operation not in {"hosts","ports","record"}:
        raise RuntimeError("Netwalk scan operation must be hosts, ports, or record.")
    script = _netwalk_script(root,"netwalk_sweep.py")
    argv = [sys.executable, str(script), operation, "--site", site]
    if operation == "hosts":
        rng = str(payload.get("range") or "").strip()
        if not rng:
            raise RuntimeError("Netwalk hosts operation requires range.")
        argv += ["--range", rng]
    elif operation == "ports":
        target = str(payload.get("target") or "").strip()
        if not target:
            raise RuntimeError("Netwalk ports operation requires target.")
        argv += ["--target", target, "--profile", str(payload.get("profile") or "standard")]
    else:
        record = str(payload.get("record") or "").strip()
        if not record:
            raise RuntimeError("Netwalk record operation requires record path.")
        argv += ["--record", record]
    # The Netwalk tool itself enforces scope.json authorization and refuses unauthorized ranges.
    return _run(argv, cwd=root, timeout=600)


def action_netwalk_diag(config, payload):
    root = _netwalk_root(config)
    site = str(payload.get("site") or "").strip()
    record = str(payload.get("record") or "").strip()
    if not site or not record:
        raise RuntimeError("Netwalk diagnostic requires site and record.")
    return _run([sys.executable,str(_netwalk_script(root,"netwalk_audit.py")),"run","--site",site,"--record",record,"--dry-run"],cwd=root,timeout=600)


def action_netwalk_map(config, payload):
    root = _netwalk_root(config)
    record = str(payload.get("record") or "").strip()
    output = str(payload.get("output") or "").strip()
    if not record or not output:
        raise RuntimeError("Netwalk map requires record and output.")
    argv=[sys.executable,str(_netwalk_script(root,"netwalk_map.py")),record,"-o",output]
    if payload.get("public"):
        argv.append("--public")
    return _run(argv,cwd=root,timeout=300)


def action_netwalk_report(config, payload):
    root = _netwalk_root(config)
    record = str(payload.get("record") or "").strip()
    output = str(payload.get("output") or "").strip()
    if not record or not output:
        raise RuntimeError("Netwalk report requires record and output.")
    argv=[sys.executable,str(_netwalk_script(root,"netwalk_report.py")),record,"-o",output]
    if payload.get("public"):
        argv.append("--public")
    return _run(argv,cwd=root,timeout=300)


HANDLERS = {
    "system_info": action_system_info,
    "health": action_health,
    "workspace_list": action_workspace_list,
    "read_file": action_read_file,
    "search_text": action_search_text,
    "git_status": action_git_status,
    "git_diff": action_git_diff,
    "git_log": action_git_log,
    "web_fetch": action_web_fetch,
    "browser_search": action_browser_search,
    "browser_fetch": action_browser_fetch,
    "browser_fetch_batch": action_browser_fetch_batch,
    "browser_research": action_browser_research,
    "browser_read_flow": action_browser_read_flow,
    "browser_action_flow": action_browser_action_flow,
    "browser_profile_list": action_browser_profile_list,
    "browser_profile_setup": action_browser_profile_setup,
    "browser_profile_create": action_browser_profile_create,
    "browser_profile_delete": action_browser_profile_delete,
    "browser_session_start": action_browser_session_start,
    "browser_session_read": action_browser_session_read,
    "browser_session_action": action_browser_session_action,
    "browser_session_end": action_browser_session_end,
    "ssh_profile_list": action_ssh_profile_list,
    "ssh_read": action_ssh_read,
    "ssh_command": action_ssh_command,
    "apply_patch": action_apply_patch,
    "git_create_branch": action_git_create_branch,
    "git_commit": action_git_commit,
    "netwalk_probe": action_netwalk_probe,
    "netwalk_scan": action_netwalk_scan,
    "netwalk_diag": action_netwalk_diag,
    "netwalk_map": action_netwalk_map,
    "netwalk_report": action_netwalk_report,
}
for _action in SAFE_PROJECT_SCRIPTS:
    HANDLERS[_action] = lambda config, payload, action=_action: _project_action(config, payload, action)


def execute(config, task):
    action = task.get("action")
    handler = HANDLERS.get(action)
    if not handler:
        raise RuntimeError(f"Unsupported local action: {action}")
    return handler(config, task.get("payload") or {})


def pair(args):
    roots = [str(Path(p).expanduser().resolve()) for p in (args.root or [])]
    config = {"server": args.server.rstrip("/"), "roots": roots, "netwalk_toolkit": args.netwalk_toolkit or ""}
    payload = {
        "code": args.code,
        "name": args.name or socket.gethostname(),
        "hostname": socket.gethostname(),
        "platform": platform.platform(),
        "capabilities": capabilities(config),
    }
    status, data = _request(config["server"], "/api/magnanimous/local-bridge/agent/pair", method="POST", data=payload)
    if status != 201:
        raise RuntimeError(data.get("detail") or f"Pairing failed with HTTP {status}.")
    config.update({"device_id": data["device_id"], "token": data["bridge_token"]})
    _save_config(config)
    print(json.dumps({"paired": True, "device_id": config["device_id"], "config": str(CONFIG_PATH), "capabilities": capabilities(config)}, indent=2))


def run_loop(args):
    config = _load_config()
    server, token = config["server"], config["token"]
    heartbeat_at = 0
    while True:
        try:
            if time.time() >= heartbeat_at:
                status, data = _request(server, "/api/magnanimous/local-bridge/agent/heartbeat", method="POST", token=token, data={
                    "hostname": socket.gethostname(),
                    "platform": platform.platform(),
                    "capabilities": capabilities(config),
                })
                if status == 401:
                    print("Magnanimous Local Bridge authorization was revoked or expired. Re-pair this computer from the owner Local Bridge page.", file=sys.stderr)
                    return
                if status != 200:
                    raise RuntimeError(data.get("detail") or f"Heartbeat failed: HTTP {status}")
                heartbeat_at = time.time() + 30
            status, data = _request(server, "/api/magnanimous/local-bridge/agent/next", token=token, timeout=35)
            if status == 401:
                print("Magnanimous Local Bridge authorization was revoked or expired. Re-pair this computer from the owner Local Bridge page.", file=sys.stderr)
                return
            if status != 200:
                raise RuntimeError(data.get("detail") or f"Task poll failed: HTTP {status}")
            task = data.get("task")
            if not task:
                time.sleep(max(1.0, args.interval))
                continue
            result, error, ok = {}, "", False
            try:
                result = execute(config, task)
                ok = True
            except Exception as exc:
                error = f"{type(exc).__name__}: {exc}"[:5000]
            rstatus, rdata = _request(server, "/api/magnanimous/local-bridge/agent/result", method="POST", token=token, data={"task_id":task.get("id"),"ok":ok,"result":result,"error":error})
            if rstatus == 401:
                print("Magnanimous Local Bridge authorization was revoked before the task result could be returned. Re-pair this computer.", file=sys.stderr)
                return
            if rstatus != 200:
                print(f"Could not submit task result: {rdata}", file=sys.stderr)
        except KeyboardInterrupt:
            print("Magnanimous Local Bridge stopped.")
            return
        except Exception as exc:
            print(f"Bridge error: {exc}", file=sys.stderr)
            time.sleep(max(3.0, args.interval))


def status_cmd(args):
    config = _load_config()
    print(json.dumps({
        "paired": True,
        "server": config.get("server"),
        "device_id": config.get("device_id"),
        "roots": [str(p) for p in _roots(config)],
        "netwalk_toolkit": str(_detect_netwalk(config) or ""),
        "native_browser_profiles": str(BROWSER_DIR),
        "capabilities": capabilities(config),
        "token_present": bool(config.get("token")),
    }, indent=2))


def main():
    parser = argparse.ArgumentParser(description="Magnanimous outbound-only local execution bridge.")
    sub = parser.add_subparsers(dest="command", required=True)
    p = sub.add_parser("pair", help="Pair this computer using a one-time code created in I AM Magnanimous Way.")
    p.add_argument("--server", default=DEFAULT_SERVER)
    p.add_argument("--code", required=True)
    p.add_argument("--name", default="")
    p.add_argument("--root", action="append", default=[], help="Allowlisted workspace root. Repeat for multiple roots.")
    p.add_argument("--netwalk-toolkit", default="", help="Optional local Core-Dv1 / Netwalk toolkit directory.")
    p.set_defaults(func=pair)
    r = sub.add_parser("run", help="Run the outbound task/heartbeat loop.")
    r.add_argument("--interval", type=float, default=3.0)
    r.set_defaults(func=run_loop)
    s = sub.add_parser("status", help="Show local configuration without printing the bridge token.")
    s.set_defaults(func=status_cmd)
    args = parser.parse_args()
    try:
        args.func(args)
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1)


if __name__ == "__main__":
    main()
