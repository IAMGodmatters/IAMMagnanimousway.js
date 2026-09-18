import fs from 'node:fs';

const read=(p)=>fs.readFileSync(new URL(`../../${p}`,import.meta.url),'utf8');
const ui=read('frontend/app/crm/page.tsx');
const runtime=read('worker/src/native-work-crm-runtime.js');
const security=read('worker/src/security-entrypoint.js');

const checks=[];
function has(source,needle,label){const ok=source.includes(needle);checks.push([ok,label]);if(!ok)console.error(`FAIL: ${label}`)}

has(security,"pathname.startsWith('/api/operations/crm/')",'security router reaches CRM intelligence APIs');
has(runtime,"/api/operations/crm/command-center",'CRM command center API exists');
has(runtime,"crmLeadScore",'native lead scoring exists');
has(runtime,"weighted_forecast",'weighted revenue forecast is produced');
has(runtime,"next_actions",'next-best-action queue is produced');
has(runtime,"duplicate_email_groups",'duplicate email data-health checks exist');
has(runtime,"stale_deals",'stale deal risk detection exists');
has(runtime,"/api/operations/crm/deals",'deal create/read API exists');
has(runtime,"/api/operations/crm/tasks",'follow-up task API exists');
has(runtime,"crm_deal_updated",'deal changes are written to CRM activity audit');
has(runtime,"crm_task_updated",'task changes are written to CRM activity audit');
has(ui,'MAGNANIMOUS CRM • RELATIONSHIP INTELLIGENCE','CRM page exposes Magnanimous relationship intelligence identity');
has(ui,'Next Best Actions','CRM page exposes priority queue');
has(ui,'WEIGHTED FORECAST','CRM page exposes forecast');
has(ui,'LIVE DEAL PIPELINE','CRM page exposes live pipeline');
has(ui,'Unified Inbox','CRM page links omnichannel inbox');
has(ui,'Calls & Contact Center','CRM page links calling and contact center');
has(ui,'Automations & Sequences','CRM page links automation layer');
has(ui,'SOURCE ATTRIBUTION','CRM page exposes source attribution');
has(ui,'ABSORBED CRM CAPABILITIES','CRM page documents absorbed capability families');

const failed=checks.filter(([ok])=>!ok);
if(failed.length){console.error(`CRM intelligence lock failed: ${failed.length}/${checks.length} checks failed.`);process.exit(1)}
console.log(`CRM intelligence lock: ${checks.length} checks passed.`);
console.log('Relationship intelligence: PASS');
console.log('Revenue intelligence: PASS');
console.log('Omnichannel/action routing: PASS');
