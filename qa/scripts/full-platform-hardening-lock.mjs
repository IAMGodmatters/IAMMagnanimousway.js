import fs from 'node:fs';

function read(path){return fs.readFileSync(path,'utf8')}
function must(condition,message){if(!condition)throw new Error(message)}
function mustContain(text,value,message){must(text.includes(value),message)}
function mustNotContain(text,value,message){must(!text.includes(value),message)}

const password=read('worker/src/password-security.js');
const admin=read('worker/src/admin-compat-entrypoint.js');
const entry=read('worker/src/entrypoint.js');
const layout=read('frontend/app/layout.tsx');
const runtime=read('frontend/app/platform-runtime-script.tsx');
const template=read('frontend/app/template.tsx');
const robots=read('frontend/public/robots.txt');
const sitemap=read('frontend/public/sitemap.xml');
const wrangler=read('worker/wrangler.jsonc');

mustContain(password,"const PBKDF2_PREFIX = 'pbkdf2-sha256'",'Modern password algorithm identifier is missing.');
mustContain(password,'const DEFAULT_ITERATIONS = 600000','PBKDF2 default work factor regressed.');
mustContain(password,"name: 'PBKDF2'",'Password derivation is no longer PBKDF2.');
mustContain(password,"algorithm: 'legacy-sha256'",'Legacy password compatibility/upgrade path is missing.');
mustContain(password,'upgradePasswordIfNeeded','Transparent legacy-password upgrade helper is missing.');

mustContain(admin,"from './password-security.js'",'Account runtime must use the password-security module.');
mustContain(admin,'verifyPassword(password','Login must verify through the hardened password module.');
mustContain(admin,'upgradePasswordIfNeeded','Successful legacy logins must upgrade their stored hash.');
mustContain(admin,'password.length < 10','New-account minimum password length regressed.');
mustNotContain(admin,'async function passwordHash(','Fast local password hashing must not return to the account runtime.');
mustNotContain(admin,"return json({ detail: e?.message",'Unexpected account-service errors must not be reflected directly to clients.');

mustContain(entry,"from './password-security.js'",'Owner bootstrap must use hardened password storage.');
mustContain(entry,'ensureRuntimeBootstrap','Runtime bootstrap caching is missing.');
mustContain(entry,'bootstrapReady=true','Runtime bootstrap must mark successful initialization.');
mustNotContain(entry,"digest('SHA-256',new TextEncoder().encode(`${salt}:${password}`))",'Fast owner-password hashing must not return.');

mustContain(layout,"import PlatformRuntimeScript from './platform-runtime-script'",'Root layout must use the hardened platform runtime.');
mustNotContain(layout,'new MutationObserver','Root layout must not reintroduce its old inline full-DOM observer.');
mustContain(runtime,"var sessionPrefix='iam_session_draft:'",'Generic draft recovery must default to session storage.');
mustContain(runtime,"data-persist-draft",'Persistent draft storage must be explicit opt-in.');
mustContain(runtime,'mutation.addedNodes.forEach','DOM cleanup must remain incremental.');
mustContain(runtime,"fetch('/api/auth/me'",'Protected client sessions must be periodically revalidated.');
mustContain(runtime,"script[data-iam-adsense=\"true\"],#iam-adsense",'Global ad loading must remain deduplicated.');
mustContain(runtime,"var publicPaths=['/'",'Homepage must remain a public discovery surface.');
mustContain(runtime,"'/business-plan'",'Public business-plan discovery route is missing.');
mustContain(template,"const publicPaths=new Set(['/','/teach'",'Template public/private chrome must align with discovery routing.');

for(const path of ['/api/','/owner-','/crm/','/telecom/','/assistant-actions/'])mustContain(robots,`Disallow: ${path}`,`Crawler boundary missing for ${path}`);
for(const path of ['/white-label/','/shop/','/teach/','/advertise/'])mustContain(sitemap,`https://iammagnanimousway.com${path}`,`Public sitemap entry missing for ${path}`);
mustContain(wrangler,'"main": "src/security-entrypoint.js"','Production Worker must remain behind the central security entrypoint.');

console.log('Full-platform hardening contracts verified.');
