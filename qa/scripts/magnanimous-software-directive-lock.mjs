import assert from 'node:assert/strict';
import fs from 'node:fs';
import { MAGNANIMOUS_PREFERRED_SOFTWARE, getSoftwareDirectiveCapabilityManifest, getSoftwareDirectiveSummary } from '../../worker/src/magnanimous-software-directive-registry.js';
import { getCapabilityAbsorptionManifest } from '../../worker/src/magnanimous-connector-absorption.js';
import { classifyCapabilityRealization } from '../../worker/src/magnanimous-capability-realization.js';

const expected=new Map([
 ['gimp','Adobe Photoshop'],['inkscape','Adobe Illustrator'],['natron','Adobe After Effects'],['davinci-resolve','Adobe Premiere Pro'],['kdenlive','Adobe Premiere quick cuts'],['figma','Adobe XD'],['blender','Cinema 4D'],['libreoffice','Microsoft Office / Microsoft 365 desktop productivity'],['bitwarden','paid password-manager subscription'],['audacity','paid audio editor'],['libphonenumber-js','metered basic phone-number formatting/validation APIs']
]);
assert.equal(MAGNANIMOUS_PREFERRED_SOFTWARE.length,11);
for(const [id,replaced] of expected){const row=MAGNANIMOUS_PREFERRED_SOFTWARE.find(x=>x.id===id);assert.ok(row,`${id} directive missing`);assert.ok(row.replaces.includes(replaced),`${id} replacement mapping missing`);assert.equal(row.cost_policy.startsWith('free')||row.cost_policy.includes('without-explicit-approval'),true,`${id} must stay free-first or explicitly approval-gated`)}
const blender=MAGNANIMOUS_PREFERRED_SOFTWARE.find(x=>x.id==='blender');assert.ok(blender.replaces.includes('Autodesk 3ds Max'));
assert.equal(MAGNANIMOUS_PREFERRED_SOFTWARE.find(x=>x.id==='figma').license_class,'free-tier-proprietary');
assert.equal(MAGNANIMOUS_PREFERRED_SOFTWARE.find(x=>x.id==='davinci-resolve').license_class,'free-edition-proprietary');
assert.equal(MAGNANIMOUS_PREFERRED_SOFTWARE.find(x=>x.id==='bitwarden').license_class,'open-source-core-plus-source-available-modules');
const manifest=getSoftwareDirectiveCapabilityManifest();assert.equal(manifest.length,11);assert.ok(manifest.every(x=>x.initiative?.suggestive===true));assert.ok(manifest.every(x=>x.research?.proprietary_implementation_copied===false));
const phoneCap=manifest.find(x=>x.id==='software-directive:libphonenumber-js');assert.equal(classifyCapabilityRealization(phoneCap).status,'native-ready');
const validationRuntime=fs.readFileSync('worker/src/magnanimous-contact-validation.js','utf8');assert.ok(validationRuntime.includes("from 'libphonenumber-js/min'"));assert.ok(validationRuntime.includes('phone.isValid()'));assert.ok(validationRuntime.includes('phone.number'));assert.match(validationRuntime,/does not prove/i);
const full=getCapabilityAbsorptionManifest();for(const row of manifest)assert.ok(full.some(x=>x.id===row.id),`${row.id} missing from full Magnanimous brain manifest`);
const freeTools=fs.readFileSync('frontend/app/free-tools/page.tsx','utf8');for(const label of ['GIMP','Inkscape','Natron','DaVinci Resolve','Kdenlive','Figma','Blender','LibreOffice','Bitwarden','Audacity'])assert.ok(freeTools.includes(label),`${label} missing from published Free Tools stack`);
const validationPage=fs.readFileSync('frontend/app/contact-validation/page.tsx','utf8');assert.ok(validationPage.includes('/api/public-data/email-hygiene'));assert.ok(validationPage.includes('/api/public-data/phone-validation'));assert.ok(validationPage.includes('DNC'));
for(const file of ['frontend/app/b2b/page.tsx','frontend/app/contact-center/page.tsx','frontend/app/telecom/page.tsx'])assert.ok(fs.readFileSync(file,'utf8').includes('/contact-validation'),`${file} must link the shared validation surface`);
const summary=getSoftwareDirectiveSummary();assert.equal(summary.preferred_tools,11);assert.equal(summary.paid_upgrade_requires_explicit_approval,true);assert.equal(summary.proprietary_implementation_copied,false);
console.log(`Magnanimous software directive verified: ${summary.preferred_tools} preferred free-first tool contracts; native phone validation contract locked.`);
