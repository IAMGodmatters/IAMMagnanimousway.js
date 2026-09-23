import assert from 'node:assert/strict';
import { getPluginIndependenceReadiness } from '../../worker/src/magnanimous-connector-absorption.js';

const report=getPluginIndependenceReadiness();
assert.equal(report.identity,'Magnanimous AI');
assert.ok(report.total_capability_contracts>0);
assert.ok(report.native_targets>0);
assert.ok(Array.isArray(report.targets));
assert.ok(Array.isArray(report.next_native_targets));
assert.ok(Array.isArray(report.canary_targets));
assert.ok(report.targets.every(x=>typeof x.replacement_surface_ratio==='number'));
assert.ok(report.targets.every(x=>x.replacement_surface_ratio>=0&&x.replacement_surface_ratio<=1));
assert.ok(report.targets.every(x=>x.plugin_adapter_candidate=== (x.total>0&&x.replacement_surface_ready===x.total)));
assert.ok(report.targets.every(x=>x.external_system_free=== (x.total>0&&x.native_ready===x.total&&x.requires_external===0)));
assert.equal(report.replacement_surface_ready_contracts,report.targets.reduce((n,x)=>n+x.replacement_surface_ready,0));
assert.match(report.truth,/real Magnanimous execution surface/i);
assert.match(report.retirement_rule,/execution surfaces.*contract tests.*security.*canary.*rollback/i);
assert.equal(report.status,report.targets.every(x=>x.plugin_adapter_candidate)?'replacement-surfaces-complete':'migration-in-progress');

console.log('Magnanimous plugin native readiness engine: PASS');
