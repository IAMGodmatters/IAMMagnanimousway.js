// Magnanimous integration ecosystem catalog.
// Plugins/providers are capability benchmarks and adapter targets, not the Magnanimous identity.
// External services require their own API/MCP/OAuth authorization. Magnanimous learns the pattern,
// prefers native/free capability, and uses a capped policy for cost, risk, data exposure and automation.

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
  {id:'font-pairing',name:'Font Pairing',category:'design',capabilities:['font-pairing','typography-systems','brand-typography'],priority:'medium',native_target:'design-system-intelligence'},
  {id:'product-design',name:'Product Design',category:'design',capabilities:['product-briefs','ux-audits','user-flows','prototypes','interactive-concepts'],priority:'high',native_target:'product-design-agent'},
  {id:'figma',name:'Figma',category:'design',capabilities:['ui-design','design-systems','editable-code-to-design','architecture-diagrams'],priority:'high',native_target:'design-studio'},
  {id:'magnific',name:'Magnific',category:'media',capabilities:['image-generation','upscale','relight','video','audio','3d','creative-workflows'],priority:'high',native_target:'creative-studio'},
  {id:'deep-art-ai',name:'Deep Art AI',category:'media',capabilities:['image-generation','video-generation','async-video-jobs','job-status'],priority:'medium',native_target:'creative-studio'},
  {id:'krikey',name:'Krikey AI Animation',category:'media',capabilities:['3d-character-animation','text-to-animation','music-video','high-res-export'],priority:'high',native_target:'animation-studio'},
  {id:'explain-video',name:'Explain Video Generator',category:'media',capabilities:['narrated-explainer','diagram-animation','document-to-video','code-walkthrough-video'],priority:'high',native_target:'explainer-studio'},
  {id:'veed-video',name:'VEED Video Generator',category:'media',capabilities:['avatar-video','voice-selection','share-ready-video'],priority:'medium',native_target:'avatar-studio'},
  {id:'videozero',name:'VideoZero',category:'media',capabilities:['educational-animation','diagram-video','narrated-visual-explanation','mcp-video'],priority:'medium',native_target:'explainer-studio'},
  {id:'heygen',name:'HeyGen',category:'media',capabilities:['avatar-video','image-animation','voice','lipsync','video-translation'],priority:'high',native_target:'avatar-studio'},
  {id:'retell-ai',name:'Retell AI',category:'telephony',capabilities:['voice-agents','call-center-automation','receptionist','outbound-calls','call-transfer'],priority:'high',native_target:'voice-agent-runtime'},
  {id:'deep-research',name:'Deep Research',category:'research',capabilities:['multi-pass-research','source-synthesis','cited-reports','evidence-review'],priority:'critical',native_target:'research-orchestrator'},
  {id:'tavily',name:'Tavily AI',category:'research',capabilities:['search','scrape','crawl','structured-web-data','rag'],priority:'high',native_target:'research-orchestrator'},
  {id:'tailo-lens',name:'Tailo Lens',category:'research',capabilities:['claim-analysis','academic-sources','citation-enrichment','prompt-bias-check'],priority:'medium',native_target:'evidence-auditor'},
  {id:'life-sciences-db',name:'Life Sciences Databases',category:'research',capabilities:['genetics-search','omics-search','chemistry-search','clinical-evidence'],priority:'medium',native_target:'scientific-research'},
  {id:'lux-research',name:'Lux AI',category:'research',capabilities:['emerging-tech-research','market-research','company-research','cited-analyst-research'],priority:'medium',native_target:'market-research'},
  {id:'pet-project-research',name:'Pet Project Co-Founder AI',category:'research',capabilities:['idea-validation','audience-research','keyword-demand','market-research-plan'],priority:'medium',native_target:'market-research'},
  {id:'particl',name:'Particl Market Research',category:'research',capabilities:['ecommerce-market-research','product-catalog-intelligence','market-trends','sales-timeseries'],priority:'high',native_target:'commerce-research'},
  {id:'delivery-report-extractor',name:'Delivery Report Extractor',category:'engineering',capabilities:['delivery-report-parsing','changed-files','tests','implementation-summary'],priority:'medium',native_target:'engineering-auditor'},
  {id:'github',name:'GitHub',category:'engineering',capabilities:['source-control','issues','pull-requests','ci-cd','code-review'],priority:'critical',native_target:'engineering-operator'},
  {id:'productos',name:'ProductOS',category:'engineering',capabilities:['cloud-workspaces','sandboxes','project-management','deployment'],priority:'medium',native_target:'engineering-operator'},
  {id:'val-town',name:'Val Town',category:'engineering',capabilities:['serverless-apps','schedules','sqlite','blob-storage','deployments'],priority:'medium',native_target:'tool-runtime'},
  {id:'manufact',name:'Manufact',category:'deployment',capabilities:['mcp-server-deploy','mcp-apps','build-logs','runtime-logs'],priority:'high',native_target:'tool-deployment'},
  {id:'netlify',name:'Netlify',category:'deployment',capabilities:['site-deploy','env-vars','forms','domains','access-controls'],priority:'high',native_target:'deployment-operator'},
  {id:'railway',name:'Railway',category:'deployment',capabilities:['app-deploy','services','domains','feature-flags'],priority:'high',native_target:'deployment-operator'},
  {id:'vercel',name:'Vercel',category:'deployment',capabilities:['web-deploy','project-management','build-logs','domains'],priority:'high',native_target:'deployment-operator'},
  {id:'shipstatic',name:'ShipStatic',category:'deployment',capabilities:['instant-static-publish'],priority:'medium',native_target:'deployment-operator'},
  {id:'gmail',name:'Gmail',category:'productivity',capabilities:['email-search','email-read','draft','send','labels'],priority:'high',native_target:'communications-hub'},
  {id:'google-calendar',name:'Google Calendar',category:'productivity',capabilities:['calendar','availability','scheduling','invitations'],priority:'high',native_target:'scheduling-engine'},
  {id:'aide-calendar',name:'Aide Calendar',category:'productivity',capabilities:['event-capture','task-capture','reminders','recurring-events','screenshot-to-event'],priority:'medium',native_target:'scheduling-engine'},
  {id:'google-contacts',name:'Google Contacts',category:'productivity',capabilities:['contact-resolution','people-directory'],priority:'medium',native_target:'people-graph'},
  {id:'google-drive',name:'Google Drive',category:'knowledge',capabilities:['drive-search','docs','sheets','slides','file-workflows'],priority:'high',native_target:'workspace-files'},
  {id:'notion',name:'Notion',category:'knowledge',capabilities:['docs','tasks','databases','workspace-search','knowledge-systems','implementation-planning','research-synthesis'],priority:'high',native_target:'knowledge-workspace'},
  {id:'files',name:'Chat Files',category:'knowledge',capabilities:['file-library','semantic-search','document-reading','artifact-workflows'],priority:'high',native_target:'workspace-files'},
  {id:'expertise-live-chatbot',name:'Expertise Live Chatbot',category:'support',capabilities:['website-ingestion','website-grounded-agent','live-chat'],priority:'medium',native_target:'support-agent-builder'},
  {id:'hubspot',name:'HubSpot',category:'crm',capabilities:['crm','marketing-email','landing-pages','campaigns','analytics'],priority:'high',native_target:'crm-growth-engine'},
  {id:'zoho-crm',name:'Zoho CRM',category:'crm',capabilities:['crm','sales-automation','analytics','pipeline-management'],priority:'high',native_target:'crm-growth-engine'},
  {id:'brosh-crm',name:'BROSH AI CRM',category:'crm',capabilities:['crm','projects','documents','invoices','contracts','support-tickets','marketing-automation','mcp'],priority:'high',native_target:'business-operating-system'},
  {id:'every-ai',name:'Every AI',category:'business',capabilities:['invoices','tax-calculation','proposals','clients','payments','expenses','pipeline','email','calendar'],priority:'high',native_target:'business-operating-system'},
  {id:'monday',name:'monday.com',category:'operations',capabilities:['projects','tasks','crm','forms','workflows','agents','automations','reusable-code-actions'],priority:'high',native_target:'operations-hub'},
  {id:'ab-projects',name:'AB Projects / ActionBridge',category:'operations',capabilities:['teams-messaging','agent-notifications','workflow-updates','collaboration'],priority:'medium',native_target:'communications-hub'},
  {id:'olie-flow',name:'Olie Flow AI',category:'operations',capabilities:['projects','funnels','metrics','content','pipeline-movement'],priority:'medium',native_target:'operations-hub'},
  {id:'projectbase',name:'ProjectBase',category:'operations',capabilities:['erp-projects','financials','operations'],priority:'medium',native_target:'business-operating-system'},
  {id:'hypd-analytics',name:'HYPD AI - Paid Ads & Analytics',category:'marketing',capabilities:['google-ads','meta-ads','ga4','merchant-center','roas-analysis','wasted-spend-detection','keyword-research','landing-page-audit'],priority:'high',native_target:'growth-analytics'},
  {id:'ahrefs',name:'Ahrefs',category:'marketing',capabilities:['seo','keywords','rankings','backlinks','competitor-analysis','ai-search-visibility'],priority:'high',native_target:'seo-intelligence'},
  {id:'activecampaign',name:'ActiveCampaign',category:'marketing',capabilities:['campaign-analytics','contacts','tags','segments','deals','automation-enrollment'],priority:'high',native_target:'marketing-automation'},
  {id:'mailchimp',name:'Intuit Mailchimp',category:'marketing',capabilities:['omnichannel-campaigns','campaign-strategy','campaign-performance','brand-assets'],priority:'high',native_target:'marketing-automation'},
  {id:'magnews',name:'magnews',category:'marketing',capabilities:['email-analytics','newsletter-analytics','audiences','automation-analysis'],priority:'medium',native_target:'growth-analytics'},
  {id:'polar-analytics',name:'Polar Analytics',category:'analytics',capabilities:['shopify-analytics','meta-ads','google-ads','roas','cac','profitability'],priority:'high',native_target:'business-analytics'},
  {id:'improvado',name:'Improvado AI Agent',category:'analytics',capabilities:['marketing-data','dashboards','data-sources','workspace-query','recipes'],priority:'high',native_target:'business-analytics'},
  {id:'linkedin',name:'LinkedIn',category:'sales',capabilities:['professional-lookup','profile-discovery'],priority:'medium',native_target:'professional-intelligence'},
  {id:'linkedin-ads',name:'LinkedIn Ads',category:'marketing',capabilities:['ad-performance','campaign-analysis','marketing-optimization'],priority:'medium',native_target:'growth-analytics'},
  {id:'linkedin-headline',name:'LinkedIn Headline Rewriter',category:'marketing',capabilities:['profile-copy','headline-generation'],priority:'low',native_target:'writing-engine'},
  {id:'vidiq',name:'vidIQ',category:'marketing',capabilities:['youtube-analytics','keyword-research','seo','competitor-analysis'],priority:'high',native_target:'creator-growth-engine'},
  {id:'stripe',name:'Stripe',category:'payments',capabilities:['checkout','subscriptions','metered-billing','payment-links','payments'],priority:'critical',native_target:'billing-engine'},
  {id:'shopify',name:'Shopify',category:'commerce',capabilities:['ecommerce','storefront','products','orders','store-management'],priority:'high',native_target:'commerce-engine'},
  {id:'shopee',name:'Shopee',category:'commerce',capabilities:['product-search','deal-discovery'],priority:'medium',native_target:'commerce-intelligence'},
  {id:'soluvery',name:'Soluvery',category:'security',capabilities:['drive-sharing-audit','public-file-risk','access-review'],priority:'high',native_target:'security-auditor'},
  {id:'neon',name:'Neon',category:'data',capabilities:['postgres','branching','snapshots','auth','data-api','functions','storage'],priority:'high',native_target:'data-platform'},
  {id:'openai-platform',name:'OpenAI Platform',category:'ai-provider',capabilities:['api-keys','model-provider'],priority:'medium',native_target:'model-router'},
  {id:'zeiko-agents',name:'Zeiko Agents',category:'agents',capabilities:['agent-teams','deployment','operations','approvals'],priority:'medium',native_target:'agent-mesh'},
  {id:'linked-word',name:'Linked Word',category:'knowledge',capabilities:['kjv-passages','strongs-lookup','bible-search'],priority:'high',native_target:'bible-study-engine'},
  {id:'midpage',name:'Midpage Legal Research',category:'legal-research',capabilities:['case-law-search','opinion-review','linked-authorities'],priority:'medium',native_target:'legal-research-engine'},
  {id:'descrybe',name:'Descrybe Legal Engine',category:'legal-research',capabilities:['primary-law-search','citation-resolution','case-treatment','quote-verification'],priority:'medium',native_target:'legal-research-engine'},
  {id:'directcase',name:'DirectCase Legal Research',category:'legal-research',capabilities:['legislation','case-law','regulatory-decisions','company-registers'],priority:'medium',native_target:'legal-research-engine'},
  {id:'gc-ai',name:'GC AI',category:'legal-research',capabilities:['document-grounded-legal-research','contract-drafting','redlining','playbooks'],priority:'medium',native_target:'legal-workspace'},
  {id:'seedlegals',name:'SeedLegals',category:'legal-research',capabilities:['cap-table','equity-documents','agreements','signature-workflows'],priority:'low',native_target:'legal-workspace'},
  {id:'token-terminal',name:'Token Terminal',category:'finance-data',capabilities:['blockchain-metrics','onchain-financial-data'],priority:'low',native_target:'finance-research'},
  {id:'mycolive',name:'MYCOlive',category:'local',capabilities:['coliving-search','housing-comparison'],priority:'low',native_target:'local-search'}
];

