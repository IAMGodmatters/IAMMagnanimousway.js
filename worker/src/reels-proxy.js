const REELS_PREFIX='/reels-proxy';
const REELS_ORIGIN='https://lja74zv1.basicdeploy.com';

function isReelsPath(pathname){return pathname===REELS_PREFIX||pathname===REELS_PREFIX+'/'||pathname.startsWith(REELS_PREFIX+'/');}
function upstreamPath(url){let pathname=url.pathname.slice(REELS_PREFIX.length)||'/';if(!pathname.startsWith('/'))pathname='/'+pathname;return pathname+url.search;}
function prefixedPath(value){if(typeof value!=='string'||!value.startsWith('/'))return value;if(value===REELS_PREFIX||value.startsWith(REELS_PREFIX+'/'))return value;return REELS_PREFIX+value;}
function rewriteText(text,contentType){
  if(contentType.includes('application/manifest+json')||contentType.includes('application/json')){
    try{const data=JSON.parse(text);if(data&&typeof data==='object'&&('start_url'in data||'scope'in data)){data.start_url=REELS_PREFIX+'/';data.scope=REELS_PREFIX+'/';if(Array.isArray(data.icons))data.icons=data.icons.map(icon=>icon&&typeof icon==='object'?{...icon,src:prefixedPath(icon.src)}:icon);if(Array.isArray(data.screenshots))data.screenshots=data.screenshots.map(item=>item&&typeof item==='object'?{...item,src:prefixedPath(item.src)}:item);return JSON.stringify(data);}}catch{}return text;
  }
  const roots=['/api/','/assets/','/audio/','/timings/','/creator-audio/','/creator-timings/','/ambient/','/series-video/','/creator.js','/series.js','/premium-gating.js','/manifest.webmanifest','/sw.js'];
  let out=text;
  for(const root of roots){const replacement=REELS_PREFIX+root;out=out.split(`'${root}`).join(`'${replacement}`);out=out.split(`\"${root}`).join(`\"${replacement}`);out=out.split('`'+root).join('`'+replacement);out=out.split(`href=${root}`).join(`href=${replacement}`);out=out.split(`src=${root}`).join(`src=${replacement}`);}
  if(contentType.includes('javascript')){out=out.replaceAll("addAll(['/','/reels-proxy/api/stories','/reels-proxy/manifest.webmanifest'])","addAll(['/reels-proxy/','/reels-proxy/api/stories','/reels-proxy/manifest.webmanifest'])");out=out.replaceAll("const CORE=['/','/reels-proxy/manifest.webmanifest'","const CORE=['/reels-proxy/','/reels-proxy/manifest.webmanifest'");}
  return out;
}
function removeUpstreamHostBranding(html){let out=html;out=out.replace(/<style>body\{padding-bottom:2\.6em\}<\/style>/gi,'');out=out.replace(/<div[^>]*>This app is user-hosted on[\s\S]*?Report abuse<\/a><\/div>/gi,'');out=out.replace(/<meta[^>]+(?:BasicDeploy|basicdeploy\.com|lja74zv1\.basicdeploy\.com)[^>]*>/gi,'');return out;}

