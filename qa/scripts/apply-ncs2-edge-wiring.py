from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def patch(rel, old, new, marker):
    path = ROOT / rel
    text = path.read_text(encoding="utf-8")
    if marker in text:
        print(f"already wired: {rel} :: {marker}")
        return
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"Expected exactly one patch anchor in {rel}, found {count}: {marker}")
    path.write_text(text.replace(old, new, 1), encoding="utf-8")
    print(f"wired: {rel} :: {marker}")


patch(
    "local-bridge/bridge_agent.py",
    '''def _detect_netwalk(config):
    configured = config.get("netwalk_toolkit") or os.environ.get("MAGNANIMOUS_NETWALK_TOOLKIT")
    if not configured:
        return None
    root = Path(configured).expanduser().resolve()
    return root if (root / "scripts").is_dir() else None


def capabilities(config):''',
    '''def _detect_netwalk(config):
    configured = config.get("netwalk_toolkit") or os.environ.get("MAGNANIMOUS_NETWALK_TOOLKIT")
    if not configured:
        return None
    root = Path(configured).expanduser().resolve()
    return root if (root / "scripts").is_dir() else None


def _detect_ncs2(config):
    now = time.time()
    cached = getattr(_detect_ncs2, "_cache", None)
    if cached and now - cached[0] < 30:
        return cached[1]
    root_value = os.environ.get("MAGNANIMOUS_NCS2_ROOT") or ("D:/NCS2_AI" if os.name == "nt" else str(Path.home() / "NCS2_AI"))
    python_value = os.environ.get("MAGNANIMOUS_NCS2_PYTHON") or ("D:/Python310/python.exe" if os.name == "nt" else sys.executable)
    root = Path(root_value).expanduser().resolve()
    python_exe = Path(python_value).expanduser().resolve()
    runtime = Path(__file__).with_name("ncs2_edge.py").resolve()
    setup = next(root.glob("openvino_2022.3.1/**/setupvars.bat"), None) if root.is_dir() else None
    model = root / "models" / "person-vehicle-bike-detection-2004" / "FP16" / "person-vehicle-bike-detection-2004.xml"
    value = None
    if os.name == "nt" and root.is_dir() and python_exe.is_file() and runtime.is_file() and setup and setup.is_file():
        value = {"root": root, "python": python_exe, "runtime": runtime, "setup": setup.resolve(), "model": model}
    _detect_ncs2._cache = (now, value)
    return value


def capabilities(config):''',
    "def _detect_ncs2(config):",
)

patch(
    "local-bridge/bridge_agent.py",
    '''    if _detect_netwalk(config):
        caps.update({"netwalk_probe","netwalk_scan","netwalk_diag","netwalk_map","netwalk_report"})
    if shutil.which("ssh"):
''',
    '''    if _detect_netwalk(config):
        caps.update({"netwalk_probe","netwalk_scan","netwalk_diag","netwalk_map","netwalk_report"})
    ncs2 = _detect_ncs2(config)
    if ncs2:
        caps.update({"ncs2_status", "ncs2_benchmark"})
        if ncs2["model"].is_file():
            caps.add("ncs2_detect")
    if shutil.which("ssh"):
''',
    'caps.update({"ncs2_status", "ncs2_benchmark"})',
)

