from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

# Keep Local Bridge API on Cloudflare Worker instead of proxying it to standalone Railway.
p = ROOT / 'worker' / 'src' / 'security-entrypoint.js'
s = p.read_text(encoding='utf-8')
old = "  if(url.pathname==='/api/internal/migration/rewrap-platform-credentials'||url.pathname==='/api/internal/edge-ai/run')return null;"
new = "  if(url.pathname.startsWith('/api/magnanimous/local-bridge')||url.pathname==='/api/internal/migration/rewrap-platform-credentials'||url.pathname==='/api/internal/edge-ai/run')return null;"
if old not in s:
    raise SystemExit('security-entrypoint proxy exception anchor not found')
p.write_text(s.replace(old, new), encoding='utf-8')

# Fix Local Bridge NCS2 defaults and launch setupvars through a temp .cmd file.
p = ROOT / 'local-bridge' / 'bridge_agent.py'
s = p.read_text(encoding='utf-8')
s = s.replace('"D:/Python310/python.exe" if os.name == "nt" else sys.executable', '"D:/NCS2_AI/venv/Scripts/python.exe" if os.name == "nt" else sys.executable')
s = s.replace('root / "models" / "person-vehicle-bike-detection-2004" / "FP16" / "person-vehicle-bike-detection-2004.xml"', 'root / "models" / "person-vehicle-bike-detection-crossroad-0078" / "FP16" / "person-vehicle-bike-detection-crossroad-0078.xml"')
old = '''def _run_ncs2(config, args, *, timeout=180):
    runtime = _ncs2_runtime(config)
    command = f'call "{runtime["setup"]}" >nul && ' + subprocess.list2cmdline([
        str(runtime["python"]), str(runtime["runtime"]), *[str(x) for x in args]
    ])
    result = _run(["cmd.exe", "/d", "/s", "/c", command], timeout=timeout)
'''
new = '''def _run_ncs2(config, args, *, timeout=180):
    runtime = _ncs2_runtime(config)
    argv = [str(runtime["python"]), str(runtime["runtime"]), *[str(x) for x in args]]
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", suffix=".cmd", delete=False, newline="\\r\\n") as fh:
        fh.write("@echo off\\n")
        fh.write(f'call "{runtime["setup"]}" >nul\\n')
        fh.write(subprocess.list2cmdline(argv) + "\\n")
        launcher = fh.name
    try:
        result = _run(["cmd.exe", "/d", "/c", launcher], timeout=timeout)
    finally:
        try:
            os.unlink(launcher)
        except OSError:
            pass
'''
if old not in s:
    raise SystemExit('bridge NCS2 launcher block not found')
p.write_text(s.replace(old, new), encoding='utf-8')

# Support classic SSD DetectionOutput used by the MYRIAD-compatible model.
p = ROOT / 'local-bridge' / 'ncs2_edge.py'
s = p.read_text(encoding='utf-8')
old = '''    boxes = None
    labels = None
    for name, arr in outputs.items():
        lower = name.lower()
        if "box" in lower or (arr.ndim >= 2 and arr.shape[-1] == 5):
            boxes = arr.reshape(-1, 5)
        elif "label" in lower or (arr.ndim <= 2 and np.issubdtype(arr.dtype, np.integer)):
            labels = arr.reshape(-1)

    if boxes is None or labels is None:
        summary = {name: list(arr.shape) for name, arr in outputs.items()}
        raise RuntimeError(f"Unsupported detector output layout: {summary}")

    threshold = max(0.0, min(1.0, float(args.threshold)))
'''
new = '''    detection_output = None
    boxes = None
    labels = None
    for name, arr in outputs.items():
        lower = name.lower()
        if arr.ndim >= 2 and arr.shape[-1] == 7:
            detection_output = arr.reshape(-1, 7)
        elif "box" in lower or (arr.ndim >= 2 and arr.shape[-1] == 5):
            boxes = arr.reshape(-1, 5)
        elif "label" in lower or (arr.ndim <= 2 and np.issubdtype(arr.dtype, np.integer)):
            labels = arr.reshape(-1)

    threshold = max(0.0, min(1.0, float(args.threshold)))
    if detection_output is not None:
        label_names = {1: "person", 2: "vehicle", 3: "bike"}
        detections = []
        for row in detection_output:
            image_id, label, conf, x1, y1, x2, y2 = [float(x) for x in row]
            if image_id < 0:
                break
            if conf < threshold:
                continue
            lid = int(label)
            detections.append({
                "label_id": lid,
                "label": label_names.get(lid, f"class_{lid}"),
                "confidence": round(conf, 5),
                "box": [
                    max(0, round(x1 * original_w, 1)),
                    max(0, round(y1 * original_h, 1)),
                    min(original_w, round(x2 * original_w, 1)),
                    min(original_h, round(y2 * original_h, 1)),
                ],
            })
        emit({
            "ok": True,
            "device": "MYRIAD",
            "device_name": props.get("full_device_name", "Intel Movidius Myriad X VPU"),
            "image": str(image_path),
            "model": str(model_path),
            "threshold": threshold,
            "inference_ms": round(elapsed * 1000, 3),
            "input_shape": shape,
            "image_size": [original_w, original_h],
            "detection_count": len(detections),
            "detections": detections[:200],
            "available_devices": devices,
        })
        return

    if boxes is None or labels is None:
        summary = {name: list(arr.shape) for name, arr in outputs.items()}
        raise RuntimeError(f"Unsupported detector output layout: {summary}")
'''
if old not in s:
    raise SystemExit('ncs2 detector parser block not found')
