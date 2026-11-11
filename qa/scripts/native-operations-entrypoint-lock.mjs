import fs from 'node:fs';
import assert from 'node:assert/strict';

const entry=fs.readFileSync(new URL('../../worker/src/entrypoint.js',import.meta.url),'utf8');
const runtime=fs.readFileSync(new URL('../../worker/src/native-work-crm-runtime.js',import.meta.url),'utf8');
const college=fs.readFileSync(new URL('../../frontend/app/ai-college/page.tsx',import.meta.url),'utf8');

assert.ok(entry.includes("import { handleNativeWorkCrm } from './native-work-crm-runtime.js';"),'Worker entrypoint imports the actual exported native Operations handler.');
assert.ok(entry.includes('const nativeOperations=await handleNativeWorkCrm(request,env);'),'Worker entrypoint invokes the native Operations handler.');
assert.ok(entry.indexOf('if(nativeOperations)return nativeOperations;')<entry.indexOf('return app.fetch(request,env,ctx);'),'Native Operations routes are dispatched before the legacy app fallback.');
assert.ok(runtime.includes('export async function handleNativeWorkCrm(request,env){'),'Native Operations handler is exported by the runtime module.');
assert.ok(runtime.includes("if(!url.pathname.startsWith('/api/operations'))return null;"),'Handler is scoped to Operations routes.');
assert.ok(runtime.includes("const user=await currentUser(request,env);if(!user)return json({detail:'Sign in required.'"),'Operations routes require an authenticated user.');
assert.ok(runtime.includes("const t=tenant(user);if(!t)return json({detail:'Tenant context required.'"),'Operations routes require authenticated tenant context.');
for(const route of ["url.pathname==='/api/operations/workspaces'","url.pathname==='/api/operations/boards'","url.pathname==='/api/operations/records'"]) assert.ok(runtime.includes(route),'Missing authenticated endpoint '+route);
assert.ok(runtime.includes('WHERE tenant_id=? AND id=?'),'Owned records remain tenant-scoped.');
assert.ok(/request\('\/api\/operations\/workspaces/.test(college)&&/request\('\/api\/operations\/boards/.test(college)&&/request\('\/api\/operations\/records/.test(college),'College uses the authenticated native Operations API.');
console.log('Native Operations API route wiring lock: PASS');
