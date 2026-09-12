import fs from 'node:fs';

const checks=[];
const fail=[];
const read=(p)=>fs.existsSync(p)?fs.readFileSync(p,'utf8'):'';
const must=(ok,msg)=>{(ok?checks:fail).push(msg)};
const branch=read('worker/src/agent-branch-intelligence.js');
const wrapper=read('worker/src/branch-consent-entrypoint.js');
const voice=read('frontend/app/voice-orchestrator.tsx');
const wrangler=read('worker/wrangler.jsonc');

must(branch.includes('export function branchProfile'),'branch profile generator exists');
must(branch.includes('agent_branch_knowledge'),'branch-specific knowledge store exists');
must(branch.includes('export async function teachBranch'),'developer/workspace teaching path exists');
must(branch.includes('specialized branch of Magnanimous AI'),'specialists remain branches of Magnanimous core');
must(wrapper.includes("url.pathname==='/api/agents/branch/teach'"),'branch teaching endpoint is active');
must(wrapper.includes('branchKnowledgeContext(profile,knowledge)'),'branch curriculum is injected into specialist conversations');
must(wrapper.includes('spokenAgent(original,agents)'),'backend recognizes a spoken specialist name');
must(wrapper.includes('spoken_name_routing:Boolean(named)'),'spoken-name routing is exposed for QA');
must(wrapper.includes('const {provider,provider_name,model,...publicData}=data'),'specialist public response hides engine/model identity');
must(voice.includes('function routeNamedAgent'),'browser voice recognizes named specialists');
must(voice.includes("path==='/agents'"),'voice controls support the Agent Mesh page');
must(voice.includes('applyVoiceProfile(utterance,currentPersona())'),'specialist voices remain persona-specific');
must(wrangler.includes('"main": "src/branch-consent-entrypoint.js"'),'production Worker enters through the specialist branch layer');

console.log(`Specialist branch lock: ${checks.length} checks passed.`);
if(fail.length){console.error(`Specialist branch lock failed (${fail.length})`);for(const item of fail)console.error(`- ${item}`);process.exit(1)}
console.log('Magnanimous specialist branches: LOCKED');