p.write_text(s.replace(old, new), encoding='utf-8')

# Installer: use working venv, MYRIAD-era SSD model, persist environment hints.
p = ROOT / 'local-bridge' / 'install-ncs2-edge.ps1'
s = p.read_text(encoding='utf-8')
s = s.replace('[string]$PythonExe = "D:\\Python310\\python.exe"', '[string]$PythonExe = "D:\\NCS2_AI\\venv\\Scripts\\python.exe"')
s = s.replace('$ModelName = "person-vehicle-bike-detection-2004"', '$ModelName = "person-vehicle-bike-detection-crossroad-0078"')
s = s.replace('$base = "https://storage.openvinotoolkit.org/repositories/open_model_zoo/2021.4/models_bin/2/$ModelName/FP16"', '$base = "https://storage.openvinotoolkit.org/repositories/open_model_zoo/2022.1/models_bin/2/$ModelName/FP16"')
anchor = '$env:MAGNANIMOUS_NCS2_ROOT = $Root\n'
insert = '$env:MAGNANIMOUS_NCS2_ROOT = $Root\n$env:MAGNANIMOUS_NCS2_PYTHON = $PythonExe\n[Environment]::SetEnvironmentVariable("MAGNANIMOUS_NCS2_ROOT", $Root, "User")\n[Environment]::SetEnvironmentVariable("MAGNANIMOUS_NCS2_PYTHON", $PythonExe, "User")\n'
if anchor not in s:
    raise SystemExit('installer environment anchor not found')
p.write_text(s.replace(anchor, insert), encoding='utf-8')

# Docs accurately describe the isolated environment.
p = ROOT / 'docs' / 'MAGNANIMOUS-NCS2-EDGE-AI.md'
s = p.read_text(encoding='utf-8')
s = s.replace('under `D:\\NCS2_AI` / `D:\\Python310` by default', 'under `D:\\NCS2_AI` with its isolated `venv` by default')
p.write_text(s, encoding='utf-8')

# Strengthen regression lock for the exact hardware-discovered bugs.
p = ROOT / 'qa' / 'scripts' / 'magnanimous-ncs2-edge-lock.mjs'
s = p.read_text(encoding='utf-8')
s = s.replace("const universal=read('worker/src/magnanimous-universal-capabilities.js');", "const universal=read('worker/src/magnanimous-universal-capabilities.js');\nconst security=read('worker/src/security-entrypoint.js');")
s = s.replace("assert(installer.includes('person-vehicle-bike-detection-2004'),'NCS2 installer must provision a useful starter vision model');", "assert(installer.includes('person-vehicle-bike-detection-crossroad-0078'),'NCS2 installer must provision a MYRIAD-compatible starter vision model');")
extra = """assert(agent.includes('D:/NCS2_AI/venv/Scripts/python.exe'),'NCS2 bridge must default to the isolated working Python environment');
assert(agent.includes('NamedTemporaryFile')&&agent.includes('suffix=\".cmd\"'),'NCS2 bridge must use a temp command launcher to avoid Windows cmd quoting regressions');
assert(edge.includes('arr.shape[-1] == 7'),'NCS2 runtime must support SSD DetectionOutput models used by MYRIAD');
assert(security.includes("url.pathname.startsWith('/api/magnanimous/local-bridge')"),'Local Bridge API must remain on the Worker instead of being proxied to standalone Railway');
"""
needle = "assert(installer.includes('pillow==10.4.0'),'NCS2 image runtime dependency must remain explicit');\n"
if needle not in s:
    raise SystemExit('QA lock insertion anchor not found')
s = s.replace(needle, needle + extra)
p.write_text(s, encoding='utf-8')

print('NCS2 live hotfix applied')
