import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';

const dbPath=path.resolve(process.env.MAGNANIMOUS_DB_PATH||'./data/iam-magnanimous.sqlite');
const objectsPath=path.resolve(process.env.MAGNANIMOUS_OBJECTS_PATH||'./data/object-store');
const backupRoot=path.resolve(process.env.MAGNANIMOUS_BACKUP_DIR||'./backups');
const stamp=new Date().toISOString().replace(/[:.]/g,'-');
const target=path.join(backupRoot,'backup-'+stamp);
await fs.mkdir(target,{recursive:true});

const backupDb=path.join(target,'iam-magnanimous.sqlite');
const db=new DatabaseSync(dbPath);
try{
 const escaped=backupDb.replaceAll("'","''");
 db.exec("VACUUM INTO '"+escaped+"'");
}finally{db.close()}

const targetObjects=path.join(target,'object-store');
try{await fs.cp(objectsPath,targetObjects,{recursive:true,force:false})}catch(error){if(error?.code!=='ENOENT')throw error}

async function hashFile(file){
 const data=await fs.readFile(file);
 return crypto.createHash('sha256').update(data).digest('hex');
}
async function countFiles(dir){
 let count=0,bytes=0;
 async function walk(current){
  let entries=[];try{entries=await fs.readdir(current,{withFileTypes:true})}catch{return}
  for(const entry of entries){
   const p=path.join(current,entry.name);
   if(entry.isDirectory())await walk(p);
   else{count++;bytes+=(await fs.stat(p)).size}
  }
 }
 await walk(dir);
 return{count,bytes};
}
const objects=await countFiles(targetObjects);
const manifest={
 identity:'Magnanimous AI',
 created_at:new Date().toISOString(),
 database:{filename:'iam-magnanimous.sqlite',sha256:await hashFile(backupDb),bytes:(await fs.stat(backupDb)).size},
 object_store:{directory:'object-store',files:objects.count,bytes:objects.bytes},
 source:{database:dbPath,object_store:objectsPath}
};
await fs.writeFile(path.join(target,'manifest.json'),JSON.stringify(manifest,null,2));
console.log(JSON.stringify({ok:true,backup:target,manifest},null,2));
