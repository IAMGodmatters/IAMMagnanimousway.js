import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

const target=path.resolve(process.argv[2]||'/tmp/d1-production-logical.sqlite');
const summaryPath=path.resolve(process.argv[3]||'/tmp/d1-production-logical-summary.json');
const databaseId=String(process.env.MAGNANIMOUS_SOURCE_D1_ID||'7c9f798b-04d2-443c-a9e9-933c51899771').trim();
const pageSize=Math.max(100,Math.min(2000,Number(process.env.MAGNANIMOUS_D1_PAGE_SIZE||1000)));
const apiToken=String(process.env.CLOUDFLARE_API_TOKEN||'').trim();
const accountId=String(process.env.CLOUDFLARE_ACCOUNT_ID||'').trim();

if(!apiToken)throw new Error('CLOUDFLARE_API_TOKEN is required for the read-only D1 logical snapshot.');
if(!accountId)throw new Error('CLOUDFLARE_ACCOUNT_ID is required for the read-only D1 logical snapshot.');
if(!databaseId)throw new Error('MAGNANIMOUS_SOURCE_D1_ID is required for the read-only D1 logical snapshot.');

const queryUrl='https://api.cloudflare.com/client/v4/accounts/'+encodeURIComponent(accountId)+'/d1/database/'+encodeURIComponent(databaseId)+'/query';

function qname(name){return '"'+String(name).replaceAll('"','""')+'"'}
function qstr(value){return "'"+String(value).replaceAll("'","''")+"'"}

async function d1Request(body){
  const response=await fetch(queryUrl,{
    method:'POST',
    headers:{
      authorization:'Bearer '+apiToken,
      'content-type':'application/json'
    },
    body:JSON.stringify(body),
    signal:AbortSignal.timeout(60000)
  });
  const text=await response.text();
  let payload;
  try{payload=JSON.parse(text)}catch(error){
    throw new Error('D1 query API returned non-JSON: '+String(error?.message||error));
  }
  if(!response.ok||payload?.success===false){
    throw new Error('D1 query API failed with HTTP '+response.status+': '+JSON.stringify(payload?.errors||payload?.messages||[]).slice(0,3000));
  }
  const result=Array.isArray(payload?.result)?payload.result:[];
  for(const item of result){
    if(item?.success===false)throw new Error('D1 SQL statement failed: '+JSON.stringify(item).slice(0,3000));
  }
  return result;
}

async function remoteQuery(sql){
  const result=await d1Request({sql});
  return result.flatMap(item=>Array.isArray(item?.results)?item.results:[]);
}

async function remoteStatements(sqls){
  const result=await d1Request({batch:sqls.map(sql=>({sql}))});
  return result.map(item=>Array.isArray(item?.results)?item.results:[]);
}

async function one(sql){
  const rows=await remoteQuery(sql);
  return rows[0]||null;
}

function logicalSummary(db){
  const listed=db.prepare('PRAGMA table_list').all()
    .filter(row=>String(row.schema||'')==='main')
    .filter(row=>['table','virtual'].includes(String(row.type||'')))
    .filter(row=>!String(row.name||'').startsWith('sqlite_'))
    .filter(row=>!String(row.name||'').startsWith('_cf_'))
    .sort((a,b)=>String(a.name).localeCompare(String(b.name)));
  const table_counts={};
  const schema=[];
  for(const row of listed){
    const name=String(row.name);
    table_counts[name]=Number(db.prepare('SELECT COUNT(*) AS n FROM '+qname(name)).get()?.n||0);
    const master=db.prepare("SELECT sql FROM sqlite_master WHERE name=? AND type='table'").get(name);
    schema.push([name,String(master?.sql||'')]);
  }
  const integrity=String(db.prepare('PRAGMA integrity_check').get()?.integrity_check||'');
  const foreignKeyViolations=db.prepare('PRAGMA foreign_key_check').all().length;
  return{
    integrity,
    foreign_key_violations:foreignKeyViolations,
    table_count:listed.length,
    table_counts,
    schema_sha256:crypto.createHash('sha256').update(JSON.stringify(schema)).digest('hex')
  };
}

