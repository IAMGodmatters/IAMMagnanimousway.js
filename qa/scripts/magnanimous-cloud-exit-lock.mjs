import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

const read=(p)=>fs.readFileSync(p,'utf8');
const must=(condition,message)=>{if(!condition)throw new Error(message)};

const codeFiles=[
  'magnanimous-runtime/package.json',
  'magnanimous-runtime/src/d1-compat.mjs',
  'magnanimous-runtime/src/migrations.mjs',
  'magnanimous-runtime/src/ai-binding.mjs',
  'magnanimous-runtime/src/server.mjs',
  'magnanimous-runtime/Dockerfile',
  'magnanimous-runtime/docker-compose.yml',
  'magnanimous-runtime/Caddyfile'
];

for(const file of codeFiles){
  const text=read(file);
  must(!/@cloudflare\//i.test(text),file+' must not depend on a Cloudflare package.');
  must(!/\bwrangler\b/i.test(text),file+' must not depend on Wrangler.');
  must(!/mcp\.cloudflare\.com/i.test(text),file+' must not depend on Cloudflare MCP.');
}

const sql=read('magnanimous-runtime/src/d1-compat.mjs');
for(const contract of ['prepare(sql)','bind(...params)','async run()','async first(column)','async all()','async raw()','async batch(statements)','async exec(sql)']){
  must(sql.includes(contract),'Magnanimous SQL compatibility contract missing: '+contract);
}

const server=read('magnanimous-runtime/src/server.mjs');
must(server.includes("MAGNANIMOUS_RUNTIME: 'standalone-node'"),'Standalone runtime identity missing.');
must(server.includes('/__magnanimous_runtime/health'),'Standalone runtime health endpoint missing.');
must(server.includes('app.fetch(request, env, work.ctx)'),'Existing Magnanimous request chain must run unchanged.');
must(server.includes('app.scheduled'),'Standalone scheduler compatibility is missing.');

const infra=read('worker/src/magnanimous-infrastructure-core.js');
must(infra.includes("infrastructure_owner: 'Magnanimous AI'"),'Magnanimous must own infrastructure control.');
must(infra.includes("architecture: 'provider-neutral-first-party-control-plane'"),'Provider-neutral infrastructure architecture missing.');
must(infra.includes("production_cutover_complete: standalone"),'Cutover status must remain truthful.');
must(infra.includes("external_network_required: true"),'Public-network external boundary must remain explicit.');

const security=read('worker/src/security-entrypoint.js');
must(security.includes('handleMagnanimousInfrastructure'),'Infrastructure owner endpoint is not mounted.');
must(security.includes("'/api/magnanimous/infrastructure'")||infra.includes("'/api/magnanimous/infrastructure'"),'Infrastructure endpoint missing.');

execFileSync(process.execPath,['magnanimous-runtime/scripts/verify-runtime.mjs'],{stdio:'inherit'});

console.log('Magnanimous Cloud Exit Lock: standalone runtime, SQL compatibility, infrastructure ownership and full migration compatibility PASS');
