// Clean-room compatibility inspector for publicly documented coding-agent formats.
// This module NEVER loads plugins, runs commands, fetches URLs, or saves pasted source.
import {parseAgentSkillMarkdown} from './magnanimous-agent-skills.js';

const MAX_SOURCE=65536;
const MAX_SERVERS=32;
const MAX_RULE_LINES=500;
const KINDS=['cursor-rule','cursor-mcp','agent-skill'];
const isRecord=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const safeName=value=>typeof value==='string'&&/^[a-zA-Z0-9][\w.-]{0,79}$/.test(value);

export const MAGNANIMOUS_CODING_INTEROPERABILITY_POLICY=Object.freeze({
 brain:'Magnanimous AI',formats:KINDS,mode:'read-only-compatibility-review',
 provider_neutral:true,external_code_copied:false,install:false,execute:false,
 network:false,persistence:false,authorization:'existing-Magnanimous-gates',
 max_source_characters:MAX_SOURCE,max_mcp_servers:MAX_SERVERS
});

function result(kind){return{
  kind,accepted:false,errors:[],warnings:[],inventory:[],
  next_steps:[],policy:MAGNANIMOUS_CODING_INTEROPERABILITY_POLICY,
  installed:false,executed:false,connected:false,imported:false,
  private_data_returned:false
};}

function suspiciousInstructionWarnings(source){
 const checks=[
  [/\b(?:ignore|override|bypass|disable)\b.{0,45}\b(?:security|authorization|approval|audit|instructions|guardrails|confirmation)\b/i,'Potential policy-override instruction; human review required.'],
  [/\b(?:curl|wget)\b[^\n]{0,180}\|\s*(?:sh|bash)\b/i,'Shell-download execution pattern requires independent security review.'],
  [/\b(?:exfiltrat\w*|send)\b.{0,50}\b(?:secrets?|tokens?|credentials?)\b/i,'Potential secret disclosure instruction requires review.']
 ];
 return checks.filter(([pattern])=>pattern.test(source)).map(([,warning])=>warning);
}

