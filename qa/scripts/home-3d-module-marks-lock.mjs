import fs from 'node:fs';
import assert from 'node:assert/strict';

const page=fs.readFileSync('frontend/app/page.tsx','utf8');
const sprite='frontend/public/module-marks.webp';
assert.ok(fs.existsSync(sprite),'3-D module mark sprite is missing.');
assert.ok(fs.statSync(sprite).size>2500,'3-D module mark sprite looks empty or truncated.');

const marks=[
 'business-command','social-studio','magnanimous-ai','virtual-assistant',
 'professional-business-launch','knowledge-center','connected-assistant','routine-studio',
 'ai-receptionist','movie-maker','creator-growth','opportunity-vault','video-studio',
 'contact-center','white-label-studio'
];
for(const mark of marks) assert.ok(page.includes(`'${mark}'`),`Missing 3-D module mark mapping: ${mark}`);
assert.equal(new Set(marks).size,15,'Expected 15 unique module marks.');
assert.ok(page.includes("background-image:url('/module-marks.webp')"),'Homepage is not wired to the 3-D sprite.');
assert.ok(page.includes('background-size:500% 300%'),'Sprite layout contract changed.');
assert.ok(page.includes('@keyframes moduleMarkFloat'),'Idle 3-D mark motion is missing.');
assert.ok(page.includes('@keyframes moduleMarkShine'),'Reflective mark animation is missing.');
assert.ok(page.includes('prefers-reduced-motion:reduce'),'Reduced-motion safety is missing.');
assert.ok(page.includes('id="workspaces"')&&page.includes('id="systems"'),'Workspace/system deep links are missing.');
assert.ok(!page.includes('<b className="icon">{icon}</b>'),'Legacy emoji mark rendering returned.');
console.log('Home 3-D module marks lock PASS: 15 unique marks, sprite, motion and accessibility are intact.');

