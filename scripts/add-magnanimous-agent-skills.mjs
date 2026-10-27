import fs from 'node:fs';

const read=(p)=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);
function addAfter(text,anchor,addition,label){
  if(text.includes(addition.trim())) return text;
  if(!text.includes(anchor)) throw new Error(`Missing ${label} anchor`);
  return text.replace(anchor,anchor+addition);
}
function replaceOnce(text,from,to,label){
  if(text.includes(to)) return text;
  if(!text.includes(from)) throw new Error(`Missing ${label} anchor`);
  return text.replace(from,to);
}

const meshPath='worker/src/magnanimous-capability-mesh.js';
let mesh=read(meshPath);

// This historical migration runs on every PR. Once the native Agent Skills
// surface is installed, rerunning it must not depend on obsolete insertion
// anchors or overwrite newer Capability Mesh routes.
const alreadyInstalled=[
  "from './magnanimous-agent-skills.js'",
  "'skills.summary':{surface:'magnanimous-agent-skills'",
  "'skills.catalog':{surface:'magnanimous-agent-skills'",
  "'skills.resolve':{surface:'magnanimous-agent-skills'",
  "'skills.validate':{surface:'magnanimous-agent-skills'",
  "capability==='skills.summary'",
  "capability==='skills.validate'",
  'agent_skills:getMagnanimousAgentSkillsSummary()',
  'agent_skill_catalog:listMagnanimousAgentSkills',
  'source-available document skills'
].every(anchor=>mesh.includes(anchor));
if(alreadyInstalled){
  console.log('Magnanimous Agent Skills compatibility layer already installed; no changes necessary.');
  process.exit(0);
}

mesh=addAfter(
  mesh,
  "import { MAGNANIMOUS_NATIVE_TERMINAL_CAPABILITIES, getMagnanimousNativeTerminalSummary, handleMagnanimousNativeTerminal } from './magnanimous-native-terminal.js';\n",
  "import { MAGNANIMOUS_AGENT_SKILLS_POLICY, getMagnanimousAgentSkillsSummary, listMagnanimousAgentSkills, resolveMagnanimousAgentSkills, parseAgentSkillMarkdown } from './magnanimous-agent-skills.js';\n",
  'Agent Skills import'
);

mesh=replaceOnce(
  mesh,
  " 'mesh.self_check':{surface:'capability-mesh',mode:'read',native:true}\n});",
  " 'skills.summary':{surface:'magnanimous-agent-skills',mode:'read',native:true},\n 'skills.catalog':{surface:'magnanimous-agent-skills',mode:'read',native:true},\n 'skills.resolve':{surface:'magnanimous-agent-skills',mode:'read',native:true},\n 'skills.validate':{surface:'magnanimous-agent-skills',mode:'read-validate',native:true},\n 'mesh.self_check':{surface:'capability-mesh',mode:'read',native:true}\n});",
  'Agent Skills capability routes'
);

mesh=replaceOnce(
  mesh,
  "   universal_apps:apps\n  },",
  "   universal_apps:apps,\n   agent_skills:getMagnanimousAgentSkillsSummary()\n  },",
  'Agent Skills summary surface'
);

mesh=replaceOnce(
  mesh,
  " if(capability==='railway.deploy_exact'){",
  " if(capability==='skills.summary')return json({mesh:{capability,surface:def.surface,operator:'Magnanimous AI'},...getMagnanimousAgentSkillsSummary()});\n if(capability==='skills.catalog'){\n  return json({mesh:{capability,surface:def.surface,operator:'Magnanimous AI'},policy:MAGNANIMOUS_AGENT_SKILLS_POLICY,skills:listMagnanimousAgentSkills({query:input.query||'',limit:input.limit||100,includeInstructions:Boolean(input.include_instructions)})});\n }\n if(capability==='skills.resolve'){\n  const goal=clip(input.goal||input.query,12000);\n  if(!goal)return json({detail:'goal or query is required.'},400);\n  return json({mesh:{capability,surface:def.surface,operator:'Magnanimous AI'},goal,matches:resolveMagnanimousAgentSkills(goal,{limit:input.limit||5,includeInstructions:input.include_instructions!==false})});\n }\n if(capability==='skills.validate'){\n  const skillMd=clip(input.skill_md||input.source,160000);\n  if(!skillMd)return json({detail:'skill_md is required.'},400);\n  return json({mesh:{capability,surface:def.surface,operator:'Magnanimous AI'},...parseAgentSkillMarkdown(skillMd,{directoryName:clip(input.directory_name,80)})});\n }\n\n if(capability==='railway.deploy_exact'){",
  'Agent Skills runtime routes'
);

mesh=replaceOnce(
  mesh,
  "   universal_app_fabric:getUniversalCapabilityIndexSummary()\n  });",
  "   universal_app_fabric:getUniversalCapabilityIndexSummary(),\n   agent_skills:getMagnanimousAgentSkillsSummary(),\n   agent_skill_catalog:listMagnanimousAgentSkills({limit:200,includeInstructions:false})\n  });",
  'Agent Skills catalog exposure'
);

mesh=replaceOnce(
  mesh,
  "   'Real hardware, public IP space, Internet transit, registrar authority and other physical/regulated rails must exist somewhere.'\n  ]",
  "   'Real hardware, public IP space, Internet transit, registrar authority and other physical/regulated rails must exist somewhere.',\n   'Agent Skills compatibility uses the public SKILL.md standard and permissively licensed examples; Anthropic source-available document skills and proprietary Claude Code internals are not copied into Magnanimous.'\n  ]",
  'Agent Skills provenance boundary'
);

write(meshPath,mesh);

const checks=[
  [mesh.includes("from './magnanimous-agent-skills.js'"),'Agent Skills import'],
  [mesh.includes("'skills.resolve':{surface:'magnanimous-agent-skills'"),'skills.resolve route'],
  [mesh.includes("capability==='skills.validate'"),'skills.validate handler'],
  [mesh.includes('agent_skill_catalog:listMagnanimousAgentSkills'),'catalog exposure'],
  [mesh.includes('source-available document skills'),'license boundary']
];
for(const [ok,label] of checks) if(!ok) throw new Error(`Verification failed: ${label}`);
console.log('Magnanimous Agent Skills compatibility layer wired into Capability Mesh.');
