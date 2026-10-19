import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {openMagnanimousDb} from '../../magnanimous-runtime/src/d1-compat.mjs';
import {recordMagnanimousToolSpan,listMagnanimousToolSpans} from '../../worker/src/magnanimous-tool-traces.js';

const directory=fs.mkdtempSync(path.join(os.tmpdir(),'magnanimous-orca-trace-'));
const db=openMagnanimousDb(path.join(directory,'traces.sqlite'));
try{
 const env={DB:db};
 await recordMagnanimousToolSpan(env,{tenant:'tenant-a',user:'owner',serverId:1,tool:'lookup',success:true,durationMs:53,responseBytes:144});
 await recordMagnanimousToolSpan(env,{tenant:'tenant-a',user:'owner',serverId:1,tool:'lookup',success:false,durationMs:207,responseBytes:0,errorKind:'HTTP 503 secret_token=forbidden'});
 await recordMagnanimousToolSpan(env,{tenant:'tenant-b',user:'other',serverId:2,tool:'private',success:true,durationMs:42,responseBytes:99});
 const a=await listMagnanimousToolSpans(env,'tenant-a');
 assert.equal(a.spans.length,2,'Tenant A only sees own metadata.');
 assert.equal(a.summary.length,1);
 assert.equal(a.summary[0].calls,2);
 assert.equal(a.summary[0].successes,1);
 assert.equal(a.summary[0].mean_latency_ms,130);
 assert.equal(a.summary[0].worst_latency_ms,207);
 assert.equal(a.provider_cost_usd,null);
 assert.equal(a.provider_cost_verified,false);
 const b=await listMagnanimousToolSpans(env,'tenant-b');
 assert.equal(b.spans.length,1);
 assert.equal(b.spans[0].tool_name,'private');
 const rows=db.db.prepare('SELECT * FROM magnanimous_tool_execution_spans').all();
 assert.ok(!JSON.stringify(rows).includes('secret_token=forbidden'),'No untrusted upstream error text may persist.');
 const columns=db.db.prepare('PRAGMA table_info(magnanimous_tool_execution_spans)').all().map(x=>x.name);
 for(const banned of ['prompt','arguments','request_payload','response_body','api_key','secret','token'])assert.equal(columns.includes(banned),false,'Traces must not store '+banned);
 assert.equal(rows.length,3);
 console.log('Magnanimous MCP execution traces DB lock passed: tenant isolation, aggregated timings, no payloads, unverified cost clearly null.');
}finally{db.close();fs.rmSync(directory,{force:true,recursive:true});}
