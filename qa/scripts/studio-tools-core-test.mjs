import assert from 'node:assert/strict';
import { calculate, convert, normalizeBackup } from '../../frontend/app/studio-tools/utility-tools-core.mjs';

assert.equal(calculate('12 * (3 + 2)'), 60);
assert.equal(calculate('-4 + 2 * 3'), 2);
assert.equal(calculate('8 % 3'), 2);
assert.throws(() => calculate('1 / 0'), /Division by zero/);
assert.throws(() => calculate('process.exit()'), /valid arithmetic/);
assert.throws(() => calculate('2 + (3'), /closing parenthesis/);

assert.equal(convert('1', 'Length', 'km', 'm'), 1000);
assert.equal(convert('32', 'Temperature', '°F', '°C'), 0);
assert.equal(convert('1', 'Weight', 'kg', 'g'), 1000);
assert.throws(() => convert('abc', 'Length', 'km', 'm'), /valid number/);
assert.throws(() => convert('1', 'Length', 'km', 'furlong'), /valid units/);

const oldBackup = normalizeBackup({
  app: 'Magnanimous Preact Studio',
  workspace: {
    tasks: [{ id: 't1', title: 'Pray', done: true }],
    notes: [{ id: 'n1', title: 'Idea', body: 'Keep this safe.' }],
    plans: [{ id: 'p1', title: 'Meeting', date: '2026-11-12', time: '09:30' }],
    habits: [{ id: 'h1', name: 'Read', doneOn: '2026-11-11' }],
  },
});
assert.equal(oldBackup.length, 4);
assert.equal(oldBackup[0].status, 'done');
assert.equal(oldBackup[1].data.body, 'Keep this safe.');
assert.equal(oldBackup[2].kind, 'planner');
assert.equal(oldBackup[3].data.doneOn, '2026-11-11');

const cloudBackup = normalizeBackup({
  records: [{ id: 'c1', title: 'Cloud task', status: 'open', due_at: null, data: { kind: 'task', body: '' } }],
});
assert.equal(cloudBackup[0].sourceId, 'c1');
assert.equal(cloudBackup[0].data.backup_source_id, 'c1');
assert.throws(() => normalizeBackup({ workspace: { tasks: [], notes: [], plans: [] } }), /supported Magnanimous Studio backup/);
assert.throws(() => normalizeBackup({ records: [{ id: 'x', title: 'bad', data: { kind: 'invoice' } }] }), /unsupported record type/);
assert.throws(() => normalizeBackup({ records: Array.from({ length: 501 }, (_, i) => ({ id: String(i), title: 'x', data: { kind: 'task' } })) }), /no more than 500/);
assert.throws(() => normalizeBackup({ records: [{ title: 'x'.repeat(241), data: { kind: 'task' } }] }), /1–240/);
console.log('Studio Tools core tests passed (calculator, unit conversions, legacy/cloud backup validation).');
