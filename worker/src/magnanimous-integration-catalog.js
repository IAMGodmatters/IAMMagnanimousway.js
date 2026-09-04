// Magnanimous integration ecosystem catalog.
// These are capability benchmarks and adapter targets, not inherited ChatGPT sessions.
// Magnanimous remains the platform brain; external services require their own API/MCP/OAuth authorization.

export const INTEGRATION_CATALOG = [
  {id:'ai-voice-generator',name:'AI Voice Generator',category:'media',capabilities:['text-to-speech','voiceover','audio-production'],priority:'high'},
  {id:'apollo',name:'Apollo.io',category:'sales',capabilities:['prospecting','contacts','accounts','outreach-sequences','sales-tasks'],priority:'high'},
  {id:'appdeploy',name:'AppDeploy',category:'deployment',capabilities:['web-app-deploy','versions','qa','domains','backend-secrets'],priority:'high'},
  {id:'apple-music',name:'Apple Music',category:'media',capabilities:['music-search','playlist-building'],priority:'low'},
  {id:'auto-camera',name:'Auto',category:'media',capabilities:['photo-search','visual-memory','location-time-photo-retrieval'],priority:'medium'},
  {id:'basicdeploy',name:'BasicDeploy',category:'deployment',capabilities:['container-deploy','postgres','object-storage','environment-variables'],priority:'high'},
  {id:'canva',name:'Canva',category:'design',capabilities:['design-generation','brand-assets','social-graphics','documents','editable-designs'],priority:'high'},
  {id:'delivery-report-extractor',name:'Delivery Report Extractor',category:'engineering',capabilities:['delivery-report-parsing','changed-files','tests','implementation-summary'],priority:'medium'},
  {id:'expertise-live-chatbot',name:'Expertise Live Chatbot',category:'support',capabilities:['website-ingestion','website-grounded-agent','live-chat'],priority:'medium'},
  {id:'figma',name:'Figma',category:'design',capabilities:['ui-design','design-systems','editable-code-to-design','architecture-diagrams'],priority:'high'},
  {id:'github',name:'GitHub',category:'engineering',capabilities:['source-control','issues','pull-requests','ci-cd','code-review'],priority:'critical'},
  {id:'gmail',name:'Gmail',category:'productivity',capabilities:['email-search','email-read','draft','send','labels'],priority:'high'},
  {id:'google-calendar',name:'Google Calendar',category:'productivity',capabilities:['calendar','availability','scheduling','invitations'],priority:'high'},
  {id:'google-contacts',name:'Google Contacts',category:'productivity',capabilities:['contact-resolution','people-directory'],priority:'medium'},
  {id:'google-drive',name:'Google Drive',category:'knowledge',capabilities:['drive-search','docs','sheets','slides','file-workflows'],priority:'high'},
  {id:'heygen',name:'HeyGen',category:'media',capabilities:['avatar-video','image-animation','voice','lipsync','video-translation'],priority:'high'},
  {id:'hubspot',name:'HubSpot',category:'crm',capabilities:['crm','marketing-email','landing-pages','campaigns','analytics'],priority:'high'},
  {id:'linkedin',name:'LinkedIn',category:'sales',capabilities:['professional-lookup','profile-discovery'],priority:'medium'},
  {id:'linkedin-ads',name:'LinkedIn Ads',category:'marketing',capabilities:['ad-performance','campaign-analysis','marketing-optimization'],priority:'medium'},
  {id:'linkedin-headline',name:'LinkedIn Headline Rewriter',category:'marketing',capabilities:['profile-copy','headline-generation'],priority:'low'},
  {id:'linked-word',name:'Linked Word',category:'knowledge',capabilities:['kjv-passages','strongs-lookup','bible-search'],priority:'high'},
  {id:'mycolive',name:'MYCOlive',category:'local',capabilities:['coliving-search','housing-comparison'],priority:'low'},
  {id:'magnific',name:'Magnific',category:'media',capabilities:['image-generation','upscale','relight','video','audio','3d','creative-workflows'],priority:'high'},
  {id:'manufact',name:'Manufact',category:'deployment',capabilities:['mcp-server-deploy','mcp-apps','build-logs','runtime-logs'],priority:'high'},
  {id:'outlook-calendar',name:'Microsoft Outlook Calendar',category:'productivity',capabilities:['calendar','availability','scheduling'],priority:'medium'},
  {id:'neon',name:'Neon',category:'data',capabilities:['postgres','branching','snapshots','auth','data-api','functions','storage'],priority:'high'},
  {id:'netlify',name:'Netlify',category:'deployment',capabilities:['site-deploy','env-vars','forms','domains','access-controls'],priority:'high'},
  {id:'notion',name:'Notion',category:'knowledge',capabilities:['docs','tasks','databases','workspace-search','knowledge-systems'],priority:'high'},
  {id:'openai-platform',name:'OpenAI Platform',category:'ai-provider',capabilities:['api-keys','model-provider'],priority:'medium'},
  {id:'productos',name:'ProductOS',category:'engineering',capabilities:['cloud-workspaces','sandboxes','project-management','deployment'],priority:'medium'},
  {id:'railway',name:'Railway',category:'deployment',capabilities:['app-deploy','services','domains','feature-flags'],priority:'high'},
  {id:'shipstatic',name:'ShipStatic',category:'deployment',capabilities:['instant-static-publish'],priority:'medium'},
  {id:'shopee',name:'Shopee',category:'commerce',capabilities:['product-search','deal-discovery'],priority:'medium'},
  {id:'shopify',name:'Shopify',category:'commerce',capabilities:['ecommerce','storefront','products','orders','store-management'],priority:'high'},
  {id:'soluvery',name:'Soluvery',category:'security',capabilities:['drive-sharing-audit','public-file-risk','access-review'],priority:'high'},
  {id:'stripe',name:'Stripe',category:'payments',capabilities:['checkout','subscriptions','metered-billing','payment-links','payments'],priority:'critical'},
  {id:'tavily',name:'Tavily AI',category:'research',capabilities:['search','scrape','crawl','structured-web-data','rag'],priority:'high'},
  {id:'token-terminal',name:'Token Terminal',category:'finance-data',capabilities:['blockchain-metrics','onchain-financial-data'],priority:'low'},
  {id:'val-town',name:'Val Town',category:'engineering',capabilities:['serverless-apps','schedules','sqlite','blob-storage','deployments'],priority:'medium'},
  {id:'vercel',name:'Vercel',category:'deployment',capabilities:['web-deploy','project-management','build-logs','domains'],priority:'high'},
  {id:'zeiko-agents',name:'Zeiko Agents',category:'agents',capabilities:['agent-teams','deployment','operations','approvals'],priority:'medium'},
  {id:'zoho-crm',name:'Zoho CRM',category:'crm',capabilities:['crm','sales-automation','analytics'],priority:'medium'},
  {id:'files',name:'Chat Files',category:'knowledge',capabilities:['file-library','semantic-search','document-reading','artifact-workflows'],priority:'high'},
  {id:'monday',name:'monday.com',category:'operations',capabilities:['projects','tasks','crm','forms','workflows','agents','automations'],priority:'high'},
  {id:'vidiq',name:'vidIQ',category:'marketing',capabilities:['youtube-analytics','keyword-research','seo','competitor-analysis'],priority:'high'}
];

