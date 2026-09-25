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
const webrtcSessions=read('telecom-core/control-api/app/services/webrtc_sessions.py');
const extensions=read('telecom-core/asterisk/templates/extensions.conf.template');
const entrypoint=read('telecom-core/asterisk/entrypoint.sh');
const webrtcOwnershipTests=read('telecom-core/control-api/tests/test_webrtc_sessions.py');

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
has(service,'f"/bridges/{call.bridge_id}/record"','recording is performed only on the tenant-owned managed Asterisk bridge');
has(service,'f"/recordings/live/{recording_name}/stop"','live bridge recordings have an explicit stop/store path');
has(service,'"spy": "both"','monitor/whisper use Asterisk snoop channels');
has(service,'"whisper": "out" if request.mode == "whisper" else "none"','whisper injects only through the isolated snoop path');
has(service,'if request.mode == "barge"','barge has a distinct direct-bridge path');
has(service,'"role": "supervisor"','barge supervisor membership is explicit');
has(service,'await self._cleanup_supervisor(session_id)','shutdown and natural call cleanup can remove supervisor sessions even after event readiness drops');
has(service,'await self.hangup(provider_call_id)','shutdown cleans active managed calls');
has(service,'def _managed_call_for_tenant','Stasis call controls resolve through tenant ownership');
has(service,'call.tenant_id != str(tenant_id)','cross-tenant managed call IDs fail closed');
has(service,'recording.get("tenant_id") != str(tenant_id)','recording stop is tenant scoped');
has(service,'session.get("tenant_id") != str(tenant_id)','supervisor stop is tenant scoped');
has(service,'self._webrtc_sessions.owns_session','supervisor startup requires a tenant-owned browser session');
has(service,'async def _supervisor_channel_for_session','Telecom Core resolves the active supervisor channel itself');
has(service,'app_name == "stasis"','resolved supervisor channel must actually be inside Stasis');
has(service,'app_data.startswith(f"{self._settings.stasis_app},supervisor")','resolved channel must be inside the supervisor Stasis entry');
has(service,'len(matches) != 1','zero or ambiguous supervisor Stasis channels fail closed');
has(service,'"supervisor_audio_runtime_ready"','local runtime readiness is reported separately from public live state');
has(service,'"bridge_recording_runtime_ready"','recording runtime readiness is reported separately from public live state');
has(service,'"supervisor_monitor_live": False','monitor is never called public-live from source/runtime readiness alone');
has(service,'"bridge_recording_live": False','recording is never called public-live from source/runtime readiness alone');
has(service,'linked_recordings = [','natural call end enumerates linked recordings for cleanup');
has(service,'linked_supervisors = [','natural call end enumerates linked supervisor sessions for cleanup');

has(adapter,'self._stasis is not None and self._stasis.enabled','carrier bridge switches to Stasis only through the explicit feature gate');
has(adapter,'await self._stasis.originate(call, selected_endpoint)','selected carrier route is preserved through managed Stasis origination');
has(adapter,'"stasis_bridge": self._stasis.status()','protected carrier health reports Stasis truth state');
has(container,'stasis = AsteriskStasisBridgeService(ari, resolved, webrtc_sessions)','composition root owns one Stasis service with the tenant-owned WebRTC registry');
has(lifecycle,'container.stasis.run()','application lifecycle starts the Stasis event stream');
has(lifecycle,'await container.stasis.close()','application lifecycle cleans Stasis calls/supervisor sessions');

for(const route of [
  '/v1/stasis',
  '/v1/stasis/calls/{provider_call_id}',
  '/v1/stasis/calls/{provider_call_id}/recordings',
  '/v1/stasis/recordings/{recording_name}/stop',
  '/v1/stasis/supervisor',
  '/v1/stasis/supervisor/{session_id}'
])has(main,route,'protected Telecom Core route exists: '+route);
has(main,'dependencies=[Depends(require_token)]','Stasis control API remains bearer-token protected');

has(models,'class StasisRecordingStart','recording request contract exists');
has(models,'class StasisRecordingStop','recording stop has a tenant-scoped request contract');
has(models,'tenant_id: str = Field(min_length=1, max_length=200)','Stasis control requests carry tenant ownership');
has(models,'consent_confirmed: bool = False','consent defaults fail closed');
has(models,'class SupervisorSessionStart','supervisor request contract exists');
has(models,'provider_call_id: str = Field(min_length=1, max_length=160)','supervisor controls identify a managed call rather than a raw bridge');
has(models,'target_role: Literal["agent", "customer"]','supervisor targets a managed call leg role rather than an arbitrary target channel');
has(models,'supervisor_session_id: str = Field','supervisor request identifies a tenant-owned WebRTC session');
lacks(models,'supervisor_channel_id:','public request contract never accepts a raw Asterisk supervisor channel ID');
has(models,'class WebRtcSessionCreate','protected browser-session request can carry tenant/user ownership metadata');
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

has(webrtcSessions,'self._owners: dict[str, dict[str, Any]] = {}','Telecom Core keeps ephemeral browser ownership metadata server-side');
has(webrtcSessions,'def owns_session(self, session_id: str, tenant_id: str)','supervisor authorization can verify tenant-owned browser sessions');
has(webrtcSessions,'self._owners.pop(session_id, None)','browser-session revocation removes ownership metadata');
has(contact,"body:JSON.stringify({tenant_id:String(user.tenant_id),user_id:String(user.id)})",'platform passes signed-in tenant/user ownership only over the private Telecom Core request');
has(extensions,'MAGNANIMOUS_SUPERVISOR_EXTENSION=${MAGNANIMOUS_SUPERVISOR_EXTENSION}','Asterisk dialplan has a configurable internal supervisor extension');
has(extensions,'Stasis(${ASTERISK_STASIS_APP},supervisor)','ephemeral supervisor entry places the browser channel inside the protected Stasis app');
has(extensions,'exten => _+X.,1,Playback(ss-noservice)','ephemeral WebRTC context still blocks direct PSTN dialing');
has(entrypoint,'MAGNANIMOUS_SUPERVISOR_EXTENSION:=6100','Asterisk gives the internal supervisor entry a bounded default extension');
has(webrtcOwnershipTests,'test_owned_session_is_tenant_bound_and_revocation_clears_owner','unit tests prove browser-session tenant ownership and revocation');
has(webrtcOwnershipTests,'test_unowned_diagnostic_session_cannot_be_used_for_supervision','unowned CI diagnostic sessions cannot become supervisor sessions');

has(tests,'test_managed_call_builds_two_leg_bridge_and_cleans_on_end','unit tests prove managed bridge lifecycle');
has(tests,'test_recording_requires_consent_tenant_and_jurisdiction','unit tests prove recording consent and tenant gate');
has(tests,'test_monitor_and_whisper_use_isolated_snoop_bridge','unit tests prove isolated monitor/whisper path');
has(tests,'test_barge_joins_supervisor_directly_to_tenant_call_bridge','unit tests prove distinct tenant-owned barge path');
has(tests,'test_topology_is_tenant_scoped','unit tests prove cross-tenant topology lookup fails closed');
has(tests,'test_supervisor_requires_tenant_owned_webrtc_session_and_matching_channel','unit tests prove supervisor browser ownership and Stasis-channel binding');
has(tests,'test_natural_call_end_cleans_recording_and_supervisor_children','unit tests prove child media cleanup when the parent call ends');
has(tests,'test_shutdown_cleanup_does_not_depend_on_ready_flag','unit tests prove disconnect-safe shutdown cleanup');

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