patch(
    "local-bridge/bridge_agent.py",
    '''HANDLERS = {
''',
    '''def _ncs2_runtime(config):
    runtime = _detect_ncs2(config)
    if not runtime:
        raise RuntimeError("Intel Neural Compute Stick 2 runtime is not configured on this Local Bridge.")
    return runtime


def _run_ncs2(config, args, *, timeout=180):
    runtime = _ncs2_runtime(config)
    command = f'call "{runtime["setup"]}" >nul && ' + subprocess.list2cmdline([
        str(runtime["python"]), str(runtime["runtime"]), *[str(x) for x in args]
    ])
    result = _run(["cmd.exe", "/d", "/s", "/c", command], timeout=timeout)
    rows = [line.strip() for line in (result.get("stdout") or "").splitlines() if line.strip().startswith("{")]
    data = None
    if rows:
        try:
            data = json.loads(rows[-1])
        except Exception:
            data = None
    if result.get("code") != 0 or not isinstance(data, dict) or data.get("ok") is not True:
        detail = (data or {}).get("error") if isinstance(data, dict) else ""
        raise RuntimeError(detail or result.get("stderr") or result.get("stdout") or "NCS2 inference failed.")
    return data


def action_ncs2_status(config, payload):
    return _run_ncs2(config, ["status"], timeout=60)


def action_ncs2_benchmark(config, payload):
    count = max(10, min(1000, int(payload.get("count") or 100)))
    jobs = max(1, min(8, int(payload.get("jobs") or 4)))
    return _run_ncs2(config, ["benchmark", "--count", str(count), "--jobs", str(jobs)], timeout=180)


def _download_ncs2_image(value):
    url = _public_web_url(value)
    suffix = Path(urllib.parse.urlparse(url).path).suffix.lower()
    if suffix not in {".jpg", ".jpeg", ".png", ".bmp", ".webp"}:
        suffix = ".img"
    req = urllib.request.Request(url, headers={"User-Agent": "Magnanimous-NCS2-Edge/1.0"}, method="GET")
    with urllib.request.urlopen(req, timeout=30) as response:
        content_type = str(response.headers.get("content-type") or "").lower()
        if not content_type.startswith("image/"):
            raise RuntimeError("ncs2_detect image_url must return an image content type.")
        data = response.read(10_000_001)
        if len(data) > 10_000_000:
            raise RuntimeError("ncs2_detect image exceeds the 10 MB safety limit.")
    handle = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    try:
        handle.write(data)
        return Path(handle.name)
    finally:
        handle.close()


def action_ncs2_detect(config, payload):
    runtime = _ncs2_runtime(config)
    model = runtime["model"]
    if not model.is_file():
        raise RuntimeError("NCS2 starter detection model is not installed. Run install-ncs2-edge.ps1.")
    threshold = max(0.05, min(0.99, float(payload.get("threshold") or 0.5)))
    temporary = None
    if str(payload.get("image_url") or "").strip():
        image = temporary = _download_ncs2_image(payload.get("image_url"))
    else:
        ws = _workspace(config, payload.get("workspace"))
        image = _path_in_workspace(ws, payload.get("path"))
        if not image.is_file():
            raise RuntimeError("Requested image does not exist.")
        if image.stat().st_size > 10_000_000:
            raise RuntimeError("ncs2_detect local image exceeds the 10 MB safety limit.")
    try:
        return _run_ncs2(config, ["detect", "--image", str(image), "--model", str(model), "--threshold", str(threshold)], timeout=120)
    finally:
        if temporary:
            try:
                temporary.unlink()
            except OSError:
                pass


HANDLERS = {
''',
    "def action_ncs2_status(config, payload):",
)

patch(
    "local-bridge/bridge_agent.py",
    '''    "netwalk_report": action_netwalk_report,
}''',
    '''    "netwalk_report": action_netwalk_report,
    "ncs2_status": action_ncs2_status,
    "ncs2_benchmark": action_ncs2_benchmark,
    "ncs2_detect": action_ncs2_detect,
}''',
    '"ncs2_detect": action_ncs2_detect',
)

patch(
    "local-bridge/install.ps1",
    '''$source = "https://raw.githubusercontent.com/IAMGodmatters/IAMMagnanimousway.js/main/local-bridge/bridge_agent.py"
Write-Host "Downloading the Magnanimous Local Bridge agent..."
Invoke-WebRequest -UseBasicParsing -Uri $source -OutFile $agent
''',
    '''$source = "https://raw.githubusercontent.com/IAMGodmatters/IAMMagnanimousway.js/main/local-bridge/bridge_agent.py"
Write-Host "Downloading the Magnanimous Local Bridge agent..."
Invoke-WebRequest -UseBasicParsing -Uri $source -OutFile $agent
$ncs2Agent = Join-Path $homeDir "ncs2_edge.py"
$ncs2Source = "https://raw.githubusercontent.com/IAMGodmatters/IAMMagnanimousway.js/main/local-bridge/ncs2_edge.py"
try {
  Invoke-WebRequest -UseBasicParsing -Uri $ncs2Source -OutFile $ncs2Agent
  Write-Host "Magnanimous NCS2 edge helper installed (activates only when a compatible local NCS2 runtime is present)."
} catch {
  Write-Warning "NCS2 edge helper was not available. Core Local Bridge activation will continue."
}
''',
    "$ncs2Agent = Join-Path $homeDir \"ncs2_edge.py\"",
)

