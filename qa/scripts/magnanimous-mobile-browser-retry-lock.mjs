import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const flow=readFileSync('.github/workflows/mobile-production-visual.yml','utf8');
assert(flow.includes('timeout-minutes: 15'),'Two bounded browser launches need a finite 15-minute job cap.');
assert(flow.includes('for attempt in 1 2; do'),'Hosted browser flakiness needs at most two fresh-profile attempts.');
assert(flow.includes('magnanimous-chrome-decode-')&&flow.includes('magnanimous-chrome-render-'),'Retries must not reuse an unhealthy Chromium profile.');
assert(flow.includes("[ \"$decoded\" != true ]")&&flow.includes('return 1'),'Both failed attempts must still fail the workflow.');
for(const check of ['APPROVED_MOBILE_GIT_BLOB','SHARP_MOBILE_GIT_BLOB','CLEAR_MOBILE_SHA256','APPROVED_DESKTOP_SHA256','data-fallback="320x569"','data-sharp="1296x2304"','data-clear="864x1536"','mobileExactStage','mobileBottomMore','desktopStage','screenshot was not produced']) {
 assert(flow.includes(check),`Do not drop mobile or desktop acceptance evidence: ${check}`);
}
assert(!flow.includes('continue-on-error: true'),'The screenshot workflow must never mask real failures.');
console.log('Mobile browser retries bounded; all exact artwork, rendering and responsive checks remain fail-closed.');
