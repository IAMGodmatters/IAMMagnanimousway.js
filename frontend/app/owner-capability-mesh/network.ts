// Owner UI transport guard: network loss cannot leave the action buttons
// permanently busy. Callers decide whether a non-idempotent POST is retried.
export async function fetchWithTimeout(
 url:string,options:RequestInit,fetcher:typeof fetch=fetch,timeoutMs=20000
):Promise<Response>{
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),timeoutMs);
 try{return await fetcher(url,{...options,signal:controller.signal})}
 finally{clearTimeout(timeout)}
}

export function connectionError(error:unknown):string{
 return error instanceof Error&&error.name==='AbortError'
  ?'The server did not respond within 20 seconds. Your work is safe; please retry.'
  :'Connection interrupted. Check your connection and retry. Your saved platform data has not been changed.';
}
