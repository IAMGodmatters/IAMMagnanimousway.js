// Internal provider capability catalog. Twilio remains a replaceable execution provider beneath Magnanimous.
// This file is owner/admin engineering knowledge; do not expose provider identity in customer-facing UI.

export const MAGNANIMOUS_TWILIO_CAPABILITIES = Object.freeze([
  {id:'voice',domain:'communications',capability:'programmable_voice',provider_feature:'Programmable Voice',actions:['inbound_calls','outbound_calls','recordings','transcriptions','twiml','voice_sdks']},
  {id:'media-streams',domain:'communications',capability:'realtime_audio_streaming',provider_feature:'Media Streams',actions:['websocket_audio_in','websocket_audio_out','transcription_feeds','ai_voice_bridge']},
  {id:'sip-trunking',domain:'carrier',capability:'pstn_sip_interconnect',provider_feature:'Elastic SIP Trunking',actions:['origination','termination','secure_trunking','stir_shaken','cnam','sip_refer','disaster_recovery']},
  {id:'messaging',domain:'communications',capability:'programmable_messaging',provider_feature:'Programmable Messaging',actions:['sms','mms','sender_pools','messaging_services','delivery_status']},
  {id:'whatsapp',domain:'communications',capability:'whatsapp_business_messaging',provider_feature:'WhatsApp',actions:['send','receive','media','templates']},
  {id:'rcs',domain:'communications',capability:'rich_business_messaging',provider_feature:'RCS Business Messaging',actions:['rich_messages','branded_sender','fallback_sms_mms','read_receipts']},
  {id:'conversations',domain:'engagement',capability:'cross_channel_conversations',provider_feature:'Conversations',actions:['conversation_history','participants','channel_orchestration','agent_handoff']},
  {id:'verify',domain:'identity',capability:'user_verification',provider_feature:'Verify',actions:['sms_otp','voice_otp','whatsapp_otp','email_otp','totp','passkeys','push','silent_device_approval','silent_network_auth']},
  {id:'phone-numbers',domain:'carrier',capability:'number_lifecycle',provider_feature:'Phone Numbers',actions:['search_available','purchase_gated','manage','porting','hosted_sms_preview']},
  {id:'lookup',domain:'identity',capability:'phone_intelligence',provider_feature:'Lookup v2',actions:['format_validate','line_type','carrier_intelligence','fraud_signals','sim_change_signals']},
  {id:'taskrouter',domain:'contact_center',capability:'skills_based_routing',provider_feature:'TaskRouter',actions:['tasks','workers','queues','workflows','activities','escalation']},
  {id:'flex',domain:'contact_center',capability:'programmable_contact_center',provider_feature:'Flex',actions:['agent_ui','voice','messaging','routing','plugins','insights','copilot']},
  {id:'video',domain:'communications',capability:'programmable_video',provider_feature:'Video',actions:['rooms','participants','web','ios','android','react_native']},
  {id:'proxy',domain:'communications',capability:'masked_communications',provider_feature:'Proxy',actions:['services','sessions','participants','interactions','number_pool']},
  {id:'studio',domain:'automation',capability:'visual_communications_workflows',provider_feature:'Studio',actions:['flows','widgets','transitions','ivr','chatbot','surveys','reminders']},
  {id:'functions-assets',domain:'compute',capability:'serverless_communications_compute',provider_feature:'Functions & Assets',actions:['functions','assets','deployments','environments','logs']},
  {id:'sync',domain:'realtime_data',capability:'shared_realtime_state',provider_feature:'Sync',actions:['web_state','mobile_state','cloud_sync']},
  {id:'event-streams',domain:'observability',capability:'communications_event_bus',provider_feature:'Event Streams',actions:['webhook_sink','kinesis_sink','segment_sink','versioned_events','retries']},
  {id:'usage',domain:'billing',capability:'provider_usage_telemetry',provider_feature:'Usage Records',actions:['usage','count','price','categories','usage_triggers']},
  {id:'segment',domain:'data',capability:'customer_data_platform',provider_feature:'Segment',actions:['identify','track','page','screen','group','alias','sources','destinations','identity_resolution']},
  {id:'sendgrid',domain:'email',capability:'transactional_and_marketing_email',provider_feature:'SendGrid',actions:['mail_send','smtp','templates','contacts','marketing_campaigns','event_webhook','inbound_parse','analytics']},
  {id:'trust-hub',domain:'compliance',capability:'telecom_compliance_profiles',provider_feature:'Trust Hub',actions:['business_identity','kyc','a2p_registration','toll_free_registration','stir_shaken','cnam']}
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
    catalog_count:MAGNANIMOUS_TWILIO_CAPABILITIES.length,
    purchase_actions_enabled:false,
    regulated_actions_enabled:false,
    capabilities:MAGNANIMOUS_TWILIO_CAPABILITIES
  };
}
