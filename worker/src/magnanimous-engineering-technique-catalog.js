// First-party Magnanimous engineering technique catalog.
// These provider-neutral patterns are owned and maintained by Magnanimous AI.
// Provenance is public/general engineering research; no external provider runtime is required.

export const MAGNANIMOUS_ENGINEERING_TECHNIQUE_PROFILES=Object.freeze({
  'overview':['item-model architecture','typed page/component/helper/endpoint separation','serverless boundary discipline','provider-hosted rail isolation'],
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
  'realtime':['event-driven realtime updates','pub-sub instead of polling','cost-aware live synchronization'],
  'creating-previewing-and-splitting-pdfs':['document generation pipeline','page-level PDF splitting','preview-before-delivery verification'],
  'pdfmake-setup':['structured PDF composition','document-definition generation','font/layout initialization discipline'],
  'react-big-calendar':['calendar layout integration','container sizing before widget rendering','theme-safe calendar styling'],
  'native-mobile-app':['web-to-native wrapper architecture','native capability compatibility checks','store-build verification'],
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
  'provided-google-integrations':['brokered Google account integration','provider-scoped authorization','separate login from data-access OAuth'],
  'provided-microsoft-integrations':['brokered Microsoft account integration','provider-scoped authorization','mail/calendar/storage capability separation'],
  'microsoft-login':['Microsoft identity sign-in flow','login-vs-resource-access separation','token/session boundary discipline'],
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
  'ai':['one-hop AI task abstraction','multimodal generation/embedding routing','model provider kept below product identity'],
  'ai-chat-gpt':['responses-style model adapter','reasoning/tool call normalization','hosted-tool result handling'],
  'ai-chat-luna':['low-latency model tiering','cheap-first routing for easy tasks','large-context document delegation'],
  'ai-chat-gemini-flash-3-5':['long-context model routing','provider-native search/code/url tool adaptation','reasoning-effort controls'],
  'ai-chat-glm-flash':['cost-optimized agent model routing','tool-loop model adaptation','background-agent tier selection'],
  'ai-chat-glm':['hard-reasoning model routing','tool-calling loop integration','compaction-aware long task handling'],
  'ai-kimi':['vision-specialist delegation','modality-based model routing','image understanding as a specialist function'],
  'ai-embed':['multimodal embedding pipeline','batch vectorization','cross-modal retrieval preparation'],
  'ai-image':['image generation/editing adapter','creative model normalization','asset-return pipeline'],
  'ai-image-openai':['quality-tiered image generation','transparent-output handling','premium creative model routing'],
  'agents':['persistent conversation agent scaffold','tool-using agent loop','streaming stateful assistant architecture'],
  'agents-loop-internals':['atomic turn claiming','halt-and-resume agent execution','context compaction','tool-argument repair','post-model abort recheck'],
  'agents-subagents':['parallel subagent delegation','independent task fan-out','result aggregation'],
  'agents-memory':['long-term agent memory','index-plus-detail memory structure','standing instruction separation'],
  'agents-scheduling':['self-scheduling agents','one-off follow-up scheduling','recurring agent execution'],
  'agents-remote':['agent-to-agent API contracts','key-authenticated remote agents','cross-thread messaging'],
  'agents-telegram':['channel adapter with allowlists','human-in-the-loop approval','webhook-secured messaging'],
  'agents-collections':['typed agent-owned records','structured datastore beside freeform memory','generic CRUD collection surfaces'],
  'agents-access-control':['principal-scoped conversations','surface-specific tool narrowing','server-side role gates','supervisor escalation and takeover'],
  'agents-mcp':['runtime MCP connection registry','OAuth/bearer/custom-header MCP auth','cached external tool catalogs','per-tool enablement and dispatch']
});

const DEFAULT_TECHNIQUES=Object.freeze(['public-guide pattern extraction','provider-neutral workflow synthesis','verification before success claims']);

export function getMagnanimousTechniqueProfile(topic=''){
  const key=String(topic||'');
  const techniques=MAGNANIMOUS_ENGINEERING_TECHNIQUE_PROFILES[key]||DEFAULT_TECHNIQUES;
  return{
    topic:key,
    techniques:[...techniques],
    source_kind:'magnanimous-first-party-technique-synthesis',
    proprietary_implementation_copied:false,
    identity_owner:'Magnanimous AI'
  };
}

export function getMagnanimousTechniqueSummary(){
  const entries=Object.entries(MAGNANIMOUS_ENGINEERING_TECHNIQUE_PROFILES);
  const unique=new Set(entries.flatMap(([,items])=>items));
  return{
    guide_profiles:entries.length,
    reusable_techniques:unique.size,
    proprietary_implementation_copied:false,
    mode:'magnanimous-first-party-technique-catalog'
  };
}


export const MAGNANIMOUS_ENGINEERING_GUIDE_TOPICS=Object.freeze(
  Object.keys(MAGNANIMOUS_ENGINEERING_TECHNIQUE_PROFILES).map(id=>({
    id,
    purpose:`Magnanimous engineering guidance for ${id.replace(/-/g,' ')}.`
  }))
);

export function getMagnanimousGuideNativeTarget(topic=''){
 const id=String(topic||'').toLowerCase();
 if(/^agents(?:-|$)/.test(id)){
  if(id.includes('memory'))return'memory-ingestion';
  if(id.includes('collections'))return'data-platform';
  if(id.includes('mcp'))return'universal-tool-gateway';
  if(id.includes('telegram'))return'communications-hub';
  return'agent-mesh';
 }
 if(/^ai(?:-|$)/.test(id)){
  if(id.includes('image'))return'creative-studio';
  if(id.includes('embed'))return'knowledge-workspace';
  return'model-router';
 }
 if(/design|examples|lottie|react-big-calendar|screenshot/.test(id))return'product-design-agent';
 if(/publishing|custom-domain|native-mobile|ios-|android-|share-target|background-wake|native-system-bars|ssr|dynamic-sitemap/.test(id))return'tool-deployment';
 if(/queue|scheduled|realtime|run-code/.test(id))return'agent-mesh';
 if(/database|csv/.test(id))return'data-platform';
 if(/pdf|zip|storage/.test(id))return'workspace-files';
 if(/email|push-notification/.test(id))return'communications-hub';
 if(/oauth|resources|auth-and-payment-challenges|microsoft|google-integrations|ai-byok/.test(id))return'universal-tool-gateway';
 if(/testing|prod-backend-logs|hosting-cost-analysis|server-memory/.test(id))return'engineering-operator';
 return'knowledge-workspace';
}

export function getMagnanimousGuidePolicy(topic=''){
 return{topic:String(topic||''),native_target:getMagnanimousGuideNativeTarget(topic),suggestive:true,auto_initiate:true,requires_confirmation:false,action_class:'skill-guidance'};
}
