import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL('../../' + path, import.meta.url), 'utf8');
const page = read('frontend/app/local-bridge/page.tsx');
const bootstrap = read('frontend/public/downloads/local-bridge/bootstrap.ps1');
const core = read('frontend/public/downloads/local-bridge/install-core.ps1');
const sourceCore = read('local-bridge/install.ps1');
const agent = read('frontend/public/downloads/local-bridge/bridge_agent.py');
const sourceAgent = read('local-bridge/bridge_agent.py');
const edge = read('frontend/public/downloads/local-bridge/ncs2_edge.py');
const sourceEdge = read('local-bridge/ncs2_edge.py');
const uninstall = read('frontend/public/downloads/local-bridge/uninstall.ps1');
const sourceUninstall = read('local-bridge/uninstall.ps1');

assert(!page.includes('raw.githubusercontent.com'), 'Local Bridge page must not depend on public GitHub raw URLs.');
assert(!bootstrap.includes('raw.githubusercontent.com'), 'Local Bridge bootstrap must not depend on public GitHub raw URLs.');
assert(!sourceCore.includes('raw.githubusercontent.com'), 'Direct Local Bridge installer must not depend on public GitHub raw URLs.');
assert(!core.includes('raw.githubusercontent.com'), 'Distributed Local Bridge installer must not depend on public GitHub raw URLs.');
assert(page.includes('https://iammagnanimousway.com/downloads/local-bridge/bootstrap.ps1'), 'Activation must use the official distribution bootstrap.');
assert(page.includes('https://iammagnanimousway.com/downloads/local-bridge/uninstall.ps1'), 'Removal must use the official distribution path.');
assert(bootstrap.includes('$distributionBase = "https://iammagnanimousway.com/downloads/local-bridge"'), 'Bootstrap must pin the official distribution origin.');
assert(bootstrap.includes('install-core.ps1'), 'Bootstrap must load the staged core installer.');
assert(sourceCore.includes('https://iammagnanimousway.com/downloads/local-bridge/bridge_agent.py'), 'Direct installer must use the official bridge agent distribution.');
assert(sourceCore.includes('https://iammagnanimousway.com/downloads/local-bridge/ncs2_edge.py'), 'Direct installer must use the official NCS2 distribution.');
assert(bootstrap.includes('All Rights Reserved'), 'Distributed bootstrap must retain the proprietary notice.');
assert.equal(core, sourceCore, 'Staged core installer must exactly mirror the tested Local Bridge installer source.');
assert.equal(agent, sourceAgent, 'Staged bridge agent must exactly mirror the tested source.');
assert.equal(edge, sourceEdge, 'Staged NCS2 helper must exactly mirror the tested source.');
assert.equal(uninstall, sourceUninstall, 'Staged uninstaller must exactly mirror the tested source.');

console.log('Private repository readiness lock passed: Local Bridge no longer requires public repository access.');
