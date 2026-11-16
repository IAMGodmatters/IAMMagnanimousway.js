import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = path => fs.readFileSync(new URL('../../' + path, import.meta.url), 'utf8');
const requireMarkers = (source, markers, label) => {
  for (const marker of markers) assert.ok(source.includes(marker), label + ' is missing: ' + marker);
};

const routeContracts = [
  ['B2B partner workspace', 'frontend/app/b2b/page.tsx', ['b2bRoyalPalace','/magnanimous-b2b-palace-v2.svg','/magnanimous-b2b-palace-mobile-v2.svg','prefers-reduced-motion']],
  ['Contact Center', 'frontend/app/contact-center/page.tsx', ['cxRoyalPalace','/magnanimous-cx-palace-v1.svg','/magnanimous-cx-palace-mobile-v1.svg','prefers-reduced-motion']],
  ['AI Chat / AI Command', 'frontend/app/ai-chat/page.tsx', ['<ModeHero mode={activeMode} />']],
  ['Business AI', 'frontend/app/business-ai/page.tsx', ['hero businessRoyalHero','/magnanimous-business-ai-palace-v1.svg','/magnanimous-business-ai-palace-mobile-v1.svg','prefers-reduced-motion']],
  ['Social Studio', 'frontend/app/social-media/page.tsx', ['hero socialRoyalHero','/magnanimous-social-palace-v1.svg','/magnanimous-social-palace-mobile-v1.svg','prefers-reduced-motion']],
  ['AI Receptionist', 'frontend/app/ai-receptionist/page.tsx', ['hero receptionRoyalHero','/magnanimous-reception-palace-v1.svg','/magnanimous-reception-palace-mobile-v1.svg','prefers-reduced-motion']],
  ['Video Studio', 'frontend/app/video-studio/page.tsx', ['module-hero videoRoyalHero','/magnanimous-video-palace-v1.svg','/magnanimous-video-palace-mobile-v1.svg','prefers-reduced-motion']],
  ['Virtual Assistant', 'frontend/app/virtual-assistant/page.tsx', ['hero virtualRoyalHero','/magnanimous-virtual-palace-v1.svg','/magnanimous-virtual-palace-mobile-v1.svg','prefers-reduced-motion']],
  ['Travel Agency', 'frontend/app/travel-agency/page.tsx', ['page travelAgency cinematicSurface']],
  ['Creator Growth', 'frontend/app/creator-growth/page.tsx', ['page creatorGrowth cinematicSurface','I AM MAGNANIMOUS WAY™','prefers-reduced-motion']]
];

for (const [label, path, markers] of routeContracts) requireMarkers(read(path), markers, label);

const modeHero = read('frontend/components/ModeHero.tsx');
requireMarkers(modeHero, ['I AM MAGNANIMOUS WAY™','/magnanimous-ai-command-palace-v2.webp','/magnanimous-ai-command-palace-mobile-v2.webp','prefers-reduced-motion'], 'AI Chat / AI Command hero');

const cinematic = read('frontend/app/cinematic-design-system.tsx');
requireMarkers(cinematic, ['magnanimous-travel-palace-v2.webp','magnanimous-travel-palace-mobile-v2.webp','creatorGrowth :where(.controls,aside,.result,.cards article)','prefers-reduced-motion'], 'Shared cinematic route design');

const crmLayout = read('frontend/app/crm/layout.tsx');
const crmPage = read('frontend/app/crm/page.tsx');
requireMarkers(crmLayout, ['className="crmExperience"'], 'CRM visual wrapper');
requireMarkers(crmPage, ['crmRoyalPalace','crmVisualFrame'], 'CRM premium visual');

const assets = [
  'frontend/public/magnanimous-b2b-palace-v2.svg','frontend/public/magnanimous-b2b-palace-mobile-v2.svg',
  'frontend/public/magnanimous-cx-palace-v1.svg','frontend/public/magnanimous-cx-palace-mobile-v1.svg',
  'frontend/public/magnanimous-business-ai-palace-v1.svg','frontend/public/magnanimous-business-ai-palace-mobile-v1.svg',
  'frontend/public/magnanimous-reception-palace-v1.svg','frontend/public/magnanimous-reception-palace-mobile-v1.svg',
  'frontend/public/magnanimous-social-palace-v1.svg','frontend/public/magnanimous-social-palace-mobile-v1.svg',
  'frontend/public/magnanimous-telecom-palace-v1.svg','frontend/public/magnanimous-telecom-palace-mobile-v1.svg',
  'frontend/public/magnanimous-video-palace-v1.svg','frontend/public/magnanimous-video-palace-mobile-v1.svg',
  'frontend/public/magnanimous-motion.svg',
  'frontend/public/magnanimous-virtual-palace-v1.svg','frontend/public/magnanimous-virtual-palace-mobile-v1.svg'
];

for (const path of assets) {
  const svg = read(path);
  assert.ok(svg.startsWith('<svg'), path + ' must remain valid SVG source');
  assert.ok(svg.includes('I AM MAGNANIMOUS WAY™'), path + ' must retain the brand mark');
  assert.ok(svg.includes('I Am Magnanimous Way, Trademark.'), path + ' must include the exact requested trademark wording');
  assert.equal((svg.match(/I Am Magnanimous Way, Trademark\./g) || []).length, 1, path + ' must contain the exact trademark line once');
  assert.ok(!/God Matters\s*(?:™|,?\s*Trademark\.?)/i.test(svg), path + ' must never trademark God Matters');
}

console.log('Internal palace coverage lock passed: route-family art, responsive assets, reduced-motion contracts, exact Magnanimous trademark wording, and no God Matters trademark.');
