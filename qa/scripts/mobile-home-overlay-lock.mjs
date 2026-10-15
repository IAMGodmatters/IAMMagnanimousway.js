import fs from 'node:fs';
import assert from 'node:assert/strict';

const layout=fs.readFileSync('frontend/app/layout.tsx','utf8');
const mobile=fs.readFileSync('frontend/app/mobile-home-dashboard.tsx','utf8');
const desktop=fs.readFileSync('frontend/app/page.tsx','utf8');

assert.ok(layout.includes("import MobileHomeDashboard from './mobile-home-dashboard'"),'Root layout must mount the mobile home dashboard.');
assert.ok(layout.includes('<MobileHomeDashboard/>'),'Mobile dashboard mount is missing.');
assert.ok(!fs.existsSync('frontend/proxy.ts'),'Static export must not rely on Next proxy routing for the mobile home.');
assert.ok(!fs.existsSync('frontend/app/mobile-dashboard/page.tsx'),'Do not ship a second replacement home route that bypasses the canonical home page.');
for(const route of ['/movie-maker','/ai-apps','/crm','/opportunity-vault','/travel-agency','/white-label','/creator-growth'])assert.ok(mobile.includes(route),`Mobile navigation missing ${route}`);
for(const token of ['/api/ads?placement=home','/api/monetization/config','adsbygoogle'])assert.ok(mobile.includes(token),`Mobile home revenue behavior missing ${token}`);
for(const token of ['prefers-reduced-motion','safe-area-inset','aria-controls="iam-mobile-drawer"','aria-label="Search Magnanimous AI"'])assert.ok(mobile.includes(token),`Mobile accessibility/responsiveness guard missing ${token}`);
assert.ok(desktop.includes('className={sidebarCollapsed?\'exactStage desktopStage sidebarCollapsed\':\'exactStage desktopStage\'}'),'Approved desktop dashboard structure changed unexpectedly.');
console.log('Mobile home overlay lock PASS: static-safe routing, desktop isolation, navigation, ads, accessibility, and responsive protections are intact.');
