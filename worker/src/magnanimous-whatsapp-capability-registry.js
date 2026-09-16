// WhatsApp/Meta remains a replaceable execution ecosystem beneath Magnanimous AI.
// Magnanimous owns orchestration, normalized state, memory and public identity.

export const MAGNANIMOUS_WHATSAPP_CAPABILITIES = Object.freeze([
  {id:'cloud-api',domain:'platform',capability:'official_business_messaging_api',provider_feature:'WhatsApp Cloud API',actions:['send_receive','graph_endpoints','versioned_api','business_system_integration']},
  {id:'text-messages',domain:'messaging',capability:'text_business_messaging',actions:['send_text','reply_context','links','message_ids']},
  {id:'media-messages',domain:'messaging',capability:'media_business_messaging',actions:['image','audio','video','document','sticker','media_ids','media_links']},
  {id:'interactive-messages',domain:'messaging',capability:'interactive_customer_experiences',actions:['reply_buttons','list_messages','call_to_action','product_messages','order_details','order_status']},
  {id:'message-templates',domain:'messaging',capability:'approved_template_lifecycle',actions:['list','get','create','edit','delete','authentication','utility','marketing','quick_reply','call_to_action','media_headers','catalog_templates','quality_signals']},
  {id:'reactions-context',domain:'messaging',capability:'conversation_context',actions:['reactions','reply_context','message_reference']},
  {id:'message-status',domain:'messaging',capability:'delivery_state_tracking',actions:['sent','delivered','read','failed','wamid_tracking','read_receipts']},
  {id:'typing-indicators',domain:'messaging',capability:'typing_and_read_signals',actions:['typing_indicator','mark_read']},
  {id:'webhooks',domain:'events',capability:'whatsapp_event_ingestion',actions:['waba_subscription','messages','statuses','template_events','phone_events','quality_events','verification','signature_validation','deduplication']},
  {id:'waba-management',domain:'business',capability:'whatsapp_business_account_management',actions:['get_waba','owned_wabas','shared_wabas','assets','timezone','template_namespace']},
  {id:'phone-numbers',domain:'business',capability:'business_phone_number_lifecycle',actions:['list','get','filter','display_name_status','phone_number_id','deregister']},
  {id:'phone-verification',domain:'security',capability:'phone_ownership_verification',actions:['request_sms_code','request_voice_code','verify_code']},
  {id:'two-step-verification',domain:'security',capability:'whatsapp_number_2fa',actions:['set_pin','registration_security']},
  {id:'registration',domain:'business',capability:'cloud_api_number_registration',actions:['register','reregister_after_name_change','deregister','migration_readiness']},
  {id:'business-profile',domain:'business',capability:'business_profile_management',actions:['about','address','description','email','websites','vertical','profile_picture','resumable_upload']},
  {id:'media-management',domain:'content',capability:'media_storage_and_retrieval',actions:['upload','download','delete','resumable_upload','mime_metadata']},
  {id:'flows',domain:'automation',capability:'structured_in_chat_workflows',actions:['create','clone','list','get','preview','update','publish','deprecate','delete','endpoint_encryption','send_flow','sign_up','sign_in','appointment_booking','lead_generation','contact_us','customer_support','survey']},
  {id:'commerce-settings',domain:'commerce',capability:'whatsapp_commerce_configuration',actions:['get_settings','update_settings','catalog_visibility','cart_controls']},
  {id:'catalog-commerce',domain:'commerce',capability:'product_and_order_experiences',actions:['catalog_templates','single_product','multi_product','product_browsing','order_details','order_status']},
  {id:'qr-codes',domain:'growth',capability:'whatsapp_message_qr_links',actions:['create','get','list','update','svg','png','prefilled_message','deep_link']},
  {id:'embedded-signup',domain:'onboarding',capability:'business_onboarding',actions:['embedded_signup','waba_assignment','phone_onboarding','solution_partner_onboarding','tech_provider_onboarding']},
  {id:'business-management',domain:'business',capability:'waba_asset_administration',actions:['business_portfolio','asset_assignment','system_users','client_wabas','shared_assets']},
  {id:'access-tokens',domain:'security',capability:'api_authentication',actions:['user_tokens','system_user_tokens','least_privilege','token_rotation','whatsapp_business_messaging','whatsapp_business_management']},
  {id:'analytics',domain:'analytics',capability:'whatsapp_business_analytics',actions:['usage','message_performance','conversation_metrics','quality_monitoring','operational_reporting']},
  {id:'billing',domain:'billing',capability:'whatsapp_billing_visibility',actions:['credit_lines','billing_status','cost_observation','invoice_reconciliation']},
  {id:'quality-signals',domain:'governance',capability:'messaging_quality_monitoring',actions:['template_quality','phone_quality','delivery_failures','policy_health','rate_health']},
  {id:'consent-policy',domain:'governance',capability:'consent_and_messaging_policy_controls',actions:['opt_in_record','opt_out_record','template_policy','customer_service_window_awareness','marketing_guardrails','audit']},
  {id:'reliability',domain:'operations',capability:'production_delivery_controls',actions:['idempotency','retry_backoff','webhook_deduplication','rate_limit_observation','dead_letter_queue','status_reconciliation','error_catalog']},
  {id:'regional-payments',domain:'payments',capability:'availability_gated_whatsapp_payments',actions:['payments_india_beta','payments_singapore','order_details','order_status','regional_eligibility_check'],availability_gated:true,purchase_execution_enabled:false},
  {id:'business-compliance',domain:'governance',capability:'regional_business_compliance',actions:['compliance_info','country_specific_requirements','business_verification','permission_review']},
  {id:'block-users',domain:'safety',capability:'business_user_block_controls',actions:['block','unblock','abuse_response']},
  {id:'migration',domain:'platform',capability:'legacy_and_account_migration_readiness',actions:['on_prem_to_cloud','phone_migration','asset_mapping','cutover_validation'],notes:'On-Premises API is legacy/deprecated; Cloud API is the target architecture.'},
  {id:'business-calling',domain:'voice',capability:'availability_gated_business_calling',actions:['customer_to_business_calling','business_to_customer_calling_with_user_request','voice_support','future_video_support','ai_voice_support_pattern'],availability_gated:true,direct_execution_enabled:false},
  {id:'cross-channel-campaigns',domain:'marketing',capability:'whatsapp_meta_campaign_coordination',actions:['ads_manager_awareness','subscriber_list_activation','whatsapp_marketing_placement','facebook_instagram_coordination'],ad_spend_execution_enabled:false},
  {id:'business-ai-patterns',domain:'ai',capability:'ai_assisted_customer_support_and_sales',actions:['faq_answering','product_recommendations','sales_follow_up','human_handoff','voice_ai_pattern'],provider_model_identity_override_allowed:false},
  {id:'developer-tooling',domain:'developer',capability:'whatsapp_developer_toolchain',actions:['official_postman_collection','graph_api_explorer','webhook_testing','sdks','api_specs','changelog','error_codes','test_numbers','app_dashboard']},
  {id:'product-surface-awareness',domain:'product',capability:'whatsapp_ecosystem_awareness',actions:['business_app','web','desktop','status','channels','calling','linked_devices'],api_control_claimed:false}
]);

