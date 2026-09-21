import { currentUser } from './integrations.js';
import { LIVE_PLUGIN_SKILL_RESEARCH_SNAPSHOT } from './magnanimous-live-plugin-skill-research-snapshot.js';
import { findReadyLocalBridgeDevice, queueLocalBridgeTask } from './magnanimous-local-bridge-runtime.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const clip=(v,n=12000)=>String(v??'').trim().slice(0,n);
const HEY_TERMINAL_SKILLS=LIVE_PLUGIN_SKILL_RESEARCH_SNAPSHOT.filter(x=>String(x.plugin_namespace||'').toLowerCase()==='hey-terminal');

export const MAGNANIMOUS_NATIVE_TERMINAL_POLICY=Object.freeze({
 identity:'Magnanimous Native Terminal',
 brain:'Magnanimous AI',
 architecture:'owner-controlled-ssh-through-outbound-local-bridge',
 hey_terminal_required:false,
 external_terminal_app_required:false,
 credentials_leave_owner_device:false,
 raw_shell_exposed:false,
 exact_command_required:true,
 read_only_first:true,
 one_command_at_a_time:true,
 state_change_confirmation_required:true,
 destructive_preview_required:true,
 interactive_programs_owner_device_only:true,
 untrusted_remote_output:true,
 proprietary_backend_copied:false
});

export const MAGNANIMOUS_NATIVE_TERMINAL_CAPABILITIES=Object.freeze([
 {id:'ssh.profile.list',risk:'low',execution:'local-bridge'},
 {id:'ssh.command.classify',risk:'low',execution:'worker-native'},
 {id:'ssh.command.preview',risk:'low',execution:'worker-native'},
 {id:'ssh.read',risk:'low',execution:'local-bridge'},
 {id:'ssh.command.stage',risk:'variable',execution:'local-bridge-confirmed'},
 {id:'ssh.result.interpret',risk:'low',execution:'worker-native'},
 {id:'ssh.connection.diagnose',risk:'low',execution:'worker-native'},
 {id:'ssh.interactive.plan',risk:'low',execution:'owner-device'},
 {id:'ssh.secret.redact',risk:'low',execution:'worker-native'},
 {id:'ssh.rollback.plan',risk:'low',execution:'worker-native'}
]);

const META=new RegExp('[;&|><\\x60\\n\\r]|\\$\\(|\\$\\{|\\|\\||&&');
const SECRET_PATTERNS=[
 /-----BEGIN [A-Z ]*PRIVATE KEY-----/i,
 /\b(?:password|passwd|token|secret|api[_-]?key)\s*=\s*\S+/i,
 /\b(?:sk-[A-Za-z0-9_-]{12,}|gh[pousr]_[A-Za-z0-9_]{20,})\b/
];
const DESTRUCTIVE=/\b(?:rm\s+-rf|mkfs\b|wipefs\b|dd\s+if=|shutdown\b|reboot\b|poweroff\b|DROP\s+(?:DATABASE|TABLE)|TRUNCATE\s+TABLE)\b/i;
const STATE_CHANGING=/\b(?:sudo\b|apt(?:-get)?\s+(?:install|remove|upgrade)|dnf\s+(?:install|remove|upgrade)|yum\s+(?:install|remove|update)|apk\s+(?:add|del)|systemctl\s+(?:restart|start|stop|enable|disable)|service\s+\S+\s+(?:restart|start|stop)|kill(?:all)?\b|chmod\b|chown\b|useradd\b|userdel\b|usermod\b|passwd\b|git\s+(?:push|reset|clean|checkout)|docker\s+(?:rm|stop|restart|compose\s+(?:up|down))|kubectl\s+(?:apply|delete|rollout)|npm\s+(?:install|uninstall)|pip\s+install)\b/i;
const READ_ONLY=/^(?:uptime|df(?:\s|$)|free(?:\s|$)|ps(?:\s|$)|whoami(?:\s|$)|hostname(?:\s|$)|uname(?:\s|$)|date(?:\s|$)|id(?:\s|$)|systemctl\s+status\b|journalctl(?:\s|$))/i;
const INTERACTIVE=/^(?:sudo\s+)?(?:vi|vim|nano|tmux|top|htop|less|more|watch)(?:\s|$)/i;

