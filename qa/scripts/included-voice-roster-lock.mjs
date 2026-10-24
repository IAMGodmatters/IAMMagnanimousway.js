import assert from 'node:assert/strict';
import { seedIncludedVoiceAgents } from '../../worker/src/voice-agent-runtime.js';

function fakeDatabase() {
  const rows = new Map();
  const env = { DB: { prepare(sql) {
    return { bind(...args) {
      return {
        async all() {
          assert.match(sql, /SELECT id,name FROM voice_agents WHERE tenant_id=\?/);
          return { results: [...rows.values()].filter(row => row.tenant_id === args[0]) };
        },
        async run() {
          assert.match(sql, /INSERT OR IGNORE INTO voice_agents/);
          const [id, tenant_id, name, instructions, opening_message, twilio_voice, tavus_replica_id, tavus_persona_id, created_at] = args;
          if (!rows.has(id)) rows.set(id, { id, tenant_id, name, instructions, opening_message, twilio_voice, tavus_replica_id, tavus_persona_id, created_at, active: 1 });
          return { success: true };
        }
      };
    } };
  } } };
  return { env, rows };
}

const { env, rows } = fakeDatabase();
await Promise.all([seedIncludedVoiceAgents(env, 'workspace-a'), seedIncludedVoiceAgents(env, 'workspace-a')]);
assert.equal(rows.size, 4, 'first visit creates four included voices even with concurrent requests');
assert.deepEqual([...rows.values()].map(row => row.name), [
  'AI Receptionist', 'Customer Support AI', 'Sales & Lead Assistant', 'Appointment Assistant'
]);
assert.ok([...rows.values()].every(row => /automated|AI/i.test(row.opening_message)), 'all greetings disclose AI identity');
assert.ok([...rows.values()].every(row => !row.tavus_replica_id && !row.tavus_persona_id), 'profiles cannot silently enable a paid video provider');

const support = rows.get('included:support:workspace-a');
support.instructions = 'Owner customized this prompt';
support.active = 0;
await seedIncludedVoiceAgents(env, 'workspace-a');
assert.equal(rows.size, 4, 'repeat visits do not add duplicates');
assert.equal(support.instructions, 'Owner customized this prompt', 'owner instructions are preserved');
assert.equal(support.active, 0, 'inactive profiles are not re-enabled');

rows.set('customer-defined', { id:'customer-defined', tenant_id:'workspace-b', name:'AI Receptionist', active:1 });
await seedIncludedVoiceAgents(env, 'workspace-b');
assert.equal([...rows.values()].filter(row => row.tenant_id === 'workspace-b').length, 4, 'existing customer receptionist is retained with three new roles');
assert.equal(rows.get('customer-defined').name, 'AI Receptionist');
assert.equal(rows.get('included:support:workspace-b').tenant_id, 'workspace-b', 'voice roles remain tenant isolated');
console.log('PASS: included Voice AI profiles are automatic, idempotent, tenant isolated and opt-out safe.');
