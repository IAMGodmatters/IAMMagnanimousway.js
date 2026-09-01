import { currentUser } from './integrations.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const now=()=>Math.floor(Date.now()/1000);
const MAX_SOURCE_CHARS=240000;
const MAX_CHUNK_CHARS=2600;
const MAX_CHUNKS=80;

async function ensureTables(env){
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS knowledge_sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id TEXT NOT NULL,
    fingerprint TEXT NOT NULL,
    source_type TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT '',
    url TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'ready',
    metadata_json TEXT NOT NULL DEFAULT '{}',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    UNIQUE(tenant_id,fingerprint)
  )`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS knowledge_chunks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id TEXT NOT NULL,
    source_id INTEGER NOT NULL,
    source_type TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT '',
    url TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_tenant_source ON knowledge_chunks(tenant_id,source_id)`).run();
  await env.DB.prepare(`CREATE VIRTUAL TABLE IF NOT EXISTS knowledge_fts USING fts5(
    title, content, url UNINDEXED, tenant_id UNINDEXED, source_id UNINDEXED, chunk_id UNINDEXED, source_type UNINDEXED
  )`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS knowledge_activity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    detail_json TEXT NOT NULL DEFAULT '{}',
    created_at INTEGER NOT NULL
  )`).run();
}

function decodeEntities(s){return String(s||'').replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&lt;/gi,'<').replace(/&gt;/gi,'>');}
function htmlToText(html){
  return decodeEntities(String(html||'')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ')
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi,' ')
    .replace(/<!--([\s\S]*?)-->/g,' ')
    .replace(/<br\s*\/?>/gi,'\n').replace(/<\/p>|<\/div>|<\/li>|<\/h[1-6]>/gi,'\n')
    .replace(/<[^>]+>/g,' ')).replace(/[ \t]+/g,' ').replace(/\n\s*\n+/g,'\n').trim();
}
function textTitle(html,fallback='Source'){
  const m=String(html||'').match(/<title[^>]*>([\s\S]*?)<\/title>/i);return decodeEntities(m?.[1]||fallback).replace(/\s+/g,' ').trim().slice(0,240)||fallback;
}
function chunks(text){
  const clean=String(text||'').replace(/\r/g,'').trim().slice(0,MAX_SOURCE_CHARS);if(!clean)return[];
  const paras=clean.split(/\n+/).map(x=>x.trim()).filter(Boolean);const out=[];let buf='';
  for(const p of paras){
    if((buf+' '+p).length>MAX_CHUNK_CHARS){if(buf)out.push(buf.trim());buf='';}
    if(p.length>MAX_CHUNK_CHARS){for(let i=0;i<p.length&&out.length<MAX_CHUNKS;i+=MAX_CHUNK_CHARS)out.push(p.slice(i,i+MAX_CHUNK_CHARS));}
    else buf+=(buf?'\n':'')+p;
    if(out.length>=MAX_CHUNKS)break;
  }
  if(buf&&out.length<MAX_CHUNKS)out.push(buf.trim());return out.filter(Boolean);
}
function safeHttpUrl(value){
  try{
    const u=new URL(String(value||''));if(!['http:','https:'].includes(u.protocol))return null;
    const h=u.hostname.toLowerCase();
    if(h==='localhost'||h.endsWith('.local')||h==='0.0.0.0'||h==='127.0.0.1'||h==='::1'||/^10\./.test(h)||/^192\.168\./.test(h)||/^169\.254\./.test(h)||/^172\.(1[6-9]|2\d|3[01])\./.test(h))return null;
    return u;
  }catch{return null}
}
function rssEntries(xml){
  const blocks=[...String(xml||'').matchAll(/<(item|entry)\b[^>]*>([\s\S]*?)<\/\1>/gi)].slice(0,50);return blocks.map(([,kind,b])=>{
    const pick=(tag)=>{const m=b.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`,'i'));return m?htmlToText(m[1]):''};
    let link=pick('link');if(!link){const m=b.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*>/i);link=m?.[1]||'';}
    return{title:pick('title')||'Feed item',url:link,content:[pick('description'),pick('summary'),pick('content')].filter(Boolean).join('\n').trim()};
  }).filter(x=>x.content||x.title);
}
async function upsertSource(env,tenantId,{fingerprint,sourceType,title,url='',metadata={}}){
  const ts=now();await env.DB.prepare(`INSERT INTO knowledge_sources(tenant_id,fingerprint,source_type,title,url,status,metadata_json,created_at,updated_at)
    VALUES(?,?,?,?,?,'ready',?,?,?) ON CONFLICT(tenant_id,fingerprint) DO UPDATE SET source_type=excluded.source_type,title=excluded.title,url=excluded.url,status='ready',metadata_json=excluded.metadata_json,updated_at=excluded.updated_at`)
    .bind(tenantId,fingerprint,sourceType,title||'Source',url||'',JSON.stringify(metadata||{}),ts,ts).run();
  return env.DB.prepare('SELECT id FROM knowledge_sources WHERE tenant_id=? AND fingerprint=?').bind(tenantId,fingerprint).first();
}
async function replaceSourceChunks(env,tenantId,sourceId,sourceType,title,url,parts){
  await env.DB.prepare('DELETE FROM knowledge_fts WHERE tenant_id=? AND source_id=?').bind(tenantId,String(sourceId)).run();
  await env.DB.prepare('DELETE FROM knowledge_chunks WHERE tenant_id=? AND source_id=?').bind(tenantId,sourceId).run();
  let count=0;for(const content of parts.slice(0,MAX_CHUNKS)){
    const r=await env.DB.prepare('INSERT INTO knowledge_chunks(tenant_id,source_id,source_type,title,url,content,created_at) VALUES(?,?,?,?,?,?,?)')
      .bind(tenantId,sourceId,sourceType,title||'',url||'',content,now()).run();
    const chunkId=r?.meta?.last_row_id||0;
    await env.DB.prepare('INSERT INTO knowledge_fts(title,content,url,tenant_id,source_id,chunk_id,source_type) VALUES(?,?,?,?,?,?,?)')
      .bind(title||'',content,url||'',tenantId,String(sourceId),String(chunkId),sourceType).run();count++;
  }return count;
}
async function activity(env,user,action,detail={}){try{await env.DB.prepare('INSERT INTO knowledge_activity(tenant_id,user_id,action,detail_json,created_at) VALUES(?,?,?,?,?)').bind(String(user.tenant_id),String(user.id),action,JSON.stringify(detail),now()).run()}catch{}}
function ftsQuery(q){const terms=(String(q||'').toLowerCase().match(/[\p{L}\p{N}]{2,}/gu)||[]).slice(0,12);return terms.map(x=>`"${x.replace(/"/g,'')}"*`).join(' OR ')}
async function localSearch(env,tenantId,q,limit=8){
  const match=ftsQuery(q);if(!match)return[];
  try{
    const {results}=await env.DB.prepare(`SELECT title,url,content,source_type,source_id,bm25(knowledge_fts) AS score FROM knowledge_fts WHERE knowledge_fts MATCH ? AND tenant_id=? ORDER BY score LIMIT ?`).bind(match,tenantId,limit).all();return results||[];
  }catch{
    const term=`%${String(q||'').slice(0,120)}%`;const {results}=await env.DB.prepare('SELECT title,url,content,source_type,source_id,0 AS score FROM knowledge_chunks WHERE tenant_id=? AND (title LIKE ? OR content LIKE ?) ORDER BY id DESC LIMIT ?').bind(tenantId,term,term,limit).all();return results||[];
  }
}
async function braveSearch(env,q,type='web',count=6,freshness=''){
  const key=String(env.BRAVE_SEARCH_API_KEY||'').trim();if(!key)return{configured:false,results:[]};
  const endpoint=type==='news'?'news':'web';const u=new URL(`https://api.search.brave.com/res/v1/${endpoint}/search`);u.searchParams.set('q',String(q).slice(0,400));u.searchParams.set('count',String(Math.max(1,Math.min(count,10))));u.searchParams.set('search_lang','en');if(freshness)u.searchParams.set('freshness',freshness);
  const r=await fetch(u,{headers:{Accept:'application/json','X-Subscription-Token':key}});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d?.message||d?.error?.message||`Web search failed (${r.status})`);
  const raw=type==='news'?(d.results||[]):(d.web?.results||[]);return{configured:true,results:raw.slice(0,count).map(x=>({title:String(x.title||'Result'),url:String(x.url||''),description:String(x.description||x.snippet||''),age:x.age||'',source:type}))};
}
async function rememberResults(env,user,results,sourceType){
  let saved=0;for(const r of results){if(!r.url||!r.description)continue;const row=await upsertSource(env,String(user.tenant_id),{fingerprint:`${sourceType}:${r.url}`,sourceType,title:r.title,url:r.url,metadata:{discovered_at:now()}});if(row?.id){await replaceSourceChunks(env,String(user.tenant_id),row.id,sourceType,r.title,r.url,[r.description]);saved++;}}return saved;
}

