import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const desk=read('frontend/app/intelligence-desk/page.tsx');
const ui=read('frontend/app/intelligence-desk/osint-research.tsx');
const css=read('frontend/app/intelligence-desk/osint-research.module.css');
const runtime=read('worker/src/magnanimous-dns-runtime.js');
const docs=read('docs/MAGNANIMOUS-OSINT4ALL-RESEARCH-2026-10-21.md');
const pkg=read('frontend/package.json');
const deploy=read('.github/workflows/deploy.yml');
for(const s of ["import OsintResearch from './osint-research'","<OsintResearch token={token}/>","getPlatformAuthToken()"]){assert.ok(desk.includes(s),'Intelligence Desk must retain authenticated OSINT integration: '+s)}
for(const s of ["if(!token)","domainPattern.test(name)","/api/magnanimous/dns/lookup","/api/magnanimous/dns/email-security","Authorization:'Bearer '+token","cache:'no-store'","disabled={busy||!token}","role=\"alert\""]){assert.ok(ui.includes(s),'Research UI must retain gate: '+s)}
for(const s of ["const user=await currentUser(request,env);if(!user)return json({detail:'Sign in required.'},401);","path==='/api/magnanimous/dns/lookup'","path==='/api/magnanimous/dns/email-security'"]){assert.ok(runtime.includes(s),'Backend protected read route must exist: '+s)}
for(const s of ['/api/magnanimous/dns/rdap','/api/magnanimous/dns/diagnose','schema_version:1','collected_at:new Date().toISOString()','JSON.stringify(evidence,null,2)','URL.createObjectURL(blob)','SAVE EVIDENCE JSON','setEvidence(null)','rel="noopener noreferrer"','https://web.archive.org/web/*/https://','https://crt.sh/?q=%25.']){assert.ok(ui.includes(s),'OSINT extended capability or evidence guard must remain: '+s)}
for(const s of ["path==='/api/magnanimous/dns/rdap'","path==='/api/magnanimous/dns/diagnose'"]){assert.ok(runtime.includes(s),'OSINT extended service must use signed-in existing router: '+s)}
assert.ok(!ui.includes('method:"PUT"')&&!ui.includes("method:'PUT'"),'No HTTP PUT writes');
assert.ok(!ui.includes('method:"DELETE"')&&!ui.includes("method:'DELETE'"),'No HTTP DELETE writes');
assert.ok(!ui.includes('localStorage')&&!ui.includes('sessionStorage'),'Research evidence must not be silently persisted');
assert.ok(ui.includes('canPivot&&'),'External historical research pivots require a valid domain');
assert.ok(ui.includes("origin:'magnanimous-native-dns'"),'Report must identify the research origin');
assert.ok(ui.includes("new Blob([JSON.stringify(evidence,null,2)]"),'Evidence must export locally without a server upload');

assert.ok(!ui.includes('/api/magnanimous/dns/cloudflare/stage'),'OSINT read-only UI must not expose DNS mutation');
assert.ok(!ui.includes('https://osint4all.com/'),'UI must be first-party rather than embedding OSINT directory');
assert.ok(!ui.includes('sk-'),'No hardcoded provider credential patterns');
assert.ok(css.includes('@media(max-width:700px)'),'Research panel must be mobile responsive');
assert.ok(docs.includes('**Candidate; not deployed**'),'License-reviewed technologies cannot be described as installed');
assert.ok(pkg.includes('qa/scripts/osint-native-research-lock.mjs'),'Build contract audit must run OSINT regression check');
assert.ok(deploy.includes('userinfo_status="$(safe_expected_status /tmp/magnanimous-userinfo-unauth.json 401 "$BASE_URL/oauth/userinfo")"'),'UserInfo production smoke must retry only transient network failures while still requiring HTTP 401');
assert.ok(deploy.includes('if [ "$userinfo_status" != "401" ]; then'),'UserInfo authentication smoke must never treat missing or unauthorized replies as valid');
console.log('OSINT native research lock: PASS — authenticated DNS, RDAP and diagnosis; provenance export; external links on click; no paid provider or silent storage.');
