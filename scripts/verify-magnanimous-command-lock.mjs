import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const fail = (message) => {
  console.error(`MAGNANIMOUS COMMAND LOCK FAILED: ${message}`);
  process.exitCode = 1;
};
const requireText = (text, needle, label) => {
  if (!text.includes(needle)) fail(`${label} is missing required invariant: ${needle}`);
};

const provider = read('worker/src/provider-entrypoint.js');
const brain = read('worker/src/magnanimous-brain-runtime.js');
const foundry = read('worker/src/magnanimous-tool-foundry.js');
const router = read('worker/src/router-entrypoint.js');
const gateway = read('worker/src/magnanimous-tool-gateway.js');

// Identity and command authority.
requireText(provider, 'MAGNANIMOUS COMMAND LAYER', 'provider entrypoint');
requireText(provider, "command_role:'commander-in-chief'", 'provider entrypoint');
requireText(provider, "provider_role:'execution-engine'", 'provider entrypoint');
requireText(brain, "role:'commander-in-chief-platform-brain'", 'brain runtime');
requireText(brain, 'Magnanimous AI is the commander-in-chief intelligence, planning, continuity and learning layer for the platform.', 'brain runtime');

// Knowledge growth and source absorption.
requireText(provider, 'learnFromLinks', 'provider entrypoint');
requireText(provider, 'automatic_link_learning:true', 'provider entrypoint');
requireText(provider, 'remembered_research', 'provider entrypoint');
requireText(brain, 'Persistent user/workflow learning memory', 'brain runtime');
requireText(router, 'getMagnanimousMemoryContext', 'router');
requireText(router, 'magnanimousChatRequest', 'router');

// Adaptive routing: outside models remain replaceable engines and outcomes influence routing.
requireText(provider, 'learnedProviderScores', 'provider entrypoint');
requireText(provider, 'adaptive_provider_learning:true', 'provider entrypoint');
requireText(provider, 'recordProviderOutcome', 'provider entrypoint');

// Native-tool growth and promotion of proven low-risk recipes.
requireText(foundry, "row.risk==='low'", 'tool foundry');
requireText(foundry, "row.status==='proposed'", 'tool foundry');
requireText(foundry, 'Number(row.uses||0)>=5', 'tool foundry');
requireText(foundry, '>=.8', 'tool foundry');
requireText(foundry, "status='ready'", 'tool foundry');

// Specialist/external tools are subordinate to the central brain and permission boundaries remain intact.
requireText(gateway, "architecture:'central-brain-with-tool-gateway'", 'tool gateway');
requireText(gateway, 'External tools extend Magnanimous.', 'tool gateway');
requireText(provider, 'Never bypass security, identity, payment or permission boundaries.', 'provider entrypoint');

if (!process.exitCode) {
  console.log('MAGNANIMOUS COMMAND LOCK: PASS');
  console.log('Central brain, link learning, adaptive routing, memory, Tool Foundry growth, and permission boundaries are intact.');
}
