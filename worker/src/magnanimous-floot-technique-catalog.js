// Provider-neutral engineering techniques synthesized from Floot's public guide catalog.
// Clean-room rule: this file records reusable patterns and safety boundaries only.
// It does not copy Floot private source, hidden prompts, credentials, model weights, or backend internals.

export const FLOOT_PUBLIC_TECHNIQUE_PROFILES=Object.freeze({
  'floot-overview':['item-model architecture','typed page/component/helper/endpoint separation','serverless boundary discipline','provider-hosted rail isolation'],
  'design':['design-system-first workflow','tokenized light/dark theming','single-accent visual hierarchy','design-before-component implementation'],
  'first-build':['design-first build order','sample-data UI scaffold before backend wiring','incremental backend integration','v1 scope discipline'],
  'primitives':['typed endpoint schema pairing','route/file convention enforcement','shared layout composition','frontend/backend separation'],
  'examples':['isolated component showcase states','example-only visual verification','non-production demo separation'],
  'publishing':['publish-state verification','job-based deployment completion checks','custom-domain separation','never claim publish success before terminal evidence'],
  'resources':['resource inventory before provisioning','reuse existing credentials before requesting new ones','secret indirection through environment bindings','managed-vs-external resource separation'],
  'prod-backend-logs':['production-log-first debugging','time-scoped backend evidence review','request correlation before code changes'],
  'screenshot':['visual verification after UI changes','preview-window observation','screenshot evidence before declaring layout success'],
  'ios-info-plist':['native permission metadata management','platform review remediation','config-as-artifact editing'],
  'android-manifest':['native permission manifest management','platform review remediation','config-as-artifact editing'],
  'queueTask':['durable background task execution','delayed task scheduling','runtime-created recurring work','fan-out without blocking request lifetimes'],
  'runCode':['isolated durable code execution','timeout-resistant sandbox jobs','callback-based result integration','capability-constrained agent-authored programs'],
  'floot-realtime':['event-driven realtime updates','pub-sub instead of polling','cost-aware live synchronization'],
  'creating-previewing-and-splitting-pdfs':['document generation pipeline','page-level PDF splitting','preview-before-delivery verification'],
  'pdfmake-setup':['structured PDF composition','document-definition generation','font/layout initialization discipline'],
  'react-big-calendar':['calendar layout integration','container sizing before widget rendering','theme-safe calendar styling'],
  'floot-native-mobile-app':['web-to-native wrapper architecture','native capability compatibility checks','store-build verification'],
  'ios-entitlements':['least-privilege entitlement enablement','native capability declaration','signed-build capability verification'],
  'share-target':['OS share-sheet ingestion','typed shared-content routing','cross-platform share target normalization'],
  'background-wake':['background refresh orchestration','silent-push wake handling','idempotent deferred sync'],
  'native-system-bars':['safe-area-aware immersive layout','status/navigation bar coordination','platform-specific visual chrome control'],
  'server-memory':['explicit server resource sizing','capacity-change only with evidence','avoid speculative memory tuning'],
  'auth-and-payment-challenges':['standards-compliant HTTP challenge propagation','401/402 boundary preservation','auth/payment metadata passthrough'],
  'csv-handling':['stream-conscious tabular parsing','schema normalization','safe CSV export/import'],
  'zip-files-and-import-code':['browser-side archive extraction','import sandboxing','code project staging before execution'],
  'ssr':['server-rendering for crawler/preview needs','SSR opt-in discipline','client/server rendering boundary awareness'],
  'ssr-prefetch':['server prefetch contracts','SEO-preserving redirects','server-side redirect semantics'],
  'analytics':['consent-aware analytics','storage/memory/off tracking modes','privacy-aware page-view instrumentation'],
  'floot-provided-google-integrations':['brokered Google account integration','provider-scoped authorization','separate login from data-access OAuth'],
  'floot-provided-microsoft-integrations':['brokered Microsoft account integration','provider-scoped authorization','mail/calendar/storage capability separation'],
  'floot-microsoft-login':['Microsoft identity sign-in flow','login-vs-resource-access separation','token/session boundary discipline'],
  'user-app-storage':['runtime user file storage','visibility-scoped object storage','upload/download lifecycle management'],
  'static-storage':['build-time asset storage','asset manifest discipline','static-vs-runtime storage separation'],
  'testing':['unit-testable frontend/backend helpers','headless component verification','mock external fetches in tests'],
  'email':['application email send/receive abstraction','provider-neutral message contracts','delivery verification'],
  'push-notification':['device subscription management','push delivery workflow','permission-aware notification sending'],
  'custom-domain-dns':['domain attachment workflow','DNS verification','domain state checked before claims'],
  'hosting-cost-analysis':['usage-category cost attribution','cost hotspot detection','optimization from measured usage'],
  'push-notification-history':['delivery audit trail review','per-device success/failure analysis','notification debugging from history'],
  'lottie-animations':['declarative animation assets','bounded animation rendering','motion as a reusable component capability'],
  'custom-oauth-providers':['standards-based OAuth provider adapters','PKCE handling','metadata discovery and redirect safety'],
  'scheduled-jobs':['build-time cron scheduling','idempotent recurring jobs','known-schedule automation'],
  'ai-byok':['bring-your-own-key model routing','secret isolation','provider replacement without identity transfer'],
  'dynamic-sitemap':['data-driven sitemap generation','crawler-facing endpoint generation','static-first SEO strategy'],
  'floot-ai':['one-hop AI task abstraction','multimodal generation/embedding routing','model provider kept below product identity'],
  'floot-ai-chat-gpt':['responses-style model adapter','reasoning/tool call normalization','hosted-tool result handling'],
  'floot-ai-chat-luna':['low-latency model tiering','cheap-first routing for easy tasks','large-context document delegation'],
  'floot-ai-chat-gemini-flash-3-5':['long-context model routing','provider-native search/code/url tool adaptation','reasoning-effort controls'],
  'floot-ai-chat-glm-flash':['cost-optimized agent model routing','tool-loop model adaptation','background-agent tier selection'],
  'floot-ai-chat-glm':['hard-reasoning model routing','tool-calling loop integration','compaction-aware long task handling'],
  'floot-ai-kimi':['vision-specialist delegation','modality-based model routing','image understanding as a specialist function'],
  'floot-ai-embed':['multimodal embedding pipeline','batch vectorization','cross-modal retrieval preparation'],
  'floot-ai-image':['image generation/editing adapter','creative model normalization','asset-return pipeline'],
  'floot-ai-image-openai':['quality-tiered image generation','transparent-output handling','premium creative model routing'],
  'floot-agents':['persistent conversation agent scaffold','tool-using agent loop','streaming stateful assistant architecture'],
  'floot-agents-loop-internals':['atomic turn claiming','halt-and-resume agent execution','context compaction','tool-argument repair','post-model abort recheck'],
  'floot-agents-subagents':['parallel subagent delegation','independent task fan-out','result aggregation'],
  'floot-agents-memory':['long-term agent memory','index-plus-detail memory structure','standing instruction separation'],
  'floot-agents-scheduling':['self-scheduling agents','one-off follow-up scheduling','recurring agent execution'],
  'floot-agents-remote':['agent-to-agent API contracts','key-authenticated remote agents','cross-thread messaging'],
  'floot-agents-telegram':['channel adapter with allowlists','human-in-the-loop approval','webhook-secured messaging'],
  'floot-agents-collections':['typed agent-owned records','structured datastore beside freeform memory','generic CRUD collection surfaces'],
  'floot-agents-access-control':['principal-scoped conversations','surface-specific tool narrowing','server-side role gates','supervisor escalation and takeover'],
  'floot-agents-mcp':['runtime MCP connection registry','OAuth/bearer/custom-header MCP auth','cached external tool catalogs','per-tool enablement and dispatch']
});

const DEFAULT_TECHNIQUES=Object.freeze(['public-guide pattern extraction','provider-neutral workflow synthesis','verification before success claims']);

export function getFlootGuideTechniqueProfile(topic=''){
  const key=String(topic||'');
  const techniques=FLOOT_PUBLIC_TECHNIQUE_PROFILES[key]||DEFAULT_TECHNIQUES;
  return{
    topic:key,
    techniques:[...techniques],
    source_kind:'public-guide-clean-room-synthesis',
    proprietary_implementation_copied:false,
    identity_owner:'Magnanimous AI'
  };
}

export function getFlootTechniqueSummary(){
  const entries=Object.entries(FLOOT_PUBLIC_TECHNIQUE_PROFILES);
  const unique=new Set(entries.flatMap(([,items])=>items));
  return{
    guide_profiles:entries.length,
    reusable_techniques:unique.size,
    proprietary_implementation_copied:false,
    mode:'provider-neutral-technique-assimilation'
  };
}
