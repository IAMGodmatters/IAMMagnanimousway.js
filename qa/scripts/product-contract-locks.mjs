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
const platformRuntime = read('frontend/app/platform-runtime-script.tsx');
const home = read('frontend/app/page.tsx');
const standaloneLayout = read('frontend/app/magnanimous/layout.tsx');
const standalonePage = read('frontend/app/magnanimous/page.tsx');
const aiChatPage = read('frontend/app/ai-chat/page.tsx');
const aiProcessingIndicator = read('frontend/components/AIProcessingIndicator.tsx');
const shopPage = read('frontend/app/shop/page.tsx');
const platformCredentials = read('worker/src/platform-credentials.js');
const assistantIntegrations = read('worker/src/assistant-integrations.js');
const providerEntrypoint = read('worker/src/provider-entrypoint.js');
const branchEntrypoint = read('worker/src/branch-consent-entrypoint.js');
const knowledgeRuntime = read('worker/src/knowledge-runtime.js');
const progressEntrypoint = read('worker/src/progress-entrypoint-base.js');
const chatTransport = read('frontend/lib/magnanimous-chat-transport.ts');

// 1) Standalone Magnanimous AI lock.
includes(standaloneLayout, "title:'Magnanimous AI™ — Standalone'", 'standalone: branded metadata title remains locked');
includes(standaloneLayout, "canonical:'/magnanimous'", 'standalone: canonical /magnanimous route remains locked');
includes(standalonePage, 'className="mag-standalone"', 'standalone: isolated interface shell remains locked');
includes(standalonePage, "fetch('/api/magnanimous/health'", 'standalone: Magnanimous health endpoint remains wired');
includes(standalonePage, "postMagnanimousChat('/api/chat'", 'standalone: resilient Magnanimous chat endpoint remains wired');
includes(standalonePage, '/login?returnTo=%2Fmagnanimous', 'standalone: persistent-memory sign-in return path remains locked');
includes(standalonePage, 'Guest session', 'standalone: guest-session UI contract remains locked');
includes(standalonePage, 'MAGNANIMOUS AI™', 'standalone: Magnanimous customer-facing identity remains locked');
includes(standalonePage, "AIProcessingIndicator compact", 'standalone: long-running AI work remains visibly active');
notMatches(standalonePage, /d\?\.(?:provider|provider_name|model)\b/, 'standalone: UI must not read provider/model identities');
notMatches(standalonePage, /execution engine/i, 'standalone: UI must not display execution-engine language');
notMatches(standalonePage, /\b(?:OpenAI|Anthropic|Claude|Gemini|Groq|Mistral|OpenRouter|Cerebras|Hugging Face|Cloudflare Workers AI)\b/i, 'standalone: third-party AI brands must not appear in customer-facing source');
notMatches(standalonePage, /myshopify\.com|href=["']\/shop["']|STORE_URL/, 'standalone: Shopify/store UI must not bleed into the standalone AI');
includes(layout, "import PlatformRuntimeScript from './platform-runtime-script'", 'standalone: hardened platform runtime remains mounted from root layout');
includes(layout, '<PlatformRuntimeScript/>', 'standalone: platform runtime component remains mounted');
includes(platformRuntime, "currentPath==='/magnanimous'||currentPath.indexOf('/magnanimous/')===0", 'standalone: route detection remains isolated to /magnanimous');
includes(platformRuntime, "if(standalone)document.documentElement.setAttribute('data-iam-standalone','true')", 'standalone: document isolation flag remains locked');
includes(layout, 'html[data-iam-standalone="true"] .iam-shop-link', 'standalone: platform shop chrome remains hidden');
includes(layout, 'html[data-iam-standalone="true"] .iam-global-tools', 'standalone: platform global tools remain hidden');
includes(platformRuntime, 'if(!standalone)loadAds()', 'standalone: advertising remains disabled');
includes(providerEntrypoint, 'You are speaking as Magnanimous AI, the commander-in-chief orchestration brain', 'standalone: server-side Magnanimous command identity remains locked');
includes(providerEntrypoint, 'They are never the platform identity or the final authority over the workflow.', 'standalone: external execution engines remain implementation details, not the product identity');
includes(knowledgeRuntime, 'const SEARCH_TIMEOUT_MS=7000', 'reliability: live research sources retain bounded network timeouts');
includes(knowledgeRuntime, 'Promise.allSettled([', 'reliability: web and news research can run concurrently instead of serially');
includes(knowledgeRuntime, 'continuing with D1-independent research', 'reliability: live research remains available during transient D1 faults');
includes(knowledgeRuntime, 'SEARCH_MEMORY_TIMEOUT_MS=2500', 'reliability: research-memory persistence cannot hold the answer open indefinitely');
includes(providerEntrypoint, 'const PROVIDER_REQUEST_BUDGET_MS=55000', 'reliability: AI execution has a bounded total request budget');
includes(providerEntrypoint, 'const CLOUDFLARE_ATTEMPT_TIMEOUT_MS=18000', 'reliability: individual Workers AI model attempts have a bounded timeout');
includes(providerEntrypoint, 'providerDeadline=Date.now()+PROVIDER_REQUEST_BUDGET_MS', 'reliability: provider failover respects one overall request deadline');
includes(progressEntrypoint, 'continuing request without checkpointing', 'reliability: transient D1 checkpoint failure cannot block chat execution');
includes(branchEntrypoint, 'specialist schema unavailable; continuing core chat', 'reliability: specialist storage faults degrade to core chat instead of blocking it');
includes(chatTransport, 'retryTransientEdgeOnce', 'reliability: research chat can retry one transient edge failure');
includes(chatTransport, '[502,503,504]', 'reliability: automatic retry is limited to transient gateway/service errors');
includes(aiChatPage, 'use_tools: !research', 'reliability: main Research mode is read-only when edge retry is enabled');
includes(aiChatPage, 'retryTransientEdgeOnce: research', 'reliability: main Research mode retries transient HTML edge failures once');
includes(standalonePage, 'use_tools:!researchMode', 'reliability: standalone Research mode is read-only when edge retry is enabled');
includes(standalonePage, 'retryTransientEdgeOnce:researchMode', 'reliability: standalone Research mode retries transient HTML edge failures once');

// 1b) Customer execution-provider privacy lock.
includes(branchEntrypoint, 'function stripExecutionMetadata(data)', 'privacy: customer AI responses retain an execution-metadata stripping boundary');
includes(branchEntrypoint, 'provider_name,model,model_id,engine,execution_engine', 'privacy: provider/model/engine response fields remain private');
includes(branchEntrypoint, 'function sanitizeCustomerAiResponse(request,response)', 'privacy: ordinary /api/chat responses are sanitized before customer delivery');
includes(branchEntrypoint, "url.pathname!=='/api/chat'", 'privacy: generic chat sanitizer remains attached to /api/chat');
includes(branchEntrypoint, 'function publicProviderSummary(data={})', 'privacy: provider catalog has a customer-safe summary');
includes(branchEntrypoint, "name:'Magnanimous AI'", 'privacy: customer provider catalog exposes Magnanimous AI rather than execution-engine brands');
includes(branchEntrypoint, 'provider_details_private:true', 'privacy: customer catalog explicitly marks execution details private');
includes(branchEntrypoint, 'function sanitizeProviderCatalog(request,response,env)', 'privacy: provider catalog sanitization remains active');
includes(branchEntrypoint, 'if(isBranchTrainer(user))return response;', 'privacy: owner/admin configuration can still inspect real provider details');
includes(branchEntrypoint, 'const publicData=publicProviderSummary(data);', 'privacy: Agent Mesh catalog receives the private provider summary');
includes(branchEntrypoint, 'function sanitizeCustomerAgentExecution(request,response)', 'privacy: stored agent history and video responses retain execution-metadata stripping');
includes(branchEntrypoint, 'messages:data.messages.map(message=>stripExecutionMetadata(message))', 'privacy: stored agent messages cannot re-expose provider/model metadata');
includes(branchEntrypoint, 'const agentResponse=await sanitizeCustomerAgentExecution(request,chatResponse);', 'privacy: fallback agent responses pass through execution-metadata sanitization');
includes(branchEntrypoint, 'return sanitizeProviderCatalog(request,agentResponse,env);', 'privacy: provider catalog sanitization remains the final public response boundary');
notMatches(aiChatPage, /data\.(?:provider_name|provider|model)\b/, 'privacy: legacy AI Chat UI must not read execution provider/model identities');
notMatches(aiChatPage, /item\.(?:provider|model)\b/, 'privacy: legacy AI Chat history must not display execution provider/model metadata');
includes(aiChatPage, 'MAGNANIMOUS AI™ · PRIVATE ROUTING', 'privacy: legacy AI Chat status presents Magnanimous private routing');
includes(aiChatPage, 'setActiveQuestion(question)', 'experience: submitted AI Chat request remains visibly represented while processing');
includes(aiChatPage, '<AIProcessingIndicator mode={activeMode} request={activeQuestion} />', 'experience: main AI Chat mounts the live processing indicator');
includes(aiChatPage, 'busy ? "PROCESSING"', 'experience: AI Chat header visibly enters processing state');
includes(aiProcessingIndicator, 'MAGNANIMOUS AI IS WORKING', 'experience: processing indicator clearly says the AI is working');
includes(aiProcessingIndicator, 'setInterval(tick,1000)', 'experience: processing indicator exposes a live elapsed timer');
includes(aiProcessingIndicator, 'Long-running request is still active', 'experience: long-running requests remain visibly alive instead of appearing frozen');
includes(aiProcessingIndicator, 'aria-busy="true"', 'experience: processing state remains accessible to assistive technology');
includes(aiProcessingIndicator, '@media(prefers-reduced-motion:reduce)', 'experience: processing motion respects reduced-motion preferences');

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
includes(layout, "import PlatformRuntimeScript from './platform-runtime-script'", 'platform: extracted runtime stays explicitly mounted');
const publicMatch = platformRuntime.match(/var publicPaths=\[([^;]+)\];/);
must(Boolean(publicMatch), 'platform: public route contract remains machine-verifiable');
const publicSource = publicMatch?.[1] || '';
for (const route of ['/','/teach','/shop','/login','/signup','/owner-login','/solutions','/guide','/launchplan','/business-plan','/security','/free-tools','/ai-apps','/pricing','/reviews','/privacy','/terms','/advertise','/white-label']) {
  must(new RegExp(`["']${route.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}["']`).test(publicSource), `platform: public discovery route stays public — ${route}`);
}
includes(platformRuntime, "path.indexOf('/teach/')===0", 'platform: nested Teach routes remain public');
includes(platformRuntime, "path.indexOf('/shop/')===0", 'platform: nested Shop routes remain public');
includes(platformRuntime, "path.indexOf('/reviews/')===0", 'platform: nested Reviews routes remain public');
includes(layout, "href=\"/shop\"", 'platform: God Matters marketplace remains linked from platform chrome');
for (const route of ['/magnanimous','/bible-study','/ai-chat','/crm','/connections','/assistant-actions','/owner-center','/telecom']) {
  must(!new RegExp(`["']${route.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}["']`).test(publicSource), `platform: operational route remains protected — ${route}`);
}
includes(platformRuntime, 'if(isPublicPath(currentPath)||standalone)return;', 'platform: public discovery and standalone routing are explicit');
includes(platformRuntime, "location.replace('/login?returnTo='+encodeURIComponent(returnTo))", 'platform: protected unauthenticated routes still return to login');
notMatches(home, /mag-standalone/, 'platform: main homepage must not become the standalone AI shell');

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
console.log('Main platform public-discovery/protected-workspace lock: PASS');
console.log('God Matters Shopify/store lock: PASS');
