/* Magnanimous-owned structured graphics renderer.
 * Draws allow-listed scene data only. It never executes model-generated HTML or JavaScript.
 */
'use client';

import {PointerEvent,WheelEvent,useEffect,useRef,useState} from 'react';
import styles from './visual-stage.module.css';

export type GraphicNode={
  id:string;
  label:string;
  detail?:string;
  x:number;
  y:number;
  kind?:'input'|'process'|'decision'|'output'|'note';
};
export type GraphicEdge={from:string;to:string;label?:string};
export type GraphicObject={
  id:string;
  shape:'cube'|'sphere'|'cylinder'|'cone';
  label:string;
  position:[number,number,number];
  scale:[number,number,number];
  color:string;
};
export type GraphicScene={
  kind:'diagram'|'3d_scene';
  title:string;
  description:string;
  nodes:GraphicNode[];
  edges:GraphicEdge[];
  objects:GraphicObject[];
};

type Props={scene:GraphicScene};

type Vec3=[number,number,number];
type Point2={x:number;y:number;z:number};

const DEFAULT_ROTATION={x:-0.35,y:0.55};
const COLORS={background:'#061018',grid:'#17303b',text:'#eafaff',muted:'#86a6b2',accent:'#63e8c2',line:'#4eb8c5'};

function safeColor(value:string){
  return /^#[0-9a-f]{6}$/i.test(value)?value:'#65d9ef';
}

function project(point:Vec3,width:number,height:number,rotation:{x:number;y:number}):Point2{
  const [x0,y0,z0]=point;
  const cy=Math.cos(rotation.y),sy=Math.sin(rotation.y);
  const cx=Math.cos(rotation.x),sx=Math.sin(rotation.x);
  const x=x0*cy-z0*sy;
  const z=x0*sy+z0*cy;
  const y=y0*cx-z*sx;
  const depth=y0*sx+z*cx;
  const camera=4.4;
  const denominator=Math.max(1.3,camera-depth);
  const focal=Math.min(width,height)*0.88;
  return{x:width/2+x*focal/denominator,y:height/2-y*focal/denominator,z:depth};
}

function shapeGeometry(shape:GraphicObject['shape']):{vertices:Vec3[];edges:[number,number][]}{
  if(shape==='cube'){
    const vertices:Vec3[]=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]];
    const edges:[number,number][]=[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
    return{vertices,edges};
  }
  const segments=18;
  const vertices:Vec3[]=[];
  const edges:[number,number][]=[];
  if(shape==='sphere'){
    const rings=8;
    for(let r=1;r<rings;r++){
      const phi=Math.PI*r/rings;
      for(let i=0;i<segments;i++){
        const theta=2*Math.PI*i/segments;
        vertices.push([Math.sin(phi)*Math.cos(theta),Math.cos(phi),Math.sin(phi)*Math.sin(theta)]);
      }
    }
    for(let r=0;r<rings-1;r++)for(let i=0;i<segments;i++){
      const current=r*segments+i,next=r*segments+(i+1)%segments;
      edges.push([current,next]);
      if(r<rings-2)edges.push([current,(r+1)*segments+i]);
    }
    const north=vertices.length;vertices.push([0,1,0]);
    const south=vertices.length;vertices.push([0,-1,0]);
    for(let i=0;i<segments;i++){edges.push([north,i]);edges.push([south,(rings-2)*segments+i]);}
    return{vertices,edges};
  }
  for(let i=0;i<segments;i++){
    const theta=2*Math.PI*i/segments;
    vertices.push([Math.cos(theta),-1,Math.sin(theta)]);
    vertices.push([Math.cos(theta),1,Math.sin(theta)]);
    edges.push([2*i,2*((i+1)%segments)]);
    edges.push([2*i+1,2*((i+1)%segments)+1]);
    edges.push([2*i,2*i+1]);
  }
  if(shape==='cone'){
    const apex=vertices.length;vertices.push([0,1.35,0]);
    for(let i=0;i<segments;i++)edges.push([2*i+1,apex]);
  }
  return{vertices,edges};
}

function roundRect(context:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number){
  const radius=Math.min(r,w/2,h/2);
  context.beginPath();
  context.moveTo(x+radius,y);
  context.arcTo(x+w,y,x+w,y+h,radius);
  context.arcTo(x+w,y+h,x,y+h,radius);
  context.arcTo(x,y+h,x,y,radius);
  context.arcTo(x,y,x+w,y,radius);
  context.closePath();
}

function wrapText(context:CanvasRenderingContext2D,text:string,x:number,y:number,maxWidth:number,lineHeight:number,maxLines:number){
  const words=String(text||'').split(/\s+/);
  let line='',lineIndex=0;
  for(const word of words){
    const next=line?line+' '+word:word;
    if(context.measureText(next).width>maxWidth&&line){
      context.fillText(line,x,y+lineIndex*lineHeight);
      line=word;lineIndex++;
      if(lineIndex>=maxLines-1)break;
    }else line=next;
  }
  if(line&&lineIndex<maxLines)context.fillText(line,x,y+lineIndex*lineHeight);
}

