import { currentUser } from './integrations.js';
import { researchCapabilitySummary } from './magnanimous-research-capability-registry.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const now=()=>Math.floor(Date.now()/1000);
const uid=prefix=>`${prefix}_${crypto.randomUUID()}`;
const ownerOnly=user=>user?.role==='owner';
const text=(value,max=50000)=>String(value??'').trim().slice(0,max);
const finiteInt=(value,fallback=null)=>{const n=Number(value);return Number.isFinite(n)?Math.trunc(n):fallback};
const array=value=>Array.isArray(value)?value:[];

async function ensureSchema(env){
  if(!env?.DB)return;
  const statements=[
    `CREATE TABLE IF NOT EXISTS magnanimous_research_queries(id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,question TEXT NOT NULL,source_kind TEXT NOT NULL DEFAULT 'manual',status TEXT NOT NULL DEFAULT 'recorded',result_count INTEGER NOT NULL DEFAULT 0,created_by TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS magnanimous_research_papers(id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,source_kind TEXT NOT NULL DEFAULT 'normalized',external_id TEXT NOT NULL DEFAULT '',title TEXT NOT NULL,abstract TEXT NOT NULL DEFAULT '',doi TEXT NOT NULL DEFAULT '',publication_year INTEGER,journal TEXT NOT NULL DEFAULT '',publication_type TEXT NOT NULL DEFAULT '',authors_json TEXT NOT NULL DEFAULT '[]',citation_count INTEGER,open_access INTEGER NOT NULL DEFAULT 0,source_urls_json TEXT NOT NULL DEFAULT '[]',metadata_json TEXT NOT NULL DEFAULT '{}',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL,UNIQUE(tenant_id,source_kind,external_id))`,
    `CREATE TABLE IF NOT EXISTS magnanimous_research_query_results(query_id TEXT NOT NULL,paper_id TEXT NOT NULL,rank_order INTEGER NOT NULL DEFAULT 0,relevance_note TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL,PRIMARY KEY(query_id,paper_id))`,
    `CREATE TABLE IF NOT EXISTS magnanimous_research_enrichments(id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,paper_id TEXT NOT NULL,column_key TEXT NOT NULL,value_text TEXT NOT NULL DEFAULT '',source_kind TEXT NOT NULL DEFAULT 'normalized',evidence_ref TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL,UNIQUE(tenant_id,paper_id,column_key,source_kind))`,
    `CREATE TABLE IF NOT EXISTS magnanimous_research_syntheses(id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,query_id TEXT,title TEXT NOT NULL DEFAULT '',synthesis_type TEXT NOT NULL DEFAULT 'research_brief',body_text TEXT NOT NULL DEFAULT '',evidence_paper_ids_json TEXT NOT NULL DEFAULT '[]',limitations_text TEXT NOT NULL DEFAULT '',created_by TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`
  ];
  for(const sql of statements){await env.DB.prepare(sql).run()}
}

function normalizedPaper(input={}){
  const title=text(input.title,1000);
  if(!title)throw new Error('title is required');
  return {
    source_kind:text(input.source_kind||'normalized',80),
    external_id:text(input.external_id||input.id||'',240),
    title,
    abstract:text(input.abstract,50000),
    doi:text(input.doi,500),
    publication_year:finiteInt(input.publication_year??input.year,null),
    journal:text(input.journal?.display_name??input.journal,1000),
    publication_type:text(input.publication_type,240),
    authors:array(input.authors?.data??input.authors).map(a=>typeof a==='string'?a:text(a?.display_name??a?.name,500)).filter(Boolean).slice(0,100),
    citation_count:finiteInt(input.citation_count??input.metrics?.citations?.total,null),
    open_access:Boolean(input.open_access??input.is_oa),
    source_urls:array(input.source_urls??input.urls).map(x=>text(x,3000)).filter(Boolean).slice(0,30),
    metadata:input.metadata&&typeof input.metadata==='object'?input.metadata:{}
  };
}

