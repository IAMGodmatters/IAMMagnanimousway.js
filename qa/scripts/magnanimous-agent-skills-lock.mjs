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

const malformed=parseAgentSkillMarkdown(`---\nname: malformed-skill\ndescription: "unterminated\n---\nbody`,{directoryName:'malformed-skill'});
assert.equal(malformed.ok,false,'Malformed quoted YAML scalars must fail validation.');
assert.ok(malformed.errors.some(x=>x.includes('Malformed quoted YAML scalar')));

const oversizedSource=`---\nname: oversized-skill\ndescription: Oversized validation test.\n---\n${'x'.repeat(160001)}`;
const oversized=parseAgentSkillMarkdown(oversizedSource,{directoryName:'oversized-skill'});
assert.equal(oversized.ok,false,'Oversized SKILL.md input must be rejected instead of silently truncated.');
assert.ok(oversized.errors.some(x=>x.includes('validation limit')));

const resolved=resolveMagnanimousAgentSkills('Clone and absorb a public GitHub AI repository, verify its license, and add useful MCP capabilities.',{limit:4});
assert.ok(resolved.length>0,'Skill resolution must return relevant matches.');
assert.equal(resolved[0].name,'cleanroom-capability-assimilation','Clean-room assimilation should lead for clone/absorb requests.');
assert.ok(resolved.some(x=>x.name==='mcp-integration'),'MCP integration should also resolve for MCP work.');

const billing=listMagnanimousAgentSkills({query:'billing',limit:5}).find(x=>x.name==='billing-and-cost-guard');
assert.ok(billing,'Billing and cost guard must remain available.');
assert.equal(Object.prototype.hasOwnProperty.call(billing.metadata||{},'native_capabilities'),false,'Billing skill must not advertise capability routes that do not exist.');

const mesh=fs.readFileSync('worker/src/magnanimous-capability-mesh.js','utf8');
for(const route of ['skills.summary','skills.catalog','skills.resolve','skills.validate']){
  assert.ok(mesh.includes(`'${route}':{surface:'magnanimous-agent-skills'`),`Capability Mesh must expose ${route}.`);
}
assert.ok(mesh.includes("from './magnanimous-agent-skills.js'"),'Capability Mesh must import the native Agent Skills core.');
assert.ok(mesh.includes('source-available document skills'),'Capability Mesh must preserve the license/provenance boundary.');

for(const [name,prompt] of [
 ['mcp-manifest-integrity','Inspect MCP manifest drift and require review for changed tool schemas.'],
 ['supervised-parallel-development','Plan parallel coding agents in isolated worktrees with verification.'],
 ['cloud-security-evidence-triage','Review cloud alert misconfiguration and CVE blast radius.']
]){
 const listed=listMagnanimousAgentSkills({query:name,includeInstructions:true});
 assert.ok(listed.some(x=>x.name===name),name+' must appear in native skills catalog.');
 const resolved=resolveMagnanimousAgentSkills(prompt,{limit:8});
 assert.ok(resolved.some(x=>x.name===name),name+' must resolve from an appropriate user goal.');
}
console.log('Magnanimous Agent Skills compatibility lock passed.');
