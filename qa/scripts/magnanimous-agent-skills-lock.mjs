import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  MAGNANIMOUS_AGENT_SKILLS_POLICY,
  getMagnanimousAgentSkillsSummary,
  listMagnanimousAgentSkills,
  parseAgentSkillMarkdown,
  resolveMagnanimousAgentSkills
} from '../../worker/src/magnanimous-agent-skills.js';

const summary=getMagnanimousAgentSkillsSummary();
assert.equal(summary.brain,'Magnanimous AI','Magnanimous AI must remain the brain.');
assert.equal(summary.orchestration_owner,'Magnanimous AI','Magnanimous AI must own orchestration.');
assert.equal(summary.authorization_owner,'Magnanimous Capability Mesh','Capability Mesh must retain authorization ownership.');
assert.equal(MAGNANIMOUS_AGENT_SKILLS_POLICY.source_basis.proprietary_claude_code_copied,false,'Proprietary Claude Code internals must not be copied.');
assert.deepEqual(MAGNANIMOUS_AGENT_SKILLS_POLICY.source_basis.excluded_source_available_families,['docx','pdf','pptx','xlsx']);
assert.match(MAGNANIMOUS_AGENT_SKILLS_POLICY.source_basis.reviewed_commit,/^[0-9a-f]{40}$/);
assert.ok(summary.builtin_skill_count>=6,'Expected the native Magnanimous skill baseline.');
assert.ok(listMagnanimousAgentSkills({limit:100}).some(x=>x.name==='cleanroom-capability-assimilation'));
assert.ok(listMagnanimousAgentSkills({limit:100}).some(x=>x.name==='billing-and-cost-guard'));

const valid=parseAgentSkillMarkdown(`---\nname: test-skill\ndescription: Verify a repeatable workflow. Use when testing skill compatibility.\nlicense: Apache-2.0\nmetadata:\n  author: test\n---\n# Test Skill\n\nDo the work and verify the result.`,{directoryName:'test-skill'});
assert.equal(valid.ok,true,JSON.stringify(valid.errors));
assert.equal(valid.metadata.name,'test-skill');
assert.equal(valid.metadata.metadata.author,'test');

const invalid=parseAgentSkillMarkdown(`---\nname: Bad--Skill\ndescription: invalid\n---\nbody`,{directoryName:'bad-skill'});
assert.equal(invalid.ok,false,'Invalid Agent Skills names must fail validation.');
assert.ok(invalid.errors.some(x=>x.includes('lowercase')));

const resolved=resolveMagnanimousAgentSkills('Clone and absorb a public GitHub AI repository, verify its license, and add useful MCP capabilities.',{limit:4});
assert.ok(resolved.length>0,'Skill resolution must return relevant matches.');
assert.equal(resolved[0].name,'cleanroom-capability-assimilation','Clean-room assimilation should lead for clone/absorb requests.');
assert.ok(resolved.some(x=>x.name==='mcp-integration'),'MCP integration should also resolve for MCP work.');

const mesh=fs.readFileSync('worker/src/magnanimous-capability-mesh.js','utf8');
for(const route of ['skills.summary','skills.catalog','skills.resolve','skills.validate']){
  assert.ok(mesh.includes(`'${route}':{surface:'magnanimous-agent-skills'`),`Capability Mesh must expose ${route}.`);
}
assert.ok(mesh.includes("from './magnanimous-agent-skills.js'"),'Capability Mesh must import the native Agent Skills core.');
assert.ok(mesh.includes('source-available document skills'),'Capability Mesh must preserve the license/provenance boundary.');

console.log('Magnanimous Agent Skills compatibility lock passed.');
