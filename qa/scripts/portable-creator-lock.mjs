import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const read=rel=>fs.readFileSync(path.join(ROOT,rel),'utf8');
const exists=rel=>fs.existsSync(path.join(ROOT,rel));
const host=read('portable-creator/host.mjs');
const app=read('portable-creator/app/app.js');
const html=read('portable-creator/app/index.html');
const css=read('portable-creator/app/styles.css');
const launcher=read('portable-creator/launch-windows.ps1');
const manifest=JSON.parse(read('portable-creator/manifest.json'));
const readme=read('portable-creator/README.md');
const creatorArchitecture=read('docs/live-studio/universal-creator-architecture.md');
const autonomy=read('portable-creator/live-show-autonomy.mjs');
const autonomyTests=read('portable-creator/live-show-autonomy.test.mjs');
const eventRuntime=read('portable-creator/live-event-runtime.mjs');
const eventJournal=read('portable-creator/live-event-journal.mjs');
const eventJournalTests=read('portable-creator/live-event-journal.test.mjs');
const runtimeQa=read('qa/scripts/portable-creator-runtime-test.mjs');
const bridgeRelay=read('worker/src/live-bridge-relay.js');
const bridgeRelayTests=read('worker/src/live-bridge-relay.test.mjs');
const bridgeClient=read('frontend/lib/live-studio/bridge-client.ts');
const bridgePage=read('frontend/app/tiktok-live/bridge/page.tsx');
const aiHost=read('frontend/app/tiktok-live/page.tsx');
const workerEntry=read('worker/src/security-entrypoint.js');
const workerConfig=read('worker/wrangler.jsonc');

execFileSync(process.execPath,['--check',path.join(ROOT,'portable-creator/host.mjs')],{cwd:ROOT,stdio:'inherit'});
execFileSync(process.execPath,['--check',path.join(ROOT,'portable-creator/app/app.js')],{cwd:ROOT,stdio:'inherit'});
execFileSync(process.execPath,['--check',path.join(ROOT,'portable-creator/obs-client.mjs')],{cwd:ROOT,stdio:'inherit'});
execFileSync(process.execPath,['--check',path.join(ROOT,'portable-creator/live-event-journal.mjs')],{cwd:ROOT,stdio:'inherit'});
execFileSync(process.execPath,[path.join(ROOT,'qa/scripts/portable-obs-client.test.mjs')],{cwd:ROOT,stdio:'inherit'});

