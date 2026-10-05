'use client';

const DB_NAME='magnanimous-local-vault-v1';
const STORE='objects';

type VaultRecord={key:string;value:Blob|string;updated_at:number;content_type?:string};

function openDb(){
 return new Promise<IDBDatabase>((resolve,reject)=>{
  if(typeof indexedDB==='undefined')return reject(new Error('IndexedDB is not available on this device.'));
  const request=indexedDB.open(DB_NAME,1);
  request.onupgradeneeded=()=>{
   const db=request.result;
   if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE,{keyPath:'key'});
  };
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error||new Error('Device vault could not be opened.'));
 });
}

export async function localVaultEstimate(){
 const storage=(typeof navigator!=='undefined'?navigator.storage:null);
 const estimate=storage?.estimate?await storage.estimate():{};
 return{
  usage:Number(estimate.usage||0),
  quota:Number(estimate.quota||0),
  persisted:storage?.persisted?await storage.persisted():false
 };
}

export async function requestLocalVaultPersistence(){
 const storage=(typeof navigator!=='undefined'?navigator.storage:null);
 if(!storage?.persist)return false;
 return Boolean(await storage.persist());
}

export async function putLocalVaultObject(key:string,value:Blob|string,contentType='application/octet-stream'){
 const clean=String(key||'').trim();
 if(!clean)throw new Error('A storage key is required.');
 const db=await openDb();
 try{
  await new Promise<void>((resolve,reject)=>{
   const tx=db.transaction(STORE,'readwrite');
   tx.objectStore(STORE).put({key:clean,value,updated_at:Date.now(),content_type:contentType} satisfies VaultRecord);
   tx.oncomplete=()=>resolve();
   tx.onerror=()=>reject(tx.error||new Error('Device vault write failed.'));
   tx.onabort=()=>reject(tx.error||new Error('Device vault write was aborted.'));
  });
 }finally{db.close()}
}

export async function getLocalVaultObject(key:string){
 const db=await openDb();
 try{
  return await new Promise<VaultRecord|null>((resolve,reject)=>{
   const request=db.transaction(STORE,'readonly').objectStore(STORE).get(key);
   request.onsuccess=()=>resolve((request.result as VaultRecord)||null);
   request.onerror=()=>reject(request.error||new Error('Device vault read failed.'));
  });
 }finally{db.close()}
}

export async function deleteLocalVaultObject(key:string){
 const db=await openDb();
 try{
  await new Promise<void>((resolve,reject)=>{
   const tx=db.transaction(STORE,'readwrite');
   tx.objectStore(STORE).delete(key);
   tx.oncomplete=()=>resolve();
   tx.onerror=()=>reject(tx.error||new Error('Device vault delete failed.'));
  });
 }finally{db.close()}
}

export async function localVaultSelfTest(){
 const key='__magnanimous_storage_self_test__';
 const marker=`Magnanimous storage test ${Date.now()}`;
 await putLocalVaultObject(key,marker,'text/plain');
 const record=await getLocalVaultObject(key);
 if(record?.value!==marker)throw new Error('Device vault read-after-write verification failed.');
 await deleteLocalVaultObject(key);
 return true;
}
