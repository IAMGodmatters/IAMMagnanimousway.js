// Public, static customer-safe catalog. Keep this outside request bootstrap to
// prevent a DB or provider outage from taking down the homepage tools list.
export const PUBLIC_TOOLS = [
  ['magnanimous','Magnanimous AI','Commander-in-chief brain that plans, remembers, learns, routes, verifies and coordinates every supported platform capability.'],
  ['ai-chat','AI Chat','General-purpose AI assistant.'],
  ['writing','Writing Helper','Create, rewrite, summarize and polish content.'],
  ['research','Research Helper','Research live web/news sources and private workspace knowledge.'],
  ['native-web','Native Web Agent','Magnanimous-owned browser search, rendered extraction, browser workflows, persistent local sessions and monitoring through a paired Local Bridge.'],
  ['capability-mesh','Capability Mesh','Unified Magnanimous routing across native web, GitHub, Magnanimous Cloud, Cloudflare adapters and Railway deployment rails.'],
  ['edge-ai','Edge AI Coprocessor','Owner-controlled NCS2 / MYRIAD inference for offline and hybrid online image/media triage, sampled video analysis, face-presence framing, text-region detection and vision preprocessing through the Magnanimous Local Bridge.'],
  ['bible-study','Bible Study','Study Scripture and organize biblical topics.'],
  ['marketing','Marketing Helper','Create campaigns, captions, offers and content plans.'],
  ['business','Business Helper','Business planning, ideas and analysis.'],
  ['business-launch','Professional Business Launch','Intake, research, validation, financial review, hostile critique and final plan preparation.'],
  ['coding','Coding Helper','Explain, generate and troubleshoot code.'],
  ['video-studio','Text → Video Studio','Create creator-ready video content.'],
  ['social','Social Media Helper','Create platform-ready social posts and scripts.'],
  ['video-script','Video Script Helper','Create short- and long-form video scripts.'],
  ['travel','Travel Helper','Build travel plans and itineraries.'],
  ['customer-service','Customer Service Helper','Draft helpful customer responses.']
].map(([id,name,description]) => ({ id, name, description }));
