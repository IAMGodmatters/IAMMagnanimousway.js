function qname(name){return '"'+String(name).replaceAll('"','""')+'"'}
function qstr(value){return "'"+String(value).replaceAll("'","''")+"'"}

function literal(value){
  if(value===null||value===undefined)return 'NULL';
  if(typeof value==='number')return Number.isFinite(value)?String(value):'NULL';
  if(typeof value==='bigint')return value.toString();
  if(value instanceof Uint8Array||Buffer.isBuffer(value))return "X'"+Buffer.from(value).toString('hex')+"'";
  return qstr(String(value));
}

function tableInfo(db,table){
  return db.prepare('PRAGMA table_xinfo('+qstr(table)+');').all()
    .filter(row=>Number(row.hidden||0)===0);
}
function tableColumns(db,table){return tableInfo(db,table).map(row=>String(row.name||'')).filter(Boolean)}
function primaryKeyColumns(db,table){
  return tableInfo(db,table)
    .filter(row=>Number(row.pk||0)>0)
    .sort((a,b)=>Number(a.pk)-Number(b.pk))
    .map(row=>String(row.name||''))
    .filter(Boolean);
}

function parentColumnsForForeignKey(db,parent,fkRows){
  const parentPk=primaryKeyColumns(db,parent);
  return fkRows.map((fk,index)=>{
    const explicit=String(fk.to||'');
    if(explicit)return explicit;
    const seq=Number.isInteger(Number(fk.seq))?Number(fk.seq):index;
    const inferred=parentPk[seq];
    if(!inferred)throw new Error('Unable to infer parent primary-key column for '+parent+' foreign key.');
    return inferred;
  });
}

function remoteQuotedRow(remoteQuery,table,columns,whereSql){
  const selectQuoted=columns.map(name=>'quote('+qname(name)+') AS '+qname(name)).join(',');
  const rows=remoteQuery('SELECT '+selectQuoted+' FROM '+qname(table)+' WHERE '+whereSql+' LIMIT 2;');
  if(rows.length>1)throw new Error('Foreign-key reconciliation matched multiple parent rows for '+table+'.');
  return rows[0]||null;
}

function insertQuotedRow(db,table,columns,row){
  const values=columns.map(name=>{
    const value=row?.[name];
    if(value===null||value===undefined)return 'NULL';
    const text=String(value);
    if(!/^(NULL|[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?|X'[0-9A-Fa-f]*'|'.*')$/s.test(text)){
      throw new Error('Unexpected quoted D1 literal during reconciliation in '+table+'.'+name);
    }
    return text;
  });
  db.exec('INSERT OR IGNORE INTO '+qname(table)+' ('+columns.map(qname).join(',')+') VALUES ('+values.join(',')+');');
}

function violatingChildRow(db,child,parent,fkRows,parentColumns,rowid){
  if(rowid!==null&&rowid!==undefined){
    const direct=db.prepare('SELECT * FROM '+qname(child)+' WHERE rowid=?').get(rowid);
    if(direct)return direct;
  }
  const nonNull=fkRows.map(fk=>'c.'+qname(String(fk.from||''))+' IS NOT NULL').join(' AND ');
  const matches=fkRows.map((fk,index)=>
    'p.'+qname(parentColumns[index])+' = c.'+qname(String(fk.from||''))
  ).join(' AND ');
  return db.prepare(
    'SELECT c.* FROM '+qname(child)+' c WHERE '+nonNull+
    ' AND NOT EXISTS (SELECT 1 FROM '+qname(parent)+' p WHERE '+matches+') LIMIT 1'
  ).get();
}

function childIdentityWhere(db,child,row){
  const pk=primaryKeyColumns(db,child);
  const columns=pk.length?pk:tableColumns(db,child);
  if(!columns.length)throw new Error('Unable to identify child row in '+child+'.');
  return columns.map(name=>{
    const value=row[name];
    return value===null||value===undefined
      ? qname(name)+' IS NULL'
      : qname(name)+'='+literal(value);
  }).join(' AND ');
}

export function reconcileForeignKeys(db,remoteQuery,{maxRounds=12}={}){
  const one=sql=>remoteQuery(sql)[0]||null;
  let totalRepaired=0,totalPruned=0;
  for(let round=1;round<=maxRounds;round++){
    const violations=db.prepare('PRAGMA foreign_key_check').all();
    if(!violations.length){
      console.log('Foreign-key reconciliation PASS after '+(round-1)+' repair rounds; added '+totalRepaired+' missing parent rows; pruned '+totalPruned+' stale copied child rows.');
      return {repaired:totalRepaired,pruned:totalPruned,rounds:round-1};
    }

    let changed=0;
    const seen=new Set();
    for(const violation of violations){
      const child=String(violation.table||'');
      const parent=String(violation.parent||'');
      const fkId=Number(violation.fkid);
      if(!child||!parent||!Number.isInteger(fkId))throw new Error('Malformed foreign-key violation metadata.');
      const marker=child+'|'+String(violation.rowid)+'|'+parent+'|'+fkId;
      if(seen.has(marker))continue;
      seen.add(marker);

      const fkRows=db.prepare('PRAGMA foreign_key_list('+qstr(child)+');').all()
        .filter(row=>Number(row.id)===fkId)
        .sort((a,b)=>Number(a.seq)-Number(b.seq));
      if(!fkRows.length)throw new Error('Foreign-key definition not found for '+child+' -> '+parent+'.');
      const parentColumns=parentColumnsForForeignKey(db,parent,fkRows);
      const childRow=violatingChildRow(db,child,parent,fkRows,parentColumns,violation.rowid);
      if(!childRow)continue;

      const predicates=[];
      let nullReference=false;
      for(let index=0;index<fkRows.length;index++){
        const from=String(fkRows[index].from||'');
        if(!from)throw new Error('Foreign-key child column is missing for '+child+' -> '+parent+'.');
        const value=childRow[from];
        if(value===null||value===undefined){nullReference=true;break;}
        predicates.push(qname(parentColumns[index])+'='+literal(value));
      }
      if(nullReference)continue;

      const parentFields=tableColumns(db,parent);
      const parentRemote=remoteQuotedRow(remoteQuery,parent,parentFields,predicates.join(' AND '));
      if(parentRemote){
        insertQuotedRow(db,parent,parentFields,parentRemote);
        const localParent=db.prepare(
          'SELECT 1 AS present FROM '+qname(parent)+' WHERE '+predicates.join(' AND ')+' LIMIT 1'
        ).get();
        if(!localParent)throw new Error('Missing parent row could not be inserted for '+child+' -> '+parent+'.');
        totalRepaired++;changed++;
        continue;
      }

      const identity=childIdentityWhere(db,child,childRow);
      const childStillExists=Boolean(one('SELECT 1 AS present FROM '+qname(child)+' WHERE '+identity+' LIMIT 1;'));
      if(childStillExists){
        throw new Error('Production currently contains a foreign-key violation: '+child+' -> '+parent+'.');
      }

      db.exec('DELETE FROM '+qname(child)+' WHERE '+identity+';');
      totalPruned++;changed++;
    }

    if(!changed)throw new Error('Foreign-key reconciliation made no progress with '+violations.length+' violations remaining.');
  }

  const remaining=db.prepare('PRAGMA foreign_key_check').all();
  throw new Error('Foreign-key reconciliation exceeded '+maxRounds+' rounds with '+remaining.length+' violations remaining.');
}
