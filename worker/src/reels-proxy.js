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

export async function handleMagnanimousReelsProxy(request){
  const incoming=new URL(request.url);
  if(!isReelsPath(incoming.pathname))return null;
  const target=new URL(upstreamPath(incoming),REELS_ORIGIN);
  const headers=new Headers(request.headers);
  for(const key of ['host','content-length','connection','transfer-encoding'])headers.delete(key);
  headers.set('x-forwarded-host','iammagnanimousway.com');headers.set('x-forwarded-proto','https');headers.set('x-magnanimous-surface','reels');
  const init={method:request.method,headers,redirect:'manual'};
  if(!['GET','HEAD'].includes(request.method))init.body=request.body;
  try{
    const upstream=await fetch(target,init);
    const responseHeaders=new Headers(upstream.headers);
    for(const key of ['content-length','content-encoding','server','via','x-powered-by','x-frame-options','content-security-policy'])responseHeaders.delete(key);
    responseHeaders.set('x-magnanimous-surface','reels');responseHeaders.set('x-magnanimous-nickname','Magnanimous Reels');responseHeaders.set('link','<https://iammagnanimousway.com/reels>; rel="canonical"');
    const location=responseHeaders.get('location');
    if(location){try{const redirected=new URL(location,target);if(redirected.origin===REELS_ORIGIN)responseHeaders.set('location',REELS_PREFIX+(redirected.pathname==='/'?'/':redirected.pathname)+redirected.search);}catch{}}
    if(request.method==='HEAD')return new Response(null,{status:upstream.status,statusText:upstream.statusText,headers:responseHeaders});
    const type=String(responseHeaders.get('content-type')||'').toLowerCase();
    if(type.includes('text/html')||type.includes('javascript')||type.includes('application/json')||type.includes('manifest')){
      let text=await upstream.text();
      if(type.includes('text/html'))text=removeUpstreamHostBranding(text);
      text=rewriteText(text,type);
      if(type.includes('text/html')){text=text.replace(/<title>[^<]*<\/title>/i,'<title>Magnanimous Reels</title>');text=text.replace('</head>','<meta name="application-name" content="Magnanimous Reels"><meta name="robots" content="index,follow,max-image-preview:large,max-video-preview:-1"><link rel="canonical" href="https://iammagnanimousway.com/reels"></head>');}
      return new Response(text,{status:upstream.status,statusText:upstream.statusText,headers:responseHeaders});
    }
    return new Response(upstream.body,{status:upstream.status,statusText:upstream.statusText,headers:responseHeaders});
  }catch(error){console.error('Magnanimous Reels Worker proxy failed',String(error?.message||error));return Response.json({detail:'Magnanimous Reels is temporarily unavailable.',code:'MAGNANIMOUS_REELS_PROXY_UNAVAILABLE'},{status:502,headers:{'cache-control':'no-store'}});}
}
