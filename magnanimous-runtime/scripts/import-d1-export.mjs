import fs from 'node:fs/promises';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';

if(process.env.MAGNANIMOUS_ALLOW_IMPORT!=='YES_I_UNDERSTAND'){
 throw new Error('Import is locked. Set MAGNANIMOUS_ALLOW_IMPORT=YES_I_UNDERSTAND only for a reviewed offline cutover import.');
}
const sqlFile=path.resolve(process.argv[2]||'');
const target=path.resolve(process.argv[3]||process.env.MAGNANIMOUS_DB_PATH||'./data/iam-magnanimous.sqlite');
if(!sqlFile)throw new Error('Usage: node import-d1-export.mjs <d1-export.sql> [target.sqlite]');
try{await fs.access(target);throw new Error('Target database already exists. Refusing to overwrite '+target)}catch(error){if(error?.code!=='ENOENT')throw error}
await fs.mkdir(path.dirname(target),{recursive:true});
let sql=await fs.readFile(sqlFile,'utf8');
sql=sql.replace(/PRAGMA\s+defer_foreign_keys\s*=\s*TRUE\s*;?/ig,'');
const db=new DatabaseSync(target);
try{
 db.exec('PRAGMA foreign_keys=OFF;');
 db.exec(sql);
 db.exec('PRAGMA foreign_keys=ON;');
 const integrity=db.prepare('PRAGMA integrity_check').get();
 if(String(integrity?.integrity_check||'').toLowerCase()!=='ok')throw new Error('SQLite integrity_check failed after D1 import.');
 const tables=db.prepare("SELECT COUNT(*) n FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").get();
 console.log(JSON.stringify({ok:true,target,tables:Number(tables?.n||0),integrity:'ok'},null,2));
}finally{db.close()}
