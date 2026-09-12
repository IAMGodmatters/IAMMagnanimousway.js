import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const failures = [];
const passes = [];

function read(rel) {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) {
    failures.push(`${rel}: required file is missing`);
    return '';
  }
  return fs.readFileSync(file, 'utf8');
}
function must(condition, message) {
  if (condition) passes.push(message);
  else failures.push(message);
}
function includes(source, needle, message) { must(source.includes(needle), message); }
function matches(source, re, message) { must(re.test(source), message); }
function notMatches(source, re, message) { must(!re.test(source), message); }
function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const layout = read('frontend/app/layout.tsx');
const home = read('frontend/app/page.tsx');
const standaloneLayout = read('frontend/app/magnanimous/layout.tsx');
const standalonePage = read('frontend/app/magnanimous/page.tsx');
const aiChatPage = read('frontend/app/ai-chat/page.tsx');
const shopPage = read('frontend/app/shop/page.tsx');
const platformCredentials = read('worker/src/platform-credentials.js');
const assistantIntegrations = read('worker/src/assistant-integrations.js');
const providerEntrypoint = read('worker/src/provider-entrypoint.js');
const branchEntrypoint = read('worker/src/branch-consent-entrypoint.js');

// 1) Standalone Magnanimous AI lock.
includes(standaloneLayout, "title:'Magnanimous AI™ — Standalone'", 'standalone: branded metadata title remains locked');
includes(standaloneLayout, "canonical:'/magnanimous'", 'standalone: canonical /magnanimous route remains locked');
includes(standalonePage, 'className="mag-standalone"', 'standalone: isolated interface shell remains locked');
includes(standalonePage, "fetch('/api/magnanimous/health'", 'standalone: Magnanimous health endpoint remains wired');
includes(standalonePage, "fetch('/api/chat'", 'standalone: Magnanimous chat endpoint remains wired');
includes(standalonePage, '/login?returnTo=%2Fmagnanimous', 'standalone: persistent-memory sign-in return path remains locked');
includes(standalonePage, 'Guest session', 'standalone: guest access boundary remains locked');
includes(standalonePage, 'MAGNANIMOUS AI™', 'standalone: Magnanimous customer-facing identity remains locked');
notMatches(standalonePage, /d\?\.(?:provider|provider_name|model)\b/, 'standalone: UI must not read provider/model identities');
notMatches(standalonePage, /execution engine/i, 'standalone: UI must not display execution-engine language');
notMatches(standalonePage, /\b(?:OpenAI|Anthropic|Claude|Gemini|Groq|Mistral|OpenRouter|Cerebras|Hugging Face|Cloudflare Workers AI)\b/i, 'standalone: third-party AI brands must not appear in customer-facing source');
notMatches(standalonePage, /myshopify\.com|href=["']\/shop["']|STORE_URL/, 'standalone: Shopify/store UI must not bleed into the standalone AI');
includes(layout, "var standalone=currentPath==='/magnanimous'||currentPath.indexOf('/magnanimous/')===0", 'standalone: route detection remains isolated to /magnanimous');
includes(layout, "if(standalone)document.documentElement.setAttribute('data-iam-standalone','true')", 'standalone: document isolation flag remains locked');
includes(layout, 'html[data-iam-standalone="true"] .iam-shop-link', 'standalone: platform shop chrome remains hidden');
includes(layout, 'html[data-iam-standalone="true"] .iam-global-tools', 'standalone: platform global tools remain hidden');
includes(layout, 'if(!standalone)loadAds()', 'standalone: advertising remains disabled');
includes(providerEntrypoint, 'You are speaking as Magnanimous AI, the commander-in-chief orchestration brain', 'standalone: server-side Magnanimous command identity remains locked');
includes(providerEntrypoint, 'They are never the platform identity or the final authority over the workflow.', 'standalone: external execution engines remain implementation details, not the product identity');

// 1b) Customer execution-provider privacy lock.
includes(branchEntrypoint, 'function stripExecutionMetadata(data)', 'privacy: customer AI responses retain an execution-metadata stripping boundary');
includes(branchEntrypoint, 'provider_name,model,model_id,engine,execution_engine', 'privacy: provider/model/engine response fields remain private');
includes(branchEntrypoint, 'function sanitizeCustomerAiResponse(request,response)', 'privacy: ordinary /api/chat responses are sanitized before customer delivery');
includes(branchEntrypoint, "url.pathname!=='/api/chat'", 'privacy: generic chat sanitizer remains attached to /api/chat');
includes(branchEntrypoint, 'function publicProviderSummary(data={})', 'privacy: provider catalog has a customer-safe summary');
includes(branchEntrypoint, "name:'Magnanimous AI routing'", 'privacy: customer provider catalog uses Magnanimous identity rather than engine brands');
includes(branchEntrypoint, 'provider_details_private:true', 'privacy: customer catalog explicitly marks execution details private');
includes(branchEntrypoint, 'function sanitizeProviderCatalog(request,response,env)', 'privacy: provider catalog sanitization remains active');
includes(branchEntrypoint, 'if(isBranchTrainer(user))return response;', 'privacy: owner/admin configuration can still inspect real provider details');
includes(branchEntrypoint, 'const publicData=publicProviderSummary(data);', 'privacy: Agent Mesh catalog receives the private provider summary');
includes(branchEntrypoint, 'return sanitizeProviderCatalog(request,chatResponse,env);', 'privacy: fallback provider-catalog responses are sanitized');
notMatches(aiChatPage, /data\.(?:provider_name|provider|model)\b/, 'privacy: legacy AI Chat UI must not read execution provider/model identities');
notMatches(aiChatPage, /item\.(?:provider|model)\b/, 'privacy: legacy AI Chat history must not display execution provider/model metadata');
includes(aiChatPage, 'MAGNANIMOUS AI™ · PRIVATE ROUTING', 'privacy: legacy AI Chat status presents Magnanimous private routing');

// 2) Main platform lock.
const requiredPlatformRoutes = [
  'frontend/app/page.tsx',
  'frontend/app/solutions/page.tsx',
  'frontend/app/login/page.tsx',
  'frontend/app/signup/page.tsx',
  'frontend/app/pricing/page.tsx',
  'frontend/app/connections/page.tsx',
  'frontend/app/assistant-actions/page.tsx',
  'frontend/app/owner-center/page.tsx',
  'frontend/app/shop/page.tsx',
  'frontend/app/bible-study/page.tsx',
  'frontend/app/magnanimous/page.tsx'
];
for (const rel of requiredPlatformRoutes) must(fs.existsSync(path.join(root, rel)), `platform: required route exists — ${rel.replace('frontend/app','')}`);
includes(layout, '<PlatformChrome/><GlobalTools/><InteractionClarity/>', 'platform: global platform chrome/tools/clarity remain mounted');
includes(layout, "var publicPaths=['/solutions'", 'platform: explicit public/protected route boundary remains present');
includes(layout, "'/shop'", 'platform: marketplace route remains public');
includes(layout, "'/magnanimous'", 'platform: standalone entry remains public without becoming the whole platform');
notMatches(home, /mag-standalone/, 'platform: main homepage must not become the standalone AI shell');
includes(layout, 'href="/shop"', 'platform: God Matters marketplace remains linked from platform chrome');

// 3) God Matters Shopify/store lock.
const storeMatch = shopPage.match(/const STORE_URL=['"](https:\/\/[^'"]+)['"]/);
const storeUrl = storeMatch?.[1] || '';
must(storeUrl === 'https://puso-iam.myshopify.com', 'shopify: God Matters store domain remains locked to puso-iam.myshopify.com');
includes(shopPage, 'GOD MATTERS MARKETPLACE', 'shopify: God Matters marketplace identity remains locked');
includes(shopPage, 'Shop God Matters', 'shopify: store CTA remains present');
includes(shopPage, 'rel="noopener noreferrer"', 'shopify: external store links retain opener protection');
notMatches(shopPage, /SHOPIFY_(?:API_SECRET|ADMIN_ACCESS_TOKEN|ACCESS_TOKEN|PRIVATE_APP_PASSWORD)/, 'shopify: no Shopify secrets may be embedded in the storefront source');
includes(platformCredentials, "{id:'shopify',name:'Shopify',providers:['shopify']", 'shopify: server-side Shopify credential group remains registered');
includes(platformCredentials, "{key:'SHOPIFY_API_SECRET',label:'Shopify Client Secret / API Secret',secret:true,required:true}", 'shopify: Shopify API secret remains classified as secret');
includes(assistantIntegrations, 'async function shopifyGraph(conn,query,variables={})', 'shopify: server-side Shopify GraphQL integration remains present');
includes(assistantIntegrations, "if(provider==='shopify')", 'shopify: connected-assistant Shopify provider remains present');
includes(assistantIntegrations, "action==='read_products'", 'shopify: product-read capability remains present');
includes(assistantIntegrations, "action==='read_orders'", 'shopify: order-read capability remains present');
includes(assistantIntegrations, "action==='read_customers'", 'shopify: customer-read capability remains present');

const frontendFiles = walk(path.join(root, 'frontend')).filter((file) => /\.(?:ts|tsx|js|jsx|mjs|json)$/.test(file));
for (const file of frontendFiles) {
  const source = fs.readFileSync(file, 'utf8');
  if (/SHOPIFY_(?:API_SECRET|ADMIN_ACCESS_TOKEN|ACCESS_TOKEN|PRIVATE_APP_PASSWORD)/.test(source)) {
    failures.push(`shopify: secret-like Shopify credential reference found in frontend source: ${path.relative(root, file)}`);
  }
}

console.log(`Product boundary locks: ${passes.length} checks passed.`);
if (failures.length) {
  console.error(`\nPRODUCT BOUNDARY LOCK FAILURE (${failures.length})`);
  for (const failure of failures) console.error(`- ${failure}`);
  console.error('\nChanges are allowed, but protected product boundaries must remain intact or be deliberately revised together with this contract.');
  process.exit(1);
}
console.log('Standalone Magnanimous AI lock: PASS');
console.log('Customer execution-provider privacy lock: PASS');
console.log('Main platform lock: PASS');
console.log('God Matters Shopify/store lock: PASS');