const checks=[
 ['portable host binds only to IPv4 loopback',host.includes("server.listen(PORT,'127.0.0.1'")&&!host.includes("server.listen(PORT,'0.0.0.0'")],
 ['host enforces a loopback Host header and same-origin mutation boundary',host.includes('req.headers.host')&&host.includes("origin==='http://127.0.0.1:'")],
 ['host uses CSP, no-store, nosniff and frame protections',host.includes('content-security-policy')&&host.includes("cache-control','no-store")&&host.includes('x-content-type-options')&&host.includes('x-frame-options')],
 ['local model is fixed to loopback and cannot be selected by browser input',host.includes("const MODEL_HOST='127.0.0.1'")&&host.includes('const MODEL_PORT=9931')&&!host.includes('body.modelUrl')],
 ['local AI generation is disabled until an explicit local model health check passes',host.includes("MAGNANIMOUS_LOCAL_MODEL_ENABLED!=='true'")&&host.includes('/v1/models')],
 ['local AI context is not allowed to call cloud services or tools',host.includes('You have no internet access, no external tools, no ability to execute code or control accounts')],
 ['vault uses scrypt and authenticated AES-256-GCM encryption',host.includes('crypto.scryptSync')&&host.includes("'aes-256-gcm'")&&host.includes('cipher.getAuthTag()')],
 ['vault key is not stored and is wiped on lock/exit',host.includes('vaultKey.fill(0)')&&host.includes("process.on('SIGINT',close)")],
 ['unlocking with a wrong passphrase leaves the vault locked',host.includes('lockVault();')&&host.includes('candidate.fill(0);lockVault();')],
 ['project data has bounded count, field size and aggregate storage limits',host.includes('MAX_PROJECTS=200')&&host.includes('MAX_PROJECT_TEXT=150000')&&host.includes('nextBytes>25*1024*1024')],
 ['request bodies are bounded and content type is validated',host.includes('MAX_BODY=1024*1024')&&host.includes('Request is too large.')&&host.includes('JSON content type is required.')],
 ['static paths are confined to the portable app folder and allowlisted MIME types',host.includes('path.resolve(APP,relative)')&&host.includes('target.startsWith(APP+path.sep)')&&host.includes('Object.hasOwn(MIME,ext)')],
 ['creator frontend uses same-origin fetch only and no external CDNs',!(/https?:\/\//i.test(app+html+css))&&app.includes('fetch(path')],
 ['saved project display uses text nodes rather than injecting user content as HTML',app.includes('document.createElement')&&app.includes('title.textContent=project.title')&&!app.includes('innerHTML=project.content')],
 ['UI describes offline generation and network-required broadcasting honestly',html.includes('Offline means local creation, not live broadcasting.')&&html.includes('network connection')&&manifest.capabilities.onlineBroadcast.includes('network connection')&&manifest.capabilities.zoomMeeting.includes('network connection')],
 ['Windows launcher writes caches/data under its own USB root',launcher.includes('$Root = [System.IO.Path]::GetFullPath($PSScriptRoot)')&&launcher.includes('$Data = Join-Path $Root')&&!/C:\\\\Users|C:\\\\ProgramData/i.test(launcher)],
 ['Windows launcher makes no automatic downloads or installs',!/(Invoke-WebRequest|Start-BitsTransfer|winget install|choco install|Install-Package)/i.test(launcher)],
 ['one-click launcher uses only process-scoped PowerShell policy without persistent settings changes',read('portable-creator/Start-Magnanimous-Portable.cmd').includes('-ExecutionPolicy Bypass')&&read('portable-creator/Start-Magnanimous-Portable.cmd').includes('Process-scoped execution policy only')],
 ['Windows launcher validates a usable Node runtime and local model health before enabling AI',launcher.includes('& $NodePortable --version')&&launcher.includes('& $systemNode.Source --version')&&launcher.includes('/v1/models')&&launcher.includes("MAGNANIMOUS_LOCAL_MODEL_ENABLED = 'true'")],
 ['unusable USB Node runtime falls back to a validated system Node without downloading',launcher.includes('The USB-bundled Node.js runtime could not be executed')&&launcher.includes('Get-Command node.exe')&&launcher.includes('systemVersion -match')&&launcher.includes('will not download software')],
 ['Windows launcher checks the creator health endpoint before opening the UI',launcher.includes('/api/health')&&launcher.includes("offline-portable")],
 ['local model and creator health probes bypass machine HTTP proxies for loopback only',launcher.includes('function Get-LoopbackJson')&&launcher.includes('$request.Proxy = $null')&&launcher.includes("Get-LoopbackJson -Uri ('http://127.0.0.1:' + $Port + '/api/health')")&&launcher.includes("Get-LoopbackJson -Uri 'http://127.0.0.1:9931/v1/models'")],
 ['browser profile and disk cache are kept on the portable drive for bundled Chromium, Opera or system Edge',launcher.includes("$browserProfile = Join-Path $Data 'browser-profile'")&&launcher.includes("$browserCache = Join-Path $Cache 'browser'")&&launcher.includes('--user-data-dir=$browserProfile')&&launcher.includes('--disk-cache-dir=$browserCache')&&launcher.includes('Get-Command opera.exe')&&launcher.includes('Get-Command msedge.exe')],
 ['Opera is preferred before Edge without changing the Windows default browser',launcher.indexOf('$systemOpera')>=0&&launcher.indexOf('$systemOpera')<launcher.indexOf('$systemEdge')&&launcher.includes('Programs')&&launcher.includes('Opera GX')&&launcher.includes('Opera')],
 ['OBS is optional and uses portable mode rather than an automatic driver install',launcher.includes('portable_mode')&&launcher.includes("'--portable'")&&!launcher.includes('virtualcam-install')],
 ['all models and runtime binaries are optional separately reviewed assets',manifest.optionalComponents.localLanguageModel&&manifest.optionalComponents.broadcastStudio&&readme.includes('does not bundle third-party binaries or model weights')],
 ['manifest separates offline creation from network-dependent broadcast and Zoom',manifest.capabilities.offlineProjectPlanning===true&&manifest.capabilities.onlineBroadcast.includes('network connection')&&manifest.capabilities.zoomMeeting.includes('network connection')],
 ['no external platform account credentials are collected in portable offline app',!/(tiktokPassword|facebookPassword|zoomPassword|oauthRefreshToken)/i.test(host+app+html)],
 ['runtime binaries and model weights are not checked into the portable source',!exists('portable-creator/runtime')&&!exists('portable-creator/models/magnanimous.gguf')],
 ['universal creator architecture distinguishes documented APIs from deployed connectors',creatorArchitecture.includes('does not mean the Magnanimous connector is already authorized or connected')],
 ['TikTok developer access is explicitly review-gated',creatorArchitecture.includes('TikTok\'s developer documentation says API access requires an app submission and approval')],
 ['YouTube and Twitch use their official live event transports',creatorArchitecture.includes('liveChatMessages.streamList')&&creatorArchitecture.includes('Twitch EventSub WebSocket')],
 ['Zoom Meeting SDK bot restriction and RTMS alternative are documented',creatorArchitecture.includes('does not support bots or AI notetakers')&&creatorArchitecture.includes('RTMS')],
 ['OBS local WebSocket authentication and portability boundaries are documented',creatorArchitecture.includes('OBS WebSocket')&&creatorArchitecture.includes('authentication password')&&creatorArchitecture.includes('OBS Portable configuration is Windows-specific')&&creatorArchitecture.includes('All media paths must be portable')],
 ['game adapters prohibit process injection and anti-cheat bypass',creatorArchitecture.includes('does not read game memory, inject code, defeat anti-cheat')],
 ['offline and online delivery are distinct capabilities',creatorArchitecture.includes('Offline mode separates **local creation** from **Internet delivery**')],
];
checks.push(
 ['OBS client uses a fixed loopback address and port',read('portable-creator/obs-client.mjs').includes("const LOOPBACK_HOST='127.0.0.1'")&&read('portable-creator/obs-client.mjs').includes('DEFAULT_PORT=4455')],
 ['OBS WebSocket challenge authentication follows the salted SHA-256 handshake',read('portable-creator/obs-client.mjs').includes('sha256(password+salt)')&&read('portable-creator/obs-client.mjs').includes('sha256(secret+challenge)')],
 ['OBS password is not written to disk or browser storage',!/(localStorage|sessionStorage|writeFileSync).*obsPassword/i.test(host+app)],
 ['OBS host routes require the existing same-origin mutation guard',host.includes("url.pathname==='/api/obs/connect'")&&host.includes("url.pathname==='/api/obs/scene'")&&host.includes("url.pathname==='/api/obs/recording/start'")&&host.includes("allowedRequest(req,req.method!=='GET'")],
 ['OBS scene changes are validated against the current scene list',read('portable-creator/obs-client.mjs').includes('That scene is not in the current OBS scene list.')&&read('portable-creator/obs-client.mjs').includes("this.request('SetCurrentProgramScene'")],
 ['OBS controls require explicit user actions and disclose local-only scope',html.includes('Connect to OBS')&&html.includes('Start recording')&&html.includes('does not start a public livestream')],
 ['OBS recording and scene controls are exposed in the UI',app.includes("'/api/obs/recording/start'")&&app.includes("'/api/obs/scene'")&&app.includes('refreshObsScenes')],
 ['AI takeover defaults to manual mode and requires explicit owner consent',autonomy.includes("mode: 'manual'")&&autonomy.includes("acknowledged !== true")],
 ['portable takeover renews its lease during long speech and exposes heartbeat-only endpoint',host.includes("url.pathname==='/api/live/autonomy/heartbeat'")&&app.includes("setInterval(sendAutonomyHeartbeat,10000)")&&app.includes('stopAutonomyPolling(true)')],
 ['AI takeover only permits host speech and approved OBS scene switches',autonomy.includes("['host_speech', 'obs_scene_switch']")&&autonomy.includes('scene_not_approved')],
 ['AI takeover session is time-bounded and automatically expires',autonomy.includes('MAX_SESSION_MS = 60 * 60 * 1000')&&autonomy.includes('session_expired')],
 ['AI takeover stops after the control-surface heartbeat lease expires',autonomy.includes('IDLE_LEASE_MS = 30_000')&&autonomy.includes('control_surface_disconnected')],
 ['AI takeover has a bounded action rate and pending action limit',autonomy.includes('MAX_ACTIONS_PER_MINUTE = 6')&&autonomy.includes('MAX_PENDING_ACTIONS = 12')],
 ['autonomous host never grants moderation, account, payment or broadcast controls',!autonomy.includes("'moderate_chat'")&&!autonomy.includes("'broadcast.start'")&&!autonomy.includes("'payment.create'")],
 ['portable local model event context redacts emails, phone numbers, URLs and credential strings',host.includes('[email removed]')&&host.includes('[phone number removed]')&&host.includes('[sensitive detail removed]')],
 ['portable autonomous browser panel includes a visible owner stop button',html.includes('id="liveAutonomyStart"')&&html.includes('id="liveAutonomyStop"')&&app.includes('operator_emergency_stop')],
 ['portable autonomy decision and timeout scenarios have dedicated automated tests',autonomyTests.includes('emergency stop immediately revokes')&&autonomyTests.includes('control surface disappears')&&autonomyTests.includes('six autonomous actions')],
 ['offline draft planner works without a local model',app.includes('function buildOfflineDraft')&&app.includes("message('creatorMessage','Created with the built-in offline draft planner")],
 ['offline planner covers live shows, scripts, lessons, storyboards and ideas',["'live-show'","'script'","'lesson'","'storyboard'","'idea'"].every(kind=>app.includes(kind))],
 ['offline draft clearly distinguishes template output from model-generated output',app.includes('not generated by an AI model')&&app.includes('not AI-generated text')],
 ['creator generation remains usable when a local model is absent',app.includes("$('generateButton').disabled=!$('prompt').value.trim()")&&html.includes('Create an offline draft')],
 ['export control becomes available when draft content exists',app.includes("$('exportButton').disabled=!$('output').value.trim()")],
);
checks.push(
 ['live-event journal uses AES-256-GCM and a key derived from the unlocked workspace',eventJournal.includes("createCipheriv('aes-256-gcm'")&&host.includes("createHmac('sha256',vaultKey)")&&host.includes('magnanimous-live-event-journal-v1')],
 ['live-event journal has bounded storage, fsynced appends and atomic compaction',eventJournal.includes('DEFAULT_MAX_BYTES=8*1024*1024')&&eventJournal.includes('fs.fsyncSync(fd)')&&eventJournal.includes('compact(events,seenKeys=[])')],
 ['live-event delivery uses short leases and explicit durable acknowledgements',eventRuntime.includes('claim(limit=10)')&&eventRuntime.includes('acknowledge(deliveryId,eventKeys)')&&host.includes("/api/live/events/ack")&&app.includes("/api/live/events/ack")],
 ['live-event intake and review require a verified unlocked workspace',host.includes('restoreLiveEvents()')&&host.includes('liveEvents.clear();liveEventsRestored=false')&&host.includes('Unlock the encrypted USB workspace before accepting events.')],
 ['runtime QA covers journal authentication, interrupted writes and vault-lock recovery',eventJournalTests.includes('wrong-key recovery cannot erase')&&eventJournalTests.includes('simulated interrupted USB write')&&runtimeQa.includes('live-event-journal.test.mjs')]
);
checks.push(
 ['live bridge relay is exported through the existing secured Worker entrypoint',workerEntry.includes("import { handleLiveBridgeRelay, MagnanimousLiveBridgeRoom } from './live-bridge-relay.js'")&&workerEntry.includes("policyUrl.pathname.startsWith('/api/live-bridge/')")&&workerEntry.includes('if(bridgeResponse.status===101)return bridgeResponse')],
 ['live bridge Durable Object and account-scoped pairing rate limit are declared',workerConfig.includes('"LIVE_BRIDGE_ROOMS"')&&workerConfig.includes('"MagnanimousLiveBridgeRoom"')&&workerConfig.includes('"LIVE_BRIDGE_PAIR_LIMITER"')&&workerConfig.includes('"v1-live-bridge-rooms"')],
 ['bridge pairs bind browser and companion tokens to one tenant and owner with short pairing expiry',bridgeRelay.includes('browserHash')&&bridgeRelay.includes('companionHash')&&bridgeRelay.includes('tenantId')&&bridgeRelay.includes('userId')&&bridgeRelay.includes('TOKEN_TTL_MS = 10 * 60 * 1000')&&bridgeRelay.includes('SESSION_TTL_MS = 12 * 60 * 60 * 1000')],
 ['bridge authentication assigns separate browser and companion roles and checks the expected origin',bridgeRelay.includes("role==='browser'&&attachment.origin!==attachment.expectedOrigin")&&bridgeRelay.includes("role==='companion'&&attachment.origin!==null")&&bridgeRelay.includes('ORIGIN_ROLE_MISMATCH')],
 ['bridge relay bounds message size, connection count, session duration and role-specific rate',bridgeRelay.includes('MAX_MESSAGE_BYTES = 16 * 1024')&&bridgeRelay.includes('length>=4')&&bridgeRelay.includes('SESSION_TTL_MS')&&bridgeRelay.includes("attachment.role==='browser'?10:30")],
 ['bridge pair revocation verifies tenant and owner, deletes command history and closes sockets',bridgeRelay.includes('This bridge pair belongs to another account.')&&bridgeRelay.includes("storage.delete('commands')")&&bridgeRelay.includes("socket.close(4003,'Pair revoked')")],
 ['bridge remote production controls are limited to host speech and OBS scene selection',bridgeRelay.includes("input.action==='scene.set'")&&bridgeRelay.includes("input.action==='host.speak'")&&!bridgeRelay.includes("input.action==='broadcast.start'")&&!bridgeRelay.includes("input.action==='moderate_chat'")],
 ['bridge command ledger prevents duplicates and enforces 5-minute expiry and a 20-command ceiling',bridgeRelay.includes('now+5*60_000')&&bridgeRelay.includes('COMMAND_QUEUE_FULL')&&bridgeRelay.includes('DUPLICATE_COMMAND')&&bridgeRelay.includes('ledger.slice(-50)')],
 ['bridge command receipts accept only known statuses and enforce the owner approval lifecycle',bridgeRelay.includes("new Set(['received','approved','rejected','completed','failed'])")&&bridgeRelay.includes('COMMAND_TRANSITIONS')&&bridgeRelay.includes('INVALID_COMMAND_TRANSITION')],
 ['bridge returns explicit failure when the companion is offline or the socket cannot receive a command',bridgeRelay.includes('COMMAND_NOT_DELIVERED')&&bridgeRelay.includes('not delivered')],
 ['bridge replays recent command receipts after reconnect and does not expose receipt speech text',bridgeRelay.includes("kind:'command.receipt'")&&bridgeRelay.includes('recentReceipts')&&!bridgeRelay.includes('speechText:receipt')],
 ['secure bridge client validates the official remote WSS endpoint and only permits loopback ws for local use',bridgeClient.includes("url.hostname==='iammagnanimousway.com'")&&bridgeClient.includes("url.protocol==='ws:'&&loopback")&&bridgeClient.includes('url.pathname')&&bridgeClient.includes('url.port')&&bridgeClient.includes('wss:')],
 ['secure browser companion keeps pairing tokens in component state and clears them on disconnect',bridgePage.includes('setPairingToken(\'\')')&&bridgePage.includes('setCompanionToken(\'\')')&&!/localStorage\\.(setItem|getItem).*Token/i.test(bridgePage)],
 ['bridge UI exposes lifecycle receipts and never calls a remote command completed merely because it was sent',bridgePage.includes('onCommandReceipt:receipt=>')&&bridgePage.includes('VERIFIED COMMAND RECEIPTS')&&bridgePage.includes('Command transmitted. Waiting for the local companion')],
 ['online AI Host preserves existing takeover and can route generated voice to the paired USB Creator',aiHost.includes('useCompanionVoice')&&aiHost.includes('magnanimous-live-host-bridge-v1')&&aiHost.includes('host.speak')&&aiHost.includes('Start AI takeover')&&aiHost.includes('STOP AI TAKEOVER')],
 ['online AI Host reports companion receipt status and pauses additional speech until terminal result',aiHost.includes('host.speak.receipt')&&aiHost.includes("payload.status === 'rejected'")&&aiHost.includes('setSpeaking(true)')],
 ['portable bridge connection only accepts the official WSS endpoint and clears pending actions when vault locks',host.includes("url.hostname!=='iammagnanimousway.com'")&&host.includes('function validateBridgePairing')&&host.includes('function lockVault(){\n closeBridge();')],
 ['portable host speech and scene commands remain in a local approval queue before execution',host.includes('pendingBridgeCommands.push')&&host.includes("url.pathname==='/api/bridge/command/review'")&&html.includes('LOCAL APPROVAL REQUIRED')],
 ['portable bridge receipt confirms speech only after local speech synthesis reports onend',app.includes('utterance.onend=')&&app.includes("finishBridgeSpeech(result.commandId,'completed')")&&host.includes("url.pathname==='/api/bridge/command/result'")],
 ['portable OBS bridge command requires connected OBS and reports completion after the local scene switch',host.includes("if(!obsClient?.connected)return json(res,409,{detail:'Connect to OBS locally before approving a scene change.'})")&&host.includes('await obsClient.setProgramScene(command.sceneName)')&&host.includes("sendBridgeCommandReceipt(commandId,'completed')")],
 ['portable Creator exposes explicit connect, disconnect, approve and reject controls for the companion',html.includes('id="bridgeConnectButton"')&&html.includes('id="bridgeDisconnectButton"')&&app.includes('reviewBridgeCommand(command.commandId,true)')&&app.includes('reviewBridgeCommand(command.commandId,false)')],
 ['portable companion pairing inputs are not persisted and are cleared from memory on disconnect',app.includes("$('bridgeToken').value=''")&&host.includes('pendingBridgeCommands.length=0;approvedBridgeCommands.clear()')&&!/(localStorage|sessionStorage).*bridgeToken/i.test(app)],
 ['full platform QA executes the bridge relay tests and syntax-checks the Worker module',workflow.includes('worker/src/live-bridge-relay.test.mjs')&&workflow.includes('node --check worker/src/live-bridge-relay.js')],
 ['relay regression suite covers offline delivery, duplicate IDs, receipt state transitions and reconnect recovery',bridgeRelayTests.includes('offline')&&bridgeRelayTests.includes('DUPLICATE_COMMAND')&&bridgeRelayTests.includes('INVALID_COMMAND_TRANSITION')&&bridgeRelayTests.includes('browser reconnect receives the latest non-expired local command receipt')]
);
checks.push(
 ['AI Host emergency stop is allowed only as a local host-speech cancellation command',bridgeRelay.includes("input.action==='host.stop'")&&bridgeRelayTests.includes("action:'host.stop'")&&host.includes("value.action==='host.stop'")&&!bridgeRelay.includes("input.action==='broadcast.stop'")],
 ['USB companion consumes AI Host stop requests, cancels device speech and confirms the stop receipt',host.includes('bridgeStopRequest={commandId:command.commandId,issuedAt:Date.now()}')&&app.includes("data.stopRequest?.commandId")&&app.includes('window.speechSynthesis.cancel()')&&app.includes("outcome:'completed'")],
 ['local Creator exposes a separate stop control and stops its local autonomous voice when requested',html.includes('id="bridgeStopSpeechButton"')&&app.includes('async function stopDeviceSpeech()')&&app.includes("stopLiveAutonomy('operator_emergency_stop')")],
 ['stale companion speech and stop reservations expire instead of remaining active indefinitely',host.includes('now-Number(item.approvedAt)>5*60_000')&&host.includes('bridgeStopRequest=null')],
 ['AI Host STOP sends the narrow host.stop action to the paired bridge',aiHost.includes("type: 'host.stop'")&&aiHost.includes('host.stop.receipt')&&bridgePage.includes("action:'host.stop'")],
);
const failures=checks.filter(([,ok])=>!ok);
for(const [name,ok] of checks)console.log(`${ok?'PASS':'FAIL'} ${name}`);
if(failures.length){console.error(`Portable creator contract failed: ${failures.length} check(s).`);process.exit(1);}
console.log('Magnanimous Portable Creator contract passed.');