export async function getKnowledgeContext(request,env,query,opts={}){
  if(!env?.DB)return{context:'',sources:[],user:null,search_configured:false};await ensureTables(env);const user=await currentUser(request,env);if(!user)return{context:'',sources:[],user:null,search_configured:Boolean(env.BRAVE_SEARCH_API_KEY)};
  const tenant=String(user.tenant_id),local=await localSearch(env,tenant,query,Number(opts.localLimit||6));let web=[],news=[],configured=Boolean(env.BRAVE_SEARCH_API_KEY);
  if(opts.liveSearch){const r=await braveSearch(env,query,'web',Number(opts.webLimit||5),opts.freshness||'');web=r.results;configured=r.configured;}
  if(opts.news){const r=await braveSearch(env,query,'news',Number(opts.newsLimit||5),opts.freshness||'pw');news=r.results;configured=configured||r.configured;}
  if(opts.remember){if(web.length)await rememberResults(env,user,web,'web-search');if(news.length)await rememberResults(env,user,news,'news-search');}
  const sources=[...local.map(x=>({title:x.title,url:x.url,description:x.content,source:x.source_type||'workspace'})),...web,...news].slice(0,16);
  const context=sources.length?`\n\nGROUNDING SOURCES (use these as context; do not claim unsupported facts):\n${sources.map((s,i)=>`[${i+1}] ${s.title}${s.url?` — ${s.url}`:''}\n${String(s.description||'').slice(0,1400)}`).join('\n\n')}\n\nWhen these sources support the answer, cite them as [1], [2], etc. Distinguish stored workspace knowledge from fresh web/news information.`:'';
  return{context,sources,user,search_configured:configured};
}

