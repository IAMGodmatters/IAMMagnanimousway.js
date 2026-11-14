import assert from 'node:assert/strict';
import fs from 'node:fs';

const chat=fs.readFileSync('frontend/app/ai-chat/page.tsx','utf8');
const provider=fs.readFileSync('worker/src/provider-entrypoint.js','utf8');
const orchestrator=fs.readFileSync('frontend/app/voice-orchestrator.tsx','utf8');

assert.match(chat,/function requiresSpecialistTools\(message: string\)/,'Chat must distinguish tool execution from ordinary conversation');
assert.match(chat,/use_tools: useTools/,'Ordinary questions must not trigger specialist-tool discovery');
assert.match(chat,/const timeoutMs = research \|\| useTools \? 70000 : 35000/,'The browser must have a bounded response timeout');
assert.match(chat,/new AbortController\(\)/,'A stalled request must be cancellable');
assert.match(chat,/controller\.signal/,'The request must use the timeout controller');
assert.match(chat,/iam:voice-reply-ready/,'Every completed primary-chat answer must reach the shared voice orchestrator');
assert.match(chat,/speakTextNaturally\(answer/,'A user must be able to play an answer directly');
assert.match(chat,/className="listen-answer"/,'Every answer must expose its own visible HEAR control');
assert.match(chat,/stopNaturalSpeech\(\)/,'Playback must be stoppable and must not overlap stale answers');

assert.match(provider,/const extendedExecution = computeOnly \|\| autoResearch \|\| body\.use_tools === true/,'Research and explicit tool work retain the extended execution budget');
assert.match(provider,/const requestBudgetMs = extendedExecution \? PROVIDER_REQUEST_BUDGET_MS : 28000/,'Ordinary responses must have a shorter bounded provider window');
assert.match(provider,/const perProviderBudgetMs = extendedExecution \? 45000 : 24000/,'A single provider must not hold ordinary chat indefinitely');
assert.match(provider,/Math\.min\(perProviderBudgetMs,remaining\)/,'Each provider attempt must obey the applicable deadline');
assert.match(provider,/simpleConversation=!computeOnly&&!autoResearch&&body\.use_tools===false/,'Simple turns skip adaptive database history lookup');
assert.match(provider,/body\.use_tools!==false\?await hasReadyLocalBridge/,'Simple turns skip local bridge preflight');

assert.match(orchestrator,/addEventListener\('iam:voice-reply-ready'/,'Shared voice orchestration must listen for direct answer signals');
assert.match(orchestrator,/Tap HEAR to play it aloud/,'Blocked autoplay must expose a manual recovery instruction');
console.log('PASS: ordinary chat fast path, hard response deadline, direct voice routing and manual spoken-answer recovery.');
