import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');

const single=read('worker/src/magnanimous-single-brain-contract.js');
const universal=read('worker/src/magnanimous-universal-capabilities.js');
const provider=read('worker/src/provider-entrypoint.js');
const branch=read('worker/src/branch-consent-entrypoint.js');
const mesh=read('worker/src/agent-mesh-runtime.js');
const agents=read('frontend/app/agents/page.tsx');
const video=read('frontend/app/agent-video/page.tsx');
const assistant=read('frontend/app/virtual-assistant/page.tsx');
const business=read('frontend/app/business/page.tsx');
const social=read('frontend/app/social-media/page.tsx');
const apps=read('frontend/app/ai-apps/page.tsx');
const start=read('frontend/app/start/page.tsx');
const videoStudio=read('frontend/app/video-studio/page.tsx');
const brain=read('frontend/app/magnanimous-brain/page.tsx');
const connectors=read('frontend/app/ai-connectors/page.tsx');
const deployWorkflow=read('.github/workflows/deploy.yml');

for(const needle of [
 "public_ai_identity:'Magnanimous AI'",
 "public_specialist_identity:'Magnanimous AI specialist departments'",
 "orchestration_owner:'Magnanimous AI'",
 "memory_owner:'Magnanimous AI'",
 "public_provider_selection:false",
 "public_model_selection:false",
 "provider_names_owner_only:true",
 "native_growth_rule:",
 "getMagnanimousSingleBrainSummary",
 "magnanimousPublicRoutingSummary"
]) assert(single.includes(needle),'single-brain contract missing: '+needle);

for(const needle of [
 "public_identity: 'Magnanimous AI only'",
 "specialist_identity: 'Magnanimous AI departments'",
 "'single-public-ai-identity'",
 "'private-execution-routing'",
 "'specialist-department-identity'",
 "Never expose execution-provider or model identity to public customers"
]) assert(universal.includes(needle),'universal brain policy missing: '+needle);

for(const needle of [
 "Magnanimous AI is the only public AI identity for the platform.",
 "Never ask ordinary customers to choose an outside provider or model",
 "'/api/magnanimous/single-brain'",
 "execution_routing:magnanimousPublicRoutingSummary",
 "single_brain:getMagnanimousSingleBrainSummary()",
 "manual_provider_override:false",
 "getConnectorAbsorptionPrompt",
 "absorbedCapabilityContext"
]) assert(provider.includes(needle),'provider command layer missing single-brain behavior: '+needle);

assert(branch.includes("name:'Magnanimous AI'"),'customer provider summary must expose only Magnanimous AI');
assert(branch.includes('Specific infrastructure identities are owner-only.'),'provider disclosure must keep execution identities owner-only');
assert(mesh.includes('magnanimousPublicRoutingSummary(providers)'),'Agent Mesh must use Magnanimous routing summary');
assert(mesh.includes("name:'Magnanimous AI'"),'Agent Mesh public provider compatibility row must be Magnanimous-only');

const customerFiles=[
 ['agents',agents],
 ['agent-video',video],
 ['virtual-assistant',assistant],
 ['business',business],
 ['social-media',social],
 ['ai-apps',apps],
 ['start',start],
 ['video-studio',videoStudio]
];
const externalAi=/\b(?:OpenAI|Anthropic|Claude|Gemini|Groq|Mistral|OpenRouter|Cerebras|Hugging Face|Cloudflare Workers AI|Workers AI)\b/i;
for(const [name,source] of customerFiles){
 assert(!externalAi.test(source),name+' customer surface exposes an outside AI brand');
 assert(!/AI PROVIDERS?|AI PROVIDER REQUIRED|AI PROVIDER NOT READY|connected AI providers/i.test(source),name+' customer surface still asks users to think in provider terms');
}

assert(agents.includes('Magnanimous AI — automatic private routing'),'specialist workspace must expose Magnanimous private routing');
assert(!agents.includes('{p.name}</option>'),'specialist workspace must not render selectable provider identities');
assert(video.includes('MAGNANIMOUS AI ONLY'),'live specialist surface must identify one Magnanimous brain');
assert(video.includes('Magnanimous AI • automatic private routing'),'live specialist selector must remain Magnanimous-only');
assert(!video.includes('{p.name}</option>'),'live specialist surface must not render selectable provider identities');
assert(assistant.includes('Magnanimous AI private routing'),'virtual assistant must report Magnanimous routing instead of provider names');
assert(provider.includes("${absorbedCapabilityContext?`\\n\\n${absorbedCapabilityContext}`:''}"),'absorbed tool/skill context must be injected into normal Magnanimous planning');
assert(brain.includes('/api/magnanimous/single-brain'),'Brain page must consume the unified capability summary');
assert(brain.includes('absorbed tool + skill contracts'),'Brain page must expose absorbed capability scale');

assert(connectors.includes('ChatGPT')&&connectors.includes('Claude')&&connectors.includes('Gemini'),'owner connector setup must retain real destination names where authorization requires them');
assert(connectors.includes('Magnanimous stays the command, memory, routing and verification layer.'),'external connection setup must retain Magnanimous ownership boundary');
assert(deployWorkflow.includes("assert provider.get('name') == 'Magnanimous AI', data"),'production smoke must expect the Magnanimous-only public provider name');
assert(deployWorkflow.includes("assert provider.get('type') == 'magnanimous-private-routing', data"),'production smoke must expect the Magnanimous private-routing compatibility type');
assert(!deployWorkflow.includes("Magnanimous AI routing', data"),'production smoke must not retain the retired public provider name');
assert(!deployWorkflow.includes("private-execution', data"),'production smoke must not retain the retired provider compatibility type');

console.log('Magnanimous single-brain lock passed — one public AI identity, specialist departments, private execution routing, absorbed tools/skills, and owner-only infrastructure disclosure are enforced.');
