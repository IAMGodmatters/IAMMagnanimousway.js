import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

const page=fs.readFileSync('frontend/app/page.tsx','utf8');
const asset=fs.readFileSync('frontend/public/crm-upgrade.jpeg');
const shell=fs.readFileSync('frontend/app/platform-chrome.tsx','utf8');
const layout=fs.readFileSync('frontend/app/layout.tsx','utf8');

const expectedAssetHash='4782F5011B660DC4A189B1A2A315352C241CAD40C4800AD2A5C78949837EC548';
const assetHash=crypto.createHash('sha256').update(asset).digest('hex').toUpperCase();
assert.equal(assetHash,expectedAssetHash,'Approved dashboard artwork changed unexpectedly.');

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

function dashboardArtworkStyleIsGlobal(source){
 const styleBlocks=[...source.matchAll(/<style jsx( global)?>\{`([\s\S]*?)`\}<\/style>/g)];
 const dashboardBlock=styleBlocks.find(match=>match[2].includes('.mobileCardGrid{')&&match[2].includes('.artCrop{')&&match[2].includes('.mobileDrawerLinks'));
 return dashboardBlock?.[1]===' global';
}

assert.ok(page.includes("const cardLinks=[...sideLinks]"),'Artwork card links must remain mapped from the approved sidebar routes.');
assert.ok(page.includes('src="/crm-upgrade.jpeg"'),'Homepage must continue using the exact approved dashboard artwork.');
assert.ok(page.includes('function ArtworkCrop'),'Phone layout must reuse crops from the approved artwork instead of introducing a replacement visual design.');
assert.ok(page.includes('className="mobileCardGrid"'),'Phone layout must expose the existing dashboard cards as readable touch targets.');
assert.ok(page.includes('grid-template-columns:repeat(2,minmax(0,1fr))'),'Phone dashboard must retain the two-column artwork card grid.');
assert.ok(page.includes('className="mobileDrawerLinks"'),'Phone layout must provide the existing sidebar links in a collapsible drawer.');
assert.ok(dashboardArtworkStyleIsGlobal(page),'The specific style block containing ArtworkCrop/mobile dashboard selectors must remain global so child-component selectors cannot be silently scoped away.');
assert.ok(page.includes('desktopSidebarToggle')&&page.includes('desktopSidebarMask'),'Desktop artwork sidebar must be collapsible without replacing the dashboard.');
assert.ok(page.includes("localStorage.getItem('iam_home_sidebar_collapsed')")&&page.includes("localStorage.setItem('iam_home_sidebar_collapsed'"),'Desktop sidebar collapse preference must persist.');
assert.ok(page.includes('platformGuideHot')&&page.includes('guidedTourHot'),'Dashboard guide buttons must remain clickable.');
assert.ok(page.includes('@media(max-width:1024px)')&&page.includes('.desktopStage{display:none!important}')&&page.includes('.mobileExactStage{display:block'),'Phone/tablet breakpoint must force the artwork-preserving mobile composition even in wide-layout mobile browsers.');
assert.ok(page.includes('setMenuOpen(value=>!value)')&&page.includes("menuOpen?'Close sidebar menu':'Open sidebar menu'"),'Mobile menu control must toggle closed as well as open instead of immediately reopening.');
assert.ok(page.includes("document.body.style.overflow='hidden'"),'Open mobile drawer must lock background scrolling.');
assert.ok(page.includes('mobileDrawerCloseRef.current?.focus()')&&page.includes('mobileMenuButtonRef.current?.focus()')&&page.includes("setAttribute('inert','')"),'Mobile drawer must move focus inside, make covered content inert, and restore focus to the menu toggle.');
assert.ok(page.includes('className="mobileDrawerExtra" href="/creator-growth"'),'Creator Growth must remain directly reachable from the mobile drawer.');
assert.ok(page.includes('className="mobileTutorialOverlay" href="/guide"')&&!page.includes('<ArtworkCrop label="Open platform guide"'),'The visible tutorial artwork must own the tutorial click target; unrelated lower dashboard cards must not masquerade as guide controls.');
assert.ok(page.includes('.mobileTopbar{position:sticky;top:0')&&page.includes('overflow-x:clip'),'Mobile header must remain sticky without an overflow scrolling ancestor breaking sticky positioning.');
assert.ok(page.includes('mobileHeroStatus online')&&page.includes('Some live services unavailable'),'Mobile artwork must overlay its static service badges with verified live-service status.');
assert.ok(!page.includes('.mobileOwnerCrop{display:none'),'Owner Center access must remain available on narrow phones.');
assert.ok(layout.includes("width:'device-width'")&&layout.includes("viewportFit:'cover'"),'Root layout must publish an explicit device-width viewport for reliable iOS/embedded-browser sizing.');
assert.ok(page.includes('object-fit:contain'),'Desktop dashboard artwork must preserve its aspect ratio instead of stretching.');
assert.ok(page.includes('@media(prefers-reduced-motion:reduce)'),'Reduced-motion safety is missing.');
assert.ok(!page.includes('mobileCardIcon')&&!page.includes('const descriptions:'),'Do not replace the approved artwork with a newly styled mobile card design.');
assert.ok(layout.includes('className="iam-shell-content"'),'Global command shell content wrapper is missing.');
assert.ok(shell.includes('iam-shell-sidebar')&&shell.includes('iam-shell-topbar'),'Global collapsible command-center shell is missing.');
assert.ok(shell.includes('iam_sidebar_collapsed'),'Global sidebar collapse preference is not persisted.');
assert.ok(shell.includes('@media(max-width:820px)')&&shell.includes('mobileOpen'),'Global mobile drawer behavior is missing.');
assert.ok(shell.includes("'/magnanimous'")&&shell.includes("'/telecom-standalone'"),'Standalone surfaces must remain isolated from the full command shell.');

console.log('Exact dashboard responsive UI lock PASS: approved artwork hash, clickable routes, aspect-safe desktop view, collapsible sidebar, artwork-preserving phone cards, mobile drawer, and standalone isolation are intact.');