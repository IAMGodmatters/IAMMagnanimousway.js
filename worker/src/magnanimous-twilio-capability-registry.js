// Internal provider capability catalog. Twilio remains a replaceable execution provider beneath Magnanimous.
// This file is owner/admin engineering knowledge; do not expose provider identity in customer-facing UI.

export const MAGNANIMOUS_TWILIO_CAPABILITIES = Object.freeze([
  {id:'voice',domain:'communications',capability:'programmable_voice',provider_feature:'Programmable Voice',actions:['inbound_calls','outbound_calls','recordings','transcriptions','twiml','voice_sdks']},
  {id:'media-streams',domain:'communications',capability:'realtime_audio_streaming',provider_feature:'Media Streams',actions:['websocket_audio_in','websocket_audio_out','transcription_feeds','ai_voice_bridge']},
  {id:'sip-trunking',domain:'carrier',capability:'pstn_sip_interconnect',provider_feature:'Elastic SIP Trunking',actions:['origination','termination','secure_trunking','stir_shaken','cnam','sip_refer','disaster_recovery']},
  {id:'interconnect',domain:'carrier',capability:'private_network_interconnect',provider_feature:'Interconnect',actions:['private_connectivity','network_security','redundancy']},
  {id:'network-traversal',domain:'communications',capability:'nat_traversal',provider_feature:'Network Traversal Service',actions:['stun','turn','ice_support']},
  {id:'messaging',domain:'communications',capability:'programmable_messaging',provider_feature:'Programmable Messaging',actions:['sms','mms','sender_pools','messaging_services','delivery_status']},
  {id:'content-templates',domain:'communications',capability:'message_template_management',provider_feature:'Content Template Builder',actions:['templates','variables','multi_channel_content']},
  {id:'whatsapp',domain:'communications',capability:'whatsapp_business_messaging',provider_feature:'WhatsApp',actions:['send','receive','media','templates']},
  {id:'rcs',domain:'communications',capability:'rich_business_messaging',provider_feature:'RCS Business Messaging',actions:['rich_messages','branded_sender','fallback_sms_mms','read_receipts']},
  {id:'conversations',domain:'engagement',capability:'cross_channel_conversations',provider_feature:'Conversations',actions:['conversation_history','participants','channel_orchestration','agent_handoff','memory','relay','intelligence']},
  {id:'notify',domain:'communications',capability:'multi_channel_notifications',provider_feature:'Notify',actions:['notifications','bindings','delivery']},
  {id:'verify',domain:'identity',capability:'user_verification',provider_feature:'Verify',actions:['sms_otp','voice_otp','whatsapp_otp','email_otp','totp','passkeys','push','silent_device_approval','silent_network_auth']},
  {id:'phone-numbers',domain:'carrier',capability:'number_lifecycle',provider_feature:'Phone Numbers',actions:['search_available','purchase_gated','manage','porting','hosted_sms_preview','sender_ids','short_codes']},
  {id:'lookup',domain:'identity',capability:'phone_intelligence',provider_feature:'Lookup v2',actions:['format_validate','line_type','carrier_intelligence','fraud_signals','sim_change_signals']},
  {id:'taskrouter',domain:'contact_center',capability:'skills_based_routing',provider_feature:'TaskRouter',actions:['tasks','workers','queues','workflows','activities','escalation']},
  {id:'flex',domain:'contact_center',capability:'programmable_contact_center',provider_feature:'Flex',actions:['agent_ui','voice','messaging','routing','plugins','insights','copilot']},
  {id:'unified-profiles',domain:'contact_center',capability:'unified_customer_context',provider_feature:'Unified Profiles',actions:['profile_context','identity_resolution','agent_context']},
  {id:'video',domain:'communications',capability:'programmable_video',provider_feature:'Video',actions:['rooms','participants','web','ios','android','react_native']},
  {id:'proxy',domain:'communications',capability:'masked_communications',provider_feature:'Proxy',actions:['services','sessions','participants','interactions','number_pool']},
  {id:'studio',domain:'automation',capability:'visual_communications_workflows',provider_feature:'Studio',actions:['flows','widgets','transitions','ivr','chatbot','surveys','reminders']},
  {id:'functions-assets',domain:'compute',capability:'serverless_communications_compute',provider_feature:'Functions & Assets',actions:['functions','assets','deployments','environments','logs']},
  {id:'twiml-bins',domain:'compute',capability:'hosted_call_instructions',provider_feature:'TwiML Bins',actions:['host_twiml','static_call_logic']},
  {id:'sync',domain:'realtime_data',capability:'shared_realtime_state',provider_feature:'Sync',actions:['web_state','mobile_state','cloud_sync']},
  {id:'event-streams',domain:'observability',capability:'communications_event_bus',provider_feature:'Event Streams',actions:['webhook_sink','kinesis_sink','segment_sink','versioned_events','retries']},
  {id:'usage',domain:'billing',capability:'provider_usage_telemetry',provider_feature:'Usage Records',actions:['usage','count','price','categories','usage_triggers']},
  {id:'segment-connections',domain:'data',capability:'customer_data_connections',provider_feature:'Segment Connections',actions:['sources','destinations','event_collection','routing']},
  {id:'segment-protocols',domain:'data',capability:'data_quality_governance',provider_feature:'Segment Protocols',actions:['tracking_plan','schema_validation','data_dictionary','controls']},
  {id:'segment-unify',domain:'data',capability:'customer_identity_resolution',provider_feature:'Segment Unify',actions:['profiles','identity_graph','traits','audiences']},
  {id:'segment-engage',domain:'data',capability:'omnichannel_audience_activation',provider_feature:'Twilio Engage',actions:['audiences','journeys','campaigns','activation']},
  {id:'privacy-portal',domain:'data_governance',capability:'privacy_operations',provider_feature:'Twilio Privacy Portal',actions:['privacy_requests','data_governance','compliance_workflows']},
  {id:'sendgrid',domain:'email',capability:'transactional_and_marketing_email',provider_feature:'SendGrid',actions:['mail_send','smtp','templates','contacts','event_webhook','inbound_parse','analytics']},
  {id:'marketing-campaigns',domain:'email',capability:'email_marketing_campaigns',provider_feature:'Marketing Campaigns',actions:['campaigns','contacts','segments','templates','analytics']},
  {id:'twilio-email',domain:'email',capability:'cross_channel_email',provider_feature:'Twilio Email',actions:['email_workflows','cross_channel_orchestration']},
  {id:'salesforce',domain:'crm',capability:'salesforce_integration',provider_feature:'Salesforce integration',actions:['crm_sync','contact_center_integration']},
  {id:'trust-hub',domain:'compliance',capability:'telecom_compliance_profiles',provider_feature:'Trust Hub',actions:['business_identity','kyc','a2p_registration','toll_free_registration','stir_shaken','cnam']}
]);

