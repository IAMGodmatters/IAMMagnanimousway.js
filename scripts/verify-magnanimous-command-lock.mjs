import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const fail = (message) => {
  console.error(`MAGNANIMOUS COMMAND LOCK FAILED: ${message}`);
  process.exitCode = 1;
};
const requireText = (text, needle, label) => {
  if (!text.includes(needle)) fail(`${label} is missing required invariant: ${needle}`);
};
const forbidText = (text, needle, label) => {
  if (text.includes(needle)) fail(`${label} contains forbidden direct dependency: ${needle}`);
};

const provider = read('worker/src/provider-entrypoint.js');
const brain = read('worker/src/magnanimous-brain-runtime.js');
const cognitive = read('worker/src/magnanimous-cognitive-architecture.js');
const universal = read('worker/src/magnanimous-universal-capabilities.js');
const radar = read('worker/src/magnanimous-capability-radar.js');
const foundry = read('worker/src/magnanimous-tool-foundry.js');
const router = read('worker/src/router-entrypoint.js');
const gateway = read('worker/src/magnanimous-tool-gateway.js');
const standalone = read('frontend/app/magnanimous/page.tsx');
const voice = read('frontend/app/voice-orchestrator.tsx');
const siteLayout = read('frontend/app/layout.tsx');
const siteRuntime = read('frontend/app/platform-runtime-script.tsx');

// Identity, command authority, and durable remembrance.
requireText(provider, 'MAGNANIMOUS COMMAND LAYER', 'provider entrypoint');
requireText(provider, "command_role:'commander-in-chief'", 'provider entrypoint');
requireText(provider, "provider_role:'execution-engine'", 'provider entrypoint');
requireText(provider, 'Magnanimous AI is the durable remembrance layer for the platform', 'provider entrypoint');
requireText(brain, "role:'commander-in-chief-platform-brain'", 'brain runtime');
requireText(brain, 'Magnanimous AI is the commander-in-chief intelligence, planning, continuity, remembrance and learning layer for the platform.', 'brain runtime');
requireText(brain, 'outside models may execute tasks, but they do not own platform memory or continuity.', 'brain runtime');

// Universal hybrid cognitive architecture inspired by established cognitive systems.
requireText(cognitive, "model: 'hybrid-symbolic-neural-agentic'", 'cognitive architecture');
requireText(cognitive, "universal_capability_core: true", 'cognitive architecture');
requireText(cognitive, "name: 'SOAR'", 'cognitive architecture');
requireText(cognitive, "name: 'LIDA'", 'cognitive architecture');
requireText(cognitive, "name: 'ACT-R'", 'cognitive architecture');
requireText(cognitive, "name: 'CLARION'", 'cognitive architecture');
requireText(cognitive, 'perception-and-normalization', 'cognitive architecture');
requireText(cognitive, 'attention-and-working-memory', 'cognitive architecture');
requireText(cognitive, 'declarative-and-episodic-memory', 'cognitive architecture');
requireText(cognitive, 'procedural-memory', 'cognitive architecture');
requireText(cognitive, 'universal-capability-fabric', 'cognitive architecture');
requireText(cognitive, 'hybrid-deliberation', 'cognitive architecture');
requireText(cognitive, 'multi-agent-parallel-execution', 'cognitive architecture');
requireText(cognitive, 'action-selection', 'cognitive architecture');
requireText(cognitive, 'verification-and-metacognition', 'cognitive architecture');
requireText(cognitive, 'sandboxed-self-improvement', 'cognitive architecture');
requireText(cognitive, 'learning-and-consolidation', 'cognitive architecture');
requireText(brain, '/api/magnanimous/architecture', 'brain runtime');
requireText(brain, '/api/magnanimous/evolution', 'brain runtime');
requireText(brain, 'getMagnanimousCognitivePrompt', 'brain runtime');

