import { handleMagnanimousCarrierCore } from './magnanimous-carrier-core.js';

export async function handleMagnanimousCarrierPhoneAlias(request,env){
 const url=new URL(request.url);
 if(!url.pathname.startsWith('/api/phone/carrier-core'))return null;
 const suffix=url.pathname.slice('/api/phone/carrier-core'.length);
 url.pathname=`/api/magnanimous/carrier${suffix}`;
 const init={method:request.method,headers:new Headers(request.headers)};
 if(!['GET','HEAD'].includes(request.method))init.body=await request.clone().arrayBuffer();
 return handleMagnanimousCarrierCore(new Request(url.toString(),init),env);
}
