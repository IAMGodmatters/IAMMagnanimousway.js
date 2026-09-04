// Magnanimous integration ecosystem catalog.
// These are capability benchmarks and adapter targets, not inherited ChatGPT sessions.
// Magnanimous remains the platform brain; external services require their own API/MCP/OAuth authorization.

export const INTEGRATION_CATALOG = [
  {id:'ai-voice-generator',name:'AI Voice Generator',category:'media',capabilities:['text-to-speech','voiceover','audio-production','long-form-narration'],priority:'high',native_target:'voice-engine'},
  {id:'ai-video-maker',name:'AI Video Maker / Seedance-class video',category:'media',capabilities:['text-to-video','image-to-video','short-form-video','cinematic-generation'],priority:'high',native_target:'cinema-engine'},
  {id:'ai-whisper-notes',name:'AI Whisper Voice Note Taker',category:'knowledge',capabilities:['voice-notes','semantic-note-search','transcript-recall','spoken-context'],priority:'high',native_target:'memory-ingestion'},
  {id:'apollo',name:'Apollo.io',category:'sales',capabilities:['prospecting','contacts','accounts','outreach-sequences','sales-tasks'],priority:'high',native_target:'sales-intelligence'},
  {id:'appdeploy',name:'AppDeploy',category:'deployment',capabilities:['web-app-deploy','versions','qa','domains','backend-secrets'],priority:'high',native_target:'deployment-operator'},
  {id:'apple-music',name:'Apple Music',category:'media',capabilities:['music-search','playlist-building'],priority:'low',native_target:'media-orchestration'},
  {id:'auto-camera',name:'Auto',category:'media',capabilities:['photo-search','visual-memory','location-time-photo-retrieval'],priority:'medium',native_target:'visual-memory'},
  {id:'basicdeploy',name:'BasicDeploy',category:'deployment',capabilities:['container-deploy','postgres','object-storage','environment-variables'],priority:'high',native_target:'deployment-operator'},
  {id:'canva',name:'Canva',category:'design',capabilities:['design-generation','brand-assets','social-graphics','documents','editable-designs'],priority:'high',native_target:'design-studio'},
  {id:'color-designer',name:'Color Designer',category:'design',capabilities:['palette-generation','palette-editing','brand-colors','visual-harmony'],priority:'medium',native_target:'design-system-intelligence'},
  {id:'ai-color-picker',name:'AI Color Picker',category:'design',capabilities:['color-selection','contrast-analysis','color-accessibility','palette-advice'],priority:'medium',native_target:'design-system-intelligence'},
  {id:'deep-research',name:'Deep Research',category:'research',capabilities:['multi-pass-research','source-synthesis','cited-reports','evidence-review'],priority:'critical',native_target:'research-orchestrator'},
  {id:'delivery-report-extractor',name:'Delivery Report Extractor',category:'engineering',capabilities:['delivery-report-parsing','changed-files','tests','implementation-summary'],priority:'medium',native_target:'engineering-auditor'},
  {id:'expertise-live-chatbot',name:'Expertise Live Chatbot',category:'support',capabilities:['website-ingestion','website-grounded-agent','live-chat'],priority:'medium',native_target:'support-agent-builder'},
  {id:'figma',name:'Figma',category:'design',capabilities:['ui-design','design-systems','editable-code-to-design','architecture-diagrams'],priority:'high',native_target:'design-studio'},
  {id:'github',name:'GitHub',category:'engineering',capabilities:['source-control','issues','pull-requests','ci-cd','code-review'],priority:'critical',native_target:'engineering-operator'},
  {id:'gmail',name:'Gmail',category:'productivity',capabilities:['email-search','email-read','draft','send','labels'],priority:'high',native_target:'communications-hub'},
  {id:'google-calendar',name:'Google Calendar',category:'productivity',capabilities:['calendar','availability','scheduling','invitations'],priority:'high',native_target:'scheduling-engine'},
  {id:'google-contacts',name:'Google Contacts',category:'productivity',capabilities:['contact-resolution','people-directory'],priority:'medium',native_target:'people-graph'},
  {id:'google-drive',name:'Google Drive',category:'knowledge',capabilities:['drive-search','docs','sheets','slides','file-workflows'],priority:'high',native_target:'workspace-files'},
  {id:'heygen',name:'HeyGen',category:'media',capabilities:['avatar-video','image-animation','voice','lipsync','video-translation'],priority:'high',native_target:'avatar-studio'},
  {id:'hubspot',name:'HubSpot',category:'crm',capabilities:['crm','marketing-email','landing-pages','campaigns','analytics'],priority:'high',native_target:'crm-growth-engine'},
  {id:'hypd-analytics',name:'HYPD AI - Paid Ads & Analytics',category:'marketing',capabilities:['google-ads','meta-ads','ga4','merchant-center','roas-analysis','wasted-spend-detection','keyword-research','landing-page-audit'],priority:'high',native_target:'growth-analytics'},
  {id:'linkedin',name:'LinkedIn',category:'sales',capabilities:['professional-lookup','profile-discovery'],priority:'medium',native_target:'professional-intelligence'},
  {id:'linkedin-ads',name:'LinkedIn Ads',category:'marketing',capabilities:['ad-performance','campaign-analysis','marketing-optimization'],priority:'medium',native_target:'growth-analytics'},
  {id:'linkedin-headline',name:'LinkedIn Headline Rewriter',category:'marketing',capabilities:['profile-copy','headline-generation'],priority:'low',native_target:'writing-engine'},
  {id:'linked-word',name:'Linked Word',category:'knowledge',capabilities:['kjv-passages','strongs-lookup','bible-search'],priority:'high',native_target:'bible-study-engine'},
  {id:'mycolive',name:'MYCOlive',category:'local',capabilities:['coliving-search','housing-comparison'],priority:'low',native_target:'local-search'},
  {id:'magnific',name:'Magnific',category:'media',capabilities:['image-generation','upscale','relight','video','audio','3d','creative-workflows'],priority:'high',native_target:'creative-studio'},
  {id:'manufact',name:'Manufact',category:'deployment',capabilities:['mcp-server-deploy','mcp-apps','build-logs','runtime-logs'],priority:'high',native_target:'tool-deployment'},
  {id:'outlook-calendar',name:'Microsoft Outlook Calendar',category:'productivity',capabilities:['calendar','availability','scheduling'],priority:'medium',native_target:'scheduling-engine'},
  {id:'neon',name:'Neon',category:'data',capabilities:['postgres','branching','snapshots','auth','data-api','functions','storage'],priority:'high',native_target:'data-platform'},
  {id:'netlify',name:'Netlify',category:'deployment',capabilities:['site-deploy','env-vars','forms','domains','access-controls'],priority:'high',native_target:'deployment-operator'},
  {id:'notion',name:'Notion',category:'knowledge',capabilities:['docs','tasks','databases','workspace-search','knowledge-systems','implementation-planning','research-synthesis'],priority:'high',native_target:'knowledge-workspace'},
  {id:'openai-platform',name:'OpenAI Platform',category:'ai-provider',capabilities:['api-keys','model-provider'],priority:'medium',native_target:'model-router'},
  {id:'product-design',name:'Product Design',category:'design',capabilities:['product-briefs','ux-audits','user-flows','prototypes','interactive-concepts'],priority:'high',native_target:'product-design-agent'},
  {id:'productos',name:'ProductOS',category:'engineering',capabilities:['cloud-workspaces','sandboxes','project-management','deployment'],priority:'medium',native_target:'engineering-operator'},
  {id:'railway',name:'Railway',category:'deployment',capabilities:['app-deploy','services','domains','feature-flags'],priority:'high',native_target:'deployment-operator'},
  {id:'shipstatic',name:'ShipStatic',category:'deployment',capabilities:['instant-static-publish'],priority:'medium',native_target:'deployment-operator'},
  {id:'shopee',name:'Shopee',category:'commerce',capabilities:['product-search','deal-discovery'],priority:'medium',native_target:'commerce-intelligence'},
  {id:'shopify',name:'Shopify',category:'commerce',capabilities:['ecommerce','storefront','products','orders','store-management'],priority:'high',native_target:'commerce-engine'},
  {id:'soluvery',name:'Soluvery',category:'security',capabilities:['drive-sharing-audit','public-file-risk','access-review'],priority:'high',native_target:'security-auditor'},
  {id:'stripe',name:'Stripe',category:'payments',capabilities:['checkout','subscriptions','metered-billing','payment-links','payments'],priority:'critical',native_target:'billing-engine'},
  {id:'tavily',name:'Tavily AI',category:'research',capabilities:['search','scrape','crawl','structured-web-data','rag'],priority:'high',native_target:'research-orchestrator'},
  {id:'token-terminal',name:'Token Terminal',category:'finance-data',capabilities:['blockchain-metrics','onchain-financial-data'],priority:'low',native_target:'finance-research'},
  {id:'val-town',name:'Val Town',category:'engineering',capabilities:['serverless-apps','schedules','sqlite','blob-storage','deployments'],priority:'medium',native_target:'tool-runtime'},
  {id:'vercel',name:'Vercel',category:'deployment',capabilities:['web-deploy','project-management','build-logs','domains'],priority:'high',native_target:'deployment-operator'},
  {id:'zeiko-agents',name:'Zeiko Agents',category:'agents',capabilities:['agent-teams','deployment','operations','approvals'],priority:'medium',native_target:'agent-mesh'},
  {id:'zoho-crm',name:'Zoho CRM',category:'crm',capabilities:['crm','sales-automation','analytics','pipeline-management'],priority:'high',native_target:'crm-growth-engine'},
  {id:'files',name:'Chat Files',category:'knowledge',capabilities:['file-library','semantic-search','document-reading','artifact-workflows'],priority:'high',native_target:'workspace-files'},
  {id:'monday',name:'monday.com',category:'operations',capabilities:['projects','tasks','crm','forms','workflows','agents','automations','reusable-code-actions'],priority:'high',native_target:'operations-hub'},
  {id:'vidiq',name:'vidIQ',category:'marketing',capabilities:['youtube-analytics','keyword-research','seo','competitor-analysis'],priority:'high',native_target:'creator-growth-engine'}
];

