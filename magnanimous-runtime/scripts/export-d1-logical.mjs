import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const here=path.dirname(fileURLToPath(import.meta.url));
const repoRoot=path.resolve(here,'../..');
const workerDir=path.join(repoRoot,'worker');
const target=path.resolve(process.argv[2]||'/tmp/d1-production-logical.sqlite');
const summaryPath=path.resolve(process.argv[3]||'/tmp/d1-production-logical-summary.json');
const database=String(process.env.MAGNANIMOUS_SOURCE_D1||'iam-magnanimous-db');
const pageSize=Math.max(50,Math.min(1000,Number(process.env.MAGNANIMOUS_D1_PAGE_SIZE||1000)));
const cloudflareAccountId=String(process.env.CLOUDFLARE_ACCOUNT_ID||'').trim();
const cloudflareApiToken=String(process.env.CLOUDFLARE_API_TOKEN||'').trim();
const wranglerConfig=fs.readFileSync(path.join(workerDir,'wrangler.jsonc'),'utf8');
const configuredDatabaseId=(wranglerConfig.match(/"database_id"\s*:\s*"([^"]+)"/)||[])[1]||'';
const databaseId=String(process.env.MAGNANIMOUS_SOURCE_D1_ID||configuredDatabaseId).trim();
const directD1Api=Boolean(cloudflareAccountId&&cloudflareApiToken&&databaseId);

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

function directApiQuery(sql){
  const url='https://api.cloudflare.com/client/v4/accounts/'+encodeURIComponent(cloudflareAccountId)+'/d1/database/'+encodeURIComponent(databaseId)+'/query';
  const nonce=process.pid+'-'+crypto.randomUUID();
  const headerFile=path.join(os.tmpdir(),'magnanimous-d1-'+nonce+'.headers');
  const requestFile=path.join(os.tmpdir(),'magnanimous-d1-'+nonce+'.request.json');
  const responseFile=path.join(os.tmpdir(),'magnanimous-d1-'+nonce+'.response.json');
  fs.writeFileSync(headerFile,'Authorization: Bearer '+cloudflareApiToken+'\n',{mode:0o600});
  fs.writeFileSync(requestFile,JSON.stringify({sql}),{mode:0o600});
  try{
    const result=spawnSync(
      'curl',
      [
        '-sS','--fail-with-body','--connect-timeout','10','--max-time','90',
        '--retry','3','--retry-delay','1','--retry-all-errors',
        '-X','POST',url,
        '-H','Content-Type: application/json',
        '-H','@'+headerFile,
        '--data-binary','@'+requestFile,
        '--output',responseFile
      ],
      {
        cwd:workerDir,
        env:process.env,
        encoding:'utf8',
        maxBuffer:256*1024*1024,
        stdio:['ignore','pipe','pipe']
      }
    );
    const body=fs.existsSync(responseFile)?fs.readFileSync(responseFile,'utf8'):'';
    if(result.error)throw result.error;
    if(result.status!==0){
      const detail=String(result.stderr||body||'').replaceAll(cloudflareApiToken,'[redacted]');
      throw new Error('D1 direct API query failed: '+detail.slice(-4000));
    }
    return body;
  }finally{
    for(const file of [headerFile,requestFile,responseFile]){
      try{fs.rmSync(file,{force:true})}catch{}
    }
  }
}

function wranglerQuery(sql){
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
  if(result.error)throw result.error;
  if(result.status!==0){
    const detail=String(result.stderr||result.stdout||'').replaceAll(cloudflareApiToken,'[redacted]');
    throw new Error('D1 Wrangler fallback query failed: '+detail.slice(-4000));
  }
  return String(result.stdout||'');
}

function remoteQuery(sql){
  let raw;
  if(directD1Api){
    try{
      raw=directApiQuery(sql);
    }catch(error){
      const detail=String(error?.message||error).replaceAll(cloudflareApiToken,'[redacted]');
      console.warn('Magnanimous D1 direct read failed; using Wrangler fallback for this query: '+detail.slice(-1200));
      raw=wranglerQuery(sql);
    }
  }else{
    raw=wranglerQuery(sql);
  }
  let payload;
  try{payload=JSON.parse(raw)}catch(error){
    throw new Error('D1 JSON response could not be parsed: '+String(error?.message||error));
  }
  if(payload?.success===false||Array.isArray(payload?.errors)&&payload.errors.length){
    throw new Error('D1 read query API returned an error.');
  }
  return collectResultRows(payload);
}

