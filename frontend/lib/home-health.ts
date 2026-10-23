/** Homepage probes must never turn an HTTP error or empty tool catalog into a green status. */
export async function fetchHomeJson(url:string,signal:AbortSignal,request:typeof fetch=fetch):Promise<any>{
 try{
  const response=await request(url,{cache:'no-store',signal});
  if(!response.ok)return{};
  const data=await response.json();
  return data&&typeof data==='object'?data:{};
 }catch{return{}}
}

export function coreHomeServicesHealthy(health:any,catalog:any):boolean{
 return health?.status==='ok'&&Array.isArray(catalog?.tools)&&catalog.tools.length>0;
}