function insertRows(db,table,columns,rows){
  if(!rows.length)return;
  const statements=[];
  for(const row of rows){
    const values=columns.map(name=>{
      const value=row[name];
      if(value===null||value===undefined)return 'NULL';
      const text=String(value);
      if(!/^(NULL|[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?|X'[0-9A-Fa-f]*'|'.*')$/s.test(text)){
        throw new Error('Unexpected quoted D1 literal in '+table+'.'+name);
      }
      return text;
    });
    statements.push(
      'INSERT INTO '+qname(table)+' ('+columns.map(qname).join(',')+') VALUES ('+values.join(',')+');'
    );
  }
  db.exec('BEGIN;'+statements.join('')+'COMMIT;');
}

await fs.promises.mkdir(path.dirname(target),{recursive:true});
for(const suffix of ['','-wal','-shm'])await fs.promises.rm(target+suffix,{force:true});

const tableList=(await remoteQuery('PRAGMA table_list;'))
  .filter(row=>String(row.schema||'')==='main');

const ordinary=tableList
  .filter(row=>String(row.type||'')==='table')
  .map(row=>({name:String(row.name||''),withoutRowid:Number(row.wr||0)===1}))
  .filter(row=>row.name&&!row.name.startsWith('sqlite_')&&!row.name.startsWith('_cf_'))
  .sort((a,b)=>a.name.localeCompare(b.name));

const ordinaryNames=ordinary.map(row=>row.name);
const virtual=tableList
  .filter(row=>String(row.type||'')==='virtual')
  .map(row=>String(row.name||''))
  .filter(name=>name&&!name.startsWith('sqlite_')&&!name.startsWith('_cf_'))
  .sort();

const unsupportedVirtual=virtual.filter(name=>name!=='knowledge_fts');
if(unsupportedVirtual.length){
  throw new Error('Unsupported production virtual tables require an explicit rebuild strategy: '+unsupportedVirtual.join(', '));
}

const db=new DatabaseSync(target);
try{
  db.exec('PRAGMA foreign_keys=OFF; PRAGMA journal_mode=DELETE; PRAGMA synchronous=FULL;');

  for(const tableInfo of ordinary){
    const table=tableInfo.name;
    const metadata=await remoteStatements([
      "SELECT sql FROM sqlite_master WHERE type='table' AND name="+qstr(table),
      'PRAGMA table_xinfo('+qstr(table)+')',
      tableInfo.withoutRowid
        ? 'SELECT COUNT(*) AS n FROM '+qname(table)
        : 'SELECT COUNT(*) AS n, COALESCE(MAX(rowid),0) AS max_rowid FROM '+qname(table)
    ]);

    const schema=String(metadata[0]?.[0]?.sql||'').trim();
    if(!schema)throw new Error('Missing production schema for table '+table);
    db.exec(schema+';');

    const columnRows=metadata[1]||[];
    const columns=columnRows
      .filter(row=>Number(row.hidden||0)===0)
      .map(row=>String(row.name||''))
      .filter(Boolean);
    if(!columns.length)continue;

    const primaryKeyColumns=columnRows
      .filter(row=>Number(row.hidden||0)===0&&Number(row.pk||0)>0)
      .sort((a,b)=>Number(a.pk)-Number(b.pk))
      .map(row=>String(row.name||''))
      .filter(Boolean);

    if(tableInfo.withoutRowid&&!primaryKeyColumns.length){
      throw new Error('WITHOUT ROWID table has no discoverable primary key: '+table);
    }

    const boundaryRow=metadata[2]?.[0]||{};
    const sourceCount=Number(boundaryRow.n||0);
    const maxRowid=tableInfo.withoutRowid?null:Number(boundaryRow.max_rowid||0);
    const boundaryWhere=tableInfo.withoutRowid?'':' WHERE rowid <= '+maxRowid;
    const orderBy=tableInfo.withoutRowid
      ? ' ORDER BY '+primaryKeyColumns.map(qname).join(',')
      : ' ORDER BY rowid';

    let copied=0;
    const selectQuoted=columns.map(name=>'quote('+qname(name)+') AS '+qname(name)).join(',');
    while(copied<sourceCount){
      const rows=await remoteQuery(
        'SELECT '+selectQuoted+' FROM '+qname(table)+boundaryWhere+orderBy+
        ' LIMIT '+pageSize+' OFFSET '+copied+';'
      );
      if(!rows.length)break;
      insertRows(db,table,columns,rows);
      copied+=rows.length;
      if(rows.length<pageSize)break;
    }

    const localCount=Number(db.prepare('SELECT COUNT(*) AS n FROM '+qname(table)).get()?.n||0);
    const endCount=Number((await one('SELECT COUNT(*) AS n FROM '+qname(table)+boundaryWhere+';'))?.n||0);
    if(localCount!==sourceCount||endCount!==sourceCount){
      throw new Error(
        'Production table changed inside the captured boundary or copy was incomplete for '+table+
        ': start='+sourceCount+' end='+endCount+' local='+localCount
      );
    }

    console.log(
      'Copied production table '+table+' ('+localCount+' rows'+
      (maxRowid===null?'':', rowid <= '+maxRowid)+').'
    );
  }

  const objects=await remoteQuery(
    "SELECT type,name,tbl_name,sql FROM sqlite_master WHERE type IN ('index','trigger','view') AND sql IS NOT NULL ORDER BY CASE type WHEN 'index' THEN 1 WHEN 'trigger' THEN 2 ELSE 3 END,name;"
  );
  for(const object of objects){
    const sql=String(object.sql||'').trim();
    const table=String(object.tbl_name||'');
    if(!sql)continue;
    if(virtual.includes(table))continue;
    db.exec(sql+';');
  }

  if(virtual.includes('knowledge_fts')){
    const ftsSchema=String((await one("SELECT sql FROM sqlite_master WHERE type='table' AND name='knowledge_fts';"))?.sql||'').trim();
    if(!ftsSchema)throw new Error('Production knowledge_fts schema is missing.');
    db.exec(ftsSchema+';');
    if(ordinaryNames.includes('knowledge_chunks')){
      db.exec(
        'INSERT INTO knowledge_fts(title,content,url,tenant_id,source_id,chunk_id,source_type) '+
        'SELECT title,content,url,tenant_id,CAST(source_id AS TEXT),CAST(id AS TEXT),source_type FROM knowledge_chunks;'
      );
      const chunks=Number(db.prepare('SELECT COUNT(*) AS n FROM knowledge_chunks').get()?.n||0);
      const fts=Number(db.prepare('SELECT COUNT(*) AS n FROM knowledge_fts').get()?.n||0);
      if(chunks!==fts)throw new Error('knowledge_fts rebuild count mismatch: chunks='+chunks+' fts='+fts);
    }
  }

  db.exec('PRAGMA foreign_keys=ON;');
  const summary=logicalSummary(db);
  if(summary.integrity.toLowerCase()!=='ok')throw new Error('Logical D1 snapshot failed SQLite integrity_check.');
  if(summary.foreign_key_violations!==0)throw new Error('Logical D1 snapshot has foreign-key violations.');

  db.exec('VACUUM;');
  db.close();

  const bytes=fs.readFileSync(target);
  const finalSummary={
    ...summary,
    sqlite_sha256:crypto.createHash('sha256').update(bytes).digest('hex'),
    sqlite_bytes:bytes.length,
    ordinary_tables:ordinary.length,
    virtual_tables:virtual,
    consistency:'per-table-rowid-boundary-with-post-copy-count-verification'
  };
  fs.writeFileSync(summaryPath,JSON.stringify(finalSummary,null,2),{mode:0o600});
  console.log('Magnanimous logical D1 snapshot PASS across '+finalSummary.table_count+' logical tables ('+bytes.length+' bytes).');
}catch(error){
  try{db.close()}catch{}
  for(const suffix of ['','-wal','-shm'])await fs.promises.rm(target+suffix,{force:true});
  throw error;
}
