import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { reconcileForeignKeys } from '../src/d1-snapshot-reconcile.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const repoRoot=path.resolve(here,'../..');
const workerDir=path.join(repoRoot,'worker');
const target=path.resolve(process.argv[2]||'/tmp/d1-production-logical.sqlite');
const summaryPath=path.resolve(process.argv[3]||'/tmp/d1-production-logical-summary.json');
const database=String(process.env.MAGNANIMOUS_SOURCE_D1||'iam-magnanimous-db');
const pageSize=Math.max(50,Math.min(1000,Number(process.env.MAGNANIMOUS_D1_PAGE_SIZE||500)));

function qname(name){return '"'+String(name).replaceAll('"','""')+'"'}
function qstr(value){return "'"+String(value).replaceAll("'","''")+"'"}

function collectResultRows(payload){
  const rows=[];
  function walk(value){
    if(Array.isArray(value)){
      for(const item of value) walk(item);
      return;
    }
    if(!value||typeof value!=='object') return;
    if(Array.isArray(value.results)){
      for(const row of value.results) if(row&&typeof row==='object'&&!Array.isArray(row)) rows.push(row);
    }
    for(const [key,child] of Object.entries(value)) if(key!=='results') walk(child);
  }
  walk(payload);
  return rows;
}

function remoteQuery(sql){
  const result=spawnSync(
    'npx',
    ['wrangler','d1','execute',database,'--remote','--json','--command',sql],
    {
      cwd:workerDir,
      env:process.env,
      encoding:'utf8',
      maxBuffer:256*1024*1024,
      stdio:['ignore','pipe','pipe']
    }
  );
  if(result.error) throw result.error;
  if(result.status!==0){
    const detail=String(result.stderr||result.stdout||'').replaceAll(String(process.env.CLOUDFLARE_API_TOKEN||''),'[redacted]');
    throw new Error('D1 read query failed: '+detail.slice(-4000));
  }
  let payload;
  try{payload=JSON.parse(result.stdout)}catch(error){
    throw new Error('Wrangler D1 JSON response could not be parsed: '+String(error?.message||error));
  }
  return collectResultRows(payload);
}

function one(sql){
  const rows=remoteQuery(sql);
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
  const fk=db.prepare('PRAGMA foreign_key_check').all();
  return{
    integrity,
    foreign_key_violations:fk.length,
    table_count:listed.length,
    table_counts,
    schema_sha256:crypto.createHash('sha256').update(JSON.stringify(schema)).digest('hex')
  };
}

await fs.promises.mkdir(path.dirname(target),{recursive:true});
await fs.promises.rm(target,{force:true});
await fs.promises.rm(target+'-wal',{force:true});
await fs.promises.rm(target+'-shm',{force:true});

const tableList=remoteQuery('PRAGMA table_list;')
  .filter(row=>String(row.schema||'')==='main');

const ordinaryRows=tableList
  .filter(row=>String(row.type||'')==='table')
  .filter(row=>String(row.name||'')&&!String(row.name||'').startsWith('sqlite_')&&!String(row.name||'').startsWith('_cf_'))
  .sort((a,b)=>String(a.name).localeCompare(String(b.name)));
