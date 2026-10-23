import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root=process.cwd();
const expected={
  '/shop/':'frontend/app/shop/layout.tsx',
  '/teach/':'frontend/app/teach/layout.tsx',
  '/advertise/':'frontend/app/advertise/layout.tsx',
  '/privacy/':'frontend/app/privacy/layout.tsx',
  '/terms/':'frontend/app/terms/layout.tsx'
};
const sitemap=fs.readFileSync(path.join(root,'frontend/public/sitemap.xml'),'utf8');
const robots=fs.readFileSync(path.join(root,'frontend/public/robots.txt'),'utf8');
const failures=[];
for(const [route,file] of Object.entries(expected)){
  const source=fs.readFileSync(path.join(root,file),'utf8');
  if(!source.includes('export const metadata:Metadata')) failures.push(route+' has no metadata export');
  if(!source.includes("canonical:'"+route+"'")&&!source.includes('canonical:"'+route+'"')) failures.push(route+' has no matching canonical');
  if(!source.includes('robots:{index:true,follow:true}')) failures.push(route+' has no public index policy');
  if(!sitemap.includes('https://iammagnanimousway.com'+route+'</loc>')) failures.push(route+' missing in sitemap');
}
for(const restricted of ['/api/','/owner-center/','/crm/','/connections/','/billing/']){
  if(sitemap.includes('<loc>https://iammagnanimousway.com'+restricted)) failures.push('Private workspace exposed by sitemap: '+restricted);
}
if(!robots.includes('Disallow: /api/')) failures.push('API robots exclusion missing');
if(!robots.includes('Disallow: /owner-center/')) failures.push('Owner robots exclusion missing');
// Known pre-existing inconsistency: /plugin-demo/ is noindex but listed in the sitemap.
// Do not change plugin-review visibility or its required release lock without coordinated review.
if(sitemap.includes('https://iammagnanimousway.com/plugin-demo/')){
 console.warn('AUDIT WARNING: /plugin-demo/ is in sitemap but route metadata currently says noindex');
}
assert.deepEqual(failures,[],'Public canonical/security metadata regression');
console.log('Public canonical route metadata lock PASS ('+Object.keys(expected).length+' routes)');
