import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  getMagnanimousAgentSkillsSummary,
  listMagnanimousAgentSkills,
  parseAgentSkillMarkdown,
  resolveMagnanimousAgentSkills
} from '../../worker/src/magnanimous-agent-skills.js';

const summary=getMagnanimousAgentSkillsSummary();
assert.equal(summary.brain,'Magnanimous AI');
assert.equal(summary.orchestration_owner,'Magnanimous AI');
assert.ok(listMagnanimousAgentSkills({limit:250}).some(x=>x.name==='magnanimous-marketing-department'));
const skill=resolveMagnanimousAgentSkills('Create a brand brief, content strategy, viral hooks, grade social posts and repurpose a campaign into a content calendar.',{limit:10});
assert.ok(skill.some(x=>x.name==='magnanimous-marketing-department'),'Marketing workflow should resolve to the native marketing department.');
const registered=listMagnanimousAgentSkills({query:'magnanimous-marketing-department',includeInstructions:true,limit:5})[0];
assert.ok(registered.instructions.includes('Magnanimous AI is the single brain'));
assert.ok(registered.instructions.includes('explicit approval'));
assert.ok(registered.instructions.includes('Free-first'));
const source=fs.readFileSync('skills/magnanimous-marketing-department/SKILL.md','utf8');
const parsed=parseAgentSkillMarkdown(source,{directoryName:'magnanimous-marketing-department'});
assert.equal(parsed.ok,true,JSON.stringify(parsed.errors));
assert.equal(parsed.metadata.name,'magnanimous-marketing-department');
assert.match(parsed.body,/Never publish, message, spend/);
assert.match(parsed.body,/Never guarantee virality/);
assert.match(parsed.body,/tenant isolation/);
assert.match(parsed.body,/I Am Magnanimous Way, Trademark/);
const oldSocial=resolveMagnanimousAgentSkills('Schedule a TikTok or LinkedIn post for a connected account.',{limit:12});
assert.ok(oldSocial.some(x=>x.name==='social-publishing-calendar-operator'),'Existing publishing calendar skill must remain discoverable.');
assert.ok(summary.builtin_skill_count>=1);
console.log('Magnanimous Marketing Department skill lock passed.');
