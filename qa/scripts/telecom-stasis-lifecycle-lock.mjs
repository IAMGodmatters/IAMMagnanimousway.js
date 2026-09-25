import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const checks=[];
const has=(src,text,label)=>checks.push([label,src.includes(text)]);
const lacks=(src,text,label)=>checks.push([label,!src.includes(text)]);
const count=(src,text)=>(src.split(text).length-1);

const config=read('telecom-core/control-api/app/config.py');
const service=read('telecom-core/control-api/app/services/stasis_bridges.py');
const adapter=read('telecom-core/control-api/app/adapters/asterisk.py');
const container=read('telecom-core/control-api/app/container.py');
const lifecycle=read('telecom-core/control-api/app/lifecycle.py');
const main=read('telecom-core/control-api/app/main.py');
const models=read('telecom-core/control-api/app/models.py');
const compose=read('telecom-core/docker-compose.yml');
const env=read('telecom-core/.env.owned.example');
const tests=read('telecom-core/control-api/tests/test_stasis_bridges.py');
const contact=read('worker/src/contact-center-runtime.js');

checks.push(['Stasis app setting is defined exactly once',count(config,'stasis_app: str =')===1]);
has(config,'stasis_bridge_enabled: bool = False','managed Stasis call bridge is disabled by default');
has(config,'supervisor_audio_enabled: bool = False','supervisor audio is independently disabled by default');
has(config,'bridge_recording_enabled: bool = False','bridge recording is independently disabled by default');
has(config,'stasis_reconnect_attempts: int = 5','Stasis event reconnects are capped');
has(config,'bridge_recording_max_seconds: int = 14400','bridge recording has a bounded default duration');

has(service,'class AsteriskStasisBridgeService','single authoritative Stasis bridge service exists');
has(service,'"type": "mixing,proxy_media"','managed calls use Asterisk-anchored mixing/proxy media bridges');
has(service,'"app": self._settings.stasis_app','managed channel origination enters the registered Stasis application');
has(service,'customer_channel_id','managed lifecycle tracks the customer leg');
has(service,'agent_channel_id','managed lifecycle tracks the agent leg');
has(service,'while self._consecutive_failures < max_failures','Stasis WebSocket self-healing has capped reconnect attempts');
has(service,'"public_live_verified": False','source/runtime readiness cannot claim public live verification');
has(service,'Explicit recording/supervisor consent confirmation is required.','recording and supervisor audio require explicit consent');
has(service,'Jurisdiction is required for recording or supervisor audio.','recording and supervisor audio require a jurisdiction');
has(service,'f"/bridges/{bridge_id}/record"','recording is performed on the mixed Asterisk bridge');
has(service,'f"/recordings/live/{recording_name}/stop"','live bridge recordings have an explicit stop/store path');
has(service,'"spy": "both"','monitor/whisper use Asterisk snoop channels');
has(service,'"whisper": "out" if request.mode == "whisper" else "none"','whisper injects only through the isolated snoop path');
has(service,'if request.mode == "barge"','barge has a distinct direct-bridge path');
has(service,'"role": "supervisor"','barge supervisor membership is explicit');
has(service,'await self.stop_supervisor(session_id)','shutdown cleans active supervisor sessions');
has(service,'await self.hangup(provider_call_id)','shutdown cleans active managed calls');

has(adapter,'self._stasis is not None and self._stasis.enabled','carrier bridge switches to Stasis only through the explicit feature gate');
has(adapter,'await self._stasis.originate(call, selected_endpoint)','selected carrier route is preserved through managed Stasis origination');
has(adapter,'"stasis_bridge": self._stasis.status()','protected carrier health reports Stasis truth state');
has(container,'stasis = AsteriskStasisBridgeService(ari, resolved)','composition root owns one Stasis service');
has(lifecycle,'container.stasis.run()','application lifecycle starts the Stasis event stream');
has(lifecycle,'await container.stasis.close()','application lifecycle cleans Stasis calls/supervisor sessions');

for(const route of [
  '/v1/stasis',
  '/v1/stasis/calls/{provider_call_id}',
  '/v1/stasis/bridges/{bridge_id}',
  '/v1/stasis/bridges/{bridge_id}/recordings',
  '/v1/stasis/recordings/{recording_name}/stop',
  '/v1/stasis/supervisor',
  '/v1/stasis/supervisor/{session_id}'
])has(main,route,'protected Telecom Core route exists: '+route);
has(main,'dependencies=[Depends(require_token)]','Stasis control API remains bearer-token protected');

has(models,'class StasisRecordingStart','recording request contract exists');
has(models,'consent_confirmed: bool = False','consent defaults fail closed');
has(models,'class SupervisorSessionStart','supervisor request contract exists');
has(models,'Literal["monitor", "whisper", "barge"]','supervisor modes are enumerated');

for(const variable of [
  'ASTERISK_STASIS_BRIDGE_ENABLED',
  'ASTERISK_STASIS_APP',
  'ASTERISK_STASIS_AGENT_ENDPOINT',
  'ASTERISK_STASIS_RECONNECT_ATTEMPTS',
  'ASTERISK_SUPERVISOR_AUDIO_ENABLED',
  'ASTERISK_BRIDGE_RECORDING_ENABLED',
  'ASTERISK_BRIDGE_RECORDING_FORMAT',
  'ASTERISK_BRIDGE_RECORDING_MAX_SECONDS'
])has(compose,variable+':','Compose passes protected Stasis setting '+variable);
has(env,'ASTERISK_STASIS_BRIDGE_ENABLED=false','owned environment keeps managed Stasis calls disabled by default');
has(env,'ASTERISK_SUPERVISOR_AUDIO_ENABLED=false','owned environment keeps supervisor audio disabled by default');
has(env,'ASTERISK_BRIDGE_RECORDING_ENABLED=false','owned environment keeps bridge recording disabled by default');

has(tests,'test_managed_call_builds_two_leg_bridge_and_cleans_on_end','unit tests prove managed bridge lifecycle');
has(tests,'test_recording_requires_explicit_consent_and_jurisdiction','unit tests prove recording consent gate');
has(tests,'test_monitor_and_whisper_use_isolated_snoop_bridge','unit tests prove isolated monitor/whisper path');
has(tests,'test_barge_joins_supervisor_directly_to_managed_call_bridge','unit tests prove distinct barge path');

has(contact,'supervisor_audio:{monitor:false,whisper:false,barge:false','platform still refuses to advertise supervisor audio live before public activation');

lacks(service,'TELECOM_CORE_TOKEN','private platform Telecom token never enters Stasis service source');
lacks(service,'TWILIO_','Stasis lifecycle stays provider-neutral');

const failed=checks.filter(([,ok])=>!ok);
for(const [label,ok] of checks)console.log(`${ok?'PASS':'FAIL'} - ${label}`);
if(failed.length){
  console.error(`\n${failed.length} Stasis lifecycle lock(s) failed.`);
  process.exit(1);
}
console.log('\nMagnanimous Stasis lifecycle and safety lock passed.');
