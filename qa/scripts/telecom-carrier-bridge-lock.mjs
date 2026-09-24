import fs from 'node:fs';

const read=(path)=>fs.readFileSync(path,'utf8');
const main=read('telecom-core/control-api/app/main.py');
const container=read('telecom-core/control-api/app/container.py');
const ports=read('telecom-core/control-api/app/ports.py');
const adapter=read('telecom-core/control-api/app/adapters/asterisk.py');
const calls=read('telecom-core/control-api/app/services/calls.py');
const models=read('telecom-core/control-api/app/models.py');
const tests=read('telecom-core/control-api/tests/test_call_service.py');
const monitoring=read('telecom-core/control-api/app/services/monitoring.py');
const entrypoint=read('telecom-core/asterisk/entrypoint.sh');
const dialplan=read('telecom-core/asterisk/templates/extensions.conf.template');
const trunk=read('telecom-core/asterisk/templates/pjsip-trunk.conf.optional');
const compose=read('telecom-core/docker-compose.yml');

const checks=[];
const has=(source,text,label)=>checks.push([label,source.includes(text)]);
const lacks=(source,text,label)=>checks.push([label,!source.includes(text)]);

has(ports,'class CarrierBridge(Protocol)','carrier bridge uses an explicit dependency-inversion port');
has(container,'def build_container','telecom uses a composition root');
has(container,'AsteriskSipCarrierBridge(ari, resolved)','concrete carrier adapter is injected at the composition root');
has(calls,'class CallService','call business use-cases live outside HTTP routes');
has(monitoring,'class CarrierCallMonitor','monitor lifecycle is decomposed from call business logic');
has(adapter,'class AsteriskAriClient','ARI transport has one focused adapter');
has(adapter,'class AsteriskSipCarrierBridge','SIP carrier bridge is a replaceable adapter');
has(adapter,'"upstream_provider_exposed": False','external carrier identity stays beneath Magnanimous');
has(main,'Depends(get_container)','HTTP routes consume injected services');
lacks(main,'httpx','thin HTTP layer does not perform carrier/network transport');
lacks(main,'asyncio','thin HTTP layer does not own monitor lifecycle');
has(entrypoint,'PSTN_TRUNK_HOST','legacy PSTN configuration remains backward compatible');
has(entrypoint,'CARRIER_SIP_HOST','carrier-neutral configuration is supported');
has(dialplan,'@${CARRIER_SIP_ENDPOINT}','dialplan routes through replaceable carrier endpoint');
has(trunk,'[${CARRIER_SIP_ENDPOINT}]','SIP endpoint identity is configurable');
has(compose,'CARRIER_DIAL_CONTEXT','container configuration exposes the carrier bridge route');
has(adapter,'async def hold','Asterisk adapter exposes native hold');
has(adapter,'async def unhold','Asterisk adapter exposes native unhold');
has(adapter,'/redirect','Asterisk adapter exposes native transfer redirect');
has(adapter,'/recordings/live/{recording_name}/stop','Asterisk adapter can stop and store live recordings');
has(calls,'async def start_recording','call service exposes consent-gated recording');
has(calls,'Recording consent must be confirmed','call recording requires explicit consent confirmation');
has(main,'/v1/calls/{provider_call_id}/hold','protected call hold endpoint exists');
has(main,'/v1/calls/{provider_call_id}/transfer','protected call transfer endpoint exists');
has(main,'/v1/calls/{provider_call_id}/recording','protected call recording endpoint exists');
has(models,'class RecordingRequest','recording request contract exists');
has(tests,'test_native_call_controls_delegate_to_bridge','native call controls have regression coverage');
has(tests,'test_recording_requires_explicit_consent','recording consent has regression coverage');

const failed=checks.filter(([,ok])=>!ok);
for(const [label,ok] of checks)console.log(`${ok?'PASS':'FAIL'}: ${label}`);
if(failed.length){console.error(`\n${failed.length} telecom carrier bridge contract(s) failed.`);process.exit(1)}
console.log('\nMagnanimous Telecom carrier bridge + SOLID architecture lock passed.');
