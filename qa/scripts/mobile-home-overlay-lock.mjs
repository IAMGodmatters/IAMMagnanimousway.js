import fs from 'node:fs';
import assert from 'node:assert/strict';

const layout=fs.readFileSync('frontend/app/layout.tsx','utf8');
const page=fs.readFileSync('frontend/app/page.tsx','utf8');
const approvedMobileArtwork='frontend/public/mobile-dashboard-approved.webp';

assert.ok(!layout.includes("import MobileHomeDashboard from './mobile-home-dashboard'"),'The rejected replacement mobile overlay must remain unmounted.');
assert.ok(!layout.includes('<MobileHomeDashboard/>'),'The rejected replacement mobile overlay must remain unmounted.');
assert.ok(!layout.includes("import './mobile-approved-polish.css'"),'Superseded overlay-only polish must stay unmounted.');
assert.ok(!fs.existsSync('frontend/proxy.ts'),'Static export must not rely on Next proxy routing for the mobile home.');
assert.ok(!fs.existsSync('frontend/app/mobile-dashboard/page.tsx'),'Do not ship a second home route that bypasses the canonical home page.');

assert.ok(fs.existsSync(approvedMobileArtwork),'Approved portrait mobile artwork is missing.');
const approvedBytes=fs.readFileSync(approvedMobileArtwork);
assert.ok(approvedBytes.length>90_000,'Approved portrait mobile artwork looks unexpectedly small.');
assert.equal(approvedBytes.subarray(0,4).toString('ascii'),'RIFF','Approved portrait mobile artwork is not a valid RIFF WebP container.');
assert.equal(approvedBytes.subarray(8,12).toString('ascii'),'WEBP','Approved portrait mobile artwork is not a valid WebP asset.');
assert.ok(page.includes('className="mobileExactStage"'),'Exact mobile stage is missing.');
assert.ok(page.includes('className="mobileReferenceArtwork"')&&page.includes('src="/mobile-dashboard-approved.webp"'),'Mobile home must render the literal approved portrait artwork.');
assert.ok(page.includes('const mobileReferenceCards:LinkItem[]=['),'Approved mobile module map is missing.');
assert.ok(page.includes('className="mobileCardGrid"'),'Clickable mobile card hotspot grid is missing.');
assert.ok(page.includes('grid-template-columns:repeat(2,minmax(0,1fr))'),'Mobile dashboard must preserve the reference two-column composition.');
assert.ok(page.includes('grid-template-rows:repeat(8,minmax(0,1fr))'),'Mobile dashboard must preserve all eight reference card rows.');
for(const label of ['Video Studio','White Label','Creator Studio','Growth','Opportunity Vault','Knowledge Center','Routines','AI Receptionist','Connected','Professional Business','Launch Magnanimous','AI Business','Command','Social Studio','Virtual Assistant','Reports'])assert.ok(page.includes(`label:'${label}'`),`Approved mobile card missing ${label}`);
for(const route of ['/video-studio','/white-label','/studio','/creator-growth','/opportunity-vault','/knowledge','/routine-studio','/ai-receptionist','/connections','/professional','/business-plan','/business-ai','/ai-chat','/social-media','/virtual-assistant','/activity'])assert.ok(page.includes(`href:'${route}'`)||page.includes(`href="${route}"`),`Approved mobile route missing ${route}`);

assert.ok(page.includes('className="mobileBottomNav"'),'Approved five-item bottom navigation is missing.');
for(const label of ['Home','AI Command','Opportunity','CRM','More'])assert.ok(page.includes(`aria-label="${label}"`),`Bottom navigation missing ${label}`);
assert.ok(page.includes('mobileSearchToggle')&&page.includes('id="mobile-search-panel"')&&page.includes('mobileSearchInputRef.current?.focus()'),'Mobile search interaction is incomplete.');
assert.ok(page.includes('mobileNotifyHot')&&page.includes('href="/activity"'),'Notification hotspot must stay clickable.');
assert.ok(page.includes('mobileOwnerHot')&&page.includes('href="/owner-center"'),'Owner/profile hotspot must stay clickable.');
assert.ok(page.includes('mobileGuideHot')&&page.includes('href="/ai-chat"'),'AI Guide hotspot must stay clickable.');
assert.ok(page.includes('mobileTutorialOverlay')&&page.includes('href="/guide"'),'Tutorial hotspot must stay clickable.');
assert.ok(page.includes('id="mobile-side-menu"')&&page.includes('setMenuOpen(value=>!value)'),'Collapsible mobile menu is missing.');
assert.ok(page.includes('mobileDrawerCloseRef.current?.focus()')&&page.includes('mobileMenuButtonRef.current?.focus()'),'Drawer focus management is missing.');
assert.ok(page.includes("document.body.style.overflow='hidden'"),'Only the open drawer may lock body scrolling.');
assert.ok(!page.includes('iamMobileHomeShell'),'Rejected fixed mobile shell must not return.');
assert.ok(page.includes('height:max(100dvh,calc(100vw * 1672 / 941))'),'Portrait stage must preserve normal document-height scrolling on phones.');
assert.ok(page.includes('overflow-x:clip'),'Mobile surface must prevent sideways drift while retaining vertical document scrolling.');

for(const token of ['/api/ads?placement=home','/api/monetization/config','adsbygoogle'])assert.ok(page.includes(token),`Mobile home revenue behavior missing ${token}`);
assert.ok(page.includes('@media(max-width:1024px)')&&page.includes('.desktopStage{display:none!important}')&&page.includes('.mobileExactStage{display:block'),'Mobile breakpoint must isolate mobile artwork from desktop.');
assert.ok(page.includes('src="/crm-upgrade.jpeg"'),'Approved desktop artwork source changed unexpectedly.');
assert.ok(page.includes("className={sidebarCollapsed?'exactStage desktopStage sidebarCollapsed':'exactStage desktopStage'}"),'Approved desktop dashboard structure changed unexpectedly.');
assert.ok(page.includes('@media(prefers-reduced-motion:reduce)'),'Reduced-motion safety is missing.');

console.log('Exact portrait mobile dashboard lock PASS: approved artwork, 16 clickable modules, five-item bottom navigation, search/menu/owner/tutorial controls, normal scrolling, ads, accessibility, and desktop isolation are intact.');
