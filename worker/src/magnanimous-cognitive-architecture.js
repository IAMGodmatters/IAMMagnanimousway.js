// Magnanimous AI cognitive architecture profile.
// These named cognitive systems are design inspirations, not claims that their
// original runtimes have been embedded or fully reimplemented here.

export const MAGNANIMOUS_COGNITIVE_LOOP = [
  'perceive',
  'attend',
  'retrieve',
  'decompose',
  'reason',
  'select',
  'execute',
  'verify',
  'explain',
  'learn'
];

export const MAGNANIMOUS_COGNITIVE_ARCHITECTURE = {
  id: 'magnanimous-hybrid-cognitive-core-v1',
  name: 'Magnanimous Hybrid Cognitive Core',
  model: 'hybrid-symbolic-neural',
  central_brain: true,
  inspirations: [
    {
      name: 'SOAR',
      contribution: 'goal decomposition, problem-space search, production-style rules, reusable learned procedures'
    },
    {
      name: 'LIDA',
      contribution: 'attention, global-workspace-style integration, action selection, perception-to-action cycling'
    },
    {
      name: 'ACT-R',
      contribution: 'separation of declarative and procedural memory, context-sensitive retrieval, goal-directed cognition'
    },
    {
      name: 'CLARION',
      contribution: 'coordination of explicit symbolic knowledge with implicit learned patterns'
    }
  ],
  layers: [
    {
      id: 'perception-and-normalization',
      purpose: 'Convert available text, images, audio, video, documents, tool results and structured data into task-relevant observations without inventing unavailable inputs.'
    },
    {
      id: 'attention-and-working-memory',
      purpose: 'Prioritize the user goal, current constraints, active plan, recent evidence and high-value context while suppressing irrelevant noise.'
    },
    {
      id: 'declarative-and-episodic-memory',
      purpose: 'Retrieve stored facts, prior decisions, source-grounded knowledge, user-authorized memory and prior outcomes.'
    },
    {
      id: 'procedural-memory',
      purpose: 'Reuse proven native recipes, tool sequences and specialist-agent workflows before rebuilding the same process from scratch.'
    },
    {
      id: 'hybrid-deliberation',
      purpose: 'Combine flexible model inference with explicit rules, permissions, deterministic checks, knowledge retrieval and structured planning.'
    },
    {
      id: 'action-selection',
      purpose: 'Choose native capability, specialist agent, connected tool or external execution engine according to task fit, cost, reliability, freshness and authorization.'
    },
    {
      id: 'verification-and-metacognition',
      purpose: 'Check results against the request, evidence, constraints and actual tool outcomes; represent uncertainty and correct failures instead of bluffing.'
    },
    {
      id: 'learning-and-consolidation',
      purpose: 'Store useful lessons, provider outcomes, source knowledge and successful low-risk procedures as private workspace learning without claiming public foundation-model retraining.'
    }
  ],
  explainability: {
    enabled: true,
    mode: 'concise-rationale-evidence-uncertainty',
    hidden_chain_of_thought: 'private',
    requirement: 'Provide concise reasoning summaries, evidence, assumptions, uncertainty and action verification when useful; never expose hidden chain-of-thought.'
  },
  multimodal: {
    strategy: 'modality-aware-fusion',
    inputs: ['text', 'images', 'audio', 'video', 'documents', 'structured-data', 'tool-results'],
    rule: 'Use only modalities actually available in the current runtime and never claim a modality was processed when it was not.'
  },
  collaboration: {
    mode: 'human-ai-collaboration',
    rule: 'Take initiative on low-risk authorized work, minimize unnecessary interruptions, and ask the human only when information, judgment, consent or a platform permission boundary makes it necessary.'
  }
};

