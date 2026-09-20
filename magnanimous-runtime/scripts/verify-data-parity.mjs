import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';

const sourcePath=path.resolve(process.argv[2]||'');
const targetPath=path.resolve(process.argv[3]||'');
if(!sourcePath||!targetPath)throw new Error('Usage: node verify-data-parity.mjs <source.sqlite> <target.sqlite>');
const source=new DatabaseSync(sourcePath,{readOnly:true}),target=new DatabaseSync(targetPath,{readOnly:true});
function qname(name){return '"'+String(name).replaceAll('"','""')+'"'}
function tables(db){return db.prepare("SELECT name,sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all()}
try{
 const s=tables(source),t=tables(target),targetMap=new Map(t.map(x=>[x.name,x]));
 const differences=[];
 for(const row of s){
  if(!targetMap.has(row.name)){differences.push({table:row.name,issue:'missing-target-table'});continue}
  const sc=Number(source.prepare('SELECT COUNT(*) n FROM '+qname(row.name)).get()?.n||0);
  const tc=Number(target.prepare('SELECT COUNT(*) n FROM '+qname(row.name)).get()?.n||0);
  if(sc!==tc)differences.push({table:row.name,issue:'row-count',source:sc,target:tc});
 }
 for(const row of t)if(!s.some(x=>x.name===row.name))differences.push({table:row.name,issue:'extra-target-table'});
 const sourceIntegrity=source.prepare('PRAGMA integrity_check').get()?.integrity_check;
 const targetIntegrity=target.prepare('PRAGMA integrity_check').get()?.integrity_check;
 const ok=!differences.length&&sourceIntegrity==='ok'&&targetIntegrity==='ok';
 console.log(JSON.stringify({ok,source:sourcePath,target:targetPath,source_tables:s.length,target_tables:t.length,source_integrity:sourceIntegrity,target_integrity:targetIntegrity,differences},null,2));
 if(!ok)process.exitCode=1;
}finally{source.close();target.close()}
