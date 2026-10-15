import fs from 'node:fs';
import assert from 'node:assert/strict';

const layout=fs.readFileSync('frontend/app/layout.tsx','utf8');
const page=fs.readFileSync('frontend/app/page.tsx','utf8');

assert.ok(!layout.includes("import MobileHomeDashboard from './mobile-home-dashboard'"),'Replacement mobile overlay must not supersede the canonical exact-artwork home.');
assert.ok(!layout.includes('<MobileHomeDashboard/>'),'Replacement mobile overlay must remain unmounted.');
assert.ok(!layout.includes("import './mobile-approved-polish.css'"),'Overlay-only mobile polish must not override the canonical exact-artwork home.');
assert.ok(!fs.existsSync('frontend/proxy.ts'),'Static export must not rely on Next proxy routing for the mobile home.');
assert.ok(!fs.existsSync('frontend/app/mobile-dashboard/page.tsx'),'Do not ship a second replacement home route that bypasses the canonical home page.');
assert.ok(page.includes('className="mobileExactStage"'),'Canonical exact-artwork mobile stage is missing.');
assert.ok(page.includes('src="/crm-upgrade.jpeg"'),'Canonical approved artwork asset is missing.');
assert.ok(page.includes('function ArtworkCrop'),'Mobile cards must preserve approved artwork crops instead of substitute icon art.');
assert.ok(page.includes('className="mobileCardGrid"'),'Scrollable mobile card grid is missing.');
assert.ok(page.includes('grid-template-columns:repeat(2,minmax(0,1fr))'),'Mobile dashboard must preserve the two-column reference composition.');
assert.ok(page.includes('id="mobile-side-menu"')&&page.includes('setMenuOpen(value=>!value)'),'Collapsible mobile menu is missing.');
for(const route of ['/movie-maker','/ai-apps','/crm','/opportunity-vault','/travel-agency','/creator-growth'])assert.ok(page.includes(route),`Mobile navigation missing ${route}`);
for(const token of ['/api/ads?placement=home','/api/monetization/config','adsbygoogle'])assert.ok(page.includes(token),`Mobile home revenue behavior missing ${token}`);
assert.ok(page.includes('mobileTutorialOverlay')&&page.includes('href="/guide"'),'Tutorial artwork must remain clickable.');
assert.ok(page.includes('@media(max-width:1024px)')&&page.includes('.desktopStage{display:none!important}')&&page.includes('.mobileExactStage{display:block'),'Mobile breakpoint must isolate the exact-artwork mobile composition from desktop.');
assert.ok(page.includes('overflow-x:clip'),'Mobile surface must prevent sideways drift while retaining normal vertical document scrolling.');
assert.ok(page.includes("document.body.style.overflow='hidden'"),'Only the open drawer may lock body scrolling.');
assert.ok(page.includes('mobileDrawerCloseRef.current?.focus()')&&page.includes('mobileMenuButtonRef.current?.focus()'),'Drawer focus management is missing.');
assert.ok(page.includes('@media(prefers-reduced-motion:reduce)'),'Reduced-motion safety is missing.');
assert.ok(page.includes("className={sidebarCollapsed?'exactStage desktopStage sidebarCollapsed':'exactStage desktopStage'}"),'Approved desktop dashboard structure changed unexpectedly.');
console.log('Canonical exact-artwork mobile home lock PASS: approved artwork, clickable routes, two-column mobile composition, vertical document scroll, drawer accessibility, ads, and desktop isolation are intact.');
