import fs from 'node:fs';

const path='frontend/app/ai-video/page.tsx';
let text=fs.readFileSync(path,'utf8');
let changed=false;

function replaceOnce(from,to,label){
  if(text.includes(to)) return;
  if(!text.includes(from)) throw new Error(`${label}: expected source not found`);
  text=text.replace(from,to);
  changed=true;
}

replaceOnce(
  " const [videoUrl,setVideoUrl]=useState('');\n const [storyboard,setStoryboard]=useState<Storyboard>({});",
  " const [videoUrl,setVideoUrl]=useState('');\n const [videoExt,setVideoExt]=useState<'mp4'|'webm'>('webm');\n const [storyboard,setStoryboard]=useState<Storyboard>({});",
  'video extension state'
);

replaceOnce(
  "   const next=URL.createObjectURL(result);setVideoUrl(next);setStage('Motion picture ready');",
  "   setVideoExt(result.type.toLowerCase().includes('mp4')?'mp4':'webm');\n   const next=URL.createObjectURL(result);setVideoUrl(next);setStage('Motion picture ready');",
  'mime-derived extension'
);

replaceOnce(
  "download={`magnanimous-ai-${Date.now()}.webm`}",
  "download={`magnanimous-ai-${Date.now()}.${videoExt}`}",
  'download filename extension'
);

if(changed){
  fs.writeFileSync(path,text);
  console.log('AI video export extension repaired.');
}else{
  console.log('AI video export extension already correct.');
}
