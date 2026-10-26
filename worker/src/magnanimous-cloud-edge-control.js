// First-party Magnanimous Cloud *control plane*, backed by the existing Worker D1.
// This adapter records owner-scoped desired state and staged actions only. It never
// provisions, destroys, or bills for actual infrastructure or provider capacity.
const EDGE_PROJECT='mcloud-edge-project-core';
const stamp=()=>Math.floor(Date.now()/1000);
const clean=(value,max=120)=>String(value??'').trim().slice(0,max);
const uuid=()=>crypto.randomUUID();
const parse=(value)=>{try{return JSON.parse(value||'{}')}catch{return{}}};
const KINDS=Object.freeze({
 environment:'control-plane',template:'control-plane','feature-flag':'control-plane',
 'egress-policy':'control-plane','cache-policy':'control-plane','rate-limit-policy':'control-plane',
 workflow:'control-plane',schedule:'control-plane','access-policy':'control-plane',
 domain:'control-plane','dns-zone':'control-plane',firewall:'control-plane',
 'ssh-key':'control-plane','backup-policy':'control-plane',alert:'control-plane',
 service:'host-capacity',deployment:'host-capacity',build:'host-capacity',
 app:'host-capacity',worker:'host-capacity',job:'host-capacity',function:'host-capacity',
 'compute-instance':'host-capacity','container-service':'host-capacity',
 'kubernetes-cluster':'host-capacity','private-network':'host-capacity',
 'public-ip':'external-public-network','load-balancer':'host-capacity',
 database:'host-capacity','object-bucket':'host-capacity',
 'block-volume':'host-capacity','file-share':'host-capacity'
});
const ACTIONS=new Set(['inspect','plan','create','update','deploy','start','stop','restart','rebuild','delete','destroy','restore','detach','revoke','scale','rollback']);
const CONSEQUENTIAL=new Set(['deploy','start','stop','restart','rebuild','delete','destroy','restore','detach','revoke','scale','rollback']);
const KEY_BLOCK=/(password|credential|private.?key|api.?key|access.?token|auth.?token|secret)/i;

function safeObject(value){
 if(!value||typeof value!=='object'||Array.isArray(value))return{};
 const visit=(v,depth=0)=>{
  if(depth>6)throw new Error('Nested control-plane metadata is too deep.');
  if(Array.isArray(v))return v.map(x=>visit(x,depth+1));
  if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).map(([k,x])=>{
   if(KEY_BLOCK.test(k))throw new Error('Do not store credentials or secrets in cloud resource metadata.');
   return[k,visit(x,depth+1)];
  }));
  return v;
 };
 const checked=visit(value);
 if(JSON.stringify(checked).length>12000)throw new Error('Control-plane metadata exceeds 12 KB.');
 return checked;
}

function resource(row){return row?{...row,spec:parse(row.spec_json),status:parse(row.status_json)}:null}
function action(row){return row?{...row,payload:parse(row.payload_json),result:parse(row.result_json)}:null}

export async function magnanimousCloudEdgeReady(env){
 if(!env?.DB?.prepare)return false;
 try{return Boolean(await env.DB.prepare('SELECT id FROM magnanimous_cloud_edge_projects LIMIT 1').first())}catch{return false}
}