export const MAGNANIMOUS_DEVELOPMENT_SKILLS = [
  {
    domain: 'programming-languages',
    items: ['JavaScript/TypeScript', 'Python', 'Java', 'C++'],
    purpose: 'Build services, tools, integrations, data pipelines and performance-sensitive components.'
  },
  {
    domain: 'machine-learning-and-deep-learning',
    items: ['supervised learning', 'unsupervised learning', 'representation learning', 'deep neural networks', 'evaluation'],
    purpose: 'Understand and integrate learned models where they materially improve capability.'
  },
  {
    domain: 'natural-language-processing',
    items: ['language understanding', 'text analysis', 'retrieval', 'classification', 'generation', 'information extraction'],
    purpose: 'Interpret, ground, transform and generate human language.'
  },
  {
    domain: 'computer-vision',
    items: ['image understanding', 'image processing', 'visual extraction', 'multimodal fusion'],
    purpose: 'Work with visual information when supported by the active runtime or provider.'
  },
  {
    domain: 'knowledge-representation-and-reasoning',
    items: ['knowledge graphs', 'ontologies', 'symbolic rules', 'constraints', 'retrieval-augmented reasoning'],
    purpose: 'Keep durable knowledge structured and combine it with explicit reasoning constraints.'
  },
  {
    domain: 'cognitive-architectures',
    items: ['SOAR', 'LIDA', 'ACT-R', 'CLARION'],
    purpose: 'Use established cognitive-system concepts as architectural inspiration for memory, attention, planning, learning and action selection.'
  }
];

export const MAGNANIMOUS_FRAMEWORK_LITERACY = [
  { name: 'TensorFlow', family: 'deep-learning', role: 'knowledge-and-adapter-target' },
  { name: 'Keras', family: 'deep-learning', role: 'knowledge-and-adapter-target' },
  { name: 'PyTorch', family: 'deep-learning', role: 'knowledge-and-adapter-target' },
  { name: 'Scikit-learn', family: 'machine-learning', role: 'knowledge-and-adapter-target' },
  { name: 'NLTK', family: 'natural-language-processing', role: 'knowledge-and-adapter-target' },
  { name: 'spaCy', family: 'natural-language-processing', role: 'knowledge-and-adapter-target' },
  { name: 'OpenCV', family: 'computer-vision', role: 'knowledge-and-adapter-target' },
  { name: 'WordNet', family: 'knowledge-representation', role: 'knowledge-source-and-ontology-target' },
  { name: 'YAGO', family: 'knowledge-representation', role: 'knowledge-graph-target' },
  { name: 'Knowledge graphs and ontologies', family: 'knowledge-representation', role: 'native-architecture-pattern' }
];

export const MAGNANIMOUS_RESEARCH_PRIORITIES = [
  {
    id: 'hybrid-symbolic-neural',
    name: 'Hybrid symbolic + connectionist reasoning',
    objective: 'Use neural inference for flexible understanding and symbolic structures for rules, constraints, verification and durable knowledge.'
  },
  {
    id: 'explainable-ai',
    name: 'Explainable and transparent AI',
    objective: 'Expose concise rationale, sources, assumptions, confidence and verified tool outcomes without revealing hidden chain-of-thought.'
  },
  {
    id: 'multimodal-learning',
    name: 'Multimodal learning and interaction',
    objective: 'Fuse available text, image, audio, video, document and structured-data signals into one task model while respecting runtime limits.'
  },
  {
    id: 'cognitive-human-collaboration',
    name: 'Cognitive architectures for human-AI collaboration',
    objective: 'Support initiative, delegation, review, correction, permission-aware action and continuous private workspace learning.'
  }
];

export function getMagnanimousCognitivePrompt() {
  return `MAGNANIMOUS HYBRID COGNITIVE CORE\nArchitecture: hybrid-symbolic-neural. SOAR, LIDA, ACT-R and CLARION are design inspirations, not claims of full reimplementation.\nCognitive loop: ${MAGNANIMOUS_COGNITIVE_LOOP.join(' -> ')}.\nUse flexible model inference together with explicit constraints, permissions, retrieval, structured plans and deterministic checks.\nMaintain working context, retrieve declarative/episodic knowledge, reuse procedural recipes, then select the best authorized action or execution engine.\nFor explainability, provide concise rationale, evidence, assumptions, uncertainty and verified action results when useful. Do not expose hidden chain-of-thought.\nFor multimodal work, fuse only inputs actually available in the runtime; never pretend to have processed an unavailable modality.\nFor human-AI collaboration, act proactively on low-risk authorized work and ask only when missing information, judgment, consent or a permission boundary genuinely requires the user.\nTreat TensorFlow, Keras, PyTorch, Scikit-learn, NLTK, spaCy, OpenCV, WordNet, YAGO, knowledge graphs and ontologies as framework/tool knowledge and adapter targets unless the runtime explicitly proves they are installed or connected.`;
}
