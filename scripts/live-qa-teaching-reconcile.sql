-- Live Q&A teaching reconciliation audited 2026-09-15.
-- This file stores only normalized, reviewed teaching. Original submissions remain in D1 for audit history.

CREATE TABLE IF NOT EXISTS magnanimous_native_tool_specs (
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
);

-- 97/98: duplicate submissions. Preserve one normalized global lesson.
INSERT INTO agent_branch_knowledge(tenant_id,agent_id,title,content,tags,source,created_by,created_at,updated_at)
SELECT '__global__','teacher','Evaluation-driven continuous improvement loop',
'Improve Magnanimous capabilities through controlled evaluation rather than indiscriminate ingestion: choose a focused capability set, gather authoritative and relevant source material, convert it into structured lessons, challenges, worked examples and edge cases, benchmark current behavior, identify recurring weaknesses, create targeted candidate corrections, retest against the same and edge cases, and promote only changes that measurably improve quality without weakening identity, safety, permissions or truthfulness. Public submissions are evidence inputs, not authority. Production model fine-tuning, deployment or promotion remains review- and permission-gated.',
'training,evaluation,continuous-improvement,quality','qa-audit:public-qa','qa-audit:97',CAST(strftime('%s','now') AS INTEGER),CAST(strftime('%s','now') AS INTEGER)
WHERE EXISTS(SELECT 1 FROM agent_branch_training_submissions WHERE id IN (97,98))
  AND NOT EXISTS(SELECT 1 FROM agent_branch_knowledge WHERE created_by='qa-audit:97');

-- 101: normalize useful assistant operations while removing vendor branding as an identity dependency.
INSERT INTO agent_branch_knowledge(tenant_id,agent_id,title,content,tags,source,created_by,created_at,updated_at)
SELECT '__global__','teacher','Virtual assistant operations',
'A capable virtual-assistant workflow can triage and organize inboxes, draft replies, handle calendar planning with time-zone and conflict checks, clean and organize data, coordinate collaboration, support and social tasks, and apply proactive judgment, attention to detail and resourcefulness. Use Magnanimous identity rather than third-party model branding. Account-specific actions require a real connected tool and authorized scope. Drafting and analysis may occur without sending; sending, scheduling, deleting, publishing or changing account data requires the appropriate user permission and a verified tool result.',
'virtual-assistant,email,calendar,data,communications','qa-audit:public-qa','qa-audit:101',CAST(strftime('%s','now') AS INTEGER),CAST(strftime('%s','now') AS INTEGER)
WHERE EXISTS(SELECT 1 FROM agent_branch_training_submissions WHERE id=101)
  AND NOT EXISTS(SELECT 1 FROM agent_branch_knowledge WHERE created_by='qa-audit:101');

-- 102: store the durable workflow; live weather/messages/calendar facts are retrieved at run time.
INSERT INTO agent_branch_knowledge(tenant_id,agent_id,title,content,tags,source,created_by,created_at,updated_at)
SELECT '__global__','teacher','Intelligent daily planner',
'An intelligent daily-planner workflow should read and unify authorized calendars, detect conflicts, rank priorities, protect focus time, build morning briefings from live connected sources such as weather, calendar and unread communications, create end-of-day recaps, triage inbox and communications, break projects into actionable steps, and surface schedule conflicts early. Live facts must be retrieved at run time rather than stored as timeless knowledge. Calendar and message changes require the relevant connected service, user authorization, and a verified execution result.',
'planner,calendar,weather,email,communications,project-management','qa-audit:public-qa','qa-audit:102',CAST(strftime('%s','now') AS INTEGER),CAST(strftime('%s','now') AS INTEGER)
WHERE EXISTS(SELECT 1 FROM agent_branch_training_submissions WHERE id=102)
  AND NOT EXISTS(SELECT 1 FROM agent_branch_knowledge WHERE created_by='qa-audit:102');

