import fs from 'node:fs';

const read=(path)=>fs.readFileSync(path,'utf8');
const must=(text,needle,label)=>{if(!text.includes(needle)){console.error(`SPECIALIST BRANCH LOCK FAILED: ${label}`);process.exitCode=1;}};

const intelligence=read('worker/src/agent-branch-intelligence.js');
const entry=read('worker/src/branch-consent-entrypoint.js');
const wrangler=read('worker/wrangler.jsonc');
const voice=read('frontend/app/voice-orchestrator.tsx');
const academy=read('frontend/app/owner-ai-academy/page.tsx');

must(wrangler,'src/branch-consent-entrypoint.js','production Worker must run through the specialist branch entrypoint');
must(entry,"branchProfile, ensureBranchSchema, branchKnowledge, branchKnowledgeContext, teachBranch",'branch entrypoint must retain curriculum and teaching support');
must(entry,"/api/agents/branch/teach",'developer teaching endpoint must remain available');
must(entry,"/api/agents/branch/knowledge",'owner training curation endpoint must remain available');
must(entry,'trainingFromUrl','safe public-web teaching must remain available');
must(entry,'spokenAgent(original,agents)','backend spoken-name routing must remain active');
must(entry,'branch_knowledge_count','specialist responses must expose branch-learning state');
must(entry,'const {provider,provider_name,model,...publicData}=data','public specialist responses must continue hiding provider/model internals');
must(intelligence,'specialized branch of Magnanimous AI','specialists must remain branches of the Magnanimous core');
must(intelligence,'agent_branch_knowledge','branch-specific knowledge storage must remain isolated');
must(intelligence,'CORE SKILLS','built-in specialist curriculum must remain active');
must(intelligence,'DEVELOPER / WORKSPACE TEACHING FOR THIS BRANCH','developer-taught branch knowledge must be injected into specialist context');
must(voice,'matchSpokenPersona','browser voice layer must recognize named specialists');
must(voice,'chooseVoice','specialists must keep deterministic distinct voice profiles');
must(academy,'Owner AI Academy','owner specialist-training workspace must remain available');
must(academy,'Teach ${agent?.name','academy must preserve branch-targeted teaching');
must(academy,'Run Specialist Test','academy must preserve immediate training verification');
must(academy,'Upload text training','academy must preserve training-file intake');
must(academy,'Public webpage URL to absorb','academy must preserve web-source training intake');
must(academy,'removeLesson','academy must preserve owner curation of incorrect lessons');

if(!process.exitCode)console.log('Specialist branch architecture and Owner AI Academy lock passed.');