const PRIORITY_WEIGHT={critical:4,high:3,medium:2,low:1};

export function getIntegrationCatalog(){
  return INTEGRATION_CATALOG.map(x=>({...x,connection_model:'provider API, OAuth, or MCP; never inherited from ChatGPT'}));
}

export function getIntegrationSummary(){
  const byCategory={};
  const capabilities=new Set();
  for(const item of INTEGRATION_CATALOG){
    byCategory[item.category]=(byCategory[item.category]||0)+1;
    for(const c of item.capabilities)capabilities.add(c);
  }
  return {
    integration_targets:INTEGRATION_CATALOG.length,
    capability_targets:capabilities.size,
    categories:byCategory,
    critical_and_high:INTEGRATION_CATALOG.filter(x=>(PRIORITY_WEIGHT[x.priority]||0)>=3).map(x=>x.id),
    strategy:[
      'Keep Magnanimous AI as the central brain and identity.',
      'Expose every provider through a normalized tool contract rather than hard-coding provider logic into the brain.',
      'Prefer native/free capability first, then connected tools by quality, cost, latency and authorization state.',
      'Use OAuth or encrypted server-side credentials; never copy private ChatGPT sessions or credentials.',
      'Record tool outcomes so Magnanimous learns which capability/provider works best for each task.',
      'Require approval for consequential writes, payments, publishing, outreach, destructive data changes and other high-impact operations.'
    ]
  };
}

export function rankIntegrationTargets(goal=''){
  const words=String(goal).toLowerCase().split(/[^a-z0-9]+/).filter(x=>x.length>2);
  return INTEGRATION_CATALOG.map(item=>{
    const hay=[item.id,item.name,item.category,...item.capabilities].join(' ').toLowerCase();
    const matches=words.filter(w=>hay.includes(w));
    return {...item,score:(PRIORITY_WEIGHT[item.priority]||0)+matches.length*3,matches};
  }).sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name)).slice(0,12);
}
