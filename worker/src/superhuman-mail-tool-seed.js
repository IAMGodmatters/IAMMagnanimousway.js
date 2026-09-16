const GLOBAL_TOOL_TENANT='__magnanimous_global__';
const GLOBAL_TOOL_USER='system:auto-qa';
const SEED_KEY='magnanimous-superhuman-mail-patterns';
const SEED_VERSION=1;
let warmSeeded=false;
const now=()=>Math.floor(Date.now()/1000);

// Provider-neutral workflows learned from documented Superhuman Mail capabilities.
// Magnanimous owns planning, memory, identity and verification. Superhuman Mail,
// Gmail and Outlook remain optional, replaceable execution adapters.
const TOOLS=[
 ['multi-account-email-search','Search multiple authorized Gmail and Outlook accounts in parallel and return one normalized result set.','email','low'],
 ['multi-account-inbox-scan','Scan multiple authorized inboxes for messages matching a person, organization, topic, urgency signal or workflow state.','email','low'],
 ['cross-account-thread-summary','Summarize relevant threads across multiple authorized mailboxes while preserving account/source attribution.','email','low'],
 ['voice-matched-email-draft','Draft an email or reply using learned user tone and recipient-specific context without sending until the applicable action policy allows it.','email','medium'],
 ['cross-account-email-send','Send from the explicitly selected authorized Gmail or Outlook account and verify the provider receipt before reporting success.','email','high'],
 ['account-aware-reply-routing','Choose the correct mailbox/account for a reply based on the originating thread and authorized account ownership.','email','medium'],
 ['calendar-context-search','Search authorized Gmail/Outlook calendars together with email context to answer scheduling questions.','calendar','low'],
 ['email-to-calendar-event','Turn an email conversation into a proposed calendar event with title, attendees, location, description and candidate time.','calendar','medium'],
 ['cross-calendar-availability','Compare authorized calendars to identify free time and avoid conflicts before proposing or creating a meeting.','calendar','low'],
 ['schedule-from-email','Create or update a meeting from email context only after calendar/account authorization and any required confirmation.','calendar','high'],
 ['conversation-auto-summary','Maintain a concise rolling summary of a long email conversation so the user can understand the current state quickly.','email','low'],
 ['priority-inbox-classification','Classify incoming mail into actionable categories such as respond, waiting, FYI, notification, promotion or news using provider-neutral labels.','email','low'],
 ['auto-archive-noise-pattern','Identify low-value recurring mail suitable for archive rules while preserving reversibility and user control.','email','medium'],
 ['auto-draft-reply-pattern','Prepare reply drafts for messages likely needing a response, but do not auto-send unless a separately authorized sending policy exists.','email','medium'],
 ['follow-up-reminder-pattern','Detect conversations awaiting a reply and resurface them at an appropriate time without fabricating urgency.','email','low'],
 ['mail-account-switching','Maintain explicit account identity when reading, drafting, sending or scheduling across multiple connected mailboxes.','email','low'],
 ['mail-calendar-unified-context','Combine email threads and calendar context for one task while minimizing data read from unrelated accounts.','productivity','medium']
];

async function schema(env){
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS magnanimous_native_tool_specs(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  purpose TEXT NOT NULL,
  family TEXT NOT NULL DEFAULT 'general',
  inputs_json TEXT NOT NULL DEFAULT '{}',
  outputs_json TEXT NOT NULL DEFAULT '{}',
  steps_json TEXT NOT NULL DEFAULT '[]',
  risk TEXT NOT NULL DEFAULT 'low',
  status TEXT NOT NULL DEFAULT 'draft',
  uses INTEGER NOT NULL DEFAULT 0,
  successes INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(tenant_id,user_id,name)
 )`).run();
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS magnanimous_system_seed_versions(seed_key TEXT PRIMARY KEY,version INTEGER NOT NULL,updated_at INTEGER NOT NULL)`).run();
}
function steps(name,purpose,risk){return[
 {type:'understand',instruction:`Understand whether ${name} matches the requested outcome: ${purpose}`},
 {type:'scope',instruction:'Identify the minimum necessary authorized mailbox and calendar accounts. Keep account identity explicit; never merge unrelated private data merely because several accounts are connected.'},
 {type:'retrieve',instruction:'Use Magnanimous native memory and existing direct Gmail/Outlook connectors first when they can complete the task. Use Superhuman Mail MCP only when connected and materially useful, especially for multi-account workflows.'},
 {type:'execute',instruction:risk==='high'?'Execute the external write only through an authorized account and applicable approval gate. Never claim send/schedule success without a provider receipt.':'Perform the read/draft/analysis through a real authorized connector and normalize results into a Magnanimous response.'},
 {type:'verify',instruction:'Verify account, recipients/attendees, time zone, thread identity and provider result before reporting completion.'},
 {type:'learn',instruction:'Save reusable provider-neutral workflow lessons in Magnanimous. Do not copy proprietary prompts, models, source code or hidden provider logic.'}
]}

export async function ensureMagnanimousSuperhumanMailSeed(env){
 if(warmSeeded||!env?.DB)return;
 await schema(env);
 const current=await env.DB.prepare('SELECT version FROM magnanimous_system_seed_versions WHERE seed_key=?').bind(SEED_KEY).first();
 if(Number(current?.version||0)>=SEED_VERSION){warmSeeded=true;return}
 const ts=now();
 for(const [name,purpose,family,risk] of TOOLS){
  const inputs={authorized_accounts:'array of connected Gmail/Outlook accounts',goal:'string',account_hint:'optional explicit mailbox',calendar_scope:'optional authorized calendars',provider_preference:'native/direct first; Superhuman MCP optional'};
  const outputs={result:'normalized Magnanimous result',sources:'account/thread/calendar identifiers as appropriate',verified_external_action:'boolean for writes'};
  await env.DB.prepare(`INSERT INTO magnanimous_native_tool_specs(tenant_id,user_id,name,purpose,family,inputs_json,outputs_json,steps_json,risk,status,uses,successes,created_at,updated_at)
   VALUES(?,?,?,?,?,?,?,?,?,'proposed',0,0,?,?)
   ON CONFLICT(tenant_id,user_id,name) DO UPDATE SET purpose=excluded.purpose,family=excluded.family,inputs_json=excluded.inputs_json,outputs_json=excluded.outputs_json,steps_json=excluded.steps_json,risk=excluded.risk,status=CASE WHEN magnanimous_native_tool_specs.status='ready' THEN 'ready' ELSE 'proposed' END,updated_at=excluded.updated_at`)
   .bind(GLOBAL_TOOL_TENANT,GLOBAL_TOOL_USER,`mail-${name}`.slice(0,100),`${purpose} Magnanimous remains the public identity and orchestration brain; Superhuman Mail is an optional replaceable MCP execution adapter.`, `communications-${family}`,JSON.stringify(inputs),JSON.stringify(outputs),JSON.stringify(steps(name,purpose,risk)),risk,ts,ts).run();
 }
 await env.DB.prepare(`INSERT INTO magnanimous_system_seed_versions(seed_key,version,updated_at) VALUES(?,?,?) ON CONFLICT(seed_key) DO UPDATE SET version=excluded.version,updated_at=excluded.updated_at`).bind(SEED_KEY,SEED_VERSION,ts).run();
 warmSeeded=true;
}
