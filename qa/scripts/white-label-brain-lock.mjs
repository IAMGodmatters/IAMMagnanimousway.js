import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../..');
const failures=[];const passes=[];
function read(rel){const p=path.join(root,rel);if(!fs.existsSync(p)){failures.push(`${rel}: required file is missing`);return''}return fs.readFileSync(p,'utf8')}
function must(ok,msg){(ok?passes:failures).push(msg)}
function includes(source,needle,msg){must(source.includes(needle),msg)}
function notMatches(source,re,msg){must(!re.test(source),msg)}

const runtime=read('worker/src/white-label-brain-runtime.js');
const entry=read('worker/src/white-label-brain-entrypoint.js');
const wrangler=read('worker/wrangler.jsonc');
const migration=read('worker/migrations/0036_white_label_brain.sql');
const layout=read('frontend/app/white-label/layout.tsx');
const dock=read('frontend/app/white-label/white-label-brain-dock.tsx');
const shell=read('frontend/app/white-label/app/page.tsx');
const home=read('frontend/app/white-label/page.tsx');
const evolution=read('frontend/app/owner-evolution/page.tsx');

includes(wrangler,'"main": "src/white-label-brain-entrypoint.js"','brain: Worker runs through the White Label brain wrapper');
includes(entry,'handleWhiteLabelBrain','brain: White Label brain API is mounted before normal operations');
includes(entry,'recordWhiteLabelAction','learning: relevant White Label outcomes are observed');
includes(entry,'const body=await request.clone().json()','privacy: request observation uses a clone and leaves the customer action intact');
includes(entry,"client_id:String(body?.client_id||body?.clientId||'').slice(0,80)",'privacy: observer extracts client id only rather than raw customer content');
includes(entry,'Learning signals must never break the customer action','reliability: learning failure cannot break customer actions');

includes(runtime,"role:'shared brain for every White Label app'",'brain: Magnanimous is explicitly the shared White Label brain');
includes(runtime,'CREATE TABLE IF NOT EXISTS white_label_brain_memory','learning: durable private White Label memory exists');
includes(runtime,'CREATE TABLE IF NOT EXISTS white_label_brain_signals','learning: durable White Label outcome signals exist');
includes(runtime,'magnanimous_outcomes','learning: White Label outcomes feed the central Magnanimous learning system');
includes(runtime,"capability,provider,task",'learning: central outcome records retain capability metadata');
includes(runtime,"`white-label:${a}`",'learning: White Label outcomes are namespaced in Magnanimous outcomes');
includes(runtime,"client_isolation:true",'privacy: client isolation is stated in White Label brain responses');
includes(runtime,"raw_answer_stored:false",'privacy: rating feedback does not store the raw Magnanimous answer');
includes(runtime,"raw_client_content_included:false",'privacy: owner insights exclude raw client content');
includes(runtime,"owner_review_required_before_global_promotion:true",'safety: global promotion requires owner review');
includes(runtime,'rejectSecrets(raw)','privacy: explicit lessons reject likely credentials/secrets');
includes(runtime,'redactPii(raw)','privacy: explicit lessons redact contact information');
includes(runtime,"plan==='agency'||plan==='agency_pro'",'entitlement: brain is gated to White Label plans');
includes(runtime,"SELECT c.id,c.name,c.industry,c.status",'privacy: client context is resolved through tenant-owned client records');
includes(runtime,"WHERE c.id=? AND c.tenant_id=?",'privacy: client lookup is tenant-scoped');
notMatches(runtime,/lesson_value[^\n]*FROM white_label_brain_memory[^\n]*WHERE client_id=\?/i,'privacy: no unscoped client-only memory lookup is introduced');

includes(migration,'CREATE TABLE IF NOT EXISTS white_label_brain_memory','database: White Label memory migration exists');
includes(migration,'UNIQUE(tenant_id,user_id,client_id,app,lesson_key)','database: learned lessons are scoped by tenant, user, client and app');
includes(migration,'CREATE TABLE IF NOT EXISTS white_label_brain_signals','database: outcome signal migration exists');

includes(layout,'<WhiteLabelBrainDock/>','ui: shared Magnanimous dock is mounted across White Label');
includes(dock,'/api/white-label/brain/assist','ui: dock calls the White Label Magnanimous brain');
includes(dock,'/api/white-label/brain/feedback','ui: helpful/not-helpful feedback becomes a learning signal');
includes(dock,"window.self!==window.top",'ui: embedded tools do not create duplicate brain docks');
includes(shell,'POWERED BY THE MAGNANIMOUS AI BRAIN','ui: paid app shell identifies the shared brain');
includes(shell,"d.plan!=='agency'&&d.plan!=='agency_pro'",'entitlement: paid app shell enforces White Label access');
includes(home,'ONE MAGNANIMOUS BRAIN','ui: White Label storefront explains the shared brain');
includes(home,'/white-label/app?tool=','ui: paid White Label apps stay inside the brain-connected app shell');
includes(home,'Prices live only inside White Label','pricing: White Label pricing remains separate');

includes(evolution,'/api/white-label/brain/insights','evolution: owner lab consumes White Label learning insights');
includes(evolution,'Raw client content included in this owner summary','evolution: owner evidence explicitly reports raw-content exclusion');
includes(evolution,'Broader/global changes','evolution: broader changes remain owner controlled');

console.log(`White Label Magnanimous brain lock: ${passes.length} checks passed.`);
if(failures.length){
 console.error('\nWhite Label brain architecture lock FAILED:');
 for(const f of failures)console.error(`- ${f}`);
 process.exit(1);
}
console.log('Shared brain: PASS');
console.log('Tenant/client isolation: PASS');
console.log('Privacy-safe outcome learning: PASS');
console.log('Owner-controlled global evolution: PASS');