patch(
    "worker/src/magnanimous-local-bridge-runtime.js",
    ''' netwalk_probe:{risk:'medium',auto:false,confirmation:false,family:'netwalk',scope_required:true},''',
    ''' ncs2_status:{risk:'low',auto:true,confirmation:false,family:'edge-ai'},
 ncs2_benchmark:{risk:'medium',auto:false,confirmation:false,family:'edge-ai'},
 ncs2_detect:{risk:'low',auto:true,confirmation:false,family:'edge-ai'},
 netwalk_probe:{risk:'medium',auto:false,confirmation:false,family:'netwalk',scope_required:true},''',
    "ncs2_status:{risk:'low'",
)

patch(
    "worker/src/magnanimous-local-bridge-runtime.js",
    ''' arbitrary_process_execution:false,
 workspace_roots_required:true,''',
    ''' arbitrary_process_execution:false,
 edge_ai_inference_only:true,
 edge_ai_inbound_listener_required:false,
 workspace_roots_required:true,''',
    "edge_ai_inference_only:true",
)

patch(
    "worker/src/magnanimous-local-bridge-runtime.js",
    ''' if(['read_file','search_text','git_status','git_diff','git_log','project_test','project_lint','project_typecheck','project_build','apply_patch','git_create_branch','git_commit'].includes(action)&&!clip(body.workspace,1000))throw new Error('A paired workspace path/id is required.');''',
    ''' if(action==='ncs2_benchmark'){
  const count=Number(body.count||100),jobs=Number(body.jobs||4);
  if(!Number.isInteger(count)||count<10||count>1000)throw new Error('ncs2_benchmark count must be an integer from 10 to 1000.');
  if(!Number.isInteger(jobs)||jobs<1||jobs>8)throw new Error('ncs2_benchmark jobs must be an integer from 1 to 8.');
 }
 if(action==='ncs2_detect'){
  const hasUrl=Boolean(clip(body.image_url,4000)),hasLocal=Boolean(clip(body.workspace,1000)&&clip(body.path,2000));
  if(!hasUrl&&!hasLocal)throw new Error('ncs2_detect requires image_url or workspace + path.');
  const threshold=Number(body.threshold??0.5);if(!Number.isFinite(threshold)||threshold<0.05||threshold>0.99)throw new Error('ncs2_detect threshold must be between 0.05 and 0.99.');
  if(hasUrl){
   let imageUrl;try{imageUrl=new URL(String(body.image_url||''))}catch{}
   if(!imageUrl||!['http:','https:'].includes(imageUrl.protocol)||imageUrl.username||imageUrl.password)throw new Error('ncs2_detect image_url must be a public http(s) URL without embedded credentials.');
   const host=String(imageUrl.hostname||'').toLowerCase();
   if(host==='localhost'||host.endsWith('.localhost')||host.endsWith('.local')||/^127\\.|^0\\.|^169\\.254\\.|^10\\.|^192\\.168\\.|^172\\.(1[6-9]|2\\d|3[01])\\./.test(host))throw new Error('ncs2_detect private/local image targets are blocked.');
  }
 }
 if(['read_file','search_text','git_status','git_diff','git_log','project_test','project_lint','project_typecheck','project_build','apply_patch','git_create_branch','git_commit'].includes(action)&&!clip(body.workspace,1000))throw new Error('A paired workspace path/id is required.');''',
    "ncs2_detect requires image_url or workspace + path.",
)

