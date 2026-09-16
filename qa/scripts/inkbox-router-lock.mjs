import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const must=(text,needle,label)=>{if(!text.includes(needle)){console.error(`FAIL: ${label}: missing ${needle}`);process.exitCode=1;}};
const canonical=read('worker/src/magnanimous-inkbox-router.js');
const rest=read('worker/src/inkbox-router.js');
const extended=read('worker/src/magnanimous-communications-router.js');
const seed=read('worker/src/inkbox-tool-seed.js');
const providerEnv=read('worker/src/provider-runtime-env.js');
const router=read('worker/src/router-entrypoint.js');
const lower=read('worker/src/entrypoint.js');

for(const tool of [
 'inkbox_identity_get','inkbox_channel_status_get','inkbox_emails_list','inkbox_email_get',
 'inkbox_conversations_list','inkbox_contacts_list','inkbox_contact_memories_list','inkbox_notes_list',
 'inkbox_sms_consent_get','inkbox_calls_list','inkbox_call_settings_get','inkbox_email_send',
 'inkbox_email_reply','inkbox_email_forward','inkbox_text_send','inkbox_imessage_send',
 'inkbox_call_place','inkbox_call_hangup','inkbox_a2a_agents_list','inkbox_a2a_tasks_list',
 'inkbox_a2a_task_send','inkbox_a2a_task_reply','inkbox_contact_rules_list','inkbox_phone_contact_rule_preflight'
])must(canonical,tool,'canonical baseline');

for(const capability of ['tools/list','tools/call','dynamic_discovery:true','future_capabilities:true','provider_details_private:true'])must(canonical,capability,'canonical dynamic MCP router');
must(canonical,"MCP_URL='https://inkbox.ai/mcp'",'official Inkbox MCP endpoint');
must(canonical,"'x-api-key':apiKey",'server-side Inkbox credential injection');
must(canonical,'confirm_destructive','destructive action confirmation');
must(canonical,'confirm_sensitive','sensitive communication confirmation');

for(const family of ['/mail','/contacts','/notes','/phone','/numbers','/calls','/imessage','/identities','/webhooks','/vault','/tunnels'])must(rest,family,'documented REST fallback family');
must(rest,'currentUser(request,env)','REST tenant/user authorization');
must(rest,"user.role!=='owner'",'REST owner boundary');
must(rest,'magnanimous_communications_audit','REST action audit');
must(rest,'EXPLICIT_ACTION_APPROVAL_REQUIRED','REST consequential-action gate');
must(rest,"headers=new Headers({'X-API-Key':key",'REST server-side credential injection');

must(extended,"path.startsWith('/a2a/')",'root-level A2A fallback');
must(extended,'EXPLICIT_ACTION_APPROVAL_REQUIRED','A2A state-change gate');

must(seed,'MAGNANIMOUS_COMMUNICATION_TOOLS','Tool Foundry full communications seed');
must(seed,'magnanimous_native_tool_specs','Tool Foundry registry');
must(seed,'Never claim','verified external action rule');

for(const key of ['INKBOX_API_KEY','INKBOX_AGENT_IDENTITY_ID','INKBOX_AGENT_HANDLE','INKBOX_EMAIL_ADDRESS','INKBOX_PHONE_NUMBER','INKBOX_WEBHOOK_SECRET','INKBOX_BASE_URL'])must(providerEnv,key,'provider runtime credential/identity metadata');

must(router,"handleMagnanimousInkboxRouter",'canonical production router');
must(router,"url.pathname.startsWith('/api/magnanimous/inkbox')",'canonical route dispatch');
must(router,"handleMagnanimousToolGateway",'universal MCP gateway');
must(lower,'ensureMagnanimousCommunicationsToolSeed','native communications tool seeding');
must(lower,'handleMagnanimousCommunications','documented REST fallback wiring');

if(!process.exitCode)console.log('PASS: Magnanimous retains full Inkbox MCP routing, documented REST fallbacks, approval gates, audits, and Tool Foundry absorption.');
