import { currentUser } from './integrations.js';
import { isPlatformOwnerUser } from './agent-branch-intelligence.js';
import { inspectNativeEvidence, nativeInvestigationManifest } from './native-investigation-core.js';

function json(data,status=200){
  return Response.json(data,{status,headers:{'cache-control':'no-store'}});
}

async function ownerRequired(request,env){
  const user=await currentUser(request,env).catch(()=>null);
  if(!user||!await isPlatformOwnerUser(env,user))return null;
  return user;
}

export async function handleNativeInvestigation(request,env){
  const url=new URL(request.url);
  if(!url.pathname.startsWith('/api/magnanimous/investigation'))return null;

  const user=await ownerRequired(request,env);
  if(!user)return json({detail:'Platform owner access required.',code:'PLATFORM_OWNER_REQUIRED'},403);

  if(request.method==='GET'&&url.pathname==='/api/magnanimous/investigation'){
    return json({...nativeInvestigationManifest(),ownerAuthorized:true});
  }

  if(request.method==='POST'&&url.pathname==='/api/magnanimous/investigation/analyze'){
    const body=await request.json().catch(()=>null);
    if(!body||typeof body!=='object')return json({detail:'A JSON request body is required.'},400);
    if(body.authorized!==true)return json({detail:'Confirm that you own or are authorized to inspect this target.',code:'TARGET_AUTHORIZATION_REQUIRED'},400);
    try{
      const evidence=await inspectNativeEvidence({
        content:body.content,
        kind:String(body.kind||'text'),
        source:body.source,
        authorized:true
      });
      return json({ok:true,evidence,provider:'magnanimous-native'});
    }catch(error){
      const message=String(error?.message||error||'Inspection failed.');
      const status=/authorization|required|unsupported|text input|exceeds|invalid/i.test(message)?400:500;
      return json({detail:message},status);
    }
  }

  return json({detail:'Not found.'},404);
}
