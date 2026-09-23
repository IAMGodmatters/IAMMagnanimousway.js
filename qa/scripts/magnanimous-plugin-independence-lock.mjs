import assert from 'node:assert/strict';
import {
  MAGNANIMOUS_UNIVERSAL_CAPABILITY_DOMAINS,
  MAGNANIMOUS_UNIVERSAL_EXECUTION_MODEL,
  MAGNANIMOUS_SELF_EVOLUTION_PROTOCOL,
  MAGNANIMOUS_SOURCE_OF_CAPABILITY
} from '../../worker/src/magnanimous-universal-capabilities.js';

const tools=MAGNANIMOUS_UNIVERSAL_CAPABILITY_DOMAINS.find(x=>x.id==='tools-connectors');
assert.ok(tools?.capabilities.includes('plugin-capability-inventory'));
assert.ok(tools?.capabilities.includes('native-skill-synthesis'));
assert.ok(tools?.capabilities.includes('provider-exit-readiness'));
assert.ok(tools?.capabilities.includes('dependency-retirement-gates'));

assert.ok(MAGNANIMOUS_UNIVERSAL_EXECUTION_MODEL.strategy.some(x=>x.includes('Inventory authorized plugin capabilities')));
assert.ok(MAGNANIMOUS_UNIVERSAL_EXECUTION_MODEL.strategy.some(x=>x.includes('parity tests')));
assert.ok(MAGNANIMOUS_SELF_EVOLUTION_PROTOCOL.automatic.allowed.includes('authorized plugin capability inventory'));
assert.ok(MAGNANIMOUS_SELF_EVOLUTION_PROTOCOL.hard_rules.some(x=>x.includes('does not transfer ownership')));
assert.match(MAGNANIMOUS_SOURCE_OF_CAPABILITY.plugin_independence_rule,/prove parity and rollback/i);

console.log('Magnanimous plugin independence contract: PASS');
