export type CapabilityStatus='native-now'|'native-target'|'optional-provider'|'license-gated';
export type CapabilityGroup={id:string;name:string;summary:string;skills:string[];techniques:string[];status:CapabilityStatus;nativeHref?:string};
export type PublicSource={label:string;url:string;kind:'product'|'docs'|'github'};

export const publicSources:PublicSource[]=[
 {label:'MirrorFly developer documentation',url:'https://www.mirrorfly.com/docs/',kind:'docs'},
 {label:'MirrorFly chat product',url:'https://www.mirrorfly.com/chat/',kind:'product'},
 {label:'MirrorFly public feature catalog',url:'https://www.mirrorfly.com/chat-features.php',kind:'product'},
 {label:'MirrorFly JavaScript SDK',url:'https://www.mirrorfly.com/chat/sdk/javascript/',kind:'docs'},
 {label:'MirrorFly web chat quick start',url:'https://www.mirrorfly.com/docs/chat/web/quick-start/',kind:'docs'},
 {label:'MirrorFly audio/video overview',url:'https://www.mirrorfly.com/docs/audio-video/overview/',kind:'docs'},
 {label:'MirrorFly Meet overview',url:'https://www.mirrorfly.com/docs/meet/overview/',kind:'docs'},
 {label:'MirrorFly platform REST API guide',url:'https://www.mirrorfly.com/docs/platformapi/adminapis/get-started/',kind:'docs'},
 {label:'MirrorFly activity feeds',url:'https://www.mirrorfly.com/activity-feeds.php',kind:'product'},
 {label:'MirrorFly conversational AI features',url:'https://www.mirrorfly.com/conversational-ai/features/',kind:'product'},
 {label:'MirrorFly AI chatbot',url:'https://www.mirrorfly.com/conversational-ai/chatbot/',kind:'product'},
 {label:'MirrorFly speech-to-text',url:'https://www.mirrorfly.com/conversational-ai/speech-to-text/',kind:'product'},
 {label:'MirrorFly contact center',url:'https://www.mirrorfly.com/contact-center-solution.php',kind:'product'},
 {label:'MirrorFly GitHub organization',url:'https://github.com/MirrorFly',kind:'github'},
 {label:'MirrorFly React sample',url:'https://github.com/MirrorFly/MirrorFly-React-Sample',kind:'github'},
 {label:'MirrorFly Flutter sample',url:'https://github.com/MirrorFly/MirrorFly-Flutter-Sample',kind:'github'},
 {label:'MirrorFly Android sample',url:'https://github.com/MirrorFly/MirrorFly-Android-Sample-V2',kind:'github'},
 {label:'MirrorFly React Native sample',url:'https://github.com/MirrorFly/MirrorFly-ReactNative-Sample',kind:'github'},
 {label:'MirrorFly WebRTC sample',url:'https://github.com/MirrorFly/MirrorflyWebrtc',kind:'github'}
];

