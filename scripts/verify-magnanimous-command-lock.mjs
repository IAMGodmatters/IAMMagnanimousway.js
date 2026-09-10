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
const cognitive = read('worker/src/magnanimous-cognitive-architecture.js');
const foundry = read('worker/src/magnanimous-tool-foundry.js');
const router = read('worker/src/router-entrypoint.js');
const gateway = read('worker/src/magnanimous-tool-gateway.js');

// Identity and command authority.
requireText(provider, 'MAGNANIMOUS COMMAND LAYER', 'provider entrypoint');
requireText(provider, "command_role:'commander-in-chief'", 'provider entrypoint');
requireText(provider, "provider_role:'execution-engine'", 'provider entrypoint');
requireText(brain, "role:'commander-in-chief-platform-brain'", 'brain runtime');
requireText(brain, 'Magnanimous AI is the commander-in-chief intelligence, planning, continuity and learning layer for the platform.', 'brain runtime');

// Hybrid cognitive architecture inspired by established cognitive systems.
requireText(cognitive, "model: 'hybrid-symbolic-neural'", 'cognitive architecture');
requireText(cognitive, "name: 'SOAR'", 'cognitive architecture');
requireText(cognitive, "name: 'LIDA'", 'cognitive architecture');
requireText(cognitive, "name: 'ACT-R'", 'cognitive architecture');
requireText(cognitive, "name: 'CLARION'", 'cognitive architecture');
requireText(cognitive, 'perception-and-normalization', 'cognitive architecture');
requireText(cognitive, 'attention-and-working-memory', 'cognitive architecture');
requireText(cognitive, 'declarative-and-episodic-memory', 'cognitive architecture');
requireText(cognitive, 'procedural-memory', 'cognitive architecture');
requireText(cognitive, 'hybrid-deliberation', 'cognitive architecture');
requireText(cognitive, 'action-selection', 'cognitive architecture');
requireText(cognitive, 'verification-and-metacognition', 'cognitive architecture');
requireText(cognitive, 'learning-and-consolidation', 'cognitive architecture');
requireText(brain, '/api/magnanimous/architecture', 'brain runtime');
requireText(brain, 'getMagnanimousCognitivePrompt', 'brain runtime');

// Explainability, multimodal fusion and human-AI collaboration remain first-class design requirements.
requireText(cognitive, 'concise-rationale-evidence-uncertainty', 'cognitive architecture');
requireText(cognitive, 'hidden_chain_of_thought', 'cognitive architecture');
requireText(cognitive, 'modality-aware-fusion', 'cognitive architecture');
requireText(cognitive, 'human-ai-collaboration', 'cognitive architecture');
requireText(cognitive, "id: 'explainable-ai'", 'cognitive architecture');
requireText(cognitive, "id: 'multimodal-learning'", 'cognitive architecture');
requireText(cognitive, "id: 'cognitive-human-collaboration'", 'cognitive architecture');

// Core development knowledge and framework literacy.
for (const skill of ['Python', 'Java', 'C++', 'machine-learning-and-deep-learning', 'natural-language-processing', 'computer-vision', 'knowledge-representation-and-reasoning']) {
  requireText(cognitive, skill, 'cognitive architecture');
}
for (const framework of ['TensorFlow', 'Keras', 'PyTorch', 'Scikit-learn', 'NLTK', 'spaCy', 'OpenCV', 'WordNet', 'YAGO', 'Knowledge graphs and ontologies']) {
  requireText(cognitive, framework, 'cognitive architecture');
}

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
  console.log('Central brain, hybrid cognition, explainability, multimodal fusion, collaboration, link learning, adaptive routing, memory, Tool Foundry growth, framework literacy, and permission boundaries are intact.');
}