patch(
    "worker/src/magnanimous-capability-mesh.js",
    '''import { findReadyLocalBridgeDevice, hasAnyReadyLocalBridgeCapability } from './magnanimous-local-bridge-runtime.js';''',
    '''import { findReadyLocalBridgeDevice, hasAnyReadyLocalBridgeCapability, queueLocalBridgeTask } from './magnanimous-local-bridge-runtime.js';''',
    "queueLocalBridgeTask } from './magnanimous-local-bridge-runtime.js'",
)

patch(
    "worker/src/magnanimous-capability-mesh.js",
    ''' 'mesh.self_check':{surface:'capability-mesh',mode:'read',native:true}''',
    ''' 'edge.ncs2.status':{surface:'edge-ai',mode:'local-read',native:true},
 'edge.ncs2.benchmark':{surface:'edge-ai',mode:'local-benchmark',native:true},
 'edge.ncs2.detect':{surface:'edge-ai',mode:'local-inference',native:true},
 'mesh.self_check':{surface:'capability-mesh',mode:'read',native:true}''',
    "'edge.ncs2.status'",
)

patch(
    "worker/src/magnanimous-capability-mesh.js",
    '''function cloudReadiness(env){''',
    '''async function edgeAiReadiness(env,tenantId){
 const checker=tenantId
  ? async action=>Boolean(await findReadyLocalBridgeDevice(env,tenantId,action))
  : action=>hasAnyReadyLocalBridgeCapability(env,action);
 const actions=['ncs2_status','ncs2_benchmark','ncs2_detect'];
 const pairs=await Promise.all(actions.map(async action=>[action,Boolean(await checker(action).catch(()=>false))]));
 const capabilities=Object.fromEntries(pairs);
 return{
  hardware:'Intel Neural Compute Stick 2 / Movidius Myriad X',
  runtime:'OpenVINO 2022.3.1 LTS',
  local_bridge:capabilities,
  status_ready:Boolean(capabilities.ncs2_status),
  benchmark_ready:Boolean(capabilities.ncs2_benchmark),
  vision_ready:Boolean(capabilities.ncs2_detect),
  offline_inference:true,
  cloud_llm_acceleration:false,
  phone_access:'indirect-through-Magnanimous-AI-and-outbound-Local-Bridge'
 };
}

function cloudReadiness(env){''',
    "async function edgeAiReadiness(env,tenantId)",
)

patch(
    "worker/src/magnanimous-capability-mesh.js",
    '''function readinessRows({cloudflare,web,github,railway,cloud,media,terminal,apps}){''',
    '''function readinessRows({cloudflare,web,github,railway,cloud,media,terminal,apps,edgeAi}){''',
    "apps,edgeAi})",
)

patch(
    "worker/src/magnanimous-capability-mesh.js",
    '''  {id:'native-terminal-orchestration',ready:true,required:false,mode:'native',detail:'Command classification, redaction, rollback planning and confirmation policy are native Magnanimous capabilities.'},''',
    '''  {id:'native-terminal-orchestration',ready:true,required:false,mode:'native',detail:'Command classification, redaction, rollback planning and confirmation policy are native Magnanimous capabilities.'},
  {id:'ncs2-edge-ai',ready:Boolean(edgeAi?.status_ready),required:false,mode:'owner-local-edge-inference',detail:edgeAi?.status_ready?'Intel Neural Compute Stick 2 / MYRIAD is heartbeat-ready for bounded local inference through the outbound Local Bridge.':'NCS2 support is installed in Magnanimous; activate the compatible owner-local OpenVINO 2022.3.1 runtime to advertise it.'},''',
    "id:'ncs2-edge-ai'",
)

