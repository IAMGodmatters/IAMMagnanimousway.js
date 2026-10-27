import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {handleMagnanimousVibeStudio} from '../../worker/src/magnanimous-vibe-studio.js';

const secret='qa-only-customer-code-studio-secret';
const exp=Math.floor(Date.now()/1000)+1800;
const token=(tenant)=>{
  const payload=`user-${tenant}|${tenant}|member|${exp}`;
  return payload+'|'+createHmac('sha256',secret).update(payload).digest('hex');
};
const records=[];
const environment=(status='active',plan='plus')=>({
  SESSION_SECRET:secret,
  DB:{prepare(sql){return{
    bind(...args){return{
      async first(){
        records.push({sql,args});
        if(sql.includes('FROM users WHERE id='))return{id:args[0],tenant_id:args[1],active:1,role:'member'};
        if(sql.includes('FROM billing_subscriptions WHERE tenant_id='))return{status,plan};
        throw new Error('Unexpected SQL: '+sql);
      }
    };}
  };}}
});
const req=(path,tenant)=>new Request('https://iammagnanimousway.com'+path,{headers:tenant?{authorization:'Bearer '+token(tenant)}:{}});

const anonymous=await handleMagnanimousVibeStudio(req('/api/customer/code-studio'),environment());
assert.equal(anonymous.status,401,'Anonymous users may not access customer code projects');
const free=await handleMagnanimousVibeStudio(req('/api/customer/code-studio','tenant-a'),environment('active','free'));
assert.equal(free.status,402,'Free plan must not access paid code studio');
const canceled=await handleMagnanimousVibeStudio(req('/api/customer/code-studio','tenant-a'),environment('canceled','business'));
assert.equal(canceled.status,402,'Canceled Stripe plan must not access paid code studio');
const active=await handleMagnanimousVibeStudio(req('/api/customer/code-studio','tenant-a'),environment('active','plus'));
assert.equal(active.status,200,'Paid active subscriber should access private code tools');
const data=await active.json();
assert.equal(data.policy.owner_only,false);
assert.equal(data.policy.customer_workspace,true);
assert.equal(data.policy.platform_repository_access,false);
assert.equal(data.policy.production_publish,false);
assert.equal(data.limits.max_projects,25);
assert.ok(records.some(row=>row.sql.includes('FROM billing_subscriptions')&&row.args[0]==='tenant-a'),'Billing lookup must use token tenant');
const runtime=readFileSync('worker/src/magnanimous-vibe-studio.js','utf8');
assert.ok(runtime.includes('tenant_id=? AND user_id=?'),'Saved project reads must isolate tenant and user');
assert.ok(runtime.includes('subscription.status!==\'active\''),'Paid access must use confirmed active subscription');
const edge=readFileSync('worker/src/security-entrypoint.js','utf8');
assert.ok(edge.includes("url.pathname==='/api/customer/code-studio'"),'Customer code must bypass unavailable standalone proxy');
const ui=readFileSync('frontend/app/vibe-studio/VibeStudioClient.tsx','utf8');
const route=readFileSync('frontend/app/code-studio/page.tsx','utf8');
assert.ok(route.includes('<MagnanimousVibeStudio customer />'),'Separate customer page must enable restricted mode');
assert.ok(readFileSync('frontend/app/start/page.tsx','utf8').includes("href:'/code-studio'"),'Customer onboarding must link to Code Studio');
assert.ok(readFileSync('frontend/public/robots.txt','utf8').includes('Disallow: /code-studio/'),'Private customer coding workspace must be excluded from crawlers');
for(const part of ['sandbox="allow-scripts"','connect-src &#39;none&#39;','!customer&&<a href="/developer-agent"','customer?\'/api/customer/code-studio\''])assert.ok(ui.includes(part),'Missing customer coding UI isolation: '+part);
console.log('PASS: paid customer code studio subscription gate, owner separation, tenant scope, safe preview, and free plan denial.');
