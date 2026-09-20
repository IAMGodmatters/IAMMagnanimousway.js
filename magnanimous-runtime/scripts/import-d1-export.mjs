import fs from 'node:fs';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';

const [source,target]=process.argv.slice(2);
if(!source||!target)throw new Error('Usage: node import-d1-export.mjs <export.sql> <target.sqlite>');
if(!fs.existsSync(source))throw new Error('D1 export file not found.');

const targetPath=path.resolve(target);
fs.mkdirSync(path.dirname(targetPath),{recursive:true});
if(fs.existsSync(targetPath))fs.rmSync(targetPath,{force:true});

const sql=fs.readFileSync(source,'utf8');
if(!sql.trim())throw new Error('D1 export is empty.');

const db=new DatabaseSync(targetPath);
try{
  db.exec('PRAGMA foreign_keys=OFF; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
  db.exec(sql);
  db.exec('PRAGMA foreign_keys=ON;');
  const integrity=db.prepare('PRAGMA integrity_check').get();
  const value=Object.values(integrity||{})[0];
  if(value!=='ok')throw new Error('Imported database failed SQLite integrity_check.');
  fs.chmodSync(targetPath,0o600);
  console.log('Magnanimous production database copy imported into standard SQLite successfully.');
}finally{
  db.close();
}
