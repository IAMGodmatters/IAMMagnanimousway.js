import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

if(process.env.MAGNANIMOUS_ALLOW_RESTORE!=='YES_I_UNDERSTAND'){
 throw new Error('Restore is locked. Stop the runtime and set MAGNANIMOUS_ALLOW_RESTORE=YES_I_UNDERSTAND for an explicit offline restore.');
}
const source=path.resolve(process.argv[2]||'');
if(!source)throw new Error('Usage: node restore-runtime.mjs <backup-directory>');
const manifest=JSON.parse(await fs.readFile(path.join(source,'manifest.json'),'utf8'));
const dbSource=path.join(source,manifest.database.filename||'iam-magnanimous.sqlite');
const data=await fs.readFile(dbSource);
const digest=crypto.createHash('sha256').update(data).digest('hex');
if(digest!==manifest.database.sha256)throw new Error('Backup database checksum mismatch.');

const dbTarget=path.resolve(process.env.MAGNANIMOUS_DB_PATH||'./data/iam-magnanimous.sqlite');
const objectsTarget=path.resolve(process.env.MAGNANIMOUS_OBJECTS_PATH||'./data/object-store');
await fs.mkdir(path.dirname(dbTarget),{recursive:true});
for(const suffix of ['','-wal','-shm'])await fs.rm(dbTarget+suffix,{force:true});
await fs.copyFile(dbSource,dbTarget);
await fs.rm(objectsTarget,{recursive:true,force:true});
const objectsSource=path.join(source,manifest.object_store?.directory||'object-store');
try{await fs.cp(objectsSource,objectsTarget,{recursive:true})}catch(error){if(error?.code!=='ENOENT')throw error}
console.log(JSON.stringify({ok:true,restored_database:dbTarget,restored_object_store:objectsTarget,source},null,2));
