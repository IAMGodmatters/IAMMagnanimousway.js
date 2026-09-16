const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});

export async function handleMagnanimousTelecomSecurityGate(request){
 const url=new URL(request.url);
 if(request.method!=='POST'||url.pathname!=='/api/telecom/operations/service-orders')return null;
 const body=await request.clone().json().catch(()=>({}));
 const orderType=String(body.order_type||'').trim();
 if(['sim_swap','esim_swap'].includes(orderType)){
  const verificationReference=String(body.identity_verification_reference||'').trim();
  if(!verificationReference||body.confirm_sim_swap_security_review!==true){
   return json({detail:'SIM/eSIM swaps require a completed identity-verification reference and explicit security-review confirmation. Use /telecom/security.'},409);
  }
 }
 if(orderType==='port_out'){
  const authorizationReference=String(body.porting_authorization_reference||'').trim();
  if(!authorizationReference||body.confirm_port_out_authorization!==true){
   return json({detail:'Port-out requests require an authorization reference and explicit port-out confirmation. Use /telecom/security.'},409);
  }
 }
 return null;
}
