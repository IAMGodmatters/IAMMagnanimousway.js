// Meta remains a replaceable provider ecosystem beneath Magnanimous AI.
// This registry is owner/admin engineering knowledge and must not override Magnanimous public identity.

export const MAGNANIMOUS_META_CAPABILITIES = Object.freeze([
  {id:'graph-api',domain:'platform',capability:'graph_resource_api',provider_feature:'Graph API',actions:['nodes','edges','fields','cursor_pagination','versioned_endpoints']},
  {id:'facebook-login',domain:'identity',capability:'oauth_identity_and_permissions',provider_feature:'Facebook Login',actions:['oauth','user_authorization','access_tokens','permission_scopes','token_debugging']},
  {id:'business-management',domain:'business',capability:'business_asset_management',provider_feature:'Business Management API',actions:['business_portfolios','system_users','asset_assignment','pages','ad_accounts','instagram_accounts','whatsapp_assets']},
  {id:'facebook-pages',domain:'social',capability:'facebook_page_operations',provider_feature:'Pages API',actions:['page_list','page_feed','publish_posts','media','comments','engagement','insights']},
  {id:'instagram-platform',domain:'social',capability:'instagram_business_operations',provider_feature:'Instagram Platform',actions:['profile','media','content_publish','reels','comments','mentions','insights']},
  {id:'messenger-platform',domain:'messaging',capability:'facebook_messenger_business_messaging',provider_feature:'Messenger Platform',actions:['send_receive','webhooks','templates','quick_replies','handoff','customer_support']},
  {id:'whatsapp-cloud',domain:'messaging',capability:'whatsapp_business_cloud_messaging',provider_feature:'WhatsApp Cloud API',actions:['messages','templates','media','webhooks','phone_numbers','business_profiles','flows','commerce','qr_codes','analytics','billing','compliance','regional_payments','availability_gated_calling'],control_plane:'/api/whatsapp'},
  {id:'threads-api',domain:'social',capability:'threads_content_and_insights',provider_feature:'Threads API',actions:['oauth','publish','manage_content','read_replies','manage_replies','insights']},
  {id:'marketing-api',domain:'ads',capability:'meta_ads_management',provider_feature:'Marketing API',actions:['campaigns','ad_sets','ads','creatives','audiences','placements','insights','budget_management']},
  {id:'conversions-api',domain:'measurement',capability:'server_side_conversion_events',provider_feature:'Conversions API',actions:['web_events','app_events','offline_events','crm_events','event_match_quality','deduplication']},
  {id:'catalog-api',domain:'commerce',capability:'product_catalog_management',provider_feature:'Catalog API',actions:['catalogs','products','feeds','sets','availability','pricing']},
  {id:'commerce-api',domain:'commerce',capability:'meta_commerce_operations',provider_feature:'Commerce API',actions:['shops','orders','fulfillment','returns','inventory','merchant_settings']},
  {id:'webhooks',domain:'events',capability:'meta_event_subscriptions',provider_feature:'Webhooks',actions:['subscriptions','verification','page_events','instagram_events','whatsapp_events','lead_events','change_notifications']},
  {id:'lead-ads',domain:'crm',capability:'lead_generation_ingestion',provider_feature:'Lead Ads',actions:['lead_forms','lead_retrieval','webhook_delivery','crm_sync']},
  {id:'insights',domain:'analytics',capability:'social_and_ads_analytics',provider_feature:'Insights APIs',actions:['page_insights','instagram_insights','ad_insights','breakdowns','attribution','reporting']},
  {id:'audiences',domain:'ads',capability:'audience_management',provider_feature:'Custom Audiences',actions:['custom_audiences','lookalikes','customer_lists','engagement_audiences','exclusions']},
  {id:'app-events',domain:'measurement',capability:'application_event_measurement',provider_feature:'App Events',actions:['install_events','purchase_events','custom_events','optimization_signals']},
  {id:'oauth-system-users',domain:'security',capability:'long_lived_server_access',provider_feature:'System Users & Access Tokens',actions:['system_users','asset_scopes','token_rotation','least_privilege']},
  {id:'app-review',domain:'governance',capability:'permission_and_access_review',provider_feature:'App Review / Access Levels',actions:['permission_review','business_verification','use_case_review','marketing_api_access_tier']},
  {id:'webhook-security',domain:'security',capability:'signed_event_validation',provider_feature:'Webhook Security',actions:['verify_token','signature_validation','replay_protection','event_audit']},
  {id:'developer-tooling',domain:'developer',capability:'meta_developer_toolchain',provider_feature:'Meta Developer Tools',actions:['app_dashboard','graph_api_explorer','access_token_debugger','postman_collections','sdks','changelogs','rate_limits']},
  {id:'llama',domain:'ai',capability:'meta_open_ai_models',provider_feature:'Llama',actions:['model_research','inference_adapters','fine_tuning_patterns','safety_evaluation']},
  {id:'horizon',domain:'immersive',capability:'meta_horizon_development',provider_feature:'Meta Horizon',actions:['quest','horizon_os','unity','unreal','worlds']},
  {id:'wearables',domain:'devices',capability:'meta_wearables_development',provider_feature:'Wearables / AI Glasses',actions:['device_access_toolkit','hands_free_experiences','sensor_integrations']}
]);

export const MAGNANIMOUS_META_PROVIDER_PATTERN = Object.freeze({
  id:'meta',
  role:'replaceable social, messaging, ads, commerce and developer ecosystem',
  provider_internal_only:true,
  provider_brand_override_allowed:false,
  public_identity:'Magnanimous AI',
  social_identity:'Magnanimous AI Social',
  existing_live_adapters:['facebook','instagram','whatsapp'],
  live_adapter_runtime:'assistant-integrations',
  whatsapp_control_plane:'/api/whatsapp',
  publish_actions_require_confirmation:true,
  message_actions_require_confirmation:true,
  ad_spend_actions_require_confirmation:true,
  purchase_actions_enabled:false,
  secret_exposure_allowed:false,
  proprietary_platform_copy_allowed:false
});

export function metaCapabilitySummary(env={}){
  const configuredVersion=String(env.META_GRAPH_VERSION||'v23.0').trim()||'v23.0';
  return {
    identity:'Magnanimous AI Meta Control',
    brain_identity:'Magnanimous AI',
    provider_internal_only:true,
    provider_brand_override_allowed:false,
    meta_app_configured:Boolean(String(env.META_APP_ID||'').trim()&&String(env.META_APP_SECRET||'').trim()),
    configured_graph_version:configuredVersion,
    current_graph_version_reference:'v26.0',
    capability_count:MAGNANIMOUS_META_CAPABILITIES.length,
    capabilities:MAGNANIMOUS_META_CAPABILITIES,
    provider_pattern:MAGNANIMOUS_META_PROVIDER_PATTERN
  };
}