export function redactTerminalSecrets(value){
 let text=String(value||'');
 text=text.replace(/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/gi,'[REDACTED PRIVATE KEY]');
 text=text.replace(/\b(password|passwd|token|secret|api[_-]?key)\s*=\s*([^\s]+)/gi,'$1=[REDACTED]');
 text=text.replace(/\b(sk-[A-Za-z0-9_-]{12,}|gh[pousr]_[A-Za-z0-9_]{20,})\b/g,'[REDACTED TOKEN]');
 return text;
}

export function classifyTerminalCommand(value){
 const command=clip(value,12000);
 if(!command)return{risk:'invalid',allowed:false,requires_confirmation:false,reason:'Command is required.'};
 if(SECRET_PATTERNS.some(r=>r.test(command)))return{risk:'blocked-secret',allowed:false,requires_confirmation:false,reason:'Secrets or private key material must remain on the owner device.',redacted_command:redactTerminalSecrets(command)};
 if(INTERACTIVE.test(command))return{risk:'interactive',allowed:false,requires_confirmation:false,owner_device_required:true,reason:'Interactive terminal programs require a real local terminal session and are never faked through the non-interactive Local Bridge.'};
 if(DESTRUCTIVE.test(command))return{risk:'destructive',allowed:true,requires_confirmation:true,preview_required:true,reason:'Destructive or difficult-to-reverse command.'};
 if(STATE_CHANGING.test(command)||META.test(command))return{risk:'state-changing',allowed:true,requires_confirmation:true,preview_required:true,reason:META.test(command)?'Shell composition/metacharacters require deliberate confirmation.':'Command can change remote state.'};
 if(READ_ONLY.test(command))return{risk:'read-only',allowed:true,requires_confirmation:false,preview_required:false,reason:'Recognized bounded diagnostic command.'};
 return{risk:'unclassified',allowed:true,requires_confirmation:true,preview_required:true,reason:'Command is not in the native read-only allowlist; stage it for deliberate confirmation.'};
}

function rollbackFor(command,risk){
 const c=String(command||'');
 if(risk==='read-only')return'No rollback needed; command is diagnostic.';
 if(risk==='interactive')return'No remote execution is attempted. Run the interactive program only in a local terminal session you control.';
 if(/systemctl\s+restart\s+(\S+)/i.test(c))return'Capture current service status first. If the restart degrades service, restore the prior configuration and restart the same service.';
 if(/apt|dnf|yum|apk|npm|pip/i.test(c))return'Record current package/version state first; rollback by reinstalling the previous known-good version or restoring the environment lockfile/snapshot.';
 if(/chmod|chown/i.test(c))return'Record current ownership and mode first with stat; rollback by restoring those exact values.';
 if(/git\s+(?:reset|clean|checkout)/i.test(c))return'Create or verify a clean branch/backup first; restore from the prior commit or saved worktree state.';
 if(/rm\s+-rf/i.test(c))return'Create or verify a backup/snapshot first. There is no reliable universal inverse for rm -rf.';
 return'Create a backup, snapshot, or read-only before-state capture before confirmation; define the inverse action before execution.';
}

