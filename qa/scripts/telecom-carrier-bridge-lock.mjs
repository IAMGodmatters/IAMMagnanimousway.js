import fs from 'node:fs';

const read=(path)=>fs.readFileSync(path,'utf8');
const main=read('telecom-core/control-api/app/main.py');
const container=read('telecom-core/control-api/app/container.py');
const ports=read('telecom-core/control-api/app/ports.py');
const adapter=read('telecom-core/control-api/app/adapters/asterisk.py');
const calls=read('telecom-core/control-api/app/services/calls.py');
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

const failed=checks.filter(([,ok])=>!ok);
for(const [label,ok] of checks)console.log(`${ok?'PASS':'FAIL'}: ${label}`);
if(failed.length){console.error(`\n${failed.length} telecom carrier bridge contract(s) failed.`);process.exit(1)}
console.log('\nMagnanimous Telecom carrier bridge + SOLID architecture lock passed.');
