// Optional paid GPU fallback policy. Free/browser execution remains the default.
export const GPU_FALLBACKS=[
{id:'runpod-community-4090',gpu:'RTX 4090',vram_gb:24,pricing:'market/on-demand',priority:10,endpoint_env:'RUNPOD_RENDER_ENDPOINT',key_env:'RUNPOD_RENDER_API_KEY'},
{id:'tensordock-4090',gpu:'RTX 4090',vram_gb:24,pricing:'market/on-demand',priority:20,endpoint_env:'TENSORDOCK_RENDER_ENDPOINT',key_env:'TENSORDOCK_RENDER_API_KEY'},
{id:'vast-4090',gpu:'RTX 4090',vram_gb:24,pricing:'marketplace',priority:30,endpoint_env:'VAST_RENDER_ENDPOINT',key_env:'VAST_RENDER_API_KEY'}];
export function configuredGpuFallbacks(env){return GPU_FALLBACKS.filter(x=>Boolean(env?.[x.endpoint_env]&&env?.[x.key_env])).sort((a,b)=>a.priority-b.priority)}
export function gpuFallbackPolicy(env){return{enabled:configuredGpuFallbacks(env).length>0,automatic_paid_use:false,providers:configuredGpuFallbacks(env).map(x=>({id:x.id,gpu:x.gpu,vram_gb:x.vram_gb})),rule:'Free browser/edge first. Paid GPU fallback requires an explicitly enabled billing/runtime policy.'}}
