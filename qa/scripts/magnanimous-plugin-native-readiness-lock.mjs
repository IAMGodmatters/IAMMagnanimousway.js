import assert from 'node:assert/strict';
import { getPluginIndependenceReadiness } from '../../worker/src/magnanimous-connector-absorption.js';

const report=getPluginIndependenceReadiness();
assert.equal(report.identity,'Magnanimous AI');
assert.ok(report.total_capability_contracts>0);
assert.ok(report.native_targets>0);
assert.ok(Array.isArray(report.targets));
assert.ok(Array.isArray(report.next_native_targets));
assert.ok(report.targets.every(x=>typeof x.native_coverage_ratio==='number'));
assert.ok(report.targets.every(x=>x.native_coverage_ratio>=0&&x.native_coverage_ratio<=1));
assert.ok(report.targets.every(x=>x.provider_optional=== (x.external_benchmarks===0)));
assert.match(report.retirement_rule,/runtime.*contract tests.*security.*canary.*rollback/i);
assert.equal(report.status,report.targets.every(x=>x.provider_optional)?'native-independent':'migration-in-progress');

console.log('Magnanimous plugin native readiness engine: PASS');