export async function handleKnowledge(request,env){
  const url=new URL(request.url);if(!url.pathname.startsWith('/api/knowledge'))return null;if(!env?.DB)return json({error:'Knowledge database is not configured.'},503);
  try{
    await ensureTables(env);const user=await currentUser(request,env);if(!user)return json({error:'Sign in to use your private knowledge workspace.'},401);const tenant=String(user.tenant_id);
    if(request.method==='GET'&&url.pathname==='/api/knowledge/status'){
      const counts=await env.DB.prepare('SELECT COUNT(*) AS sources,(SELECT COUNT(*) FROM knowledge_chunks WHERE tenant_id=?) AS chunks FROM knowledge_sources WHERE tenant_id=?').bind(tenant,tenant).first();return json({ok:true,sources:Number(counts?.sources||0),chunks:Number(counts?.chunks||0),web_search_configured:Boolean(env.BRAVE_SEARCH_API_KEY),engines:{memory:'D1 FTS5',semantic:env.VECTORIZE?'Cloudflare Vectorize':'ready for Vectorize binding',ai:env.AI?'Workers AI':'provider fallback'}});
    }
    if(request.method==='GET'&&url.pathname==='/api/knowledge/sources'){
      const {results}=await env.DB.prepare('SELECT id,source_type,title,url,status,metadata_json,created_at,updated_at FROM knowledge_sources WHERE tenant_id=? ORDER BY updated_at DESC LIMIT 200').bind(tenant).all();return json({sources:results||[]});
    }
    if(request.method==='GET'&&url.pathname==='/api/knowledge/search')return json({results:await localSearch(env,tenant,url.searchParams.get('q')||'',Math.min(30,Number(url.searchParams.get('limit')||12)))});
    if(request.method==='POST'&&url.pathname==='/api/knowledge/ingest'){
      const b=await request.json().catch(()=>({})),kind=String(b.kind||'url');
      if(kind==='note'){
        const text=String(b.text||'').trim(),title=String(b.title||'Workspace note').trim().slice(0,240);if(!text)return json({error:'Text is required.'},400);const fp=`note:${crypto.randomUUID()}`,row=await upsertSource(env,tenant,{fingerprint:fp,sourceType:'note',title,metadata:{created_by:user.id}});const count=await replaceSourceChunks(env,tenant,row.id,'note',title,'',chunks(text));await activity(env,user,'ingest_note',{source_id:row.id,chunks:count});return json({ok:true,source_id:row.id,chunks:count});
      }
      const target=safeHttpUrl(b.url);if(!target)return json({error:'Enter a public http(s) URL.'},400);const r=await fetch(target.toString(),{redirect:'follow',headers:{'user-agent':'I-AM-Magnanimous-Knowledge/1.0'}});if(!r.ok)return json({error:`Source returned ${r.status}.`},400);const raw=(await r.text()).slice(0,MAX_SOURCE_CHARS*2),isFeed=kind==='rss'||/<rss\b|<feed\b/i.test(raw);
      if(isFeed){const title=String(b.title||textTitle(raw,target.hostname)).slice(0,240),entries=rssEntries(raw);if(!entries.length)return json({error:'No readable feed entries were found.'},400);const row=await upsertSource(env,tenant,{fingerprint:`rss:${target}`,sourceType:'rss',title,url:target.toString(),metadata:{entries:entries.length}});const count=await replaceSourceChunks(env,tenant,row.id,'rss',title,target.toString(),entries.map(x=>`${x.title}${x.url?`\n${x.url}`:''}\n${x.content}`));await activity(env,user,'ingest_rss',{source_id:row.id,chunks:count});return json({ok:true,source_id:row.id,chunks:count,title});}
      const title=String(b.title||textTitle(raw,target.hostname)).slice(0,240),text=htmlToText(raw);if(text.length<40)return json({error:'The page did not contain enough readable text.'},400);const row=await upsertSource(env,tenant,{fingerprint:`url:${target}`,sourceType:'url',title,url:target.toString(),metadata:{content_type:r.headers.get('content-type')||''}});const count=await replaceSourceChunks(env,tenant,row.id,'url',title,target.toString(),chunks(text));await activity(env,user,'ingest_url',{source_id:row.id,chunks:count,url:target.toString()});return json({ok:true,source_id:row.id,chunks:count,title});
    }
    if(request.method==='POST'&&url.pathname==='/api/knowledge/research'){
      const b=await request.json().catch(()=>({})),q=String(b.query||'').trim();if(!q)return json({error:'Research query is required.'},400);const data=await getKnowledgeContext(request,env,q,{liveSearch:b.web!==false,news:Boolean(b.news),remember:Boolean(b.remember),freshness:String(b.freshness||''),localLimit:8,webLimit:6,newsLimit:6});await activity(env,user,'research',{query:q,web:b.web!==false,news:Boolean(b.news),remember:Boolean(b.remember),results:data.sources.length});return json({ok:true,query:q,results:data.sources,web_search_configured:data.search_configured,remembered:Boolean(b.remember)});
    }
    if(request.method==='DELETE'&&/^\/api\/knowledge\/sources\/\d+$/.test(url.pathname)){
      const id=Number(url.pathname.split('/').pop()),row=await env.DB.prepare('SELECT id FROM knowledge_sources WHERE id=? AND tenant_id=?').bind(id,tenant).first();if(!row)return json({error:'Source not found.'},404);await env.DB.prepare('DELETE FROM knowledge_fts WHERE tenant_id=? AND source_id=?').bind(tenant,String(id)).run();await env.DB.prepare('DELETE FROM knowledge_chunks WHERE tenant_id=? AND source_id=?').bind(tenant,id).run();await env.DB.prepare('DELETE FROM knowledge_sources WHERE tenant_id=? AND id=?').bind(tenant,id).run();await activity(env,user,'delete_source',{source_id:id});return json({ok:true});
    }
    return json({error:'Unsupported knowledge operation.'},405);
  }catch(error){console.error('knowledge runtime error',error);return json({error:error?.message||'Knowledge engine error.'},500)}
}
