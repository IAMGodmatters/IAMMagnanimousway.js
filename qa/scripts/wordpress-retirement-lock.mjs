import fs from 'node:fs';

function read(path){return fs.readFileSync(path,'utf8');}
function must(condition,message){if(!condition)throw new Error(message);}

const entry=read('worker/src/security-entrypoint.js');
const wrangler=read('worker/wrangler.jsonc');
const robots=read('frontend/public/robots.txt');
const sitemap=read('frontend/public/sitemap.xml');

must(entry.includes("const CANONICAL_HOST='iammagnanimousway.com'"),'Canonical apex host lock is missing.');
must(entry.includes("const WWW_HOST='www.iammagnanimousway.com'"),'WWW canonical redirect logic is missing.');
must(entry.includes("status:308"),'WWW/HTTP permanent redirect logic is missing.');
// Preserve the defensive legacy response in code for any explicit server-routed legacy request,
// but do not force public WordPress scanner traffic through the Worker on the Free plan.
must(entry.includes("status:410"),'Legacy WordPress 410 response is missing.');
must(entry.includes("'x-robots-tag':'noindex, noarchive, nosnippet'"),'Legacy WordPress noindex header is missing.');
must(entry.includes("url.searchParams.has('rest_route')"),'Legacy WordPress REST query retirement is missing.');
must(entry.includes('rel="canonical"'),'Canonical response header is missing.');

must(!wrangler.includes('"routes"'),'Deploy config must not mutate Cloudflare zone routes with the restricted production token.');
must(wrangler.includes('Production domain attachment is managed in Cloudflare outside this file.'),'Out-of-band production domain ownership note is missing.');
must(wrangler.includes('"not_found_handling": "404-page"'),'Static 404 handling must remain enabled for retired/bot probe paths.');
for(const route of ['"/"','"/wp-admin*"','"/wp-login.php"','"/wp-json*"','"/wp-content/*"','"/wp-includes/*"','"/xmlrpc.php"']){
  must(!wrangler.includes(route),`Quota-sensitive public/bot route must stay asset-first instead of Worker-first: ${route}`);
}
for(const route of ['"/api/*"','"/mcp"','"/.well-known/*"','"/health"']){
  must(wrangler.includes(route),`Required dynamic Worker-first route missing: ${route}`);
}

must(robots.includes('Sitemap: https://iammagnanimousway.com/sitemap.xml'),'Canonical sitemap directive is missing.');
must(!/Disallow:\s*\/wp-/i.test(robots),'Do not robots-block retired WordPress paths; static 404 retirement must stay observable to crawlers.');
must(sitemap.includes('<loc>https://iammagnanimousway.com/</loc>'),'Canonical apex homepage is missing from sitemap.');
must(sitemap.includes('<lastmod>2026-09-16</lastmod>'),'Sitemap recrawl date was not refreshed.');
must(!sitemap.includes('www.iammagnanimousway.com'),'WWW must not be advertised in the sitemap.');

console.log('WordPress retirement lock: PASS');
console.log('Canonical apex, quota-safe static retirement, dynamic API routing, crawler guidance, and restricted-token-safe Worker routing are locked.');