// Explainability, multimodal fusion and human-AI collaboration remain first-class design requirements.
requireText(cognitive, 'concise-rationale-evidence-uncertainty', 'cognitive architecture');
requireText(cognitive, 'hidden_chain_of_thought', 'cognitive architecture');
requireText(cognitive, 'modality-aware-fusion', 'cognitive architecture');
requireText(cognitive, 'human-ai-collaboration', 'cognitive architecture');
requireText(cognitive, "id: 'explainable-ai'", 'cognitive architecture');
requireText(cognitive, "id: 'multimodal-learning'", 'cognitive architecture');
requireText(cognitive, "id: 'cognitive-human-collaboration'", 'cognitive architecture');

// Core development knowledge, frontier-agent literacy and open adapter standards.
for (const skill of ['Python', 'Java', 'C++', 'machine-learning-and-deep-learning', 'natural-language-processing', 'computer-vision', 'knowledge-representation-and-reasoning', 'agentic-systems', 'evaluation-and-self-improvement']) {
  requireText(cognitive, skill, 'cognitive architecture');
}
for (const framework of ['TensorFlow', 'Keras', 'PyTorch', 'Scikit-learn', 'NLTK', 'spaCy', 'OpenCV', 'WordNet', 'YAGO', 'Knowledge graphs and ontologies', 'Model Context Protocol (MCP)', 'Sandboxed code/computer execution']) {
  requireText(cognitive, framework, 'cognitive architecture');
}

// Universal capability fabric covers frontier capability classes without claiming unconfigured tools are live.
for (const domain of ['reasoning-planning', 'deep-research', 'coding-computation', 'computer-browser-use', 'multimodal-intelligence', 'creative-generation', 'voice-realtime', 'files-documents', 'memory-personalization', 'agents-subagents', 'tools-connectors', 'business-operations', 'specialized-knowledge', 'security-reliability', 'accessibility-language', 'future-adapters']) {
  requireText(universal, domain, 'universal capability core');
}
for (const pattern of ['function-calling', 'mcp', 'tool-discovery', 'subagents', 'parallel-workstreams', 'checkpoint-resume', 'screen-understanding', 'code-execution', 'source-ranking', 'citation-tracking']) {
  requireText(universal, pattern, 'universal capability core');
}

// Self-evolution must be evidence-driven, reversible, and unable to erase governance boundaries.
for (const stage of ['observe-capability-gap', 'research-current-best-patterns', 'sandbox-and-test', 'adversarial-and-regression-evaluate', 'canary-low-risk-rollout', 'promote-or-rollback', 'consolidate-procedural-memory']) {
  requireText(universal, stage, 'self-evolution protocol');
}
for (const invariant of ['require_regression_pass: true', 'require_reversible_change: true', 'spending money or enabling metered providers', 'production secrets or credential changes', 'irreversible actions', 'Every autonomous change must be observable, attributable, testable and reversible.']) {
  requireText(universal, invariant, 'self-evolution protocol');
}
requireText(universal, 'must not remove authentication, authorization, tenant isolation, secret protection or legal/safety controls.', 'self-evolution protocol');
requireText(universal, 'must not copy proprietary weights, hidden prompts, private code, stolen credentials or restricted data.', 'self-evolution protocol');
requireText(universal, 'A capability is not claimed as working until the current runtime proves it through an actual tool result, test or configured adapter.', 'self-evolution protocol');

