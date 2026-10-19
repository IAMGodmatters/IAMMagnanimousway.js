import assert from 'node:assert/strict';
import fs from 'node:fs';
import {MAGNANIMOUS_CLOUD_SECURITY_PLAYBOOKS} from '../../worker/src/magnanimous-cloud-security-playbooks.js';
import {listMagnanimousAgentSkills,resolveMagnanimousAgentSkills,getMagnanimousAgentSkillsSummary} from '../../worker/src/magnanimous-agent-skills.js';
assert.equal(MAGNANIMOUS_CLOUD_SECURITY_PLAYBOOKS.length,20,'Cover all 20 independently studied public cloud security investigation areas.');
const names=MAGNANIMOUS_CLOUD_SECURITY_PLAYBOOKS.map(s=>s.name);
assert.equal(new Set(names).size,20,'Every native cloud skill must have a unique name.');
const registry=listMagnanimousAgentSkills({limit:100,includeInstructions:true});
for(const skill of MAGNANIMOUS_CLOUD_SECURITY_PLAYBOOKS){
 const item=registry.find(x=>x.name===skill.name);
 assert.ok(item,'Missing registered Magnanimous native skill '+skill.name);
 assert.equal(item.metadata.owner,'Magnanimous AI');
 assert.equal(item.metadata.risk,'read-only-investigation');
 assert.ok(item.metadata.capability_requirements.includes('no external cloud security subscription implied'),'Never misrepresent a paid vendor data source.');
 assert.ok(item.instructions.includes('Confirm the operator\'s authorization'));
 assert.ok(item.instructions.includes('Do not invent missing findings.'));
 assert.ok(item.instructions.includes('separate existing owner approval'));
 const result=resolveMagnanimousAgentSkills(skill.triggers[0],{limit:12});
 assert.ok(result.some(s=>s.name===skill.name),'Skill must resolve from its target phrase: '+skill.name);
}
assert.ok(getMagnanimousAgentSkillsSummary().builtin_skill_count>=30);
const src=fs.readFileSync('worker/src/magnanimous-cloud-security-playbooks.js','utf8');
assert.ok(!src.includes('apiKey'));
assert.ok(!src.includes('fetch('));
assert.ok(!src.includes('import('));
assert.ok(!src.includes('exec('));
assert.ok(fs.readFileSync('worker/src/magnanimous-agent-skills.js','utf8').includes('...MAGNANIMOUS_CLOUD_SECURITY_PLAYBOOKS'));
console.log('Magnanimous native cloud-security playbook coverage PASS: 20 distinct evidence-first skills available without external Orca telemetry.');
