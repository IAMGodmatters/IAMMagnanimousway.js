import fs from 'node:fs';
import { CHATGPT_PLUGIN_CONTRACT_SNAPSHOT } from '../../worker/src/magnanimous-chatgpt-plugin-capability-snapshot.js';
import { HEYGEN_VISIBLE_BENCHMARK_TOOLS, MAGNANIMOUS_HEYGEN_PARITY_MAP, nativeTargetForHeyGenTool } from '../../worker/src/magnanimous-native-media-studio.js';

const read=p=>fs.readFileSync(p,'utf8');
const must=(value,message)=>{if(!value)throw new Error(message)};

const media=read('worker/src/magnanimous-native-media-studio.js');
const terminal=read('worker/src/magnanimous-native-terminal.js');
const bridgeRuntime=read('worker/src/magnanimous-local-bridge-runtime.js');
const bridgeAgent=read('local-bridge/bridge_agent.py');
const mesh=read('worker/src/magnanimous-capability-mesh.js');
const credentials=read('worker/src/platform-credentials.js');
const providerEnv=read('worker/src/provider-runtime-env.js');

for(const needle of [
 'heygen_required:false',
 'proprietary_backend_copied:false',
 'MAGNANIMOUS_HEYGEN_PARITY_MAP',
 'nativeTargetForHeyGenTool',
 'MAGNANIMOUS_MEDIA_WORKER_URL',
 'MAGNANIMOUS_MEDIA_WORKER_TOKEN',
 'video.lipsync.create',
 'video.translate.create',
 'video.clip.create',
 'video.filler.remove',
 'voice.clone',
 'brand.glossary.create',
 'brand.kit.create',
 'brand.template.generate',
 'avatar.digital_twin.create',
 'avatar.prompt.create',
 'avatar.consent.create',
 'video.agent.generate',
 'FREE_AVATAR_RENDERER_URL'
])must(media.includes(needle),'Native media contract missing '+needle);

must(!/api\.heygen\.com|heygen\.com\/v\d/i.test(media),'Native media runtime must not depend on HeyGen endpoints.');
must(credentials.includes("id:'native-media-worker'"),'Owner Provider Vault must expose the native Magnanimous Media Worker.');
must(credentials.includes('legacy optional adapter; never required by Magnanimous'),'HeyGen credential must be labeled legacy/optional.');
must(providerEnv.includes("'MAGNANIMOUS_MEDIA_WORKER_URL'")&&providerEnv.includes("'MAGNANIMOUS_MEDIA_WORKER_TOKEN'"),'Provider runtime env must expose native media worker configuration.');

const heygen=(CHATGPT_PLUGIN_CONTRACT_SNAPSHOT.find(x=>String(x.namespace||'').toLowerCase()==='heygen')||{tools:[]}).tools||[];
must(heygen.length>0,'HeyGen benchmark tool snapshot must not be empty.');
must(HEYGEN_VISIBLE_BENCHMARK_TOOLS.length===heygen.length,'Visible HeyGen benchmark tool count must stay lossless.');
must(MAGNANIMOUS_HEYGEN_PARITY_MAP.length===heygen.length,'Every HeyGen benchmark tool must have one Magnanimous parity row.');
must(new Set(MAGNANIMOUS_HEYGEN_PARITY_MAP.map(x=>String(x.benchmark_tool).toLowerCase())).size===heygen.length,'HeyGen parity map must not duplicate benchmark tools.');
for(const tool of heygen){
 const row=MAGNANIMOUS_HEYGEN_PARITY_MAP.find(x=>String(x.benchmark_tool).toLowerCase()===String(tool).toLowerCase());
 must(row,'Missing Magnanimous parity row for '+tool);
 must(row.native_target===nativeTargetForHeyGenTool(tool),'Native target mismatch for '+tool);
 must(Boolean(row.native_target)&&row.external_provider_required===false,'Parity row must be provider-independent for '+tool);
}

for(const needle of [
 'hey_terminal_required:false',
 'credentials_leave_owner_device:false',
 'state_change_confirmation_required:true',
 'interactive_programs_owner_device_only:true',
 'one_command_at_a_time:true',
 'untrusted_remote_output:true',
 'ssh.profile.list',
 'ssh.read',
 'ssh.command.stage',
 'ssh.command.preview',
 'ssh.connection.diagnose',
 'ssh.interactive.plan',
 'redactTerminalSecrets',
 'classifyTerminalCommand',
 'diagnoseConnection',
 'previewFor'
])must(terminal.includes(needle),'Native terminal contract missing '+needle);

for(const needle of [
 "ssh_profile_list:{risk:'low'",
 "ssh_read:{risk:'low'",
 "ssh_command:{risk:'high'",
 'ssh_credentials_local_only:true',
 'ssh_exact_command_only:true'
])must(bridgeRuntime.includes(needle),'Local Bridge policy missing '+needle);

for(const needle of [
 '"ssh_profile_list","ssh_read","ssh_command"',
 'def action_ssh_profile_list',
 'def action_ssh_read',
 'def action_ssh_command',
 '"BatchMode=yes"',
 '"ConnectTimeout=10"',
 '"ssh_command": action_ssh_command'
])must(bridgeAgent.includes(needle),'Local Bridge SSH implementation missing '+needle);

must(bridgeAgent.includes('No generic remote shell.'),'Local Bridge must preserve the no-generic-shell safety boundary.');
must(bridgeAgent.includes('credentials_local_only'),'SSH result must state credential locality.');

for(const needle of [
 "'media.summary'",
 "'media.parity'",
 "'media.operation_spec'",
 "'media.operation_execute'",
 "'media.render_avatar'",
 "'terminal.summary'",
 "'terminal.preview'",
 "'terminal.interactive_plan'",
 "'terminal.read'",
 "'terminal.stage'",
 'native_media:media',
 'native_terminal:terminal',
 'heygen_native_parity_map:MAGNANIMOUS_HEYGEN_PARITY_MAP'
])must(mesh.includes(needle),'Capability Mesh missing '+needle);

console.log('Native media + terminal independence lock passed with '+heygen.length+' HeyGen tools mapped one-to-one.');
