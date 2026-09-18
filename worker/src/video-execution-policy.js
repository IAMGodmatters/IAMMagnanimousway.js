// Zero-cost-first execution policy for Magnanimous Video Agents.
export const EXECUTION_TIERS=[
{id:'browser-lite',cost:'free',requires_gpu:false,features:['webrtc','audio-analysis','viseme-mouth-shapes','blink','gaze','head-motion','idle-motion','canvas-webgl-avatar']},
{id:'edge-assisted',cost:'free-allowance-first',requires_gpu:false,features:['vad','speech-routing','session-orchestration','asset-cache','adaptive-quality']},
{id:'native-gpu',cost:'optional',requires_gpu:true,features:['neural-lipsync','photoreal-face-render','super-resolution','high-fidelity-expressions']}
];
export function chooseVideoExecution({nativeGpu=false,edgeAvailable=true,preferFree=true,quality='balanced'}={}){
 if(nativeGpu&&!preferFree)return{tier:'native-gpu',reason:'High-fidelity GPU rendering requested and available.'};
 if(edgeAvailable)return{tier:'edge-assisted',reason:'Use available edge/free allowance and browser rendering before paid GPU.'};
 return{tier:'browser-lite',reason:'Run the local browser animation pipeline without dedicated GPU infrastructure.'};
}
export function browserAvatarConfig(){return{renderer:'webgl-canvas',audioReactive:true,visemes:true,blink:true,gaze:true,headMotion:true,idleMotion:true,interruptible:true,network:'webrtc',label:'AI-generated video agent'};}