function isReelsEntryDocument(request,url){
  return ['GET','HEAD'].includes(request.method)&&(url.pathname===REELS_PREFIX||url.pathname===REELS_PREFIX+'/');
}
function isKnownCapacityPage(body){
  return /waiting\s+for\s+capacity|account.{0,80}(?:suspended|over.?quota)|(?:storage|container|account).{0,80}over.?quota|container.{0,80}suspended|service\s+temporarily\s+unavailable/i.test(String(body||''));
}
function reelsUnavailableResponse(method='GET'){
  const html=\`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Magnanimous Reels temporarily unavailable</title>
<style>
:root{color-scheme:dark;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#06152d;color:#f6f8ff}
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:radial-gradient(ellipse at 20% 0%,#174a83 0,transparent 55%),linear-gradient(145deg,#06152d,#020817)}
main{width:min(100%,680px);padding:clamp(24px,5vw,44px);border:1px solid rgba(244,202,125,.65);border-radius:24px;background:linear-gradient(145deg,rgba(14,43,78,.97),rgba(4,15,35,.98));box-shadow:0 22px 70px #0009}
.eyebrow{color:#8ce8ff;font-size:12px;font-weight:800;letter-spacing:.14em;text-transform:uppercase}h1{margin:12px 0;color:#ffe0a0;font-size:clamp(28px,5vw,42px);line-height:1.12}p{line-height:1.65;color:#e7efff}.actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:26px}a{display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:11px 16px;border:1px solid #d8b46f;border-radius:12px;color:#fff1cf;background:#173f70;text-decoration:none;font-weight:750}a:focus-visible{outline:3px solid #8ce8ff;outline-offset:3px}.secondary{background:transparent;border-color:#7896bb}.note{margin-top:22px;color:#b8c9e2;font-size:13px}
</style></head><body><main role="main" aria-labelledby="reels-outage-title"><div class="eyebrow">I AM MAGNANIMOUS WAY™</div><h1 id="reels-outage-title">Magnanimous Reels is temporarily unavailable</h1><p>The Reels service is not responding right now. You can still create and edit videos with the platform’s available tools while Reels is unavailable.</p><div class="actions"><a href="/video-studio/">Open Video Studio</a><a href="/movie-maker/">Open Movie Maker</a><a class="secondary" href="/reels/" target="_top">Try Reels again</a></div><p class="note">This is a temporary service interruption. No paid upgrade or account change is required to use the alternatives above.</p></main></body></html>\`;
  return new Response(method==='HEAD'?null:html,{status:503,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store','x-magnanimous-surface':'reels','x-magnanimous-nickname':'Magnanimous Reels','x-magnanimous-reels-status':'temporarily-unavailable','x-robots-tag':'noindex, noarchive','link':'<https://iammagnanimousway.com/reels>; rel="canonical"'}});
}


export async function handleMagnanimousReelsProxy(request){
  const incoming=new URL(request.url);
  if(!isReelsPath(incoming.pathname))return null;
  const entryDocument=isReelsEntryDocument(request,incoming);
  const target=new URL(upstreamPath(incoming),REELS_ORIGIN);
  const headers=new Headers(request.headers);
  for(const key of ['host','content-length','connection','transfer-encoding'])headers.delete(key);
  headers.set('x-forwarded-host','iammagnanimousway.com');headers.set('x-forwarded-proto','https');headers.set('x-magnanimous-surface','reels');
  const init={method:request.method,headers,redirect:'manual'};
  if(!['GET','HEAD'].includes(request.method))init.body=request.body;
  try{
    const upstream=await fetch(target,init);
    if(entryDocument&&(upstream.status===402||upstream.status===429||upstream.status>=500))return reelsUnavailableResponse(request.method);
    const responseHeaders=new Headers(upstream.headers);
    for(const key of ['content-length','content-encoding','server','via','x-powered-by','x-frame-options','content-security-policy'])responseHeaders.delete(key);
    responseHeaders.set('x-magnanimous-surface','reels');responseHeaders.set('x-magnanimous-nickname','Magnanimous Reels');responseHeaders.set('link','<https://iammagnanimousway.com/reels>; rel="canonical"');
    const location=responseHeaders.get('location');
    if(location){try{const redirected=new URL(location,target);if(redirected.origin===REELS_ORIGIN)responseHeaders.set('location',REELS_PREFIX+(redirected.pathname==='/'?'/':redirected.pathname)+redirected.search);}catch{}}
    if(request.method==='HEAD')return new Response(null,{status:upstream.status,statusText:upstream.statusText,headers:responseHeaders});
    const type=String(responseHeaders.get('content-type')||'').toLowerCase();
    if(type.includes('text/html')||type.includes('text/plain')||type.includes('javascript')||type.includes('application/json')||type.includes('manifest')){
      let text=await upstream.text();
      if(entryDocument&&isKnownCapacityPage(text))return reelsUnavailableResponse(request.method);
      if(type.includes('text/html'))text=removeUpstreamHostBranding(text);
      text=rewriteText(text,type);
      if(type.includes('text/html')){text=text.replace(/<title>[^<]*<\/title>/i,'<title>Magnanimous Reels</title>');text=text.replace('</head>','<meta name="application-name" content="Magnanimous Reels"><meta name="robots" content="index,follow,max-image-preview:large,max-video-preview:-1"><link rel="canonical" href="https://iammagnanimousway.com/reels"></head>');}
      return new Response(text,{status:upstream.status,statusText:upstream.statusText,headers:responseHeaders});
    }
    return new Response(upstream.body,{status:upstream.status,statusText:upstream.statusText,headers:responseHeaders});
  }catch(error){console.error('Magnanimous Reels Worker proxy failed',String(error?.message||error));if(entryDocument)return reelsUnavailableResponse(request.method);return Response.json({detail:'Magnanimous Reels is temporarily unavailable.',code:'MAGNANIMOUS_REELS_PROXY_UNAVAILABLE'},{status:502,headers:{'cache-control':'no-store'}});}
}
