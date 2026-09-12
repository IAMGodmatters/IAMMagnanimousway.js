const routes=[
 {id:'febo',name:'Febo',title:'Facebook Growth',group:'creator',specialty:'Facebook content and page growth',description:'Facebook posts, community engagement and page-growth ideas.',patterns:[/\bfacebook\b/i,/\bfb (post|page|content)\b/i]},
 {id:'instar',name:'Instar',title:'Instagram Growth',group:'creator',specialty:'Instagram content and audience growth',description:'Instagram content, trends, audience growth and publishing strategy.',patterns:[/\binstagram\b/i,/\breels?\b/i]},
 {id:'linx',name:'Linx',title:'LinkedIn Growth',group:'creator',specialty:'LinkedIn authority content and growth',description:'LinkedIn profiles, authority content and professional growth strategy.',patterns:[/\blinkedin\b/i]},
 {id:'xavier',name:'Xavier',title:'X Growth',group:'creator',specialty:'X posts, threads and audience growth',description:'X/Twitter posts, threads, hooks, hashtags and audience growth.',patterns:[/\btwitter\b/i,/\bx post\b/i,/\bx thread\b/i]},
 {id:'viddi',name:'Viddi',title:'YouTube Shorts',group:'creator',specialty:'YouTube Shorts, hooks and scripts',description:'YouTube Shorts ideas, hooks, scripts and packaging.',patterns:[/\byoutube\b/i,/\bshorts?\b/i]},
 {id:'vex',name:'Vex',title:'Viral Hooks',group:'creator',specialty:'viral hooks and attention-driven openings',description:'Hooks, short-form openings and attention-driven content concepts.',patterns:[/\bviral hook/i,/\bstrong hook/i,/\bscroll[- ]stopp/i]},
 {id:'cara',name:'Cara',title:'Content Repurposer',group:'creator',specialty:'content repurposing across formats',description:'Adapt one idea across multiple social and content formats.',patterns:[/\brepurpose\b/i,/\bturn (this|it) into (a )?(post|reel|thread|caption)/i]},
 {id:'cody',name:'Cody',title:'Copywriter',group:'creator',specialty:'copywriting, persuasion and brand voice',description:'Copywriting, editing, clarity, persuasion and brand voice.',patterns:[/\bcopywrit/i,/\bsales copy\b/i,/\blanding page copy\b/i]},
 {id:'sally',name:'Sally',title:'Story Creator',group:'creator',specialty:'storytelling and narrative content',description:'Short stories, sales stories and narrative content.',patterns:[/\bstorytelling\b/i,/\bwrite (me )?a story\b/i,/\bnarrative\b/i]},
 {id:'dina',name:'Dina',title:'Digital Content',group:'creator',specialty:'content creation and campaign assets',description:'Digital content creation, content systems and campaign assets.',patterns:[/\bcontent creat/i,/\bcreator content\b/i,/\bcreate (me )?(a )?(post|caption|content)\b/i,/\bsocial content\b/i]},
 {id:'sandra',name:'Sandra',title:'Social Strategist',group:'creator',specialty:'cross-platform social strategy',description:'Cross-platform social strategy, calendars and campaign planning.',patterns:[/\bsocial media strateg/i,/\bcontent calendar\b/i,/\bcross[- ]platform\b/i]},
 {id:'adam',name:'Adam',title:'Ad Optimizer',group:'business',specialty:'advertising offers, copy and conversion',description:'Advertising copy, offers, calls to action and conversion-focused improvements.',patterns:[/\badvertis/i,/\bad copy\b/i,/\bmeta ads?\b/i,/\bconversion ad/i]},
 {id:'barbara',name:'Barbara',title:'Blog Writer',group:'business',specialty:'SEO-friendly blog writing',description:'SEO-friendly blog planning, drafting and editorial improvement.',patterns:[/\bblog\b/i,/\barticle\b/i]},
 {id:'celia',name:'Celia',title:'Cold Email Specialist',group:'business',specialty:'cold email and follow-up sequences',description:'Cold-email strategy, personalization, sequences and follow-up.',patterns:[/\bcold email\b/i,/\boutreach email\b/i,/\bemail sequence\b/i]},
 {id:'sebo',name:'Sebo',title:'SEO Specialist',group:'business',specialty:'SEO and search-content strategy',description:'Keyword strategy, on-page SEO and search-content planning.',patterns:[/\bseo\b/i,/\bkeyword research\b/i,/\bsearch ranking\b/i]},
 {id:'mape',name:'Mape',title:'Marketing Persona',group:'business',specialty:'customer personas and messaging alignment',description:'Audience research, customer personas and messaging alignment.',patterns:[/\bcustomer persona\b/i,/\bbuyer persona\b/i,/\baudience persona\b/i]},
 {id:'sophie',name:'Sophie',title:'Market Strategist',group:'business',specialty:'market positioning and competitor strategy',description:'Competitor analysis, market positioning and strategic insights.',patterns:[/\bcompetitor analysis\b/i,/\bmarket positioning\b/i,/\bmarket strateg/i]},
 {id:'dipedi',name:'Dipedi',title:'Product Development',group:'business',specialty:'product validation, positioning and launches',description:'Digital product planning, validation, positioning and launch guidance.',patterns:[/\bproduct development\b/i,/\bproduct validation\b/i,/\bproduct launch\b/i]},
 {id:'dimarko',name:'DiMarko',title:'Digital Marketing',group:'business',specialty:'digital marketing campaigns and optimization',description:'Digital marketing strategy, campaigns, channels and optimization.',patterns:[/\bdigital marketing\b/i,/\bmarketing campaign\b/i]},
 {id:'sienna',name:'Sienna',title:'Sales Advisor',group:'business',specialty:'sales strategy and closing',description:'Digital sales strategy, pipeline improvement and closing plans.',patterns:[/\bsales strateg/i,/\bsales pipeline\b/i,/\bclose (the )?(deal|sale)\b/i]},
 {id:'cena',name:'Cena',title:'Sales Roleplay',group:'business',specialty:'sales roleplay and objection practice',description:'Sales-conversation simulation, objections and practice scenarios.',patterns:[/\bsales roleplay\b/i,/\brole.?play.*sales\b/i,/\bobjection practice\b/i]},
 {id:'bobby',name:'Bobby',title:'Business Strategist',group:'business',specialty:'business strategy, offers and growth',description:'Business advice, planning, strategy, offers, growth and execution.',patterns:[/\bbusiness plan\b/i,/\bbusiness strateg/i,/\bstartup strateg/i,/\bgrow my business\b/i]},
 {id:'cassie',name:'Cassie',title:'Client Onboarding',group:'business',specialty:'client onboarding and handoffs',description:'B2B client onboarding, kickoff, intake, SOPs and handoff planning.',patterns:[/\bclient onboarding\b/i,/\bclient intake\b/i,/\bkickoff process\b/i]},
 {id:'cindy',name:'Cindy',title:'Customer Service Coach',group:'business',specialty:'customer-service responses and de-escalation',description:'Customer-service responses, policies, de-escalation and support coaching.',patterns:[/\bcustomer service\b/i,/\bde.?escalat/i,/\bangry customer\b/i]},
 {id:'quality',name:'Quality',title:'Call QA Coach',group:'call-center',specialty:'call quality assurance and coaching',description:'Score call quality, identify coaching points, build QA rubrics and improve customer conversations.',patterns:[/\bcall qa\b/i,/\bcall quality\b/i,/\bqa score/i,/\bquality rubric\b/i]},
 {id:'scriptor',name:'Scriptor',title:'Call Script Builder',group:'call-center',specialty:'inbound and outbound call scripts',description:'Create inbound, outbound, support, appointment-setting and sales call scripts with clear disclosures.',patterns:[/\bcall script\b/i,/\bphone script\b/i,/\boutbound script\b/i,/\binbound script\b/i]},
 {id:'queue',name:'Queue',title:'Workforce & Queue Planner',group:'call-center',specialty:'call-center staffing and queue coverage',description:'Plan staffing, breaks, queue coverage, service-level targets and simple call-center schedules.',patterns:[/\bqueue coverage\b/i,/\bcall center staffing\b/i,/\bservice level\b/i,/\bworkforce management\b/i]},
 {id:'closer',name:'Closer',title:'Phone Sales Coach',group:'call-center',specialty:'phone sales and objection handling',description:'Objection handling, discovery questions, compliant sales coaching and call practice.',patterns:[/\bphone sales\b/i,/\btelesales\b/i,/\btelemarketing\b/i]},
 {id:'trainer',name:'Trainer',title:'Agent Training Coach',group:'call-center',specialty:'call-center agent training and coaching',description:'Create onboarding, roleplay, scorecards, refreshers and coaching plans for call-center agents.',patterns:[/\bcall center training\b/i,/\bagent training\b/i,/\btraining scorecard\b/i]},
 {id:'captain',name:'Captain',title:'Call Center Supervisor',group:'call-center',specialty:'call-center floor operations and supervision',description:'Shift planning, queue priorities, agent coaching, escalation handling and team-floor operations.',patterns:[/\bcall center supervisor\b/i,/\bcontact center supervisor\b/i,/\bfloor operations\b/i]},
 {id:'supportline',name:'SupportLine',title:'Support Desk Agent',group:'call-center',specialty:'support troubleshooting and escalation paths',description:'Troubleshooting flows, support responses, escalation paths and customer-care playbooks.',patterns:[/\bsupport desk\b/i,/\bhelp desk\b/i,/\bsupport escalation\b/i]},
 {id:'ceevee',name:'Ceevee',title:'CV & Resume Coach',group:'career',specialty:'resumes, CVs and cover letters',description:'CV, resume, cover-letter and job-application improvement.',patterns:[/\bresume\b/i,/\bcv\b/i,/\bcover letter\b/i]},
 {id:'inti',name:'Inti',title:'Interview Coach',group:'career',specialty:'job interview preparation',description:'Mock interviews, answer coaching and interview feedback.',patterns:[/\bjob interview\b/i,/\binterview answer\b/i,/\bmock interview\b/i]},
 {id:'hunter',name:'Hunter',title:'Job Search Coach',group:'career',specialty:'job search and application strategy',description:'Job-search strategy, application tracking, role targeting and follow-up planning.',patterns:[/\bjob search\b/i,/\bfind a job\b/i,/\bjob application\b/i]},
 {id:'emmi',name:'Emmi',title:'Excel Mentor',group:'career',specialty:'spreadsheets, formulas and dashboards',description:'Spreadsheet formulas, analysis, dashboards and Excel guidance.',patterns:[/\bexcel\b/i,/\bspreadsheet\b/i,/\bgoogle sheets\b/i]},
 {id:'grant',name:'Grant',title:'English & Grammar',group:'career',specialty:'English, grammar and clear language',description:'Grammar, English tutoring and clear-language improvement.',patterns:[/\bgrammar\b/i,/\benglish lesson\b/i,/\bproofread\b/i]},
 {id:'office',name:'Office',title:'Workplace Assistant',group:'career',specialty:'professional workplace communication and follow-up',description:'Meeting preparation, professional messages, task follow-up and office workflow support.',patterns:[/\bmeeting agenda\b/i,/\bworkplace message\b/i,/\boffice workflow\b/i]},
 {id:'trip',name:'Trip',title:'Travel Planner',group:'everyday',specialty:'travel planning and itineraries',description:'Trip ideas, itineraries, packing lists, schedules and travel-planning checklists.',patterns:[/\btravel\b/i,/\bitinerary\b/i,/\btrip plan\b/i,/\bpacking list\b/i]},
 {id:'eventa',name:'Eventa',title:'Event Planner',group:'everyday',specialty:'events and celebration planning',description:'Plan birthdays, meetings, community events, celebrations and practical event checklists.',patterns:[/\bevent plan\b/i,/\bbirthday plan\b/i,/\bwedding plan\b/i]},
 {id:'penny',name:'Penny',title:'Budget Organizer',group:'everyday',specialty:'budget organization and savings goals',description:'Simple budgeting guidance, spending categories, savings goals and bill organization; not financial or investment advice.',patterns:[/\bpersonal budget\b/i,/\bbill budget\b/i,/\bsavings goal\b/i]},
 {id:'techie',name:'Techie',title:'Everyday Tech Help',group:'everyday',specialty:'everyday technology troubleshooting',description:'Explain common phone, computer, app and internet tasks in clear step-by-step language.',patterns:[/\bphone problem\b/i,/\bcomputer problem\b/i,/\btech support\b/i,/\bapp not working\b/i]},
 {id:'study',name:'Study',title:'Study Coach',group:'learning',specialty:'study planning and revision',description:'Study schedules, revision plans, practice questions and learning routines.',patterns:[/\bstudy plan\b/i,/\brevision plan\b/i,/\bexam study\b/i]},
 {id:'researcher',name:'Researcher',title:'Research Organizer',group:'learning',specialty:'research organization and evidence synthesis',description:'Turn a topic into research questions, source notes, comparisons and organized findings.',patterns:[/\bresearch (this|topic|question)\b/i,/\bcompare sources\b/i,/\bresearch organizer\b/i]},
 {id:'teacher',name:'Teacher',title:'General Tutor',group:'learning',specialty:'step-by-step tutoring and practice',description:'Explain concepts step by step, adapt difficulty and create practice activities without doing dishonest assessed work.',patterns:[/\bteach me\b/i,/\btutor me\b/i,/\bexplain .* step by step\b/i]}
];

function score(route,text){
 let total=0;
 for(const re of route.patterns)if(re.test(text))total+=2;
 const titleWords=`${route.title} ${route.specialty}`.toLowerCase().split(/[^a-z0-9]+/).filter(x=>x.length>4);
 for(const word of titleWords)if(text.includes(word))total+=.25;
 return total;
}

export function specialistForMessage(message){
 const text=String(message||'').toLowerCase().replace(/\s+/g,' ').trim();
 if(!text||text.length<4)return null;
 let best=null,bestScore=0;
 for(const route of routes){const s=score(route,text);if(s>bestScore){best=route;bestScore=s}}
 if(!best||bestScore<2)return null;
 return {...best,score:bestScore};
}

export function specialistIntroduction(agent){
 return `Hello, I am ${agent.name}. I specialize in ${agent.specialty}. I will be assisting you with this request.`;
}

export function specialistRoutingCatalog(){return routes.map(({patterns,...x})=>x)}
