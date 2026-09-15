import fs from 'node:fs';

const file='worker/src/magnanimous-sovereign-runtime.js';
const router='worker/src/router-entrypoint.js';
const source=fs.readFileSync(file,'utf8');
const routerSource=fs.readFileSync(router,'utf8');

const requiredRoutes=[
 '/api/magnanimous/sovereign/architecture',
 '/api/magnanimous/sovereign/products',
 '/api/magnanimous/sovereign/reasoning/evaluate',
 '/api/magnanimous/sovereign/adapters',
 '/api/magnanimous/sovereign/skills',
 '/api/magnanimous/sovereign/skills/learn',
 '/api/magnanimous/sovereign/skills/seed-native',
 '/api/magnanimous/sovereign/evaluations',
 '/api/magnanimous/sovereign/evaluations/report'
];

const requiredLayers=[
 'Magnanimous Cognitive Core',
 'Magnanimous Persistent Memory',
 'Magnanimous Deliberation + Verification',
 'Magnanimous Skill Foundry',
 'Magnanimous Adapter Evaluation Lab',
 'Replaceable Model Execution Fabric',
 'Magnanimous Voice Runtime',
 'Magnanimous WebRTC Calling',
 'Magnanimous Carrier Gateway',
 'Magnanimous Omnichannel Messaging',
 'Magnanimous Virtual Host',
 'Magnanimous CRM',
 'Magnanimous Site Builder',
 'Magnanimous App Builder',
 'Magnanimous POS',
 'Magnanimous Invoice Maker'
];

const requiredProducts=[
 'Magnanimous AI',
 'Magnanimous CRM',
 'Magnanimous Voice & Contact Center',
 'Magnanimous Virtual Host',
 'Magnanimous WhatsApp Commerce',
 'Magnanimous Website Builder',
 'Magnanimous App Builder',
 'Magnanimous POS',
 'Magnanimous Invoice Maker'
];

const requiredFunctions=[
 'function publicArchitecture',
 'function settings',
 'function saveProduct',
 'function evaluateReasoning',
 'function skills',
 'function learnSkill',
 'function seedNativeRecipes',
 'function recordEvaluation',
 'function evaluationReport',
 'function handleMagnanimousSovereign'
];

const requiredPolicyFragments=[
 'Magnanimous AI owns identity, orchestration, memory, reasoning policy, verification and learning',
 'never copies proprietary model weights, private prompts, credentials, copyrighted implementation code, or protected provider data',
 'execution_provider_details_private:true',
 'Protected credentials, hidden prompts, secrets, or model-weight material cannot be assimilated.',
 'Do not promote a learned skill until verified evidence shows native parity on required scenarios.'
];

const failures=[];
for(const value of requiredRoutes)if(!source.includes(value))failures.push(`missing route: ${value}`);
for(const value of requiredLayers)if(!source.includes(value))failures.push(`missing sovereign layer: ${value}`);
for(const value of requiredProducts)if(!source.includes(value))failures.push(`missing product: ${value}`);
for(const value of requiredFunctions)if(!source.includes(value))failures.push(`missing function: ${value}`);
for(const value of requiredPolicyFragments)if(!source.includes(value))failures.push(`missing policy guard: ${value}`);

if(!routerSource.includes("import { handleMagnanimousSovereign } from './magnanimous-sovereign-runtime.js';"))failures.push('router no longer imports sovereign runtime');
if(!routerSource.includes("url.pathname.startsWith('/api/magnanimous/sovereign')"))failures.push('router no longer dispatches sovereign API routes');

const recipeCount=(source.match(/skill_key:'crm\./g)||[]).length;
if(recipeCount<10)failures.push(`native CRM recipe baseline regressed: expected >=10, found ${recipeCount}`);

if(failures.length){
 console.error('Sovereign capability contract regression detected:');
 for(const failure of failures)console.error(`- ${failure}`);
 process.exit(1);
}

console.log(`Sovereign capability contract locked: ${requiredRoutes.length} routes, ${requiredLayers.length} layers, ${requiredProducts.length} products, ${recipeCount} CRM recipes.`);