export const MAGNANIMOUS_WHATSAPP_PROVIDER_PATTERN = Object.freeze({
  id:'meta-whatsapp',
  role:'replaceable business messaging, commerce, automation and communications engine',
  provider_internal_only:true,
  provider_brand_override_allowed:false,
  public_identity:'Magnanimous AI',
  communications_identity:'Magnanimous AI Communications',
  existing_live_adapter:'whatsapp',
  live_adapter_runtime:'assistant-integrations',
  oauth_runtime:'integrations',
  message_actions_require_confirmation:true,
  template_mutations_require_confirmation:true,
  flow_publish_requires_confirmation:true,
  commerce_mutations_require_confirmation:true,
  payment_actions_require_explicit_approval:true,
  calling_actions_require_explicit_approval:true,
  purchase_actions_enabled:false,
  ad_spend_actions_enabled:false,
  secret_exposure_allowed:false,
  provider_corpus_copy_allowed:false,
  second_write_path_allowed:false
});

export function whatsappCapabilitySummary(env={}){
  const configuredVersion=String(env.META_GRAPH_VERSION||'v23.0').trim()||'v23.0';
  return {
    identity:'Magnanimous AI WhatsApp Control',
    brain_identity:'Magnanimous AI',
    provider_internal_only:true,
    provider_brand_override_allowed:false,
    meta_app_configured:Boolean(String(env.META_APP_ID||'').trim()&&String(env.META_APP_SECRET||'').trim()),
    embedded_signup_configured:Boolean(String(env.WHATSAPP_CONFIG_ID||'').trim()),
    configured_graph_version:configuredVersion,
    capability_count:MAGNANIMOUS_WHATSAPP_CAPABILITIES.length,
    capabilities:MAGNANIMOUS_WHATSAPP_CAPABILITIES,
    provider_pattern:MAGNANIMOUS_WHATSAPP_PROVIDER_PATTERN
  };
}
