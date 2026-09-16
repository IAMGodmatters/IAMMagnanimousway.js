import fs from 'node:fs';

function read(path){return fs.readFileSync(path,'utf8');}
function must(condition,message){if(!condition)throw new Error(message);}

const entry=read('worker/src/security-entrypoint.js');
const wrangler=read('worker/wrangler.jsonc');
const robots=read('frontend/public/robots.txt');
const sitemap=read('frontend/public/sitemap.xml');

must(entry.includes("const CANONICAL_HOST='iammagnanimousway.com'"),'Canonical apex host lock is missing.');
must(entry.includes("const WWW_HOST='www.iammagnanimousway.com'"),'WWW canonical redirect lock is missing.');
must(entry.includes("status:308"),'WWW/HTTP permanent redirect is missing.');
must(entry.includes("status:410"),'Legacy WordPress 410 response is missing.');
must(entry.includes("'x-robots-tag':'noindex, noarchive, nosnippet'"),'Legacy WordPress noindex header is missing.');
must(entry.includes("url.searchParams.has('rest_route')"),'Legacy WordPress REST query retirement is missing.');
must(entry.includes('rel="canonical"'),'Canonical response header is missing.');

must(wrangler.includes('"pattern": "iammagnanimousway.com", "custom_domain": true'),'Apex custom domain is not managed by the Worker.');
must(wrangler.includes('"pattern": "www.iammagnanimousway.com", "custom_domain": true'),'WWW custom domain is not managed by the Worker.');
for(const route of ['"/"','"/wp-admin*"','"/wp-login.php"','"/wp-json*"','"/wp-content/*"','"/wp-includes/*"','"/xmlrpc.php"']){
  must(wrangler.includes(route),`Worker-first retirement route missing: ${route}`);
}
must(!wrangler.includes('"/wp-admin/*"'),'Redundant /wp-admin/* route must not be present; /wp-admin* already covers it.');
must(!wrangler.includes('"/wp-json/*"'),'Redundant /wp-json/* route must not be present; /wp-json* already covers it.');

must(robots.includes('Sitemap: https://iammagnanimousway.com/sitemap.xml'),'Canonical sitemap directive is missing.');
must(!/Disallow:\s*\/wp-/i.test(robots),'Do not robots-block retired WordPress paths; crawlers must see the 410 response.');
must(sitemap.includes('<loc>https://iammagnanimousway.com/</loc>'),'Canonical apex homepage is missing from sitemap.');
must(sitemap.includes('<lastmod>2026-09-16</lastmod>'),'Sitemap recrawl date was not refreshed.');
must(!sitemap.includes('www.iammagnanimousway.com'),'WWW must not be advertised in the sitemap.');

console.log('WordPress retirement lock: PASS');
console.log('Canonical apex, WWW redirect, WordPress 410 retirement, crawler guidance, sitemap refresh, and non-redundant Worker routing are locked.');