const PRIORITY_WEIGHT={critical:4,high:3,medium:2,low:1};

export function getIntegrationCatalog(){
  return INTEGRATION_CATALOG.map(x=>({...x,connection_model:'provider API, OAuth, or MCP; never inherited from ChatGPT',magnanimous_strategy:'learn capability → use authorized adapter when needed → measure outcome → build more native capability over time'}));
}

export function getIntegrationSummary(){
  const byCategory={};
  const capabilities=new Set();
  const nativeTargets=new Set();
  for(const item of INTEGRATION_CATALOG){
    byCategory[item.category]=(byCategory[item.category]||0)+1;
    for(const c of item.capabilities)capabilities.add(c);
    if(item.native_target)nativeTargets.add(item.native_target);
  }
  return {
    integration_targets:INTEGRATION_CATALOG.length,
    capability_targets:capabilities.size,
    native_build_targets:[...nativeTargets].sort(),
    categories:byCategory,
    critical_and_high:INTEGRATION_CATALOG.filter(x=>(PRIORITY_WEIGHT[x.priority]||0)>=3).map(x=>x.id),
    strategy:[
      'Keep Magnanimous AI as the central brain and identity.',
      'Treat plugins as capability benchmarks, not permanent dependencies.',
      'Expose every provider through a normalized tool contract rather than hard-coding provider logic into the brain.',
      'Prefer native/free capability first, then connected tools by quality, cost, latency and authorization state.',
      'When an external capability is repeatedly useful, turn it into a Magnanimous native-tool specification in Tool Foundry.',
      'Use OAuth or encrypted server-side credentials; never copy private ChatGPT sessions or credentials.',
      'Record tool outcomes so Magnanimous learns which capability/provider works best for each task.',
      'Require approval for consequential writes, payments, publishing, outreach, destructive data changes and other high-impact operations.'
    ]
  };
}

export function rankIntegrationTargets(goal=''){
  const words=String(goal).toLowerCase().split(/[^a-z0-9]+/).filter(x=>x.length>2);
  return INTEGRATION_CATALOG.map(item=>{
    const hay=[item.id,item.name,item.category,item.native_target||'',...item.capabilities].join(' ').toLowerCase();
    const matches=words.filter(w=>hay.includes(w));
    return {...item,score:(PRIORITY_WEIGHT[item.priority]||0)+matches.length*3,matches};
  }).sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name)).slice(0,16);
}