function inspectRule(source,out){
 const lines=source.replace(/\r\n/g,'\n').split('\n');
 if(lines[0]?.trim()!=='---'){out.errors.push('Cursor rule must begin with --- frontmatter.');return;}
 const end=lines.findIndex((line,i)=>i>0&&line.trim()==='---');
 if(end<1||end>100){out.errors.push('Cursor rule has missing or excessive frontmatter.');return;}
 const meta=Object.create(null);
 for(const line of lines.slice(1,end)){
  if(!line.trim()||line.trim().startsWith('#'))continue;
  const pair=line.match(/^([a-zA-Z][\w-]*):\s*(.*?)\s*$/);
  if(!pair){out.errors.push('Rule frontmatter supports only simple key: value entries.');return;}
  if(Object.hasOwn(meta,pair[1])){out.errors.push('Duplicate rule metadata key.');return;}
  meta[pair[1]]=pair[2];
 }
 if(!lines.slice(end+1).join('\n').trim())out.errors.push('Rule body cannot be empty.');
 const ruleLines=lines.length-end-1;
 if(ruleLines>MAX_RULE_LINES)out.warnings.push('Large rule body; split into smaller scoped Magnanimous skills.');
 const always=meta.alwaysApply;
 if(always!==undefined&&!['true','false'].includes(always))out.errors.push('alwaysApply must be true or false.');
 const globs=String(meta.globs||'').replace(/^['"]|['"]$/g,'').trim();
 if(globs&&globs.length>512)out.errors.push('Rule glob declaration is too long.');
 if(!globs&&always!=='true')out.warnings.push('No file globs or alwaysApply: true; rule scope needs explicit owner review.');
 out.warnings.push(...suspiciousInstructionWarnings(source));
 out.inventory.push({type:'project-rule',scope:always==='true'?'all-project-context':globs?'file-patterns':'unscoped',
  file_pattern_count:globs?globs.split(',').filter(Boolean).length:0,
  instruction_lines:ruleLines,translation:'Magnanimous native Agent Skill or scoped instruction',status:'review-required'});
 out.next_steps.push('Map this rule to a Magnanimous-owned, version-controlled skill; manually review its instructions before enabling it.');
}

// Read-only classification; no DNS lookup or network request is performed.
function isPrivateOrLocalHost(hostname){
 const host=hostname.toLowerCase().replace(/\.$/,'').replace(/^\[|\]$/g,'');
 if(host==='localhost'||host.endsWith('.localhost'))return true;
 const privateIpv4=value=>{
  const parts=value.split('.');
  if(parts.length!==4||parts.some(p=>!/^\d{1,3}$/.test(p)||Number(p)>255))return false;
  const [a,b,c]=parts.map(Number);
  return a===0||a===10||a===127||(a===169&&b===254)||
   (a===172&&b>=16&&b<=31)||(a===192&&b===168)||
   (a===100&&b>=64&&b<=127)||(a===198&&(b===18||b===19))||
   (a===192&&b===0&&(c===0||c===2))||
   (a===198&&b===51&&c===100)||(a===203&&b===0&&c===113)||a>=224;
 };
 if(/^\d+\.\d+\.\d+\.\d+$/.test(host))return privateIpv4(host);
 if(!host.includes(':'))return false;
 if(host==='::'||host==='::1'||/^0(?::0){6}:(?:0|1)$/.test(host))return true;
 // URL normalization converts mapped dotted IPv4 to hex groups.
 const mapped=host.match(/(?:^|:)ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
 if(mapped){
  const high=parseInt(mapped[1],16),low=parseInt(mapped[2],16);
  return privateIpv4(`${high>>8}.${high&255}.${low>>8}.${low&255}`);
 }
 const dotted=host.match(/(?:^|:)ffff:(\d+\.\d+\.\d+\.\d+)$/);
 if(dotted)return privateIpv4(dotted[1]);
 const first=host.split(':').find(Boolean)||'0',prefix=Number.parseInt(first,16);
 if((prefix&0xfe00)===0xfc00||(prefix&0xffc0)===0xfe80||
    (prefix&0xffc0)===0xfec0||(prefix&0xff00)===0xff00)return true;
 return false;
}

function inspectMcp(source,out){
 let doc;
 try{doc=JSON.parse(source)}catch{out.errors.push('Invalid MCP JSON.');return;}
 if(!isRecord(doc)||!isRecord(doc.mcpServers)){
  out.errors.push('Expected a JSON object containing mcpServers.');return;
 }
 const names=Object.keys(doc.mcpServers);
 if(names.length>MAX_SERVERS){out.errors.push(`At most ${MAX_SERVERS} MCP server declarations may be reviewed at once.`);return;}
 if(!names.length)out.warnings.push('No MCP servers were declared.');
 for(const name of names){
  const config=doc.mcpServers[name];
  if(!safeName(name)||!isRecord(config)){
   out.errors.push('MCP server names must be short, safe identifiers with object configurations.');continue;
  }
  const hasCommand=typeof config.command==='string'&&config.command.trim().length>0;
  const hasUrl=typeof config.url==='string'&&config.url.trim().length>0;
  if(hasCommand===hasUrl){out.errors.push(`Server ${name}: declare exactly one of command or HTTPS url.`);continue;}
  if(hasUrl){
   let url;
   try{url=new URL(config.url)}catch{out.errors.push(`Server ${name}: invalid URL.`);continue;}
   if(url.protocol!=='https:'||url.username||url.password){out.errors.push(`Server ${name}: remote server must use credential-free HTTPS URL.`);continue;}
   if(isPrivateOrLocalHost(url.hostname)){
    out.errors.push(`Server ${name}: private or loopback endpoint requires separate local-only handling.`);continue;
   }
  }
  if(hasCommand&&(config.command.length>1024||!Array.isArray(config.args??[])||(config.args??[]).some(a=>typeof a!=='string'))){
   out.errors.push(`Server ${name}: invalid command configuration.`);continue;
  }
  if(config.env!==undefined&&!isRecord(config.env)){
   out.errors.push(`Server ${name}: env must be an object.`);continue;
  }
  if(config.env&&Object.values(config.env).some(v=>typeof v!=='string')){
   out.errors.push(`Server ${name}: env values must be strings.`);continue;
  }
  const secretFields=Boolean(config.env&&Object.keys(config.env).length);
  if(secretFields)out.warnings.push(`Server ${name}: environment variables were detected; use the owner secret vault, never pasted values.`);
  if(hasCommand)out.warnings.push(`Server ${name}: local process execution requires trusted installation, least privilege and explicit approval.`);
  out.inventory.push({name,type:'mcp-server',transport:hasCommand?'local-command':'remote-https',
   environment_fields:config.env?Object.keys(config.env).length:0,
   recommended_adapter:'Magnanimous Capability Mesh / MCP',status:'not-connected-review-required'});
 }
 out.next_steps.push('Review server provenance, license, OAuth/scopes, tenant boundaries and variable costs; register only through existing approved MCP connection controls.');
}

function inspectSkill(source,out){
 const parsed=parseAgentSkillMarkdown(source);
 out.errors.push(...parsed.errors);
 out.warnings.push(...parsed.warnings,...suspiciousInstructionWarnings(source));
 if(parsed.metadata?.name){
  out.inventory.push({name:parsed.metadata.name,type:'agent-skill',instruction_lines:parsed.line_count||0,
   translation:'Existing Magnanimous Agent Skills compatibility core',status:'review-required'});
 }
 out.next_steps.push('Review licensing, scripts, references, permissions and expected actions before a separately approved skill import.');
}

export function inspectMagnanimousCodingArtifact({kind,source}={}){
 const out=result(kind);
 if(!KINDS.includes(kind)){out.errors.push('Unsupported coding artifact format.');return out;}
 if(typeof source!=='string'||!source.trim()){
  out.errors.push('Paste a nonempty text artifact for review.');return out;
 }
 if(source.length>MAX_SOURCE){out.errors.push(`Artifact exceeds ${MAX_SOURCE} characters.`);return out;}
 if(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(source)){
  out.errors.push('Artifact contains control characters.');return out;
 }
 if(kind==='cursor-rule')inspectRule(source,out);
 else if(kind==='cursor-mcp')inspectMcp(source,out);
 else inspectSkill(source,out);
 out.accepted=out.errors.length===0;
 return out;
}