export const MAGNANIMOUS_TWILIO_DEVELOPER_KNOWLEDGE = Object.freeze([
  {id:'general-usage',kind:'essential',capability:'rest_api_account_usage_and_fraud_controls'},
  {id:'global-infrastructure',kind:'essential',capability:'regions_edges_data_residency_routing'},
  {id:'helper-libraries',kind:'developer_tool',capability:'server_web_mobile_sdks'},
  {id:'iam',kind:'security',capability:'api_keys_authentication_projects_access_control'},
  {id:'building-with-ai',kind:'developer_tool',capability:'ai_assisted_twilio_development'},
  {id:'code-exchange',kind:'developer_resource',capability:'reference_apps_and_samples'},
  {id:'marketplace',kind:'developer_tool',capability:'third_party_twilio_integrations'},
  {id:'openapi',kind:'developer_tool',capability:'api_specs_mocking_codegen_postman'},
  {id:'cli',kind:'developer_tool',capability:'resource_management_from_terminal'},
  {id:'api-status',kind:'operations',capability:'service_status_monitoring'},
  {id:'changelog',kind:'operations',capability:'product_change_monitoring'},
  {id:'error-codes',kind:'developer_resource',capability:'api_error_catalog'},
  {id:'glossary',kind:'developer_resource',capability:'product_terminology'},
  {id:'regulatory-compliance',kind:'compliance',capability:'country_and_channel_requirements'},
  {id:'support-plans',kind:'support',capability:'provider_support_tiers'},
  {id:'partners',kind:'support',capability:'implementation_partner_ecosystem'},
  {id:'professional-services',kind:'support',capability:'solution_design_and_deployment_services'}
]);

export function twilioCapabilitySummary(env={}) {
  const account=Boolean(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN);
  const apiKey=Boolean(env.TWILIO_API_KEY_SID && env.TWILIO_API_KEY_SECRET);
  const voice=Boolean(account && env.TWILIO_PHONE_NUMBER);
  return {
    provider_internal_only:true,
    magnanimous_identity:'Magnanimous AI',
    public_provider_identity:'Magnanimous Telecom',
    account_credentials_present:account,
    api_key_credentials_present:apiKey,
    voice_number_present:voice,
    product_catalog_count:MAGNANIMOUS_TWILIO_CAPABILITIES.length,
    developer_knowledge_count:MAGNANIMOUS_TWILIO_DEVELOPER_KNOWLEDGE.length,
    purchase_actions_enabled:false,
    regulated_actions_enabled:false,
    capabilities:MAGNANIMOUS_TWILIO_CAPABILITIES,
    developer_knowledge:MAGNANIMOUS_TWILIO_DEVELOPER_KNOWLEDGE
  };
}
