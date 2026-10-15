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
assert.ok(page.includes('function ArtworkCrop'),'Phone layout must continue reusing approved dashboard artwork for branded visual crops.');
assert.ok(page.includes('const mobileCards=['),'Phone layout must expose an explicit reference-matched mobile card order.');
for(const label of ['Video Studio','White Label','Creator Studio','Growth','Opportunity Vault','Knowledge Center','Routines','AI Receptionist','Connected','Professional Business','Launch Magnanimous','AI Business','Command','Social Studio','Virtual Assistant','Reports'])assert.ok(page.includes(`{label:'${label}'`),`Reference mobile card missing: ${label}`);
assert.ok(page.includes("{label:'White Label',href:'/white-label'")&&page.includes("{label:'Creator Studio',href:'/creator-growth'")&&page.includes("{label:'Growth',href:'/creator-growth'"),'Reference-only mobile cards must remain routed to working platform destinations.');
assert.ok(page.includes('className="mobileCardGrid"'),'Phone layout must expose the cinematic dashboard cards as touch targets.');
assert.ok(page.includes('grid-template-columns:repeat(2,minmax(0,1fr))'),'Phone dashboard must retain the approved two-column card grid.');
assert.ok(page.includes('className="mobileBottomNav"')&&page.includes('Mobile quick navigation'),'Reference mobile bottom navigation must remain present.');
for(const href of ['/ai-chat','/opportunity-vault','/crm'])assert.ok(page.includes(`href="${href}"`),`Mobile quick navigation route missing: ${href}`);
assert.ok(page.includes('className="mobileHeaderSearchToggle"')&&page.includes('id="mobile-search-panel"'),'Mobile header search control and usable search panel must remain connected.');
assert.ok(page.includes('className="mobileNotifications" href="/activity"'),'Mobile notification control must remain clickable.');
assert.ok(page.includes('className="mobileDrawerLinks"'),'Phone layout must provide a collapsible sidebar drawer.');
assert.ok(dashboardArtworkStyleIsGlobal(page),'The specific style block containing ArtworkCrop/mobile dashboard selectors must remain global so child-component selectors cannot be silently scoped away.');
assert.ok(page.includes('desktopSidebarToggle')&&page.includes('desktopSidebarMask'),'Desktop artwork sidebar must be collapsible without replacing the dashboard.');
assert.ok(page.includes("localStorage.getItem('iam_home_sidebar_collapsed')")&&page.includes("localStorage.setItem('iam_home_sidebar_collapsed'"),'Desktop sidebar collapse preference must persist.');
assert.ok(page.includes('platformGuideHot')&&page.includes('guidedTourHot'),'Desktop dashboard guide buttons must remain clickable.');
assert.ok(page.includes('@media(max-width:1024px)')&&page.includes('.desktopStage{display:none!important}')&&page.includes('.mobileExactStage{display:block'),'Phone/tablet breakpoint must remain isolated from the desktop composition.');
assert.ok(page.includes('setMenuOpen(value=>!value)')&&page.includes("menuOpen?'Close sidebar menu':'Open sidebar menu'"),'Mobile menu control must toggle closed as well as open instead of immediately reopening.');
assert.ok(page.includes("document.body.style.overflow='hidden'"),'Open mobile drawer must lock background scrolling.');
assert.ok(page.includes('mobileDrawerCloseRef.current?.focus()')&&page.includes('mobileMenuButtonRef.current?.focus()')&&page.includes("setAttribute('inert','')"),'Mobile drawer must move focus inside, make covered content inert, and restore focus to the menu toggle.');
assert.ok(page.includes('className="mobileDrawerExtra" href="/creator-growth"'),'Creator Growth must remain directly reachable from the mobile drawer.');
assert.ok(page.includes('className="mobileGuidePanel"')&&page.includes('href="/guide"'),'Mobile AI guide/tutorial must remain directly reachable.');
assert.ok(page.includes('className="mobileStatusStrip"')&&page.includes("ready&&online?'ok':'checking'"),'Mobile service status must remain tied to verified live-service state instead of a static claim.');
assert.ok(!page.includes('.mobileOwnerCrop{display:none'),'Owner Center access must remain available on narrow phones.');
assert.ok(layout.includes("width:'device-width'")&&layout.includes("viewportFit:'cover'"),'Root layout must publish an explicit device-width viewport for reliable iOS/embedded-browser sizing.');
assert.ok(page.includes('object-fit:contain'),'Desktop dashboard artwork must preserve its aspect ratio instead of stretching.');
assert.ok(page.includes('@media(prefers-reduced-motion:reduce)'),'Reduced-motion safety is missing.');
assert.ok(page.includes('.iam-help-link,.iam-tour-launch,.iam-progress-save{display:none!important}'),'Mobile homepage must suppress overlapping global helper chips while preserving their underlying functionality.');
assert.ok(layout.includes('className="iam-shell-content"'),'Global command shell content wrapper is missing.');
assert.ok(shell.includes('iam-shell-sidebar')&&shell.includes('iam-shell-topbar'),'Global collapsible command-center shell is missing.');
assert.ok(shell.includes('iam_sidebar_collapsed'),'Global sidebar collapse preference is not persisted.');
assert.ok(shell.includes('@media(max-width:820px)')&&shell.includes('mobileOpen'),'Global mobile drawer behavior is missing.');
assert.ok(shell.includes("'/magnanimous'")&&shell.includes("'/telecom-standalone'"),'Standalone surfaces must remain isolated from the full command shell.');

console.log('Exact dashboard responsive UI lock PASS: approved desktop artwork, reference-matched mobile cards/header/status/nav, live-state honesty, accessible drawer/search, reduced motion, and standalone isolation are intact.');