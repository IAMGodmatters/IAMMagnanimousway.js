import fs from 'node:fs';
import assert from 'node:assert/strict';

const page=fs.readFileSync('frontend/app/page.tsx','utf8');
const marks=fs.readFileSync('frontend/app/cinematic-module-mark.tsx','utf8');
const shell=fs.readFileSync('frontend/app/platform-chrome.tsx','utf8');
const layout=fs.readFileSync('frontend/app/layout.tsx','utf8');

const names=['business-command','social-studio','magnanimous-ai','virtual-assistant','professional-business-launch','knowledge-center','connected-assistant','routine-studio','ai-receptionist','movie-maker','creator-growth','opportunity-vault','video-studio','contact-center','white-label-studio'];
for(const name of names){assert.ok(page.includes(`'${name}'`),`Homepage missing module route mapping: ${name}`);assert.ok(marks.includes(`case '${name}'`),`Crisp SVG mark missing: ${name}`)}
assert.equal(new Set(names).size,15,'Expected 15 unique module marks.');
assert.ok(page.includes("import CinematicModuleMark from './cinematic-module-mark'"),'Homepage must use scalable cinematic SVG marks.');
assert.ok(page.includes('<CinematicModuleMark name={mark} index={idx}/>'),'Homepage card grid is not wired to scalable SVG marks.');
assert.ok(!page.includes('module-marks.webp'),'Low-resolution sprite must not return to homepage rendering.');
assert.ok(marks.includes('<svg viewBox="0 0 120 120"'),'Module artwork must remain resolution-independent SVG.');
assert.ok(page.includes('grid-template-columns:repeat(5,minmax(0,1fr))'),'Desktop command grid must retain the approved five-column layout.');
assert.ok(page.includes('@media(max-width:760px)')&&page.includes('.commandGrid{grid-template-columns:1fr;gap:10px}'),'Phone layout must retain a readable single-column command grid.');
assert.ok(page.includes('@media(max-width:430px)')&&page.includes('grid-template-columns:105px 1fr'),'Small-phone horizontal card layout is missing.');
assert.ok(page.includes('prefers-reduced-motion:reduce'),'Reduced-motion safety is missing.');
assert.ok(layout.includes('className="iam-shell-content"'),'Global command shell content wrapper is missing.');
assert.ok(shell.includes('iam-shell-sidebar')&&shell.includes('iam-shell-topbar'),'Collapsible command-center shell is missing.');
assert.ok(shell.includes('iam_sidebar_collapsed'),'Sidebar collapse preference is not persisted.');
assert.ok(shell.includes('@media(max-width:820px)')&&shell.includes('mobileOpen'),'Mobile drawer behavior is missing.');
assert.ok(shell.includes("label:'Shop'")&&shell.includes("href:'/shop'"),'Shop must remain available from the shell when the floating button is hidden.');
assert.ok(shell.includes("'/magnanimous'")&&shell.includes("'/telecom-standalone'"),'Standalone surfaces must remain isolated from the full command shell.');
console.log('Cinematic command-center UI lock PASS: crisp SVG marks, five-column desktop grid, phone-safe cards, collapsible sidebar, mobile drawer, and standalone isolation are intact.');
