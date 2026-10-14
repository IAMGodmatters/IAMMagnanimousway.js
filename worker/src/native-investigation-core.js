const ALLOWED_KINDS=new Set(['javascript','json','text','sourcemap']);
const MAX_BYTES=1024*1024;

function toHex(buffer){
  return [...new Uint8Array(buffer)].map(byte=>byte.toString(16).padStart(2,'0')).join('');
}

function normalizeSource(value){
  const source=String(value||'user-paste').trim().slice(0,200);
  return source||'user-paste';
}

export async function inspectNativeEvidence({content,kind='text',source='user-paste',authorized=false}={}){
  if(authorized!==true)throw new Error('Target authorization required');
  if(!ALLOWED_KINDS.has(kind))throw new Error('Unsupported inspection type');
  if(typeof content!=='string')throw new TypeError('Text input required');
  const encoded=new TextEncoder().encode(content);
  if(encoded.byteLength>MAX_BYTES)throw new Error('Input exceeds 1 MiB');
  const digest=await crypto.subtle.digest('SHA-256',encoded);
  const lines=content.split(/\r?\n/);
  const indicators=[];
  const patterns=[
    ['import',/\bimport\s*(?:\(|[{'*"\w])/],
    ['export',/\bexport\s+(?:default|const|let|var|function|class|\{)/],
    ['function',/\b(?:async\s+)?function\s+[A-Za-z_$]/],
    ['class',/\bclass\s+[A-Za-z_$]/],
    ['network-reference',/\b(?:fetch|XMLHttpRequest|WebSocket|EventSource)\s*\(/],
    ['storage-reference',/\b(?:localStorage|sessionStorage|indexedDB)\b/],
    ['authentication-reference',/\b(?:authorization|bearer|session|oauth|token)\b/i],
    ['endpoint-reference',/\/(?:api|v\d+)\/[A-Za-z0-9_./?=&-]+/],
    ['source-map-reference',/sourceMappingURL\s*=/]
  ];
  lines.forEach((line,index)=>{
    for(const [type,pattern] of patterns){
      if(pattern.test(line))indicators.push({line:index+1,type,classification:'static-inference'});
    }
  });
  let jsonShape=null;
  if(kind==='json'||kind==='sourcemap'){
    try{
      const parsed=JSON.parse(content);
      jsonShape={valid:true,topLevel:Array.isArray(parsed)?'array':typeof parsed,keys:parsed&&typeof parsed==='object'&&!Array.isArray(parsed)?Object.keys(parsed).slice(0,50):[]};
    }catch(error){jsonShape={valid:false,error:'Invalid JSON'};}
  }
  return {
    schemaVersion:2,
    source:normalizeSource(source),
    kind,
    bytes:encoded.byteLength,
    sha256:toHex(digest),
    lineCount:lines.length,
    indicators:indicators.slice(0,300),
    summary:{indicatorCount:Math.min(indicators.length,300),types:[...new Set(indicators.map(item=>item.type))]},
    jsonShape,
    executionPerformed:false,
    networkAccessPerformed:false,
    evidenceClassification:'static-analysis',
    generatedAt:new Date().toISOString()
  };
}

export function nativeInvestigationManifest(){
  return {
    service:'magnanimous-native-investigation',
    status:'ready',
    mode:'free-first-static',
    limits:{maxBytes:MAX_BYTES,kinds:[...ALLOWED_KINDS]},
    guarantees:{executesTarget:false,fetchesTarget:false,uploadsToThirdParty:false},
    providers:[
      {id:'magnanimous-native',name:'Magnanimous Native Inspector',status:'ready',cost:'free'},
      {id:'rea',name:'REA local analysis adapter',status:'optional-local-provider',cost:'free-open-source',enabled:false}
    ]
  };
}
