import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

const page=fs.readFileSync('frontend/app/page.tsx','utf8');
const desktopAsset=fs.readFileSync('frontend/public/crm-upgrade.jpeg');
const mobileAsset=fs.readFileSync('frontend/public/mobile-dashboard-approved.webp');
const mobileSharpAsset=fs.readFileSync('frontend/public/mobile-dashboard-approved-sharp.webp');
const shell=fs.readFileSync('frontend/app/platform-chrome.tsx','utf8');
const layout=fs.readFileSync('frontend/app/layout.tsx','utf8');
const clarity=fs.readFileSync('frontend/app/interaction-clarity.tsx','utf8');

const expectedDesktopHash='4782F5011B660DC4A189B1A2A315352C241CAD40C4800AD2A5C78949837EC548';
const expectedMobileGitBlob='65036a811159196e6fe1789760db162e901cf4fa';
const expectedMobileSharpGitBlob='b355bb1821555513c28786a19ec3be202f75575f';
const sha256=input=>crypto.createHash('sha256').update(input).digest('hex').toUpperCase();
const gitBlobSha=input=>crypto.createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${input.length}\0`),input])).digest('hex');
const assertCompleteWebp=(input,label)=>{
 assert.equal(input.subarray(0,4).toString(),'RIFF',`${label} must be a RIFF container.`);
 assert.equal(input.subarray(8,12).toString(),'WEBP',`${label} must be a WebP container.`);
 assert.equal(input.readUInt32LE(4)+8,input.length,`${label} RIFF declared length must match the actual file length.`);
 let offset=12;
 while(offset<input.length){
  assert.ok(offset+8<=input.length,`${label} has a truncated WebP chunk header.`);
  const size=input.readUInt32LE(offset+4);
  const end=offset+8+size;
  assert.ok(end<=input.length,`${label} has a truncated WebP chunk payload.`);
  offset=end+(size&1);
 }
 assert.equal(offset,input.length,`${label} WebP chunk boundaries must end exactly at EOF.`);
};
assert.equal(sha256(desktopAsset),expectedDesktopHash,'Approved desktop dashboard artwork changed unexpectedly.');
assert.equal(gitBlobSha(mobileAsset),expectedMobileGitBlob,'Known-working mobile dashboard artwork changed unexpectedly. Restore the exact approved portrait artwork.');
assert.equal(gitBlobSha(mobileSharpAsset),expectedMobileSharpGitBlob,'High-resolution mobile enhancement changed unexpectedly.');
assertCompleteWebp(mobileAsset,'Known-working mobile fallback');
assertCompleteWebp(mobileSharpAsset,'High-resolution mobile enhancement');

const requiredRoutes=[
 "{label:'Home',href:'/'}",
 "{label:'AI Command',href:'/ai-chat'}",
 "{label:'Opportunity Vault',href:'/opportunity-vault'}",
 "{label:'CRM',href:'/crm'}",
 "{label:'Travel Agency',href:'/travel-agency'}",
 "{label:'AI Business',href:'/business-ai'}",
 "{label:'Launch Magnanimous',href:'/business-plan'}",
 "{label:'Video Studio',href:'/video-studio'}",
 "{label:'Social Studio',href:'/social-media'}",
 "{label:'AI Receptionist',href:'/ai-receptionist'}",
 "{label:'Virtual Assistant',href:'/virtual-assistant'}",
 "{label:'Knowledge Center',href:'/knowledge'}",
 "{label:'Professional Business',href:'/professional'}",
 "{label:'Routines',href:'/routine-studio'}",
 "{label:'Connected',href:'/connections'}",
 "{label:'Reports',href:'/activity'}",
 "{label:'Movie Maker',href:'/movie-maker'}",
 "{label:'AI Tools & More',href:'/ai-apps'}",
 "{label:'Settings',href:'/account'}"
];
for(const route of requiredRoutes)assert.ok(page.includes(route),`Homepage route missing or changed: ${route}`);

const mobileStart=page.indexOf('const mobileReferenceCards');
const mobileEnd=page.indexOf('];',mobileStart);
assert.ok(mobileStart>=0&&mobileEnd>mobileStart,'Approved mobile reference card map is missing.');
const mobileReferenceBlock=page.slice(mobileStart,mobileEnd);
const referenceOrder=[
 "{label:'Video Studio',href:'/video-studio'",
 "{label:'White Label',href:'/white-label'",
 "{label:'Creator Studio',href:'/studio'",
 "{label:'Growth',href:'/creator-growth'",
 "{label:'Opportunity Vault',href:'/opportunity-vault'",
 "{label:'Knowledge Center',href:'/knowledge'",
 "{label:'Routines',href:'/routine-studio'",
 "{label:'AI Receptionist',href:'/ai-receptionist'",
 "{label:'Connected',href:'/connections'",
 "{label:'Professional Business',href:'/professional'",
 "{label:'Launch Magnanimous',href:'/business-plan'",
 "{label:'AI Business',href:'/business-ai'",
 "{label:'Command',href:'/ai-chat'",
 "{label:'Social Studio',href:'/social-media'",
 "{label:'Virtual Assistant',href:'/virtual-assistant'",
 "{label:'Reports',href:'/activity'"
];
let previous=-1;
for(const route of referenceOrder){const next=mobileReferenceBlock.indexOf(route);assert.ok(next>previous,`Approved mobile reference route missing or out of order: ${route}`);previous=next}
assert.equal((mobileReferenceBlock.match(/\{label:/g)||[]).length,16,'Approved mobile reference must keep exactly sixteen two-column modules.');

assert.ok(page.includes("const cardLinks=[...sideLinks]"),'Desktop artwork card links must remain mapped from the approved sidebar routes.');
assert.ok(page.includes('className="exactArtwork" src="/crm-upgrade.jpeg"'),'Desktop must continue using the exact approved dashboard artwork.');
assert.ok(page.includes('className="mobileReferenceArtwork" src="/mobile-dashboard-approved.webp"'),'Mobile must render the exact approved portrait reference artwork as the guaranteed fallback.');
assert.ok(page.includes('className="mobileReferenceFrame"')&&page.includes('aspect-ratio:941/1672'),'Mobile reference frame must preserve the approved artwork proportions.');
assert.ok(clarity.includes("background-image: url('/mobile-dashboard-approved.webp?lock=65036a811159196e6fe1789760db162e901cf4fa') !important"),'Mobile resilience background must be the known-working approved artwork.');
assert.ok(clarity.includes("background-image: url('/mobile-dashboard-approved-sharp.webp?lock=b355bb1821555513c28786a19ec3be202f75575f')"),'Mobile sharp layer must use the locked high-resolution artwork.');
assert.ok(clarity.includes('body.iam-design-v2 .mobileReferenceFrame::after')&&clarity.includes('pointer-events: none'),'High-resolution enhancement must remain visual-only and must not replace mobile interactions.');
assert.ok(!clarity.includes("mobile-dashboard-fallback.svg"),'Simplified fallback artwork must never replace the approved mobile design.');
assert.ok(page.includes('className="mobileReferenceHot mobileCardHot"'),'Approved mobile cards must remain fully clickable through aligned hotspots.');
assert.ok(page.includes('mobileBottomCommand')&&page.includes('mobileBottomOpportunity')&&page.includes('mobileBottomCrm')&&page.includes('mobileBottomMore'),'Approved five-item mobile bottom navigation is incomplete.');
assert.ok(page.includes('id="mobile-side-menu"')&&page.includes('className="mobileDrawerLinks"'),'Phone layout must provide the collapsible sidebar menu.');
assert.ok(page.includes('id="mobile-reference-search"')&&page.includes('mobileSearchHot')&&page.includes('mobileSearchRef.current?.focus()'),'Mobile artwork search control must open a functional keyboard-accessible search panel.');
assert.ok(page.includes('mobileNotifyHot')&&page.includes('mobileOwnerHot')&&page.includes('mobileTutorialHot'),'Notifications, owner/profile, and tutorial artwork controls must remain clickable.');
assert.ok(page.includes('desktopSidebarToggle')&&page.includes('desktopSidebarMask'),'Desktop artwork sidebar must be collapsible without replacing the desktop dashboard.');
assert.ok(page.includes("localStorage.getItem('iam_home_sidebar_collapsed')")&&page.includes("localStorage.setItem('iam_home_sidebar_collapsed'"),'Desktop sidebar collapse preference must persist.');
assert.ok(page.includes('platformGuideHot')&&page.includes('guidedTourHot'),'Desktop dashboard guide buttons must remain clickable.');
assert.ok(page.includes('@media(max-width:1024px)')&&page.includes('.desktopStage{display:none!important}')&&page.includes('.mobileExactStage{display:block'),'Phone/tablet breakpoint must isolate the approved mobile composition from desktop.');
assert.ok(page.includes('setMenuOpen(value=>!value)')&&page.includes("menuOpen?'Close sidebar menu':'Open sidebar menu'"),'Mobile menu control must toggle closed as well as open.');
assert.ok(page.includes("if(!menuOpen)return;const previous=document.body.style.overflow;document.body.style.overflow='hidden'"),'Only the open mobile drawer may lock background scrolling.');
assert.ok(page.includes('mobileDrawerCloseRef.current?.focus()')&&page.includes('mobileMenuButtonRef.current?.focus()')&&page.includes("setAttribute('inert','')"),'Mobile drawer must move focus inside, make covered content inert, and restore focus.');
assert.ok(page.includes('mobileServiceAlert checking')&&page.includes('mobileServiceAlert degraded')&&page.includes('Some live services unavailable'),'Static reference status must be corrected visibly when live services are not ready.');
assert.ok(layout.includes("width:'device-width'")&&layout.includes("viewportFit:'cover'"),'Root layout must publish an explicit device-width viewport for reliable iOS/embedded-browser sizing.');
assert.ok(page.includes('.exactArtwork')&&page.includes('object-fit:contain'),'Desktop dashboard artwork must preserve its aspect ratio instead of stretching.');
assert.ok(page.includes('overflow-x:clip'),'Mobile page must prevent sideways drift while retaining normal document scrolling.');
assert.ok(page.includes('@media(prefers-reduced-motion:reduce)'),'Reduced-motion safety is missing.');
assert.ok(!layout.includes("import MobileHomeDashboard from './mobile-home-dashboard'")&&!layout.includes('<MobileHomeDashboard/>'),'Superseded replacement mobile overlay must stay unmounted.');
assert.ok(layout.includes('className="iam-shell-content"'),'Global command shell content wrapper is missing.');
assert.ok(shell.includes('iam-shell-sidebar')&&shell.includes('iam-shell-topbar'),'Global collapsible command-center shell is missing.');
assert.ok(shell.includes('iam_sidebar_collapsed'),'Global sidebar collapse preference is not persisted.');
assert.ok(shell.includes('@media(max-width:820px)')&&shell.includes('mobileOpen'),'Global mobile drawer behavior is missing.');
assert.ok(shell.includes("'/magnanimous'")&&shell.includes("'/telecom-standalone'"),'Standalone surfaces must remain isolated from the full command shell.');

console.log('Exact dashboard responsive UI lock PASS: desktop artwork is immutable, both mobile WebPs are structurally complete, the known-working mobile artwork stays underneath the complete high-resolution enhancement, and clickable behavior remains above both visual layers.');