export async function handleMagnanimousResearch(request,env){
  const url=new URL(request.url),path=url.pathname;
  if(!path.startsWith('/api/research'))return null;
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{'access-control-allow-origin':'*','access-control-allow-headers':'authorization,content-type','access-control-allow-methods':'GET,POST,PUT,OPTIONS'}});
  const user=await currentUser(request,env);
  if(!user)return json({detail:'Sign in to Magnanimous AI Research.'},401);
  await ensureSchema(env);
  const tenant=String(user.tenant_id||'');

  if(path==='/api/research/capabilities'&&request.method==='GET'){
    return json({...researchCapabilitySummary(),provider_execution:'external adapters only',direct_scispace_runtime:false});
  }

  if(path==='/api/research/queries'&&request.method==='POST'){
    const body=await request.json().catch(()=>({}));
    const question=text(body.question,8000);
    if(!question)return json({detail:'question is required'},400);
    const id=uid('rq'),stamp=now();
    await env.DB.prepare('INSERT INTO magnanimous_research_queries(id,tenant_id,question,source_kind,status,result_count,created_by,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)')
      .bind(id,tenant,question,text(body.source_kind||'magnanimous',80),'recorded',0,String(user.id||user.user_id||''),stamp,stamp).run();
    return json({id,question,status:'recorded',provider_identity_exposed:false},201);
  }

  if(path==='/api/research/import'&&request.method==='POST'){
    if(!ownerOnly(user))return json({detail:'Owner access required for research-source import.'},403);
    const body=await request.json().catch(()=>({}));
    const queryId=text(body.query_id,240),papers=array(body.papers).slice(0,200);
    const stored=[];let rank=0;
    for(const raw of papers){
      let paper;try{paper=normalizedPaper(raw)}catch{continue}
      const id=uid('paper'),stamp=now();
      const sourceKind=paper.source_kind||text(body.source_kind||'normalized',80);
      const externalId=paper.external_id||id;
      const existing=await env.DB.prepare('SELECT id FROM magnanimous_research_papers WHERE tenant_id=? AND source_kind=? AND external_id=?').bind(tenant,sourceKind,externalId).first();
      const paperId=existing?.id||id;
      if(existing?.id){
        await env.DB.prepare('UPDATE magnanimous_research_papers SET title=?,abstract=?,doi=?,publication_year=?,journal=?,publication_type=?,authors_json=?,citation_count=?,open_access=?,source_urls_json=?,metadata_json=?,updated_at=? WHERE id=? AND tenant_id=?')
          .bind(paper.title,paper.abstract,paper.doi,paper.publication_year,paper.journal,paper.publication_type,JSON.stringify(paper.authors),paper.citation_count,paper.open_access?1:0,JSON.stringify(paper.source_urls),JSON.stringify(paper.metadata),stamp,paperId,tenant).run();
      }else{
        await env.DB.prepare('INSERT INTO magnanimous_research_papers(id,tenant_id,source_kind,external_id,title,abstract,doi,publication_year,journal,publication_type,authors_json,citation_count,open_access,source_urls_json,metadata_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
          .bind(paperId,tenant,sourceKind,externalId,paper.title,paper.abstract,paper.doi,paper.publication_year,paper.journal,paper.publication_type,JSON.stringify(paper.authors),paper.citation_count,paper.open_access?1:0,JSON.stringify(paper.source_urls),JSON.stringify(paper.metadata),stamp,stamp).run();
      }
      rank+=1;stored.push(paperId);
      if(queryId){
        await env.DB.prepare('INSERT OR REPLACE INTO magnanimous_research_query_results(query_id,paper_id,rank_order,relevance_note,created_at) VALUES(?,?,?,?,?)').bind(queryId,paperId,rank,text(raw.relevance_note,5000),stamp).run();
      }
    }
    if(queryId){await env.DB.prepare('UPDATE magnanimous_research_queries SET result_count=?,status=?,updated_at=? WHERE id=? AND tenant_id=?').bind(stored.length,'imported',now(),queryId,tenant).run()}
    return json({stored:stored.length,paper_ids:stored,normalized_only:true,provider_corpus_copied:false},201);
  }

  if(path==='/api/research/enrichments'&&request.method==='POST'){
    if(!ownerOnly(user))return json({detail:'Owner access required for research enrichment import.'},403);
    const body=await request.json().catch(()=>({}));
    const paperId=text(body.paper_id,240),columnKey=text(body.column_key,160),valueText=text(body.value,50000);
    if(!paperId||!columnKey)return json({detail:'paper_id and column_key are required'},400);
    const exists=await env.DB.prepare('SELECT id FROM magnanimous_research_papers WHERE id=? AND tenant_id=?').bind(paperId,tenant).first();
    if(!exists)return json({detail:'Paper not found.'},404);
    const sourceKind=text(body.source_kind||'normalized',80),stamp=now(),id=uid('enrich');
    await env.DB.prepare(`INSERT INTO magnanimous_research_enrichments(id,tenant_id,paper_id,column_key,value_text,source_kind,evidence_ref,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)
      ON CONFLICT(tenant_id,paper_id,column_key,source_kind) DO UPDATE SET value_text=excluded.value_text,evidence_ref=excluded.evidence_ref,updated_at=excluded.updated_at`)
      .bind(id,tenant,paperId,columnKey,valueText,sourceKind,text(body.evidence_ref,2000),stamp,stamp).run();
    return json({paper_id:paperId,column_key:columnKey,stored:true,provider_identity_exposed:false});
  }

  if(path==='/api/research/papers'&&request.method==='GET'){
    const q=text(url.searchParams.get('q'),500).toLowerCase(),limit=Math.max(1,Math.min(100,finiteInt(url.searchParams.get('limit'),50)||50));
    let statement='SELECT id,source_kind,external_id,title,abstract,doi,publication_year,journal,publication_type,authors_json,citation_count,open_access,source_urls_json,created_at,updated_at FROM magnanimous_research_papers WHERE tenant_id=?';
    const binds=[tenant];
    if(q){statement+=' AND (lower(title) LIKE ? OR lower(abstract) LIKE ? OR lower(doi) LIKE ? OR lower(journal) LIKE ?)';const like=`%${q}%`;binds.push(like,like,like,like)}
    statement+=' ORDER BY publication_year DESC, updated_at DESC LIMIT ?';binds.push(limit);
    const {results=[]}=await env.DB.prepare(statement).bind(...binds).all();
    return json({identity:'Magnanimous AI Research',papers:results.map(row=>({...row,authors:JSON.parse(row.authors_json||'[]'),source_urls:JSON.parse(row.source_urls_json||'[]'),authors_json:undefined,source_urls_json:undefined})),provider_identity_exposed:false});
  }

  return json({detail:'Research route not found.'},404);
}
