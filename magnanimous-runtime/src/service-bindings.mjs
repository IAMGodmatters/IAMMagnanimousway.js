class InternalService{
 constructor(baseUrl,token){this.baseUrl=String(baseUrl||'').replace(/\/$/,'');this.token=String(token||'')}
 get configured(){return Boolean(this.baseUrl&&this.token)}
 async request(path,{method='GET',body}={}){
  if(!this.configured)throw new Error('Magnanimous internal service is not configured.');
  const response=await fetch(this.baseUrl+path,{method,headers:{'content-type':'application/json','x-magnanimous-service-token':this.token},body:body===undefined?undefined:JSON.stringify(body)});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.detail||('Magnanimous internal service returned HTTP '+response.status));
  return data;
 }
 async health(){return this.request('/health')}
}
export class MagnanimousSandboxBinding extends InternalService{
 async exec(argv,options={}){return this.request('/exec',{method:'POST',body:{argv,...options}})}
 async writeFile(path,content,{base64=false}={}){return this.request('/files/write',{method:'POST',body:base64?{path,base64:content}:{path,text:content}})}
 async readFile(path){return this.request('/files/read?path='+encodeURIComponent(path))}
}
export class MagnanimousBrowserBinding extends InternalService{
 async render(url,options={}){return this.request('/render',{method:'POST',body:{url,...options}})}
}
export class MagnanimousImagesBinding extends InternalService{
 async transform(base64,options={}){return this.request('/transform',{method:'POST',body:{base64,...options}})}
}
export function magnanimousServiceBindings(env=process.env){
 const token=env.MAGNANIMOUS_INTERNAL_SERVICE_TOKEN||'';
 return{
  sandbox:new MagnanimousSandboxBinding(env.MAGNANIMOUS_SANDBOX_URL||'',token),
  browser:new MagnanimousBrowserBinding(env.MAGNANIMOUS_BROWSER_URL||'',token),
  images:new MagnanimousImagesBinding(env.MAGNANIMOUS_MEDIA_URL||'',token)
 };
}
