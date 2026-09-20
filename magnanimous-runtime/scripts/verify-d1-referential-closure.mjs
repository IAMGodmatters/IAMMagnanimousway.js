import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';

import { reconcileForeignKeys } from '../src/d1-snapshot-reconcile.mjs';

const root=await fs.mkdtemp(path.join(os.tmpdir(),'magnanimous-d1-reconcile-'));
try{
  const dbPath=path.join(root,'snapshot.sqlite');
  const db=new DatabaseSync(dbPath);
  db.exec(`
    PRAGMA foreign_keys=OFF;
    CREATE TABLE parents(id INTEGER PRIMARY KEY,name TEXT NOT NULL);
    CREATE TABLE children(
      id INTEGER PRIMARY KEY,
      parent_id INTEGER NOT NULL,
      value TEXT NOT NULL,
      FOREIGN KEY(parent_id) REFERENCES parents(id)
    );
    INSERT INTO parents(id,name) VALUES(1,'one');
    INSERT INTO children(id,parent_id,value) VALUES
      (10,1,'valid'),
      (11,2,'parent-arrived-later'),
      (12,3,'child-was-deleted');
  `);

  const production={
    parents:[
      {id:"1",name:"'one'"},
      {id:"2",name:"'two'"}
    ],
    children:[
      {id:"10",parent_id:"1",value:"'valid'"},
      {id:"11",parent_id:"2",value:"'parent-arrived-later'"}
    ]
  };

  const unquote=(value)=>{
    const s=String(value||'');
    if(/^'.*'$/.test(s))return s.slice(1,-1).replaceAll("''","'");
    if(/^[-+]?\d+$/.test(s))return Number(s);
    return s;
  };
  const parseWhere=(sql)=>{
    const where=String(sql).split(/\bWHERE\b/i)[1]?.split(/\bLIMIT\b/i)[0]?.trim()||'';
    return where.split(/\s+AND\s+/i).filter(Boolean).map(term=>{
      const m=term.match(/"([^"]+)"\s*=\s*(.+)$/s);
      return m?{column:m[1],value:unquote(m[2].trim())}:null;
    }).filter(Boolean);
  };

  const remoteQuery=(sql)=>{
    const text=String(sql);
    const table=(text.match(/FROM\s+"([^"]+)"/i)||[])[1];
    if(!table||!production[table])return[];
    const predicates=parseWhere(text);
    let rows=production[table].filter(row=>predicates.every(p=>unquote(row[p.column])===p.value));
    if(/SELECT\s+1\s+AS\s+present/i.test(text))return rows.length?[{present:1}]:[];
    const select=(text.match(/SELECT\s+(.+?)\s+FROM/is)||[])[1]||'';
    const aliases=[...select.matchAll(/quote\("([^"]+)"\)\s+AS\s+"([^"]+)"/gi)].map(m=>[m[1],m[2]]);
    if(aliases.length){
      rows=rows.map(row=>Object.fromEntries(aliases.map(([source,alias])=>[alias,row[source]])));
    }
    return rows.slice(0,2);
  };

  const result=reconcileForeignKeys(db,remoteQuery);
  assert.deepEqual(result,{repaired:1,pruned:1,rounds:1});
  assert.equal(db.prepare('SELECT name FROM parents WHERE id=2').get()?.name,'two');
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM children WHERE id=12').get()?.n,0);
  assert.equal(db.prepare('PRAGMA foreign_key_check').all().length,0);
  db.close();

  console.log('Magnanimous D1 referential-closure verification PASS');
}finally{
  await fs.rm(root,{recursive:true,force:true});
}
