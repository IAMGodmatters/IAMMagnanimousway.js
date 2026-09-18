import fs from 'node:fs';
const root=p=>new URL('../../'+p,import.meta.url);
const read=p=>fs.readFileSync(root(p),'utf8');
const must=(ok,msg)=>{if(!ok)throw new Error(msg)};

const agency=read('worker/src/agency-growth-runtime.js');
const wl=read('worker/src/white-label-os-runtime.js');
const brain=read('worker/src/white-label-brain-runtime.js');
const automation=read('worker/src/agency-automation-runtime.js');
const usage=read('worker/src/usage-guard.js');
const bpo=read('worker/src/bpo-operations-runtime.js');
const auth=read('worker/src/admin-compat-entrypoint.js');
const publicFunnel=read('worker/src/public-agency-funnel-runtime.js');
const operations=read('worker/src/operations-entrypoint.js');
const wrangler=read('worker/wrangler.jsonc');
const shell=read('frontend/app/white-label/app/page.tsx');
const os=read('frontend/app/white-label-os/page.tsx');
const studio=read('frontend/app/white-label-studio/page.tsx');
const agencyUi=read('frontend/app/agency-command/page.tsx');
const clientApps=read('frontend/app/white-label/client-apps/page.tsx');
const brandedAi=read('frontend/app/white-label/branded-ai/page.tsx');

for(const src of [agency,wl,brain,automation]){
 must(src.includes("status='active'"),'White Label paid access must require an active billing subscription.');
 must(!src.includes("status IN ('active','trialing')"),'White Label access must not treat trialing as paid access.');
}
must(!agency.includes("SELECT plan FROM tenants WHERE id=?"),'Agency access must not trust legacy tenants.plan as payment proof.');
must(!wl.includes("SELECT plan FROM tenants WHERE id=?"),'White Label OS must not trust legacy tenants.plan as payment proof.');
must(!brain.includes("SELECT plan FROM tenants WHERE id=?"),'White Label brain must not trust legacy tenants.plan as payment proof.');

for(const id of ['agency:{rank:5','agency_pro:{rank:6','client_subaccounts:25','client_subaccounts:100','usage_rebilling:true'])must(usage.includes(id),'Shared usage guard missing Agency entitlement: '+id);

must(auth.includes("bind(uid, tid, name, email, 'owner'"),'New workspace creator must be the workspace owner.');
must(auth.includes("tenant?.owner_user_id")&&auth.includes("UPDATE users SET role='owner'"),'Existing recorded tenant owners must be repaired on login.');
must(bpo.includes("CLIENT_SUBACCOUNT_LIMIT")&&bpo.includes("plan==='agency'?25:plan==='agency_pro'?100"),'Agency 25/100 client limits must be enforced server-side.');
must(bpo.includes("/api/bpo/clients/")&&bpo.includes("'archived'"),'Client archive/reactivate path must exist.');

must(shell.includes("src:'/white-label/branded-ai'"),'Branded AI must open its dedicated workspace.');
must(shell.includes("src:'/white-label/client-apps'"),'Client Apps must open its dedicated workspace.');
for(const deep of ["?tab=booking","?tab=reputation","?tab=billing"])must(shell.includes(deep)||os.includes(deep),'White Label module missing deep link '+deep);
must(clientApps.includes('/api/white-label-os/client-apps')&&clientApps.includes('Save client apps'),'Client Apps must persist client-scoped app selections.');
must(brandedAi.includes('/api/white-label/brain/assist')&&brandedAi.includes('/api/agency/clients/'),'Branded AI must use the White Label brain and client brand context.');

must(wl.includes('agency_client_apps')&&wl.includes("u.pathname==='/api/white-label-os/client-apps'"),'Client Apps storage/API is missing.');
must(wl.includes("request.method==='PATCH'")&&wl.includes("request.method==='DELETE'"),'White Label Studio must support edit/delete.');
must(wl.includes("That client does not belong to this White Label workspace."),'Studio/client app references must be tenant validated.');
must(studio.includes("method:editId?'PATCH':'POST'")&&studio.includes("method:'DELETE'"),'White Label Studio UI must expose update/delete.');

must(operations.includes('handlePublicAgencyFunnel'),'Hosted public funnels must be routed by the production operations layer.');
must(wrangler.includes('"/funnels/*"'),'Dynamic hosted funnel URLs must run through the Worker.');
for(const term of ["visits=visits+1","leads=leads+1","INSERT INTO crm_contacts","white-label-funnel","safeHttpUrl"])must(publicFunnel.includes(term),'Hosted funnel runtime missing '+term);
must(agency.includes('public_url'),'Agency funnel API must return the hosted public URL.');
must(agencyUi.includes('Open live ↗'),'Agency UI must expose the live hosted funnel.');

must(automation.includes("An active White Label Agency subscription is required."),'Agency Automations must be behind Agency billing.');
must(agency.includes("Math.max(0,Number(b.cost_usd||0))")&&agency.includes("Math.max(0,Number(b.units||0))"),'Usage rebilling must reject negative economics at the server boundary.');
must(agencyUi.includes('does not charge a client card by itself')&&agencyUi.includes('accounting states only'),'Usage rebilling UI must explain that its ledger does not execute a payment.');

for(const overclaim of ['Proposals + eSign','Projects + Tasks','installable-app path'])must(!wl.includes(overclaim),'White Label still overclaims an unimplemented capability: '+overclaim);
must(os.includes("analytics:'/agency-command?tab=command'"),'Agency Overview must not route ordinary Agency customers into platform-owner operations.');

console.log('White Label deep integrity audit passed.');