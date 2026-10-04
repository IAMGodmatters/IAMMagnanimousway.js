import http from 'node:http';

const REELS_PREFIX='/reels';
const REELS_ORIGIN='https://lja74zv1.basicdeploy.com';
const originalCreateServer=http.createServer.bind(http);

function isReelsPath(pathname){
  return pathname===REELS_PREFIX||pathname===REELS_PREFIX+'/'||pathname.startsWith(REELS_PREFIX+'/');
}

function upstreamPath(url){
  let pathname=url.pathname.slice(REELS_PREFIX.length)||'/';
  if(!pathname.startsWith('/'))pathname='/'+pathname;
  return pathname+url.search;
}

async function readBody(req,maxBytes=10*1024*1024){
  const chunks=[];
  let total=0;
  for await(const chunk of req){
    const b=Buffer.from(chunk);
    total+=b.length;
    if(total>maxBytes)throw new Error('Magnanimous Reels proxy body exceeds limit.');
    chunks.push(b);
  }
  return Buffer.concat(chunks);
}

function prefixedPath(value){
  if(typeof value!=='string'||!value.startsWith('/'))return value;
  if(value===REELS_PREFIX||value.startsWith(REELS_PREFIX+'/'))return value;
  return REELS_PREFIX+value;
}

function rewriteText(text,contentType){
  if(contentType.includes('application/manifest+json')||contentType.includes('application/json')){
    try{
      const data=JSON.parse(text);
      if(data&&typeof data==='object'&&('start_url'in data||'scope'in data)){
        data.start_url=REELS_PREFIX+'/';
        data.scope=REELS_PREFIX+'/';
        if(Array.isArray(data.icons))data.icons=data.icons.map(icon=>icon&&typeof icon==='object'?{...icon,src:prefixedPath(icon.src)}:icon);
        if(Array.isArray(data.screenshots))data.screenshots=data.screenshots.map(item=>item&&typeof item==='object'?{...item,src:prefixedPath(item.src)}:item);
        return JSON.stringify(data);
      }
    }catch{}
    return text;
  }

  const roots=[
    '/api/','/assets/','/audio/','/timings/',
    '/creator-audio/','/creator-timings/','/ambient/','/series-video/',
    '/creator.js','/series.js','/manifest.webmanifest','/sw.js'
  ];
  let out=text;
  for(const root of roots){
    const replacement=REELS_PREFIX+root;
    out=out.split(`'${root}`).join(`'${replacement}`);
    out=out.split(`\"${root}`).join(`\"${replacement}`);
    out=out.split(`href=${root}`).join(`href=${replacement}`);
    out=out.split(`src=${root}`).join(`src=${replacement}`);
  }
  if(contentType.includes('javascript')){
    out=out.replaceAll("addAll(['/','/reels/api/stories','/reels/manifest.webmanifest'])", "addAll(['/reels/','/reels/api/stories','/reels/manifest.webmanifest'])");
    out=out.replaceAll("const CORE=['/','/reels/manifest.webmanifest'", "const CORE=['/reels/','/reels/manifest.webmanifest'");
  }
  return out;
}

function removeUpstreamHostBranding(html){
  let out=html;
  out=out.replace(/<style>body\{padding-bottom:2\.6em\}<\/style>/gi,'');
  out=out.replace(/<div[^>]*>This app is user-hosted on[\s\S]*?Report abuse<\/a><\/div>/gi,'');
  out=out.replace(/<meta[^>]+(?:BasicDeploy|basicdeploy\.com|lja74zv1\.basicdeploy\.com)[^>]*>/gi,'');
  return out;
}

async function proxyReels(req,res){
  const incoming=new URL(req.url||REELS_PREFIX,'https://iammagnanimousway.com');
  const target=new URL(upstreamPath(incoming),REELS_ORIGIN);
  const headers=new Headers();
  for(const [key,value] of Object.entries(req.headers)){
    if(value==null)continue;
    if(['host','content-length','connection','transfer-encoding'].includes(key.toLowerCase()))continue;
    headers.set(key,Array.isArray(value)?value.join(', '):String(value));
  }
  headers.set('x-forwarded-host','iammagnanimousway.com');
  headers.set('x-forwarded-proto','https');
  headers.set('x-magnanimous-surface','reels');

  const init={method:req.method,headers,redirect:'manual'};
  if(!['GET','HEAD'].includes(req.method||'GET'))init.body=await readBody(req);

  const upstream=await fetch(target,init);
  const responseHeaders=new Headers(upstream.headers);
  responseHeaders.delete('content-length');
  responseHeaders.delete('content-encoding');
  responseHeaders.delete('server');
  responseHeaders.delete('via');
  responseHeaders.delete('x-powered-by');
  responseHeaders.delete('x-frame-options');
  responseHeaders.delete('content-security-policy');
  responseHeaders.set('x-magnanimous-surface','reels');
  responseHeaders.set('x-magnanimous-nickname','Magnanimous Reels');
  responseHeaders.set('link','<https://iammagnanimousway.com/reels>; rel="canonical"');

  let body=Buffer.from(await upstream.arrayBuffer());
  const type=String(responseHeaders.get('content-type')||'').toLowerCase();
  if(type.includes('text/html')||type.includes('javascript')||type.includes('application/json')||type.includes('manifest')){
    let text=body.toString('utf8');
    if(type.includes('text/html'))text=removeUpstreamHostBranding(text);
    text=rewriteText(text,type);
    if(type.includes('text/html')){
      text=text.replace(/<title>[^<]*<\/title>/i,'<title>Magnanimous Reels</title>');
      text=text.replace('</head>','<meta name="application-name" content="Magnanimous Reels"><meta name="robots" content="index,follow,max-image-preview:large,max-video-preview:-1"><link rel="canonical" href="https://iammagnanimousway.com/reels"></head>');
    }
    body=Buffer.from(text);
  }

  res.statusCode=upstream.status;
  for(const [key,value] of responseHeaders)res.setHeader(key,value);
  res.setHeader('content-length',String(body.length));
  if(req.method==='HEAD')return res.end();
  res.end(body);
}

http.createServer=function patchedCreateServer(...args){
  const listener=typeof args[0]==='function'?args[0]:typeof args[1]==='function'?args[1]:null;
  if(!listener)return originalCreateServer(...args);
  const wrapped=async(req,res)=>{
    try{
      const pathname=new URL(req.url||'/','http://local').pathname;
      if(isReelsPath(pathname)){
        await proxyReels(req,res);
        return;
      }
    }catch(error){
      console.error('Magnanimous Reels branded-route proxy failed',String(error?.message||error));
      if(!res.headersSent){
        res.statusCode=502;
        res.setHeader('content-type','application/json; charset=utf-8');
        res.setHeader('cache-control','no-store');
        res.end(JSON.stringify({detail:'Magnanimous Reels is temporarily unavailable.',code:'MAGNANIMOUS_REELS_PROXY_UNAVAILABLE'}));
        return;
      }
    }
    return listener(req,res);
  };
  if(typeof args[0]==='function')return originalCreateServer(wrapped);
  return originalCreateServer(args[0],wrapped);
};

console.log('Magnanimous branded route ready: Magnanimous Reels at /reels');
