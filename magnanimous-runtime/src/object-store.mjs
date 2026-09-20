import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

function safeKey(value=''){
  const key=String(value).replace(/\\/g,'/').replace(/^\/+/, '');
  if(!key||key.split('/').some(part=>part==='..'||part==='')) throw new Error('Invalid Magnanimous object key.');
  return key;
}
function toBuffer(value){
  if(Buffer.isBuffer(value)) return value;
  if(value instanceof ArrayBuffer) return Buffer.from(value);
  if(ArrayBuffer.isView(value)) return Buffer.from(value.buffer,value.byteOffset,value.byteLength);
  if(typeof value==='string') return Buffer.from(value);
  return Buffer.from(JSON.stringify(value));
}
async function exists(file){try{await fs.access(file);return true}catch{return false}}

export class MagnanimousObjectStore{
  constructor(root){
    this.root=path.resolve(root);
    this.dataRoot=path.join(this.root,'objects');
    this.metaRoot=path.join(this.root,'metadata');
  }
  _paths(key){
    const clean=safeKey(key);
    const data=path.resolve(this.dataRoot,clean);
    const meta=path.resolve(this.metaRoot,clean+'.json');
    if(!data.startsWith(this.dataRoot+path.sep)||!meta.startsWith(this.metaRoot+path.sep)) throw new Error('Object path escaped storage root.');
    return{clean,data,meta};
  }
  async put(key,value,options={}){
    const {clean,data,meta}=this._paths(key),body=toBuffer(value);
    await fs.mkdir(path.dirname(data),{recursive:true});
    await fs.mkdir(path.dirname(meta),{recursive:true});
    const etag=crypto.createHash('sha256').update(body).digest('hex');
    const record={
      key:clean,etag,size:body.length,uploaded:Date.now(),
      httpMetadata:options.httpMetadata||{},
      customMetadata:options.customMetadata||{}
    };
    await fs.writeFile(data,body);
    await fs.writeFile(meta,JSON.stringify(record));
    return{key:clean,etag,size:body.length};
  }
  async head(key){
    const {clean,data,meta}=this._paths(key);
    if(!(await exists(data))) return null;
    let record={key:clean,httpMetadata:{},customMetadata:{}};
    try{record={...record,...JSON.parse(await fs.readFile(meta,'utf8'))}}catch{}
    const stat=await fs.stat(data);
    return{...record,size:Number(record.size??stat.size),uploaded:Number(record.uploaded||stat.mtimeMs)};
  }
  async get(key){
    const head=await this.head(key);
    if(!head)return null;
    const {data}=this._paths(key),body=await fs.readFile(data);
    return{
      ...head,
      body,
      arrayBuffer:async()=>body.buffer.slice(body.byteOffset,body.byteOffset+body.byteLength),
      text:async()=>body.toString('utf8'),
      json:async()=>JSON.parse(body.toString('utf8'))
    };
  }
  async delete(key){
    const {data,meta}=this._paths(key);
    await Promise.allSettled([fs.rm(data,{force:true}),fs.rm(meta,{force:true})]);
  }
  async list({prefix='',limit=1000,cursor=''}={}){
    const cleanPrefix=String(prefix||'').replace(/\\/g,'/').replace(/^\/+/, '');
    const keys=[];
    const walk=async(dir,relative='')=>{
      let entries=[];try{entries=await fs.readdir(dir,{withFileTypes:true})}catch{return}
      for(const entry of entries){
        const rel=relative?relative+'/'+entry.name:entry.name;
        if(entry.isDirectory())await walk(path.join(dir,entry.name),rel);
        else if(!cleanPrefix||rel.startsWith(cleanPrefix))keys.push(rel);
      }
    };
    await walk(this.dataRoot);
    keys.sort();
    const start=cursor?Math.max(0,keys.findIndex(k=>k>cursor)):0;
    const selected=keys.slice(start,start+Math.max(1,Math.min(Number(limit)||1000,1000)));
    const objects=[];
    for(const key of selected){const h=await this.head(key);if(h)objects.push(h)}
    return{objects,truncated:start+selected.length<keys.length,cursor:selected.at(-1)||''};
  }
}

export function openMagnanimousObjectStore(root=process.env.MAGNANIMOUS_OBJECTS_PATH||'./data/object-store'){
  return new MagnanimousObjectStore(root);
}