function one(sql){
  const rows=remoteQuery(sql);
  return rows[0]||null;
}

function tableColumnRows(db,table){
  return db.prepare('PRAGMA table_xinfo('+qstr(table)+')').all()
    .filter(row=>Number(row.hidden||0)===0);
}
function quotedSelect(columns,prefix=''){
  return columns.map(name=>'quote('+(prefix?prefix+'.':'')+qname(name)+') AS '+qname(name)).join(',');
}
function validQuotedLiteral(value){
  return /^(NULL|[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?|X'[0-9A-Fa-f]*'|'.*')$/s.test(String(value));
}
function ensureQuotedLiteral(value,context){
  const text=String(value);
  if(!validQuotedLiteral(text))throw new Error('Unexpected quoted SQL literal in '+context);
  return text;
}
function localViolationRow(db,violation,fkRows){
  const child=String(violation.table||'');
  const columns=tableColumnRows(db,child).map(row=>String(row.name));
  if(violation.rowid!==null&&violation.rowid!==undefined){
    const row=db.prepare('SELECT '+quotedSelect(columns)+' FROM '+qname(child)+' WHERE rowid=? LIMIT 1').get(violation.rowid);
    if(!row)throw new Error('Foreign-key violation child row disappeared locally: '+child);
    return{child,columns,row,deleteWhere:'rowid='+Number(violation.rowid)};
  }

  const pkRows=tableColumnRows(db,child)
    .filter(row=>Number(row.pk||0)>0)
    .sort((a,b)=>Number(a.pk)-Number(b.pk));
  if(!pkRows.length)throw new Error('WITHOUT ROWID foreign-key violation has no primary key: '+child);
  const parent=String(violation.parent||fkRows[0]?.table||'');
  const parentPk=tableColumnRows(db,parent)
    .filter(row=>Number(row.pk||0)>0)
    .sort((a,b)=>Number(a.pk)-Number(b.pk))
    .map(row=>String(row.name));
  const parentCols=fkRows.map((row,index)=>String(row.to||parentPk[index]||''));
  if(parentCols.some(name=>!name))throw new Error('Could not resolve parent key columns for '+child+' -> '+parent);
  const match=fkRows.map((row,index)=>
    'p.'+qname(parentCols[index])+' IS c.'+qname(String(row.from||''))
  ).join(' AND ');
  const nonNull=fkRows.map(row=>'c.'+qname(String(row.from||''))+' IS NOT NULL').join(' AND ');
  const row=db.prepare(
    'SELECT '+quotedSelect(columns,'c')+' FROM '+qname(child)+' c WHERE '+nonNull+
    ' AND NOT EXISTS (SELECT 1 FROM '+qname(parent)+' p WHERE '+match+') LIMIT 1'
  ).get();
  if(!row)throw new Error('Could not identify WITHOUT ROWID foreign-key violation: '+child);
  const deleteWhere=pkRows.map(pk=>qname(String(pk.name))+' IS '+ensureQuotedLiteral(row[String(pk.name)],child+'.'+String(pk.name))).join(' AND ');
  return{child,columns,row,deleteWhere};
}
function remoteQuotedRow(table,columns,where){
  const rows=remoteQuery('SELECT '+quotedSelect(columns)+' FROM '+qname(table)+' WHERE '+where+' LIMIT 1;');
  return rows[0]||null;
}
function insertQuotedRow(db,table,columns,row){
  const values=columns.map(name=>ensureQuotedLiteral(row[name],table+'.'+name));
  db.exec('INSERT OR IGNORE INTO '+qname(table)+' ('+columns.map(qname).join(',')+') VALUES ('+values.join(',')+');');
}
function rowExistsRemote(table,columns,row){
  const where=columns.map(name=>qname(name)+' IS '+ensureQuotedLiteral(row[name],table+'.'+name)).join(' AND ');
  return remoteQuery('SELECT 1 AS present FROM '+qname(table)+' WHERE '+where+' LIMIT 1;').length>0;
}
function reconcileForeignKeys(db){
  const sourceViolations=remoteQuery('PRAGMA foreign_key_check;');
  if(sourceViolations.length){
    throw new Error('Production D1 already reports foreign-key violations; migration will not hide source integrity problems.');
  }

  let insertedParents=0,removedStaleChildren=0;
  for(let round=1;round<=12;round++){
    const violations=db.prepare('PRAGMA foreign_key_check').all();
    if(!violations.length){
      console.log('Foreign-key reconciliation PASS after '+(round-1)+' repair rounds; added parents='+insertedParents+' removed stale children='+removedStaleChildren+'.');
      return{insertedParents,removedStaleChildren,rounds:round-1};
    }
    let changed=0;
    for(const violation of violations){
      const child=String(violation.table||'');
      const parent=String(violation.parent||'');
      const fkid=Number(violation.fkid);
      const fkRows=db.prepare('PRAGMA foreign_key_list('+qstr(child)+')').all()
        .filter(row=>Number(row.id)===fkid)
        .sort((a,b)=>Number(a.seq)-Number(b.seq));
      if(!fkRows.length)throw new Error('Foreign-key metadata missing for '+child+' constraint '+fkid);
      const descriptor=localViolationRow(db,violation,fkRows);
      const childRow=descriptor.row;

      const parentPk=tableColumnRows(db,parent)
        .filter(row=>Number(row.pk||0)>0)
        .sort((a,b)=>Number(a.pk)-Number(b.pk))
        .map(row=>String(row.name));
      const parentKeyColumns=fkRows.map((row,index)=>String(row.to||parentPk[index]||''));
      if(parentKeyColumns.some(name=>!name))throw new Error('Parent key mapping is incomplete for '+child+' -> '+parent);
      const childKeyColumns=fkRows.map(row=>String(row.from||''));
      const keyLiterals=childKeyColumns.map(name=>ensureQuotedLiteral(childRow[name],child+'.'+name));
      if(keyLiterals.some(value=>value==='NULL'))continue;
      const parentWhere=parentKeyColumns.map((name,index)=>qname(name)+' IS '+keyLiterals[index]).join(' AND ');

      const parentColumns=tableColumnRows(db,parent).map(row=>String(row.name));
      const remoteParent=remoteQuotedRow(parent,parentColumns,parentWhere);
      if(remoteParent){
        insertQuotedRow(db,parent,parentColumns,remoteParent);
        const localParent=db.prepare('SELECT 1 AS present FROM '+qname(parent)+' WHERE '+parentWhere+' LIMIT 1').get();
        if(!localParent)throw new Error('Missing parent row could not be inserted for '+child+' -> '+parent);
        insertedParents++;changed++;
        continue;
      }

      const identifyColumns=tableColumnRows(db,child)
        .filter(row=>Number(row.pk||0)>0)
        .sort((a,b)=>Number(a.pk)-Number(b.pk))
        .map(row=>String(row.name));
      const remoteIdentity=identifyColumns.length?identifyColumns:descriptor.columns;
      if(!rowExistsRemote(child,remoteIdentity,childRow)){
        db.exec('DELETE FROM '+qname(child)+' WHERE '+descriptor.deleteWhere+';');
        removedStaleChildren++;changed++;
        continue;
      }

      throw new Error('Production child row still exists but referenced parent is missing: '+child+' -> '+parent);
    }
    console.log('Foreign-key reconciliation round '+round+': violations='+violations.length+' repaired='+changed+'.');
    if(!changed)throw new Error('Foreign-key reconciliation made no progress.');
  }
  throw new Error('Foreign-key reconciliation did not converge.');
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

console.log('Magnanimous logical D1 snapshot query transport: '+(directD1Api?'direct Cloudflare D1 API':'Wrangler fallback')+'.');

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

  const fkRepair=reconcileForeignKeys(db);

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

  db.exec('PRAGMA foreign_keys=ON;');
  const summary=logicalSummary(db);
  if(summary.integrity.toLowerCase()!=='ok') throw new Error('Logical D1 snapshot failed SQLite integrity_check.');
  if(summary.foreign_key_violations!==0) throw new Error('Logical D1 snapshot has foreign-key violations.');

  db.exec('VACUUM;');
  db.close();

  const bytes=fs.readFileSync(target);
  const finalSummary={
    ...summary,
    sqlite_sha256:crypto.createHash('sha256').update(bytes).digest('hex'),
    sqlite_bytes:bytes.length,
    ordinary_tables:ordinary.length,
    virtual_tables:virtual,
    foreign_key_closure_rows:Number(fkRepair.insertedParents||0),
    foreign_key_stale_rows_removed:Number(fkRepair.removedStaleChildren||0),
    foreign_key_repair_rounds:Number(fkRepair.rounds||0)
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