const PRIORITY_WEIGHT={critical:4,high:3,medium:2,low:1};

// Platform-wide caps. These are defaults; tenant/owner policy can tighten them further.
const CATEGORY_CAPS={
  payments:{max_cost_usd_per_action:0,requires_approval:true,external_write:'review'},
  telephony:{max_cost_usd_per_action:0,requires_approval:true,external_write:'review'},
  sales:{max_cost_usd_per_action:0,requires_approval:true,external_write:'review'},
  marketing:{max_cost_usd_per_action:0,requires_approval:true,external_write:'review'},
  crm:{max_cost_usd_per_action:0,requires_approval:true,external_write:'review'},
  business:{max_cost_usd_per_action:0,requires_approval:true,external_write:'review'},
  operations:{max_cost_usd_per_action:0,requires_approval:true,external_write:'review'},
  deployment:{max_cost_usd_per_action:0,requires_approval:true,external_write:'review'},
  engineering:{max_cost_usd_per_action:0,requires_approval:true,external_write:'review'},
  legal-research:{max_cost_usd_per_action:0,requires_approval:false,external_write:'blocked'},
  research:{max_cost_usd_per_action:0,requires_approval:false,external_write:'blocked'},
  analytics:{max_cost_usd_per_action:0,requires_approval:false,external_write:'blocked'},
  security:{max_cost_usd_per_action:0,requires_approval:false,external_write:'review'},
  media:{max_cost_usd_per_action:0,requires_approval:false,external_write:'blocked'},
  design:{max_cost_usd_per_action:0,requires_approval:false,external_write:'blocked'},
  knowledge:{max_cost_usd_per_action:0,requires_approval:false,external_write:'review'},
  productivity:{max_cost_usd_per_action:0,requires_approval:true,external_write:'review'},
  commerce:{max_cost_usd_per_action:0,requires_approval:true,external_write:'review'},
  data:{max_cost_usd_per_action:0,requires_approval:true,external_write:'review'},
  agents:{max_cost_usd_per_action:0,requires_approval:true,external_write:'review'},
  'ai-provider':{max_cost_usd_per_action:0,requires_approval:false,external_write:'blocked'},
  'finance-data':{max_cost_usd_per_action:0,requires_approval:false,external_write:'blocked'},
  local:{max_cost_usd_per_action:0,requires_approval:false,external_write:'blocked'},
  support:{max_cost_usd_per_action:0,requires_approval:true,external_write:'review'}
};

