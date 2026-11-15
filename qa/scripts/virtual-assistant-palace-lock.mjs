import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = path => fs.readFileSync(new URL('../../' + path, import.meta.url), 'utf8');
const exists = path => fs.existsSync(new URL('../../' + path, import.meta.url));

const page = read('frontend/app/virtual-assistant/page.tsx');
const desktop = read('frontend/public/magnanimous-virtual-palace-v1.svg');
const mobile = read('frontend/public/magnanimous-virtual-palace-mobile-v1.svg');

assert.ok(page.includes('<section className="hero virtualRoyalHero">'), 'Virtual Assistant must opt into the palace hero without changing other routes');
assert.ok(page.includes("url('/magnanimous-virtual-palace-v1.svg')"), 'Desktop palace artwork must be referenced by the Virtual Assistant');
assert.ok(page.includes("background-image:url('/magnanimous-virtual-palace-mobile-v1.svg')"), 'Portrait mobile must use its dedicated palace artwork');
assert.ok(page.includes('@media(prefers-reduced-motion:reduce)'), 'Palace animation must honor reduced-motion preferences');
assert.ok(page.includes('.virtualRoyalHero:before{animation:none;transform:none}'), 'Reduced-motion mode must stop the decorative palace drift');
assert.ok(page.includes('pointer-events:none'), 'Decorative art layers must never intercept page controls');

for (const [name, svg] of [['desktop', desktop], ['mobile', mobile]]) {
  assert.ok(svg.startsWith('<svg'), name + ' palace asset must be valid SVG source');
  assert.ok(svg.includes('I AM MAGNANIMOUS WAY™'), name + ' artwork must retain the brand line');
  assert.ok(svg.includes('I Am Magnanimous Way, Trademark.'), name + ' artwork must carry the requested exact trademark wording');
  assert.ok(!svg.includes('God Matters, Trademark') && !svg.includes('God Matters™'), name + ' artwork must not trademark God Matters');
}
assert.ok(exists('frontend/public/magnanimous-virtual-palace-v1.svg'), 'Desktop palace asset must exist');
assert.ok(exists('frontend/public/magnanimous-virtual-palace-mobile-v1.svg'), 'Mobile palace asset must exist');

for (const behavior of [
  'I AM VIRTUAL ASSISTANT',
  'WORKSPACE KNOWLEDGE',
  'LIVE SEARCH',
  'onClick={run}',
  'CREATE RESULT',
  'SOURCES USED',
  'setType(x)'
]) assert.ok(page.includes(behavior), 'The palace styling must preserve existing Virtual Assistant behavior: ' + behavior);

console.log('Virtual Assistant palace lock passed: desktop/mobile art, exact trademark wording, reduced-motion safety, decorative pointer isolation, and existing assistant controls.');
