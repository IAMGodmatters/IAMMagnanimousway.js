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

execFileSync(process.execPath,['--check',path.join(ROOT,'portable-creator/host.mjs')],{cwd:ROOT,stdio:'inherit'});
execFileSync(process.execPath,['--check',path.join(ROOT,'portable-creator/app/app.js')],{cwd:ROOT,stdio:'inherit'});

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
 ['browser profile and disk cache are kept on the portable drive for bundled Chromium or system Edge',launcher.includes("$browserProfile = Join-Path $Data 'browser-profile'")&&launcher.includes("$browserCache = Join-Path $Cache 'browser'")&&launcher.includes('--user-data-dir=$browserProfile')&&launcher.includes('--disk-cache-dir=$browserCache')&&launcher.includes('Get-Command msedge.exe')],
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
const failures=checks.filter(([,ok])=>!ok);
for(const [name,ok] of checks)console.log(`${ok?'PASS':'FAIL'} ${name}`);
if(failures.length){console.error(`Portable creator contract failed: ${failures.length} check(s).`);process.exit(1);}
console.log('Magnanimous Portable Creator contract passed.');