patch(
    "worker/src/magnanimous-capability-mesh.js",
    ''' const [web,terminal,apps]=await Promise.all([nativeWebReadiness(env,tenantId),getMagnanimousNativeTerminalSummary(env,tenantId),getMagnanimousUniversalAppFabricSummary(env,tenantId)]);''',
    ''' const [web,terminal,apps,edgeAi]=await Promise.all([nativeWebReadiness(env,tenantId),getMagnanimousNativeTerminalSummary(env,tenantId),getMagnanimousUniversalAppFabricSummary(env,tenantId),edgeAiReadiness(env,tenantId)]);''',
    "apps,edgeAi]=await Promise.all",
)

patch(
    "worker/src/magnanimous-capability-mesh.js",
    ''' const readiness=readinessRows({cloudflare,web,github,railway,cloud,media,terminal,apps});''',
    ''' const readiness=readinessRows({cloudflare,web,github,railway,cloud,media,terminal,apps,edgeAi});''',
    "terminal,apps,edgeAi});",
)

patch(
    "worker/src/magnanimous-capability-mesh.js",
    ''' if(!web.core_read_ready)suggestions.push({id:'activate-local-bridge',risk:'local-owner-action',action:'Re-run the Magnanimous Local Bridge activation/update so Chromium advertises the newest native web capabilities.'});''',
    ''' if(!web.core_read_ready)suggestions.push({id:'activate-local-bridge',risk:'local-owner-action',action:'Re-run the Magnanimous Local Bridge activation/update so Chromium advertises the newest native web capabilities.'});
 if(!edgeAi.status_ready)suggestions.push({id:'activate-ncs2-edge-ai',risk:'local-owner-action',action:'On the owner PC with the Intel Neural Compute Stick 2 attached, run local-bridge/install-ncs2-edge.ps1 and refresh the Local Bridge so MYRIAD edge inference is advertised.'});''',
    "id:'activate-ncs2-edge-ai'",
)

patch(
    "worker/src/magnanimous-capability-mesh.js",
    '''   native_terminal:terminal,
   github,''',
    '''   native_terminal:terminal,
   edge_ai:edgeAi,
   github,''',
    "edge_ai:edgeAi",
)

patch(
    "worker/src/magnanimous-capability-mesh.js",
    '''   'Hey Terminal is not required for native SSH planning/execution; credentials remain on the owner-controlled Local Bridge machine.',
   'Real hardware, public IP space, Internet transit, registrar authority and other physical/regulated rails must exist somewhere.'
''',
    '''   'Hey Terminal is not required for native SSH planning/execution; credentials remain on the owner-controlled Local Bridge machine.',
   'The Intel Neural Compute Stick 2 is an optional owner-local edge accelerator for compatible inference; it does not accelerate hosted ChatGPT or other cloud LLM inference.',
   'Real hardware, public IP space, Internet transit, registrar authority and other physical/regulated rails must exist somewhere.'
''',
    "does not accelerate hosted ChatGPT",
)

patch(
    "worker/src/magnanimous-capability-mesh.js",
    ''' if(capability==='terminal.summary')return wrap(await handleMagnanimousNativeTerminal''',
    ''' const edgeActions={'edge.ncs2.status':'ncs2_status','edge.ncs2.benchmark':'ncs2_benchmark','edge.ncs2.detect':'ncs2_detect'};
 if(edgeActions[capability]){
  const user=await currentUser(request,env).catch(()=>null);if(!user)return json({detail:'Signed-in tenant user is required for owner-local edge inference.'},401);
  const queued=await queueLocalBridgeTask(env,user,{action:edgeActions[capability],payload:input,allowConfirmation:false});
  if(!queued.ok)return json({mesh:{capability,surface:def.surface,operator:'Magnanimous AI'},...queued},503);
  return json({mesh:{capability,surface:def.surface,operator:'Magnanimous AI'},...queued,polling_endpoint:'/api/magnanimous/local-bridge/tasks/'+queued.id},202);
 }

 if(capability==='terminal.summary')return wrap(await handleMagnanimousNativeTerminal''',
    "const edgeActions={'edge.ncs2.status'",
)

