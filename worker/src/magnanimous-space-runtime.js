import { currentUser } from './integrations.js';
import { twilioCapabilitySummary } from './magnanimous-twilio-capability-registry.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const now=()=>Math.floor(Date.now()/1000);
const id=prefix=>`${prefix}_${crypto.randomUUID()}`;
const ownerOnly=user=>user?.role==='owner';

async function count(env,sql,...bind){try{return Number((await env.DB.prepare(sql).bind(...bind).first())?.n||0)}catch{return 0}}

export async function handleMagnanimousSpace(request,env){
  const url=new URL(request.url),path=url.pathname;
  if(!path.startsWith('/api/space'))return null;
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{'access-control-allow-origin':'*','access-control-allow-headers':'authorization,content-type','access-control-allow-methods':'GET,POST,PUT,OPTIONS'}});
  const user=await currentUser(request,env);
  if(!user)return json({detail:'Sign in to Magnanimous AI Space.'},401);
  if(!ownerOnly(user))return json({detail:'Owner access required.'},403);
  if(!env?.DB)return json({detail:'Space program database binding is unavailable.'},503);
  const tenant=String(user.tenant_id||'');

  if(path==='/api/space/overview'&&request.method==='GET'){
    const [programs,requirements,gates,ground,launchOptions,spacecraft]=await Promise.all([
      count(env,'SELECT COUNT(*) n FROM space_programs WHERE tenant_id=?',tenant),
      count(env,'SELECT COUNT(*) n FROM space_mission_requirements WHERE tenant_id=?',tenant),
      count(env,"SELECT COUNT(*) n FROM space_regulatory_gates WHERE tenant_id=? AND status='verified'",tenant),
      count(env,"SELECT COUNT(*) n FROM space_ground_adapters WHERE tenant_id=? AND status IN ('configured','active')",tenant),
      count(env,'SELECT COUNT(*) n FROM space_launch_options WHERE tenant_id=?',tenant),
      count(env,"SELECT COUNT(*) n FROM space_spacecraft_assets WHERE tenant_id=? AND ownership_status='owned'",tenant)
    ]);
    return json({
      identity:'Magnanimous AI Space Program',
      owner_identity:'God Matters',
      affiliation_identity:'I AM MAGNANIMOUS WAY™',
      brain_identity:'Magnanimous AI',
      phase:'software-and-mission-readiness',
      programs,requirements,verified_regulatory_gates:gates,configured_ground_adapters:ground,launch_options:launchOptions,owned_spacecraft:spacecraft,
      flight_command_enabled:false,
      purchase_actions_enabled:false,
      note:'Software readiness does not mean a satellite, launch slot, spectrum authorization, earth-station license, remote-sensing license, or flight command authority has been obtained.'
    });
  }

  if(path==='/api/space/programs'&&request.method==='GET'){
    const {results=[]}=await env.DB.prepare('SELECT * FROM space_programs WHERE tenant_id=? ORDER BY updated_at DESC LIMIT 100').bind(tenant).all();
    return json({programs:results});
  }

  if(path==='/api/space/programs'&&request.method==='POST'){
    const body=await request.json().catch(()=>({}));
    const name=String(body.name||'Magnanimous AI Satellite').trim().slice(0,120);
    const programId=id('space');
    const t=now();
    await env.DB.prepare(`INSERT INTO space_programs(id,tenant_id,name,owner_identity,affiliation_identity,brain_identity,mission_type,stage,target_orbit,target_launch_at,hosted_payload_preferred,notes,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .bind(programId,tenant,name,'God Matters','I AM MAGNANIMOUS WAY™','Magnanimous AI',String(body.mission_type||'technology_demonstration').slice(0,80),'concept',String(body.target_orbit||'LEO').slice(0,40),null,body.hosted_payload_preferred===false?0:1,String(body.notes||'').slice(0,4000),t,t).run();
    return json({id:programId,name,stage:'concept',purchase_action:false,flight_command:false},201);
  }

  if(path==='/api/space/requirements'&&request.method==='POST'){
    const body=await request.json().catch(()=>({}));
    if(!body.program_id||!body.requirement_type||!body.requirement_key)return json({detail:'program_id, requirement_type and requirement_key are required.'},400);
    const rid=id('req'),t=now();
    await env.DB.prepare(`INSERT INTO space_mission_requirements(id,tenant_id,program_id,requirement_type,requirement_key,requirement_value,priority,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(tenant_id,program_id,requirement_type,requirement_key) DO UPDATE SET requirement_value=excluded.requirement_value,priority=excluded.priority,updated_at=excluded.updated_at`)
      .bind(rid,tenant,String(body.program_id),String(body.requirement_type).slice(0,80),String(body.requirement_key).slice(0,120),String(body.requirement_value||'').slice(0,4000),String(body.priority||'medium').slice(0,20),'draft',t,t).run();
    return json({stored:true,command_action:false,purchase_action:false});
  }

  if(path==='/api/space/regulatory-gates'&&request.method==='GET'){
    const {results=[]}=await env.DB.prepare('SELECT * FROM space_regulatory_gates WHERE tenant_id=? ORDER BY updated_at DESC LIMIT 200').bind(tenant).all();
    return json({gates:results});
  }

  if(path==='/api/space/regulatory-gates'&&request.method==='PUT'){
    const body=await request.json().catch(()=>({}));
    const status=String(body.status||'researching');
    const allowed=new Set(['not_started','researching','submitted','verified','not_required']);
    if(!allowed.has(status))return json({detail:'Unsupported regulatory gate status.'},400);
    if(status==='verified'&&(!String(body.evidence_ref||'').trim()||body.confirm_external_authorization!==true))return json({detail:'Verified status requires an external evidence reference and explicit confirmation.'},400);
    const gid=id('gate'),t=now();
    await env.DB.prepare(`INSERT INTO space_regulatory_gates(id,tenant_id,program_id,jurisdiction,authority_name,gate_key,status,evidence_ref,notes,verified_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(tenant_id,program_id,jurisdiction,gate_key) DO UPDATE SET authority_name=excluded.authority_name,status=excluded.status,evidence_ref=excluded.evidence_ref,notes=excluded.notes,verified_at=excluded.verified_at,updated_at=excluded.updated_at`)
      .bind(gid,tenant,String(body.program_id||''),String(body.jurisdiction||'').slice(0,80),String(body.authority_name||'').slice(0,160),String(body.gate_key||'').slice(0,120),status,String(body.evidence_ref||'').slice(0,500),String(body.notes||'').slice(0,4000),status==='verified'?t:null,t,t).run();
    return json({stored:true,status,external_authorization_record_only:true});
  }

  if(path==='/api/space/provider-knowledge/twilio'&&request.method==='GET')return json(twilioCapabilitySummary(env));

  if(path==='/api/space/flight-command')return json({detail:'Flight-command execution is deliberately disabled until an actual spacecraft exists and command authority, spectrum authorization, security controls, and explicit owner activation are independently verified.',code:'SPACE_FLIGHT_COMMAND_LOCKED'},409);
  if(path==='/api/space/purchase')return json({detail:'Satellite, launch, ground-station, spectrum, or provider purchases are not executed without explicit purchase authorization.',code:'SPACE_PURCHASE_LOCKED'},409);

  return null;
}
