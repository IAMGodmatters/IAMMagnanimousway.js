import assert from 'node:assert/strict';
import fs from 'node:fs';

const chat=fs.readFileSync('frontend/app/ai-chat/page.tsx','utf8');
const natural=fs.readFileSync('frontend/lib/natural-speech.ts','utf8');
const transport=fs.readFileSync('frontend/lib/magnanimous-chat-transport.ts','utf8');
const orchestrator=fs.readFileSync('frontend/app/voice-orchestrator.tsx','utf8');
const provider=fs.readFileSync('worker/src/provider-entrypoint.js','utf8');

assert.match(chat,/use_tools: false/,'Main AI chat must remain read-only and skip side-effect tool planning');
assert.match(chat,/learn_links: false/,'Main AI chat must keep link ingestion out of ordinary conversations');
assert.match(chat,/const extendedResearch = research \|\| isPublicInfoRequest\(question\)/,'Public-information grounding must extend the browser deadline');
assert.match(chat,/const timeoutMs = extendedResearch \? 70000 : 35000/,'The browser must enforce a bounded request deadline');
assert.match(transport,/export function isPublicInfoRequest/,'The transport and browser must share one public-information intent classifier');
assert.match(transport,/if\(!isPublicInfoRequest\(message\)\)return init/,'Public-information grounding must use the shared classifier');
assert.match(chat,/new AbortController\(\)/,'A stalled request must be cancellable');
assert.match(chat,/signal: controller\.signal/,'The request must use the timeout controller');
assert.match(chat,/clearTimeout\(requestTimer\)/,'The timeout must be cleaned up after each request');
assert.match(chat,/error\?\.name === "AbortError"/,"Timeouts must restore the user's question with a clear message");
assert.match(chat,/primeNaturalSpeech\(true\)/,'Each send gesture must re-prime iOS speech playback');
assert.match(chat,/iam:voice-reply-ready/,'Completed answers must reach shared voice orchestration');
assert.match(chat,/speakTextNaturally\(answer/,'A user must be able to play an answer directly');
assert.match(chat,/className="listen-answer"/,'Every answer must expose an accessible HEAR control');
assert.match(chat,/aria-pressed=\{speakingAnswer === index\}/,'The answer playback control must expose its state');
assert.match(chat,/stopNaturalSpeech\(\)/,'Playback must stop cleanly without overlapping stale answers');

assert.match(natural,/primeNaturalSpeech\(force = false\)/,'Speech priming must support an explicit per-gesture refresh');
assert.match(natural,/speechPrimed && !force/,'Repeated priming is allowed only when explicitly requested');
assert.match(orchestrator,/addEventListener\('iam:voice-reply-ready'/,'The shared voice orchestrator must receive completed answers');
assert.match(orchestrator,/Tap HEAR to play it aloud/,'Autoplay failure must expose a manual recovery path');
assert.match(provider,/withinProviderBudget\(getMagnanimousMemoryContext\(request,env\),1800/,'Slow memory retrieval must not block chat indefinitely');
assert.match(provider,/withinProviderBudget\(getKnowledgeContext\(request,env,userMessage/,'Knowledge retrieval must be bounded');
assert.match(provider,/Promise\.all\(\[brainContextTask,groundingTask\]\)/,'Memory and knowledge retrieval must be joined in parallel');

console.log('PASS: read-only chat contract, bounded requests, per-gesture speech priming, manual answer playback and bounded Magnanimous brain retrieval.');
