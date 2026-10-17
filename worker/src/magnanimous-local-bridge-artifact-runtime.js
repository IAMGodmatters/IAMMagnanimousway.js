import { currentUser } from './integrations.js';
import { requirePlatformOwner } from './platform-owner-guard.js';

const PREFIX='/api/magnanimous/local-bridge/artifacts/';
const ALLOWED_ARTIFACTS=new Set(['install.ps1','uninstall.ps1','bridge_agent.py','ncs2_edge.py']);
const now=()=>Math.floor(Date.now()/1000);

async function sha(value){
 const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(String(value||'')));
 return [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('');
}

function decodeBase64(value){
 const raw=atob(String(value||''));
 const bytes=new Uint8Array(raw.length);
 for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
 return bytes;
}

async function pairingAuthorized(request,env){
 const code=String(request.headers.get('x-magnanimous-pairing-code')||'').trim();
 if(!code||code.length>200)return false;
 const codeHash=await sha(code);
 const row=await env.DB.prepare('SELECT id FROM magnanimous_local_bridge_pairings WHERE code_hash=? AND used_at IS NULL AND expires_at>=? LIMIT 1').bind(codeHash,now()).first();
 return Boolean(row?.id);
}

async function ownerAuthorized(request,env){
 const denied=await requirePlatformOwner(request,env);
 if(denied)return false;
 return Boolean(await currentUser(request,env));
}

export async function handleMagnanimousLocalBridgeArtifact(request,env){
 const url=new URL(request.url),path=url.pathname;
 if(!path.startsWith(PREFIX))return null;
 if(request.method!=='GET')return Response.json({detail:'Local Bridge artifacts are read-only.'},{status:405,headers:{allow:'GET','cache-control':'no-store'}});
 if(!env?.DB)return Response.json({detail:'Magnanimous Local Bridge artifact delivery requires D1.'},{status:503,headers:{'cache-control':'no-store'}});
 const name=decodeURIComponent(path.slice(PREFIX.length));
 if(!ALLOWED_ARTIFACTS.has(name)||name.includes('/'))return Response.json({detail:'Local Bridge artifact not found.'},{status:404,headers:{'cache-control':'no-store'}});

 let authorized=false;
 try{authorized=await pairingAuthorized(request,env)}catch(error){console.error('Local Bridge pairing artifact authorization failed',error)}
 if(!authorized){
  try{authorized=await ownerAuthorized(request,env)}catch(error){console.error('Local Bridge owner artifact authorization failed',error)}
 }
 if(!authorized)return Response.json({detail:'A valid platform-owner session or unexpired one-time Local Bridge pairing code is required.'},{status:401,headers:{'cache-control':'no-store'}});

 let artifact;
 try{
  artifact=await env.DB.prepare('SELECT name,content_base64,sha256,byte_length,media_type FROM magnanimous_local_bridge_artifacts WHERE name=? LIMIT 1').bind(name).first();
 }catch(error){
  console.error('Local Bridge artifact storage unavailable',error);
  return Response.json({detail:'Private Local Bridge artifacts are not available yet.'},{status:503,headers:{'cache-control':'no-store'}});
 }
 if(!artifact)return Response.json({detail:'Private Local Bridge artifact is not published.'},{status:404,headers:{'cache-control':'no-store'}});
 const body=decodeBase64(artifact.content_base64);
 if(Number(artifact.byte_length||0)!==body.byteLength)return Response.json({detail:'Private Local Bridge artifact integrity check failed.'},{status:503,headers:{'cache-control':'no-store'}});
 return new Response(body,{status:200,headers:{
  'content-type':String(artifact.media_type||'application/octet-stream'),
  'content-length':String(body.byteLength),
  'content-disposition':`attachment; filename="${name}"`,
  'cache-control':'no-store, private',
  'x-content-type-options':'nosniff',
  'cross-origin-resource-policy':'same-origin',
  'x-magnanimous-artifact-sha256':String(artifact.sha256||'')
 }});
}