function previewFor(command,classification){
 const c=String(command||'').trim();
 if(classification.risk==='read-only')return{preview_command:c,note:'The requested command is already read-only.'};
 const service=c.match(/systemctl\s+(?:restart|start|stop|enable|disable)\s+([^\s]+)/i);
 if(service)return{preview_command:'systemctl status '+service[1],note:'Inspect the service before changing it.'};
 const path=c.match(/rm\s+-rf\s+([^\s;&|]+)/i);
 if(path)return{preview_command:'ls -la '+path[1],note:'Inspect the exact target before deletion; also verify a backup or snapshot.'};
 const chmod=c.match(/(?:chmod|chown)\s+.+\s+([^\s;&|]+)$/i);
 if(chmod)return{preview_command:'stat '+chmod[1],note:'Record current ownership and mode before changing them.'};
 if(classification.risk==='interactive')return{preview_command:null,note:'Open a local interactive terminal session on the owner device; do not run this through the batch bridge.'};
 return{preview_command:null,note:'Use the smallest read-only inspection that confirms the target state before execution.'};
}

function diagnoseConnection(stderr){
 const s=String(stderr||'').toLowerCase();
 if(!s)return{kind:'none',detail:'No connection error text was supplied.'};
 if(s.includes('permission denied'))return{kind:'authentication',detail:'SSH authentication was rejected. Verify the local SSH profile/key on the owner device; do not paste credentials into chat.'};
 if(s.includes('host key verification failed'))return{kind:'host-key',detail:'Host-key verification failed. Verify the server fingerprint locally before changing known_hosts.'};
 if(s.includes('connection timed out')||s.includes('operation timed out'))return{kind:'timeout',detail:'The host did not respond before timeout. Check reachability, firewall rules, and the configured host/port.'};
 if(s.includes('connection refused'))return{kind:'refused',detail:'The target answered but refused SSH. Check whether sshd is running and listening on the expected port.'};
 if(s.includes('no route to host'))return{kind:'routing',detail:'The owner device has no network route to the host. Check network/VPN/routing first.'};
 if(s.includes('could not resolve hostname')||s.includes('name or service not known'))return{kind:'dns',detail:'The SSH host name could not be resolved. Check the local SSH alias or DNS entry.'};
 if(s.includes('remote host identification has changed'))return{kind:'host-key-changed',detail:'The saved host key differs from the server. Verify the server identity before accepting any new fingerprint.'};
 return{kind:'unknown',detail:'The error does not match a known SSH connection pattern. Review the redacted stderr and choose the smallest read-only diagnostic.'};
}

export async function getMagnanimousNativeTerminalSummary(env,tenantId=''){
 let device=null;
 if(tenantId)device=await findReadyLocalBridgeDevice(env,tenantId,'ssh_read').catch(()=>null);
 return{
  ...MAGNANIMOUS_NATIVE_TERMINAL_POLICY,
  capability_count:MAGNANIMOUS_NATIVE_TERMINAL_CAPABILITIES.length,
  benchmark_skills:HEY_TERMINAL_SKILLS,
  benchmark_skill_count:HEY_TERMINAL_SKILLS.length,
  local_ssh_ready:Boolean(device),
  execution_mode:device?'owner-controlled-local-bridge':'native-planning-ready-local-ssh-not-heartbeat-ready',
  note:'SSH keys, passwords and tokens stay on the paired owner machine. Magnanimous sends only a safe host alias and exact command. Interactive programs remain local to the owner terminal.'
 };
}

async function requireUser(request,env){
 const user=await currentUser(request,env).catch(()=>null);
 return user||null;
}