// Runtime capability truth must distinguish architectural goals, configured/discovered tools, and verified execution.
requireText(radar, "mode:'runtime-capability-radar'", 'capability radar');
requireText(radar, 'architectural_goal_is_not_runtime_proof:true', 'capability radar');
requireText(radar, 'adapter_target_is_not_connected:true', 'capability radar');
requireText(radar, 'discovered_tool_is_not_verified_until_successful_call:true', 'capability radar');
requireText(radar, 'ready_recipe_is_not_outcome_verified_until_scored:true', 'capability radar');
requireText(radar, 'verified-by-successful-call', 'capability radar');
requireText(radar, 'verified-by-outcome', 'capability radar');
requireText(radar, 'runtime-tool-reliability-gap', 'capability radar');
requireText(radar, 'Never manufacture a connection, permission, successful action, or capability claim.', 'capability radar');
requireText(foundry, '/api/magnanimous/tool-foundry/radar', 'tool foundry');
requireText(foundry, 'getMagnanimousCapabilityRadar', 'tool foundry');
requireText(foundry, 'recordMagnanimousCapabilityGap', 'tool foundry');
requireText(foundry, 'syncGapProposals', 'tool foundry');

// Knowledge growth and source absorption.
requireText(provider, 'learnFromLinks', 'provider entrypoint');
requireText(provider, 'automatic_link_learning:true', 'provider entrypoint');
requireText(provider, 'remembered_research', 'provider entrypoint');
requireText(brain, 'Persistent episodic, semantic, preference and procedural learning memory', 'brain runtime');
requireText(brain, 'capability-gap discovery', 'brain runtime');
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

// Standalone distribution must remain another front door into the SAME central brain, never a fork.
requireText(standalone, "postMagnanimousChat('/api/chat'", 'standalone Magnanimous');
requireText(standalone, 'use_knowledge:true', 'standalone Magnanimous');
requireText(standalone, "const researchMode=activeMode.id==='research'", 'standalone Magnanimous');
requireText(standalone, 'use_tools:!researchMode', 'standalone Magnanimous');
requireText(standalone, 'learn_links:!researchMode', 'standalone Magnanimous');
requireText(standalone, 'retryTransientEdgeOnce:researchMode', 'standalone Magnanimous');
requireText(standalone, 'remember_search:true', 'standalone Magnanimous');
requireText(standalone, 'specialist_routing:true', 'standalone Magnanimous');
requireText(standalone, 'Magnanimous core', 'standalone Magnanimous');
requireText(voice, "path==='/magnanimous'||path.startsWith('/magnanimous/')", 'standalone voice routing');
requireText(voice, "standalone?'.mag-compose textarea'", 'standalone voice input');
requireText(voice, 'latestMagnanimousPersona', 'standalone specialist voice identity');
requireText(voice, 'applyVoiceProfile(u,nextPersona)', 'standalone specialist spoken replies');
requireText(voice, 'autoSpeak', 'standalone automatic spoken replies');
requireText(voice, 'SpeechRecognition', 'standalone microphone input');
requireText(siteLayout, "import PlatformRuntimeScript from './platform-runtime-script'", 'site layout runtime mount');
requireText(siteLayout, '<PlatformRuntimeScript/>', 'site layout runtime mount');
requireText(siteLayout, 'data-iam-standalone', 'site layout standalone CSS isolation');
requireText(siteRuntime, "currentPath==='/magnanimous'||currentPath.indexOf('/magnanimous/')===0", 'platform runtime standalone route detection');
requireText(siteRuntime, "if(standalone)document.documentElement.setAttribute('data-iam-standalone','true')", 'platform runtime standalone document mode');
requireText(siteRuntime, 'if(!standalone)loadAds()', 'platform runtime standalone advertising isolation');
for (const directProvider of ['api.openai.com', 'api.anthropic.com', 'generativelanguage.googleapis.com', 'api.groq.com', 'api.mistral.ai']) {
  forbidText(standalone, directProvider, 'standalone Magnanimous');
}

if (!process.exitCode) {
  console.log('MAGNANIMOUS COMMAND LOCK: PASS');
  console.log('Central brain, durable remembrance, universal hybrid cognition, explainability, multimodal fusion, collaboration, capability fabric, runtime capability truth, evidence-driven reversible self-evolution, link learning, adaptive routing, memory, Tool Foundry growth, framework literacy, standalone same-brain voice distribution, and permission boundaries are intact.');
}