export function magnanimousCloudEdgeControl(env){
 if(!env?.DB?.prepare)return null;
 const db=env.DB;
 return{
  async summary(){
   const [projects,resources,actions,byKind]=await Promise.all([
    db.prepare('SELECT COUNT(*) AS count FROM magnanimous_cloud_edge_projects').first(),
    db.prepare('SELECT COUNT(*) AS count FROM magnanimous_cloud_edge_resources').first(),
    db.prepare('SELECT COUNT(*) AS count FROM magnanimous_cloud_edge_actions').first(),
    db.prepare('SELECT kind,COUNT(*) AS count FROM magnanimous_cloud_edge_resources GROUP BY kind ORDER BY kind').all()
   ]);
   return{
    identity:'Magnanimous Cloud',brain:'Magnanimous AI',
    mode:'worker-d1-staged-control-plane',native_control_plane_active:true,
    projects:Number(projects?.count||0),resources:Number(resources?.count||0),
    actions:Number(actions?.count||0),resources_by_kind:byKind?.results||[],
    supported_kinds:Object.keys(KINDS),
    paid_provider_calls:0,provider_capacity_connected:false,
    execution_boundary:'Desired-state definitions and action staging only; real infrastructure requires a separately authorized executor and funding.'
   };
  },
  async listProjects(){
   const rows=await db.prepare('SELECT * FROM magnanimous_cloud_edge_projects ORDER BY created_at ASC LIMIT 100').all();
   return rows?.results||[];
  },
  async createProject(input={}){
   const name=clean(input.name),slug=clean(input.slug||name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''),80);
   if(!name||!slug||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))throw new Error('Valid project name and slug are required.');
   const id='mcloud-edge-project-'+uuid(),ts=stamp();
   await db.prepare('INSERT INTO magnanimous_cloud_edge_projects(id,name,slug,description,created_at,updated_at) VALUES(?,?,?,?,?,?)')
    .bind(id,name,slug,clean(input.description,500),ts,ts).run();
   return db.prepare('SELECT * FROM magnanimous_cloud_edge_projects WHERE id=?').bind(id).first();
  },
  async listResources({project_id='',kind=''}={}){
   const clauses=[],params=[];
   if(project_id){clauses.push('project_id=?');params.push(clean(project_id,160))}
   if(kind){clauses.push('kind=?');params.push(clean(kind,80))}
   const sql='SELECT * FROM magnanimous_cloud_edge_resources'+(clauses.length?' WHERE '+clauses.join(' AND '):'')+' ORDER BY updated_at DESC LIMIT 250';
   const rows=await db.prepare(sql).bind(...params).all();
   return(rows?.results||[]).map(resource);
  },
  async getResource(id){
   return resource(await db.prepare('SELECT * FROM magnanimous_cloud_edge_resources WHERE id=? LIMIT 1').bind(clean(id,160)).first());
  },
  async createResource(input={}){
   const kind=clean(input.kind,80),name=clean(input.name),projectId=clean(input.project_id||EDGE_PROJECT,160);
   if(!Object.hasOwn(KINDS,kind))throw new Error('Unsupported native control-plane resource kind.');
   if(!name)throw new Error('Resource name is required.');
   const project=await db.prepare('SELECT id FROM magnanimous_cloud_edge_projects WHERE id=?').bind(projectId).first();
   if(!project)throw new Error('Magnanimous Cloud project not found.');
   const spec=safeObject(input.spec),capacity=KINDS[kind],ts=stamp(),id='mcloud-edge-'+uuid();
   const status={control_plane:'active',execution:'not-executed',external_capacity_required:capacity!=='control-plane',provider_calls:0};
   await db.prepare(`INSERT INTO magnanimous_cloud_edge_resources
    (id,project_id,kind,name,region,state,desired_state,capacity_class,spec_json,status_json,created_at,updated_at)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`).bind(
     id,projectId,kind,name,clean(input.region||'owner-control-1',64),
     capacity==='control-plane'?'defined-native-control':'defined-awaiting-capacity',
     clean(input.desired_state||'defined',40),capacity,JSON.stringify(spec),JSON.stringify(status),ts,ts
    ).run();
   return this.getResource(id);
  },
  async stageAction(resourceId,name,payload={}){
   const existing=await this.getResource(resourceId),actionName=clean(name,80);
   if(!existing)throw new Error('Magnanimous Cloud resource not found.');
   if(!ACTIONS.has(actionName))throw new Error('Unsupported control-plane action.');
   const safePayload=safeObject(payload),ts=stamp(),id='mcloud-edge-action-'+uuid();
   const status=CONSEQUENTIAL.has(actionName)?'staged-requires-explicit-approval':'staged-control-only';
   const result={executed:false,provider_calls:0,note:'Staged in owner-only D1. No external infrastructure change or charge was made.'};
   await db.prepare('INSERT INTO magnanimous_cloud_edge_actions(id,resource_id,action,status,payload_json,result_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)')
    .bind(id,existing.id,actionName,status,JSON.stringify(safePayload),JSON.stringify(result),ts,ts).run();
   return{id,resource_id:existing.id,action:actionName,status,result,created_at:ts,updated_at:ts};
  },
  async listActions(resourceId=''){
   const id=clean(resourceId,160),rows=id
    ?await db.prepare('SELECT * FROM magnanimous_cloud_edge_actions WHERE resource_id=? ORDER BY created_at DESC LIMIT 250').bind(id).all()
    :await db.prepare('SELECT * FROM magnanimous_cloud_edge_actions ORDER BY created_at DESC LIMIT 250').all();
   return(rows?.results||[]).map(action);
  }
 };
}