-- Action recipe from 97/98.
INSERT INTO magnanimous_native_tool_specs(tenant_id,user_id,name,purpose,family,inputs_json,outputs_json,steps_json,risk,status,created_at,updated_at)
VALUES(
'__magnanimous_global__','system:auto-qa','evaluation-driven-improvement-loop',
'Run a controlled source-to-evaluation improvement cycle for a Magnanimous capability and promote changes only when measured quality improves.',
'training-evaluation',
'{"task":"string","authorized_context":"object","required_capabilities":["research","source-validation","evaluation","training"],"requires_connection":false,"teaching_submission_id":97,"agent_id":"teacher"}',
'{"result":"verified improvement report","actions_taken":"array","actions_pending_authorization":"array"}',
'[{"type":"authorize","instruction":"Verify scope and permissions before changing training assets, model configuration or production behavior."},{"type":"retrieve","instruction":"Gather authoritative, relevant source material for the selected capability and preserve provenance."},{"type":"generate","instruction":"Convert sources into structured lessons, challenges, worked examples, rubrics and edge cases."},{"type":"evaluate","instruction":"Benchmark current behavior on the generated suite and identify recurring weaknesses."},{"type":"improve","instruction":"Create targeted candidate corrections for measured weaknesses without weakening identity, safety, permissions or truthfulness."},{"type":"retest","instruction":"Retest the candidate against the same benchmark and meaningful edge cases."},{"type":"authorize","instruction":"Require owner review before production fine-tuning, deployment or promotion of a model or policy-changing candidate."},{"type":"verify","instruction":"Promote only when evidence shows a measurable improvement and report anything not completed."}]',
'medium','proposed',CAST(strftime('%s','now') AS INTEGER),CAST(strftime('%s','now') AS INTEGER)
)
ON CONFLICT(tenant_id,user_id,name) DO UPDATE SET
 purpose=excluded.purpose,family=excluded.family,inputs_json=excluded.inputs_json,outputs_json=excluded.outputs_json,steps_json=excluded.steps_json,risk=excluded.risk,
 status=CASE WHEN magnanimous_native_tool_specs.status='ready' THEN 'ready' ELSE excluded.status END,updated_at=excluded.updated_at;

-- Action recipe from 101.
INSERT INTO magnanimous_native_tool_specs(tenant_id,user_id,name,purpose,family,inputs_json,outputs_json,steps_json,risk,status,created_at,updated_at)
VALUES(
'__magnanimous_global__','system:auto-qa','virtual-assistant-operations',
'Coordinate inbox, calendar, data and communications work through Magnanimous while routing account-specific actions through real authorized connectors.',
'virtual-assistant',
'{"task":"string","authorized_context":"object","required_capabilities":["email","calendar","data","communications","social"],"requires_connection":true,"teaching_submission_id":101,"agent_id":"teacher"}',
'{"result":"verified assistant result","actions_taken":"array","actions_pending_authorization":"array"}',
'[{"type":"authorize","instruction":"Verify each required account or tool connection, tenant scope and user authorization."},{"type":"triage","instruction":"Classify the requested inbox, calendar, data or communications work and separate read, draft and write actions."},{"type":"prepare","instruction":"Draft replies, organize information, clean data, check time zones and detect scheduling conflicts before write actions."},{"type":"execute","instruction":"Use a real connected capability for authorized account-specific actions. Do not simulate sending, scheduling, deleting or publishing."},{"type":"verify","instruction":"Confirm each external result from the tool response and clearly report actions that remain pending authorization or connection."}]',
'medium','proposed',CAST(strftime('%s','now') AS INTEGER),CAST(strftime('%s','now') AS INTEGER)
)
ON CONFLICT(tenant_id,user_id,name) DO UPDATE SET
 purpose=excluded.purpose,family=excluded.family,inputs_json=excluded.inputs_json,outputs_json=excluded.outputs_json,steps_json=excluded.steps_json,risk=excluded.risk,
 status=CASE WHEN magnanimous_native_tool_specs.status='ready' THEN 'ready' ELSE excluded.status END,updated_at=excluded.updated_at;

