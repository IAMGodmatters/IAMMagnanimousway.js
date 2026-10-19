import assert from 'node:assert/strict';
import fs from 'node:fs';
const ui=fs.readFileSync('frontend/app/orca-workbench/page.tsx','utf8');
const dev=fs.readFileSync('frontend/app/developer-agent/page.tsx','utf8');
const robots=fs.readFileSync('frontend/public/robots.txt','utf8');
assert.ok(ui.startsWith("'use client'"),'Owner workbench must have working client controls.');
for(const endpoint of [
 '/api/magnanimous/dev-agent/parallel/plan',
 '/api/magnanimous/api-contract/mcp-preview',
 '/api/magnanimous/api-contract/mcp-stage',
 '/api/magnanimous/api-contract/mcp-drafts',
 '/api/magnanimous/tools/traces'
])assert.ok(ui.includes(endpoint),'Missing functional owner workbench action '+endpoint);
for(const label of ['Development tasks (JSON)','API specification (JSON)','View tool diagnostics','Save as disabled draft'])assert.ok(ui.includes(label),'Owner action is missing: '+label);
assert.ok(ui.includes('acknowledge_draft_only:true'),'Draft staging must acknowledge disabled status.');
assert.ok(ui.includes('Authorization:'),'Owner requests must use existing token.');
assert.ok(ui.includes('role="status"')&&ui.includes('aria-live="polite"'),'Status updates must be announced.');
assert.ok(ui.includes('min-height:44px')&&ui.includes('focus-visible')&&ui.includes('@media(max-width:700px)'),'Mobile/touch/keyboard support must remain.');
assert.ok(!ui.includes('location.href="http'),'No external redirects.');
assert.ok(dev.includes('href="/orca-workbench"'),'Owner developer console must link to workbench.');
assert.ok(robots.includes('Disallow: /orca-workbench/'),'Owner workbench must not be promoted to public crawlers.');
console.log('Magnanimous Orca Workbench UI lock passed: responsive functional owner tools, auth, accessible labels, no public indexing.');
