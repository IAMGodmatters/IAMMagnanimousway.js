function cleanBase(value=''){return String(value||'').trim().replace(/\/$/,'')}
function dataUriParts(value=''){
 const match=String(value||'').match(/^data:([^;]+);base64,(.+)$/s);
 return match?{content_type:match[1],base64:match[2]}:null;
}
export class MagnanimousImageGenerationBinding{
 constructor(env=process.env){this.env=env}
 get configured(){
  return Boolean(cleanBase(this.env.AUTOMATIC1111_BASE_URL)||cleanBase(this.env.MAGNANIMOUS_IMAGE_BASE_URL));
 }
 async generate(prompt,options={}){
  const safePrompt=String(prompt||'').trim().slice(0,4000);
  if(!safePrompt)throw new Error('Image prompt is required.');
  const automatic=cleanBase(this.env.AUTOMATIC1111_BASE_URL);
  if(automatic){
   const response=await fetch(automatic+'/sdapi/v1/txt2img',{
    method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({
     prompt:safePrompt,
     negative_prompt:String(options.negative_prompt||'text, letters, watermark, logo, low quality').slice(0,1200),
     steps:Math.max(1,Math.min(Number(options.steps||20),80)),
     width:Math.max(256,Math.min(Number(options.width||1024),2048)),
     height:Math.max(256,Math.min(Number(options.height||1024),2048)),
     seed:Number.isFinite(Number(options.seed))?Number(options.seed):-1
    })
   });
   const data=await response.json().catch(()=>({}));
   if(!response.ok)throw new Error(data?.detail||('Magnanimous local image rail returned HTTP '+response.status));
   const image=String(data?.images?.[0]||'');
   if(!image)throw new Error('Magnanimous local image rail returned no image.');
   return{image,content_type:'image/png',provider:'magnanimous-local-image',model:String(this.env.MAGNANIMOUS_IMAGE_MODEL||'local-stable-diffusion')};
  }

  const base=cleanBase(this.env.MAGNANIMOUS_IMAGE_BASE_URL);
  if(base){
   const headers={'content-type':'application/json'};
   if(this.env.MAGNANIMOUS_IMAGE_API_KEY)headers.authorization='Bearer '+this.env.MAGNANIMOUS_IMAGE_API_KEY;
   const response=await fetch(base+'/v1/images/generations',{
    method:'POST',headers,
    body:JSON.stringify({
     model:String(this.env.MAGNANIMOUS_IMAGE_MODEL||'magnanimous-image'),
     prompt:safePrompt,
     size:String(options.size||((options.width||1024)+'x'+(options.height||1024))),
     response_format:'b64_json'
    })
   });
   const data=await response.json().catch(()=>({}));
   if(!response.ok)throw new Error(data?.error?.message||data?.detail||('Magnanimous image rail returned HTTP '+response.status));
   let image=String(data?.data?.[0]?.b64_json||'');
   let contentType='image/png';
   const inline=dataUriParts(image);
   if(inline){image=inline.base64;contentType=inline.content_type}
   if(!image&&data?.data?.[0]?.url){
    const remote=await fetch(String(data.data[0].url));
    if(!remote.ok)throw new Error('Magnanimous image rail returned an unreadable image URL.');
    const bytes=Buffer.from(await remote.arrayBuffer());
    image=bytes.toString('base64');
    contentType=remote.headers.get('content-type')||contentType;
   }
   if(!image)throw new Error('Magnanimous image rail returned no image.');
   return{image,content_type:contentType,provider:'magnanimous-compatible-image',model:String(this.env.MAGNANIMOUS_IMAGE_MODEL||'magnanimous-image')};
  }

  throw new Error('No Magnanimous image-generation rail is configured. Configure AUTOMATIC1111_BASE_URL or MAGNANIMOUS_IMAGE_BASE_URL.');
 }
}
