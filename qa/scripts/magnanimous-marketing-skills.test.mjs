import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  MAGNANIMOUS_MARKETING_SKILLS,
  getMagnanimousMarketingResource,
  listMagnanimousMarketingResources
} from '../../worker/src/magnanimous-marketing-skills.js';
import {
  getMagnanimousAgentSkillsSummary,
  listMagnanimousAgentSkills,
  resolveMagnanimousAgentSkills
} from '../../worker/src/magnanimous-agent-skills.js';

const read = path => fs.readFileSync(new URL('../../' + path, import.meta.url), 'utf8');

test('native marketing skill pack is registered without replacing existing skills', () => {
  const names = MAGNANIMOUS_MARKETING_SKILLS.map(skill => skill.name);
  assert.equal(names.length, 10);
  assert.equal(new Set(names).size, names.length);
  for (const name of [
    'magnanimous-marketing-department',
    'marketing-department-director',
    'marketing-content-coach',
    'marketing-brand-brief-builder',
    'marketing-platform-native-writer',
    'marketing-content-quality-grader',
    'marketing-content-repurposer',
    'marketing-hook-research-lab',
    'marketing-creative-asset-producer',
    'marketing-performance-analyst'
  ]) {
    assert.ok(names.includes(name), name + ' must exist in the native marketing pack.');
    assert.ok(listMagnanimousAgentSkills({ query: name, limit: 20 }).some(item => item.name === name), name + ' must be discoverable through the existing registry.');
  }
  assert.ok(listMagnanimousAgentSkills({ limit: 250 }).some(item => item.name === 'social-publishing-calendar-operator'), 'Existing publishing skill must remain intact.');
});

test('marketing requests resolve to the correct specialist skills', () => {
  const cases = [
    ['marketing campaign and content calendar for my small business', 'marketing-department-director'],
    ['I do not know what to post; give me content pillars and audience ideas', 'marketing-content-coach'],
    ['build a brand brief and capture our approved brand voice', 'marketing-brand-brief-builder'],
    ['write a LinkedIn post with a strong hook and CTA', 'marketing-platform-native-writer'],
    ['grade this post and give me the three most important fixes', 'marketing-content-quality-grader'],
    ['repurpose this YouTube video transcript into social posts', 'marketing-content-repurposer'],
    ['give me several honest video hooks and opening lines', 'marketing-hook-research-lab'],
    ['create a marketing graphic and video thumbnail', 'marketing-creative-asset-producer'],
    ['analyze YouTube content performance and audience engagement', 'marketing-performance-analyst'],
    ['schedule a TikTok post after approval', 'social-publishing-calendar-operator']
  ];
  for (const [goal, expected] of cases) {
    const matches = resolveMagnanimousAgentSkills(goal, { limit: 20, includeInstructions: true });
    assert.ok(matches.some(item => item.name === expected), expected + ' must resolve for: ' + goal);
  }
});

test('read-only resources are discoverable and return complete content', () => {
  const summary = getMagnanimousAgentSkillsSummary();
  assert.equal(summary.brain, 'Magnanimous AI');
  assert.equal(summary.domain_packs.marketing.skill_count, MAGNANIMOUS_MARKETING_SKILLS.length);
  const resources = listMagnanimousMarketingResources();
  assert.deepEqual(resources.map(item => item.id).sort(), [
    'marketing-channel-capability-matrix',
    'marketing-creative-asset-checklist',
    'marketing-playbook',
    'marketing-quality-rubric'
  ]);
  for (const item of resources) {
    const full = getMagnanimousMarketingResource(item.id);
    assert.ok(full && full.content.length > 300, item.id + ' must return its complete resource.');
    assert.equal(full.id, item.id);
  }
  assert.equal(getMagnanimousMarketingResource('../secret'), null, 'Unknown resource IDs must fail closed.');
  assert.match(getMagnanimousMarketingResource('marketing-quality-rubric').content, /not a prediction of reach, virality or sales/i);
  const channels = getMagnanimousMarketingResource('marketing-channel-capability-matrix').content;
  assert.match(channels, /YouTube, TikTok and LinkedIn/);
  assert.match(channels, /unaudited API clients to private viewing/);
  assert.match(channels, /does not establish native publish support/);
});

test('Capability Mesh and normal chat load marketing skills without bypassing existing controls', () => {
  const mesh = read('worker/src/magnanimous-capability-mesh.js');
  const agentSkills = read('worker/src/magnanimous-agent-skills.js');
  const provider = read('worker/src/provider-entrypoint.js');
  assert.match(mesh, /'skills\.resource':\{surface:'magnanimous-agent-skills',mode:'read',native:true\}/);
  assert.match(mesh, /getMagnanimousMarketingResource\(resourceId\)/);
  assert.match(agentSkills, /\.\.\.MAGNANIMOUS_MARKETING_SKILLS/);
  assert.match(agentSkills, /resources=\[\.\.\.skill\.resources\]/);
  assert.match(provider, /magnanimousMarketingSkillContext\(userMessage,capability\)/);
  assert.match(provider, /\$\{marketingSkillsContext\}/);
  assert.match(provider, /getMagnanimousMarketingResource\(id\)/);
  assert.match(provider, /approval and funding gates/);
  assert.match(mesh, /consequential mutations|confirmation/i);
});
