import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const compose=read('telecom-core/docker-compose.yml');
const kamailio=read('telecom-core/sip-core/kamailio.cfg.template');
const sipEntry=read('telecom-core/sip-core/entrypoint.sh');
const asteriskPjsip=read('telecom-core/asterisk/templates/pjsip.conf.template');
const asteriskDialplan=read('telecom-core/asterisk/templates/extensions.conf.template');
const asteriskEntry=read('telecom-core/asterisk/entrypoint.sh');
const main=read('telecom-core/control-api/app/main.py');
const service=read('telecom-core/control-api/app/services/sip_accounts.py');
const adapter=read('telecom-core/control-api/app/adapters/sip_subscribers.py');
const docs=read('telecom-core/OWNED_SIP_PSTN.md');

const checks=[];
const has=(text,needle,name)=>checks.push([name,text.includes(needle)]);
const lacks=(text,needle,name)=>checks.push([name,!text.includes(needle)]);

has(compose,'sip-core:','compose includes owned SIP registrar');
has(compose,'sip-db:','compose includes owned SIP subscriber database');
has(compose,'127.0.0.1:${SIP_DB_HOST_PORT:-5433}:5432','SIP database is loopback-bound');
has(kamailio,'loadmodule "auth_db.so"','Kamailio authenticates owned subscribers');
has(kamailio,'loadmodule "db_postgres.so"','Kamailio uses PostgreSQL subscriber storage');
has(kamailio,'listen=udp:0.0.0.0:5060','owned SIP UDP registrar listens on 5060');
has(kamailio,'listen=tcp:0.0.0.0:5060','owned SIP TCP registrar listens on 5060');
has(kamailio,'$du = "sip:${ASTERISK_SIP_HOST}:${ASTERISK_SIP_PORT}"','subscriber calls route through owned PBX');
has(sipEntry,"envsubst '${MAGNANIMOUS_SIP_DOMAIN}",'SIP entrypoint limits environment substitution');
has(asteriskPjsip,'bind=0.0.0.0:${ASTERISK_SIP_PORT}','Asterisk PBX has a separate SIP socket');
has(asteriskPjsip,'magnanimous-sip-core','Asterisk has an owned SIP-core endpoint');
has(asteriskDialplan,'[from-sip-core]','Asterisk has an owned SIP ingress context');
has(asteriskEntry,'SUBST_VARS=','Asterisk substitutions are explicitly allowlisted');
has(asteriskEntry,'${EXTEN}','Asterisk entrypoint documents preservation of runtime variables');
has(main,'/v1/sip/accounts','control API exposes owned SIP account lifecycle');
has(service,'password_returned_once','SIP password is returned once on creation');
has(service,'hashlib.md5','SIP Digest HA1 is derived by the service');
lacks(adapter,'password =','subscriber adapter never stores cleartext password variables');
has(adapter,"VALUES($1,$2,'',$3,'',TRUE)",'database insert stores blank cleartext password field');
has(docs,'authorized interconnect','documentation keeps public PSTN authority truthful');
has(docs,'do not advertise emergency calling','emergency-calling boundary remains explicit');

const failed=checks.filter(([,ok])=>!ok);
for(const [name,ok] of checks)console.log(`${ok?'PASS':'FAIL'} - ${name}`);
if(failed.length){console.error(`Owned SIP/PSTN lock failed: ${failed.length} check(s).`);process.exit(1)}
console.log(`Owned SIP/PSTN lock: ${checks.length} checks passed.`);