export const capabilityGroups:CapabilityGroup[]=[
 {id:'messaging',name:'Messaging + presence',summary:'Modern in-app conversations under the client brand.',status:'native-now',nativeHref:'/inbox',skills:['1:1 messaging','group conversations','typing indicators','online/presence state','delivery/read state','message history','attachments and media','reactions','mentions','broadcast messaging','push notifications','search and call/message history'],techniques:['real-time event delivery','optimistic UI with server reconciliation','presence heartbeats','tenant-scoped conversation storage','notification fan-out','provider-failure fallback']},
 {id:'moderation',name:'Moderation + safety',summary:'Keep customer communication safe, reviewable and policy-controlled.',status:'native-target',nativeHref:'/inbox',skills:['chat moderation','spam detection','toxicity filtering','block/report workflows','role-based controls','audit trails','retention controls','human review'],techniques:['policy gates before delivery','server-side enforcement','least privilege','content classification','appeal/review trails','data minimization']},
 {id:'voice-video',name:'Voice + video calling',summary:'Browser and app calling with provider-neutral transport underneath.',status:'native-now',nativeHref:'/phone',skills:['1:1 audio calls','1:1 video calls','group/conference calls','mute/unmute','audio device selection','reconnect handling','call status','invite users into a call','call logs','missed-call alerts','browser WebRTC'],techniques:['WebRTC','ICE negotiation','DTLS-SRTP','Opus media','adaptive reconnect','SIP bridge where authorized','cost-aware carrier fallback']},
 {id:'meet-live',name:'Meetings + live experiences',summary:'Scheduled rooms, group sessions and live interaction patterns.',status:'native-target',nativeHref:'/video-agents',skills:['meeting links','meeting scheduling','group audio/video rooms','live broadcasting','speaking indicators','adaptive bitrate','screen-oriented collaboration','push/VoIP notifications'],techniques:['room lifecycle management','participant state fan-out','bandwidth adaptation','reconnection state machine','moderator roles','recording/consent gates']},
 {id:'contact-center',name:'Contact center + agent desk',summary:'Human and AI-assisted customer operations across calls and messages.',status:'native-now',nativeHref:'/agent-desk',skills:['call routing','IVR workflows','queues','agent presence','dispositions','scripts and rebuttals','supervisor controls','omnichannel inbox','bot-to-human handoff','CRM context','quality review'],techniques:['skills-based routing','queue prioritization','human escalation','consent-gated supervision','action receipts','cost shields','tenant separation']},
 {id:'ai-voice',name:'AI voice agent',summary:'Magnanimous-controlled voice automation with outside models kept replaceable.',status:'native-now',nativeHref:'/ai-receptionist',skills:['natural-language handling','speech recognition','text-to-speech','multilingual/accent handling','sentiment and emotion signals','context retention','CRM/ticketing handoff','call summaries','transcription','noise handling','callback scheduling','QA/compliance checks','custom voice persona'],techniques:['streaming STT/TTS','barge-in/interruption','tool calling through Magnanimous policy','retrieval-grounded responses','handoff thresholds','post-call summarization','provider abstraction']},
 {id:'ai-chat',name:'AI chatbot + agentic support',summary:'White-label chat automation with Magnanimous AI remaining the identity and policy brain.',status:'native-now',nativeHref:'/white-label/branded-ai',skills:['branded chatbot','custom workflows','knowledge-grounded answers','smart replies','topic classification','intent detection','sentiment analysis','context-aware responses','human handoff'],techniques:['RAG-style grounding','workflow orchestration','memory isolation','approval gates','tool permissioning','provider-neutral model routing']},
 {id:'speech',name:'Speech-to-text + transcription',summary:'Voice understanding as a reusable communications primitive.',status:'native-target',nativeHref:'/ai-receptionist',skills:['real-time transcription','voice activity detection','domain vocabulary','key-phrase biasing','audio cleanup','call transcription','conversation summaries'],techniques:['streaming chunks','VAD','noise reduction','partial transcript reconciliation','domain lexicon adaptation','confidence-aware fallback']},
 {id:'feeds',name:'Activity feeds + community',summary:'Real-time social/community feed patterns for branded client apps.',status:'native-target',skills:['activity posts','24-hour status posts','likes','comments','reactions','aggregation','URL enrichment','hashtags','mentions','notification feeds','personalized feeds','follow/unfollow','custom ranking','media attachments','analytics','webhooks','trending topics'],techniques:['fan-out/fan-in feeds','ranking rules','cursor pagination','link unfurling','real-time subscriptions','engagement scoring','moderation pipeline']},
 {id:'integration',name:'APIs, SDKs + webhooks',summary:'Expose communication capability without locking Magnanimous identity to one vendor.',status:'native-target',skills:['REST APIs','webhooks','JavaScript integrations','React integrations','Android integrations','iOS integrations','Flutter integrations','React Native integrations','Angular integrations','Vue integrations','custom UI kits','third-party integrations'],techniques:['stable provider-neutral contracts','adapter interfaces','webhook verification','idempotency','retry/backoff','health checks','capability discovery','version pinning']},
 {id:'deployment',name:'White-label + deployment control',summary:'Client branding, data control and deployment choice remain first-class.',status:'native-now',nativeHref:'/white-label',skills:['client branding','theme control','custom UI','self-hosted patterns','cloud deployment','data sovereignty','custom security','tenant isolation','source-code governance'],techniques:['brand tokens','provider-private customer surfaces','server-side credentials','least privilege','regional deployment choices','audit logging','retention controls']},
 {id:'mirrorfly-adapter',name:'Optional MirrorFly adapter',summary:'Use MirrorFly only as replaceable infrastructure if a valid commercial/license arrangement is supplied.',status:'license-gated',skills:['MirrorFly SDK initialization','MirrorFly license-key authentication','MirrorFly platform API access','MirrorFly hosted/self-hosted deployment options'],techniques:['server-side secret storage','adapter isolation','feature flags','health/readiness checks','no provider branding in customer UI','no proprietary-code copying']}
];

export const implementationRules=[
 'Magnanimous AI remains the brain, identity, memory, reasoning, orchestration and policy layer.',
 'Use native/free/browser/WebRTC capabilities first when practical.',
 'Treat MirrorFly and every other communications vendor as optional replaceable infrastructure.',
 'Do not copy proprietary MirrorFly source or represent commercial source-code rights as owned without a valid license.',
 'Keep customer-facing surfaces provider-private and brand them for the client.',
 'Preserve tenant isolation, explicit consent, audit trails, cost controls and provider/regulatory truth gates.',
 'Do not activate paid carrier, GPU, telecom or CPaaS usage without funded/authorized billing controls.'
] as const;