patch(
    "worker/src/magnanimous-capability-mesh.js",
    '''   native_terminal_capabilities:MAGNANIMOUS_NATIVE_TERMINAL_CAPABILITIES,
   universal_app_fabric:getUniversalCapabilityIndexSummary()''',
    '''   native_terminal_capabilities:MAGNANIMOUS_NATIVE_TERMINAL_CAPABILITIES,
   edge_ai_capabilities:['edge.ncs2.status','edge.ncs2.benchmark','edge.ncs2.detect'],
   universal_app_fabric:getUniversalCapabilityIndexSummary()''',
    "edge_ai_capabilities:['edge.ncs2.status'",
)

patch(
    "worker/src/provider-entrypoint.js",
    '''Use the Magnanimous Capability Mesh as the provider-neutral execution map for native web, GitHub engineering, Magnanimous Cloud, optional Cloudflare adapters and optional Railway capacity rails. Prefer native-ready surfaces, report degraded readiness truthfully, and never confuse an installed contract with a live authorized executor.''',
    '''Use the Magnanimous Capability Mesh as the provider-neutral execution map for native web, GitHub engineering, Magnanimous Cloud, optional Cloudflare adapters and optional Railway capacity rails. Prefer native-ready surfaces, report degraded readiness truthfully, and never confuse an installed contract with a live authorized executor. When a paired owner computer advertises NCS2 / MYRIAD edge AI, prefer it for compatible camera, object-detection and local vision preprocessing; return compact structured detections to Magnanimous reasoning and never claim that the stick accelerates hosted ChatGPT or another cloud LLM.''',
    "NCS2 / MYRIAD edge AI",
)

patch(
    "worker/src/provider-entrypoint.js",
    '''  ['capability-mesh','Capability Mesh','Unified Magnanimous routing across native web, GitHub, Magnanimous Cloud, Cloudflare adapters and Railway deployment rails.'],''',
    '''  ['capability-mesh','Capability Mesh','Unified Magnanimous routing across native web, GitHub, Magnanimous Cloud, Cloudflare adapters and Railway deployment rails.'],
  ['edge-ai','Edge AI Coprocessor','Owner-controlled NCS2 / MYRIAD inference for offline and hybrid online vision preprocessing through the Magnanimous Local Bridge.'],''',
    "['edge-ai','Edge AI Coprocessor'",
)

patch(
    "worker/src/provider-entrypoint.js",
    '''function nativeCapability(message, task) {
  const m = String(message || '').toLowerCase();
  if (/browse|browser|open website|click|fill|form|scrape|crawl|rendered page|web automation|website monitor/.test(m)) return 'native-web-browser-automation';''',
    '''function nativeCapability(message, task) {
  const m = String(message || '').toLowerCase();
  if (/ncs2|neural compute stick|myriad|edge ai|object detection|person detection|vehicle detection|camera inference/.test(m)) return 'edge-ai-vision';
  if (/browse|browser|open website|click|fill|form|scrape|crawl|rendered page|web automation|website monitor/.test(m)) return 'native-web-browser-automation';''',
    "return 'edge-ai-vision';",
)

patch(
    "worker/src/magnanimous-universal-capabilities.js",
    ''''dependency-retirement-gates']''',
    ''''dependency-retirement-gates','edge-ai-local-accelerator']''',
    "'edge-ai-local-accelerator'",
)

patch(
    "worker/src/magnanimous-universal-capabilities.js",
    '''    'For supported public web automation, prefer the Magnanimous-owned Local Bridge + local Chromium path before any metered external web-agent provider; keep external browser agents optional fallbacks only.',
''',
    '''    'For supported public web automation, prefer the Magnanimous-owned Local Bridge + local Chromium path before any metered external web-agent provider; keep external browser agents optional fallbacks only.',
    'For compatible local camera, image and sensor inference, prefer an owner-controlled edge accelerator such as NCS2 / MYRIAD through the capability-scoped Local Bridge, return structured results to Magnanimous AI, and escalate only the reasoning that genuinely needs cloud AI.',
''',
    "owner-controlled edge accelerator such as NCS2 / MYRIAD",
)

print("NCS2 edge wiring patch complete.")