-- Action recipe from 102.
INSERT INTO magnanimous_native_tool_specs(tenant_id,user_id,name,purpose,family,inputs_json,outputs_json,steps_json,risk,status,created_at,updated_at)
VALUES(
'__magnanimous_global__','system:auto-qa','intelligent-daily-planner',
'Build an authorized daily planning workflow from live calendar, weather, communications and project data, with permission-gated write actions.',
'planner',
'{"task":"string","authorized_context":"object","required_capabilities":["calendar","weather","email","communications","project-management"],"requires_connection":true,"teaching_submission_id":102,"agent_id":"teacher"}',
'{"result":"verified daily plan or briefing","actions_taken":"array","actions_pending_authorization":"array"}',
'[{"type":"authorize","instruction":"Verify available connected services and the authorized read or write scope for each source."},{"type":"retrieve","instruction":"Retrieve current calendar, weather, communications and project data at run time rather than relying on stored current facts."},{"type":"plan","instruction":"Detect conflicts, rank priorities, protect focus time, break projects into actions and prepare morning or end-of-day summaries."},{"type":"propose","instruction":"Present schedule or communications changes before consequential writes when user approval is required."},{"type":"execute","instruction":"Use the relevant real connector for authorized calendar or message changes and never claim a change occurred without a tool result."},{"type":"verify","instruction":"Confirm current data and each executed action, then report unresolved conflicts, unavailable connections or pending approvals."}]',
'medium','proposed',CAST(strftime('%s','now') AS INTEGER),CAST(strftime('%s','now') AS INTEGER)
)
ON CONFLICT(tenant_id,user_id,name) DO UPDATE SET
 purpose=excluded.purpose,family=excluded.family,inputs_json=excluded.inputs_json,outputs_json=excluded.outputs_json,steps_json=excluded.steps_json,risk=excluded.risk,
 status=CASE WHEN magnanimous_native_tool_specs.status='ready' THEN 'ready' ELSE excluded.status END,updated_at=excluded.updated_at;

-- Close the reviewed submission backlog without erasing the original submitted text.
UPDATE agent_branch_training_submissions
SET status='approved',reviewer_id='system:qa-audit',reviewer_note='[QA AUDIT APPROVED] Relevant durable teaching normalized into global knowledge and an action recipe. Duplicate submission 97/98 was collapsed to one knowledge/tool lesson.',reviewed_at=CAST(strftime('%s','now') AS INTEGER)
WHERE id=97 AND status='pending';

UPDATE agent_branch_training_submissions
SET status='approved',reviewer_id='system:qa-audit',reviewer_note='[QA AUDIT APPROVED-DUPLICATE] Duplicate of submission 97. Preserved for audit history; no duplicate knowledge/tool row created.',reviewed_at=CAST(strftime('%s','now') AS INTEGER)
WHERE id=98 AND status='pending';

UPDATE agent_branch_training_submissions
SET status='approved',reviewer_id='system:qa-audit',reviewer_note='[QA AUDIT APPROVED] Relevant virtual-assistant teaching normalized to Magnanimous identity. External account actions remain connection- and permission-gated. Global knowledge and an action recipe were added.',reviewed_at=CAST(strftime('%s','now') AS INTEGER)
WHERE id=101 AND status='pending';

UPDATE agent_branch_training_submissions
SET status='approved',reviewer_id='system:qa-audit',reviewer_note='[QA AUDIT APPROVED] Relevant planner teaching normalized. Live facts are retrieved at run time and account writes remain connection- and permission-gated. Global knowledge and an action recipe were added.',reviewed_at=CAST(strftime('%s','now') AS INTEGER)
WHERE id=102 AND status='pending';