export async function handleMagnanimousNativeTerminal(request,env){
 const url=new URL(request.url),path=url.pathname;
 if(!path.startsWith('/api/magnanimous/native-terminal'))return null;

 const user=await requireUser(request,env);
 if(!user)return json({detail:'Signed-in user required.'},401);

 if(request.method==='GET'&&path==='/api/magnanimous/native-terminal')return json(await getMagnanimousNativeTerminalSummary(env,user.tenant_id));
 if(request.method==='GET'&&path==='/api/magnanimous/native-terminal/catalog')return json({policy:MAGNANIMOUS_NATIVE_TERMINAL_POLICY,capabilities:MAGNANIMOUS_NATIVE_TERMINAL_CAPABILITIES,benchmark_skills:HEY_TERMINAL_SKILLS});
 if(request.method==='POST'&&path==='/api/magnanimous/native-terminal/classify'){
  const body=await request.json().catch(()=>({}));
  return json(classifyTerminalCommand(body.command));
 }
 if(request.method==='POST'&&path==='/api/magnanimous/native-terminal/preview'){
  const body=await request.json().catch(()=>({})),command=clip(body.command,12000);
  const classification=classifyTerminalCommand(command);
  return json({ok:Boolean(command),command:redactTerminalSecrets(command),classification,preview:previewFor(command,classification),rollback:rollbackFor(command,classification.risk),provider_dependency:false});
 }
 if(request.method==='POST'&&path==='/api/magnanimous/native-terminal/interactive-plan'){
  const body=await request.json().catch(()=>({})),command=clip(body.command,12000);
  const classification=classifyTerminalCommand(command);
  return json({ok:classification.risk==='interactive',command:redactTerminalSecrets(command),classification,execution_status:'owner-device-interactive-required',instructions:'Use the owner-controlled terminal locally. Keep credentials local, run one command at a time, and share only redacted output for interpretation.'});
 }
 if(request.method==='POST'&&path==='/api/magnanimous/native-terminal/profiles'){
  const queued=await queueLocalBridgeTask(env,user,{action:'ssh_profile_list',payload:{},allowConfirmation:false});
  return json(queued,queued.ok?202:503);
 }
 if(request.method==='POST'&&path==='/api/magnanimous/native-terminal/read'){
  const body=await request.json().catch(()=>({})),host=clip(body.host,128),command=clip(body.command,12000);
  if(!host)return json({detail:'host alias is required.'},400);
  const classification=classifyTerminalCommand(command);
  if(classification.risk!=='read-only')return json({detail:'ssh.read only accepts the native read-only diagnostic allowlist. Use preview/stage for anything else.',classification},400);
  const queued=await queueLocalBridgeTask(env,user,{action:'ssh_read',payload:{host,command},allowConfirmation:false});
  return json({...queued,classification},queued.ok?202:503);
 }
 if(request.method==='POST'&&path==='/api/magnanimous/native-terminal/stage'){
  const body=await request.json().catch(()=>({})),host=clip(body.host,128),command=clip(body.command,12000);
  if(!host)return json({detail:'host alias is required.'},400);
  const classification=classifyTerminalCommand(command);
  if(classification.risk==='interactive')return json({detail:classification.reason,classification,execution_status:'owner-device-interactive-required'},409);
  if(!classification.allowed)return json({detail:classification.reason,classification},400);
  if(classification.risk==='read-only'){
   const queued=await queueLocalBridgeTask(env,user,{action:'ssh_read',payload:{host,command},allowConfirmation:false});
   return json({...queued,classification,preview:previewFor(command,classification),rollback:rollbackFor(command,classification.risk)},queued.ok?202:503);
  }
  const queued=await queueLocalBridgeTask(env,user,{action:'ssh_command',payload:{host,command,authorization_note:clip(body.authorization_note,1000)},allowConfirmation:true});
  return json({...queued,classification,preview:previewFor(command,classification),rollback:rollbackFor(command,classification.risk)},queued.ok?202:503);
 }
 if(request.method==='POST'&&path==='/api/magnanimous/native-terminal/interpret'){
  const body=await request.json().catch(()=>({}));
  const code=Number.isFinite(Number(body.code))?Number(body.code):null;
  const stdout=redactTerminalSecrets(clip(body.stdout,50000)),stderr=redactTerminalSecrets(clip(body.stderr,50000));
  const connection=diagnoseConnection(stderr);
  return json({ok:code===0,code,stdout,stderr,connection,observed_success:code===0,provider_dependency:false,next_step:code===0?'Review the requested finding before any state-changing follow-up.':connection.kind!=='none'?connection.detail:'Use the error output to choose the smallest read-only diagnostic next.'});
 }
 return json({detail:'Magnanimous Native Terminal route not found.'},404);
}
