import fs from 'node:fs';

const ui=fs.readFileSync('frontend/app/assistant-actions/page.tsx','utf8');
const required=[
 ['separate approval endpoint',ui.includes('/api/assistant-integrations/actions/${encodeURIComponent(id)}/confirm')],
 ['pending confirmation state',ui.includes("d.status!=='needs_confirmation'")&&ui.includes("a.status==='needs_confirmation'")],
 ['confirmation cannot be disabled',ui.includes('require_confirmation:true')&&!ui.includes('require_confirmation:false')],
 ['no execute-now copy',!ui.includes('EXECUTE NOW')&&!ui.includes('AUTOMATIC ACCESS')],
 ['explicit staged write copy',ui.includes('PREPARE FOR REVIEW')&&ui.includes('Review pending write')&&ui.includes('APPROVE & RUN')],
 ['live status',ui.includes('aria-live="polite"')&&ui.includes('role="status"')],
 ['keyboard focus',ui.includes(':focus-visible')],
 ['44px controls',ui.includes('min-height:44px')||ui.includes('minHeight:44')]
];
for(const [name,ok] of required)console.log(`${ok?'PASS':'FAIL'} - ${name}`);
const failed=required.filter(([,ok])=>!ok);
if(failed.length){console.error(`Connected Assistant UI lock failed: ${failed.length} check(s).`);process.exit(1)}
console.log(`Connected Assistant UI lock: ${required.length} checks passed.`);