const ordinary=ordinaryRows.map(row=>String(row.name));

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

  for(const table of ordinary){
    const schemaRow=one("SELECT sql FROM sqlite_master WHERE type='table' AND name="+qstr(table)+";");
    const schema=String(schemaRow?.sql||'').trim();
    if(!schema) throw new Error('Missing production schema for table '+table);
    db.exec(schema+';');

    const columnRows=remoteQuery('PRAGMA table_xinfo('+qstr(table)+');')
      .filter(row=>Number(row.hidden||0)===0);
    const columns=columnRows.map(row=>String(row.name||'')).filter(Boolean);
    if(!columns.length) continue;

    const tableMeta=ordinaryRows.find(row=>String(row.name)===table)||{};
    const withoutRowid=Number(tableMeta.wr||0)===1;
    const pkColumns=columnRows
      .filter(row=>Number(row.pk||0)>0)
      .sort((a,b)=>Number(a.pk)-Number(b.pk))
      .map(row=>String(row.name||''))
      .filter(Boolean);
    const orderBy=withoutRowid
      ? (pkColumns.length?pkColumns.map(qname).join(','):'')
      : 'rowid';
    if(withoutRowid&&!orderBy){
      throw new Error('WITHOUT ROWID table has no primary-key ordering: '+table);
    }
    const singlePkBoundary=withoutRowid&&pkColumns.length===1?pkColumns[0]:'';

    const selectQuoted=columns.map(name=>'quote('+qname(name)+') AS '+qname(name)).join(',');
    let copiedSuccessfully=false;
    for(let attempt=1;attempt<=4&&!copiedSuccessfully;attempt++){
      db.exec('DELETE FROM '+qname(table)+';');

      let sourceCount=0;
      let boundarySql='';
      if(!withoutRowid){
        const boundary=one('SELECT quote(MAX(rowid)) AS max_rowid, COUNT(*) AS n FROM '+qname(table)+';')||{};
        sourceCount=Number(boundary.n||0);
        boundarySql=String(boundary.max_rowid||'NULL');
        if(sourceCount>0&&!/^-?\d+$/.test(boundarySql)){
          throw new Error('Unexpected rowid boundary for '+table+': '+boundarySql);
        }
      }else if(singlePkBoundary){
        const boundary=one('SELECT quote(MAX('+qname(singlePkBoundary)+')) AS max_pk, COUNT(*) AS n FROM '+qname(table)+';')||{};
        sourceCount=Number(boundary.n||0);
        boundarySql=String(boundary.max_pk||'NULL');
        if(sourceCount>0&&boundarySql==='NULL')throw new Error('Missing primary-key boundary for '+table);
      }else{
        sourceCount=Number(one('SELECT COUNT(*) AS n FROM '+qname(table)+';')?.n||0);
      }

      let copied=0;
      const whereClause=!withoutRowid&&sourceCount>0
        ? ' WHERE rowid <= '+boundarySql
        : singlePkBoundary&&sourceCount>0
          ? ' WHERE '+qname(singlePkBoundary)+' <= '+boundarySql
          : '';
      while(copied<sourceCount){
        const rows=remoteQuery(
          'SELECT '+selectQuoted+' FROM '+qname(table)+whereClause+
          ' ORDER BY '+orderBy+' LIMIT '+pageSize+' OFFSET '+copied+';'
        );
        if(!rows.length) break;
        const statements=[];
        for(const row of rows){
          const values=columns.map(name=>{
            const value=row[name];
            if(value===null||value===undefined) return 'NULL';
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
        copied+=rows.length;
        if(rows.length<pageSize) break;
      }

      const localCount=Number(db.prepare('SELECT COUNT(*) AS n FROM '+qname(table)).get()?.n||0);
      const finalSourceCount=!withoutRowid
        ? Number(one('SELECT COUNT(*) AS n FROM '+qname(table)+' WHERE rowid <= '+(sourceCount?boundarySql:'0')+';')?.n||0)
        : singlePkBoundary
          ? Number(one('SELECT COUNT(*) AS n FROM '+qname(table)+(sourceCount?' WHERE '+qname(singlePkBoundary)+' <= '+boundarySql:' WHERE 0')+';')?.n||0)
          : Number(one('SELECT COUNT(*) AS n FROM '+qname(table)+';')?.n||0);

      if(localCount===sourceCount&&finalSourceCount===sourceCount){
        copiedSuccessfully=true;
        console.log('Copied production table '+table+' ('+localCount+' rows; attempt '+attempt+
          (!withoutRowid?'; rowid boundary '+boundarySql:singlePkBoundary?'; primary-key boundary '+boundarySql:'')+').');
      }else if(attempt<4){
        console.warn('Production table '+table+' changed inside the selected snapshot boundary; retrying (source='+sourceCount+', final='+finalSourceCount+', local='+localCount+').');
      }else{
        throw new Error('Production table could not reach a stable copy boundary for '+table+': source='+sourceCount+' final='+finalSourceCount+' local='+localCount);
      }
    }
  }

  const reconciliation=reconcileForeignKeys(db,remoteQuery);

  if(virtual.includes('knowledge_fts')){
    const ftsSchema=String(one("SELECT sql FROM sqlite_master WHERE type='table' AND name='knowledge_fts';")?.sql||'').trim();
    if(!ftsSchema) throw new Error('Production knowledge_fts schema is missing.');
    db.exec(ftsSchema+';');
    if(ordinary.includes('knowledge_chunks')){
      db.exec(`INSERT INTO knowledge_fts(title,content,url,tenant_id,source_id,chunk_id,source_type)
        SELECT title,content,url,tenant_id,CAST(source_id AS TEXT),CAST(id AS TEXT),source_type
        FROM knowledge_chunks;`);
      const chunks=Number(db.prepare('SELECT COUNT(*) AS n FROM knowledge_chunks').get()?.n||0);
      const fts=Number(db.prepare('SELECT COUNT(*) AS n FROM knowledge_fts').get()?.n||0);
      if(chunks!==fts) throw new Error('knowledge_fts rebuild count mismatch: chunks='+chunks+' fts='+fts);
    }
  }

  const objects=remoteQuery(
    "SELECT type,name,tbl_name,sql FROM sqlite_master WHERE type IN ('index','trigger','view') AND sql IS NOT NULL ORDER BY CASE type WHEN 'index' THEN 1 WHEN 'trigger' THEN 2 ELSE 3 END,name;"
  );
  for(const object of objects){
    const sql=String(object.sql||'').trim();
    const table=String(object.tbl_name||'');
    if(!sql) continue;
    if(virtual.includes(table)) continue;
    db.exec(sql+';');
  }

  db.exec('PRAGMA foreign_keys=ON;');
  const summary=logicalSummary(db);
  if(summary.integrity.toLowerCase()!=='ok') throw new Error('Logical D1 snapshot failed SQLite integrity_check.');
  if(summary.foreign_key_violations!==0) throw new Error('Logical D1 snapshot has foreign-key violations after reconciliation.');

  db.exec('VACUUM;');
  db.close();

  const bytes=fs.readFileSync(target);
  const finalSummary={
    ...summary,
    sqlite_sha256:crypto.createHash('sha256').update(bytes).digest('hex'),
    sqlite_bytes:bytes.length,
    ordinary_tables:ordinary.length,
    virtual_tables:virtual,
    foreign_key_reconciliation:reconciliation
  };
  fs.writeFileSync(summaryPath,JSON.stringify(finalSummary,null,2),{mode:0o600});
  console.log('Magnanimous logical D1 snapshot PASS across '+finalSummary.table_count+' logical tables ('+bytes.length+' bytes).');
}catch(error){
  try{db.close()}catch{}
  await fs.promises.rm(target,{force:true});
  await fs.promises.rm(target+'-wal',{force:true});
  await fs.promises.rm(target+'-shm',{force:true});
  throw error;
}
