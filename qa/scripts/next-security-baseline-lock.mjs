import fs from 'node:fs';

function fail(message){throw new Error(message)}
function versionParts(value){
  const m=String(value||'').trim().match(/^(\d+)\.(\d+)\.(\d+)/);
  if(!m)fail('Next.js version must be an exact numeric release.');
  return m.slice(1).map(Number);
}
function gte(a,b){
  for(let i=0;i<3;i++){if(a[i]>b[i])return true;if(a[i]<b[i])return false}
  return true;
}

const pkg=JSON.parse(fs.readFileSync('frontend/package.json','utf8'));
const lock=JSON.parse(fs.readFileSync('frontend/package-lock.json','utf8'));
const declared=String(pkg.dependencies?.next||'');
const locked=String(lock.packages?.['node_modules/next']?.version||'');
const rootLocked=String(lock.packages?.['']?.dependencies?.next||'');

if(declared!==locked||declared!==rootLocked)fail('Next.js package.json and package-lock versions must match exactly.');
if(!gte(versionParts(declared),[16,3,3]))fail('Next.js must remain at or above the August 2026 critical security baseline 16.3.3.');
if(lock.packages?.['node_modules/@next/env']?.version!==declared)fail('@next/env must track the exact Next.js patch version.');
for(const name of [
  '@next/swc-darwin-arm64','@next/swc-darwin-x64','@next/swc-linux-arm64-gnu','@next/swc-linux-arm64-musl',
  '@next/swc-linux-x64-gnu','@next/swc-linux-x64-musl','@next/swc-win32-arm64-msvc','@next/swc-win32-x64-msvc'
]){
  if(lock.packages?.['node_modules/'+name]?.version!==declared)fail(name+' must track the exact Next.js patch version.');
}
if(lock.packages?.['node_modules/@swc/helpers']?.version!=='0.5.23')fail('@swc/helpers must match the Next.js 16.3.5 runtime dependency.');

console.log('Next.js security baseline lock PASS: '+declared);