export function capabilityPolicy(item){
  const base=CATEGORY_CAPS[item.category]||{max_cost_usd_per_action:0,requires_approval:true,external_write:'review'};
  return {
    ...base,
    free_first:true,
    default_paid_spend:false,
    credentials:'server-side-only',
    secrets_in_prompts:false,
    private_data_to_unneeded_providers:false,
    provider_identity:false,
    native_learning_target:item.native_target||null,
    rule:'Use native/free first. A paid provider may only be selected inside an owner/tenant budget cap. Consequential writes require the configured approval gate.'
  };
}

export function getIntegrationCatalog(){
  return INTEGRATION_CATALOG.map(x=>({...x,connection_model:'provider API, OAuth, or MCP; never inherited from ChatGPT',magnanimous_strategy:'learn capability → use authorized adapter when needed → measure outcome → build more native capability over time',policy:capabilityPolicy(x)}));
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
    platform_cap:{free_first:true,default_paid_spend:false,consequential_writes:'approval-gated',credentials:'server-side-only'},
    strategy:[
      'Keep Magnanimous AI as the central brain and identity.',
      'Grow the brain before adding surface complexity: learn patterns, reusable workflows and outcome lessons first.',
      'Treat plugins as capability benchmarks, not permanent dependencies.',
      'Expose every provider through a normalized tool contract rather than hard-coding provider logic into the brain.',
      'Prefer native/free capability first, then connected tools by quality, cost, latency and authorization state.',
      'When an external capability is repeatedly useful, turn it into a Magnanimous native-tool specification in Tool Foundry.',
      'Use OAuth or encrypted server-side credentials; never copy private ChatGPT sessions or credentials.',
      'Record tool outcomes so Magnanimous learns which capability/provider works best for each task.',
      'Keep paid spend capped at zero by default until owner/tenant policy explicitly grants a budget.',
      'Require approval for consequential writes, payments, publishing, outreach, destructive data changes and other high-impact operations.'
    ]
  };
}

export function rankIntegrationTargets(goal=''){
  const words=String(goal).toLowerCase().split(/[^a-z0-9]+/).filter(x=>x.length>2);
  return INTEGRATION_CATALOG.map(item=>{
    const hay=[item.id,item.name,item.category,item.native_target||'',...item.capabilities].join(' ').toLowerCase();
    const matches=words.filter(w=>hay.includes(w));
    const policy=capabilityPolicy(item);
    return {...item,policy,score:(PRIORITY_WEIGHT[item.priority]||0)+matches.length*3,matches};
  }).sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name)).slice(0,20);
}