export function VisualStage({scene}:Props){
  const canvasRef=useRef<HTMLCanvasElement|null>(null);
  const dragRef=useRef<{pointerId:number;x:number;y:number}|null>(null);
  const [rotation,setRotation]=useState(DEFAULT_ROTATION);
  const [zoom,setZoom]=useState(1);

  useEffect(()=>{
    const canvas=canvasRef.current;
    if(!canvas)return;
    const bounds=canvas.getBoundingClientRect();
    const dpr=Math.min(1.5,window.devicePixelRatio||1);
    const width=Math.max(320,Math.round(bounds.width*dpr));
    const height=Math.max(250,Math.round(Math.max(280,bounds.width*0.54)*dpr));
    canvas.width=width;canvas.height=height;
    const context=canvas.getContext('2d');
    if(!context)return;
    context.setTransform(1,0,0,1,0,0);
    context.fillStyle=COLORS.background;
    context.fillRect(0,0,width,height);

    const gradient=context.createRadialGradient(width*.52,height*.46,10,width*.52,height*.46,width*.72);
    gradient.addColorStop(0,'#102936');
    gradient.addColorStop(1,'#040b11');
    context.fillStyle=gradient;
    context.fillRect(0,0,width,height);

    if(scene.kind==='diagram'){
      const map=new Map(scene.nodes.map(node=>[node.id,node]));
      const point=(node:GraphicNode)=>({x:Math.max(.05,Math.min(.95,node.x))*width,y:Math.max(.1,Math.min(.9,node.y))*height});
      context.lineWidth=Math.max(1.5,dpr*1.6);
      for(const edge of scene.edges){
        const from=map.get(edge.from),to=map.get(edge.to);
        if(!from||!to)continue;
        const a=point(from),b=point(to);
        const angle=Math.atan2(b.y-a.y,b.x-a.x);
        context.strokeStyle=COLORS.line;context.fillStyle=COLORS.line;
        context.beginPath();context.moveTo(a.x,a.y);context.lineTo(b.x,b.y);context.stroke();
        const tip=10*dpr;
        context.beginPath();
        context.moveTo(b.x,b.y);
        context.lineTo(b.x-tip*Math.cos(angle-.42),b.y-tip*Math.sin(angle-.42));
        context.lineTo(b.x-tip*Math.cos(angle+.42),b.y-tip*Math.sin(angle+.42));
        context.closePath();context.fill();
        if(edge.label){
          context.font=`600 ${11*dpr}px system-ui`;
          context.textAlign='center';context.fillStyle=COLORS.muted;
          context.fillText(edge.label,(a.x+b.x)/2,(a.y+b.y)/2-9*dpr);
        }
      }
      for(const node of scene.nodes){
        const p=point(node),w=Math.min(width*.36,220*dpr),h=72*dpr;
        const x=Math.max(8*dpr,Math.min(width-w-8*dpr,p.x-w/2)),y=Math.max(8*dpr,Math.min(height-h-8*dpr,p.y-h/2));
        const color=node.kind==='input'?'#7bcdff':node.kind==='output'?'#83efbf':node.kind==='decision'?'#edca84':COLORS.accent;
        context.fillStyle='#0b1d27';context.strokeStyle=color;context.lineWidth=2*dpr;
        roundRect(context,x,y,w,h,12*dpr);context.fill();context.stroke();
        context.fillStyle=color;context.font=`700 ${13*dpr}px system-ui`;context.textAlign='left';
        wrapText(context,node.label,x+12*dpr,y+25*dpr,w-24*dpr,16*dpr,2);
        context.fillStyle=COLORS.muted;context.font=`400 ${10*dpr}px system-ui`;
        if(node.detail)wrapText(context,node.detail,x+12*dpr,y+51*dpr,w-24*dpr,13*dpr,1);
      }
    }else{
      context.strokeStyle='rgba(89,155,177,.15)';context.lineWidth=1*dpr;
      for(let i=0;i<9;i++){
        const y=height*.68+i*i*1.7*dpr;
        context.beginPath();context.moveTo(0,y);context.lineTo(width,y);context.stroke();
      }
      const objects=scene.objects.length?scene.objects:[{id:'main',shape:'cube' as const,label:'3D object',position:[0,0,0] as [number,number,number],scale:[1,1,1] as [number,number,number],color:'#66d8ee'}];
      for(const object of objects){
        const geometry=shapeGeometry(object.shape);
        const scale=object.scale.map(value=>Math.max(.1,Math.min(2.2,value))) as Vec3;
        const position=object.position.map(value=>Math.max(-2.0,Math.min(2.0,value))) as Vec3;
        const projected=geometry.vertices.map(vertex=>project([
          vertex[0]*scale[0]*zoom+position[0],
          vertex[1]*scale[1]*zoom+position[1],
          vertex[2]*scale[2]*zoom+position[2]
        ],width,height,rotation));
        const color=safeColor(object.color);
        context.strokeStyle=color;context.lineWidth=1.8*dpr;context.shadowColor=color;context.shadowBlur=7*dpr;
        for(const [a,b] of geometry.edges){
          const start=projected[a],end=projected[b];
          if(!start||!end)continue;
          context.globalAlpha=Math.max(.22,Math.min(.95,1-(start.z+end.z+4)/14));
          context.beginPath();context.moveTo(start.x,start.y);context.lineTo(end.x,end.y);context.stroke();
        }
        context.globalAlpha=1;context.shadowBlur=0;context.fillStyle=color;
        const center=project([position[0],position[1]+scale[1]+.22,position[2]],width,height,rotation);
        context.font=`700 ${13*dpr}px system-ui`;context.textAlign='center';
        context.fillText(object.label||object.id,center.x,center.y);
      }
      context.fillStyle='rgba(139,183,198,.75)';context.font=`500 ${10*dpr}px system-ui`;context.textAlign='left';
      context.fillText('DRAG TO ROTATE  Â·  SCROLL TO ZOOM',16*dpr,height-18*dpr);
    }
  },[scene,rotation,zoom]);

  function pointerDown(event:PointerEvent<HTMLCanvasElement>){
    if(scene.kind!=='3d_scene')return;
    dragRef.current={pointerId:event.pointerId,x:event.clientX,y:event.clientY};
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function pointerMove(event:PointerEvent<HTMLCanvasElement>){
    const drag=dragRef.current;
    if(!drag||drag.pointerId!==event.pointerId)return;
    const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
    dragRef.current={...drag,x:event.clientX,y:event.clientY};
    setRotation(value=>({x:Math.max(-1.35,Math.min(1.35,value.x+dy*.008)),y:value.y+dx*.008}));
  }
  function pointerUp(event:PointerEvent<HTMLCanvasElement>){
    if(dragRef.current?.pointerId===event.pointerId)dragRef.current=null;
  }
  function wheel(event:WheelEvent<HTMLCanvasElement>){
    if(scene.kind!=='3d_scene')return;
    event.preventDefault();
    setZoom(value=>Math.max(.45,Math.min(2.2,value*(event.deltaY>0?.92:1.08))));
  }

  return <section className={styles.stage} aria-label="Magnanimous generated visual explanation">
    <div className={styles.heading}>
      <div><small>{scene.kind==='3d_scene'?'INTERACTIVE 3D SCENE':'LIVE DIAGRAM'}</small><h3>{scene.title||'Magnanimous visual explanation'}</h3>{scene.description&&<p>{scene.description}</p>}</div>
      {scene.kind==='3d_scene'&&<div className={styles.viewControls} role="group" aria-label="3D scene controls">
        <button type="button" onClick={()=>setRotation(value=>({...value,y:value.y-.18}))} aria-label="Rotate left">↶</button>
        <button type="button" onClick={()=>setRotation(value=>({...value,y:value.y+.18}))} aria-label="Rotate right">↷</button>
        <button type="button" onClick={()=>setRotation(value=>({...value,x:Math.max(-1.35,value.x-.14)}))} aria-label="Tilt up">↑</button>
        <button type="button" onClick={()=>setRotation(value=>({...value,x:Math.min(1.35,value.x+.14)}))} aria-label="Tilt down">↓</button>
        <button type="button" onClick={()=>setZoom(value=>Math.min(2.2,value*1.12))} aria-label="Zoom in">+</button>
        <button type="button" onClick={()=>setZoom(value=>Math.max(.45,value/1.12))} aria-label="Zoom out">−</button>
        <button type="button" onClick={()=>{setRotation(DEFAULT_ROTATION);setZoom(1)}}>Reset view</button>
      </div>}
    </div>
    <canvas ref={canvasRef} className={styles.canvas} role="img" aria-label={scene.description||scene.title||'Generated interactive diagram'} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} onWheel={wheel}/>
    {scene.kind==='3d_scene'&&<p className={styles.hint}>Use one finger or your mouse to rotate the scene. Scroll or pinch to zoom.</p>}
    {scene.kind==='diagram'&&scene.nodes.length>0&&<ul className={styles.legend}>{scene.nodes.slice(0,8).map(node=><li key={node.id}><b>{node.label}</b>{node.detail&&<span>{node.detail}</span>}</li>)}</ul>}
    {scene.kind==='3d_scene'&&scene.objects.length>0&&<ul className={styles.legend}>{scene.objects.map(object=><li key={object.id}><b>{object.label}</b><span>{object.shape} · position {object.position.map(value=>Number(value.toFixed(1))).join(', ')}</span></li>)}</ul>}
  </section>;
}
