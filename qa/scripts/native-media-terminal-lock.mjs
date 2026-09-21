import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const must=(value,message)=>{if(!value)throw new Error(message)};

const media=read('worker/src/magnanimous-native-media-studio.js');
const terminal=read('worker/src/magnanimous-native-terminal.js');
const bridgeRuntime=read('worker/src/magnanimous-local-bridge-runtime.js');
const bridgeAgent=read('local-bridge/bridge_agent.py');
const mesh=read('worker/src/magnanimous-capability-mesh.js');

for(const needle of [
 'heygen_required:false',
 'proprietary_backend_copied:false',
 'HEYGEN_VISIBLE_BENCHMARK_TOOLS',
 'video.lipsync',
 'video.translate',
 'video.clip',
 'voice.clone',
 'brand.glossary',
 'FREE_AVATAR_RENDERER_URL'
])must(media.includes(needle),'Native media contract missing '+needle);

must(!/api\.heygen\.com|heygen\.com\/v\d/i.test(media),'Native media runtime must not depend on HeyGen endpoints.');

for(const needle of [
 'hey_terminal_required:false',
 'credentials_leave_owner_device:false',
 'state_change_confirmation_required:true',
 'ssh.profile.list',
 'ssh.read',
 'ssh.command.stage',
 'redactTerminalSecrets',
 'classifyTerminalCommand'
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
 "'media.render_avatar'",
 "'terminal.summary'",
 "'terminal.read'",
 "'terminal.stage'",
 'native_media:media',
 'native_terminal:terminal'
])must(mesh.includes(needle),'Capability Mesh missing '+needle);

console.log('Native media + terminal independence lock passed.');
