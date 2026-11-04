'use client';
import {useState} from 'react';

type Opportunity={
 id:string;name:string;status:'active-ph'|'location-check'|'waitlist'|'closed';
 badge:string;summary:string;requirements:string[];examples?:string[];official:string;secondary?:string;secondaryLabel?:string;tertiary?:string;tertiaryLabel?:string;moreLinks?:{label:string;url:string}[];cta:string;referral?:string;verified:string;
};

const opportunities:Opportunity[]=[
 {
  id:'atlas',name:'Atlas Capture',status:'location-check',badge:'IPHONE VIDEO TASKS • COUNTRY AVAILABILITY VARIES',
  summary:'The current official opportunity page lists first-person home-task video capture for AI research. It specifies an iPhone 11 or newer and pay per approved hour; rates and task availability vary by country. Atlas’s October 6, 2026 official update confirms the existing referral code remains valid and publishes new milestone bonuses for friends who sign up from October 11, 2026.',
  requirements:['iPhone 11 or newer; a head strap is required and the official site says it is available through the app—confirm whether it is provided and whether any cost applies before spending money','Only approved hours are paid; task volume and pay vary by country and task','The current official site says withdrawals start at USD $10 and unlock after 5 approved hours; verify payout method and Philippines eligibility in-app','Do not buy equipment from unsolicited messages or third-party sellers expecting reimbursement; app-store reviews report reimbursement and support complaints','Review video licensing/privacy terms and keep children, faces, IDs, screens, addresses and confidential household details out of frame','Official referral terms for friends who sign up from October 11, 2026: both the existing member and new member earn USD 10 each after 1 approved hour, USD 50 each after 20 approved hours, and USD 100 each after 50 approved hours. Approved hours are cumulative; verify the milestones and code inside the app before relying on a bonus'],
  examples:['Official tasks include folding laundry, washing dishes, watering plants and wiping counters','Pay is per approved hour; no universal country rate is published','Withdrawal threshold: USD $10 after 5 approved hours, according to the current official site'],
  official:'https://www.atlascapture.io/opportunities',
  secondary:'https://apps.apple.com/ph/app/atlas-capture/id6755671397',
  tertiary:'https://www.atlascapture.io/blog/new-look',
  tertiaryLabel:'Official October 6, 2026 referral milestone announcement',
  cta:'Open official opportunities',
  referral:'2PDR9UXD',
  verified:'2026-11-01'
 },
 {
  id:'kled-iphone-data-tasks',name:'Kled — iPhone Photo/Video Data Tasks',status:'location-check',badge:'IPHONE ONLY • CONFIRM LIVE PH TASKS',
  summary:'Kled V3 is now available in the Philippines App Store (version 3.0.3, released October 17, 2026). It adds a personalized paid-task feed and more work types across photos, video, audio, text and annotation; each task shows its pay, instructions and submission examples before you start. Earnings still vary by task and accepted content. A third-party job-board post claimed a Weather-Degraded Scenes task paid USD $0.30 per accepted photo, but Kled’s official public materials do not confirm that task or rate; treat the claim as unverified unless the same task and exact amount appear inside the app.',
  requirements:['iPhone only, 18+ and iOS 18.6 or later; the official App Store listing is available in the Philippines','Kled V3 task categories include photos, video, audio, text and annotation. The app says each task shows its pay, instructions and accepted/rejected examples before you begin','The app lists PayPal, Venmo or Solana wallet payouts; a developer response states a USD $25 minimum cashout, which it reviews periodically. Confirm PayPal availability and all payout/identity requirements in-app before uploading','The developer says ordinary upload value depends on uniqueness, diversity, quality and current buyer demand; no universal per-photo or hourly rate is promised','Uploads are reviewed and accepted contributions may be licensed to AI companies for training with contributor consent. Do not upload private/family photos, children, IDs, financial information or images of people without consent','Specific tasks are piecework: only rely on the amount displayed in the official in-app task brief before you begin; rejected submissions are unpaid','Do not pay a joining fee or share OTPs, passwords or crypto recovery phrases; avoid crypto payouts unless you understand the risks'],
  official:'https://apps.apple.com/ph/app/kled/id6752585718',
  secondary:'https://kled.ai',
  secondaryLabel:'Official developer website',
  cta:'Open official App Store listing',
  verified:'2026-10-31'
 },

 {
  id:'welo',name:'Welo Global',status:'active-ph',badge:'PHILIPPINES • ACTIVE ROLES + LANGUAGE TALENT POOLS',
  summary:'Current official Philippines listings include remote/freelance AI training, quality review, ads rating and video annotation. Cebuano, English, Tagalog and Ilocano AI Trainers Network listings are talent pools, not active paid job openings; work, scope and compensation are disclosed only if a matching project is offered.',
  requirements:['Requirements differ by role; check the exact official listing before applying','Apply only through the official Welo/Lever listing; the Philippines is explicitly named on the role or talent-hub pages linked here','AI Trainers Network applications add contributors to a talent pool; they do not promise immediate work, hours or income','Do not assume every role is open indefinitely; the official Philippines board is the live source'],
  examples:['AI Data Quality Specialist — English (Philippines)','AI Trainers Network — Cebuano / English / Tagalog (talent pools; no immediate work)','Shape the Future of AI — Ilocano Talent Hub (native/near-native Ilocano plus English; talent pool, not an active job)','Project Cursa — Robot Manipulation Video Annotator and QC','Ads Quality Rater — Filipino (Philippines)'],
  official:'https://jobs.lever.co/weloglobal/?location=Philippines',
  secondary:'https://jobs.lever.co/weloglobal/a7b1515b-4ec4-4154-97cf-459423c50709',
  secondaryLabel:'Official Ilocano AI Trainers talent hub (not an active job)',
  cta:'Open current Philippines roles',
  verified:'2026-11-01'
 },
 {
  id:'ai-data-innovations-ai-safety-annotator',name:'AI Data Innovations — Technical Data Annotator (AI Safety & Guardrails)',status:'active-ph',badge:'PHILIPPINES • REMOTE • CONTRACT • USD $8.00/HR • ABOUT 12 WEEKS',
  summary:'The employer’s newer LinkedIn posting lists the same remote Philippines AI Safety & Guardrails project at USD $8.00/hour, approximately 12 weeks, with weekly hours still to be confirmed. The earlier USD $6.50/hour posting is now marked no longer accepting applications. This is a new employer-posted rate and application listing, not a guaranteed increase to an existing contract.',
  requirements:['Philippines listing; remote; independent-contractor/project-based work for approximately 12 weeks; weekly hours are still to be confirmed','Bachelor’s degree in Computer Science, Software Engineering, IT or a related STEM field, or equivalent technical training and demonstrable experience','Familiarity with at least one programming language; ability to read code, logs, configuration files, command-line instructions and stack traces; basic application-security concepts','Professional English, strong analytical judgement and attention to detail; technical screening, project training and calibration are required','The work may include reviewing harmful, offensive or sensitive text as part of content-moderation tasks','The newer employer LinkedIn post states USD $8.00/hour. Confirm weekly hours, payment schedule, contract terms and that the application remains open before accepting; do not pay a recruiter or intermediary'],
  official:'https://ph.linkedin.com/jobs/view/technical-data-annotator-remote-position-at-ai-data-innovations-4479543236',
  secondary:'https://aidatainnovations.com/',
  secondaryLabel:'AI Data Innovations official website',
  tertiary:'https://ph.linkedin.com/jobs/view/technical-data-annotator-remote-position-at-ai-data-innovations-4463376446',
  tertiaryLabel:'Closed predecessor posting — USD $6.50/hour',
  cta:'View current employer LinkedIn listing',
  verified:'2026-11-02'
 },
 {
  id:'innodata-technical-ai-evaluation',name:'Innodata Knowledge Services — Technical AI Evaluation Specialist',status:'active-ph',badge:'PHILIPPINES • REMOTE/WFH • PROJECT-BASED • 3 MONTHS • PAY NOT DISCLOSED',
  summary:'The employer’s LinkedIn listing seeks technical evaluators to review AI-generated code and software-engineering outputs, checking quality, accuracy and functionality. It specifies Philippines remote/WFH, full-time project-based contract work for about three months. Compensation is not disclosed.',
  requirements:['Graduate of Computer Science, IT or a related course; at least two years of programming experience','Proficiency in at least one programming language and experience with varied languages or technologies','Strong analytical and problem-solving skills; work involves evaluating AI-generated code and software-engineering results','Philippines remote/WFH; full-time, project-based contract for approximately three months','Pay, weekly hours and exact start date are not published; confirm these in writing before accepting','Apply through the official Innodata Knowledge Services LinkedIn job listing. No applicant fee is stated; never pay a recruiter or intermediary'],
  official:'https://ph.linkedin.com/jobs/view/technical-ai-evaluation-specialists-at-innodata-knowledge-services-inc-4476625833',
  cta:'View official employer listing',
  verified:'2026-11-01'
 },
 {
  id:'arca-operations-va',name:'Arca.ph — Operations Virtual Assistant (US Construction Client)',status:'active-ph',badge:'PHILIPPINES • FULL-TIME REMOTE • US EASTERN HOURS • PAY NOT DISCLOSED',
  summary:'Arca.ph’s official role page lists a full-time remote Philippines Virtual Assistant position supporting a U.S.-based construction company launching a commercial division. Work spans recruiting/headhunting, outbound calls and messages, business-development research, AI tools and workflow improvement, vendor quotes, and executive operations. Prior recruiting, sales, VA or construction experience is not required, but the role involves cold calling.',
  requirements:['Philippines-based; full-time schedule aligned with U.S. Eastern business hours; reliable internet and a quiet professional workspace','Strong spoken and written English, analytical ability, initiative, independent learning and reliable follow-through are required','Must be comfortable cold-calling unfamiliar U.S. professionals and prospects; tasks include candidate sourcing, introductory calls, vendor research and follow-up','Hubstaff time tracking and concise daily reporting are part of the working arrangement','Pay, payment schedule and contract terms are not disclosed on the public listing; confirm these and the client details before accepting','Apply only through the official Arca.ph role page. No applicant fee is stated publicly; do not pay a recruiter or third party to secure an interview'],
  official:'https://arca.ph/careers/jobs/operations-virtual-assistant-2437',
  secondary:'https://arca.ph/careers',
  secondaryLabel:'Arca.ph official open roles',
  cta:'View official role and apply',
  verified:'2026-11-01'
 },
 {
  id:'content-hacker-content-producer',name:'Content Hacker — Content Producer',status:'active-ph',badge:'PHILIPPINES • FULL-TIME REMOTE • ₱50,000–₱55,000/MONTH',
  summary:'Official CH Media Inc. (Content Hacker) full-time remote role for producing B2B thought leadership, reports, case studies, landing pages, email, social and digital campaigns for complex industries such as fintech, SaaS, technology and financial services. The employer’s live careers page still lists the position as open.',
  requirements:['Remote from anywhere in the Philippines; full-time employment with CH Media Inc. and high-speed home internet','Target profile: 3–7 years of professional writing/content-production experience and a bachelor’s degree in Communications, Journalism, Media, Marketing or a related field','Strong portfolio showing researched long-form B2B writing, clear storytelling, complex subject research and ability to interview subject-matter experts or executives','Digital marketing and SEO familiarity; experience with LinkedIn Ads, Google Display Network, email campaigns, analytics, WordPress, Google Workspace, Canva, Figma and basic Adobe tools','Application asks for a résumé and at least one portfolio link or file; employer says the People team aims to reply within 3 working days','Pay is advertised at ₱50,000–₱55,000 per month. The public application page does not state an applicant fee; do not pay intermediaries'],
  official:'https://people.contenthacker.co/careers/content-producer',
  secondary:'https://people.contenthacker.co/careers',
  secondaryLabel:'Official Content Hacker careers page',
  cta:'Apply on official employer page',
  verified:'2026-11-01'
 },
 {
  id:'content-hacker-multimedia-artist',name:'Content Hacker — Multimedia Artist',status:'active-ph',badge:'PHILIPPINES • FULL-TIME REMOTE • ₱50,000–₱65,000/MONTH',
  summary:'Official CH Media Inc. (Content Hacker) full-time remote design role creating digital and print graphics, reports, eBooks, presentations, infographics, campaign assets and basic video/motion content. The employer’s live careers page still lists the position as open.',
  requirements:['Remote from anywhere in the Philippines; full-time employment with CH Media Inc. and high-speed home internet','Target profile: 4–7 years in graphic/multimedia design and a bachelor’s degree in Graphic Design, Multimedia Design, Visual Communication, Digital Media or a related field','Strong portfolio in digital and print design, editorial/long-form layouts, campaign creative, presentations and brand systems','Advanced Adobe InDesign, Illustrator and Photoshop; strong Figma; basic Premiere Pro or After Effects for video cutdowns and simple motion graphics','Application asks for a résumé and portfolio; the employer says the People team aims to reply within 3 working days','Pay is advertised at ₱50,000–₱65,000 per month. The public application page does not state an applicant fee; do not pay intermediaries'],
  official:'https://people.contenthacker.co/careers/multimedia-artist',
  secondary:'https://people.contenthacker.co/careers',
  secondaryLabel:'Official Content Hacker careers page',
  cta:'Apply on official employer page',
  verified:'2026-11-01'
 },
 {
  id:'welo-ads-quality-rater-filipino',name:'Welo Data — Ads Quality Rater (Filipino, Philippines)',status:'active-ph',badge:'PHILIPPINES • REMOTE • BEGINNER-FRIENDLY ADS RATING',
  summary:'Official freelance work rating online advertisements in Filipino and English. Pay is per task, approximately USD 4/hour rather than a guaranteed hourly wage. Minimum commitment 5 hours/week; up to 20 hours/week if tasks are available.',
  requirements:['Must currently reside in the Philippines and be legally eligible for local freelance work; location is checked during onboarding','Fluent Filipino and strong English, familiarity with search engines and current popular culture','Reliable computer and internet required; this is not advertised as a phone-only role','Self-paced online screening; NDA and service agreement required','Employer explicitly prohibits IP masking or VPN use during its identity checks; do not bypass location checks','Task supply and effective hourly earnings may vary; no application fee is advertised'],
  official:'https://jobs.lever.co/weloglobal/57c971f9-c1da-4aa6-87f2-23b93a9d097d',
  cta:'Apply on official Welo listing',
  verified:'2026-10-25'
 },
 {
  id:'welo-cursa-annotator',name:'Welo Data — Project Cursa Video Annotator (V2)',status:'active-ph',badge:'PHILIPPINES • REMOTE • AI VIDEO',
  summary:'Official remote freelance listing for describing robotic manipulation videos. Advertised pay: USD 3.50 per hour; hours and selection are not guaranteed.',
  requirements:['Philippines is explicitly eligible on the official listing','Strong written English, careful observation and ability to follow structured annotation rules','Prior annotation experience is helpful but not required','Computer and reliable internet are appropriate for this video-labeling work; verify onboarding requirements before accepting'],
  official:'https://jobs.lever.co/weloglobal/c5c69abd-d960-42d6-ba72-0cba79615418',
  cta:'Apply on official Welo listing',
  verified:'2026-10-31'
 },
 {
  id:'welo-cursa-qc',name:'Welo Data — Project Cursa Video Annotation QC (V2)',status:'active-ph',badge:'PHILIPPINES • REMOTE • QUALITY REVIEW',
  summary:'Official remote freelance quality-review role for checking robotics-video annotations and giving specific feedback. Advertised pay: USD $4.03 per hour; hours and selection are not guaranteed.',
  requirements:['Philippines is explicitly eligible on the official listing','Excellent written English, spatial reasoning, detailed checking and constructive feedback required','Prior QC, proofreading or annotation-review experience is useful'],
  official:'https://jobs.lever.co/weloglobal/9bd19b88-42a1-4681-9625-120ea954f16c',
  cta:'Apply on official Welo listing',
  verified:'2026-10-31'
 },
 {
  id:'welo-andromeda-reviewer',name:'Welo Data — Andromeda Delta Audio Transcription Reviewer',status:'active-ph',badge:'PHILIPPINES • REMOTE • AUDIO REVIEW',
  summary:'Official freelance pilot reviewing English audio transcripts and word-level timestamps. Advertised USD 4.55/hour, estimated 30 hours/week; pilot hours, hiring and income are not guaranteed.',
  requirements:['Philippines is explicitly eligible on the official listing','Fluent English, careful listening and comfort correcting word-level timestamps','Prior transcription, audio annotation or speech/NLP labeling experience is preferred','Computer, headphones and stable internet are recommended; confirm onboarding equipment requirements'],
  official:'https://jobs.lever.co/weloglobal/efcc8784-2d7a-4ad7-bc54-1d728c53be9f',
  cta:'Apply on official Welo listing',
  verified:'2026-10-24'
 },
 {
  id:'welo-data-quality-english-ph',name:'Welo Data — AI Data Quality Specialist (English PH)',status:'active-ph',badge:'PHILIPPINES • REMOTE • AI QUALITY',
  summary:'Official freelance role evaluating English AI outputs for sentiment, factual consistency and reasoning. Advertised USD 4.50/hour; selection and task volume are not guaranteed.',
  requirements:['Philippines is explicitly eligible on the official listing','Advanced professional English reading and writing and strong analytical reasoning','Previous data annotation, AI training or related experience required','Familiarity with AI systems is helpful; no guaranteed weekly hours advertised'],
  official:'https://jobs.lever.co/weloglobal/f911d0fb-9ae9-41db-9bcb-b93aa9ac4c54',
  cta:'Apply on official Welo listing',
  verified:'2026-10-24'
 },
 {
  id:'welo-andromeda-adjudicator',name:'Welo Data — Andromeda Delta Audio Transcription Adjudicator',status:'active-ph',badge:'PHILIPPINES • REMOTE • ADVANCED AUDIO QA',
  summary:'Official freelance role resolving disputed US-English audio transcriptions and timestamps. Advertised USD 7.00/hour, estimated 15–20 hours/week; no guaranteed work or income.',
  requirements:['Philippines is explicitly eligible on the official listing','US-English cultural familiarity, excellent listening comprehension and consistent judgment','Prior transcription QA, annotation adjudication or linguistic review experience preferred','Reliable internet, quiet workspace and good headphones required'],
  official:'https://jobs.lever.co/weloglobal/bfadf038-9d98-482e-b245-4def1c370253',
  cta:'Apply on official Welo listing',
  verified:'2026-10-24'
 },
 {
  id:'tsmg-filipino-audio-transcription',name:'TSMG — Filipino Audio Transcription Specialist',status:'active-ph',badge:'PHILIPPINES • REMOTE • BEGINNER-FRIENDLY AUDIO',
  summary:'TSMG officially lists remote Filipino-language audio transcription work, full-time or part-time. Listen to recorded speech and transcribe it according to project guidelines. Pay is NOT disclosed by the employer; do not rely on salary estimates from job aggregators.',
  requirements:['Remote in the Philippines; Filipino and English at approximately B2 proficiency are requested','Strong listening and typing skills, computer access and reliable internet','Previous transcription or annotation experience is helpful but not required','Project volume, compensation, payment structure and start date must be confirmed in the official application; no guaranteed income','Use the employer-hosted Lever job board, not third-party job-board payment or registration links'],
  official:'https://jobs.lever.co/tsmg?location=Remote+in+Philippines',
  cta:'Find Filipino transcription on official TSMG board',
  verified:'2026-10-26'
 },
 {
  id:'tsmg-filipino-transcription-qc',name:'TSMG — Filipino AI Transcription Quality Control',status:'active-ph',badge:'PHILIPPINES • REMOTE • AUDIO QUALITY REVIEW',
  summary:'TSMG currently lists two official remote Philippines application pages for Filipino-language AI transcription quality control. Work includes checking speech transcripts for accuracy, punctuation, capitalization and normalization. The employer does not disclose a pay rate; the application states that payment is based on VALIDATED WORK, not hours worked.',
  requirements:['Remote in the Philippines; excellent written Filipino and attention to detail','Check transcription accuracy against project rules and source audio where required','Basic computer skills and reliable internet; prior transcription, proofreading or QA experience is a plus','Independent-contractor agreement and short-term project work; the official application asks applicants to accept payment based on validated work rather than actual hours','Before accepting, request the per-unit rate, rejection criteria, validation process, payment schedule and project duration in writing; no earnings are guaranteed','Both current official application links are listed because the employer board shows two separate Filipino QC intake entries; confirm which project and terms apply to the application you submit'],
  official:'https://jobs.lever.co/tsmg/cbef245a-5e6e-4204-b2b5-fd9fec71f50c/apply',
  secondary:'https://jobs.lever.co/tsmg?location=Remote+in+Philippines',
  secondaryLabel:'Employer Philippines job board',
  moreLinks:[
   {label:'Alternate current Filipino QC application entry',url:'https://jobs.lever.co/tsmg/9d8fe73c-9431-48cc-b995-226c32806906/apply'}
  ],
  cta:'Open official TSMG application',
  verified:'2026-11-04'
},

 {
  id:'innodata-xconnect-global-ai',name:'Innodata XConnect — Global Remote AI Projects (Country Check)',status:'location-check',badge:'REMOTE • GLOBAL LISTINGS • PH ELIGIBILITY NOT CONFIRMED',
  summary:'Innodata’s official XConnect portal currently advertises ongoing remote/global roles including AI Data Labelling Specialist (displayed rate USD 12) and Content Creator (script-based voice prompt; displayed rate USD 8). The public landing page does not state the rate unit or explicitly name the Philippines for these roles. Treat this as a lead to verify—not confirmed Philippine eligibility or guaranteed work.',
  requirements:['The official portal labels these listings Remote / Global / Ongoing, but its application says the applicant country must be configured for the specific job; confirm that Philippines is selectable before continuing','The landing page displays USD 12 for AI Data Labelling Specialist and USD 8 for the voice-prompt content creator role; the rate unit, pay schedule, volume, duration and exact requirements must be confirmed in the job details or contract before accepting','The application flow requests a résumé and front/left/right face photos for orientation checks; an introduction video is optional. Review the official privacy policy and data-retention terms before consenting','No phone-only workflow is advertised on the landing page; expect computer and reliable internet for data-labeling or content work unless the selected job says otherwise','No application fee is advertised. Apply only through Innodata’s official XConnect domain; never pay a recruiter or share OTPs, passwords or recovery phrases'],
  official:'https://xconnect.innodata.com/GlobalSourcing/index',
  secondary:'https://innodata.com/privacy-policy/',
  secondaryLabel:'Innodata official privacy policy',
  cta:'Browse official XConnect roles',
  verified:'2026-10-31'
 },

 {
  id:'philippine-startup-week-2026',name:'Philippine Startup Week 2026 — Founder & Investor Networking Conference',status:'location-check',badge:'QUEZON CITY • NOVEMBER 9–12, 2026 • STARTUP ECOSYSTEM EVENT',
  summary:'The official Philippine Startup Week 2026 portal lists a four-day startup conference at the M.I.C.E. Center in Quezon City for founders, investors, corporates, academia, media and government, with Discover, Collaborate, Develop, Showcase and Invest tracks. Its official flagship conference IGNITE X is scheduled for November 10 at the same venue and is designed for cross-border founder, investor and corporate networking. These are networking events, not grants, jobs or guaranteed investment awards.',
  requirements:['Official Philippine Startup Week dates: November 9–12, 2026; venue: M.I.C.E. Center, Quezon City','IGNITE X 2026 takes place November 10; registration opens at 8:30 AM and the Luma page says registration is subject to host approval. No attendance fee is displayed on the event page; confirm any fee or participation conditions before travel','IGNITE X is promoted as a flagship PHSW event connecting ASEAN and Japan founders, investors, technology leaders and corporates; networking or investor meetings are not guaranteed','The official IIDB LinkedIn announcement links to the government Startup Philippines pre-registration page. During this check, the page rendered only its header/footer with no visible form; the link may be JavaScript-driven or temporarily unavailable, so confirm registration with the organizer','The published venues are in Quezon City. No virtual-attendance option or travel support was confirmed; do not assume remote participation','Do not confuse the closed Startup World Cup Philippines application (deadline October 30, 2026) with registration to attend IGNITE X or Philippine Startup Week'],
  official:'https://phsw.startup.gov.ph/',
  secondary:'https://startup.gov.ph/phsw-register/',
  secondaryLabel:'Government pre-registration page (form not visible in web verification)',
  moreLinks:[
   {label:'IGNITE X 2026 official event details',url:'https://ignite.ph/'},
   {label:'IGNITE X registration — host approval required',url:'https://luma.com/rdibkjhw'},
   {label:'Official IIDB registration announcement',url:'https://ph.linkedin.com/company/dict-iidb'}
  ],
  cta:'Open official event portal',
  verified:'2026-11-04'
},
 {
  id:'dost-pcieerd-dut-2026',name:'DOST-PCIEERD — Driving Urban Transition (DUT) 2026 Grant',status:'location-check',badge:'PHILIPPINES • INTERNATIONAL RESEARCH CONSORTIUM • DEADLINE NOV 17, 2026',
  summary:'An official open DOST-PCIEERD concept-proposal call under the Driving Urban Transition Partnership. It supports transnational urban research/innovation, not unrestricted startup operating cash. The call allocates up to PHP 25,000,000 for a maximum of three projects over three years (the allocation is for the whole program/project duration, not PHP 25 million per applicant).',
  requirements:['Concept proposal deadline: November 17, 2026 at 5:00 PM Philippine time through the DOST Project Management Information System (DPMISv2). Late submissions are not accepted','Consortium must include at least three partners from three participating countries; at least two partners must be from countries eligible for EC co-funding','Eligible Philippine proponents include Filipino public or private entities with proven competence. Filipino researchers should be connected to public/private universities or colleges, Research and Development Institutes, or qualified startups, especially DOST-supported Technology Business Incubators. The Philippine Principal Investigator must hold at least a relevant master’s degree and provide capability/track-record evidence and institutional endorsement','Projects must address one of the specified topics: (1) innovative maintenance of urban green and blue spaces; (2) positive-energy-district solutions in private housing; or (3) sustainable positive energy districts, energy-system flexibility and integrated technologies','For startup proponents, the call requests authenticated DTI registration or SEC incorporation documents and latest GIS, business permit and licenses, latest income tax returns, audited financial statements and other financial reports, disclosure of other businesses, and required sworn affidavits from owners/officers','Required proposal materials include the DOST proposal form, workplan, agency-head endorsement, Gender and Development score sheet, letter of intent/cooperation and consortium proposal. The official pre-proposal template and submission guidelines are linked below','The call says the grant covers 100% of project cost while the applicant organization must provide at least 15% counterpart funding in cash or kind, except for public-good projects. Confirm the exact budget treatment with DOST-PCIEERD before preparing figures','Capital/infrastructure costs and master’s/PhD student stipends are excluded. Only concept proposals approved in this stage may proceed to full proposals, scheduled February 2027 to April 15, 2027','This is a demanding R&D consortium opportunity. A normal software or AI startup is not eligible unless its project genuinely fits the urban-transition topics and it can meet the Filipino-PI, institutional, consortium and counterpart requirements'],
  official:'https://pcieerd.dost.gov.ph/work-with-us/2026-dost-pcieerd-dut-call-for-proposal-concept-proposal/',
  secondary:'https://pcieerd.dost.gov.ph/wp-content/uploads/2026/09/DUT-Call-2026_Preproposal-template.docx',
  secondaryLabel:'Official pre-proposal template',
  tertiary:'https://dpmisv2.dost.gov.ph/',
  tertiaryLabel:'DOST e-Proposal portal',
  cta:'Review official grant and eligibility',
  verified:'2026-11-02'
 },
 {
  id:'bettergovph-fellowship-2026',name:'BetterGovPH Fellowship — Civic Technology Pilot Cohort',status:'active-ph',badge:'PHILIPPINES • APPLICATION DEADLINE NOV 17, 2026 • ₱450K SHARED PROJECT FUND',
  summary:'A three-month civic-technology fellowship jointly organized by BetterGovPH, WeSolve Foundation, the Philippine Open Government Partnership and the Department of Budget and Management, with partner agencies and civil-society groups. BetterGovPH states that the fellowship website is not an official government website; this is a partner-run fellowship, not a DICT/DBM government grant call. Individuals, teams, organizations and informal groups can apply. The official page lists a gross ₱450,000 funding pool shared among selected fellows/projects according to approved budgets; the fund is still being raised, the amount per team is not guaranteed, and this is not employment.',
  requirements:['Application deadline: November 17, 2026. Pilot cohort runs December 2026–March 2027, with weekly sprints, mentorship, technical consultations, government engagement and Demo Day','Eligible applicants include civic-technology developers, software engineers, data scientists/analysts, product designers/UX specialists, open-data practitioners, researchers, technologists, student developers/academic teams, civic-tech organizations and volunteer groups','Apply as an individual, team, existing organization or informal group. Applicants must demonstrate they can commit time and effort throughout the fellowship period','Selected fellows must deliver a working civic-tech solution, platform enhancement, data tool, dashboard or API service; provide technical/data-schema documentation, source repository and deployment instructions; and participate in the program','Projects address public challenges such as e-government, open data/FOI, budget and procurement, education, infrastructure monitoring, health, energy, gender and development, local-government transparency and accountability','Gross funding pool is PHP 450,000 shared among selected fellows, teams and/or team members based on approved project budgets. Funding is subject to taxes/deductions, does not constitute employment, and the official page says the organizers are still raising the fellowship fund; do not assume a guaranteed stipend or award','Outputs are encouraged to be released under open licenses. If applying with an existing commercial product, clarify IP and licensing terms first and submit only a separately scoped public-interest component you are willing to license as required','The official page links to the application form and guidelines. Do not pay intermediaries or anyone promising selection or a guaranteed share of the pool'],
  official:'https://fellowship.bettergov.ph/',
  secondary:'https://docs.google.com/presentation/d/1aQ9yRlwcRfA15OIKaje5XHaPI1-af0fJ85dP313qvUs/htmlpresent',
  secondaryLabel:'Official fellowship guidelines',
  cta:'Apply through official BetterGovPH page',
  verified:'2026-11-02'
 },
 {
  id:'ndc-svf',name:'NDC — Startup Venture Fund (equity investment)',status:'location-check',badge:'PHILIPPINES • REGISTERED STARTUPS • EQUITY, NOT A GRANT',
  summary:'The Philippine National Development Company currently provides an official Startup Venture Fund application form. SVF invests in eligible innovative startups from seed through Series B; it is EQUITY FINANCING, not free grant money, and investment is not guaranteed. No fixed award amount or 2026 deadline is shown on the official application.',
  requirements:['Startup must be based and SEC-registered in the Philippines, with an existing minimum viable product, working service or validated business model','At least one year of operating history; no pending accountability to government agencies; disclose government funding received','A co-investment partner is needed before investment; NDC may help find a match but cannot invest alone or lead','Application requests pitch deck, 3–7 minute product demo, SEC documents, business permit, financial statements, monthly 3-year projections and capitalization data','Read equity/dilution and legal terms before applying; this is not the separate DICT/IIDB Startup Grant Fund','Official online intake was accessible October 27, 2026; screening, due diligence and investment approval still apply'],
  official:'https://www.ndc.gov.ph/svf-startup-application/',
  secondary:'https://www.ndc.gov.ph/svf/',
  secondaryLabel:'Official eligibility and investment terms',
  cta:'Review official SVF application',
  verified:'2026-10-27'
 },

 {
  id:'dost-tapi-evfp-2025',name:'DOST-TAPI — Expanded Venture Financing Program (EVFP)',status:'location-check',badge:'PHILIPPINE TECHNOLOGY STARTUPS • UP TO ₱500K GRANT + ₱4.5M ZERO-INTEREST LOAN • INTAKE TO CONFIRM',
  summary:'DOST-TAPI’s revised 2025 implementing guidelines establish a financing pathway for eligible technology-based startups and spin-offs. Assistance may include up to ₱500,000 as a grant for pre-operating expenses and up to ₱4.5 million in working-capital financing at 0% interest, but the working-capital portion is fully repayable. No current application deadline or live application form was verified; treat this as a program to qualify for and confirm with DOST-TAPI, not an automatically open grant call.',
  requirements:['Applicant must be a technology-based corporation at least 60% owned and controlled by Filipino citizens','Eligible company types include DOST Startup Grant Fund graduates, TECHNiCOM graduates, DOST-RDI or DOST-funded/supported SUC/HEI spin-offs, and innovative startups that own the technology being commercialized','The company must own the technology and hold an active IPOPHL IP registration or active IP application; previously DOST-TAPI-assisted projects must be fully liquidated with no outstanding financial obligations','The guidelines provide up to ₱500,000 as a grant for pre-operating expenses and up to ₱4.5 million for working capital; the latter is fully refundable at 0% interest, with repayment terms not exceeding five years after release','A counterpart contribution of at least 30% of total project cost is required; the financed technology/project is collateral, and other collateral may be required if the company cannot use it','This is not a pure grant or free money: the working-capital financing must be repaid. Review the official guidelines carefully before taking on debt','No current deadline or working application portal was confirmed. The older DOST-TAPI program-forms route currently returns 404; contact DOST-TAPI at info@tapi.dost.gov.ph to request the current intake status and forms before sending documents'],
  official:'https://tapi.dost.gov.ph/',
  secondary:'https://naro.law.upd.edu.ph/issuances/7817',
  secondaryLabel:'UP Law Center NARO — registered DOST-TAPI AO 004, s.2025 guidelines',
  tertiary:'https://www.dost.gov.ph/knowledge-resources/news/4420-brunei-ph-partnership-deal-a-boon-for-filipino-startups-innovators-reach-asean-markets-dost-tapi.html',
  tertiaryLabel:'DOST official 2026 update confirming active TAPI startup support programs',
  cta:'Check current DOST-TAPI intake and request forms',
  verified:'2026-11-01'
 },
 {
  id:'sbcorp-youth-enterprise-fund-2026',name:'Small Business Corporation — Youth Enterprise Fund',status:'active-ph',badge:'FILIPINO ENTREPRENEURS AGED 18–30 • NON-COLLATERALIZED LOAN UP TO ₱500K • 1%/MONTH',
  summary:'Small Business Corporation currently lists the Youth Enterprise Fund as a non-collateralized loan for Filipino youth entrepreneurs aged 18–30. The official program page states a loan ceiling of ₱500,000, monthly repayment up to three years and interest of 1% per month on a diminishing balance. This is a repayable loan, not a grant.',
  requirements:['Applicant must be a Filipino youth entrepreneur aged 18–30; Philippine permanent residency alone does not meet the Filipino-citizen requirement','Loan amount up to ₱500,000; non-collateralized; payable monthly for up to three years; current official SB Corp page lists 1% monthly interest on a diminishing balance','Requirements listed by SB Corp: government-issued ID, Mayor’s/Business Permit, proof of bank account, DTI registration for sole proprietors, and corporate documents where applicable','A business plan is optional for businesses operating for at least one year; confirm whether a newer intake checklist applies to your business type','The current official SB Corp page does not list a one-year grace period. An older July 2026 news report described one, so do not assume a grace period unless SB Corp confirms it in writing','The current official page lists the program and directs applicants to the SBCorp Money portal; no closing date is published. Review the full cost and repayment schedule before borrowing'],
  official:'https://sbcorp.gov.ph/programs-and-services/',
  secondary:'https://app.sbcorp.ph/',
  secondaryLabel:'Official SBCorp Money application portal',
  cta:'Review current terms and apply through SBCorp Money',
  verified:'2026-11-01'
 },
 {
  id:'cdobites-cohort10',name:'USTP-CDO CDObites — Cohort 10 Incubation & Grant Access',status:'location-check',badge:'NORTHERN MINDANAO • HYBRID • FREE APPLICATION • DEADLINE DEC 30, 2026',
  summary:'The USTP-CDO Technology Business Incubator’s official site advertises Cohort 10 for 20 startups, with a December 30, 2026 deadline and hybrid delivery. Its headline says “get up to ₱5M in startup grants”; the benefits section describes access to ₱5M+ in grant and funding programs. This is a competitive funding pathway, not a guaranteed ₱5M award to each applicant.',
  requirements:['The official page welcomes early-stage startups, MSMEs, aspiring entrepreneurs with a validated business idea, students, faculty, researchers, alumni and committed teams','Program delivery is hybrid and based at USTP-CDO in Cagayan de Oro. No nationwide residency rule is published, but applicants outside Northern Mindanao should confirm travel, participation and eligibility before applying','The site advertises mentorship, free IP support, free business-registration assistance, prototyping access, ecosystem connections and 0% equity','The official page labels the application “Apply Now — It’s Free”; do not pay intermediaries or anyone promising guaranteed admission or grants','Grant access is competitive; no per-startup award, guaranteed amount or detailed disbursement terms are published. Do not treat the ₱5M headline as guaranteed income'],
  official:'https://cdobites.com/incubate/apply?cohort=cdobites-cohort-10',
  secondary:'https://cdobites.com/',
  secondaryLabel:'Official CDObites TBI program page',
  cta:'Open official Cohort 10 application',
  verified:'2026-11-01'
 },
 {
  id:'circulab-cohort-2',name:'Upgrade Innolab — Circulab Acceleration Program Cohort 2',status:'location-check',badge:'MINDANAO ONLY • EQUITY-FREE GRANT UP TO €19,445 • DEADLINE DEC 31, 2026',
  summary:'Upgrade Innolab’s official call invites circular-economy ventures actively operating in Mindanao to apply for Cohort 2. The program advertises a non-repayable grant of up to €19,445 (approximately ₱1.3 million) for MVP validation, R&D, go-to-market work, field testing and market expansion. Applications run September 28–December 31, 2026.',
  requirements:['Applicant must be a DTI- or SEC-registered business entity with a valid Mayor’s Permit and BIR registration','The venture must be registered and actively operating in Mindanao: Regions 10, 11, 12, 13 or BARMM. Ventures operating only in Luzon or the Visayas are not eligible; expanding only to qualify is prohibited','Must have a validated MVP, identified target customers and at least one full-time founder actively leading operations','Must demonstrate direct application of 2–3 principles from the 10Rs circular-economy framework: refuse, rethink, reduce, reuse, repair, refurbish, remanufacture, repurpose, recycle or recover','Submission requires a formal cover letter, Work and Financial Plans (Annex B), pitch deck (Annex C) and statutory business registration permits through the official submission form','Regional information sessions and writeshops run October 27–December 2, 2026; screening and pitching are scheduled January 4–February 19, 2027; final selection is scheduled February 24, 2027','Grant is competitive and up to €19,445, not guaranteed. Confirm all terms and documents on the official call page before applying'],
  official:'https://upgradeinnolab.com/2026/10/upgrade-innolab-opens-call-for-proposals/',
  secondary:'https://forms.gle/9rC52fFVmzrjSaq8A',
  secondaryLabel:'Official Circulab submission form',
  cta:'Review official grant call',
  verified:'2026-11-01'
 },
 {
  id:'dost-pcieerd-hrdp-2027-closed',name:'DOST-PCIEERD — HRDP 2027 Funding Call (Closed)',status:'closed',badge:'CLOSED • OCTOBER 31, 2026 AT 5:00 PM PH TIME',
  summary:'The official DOST-PCIEERD Human Resources Development Program call for 2027 funding closed on October 31, 2026 at 5:00 PM Philippine time. This is research-capability support for eligible Filipino researchers, students, academic/research institutions and project personnel—not a general startup grant. The deadline has passed; this listing is retained only as a closure record and guide for future cycles.',
  requirements:['The official submission window was October 1–31, 2026 through DOST’s e-Proposal portal. Do not submit to this expired call','Components included research dissemination, visiting experts, research attachments, RIEETOOL training, PROSPPER graduate support for personnel on PCIEERD-funded projects, and DOST Facilities and Laboratory Access Grant (FLAG)','Eligibility depends on the component and a connection to qualifying Filipino academic/research institutions, DOST-funded projects, or PCIEERD priority sectors including AI, semiconductors, synthetic biology, marine/maritime, quantum and nuclear science and technology','The call required the DOST GIA Form 4.B Non-R&D proposal, endorsement from the authorized institutional head and component-specific supporting documents through DPMIS','The DOST FLAG component described an outright research subsidy of up to PHP 250,000 for eligible testing and analysis fees at identified DOST or DOST-funded facilities; this is not unrestricted cash for a startup','Check the official PCIEERD call page for any future cycle; no late applications are accepted'],
  official:'https://pcieerd.dost.gov.ph/work-with-us/dost-pcieerd-human-resources-development-program-hrdp-for-2027-funding-cfp/',
  secondary:'https://dpmisv2.dost.gov.ph/',
  secondaryLabel:'Official DOST e-Proposal portal (this call is closed)',
  cta:'Review closed call and future-cycle details',
  verified:'2026-10-31'
 },
 {
  id:'swc-ph-2026',name:'Startup World Cup Philippines Regional 2026 — Pitch Competition',status:'closed',badge:'PHILIPPINE STARTUPS • APPLICATION DEADLINE PASSED OCT 30, 2026 • LINK MISMATCH',
  summary:'The official Philippines competition page lists October 30, 2026 as the submission deadline. As of October 31 Philippine time, that deadline has passed, so this is no longer an active application opportunity unless the organizer formally reopens it. The official Apply button still routes to a page headed MAURITIUS REGIONAL COMPETITION. Do not submit Philippine company information through that mismatched form.',
  requirements:['Applications are treated as closed after the official October 30, 2026 deadline; the event page lists finalist notification on November 3 and the regional finale on November 10, 2026','The event page’s Apply button points to /copy-of-mauritius-app, whose heading explicitly says Mauritius Regional Competition; this is a confirmed routing mismatch','The global competition advertises a US$1 million investment prize, but that is not a guaranteed grant, regional cash award or paid job','Keep this listing for event tracking only; reactivate it only if the official Philippines organizer publishes a corrected route or reopening notice','Do not pay an unverified application fee or send confidential pitch materials through the mismatched form'],
  official:'https://www.startupworldcup.io/philippines-2026',
  secondary:'https://ignite.ph/swc',
  secondaryLabel:'Philippine organizer updates',
  cta:'View event status and finale details',
  verified:'2026-10-31'
 },
 {
  id:'aniani',name:'AniAni — Household Video Tasks (Android pilot)',status:'location-check',badge:'METRO MANILA ONLY • ANDROID PILOT',
  summary:'The operator advertises paid first-person household-task recordings. Advertised ₱150 per approved hour, up to ₱200 for boosted tasks as shown on the operator website October 27, 2026; actual payment track record has NOT been independently verified.',
  requirements:['Currently onboarding in Metro Manila only; not a nationwide or iPhone opportunity','Android app available on Google Play; iOS listed as coming soon','Operator says free signup, free head strap after approved practice task, Friday GCash payments at ₱100 minimum','Google Play listing updated October 21, 2026; its data disclosures include photo/video/audio sharing','Operator website displays no actual contributor payout receipts yet; treat this as an unproven pilot','Never record children, private conversations, IDs, financial details or anyone without consent; do not pay a fee'],
  official:'https://aniani.app/',
  secondary:'https://play.google.com/store/apps/details?id=app.aniani.aniani_app',
  secondaryLabel:'Official Google Play app',
  cta:'Review operator claims and eligibility',
  verified:'2026-10-27'
 },

 {
  id:'playtestcloud-ph-global',name:'PlaytestCloud — Mobile Game & App Playtesting',status:'active-ph',badge:'GLOBAL PANEL • PHILIPPINES CAN JOIN • FEWER INVITES',
  summary:'PlaytestCloud’s official tester FAQ says people outside the USA, UK and Canada can join its panel from anywhere in the world, including the Philippines, but they should expect fewer invitations. This is occasional paid game/app testing and research, not employment or dependable income.',
  requirements:['The official iPhone/iPad app is free to download in the Philippines App Store, and the Android app is free on Google Play. Initial playtester onboarding is unpaid; no joining fee is listed on the official app pages, so never pay a third party for access or invitations','A typical 15-minute playtest plus survey generally pays USD $5–$9; the exact one-time reward is stated in each invitation. Payment requires completing the full test well','Android: Android 10 or newer; excluded devices include Amazon Fire tablets, Android Go, Samsung Galaxy A15 and Motorola G devices. iPhone/iPad: iOS 16 or newer; iPhone 8 or newer. Headphones/earphones and Wi-Fi are required','Rewards are issued through Tremendous; available options depend on country and may include PayPal, virtual cards or gift cards. No minimum payout threshold; payment is generally sent within 3 days after a well-completed test','Tremendous currently charges a 6% processing fee on PayPal rewards; virtual cards and gift cards have no Tremendous processing fee. Check which options are actually available in the Philippines before redeeming','Playtests may record your screen and voice. Turn on Do Not Disturb, keep private messages and personal information off-screen, follow the NDA, and never make real in-game purchases unless the test explicitly supplies safe test credentials','The official FAQ says international players can register but receive fewer invites than players in the USA, UK and Canada; task volume is not guaranteed'],
  official:'https://players.playtestcloud.com/article/138-can-i-become-a-playtester-if-im-not-from-the-usa-uk-or-canada',
  secondary:'https://apps.apple.com/ph/app/playtestcloud-be-a-playtester/id6443780122',
  secondaryLabel:'Official iPhone/iPad app',
  tertiary:'https://play.google.com/store/apps/details?id=com.playtestcloud.tester',
  tertiaryLabel:'Official Android app',
  cta:'Join official tester panel',
  verified:'2026-10-31'
 },
 {
  id:'worldsight-phone-data-collection',name:'WorldSight — Phone Motion-Data Tasks (Country & Payout Check)',status:'location-check',badge:'ANDROID LISTING LIVE • IOS LINK 404 • PHILIPPINES PAYOUT UNCONFIRMED',
  summary:'WorldSight advertises paid everyday motion-data recordings using a phone, but its official site says it is live in five unnamed countries. Its linked Google Play listing is available, while the official App Store link currently returns 404. Philippine task and payout access are not verified. The official FAQ also says U.S. persons are not supported for payout, so this is not currently suitable for U.S. citizens even if they live in the Philippines.',
  requirements:['Android app is listed on Google Play and the store page says 18+; the official website’s App Store link currently returns 404, so iPhone availability is not verified','Phone tasks include cooking, household chores, commuting and light fieldwork; no special camera is required, but a head strap is recommended','Official FAQ states 100 points = USD $1 and a minimum withdrawal of 500 points (about USD $5); only approved or partially approved clips earn rewards','Payout setup is inconsistent across official materials: the FAQ says a W-8BEN is required and U.S. persons are not supported, while the Google Play listing says Stripe Connect payouts require identity verification. Confirm the current process and country support before recording','The official site lists Stripe, Wise and Crossmint as payout options, but does not confirm which works in the Philippines','Before upload, contributors accept a data-ownership agreement; anonymized videos become WorldSight data. Faces, plates and on-screen text are obscured and audio removed; deleting an account does not remove already uploaded anonymized clips','The five live countries are not named and Philippine payout access is unconfirmed. U.S. citizens/persons are ineligible under the current FAQ. Do not submit personal footage unless your country, tax status and payout method are explicitly supported'],
  official:'https://www.worldsight.ai/',
  secondary:'https://play.google.com/store/apps/details?id=com.anaxilabs.worldsight',
  secondaryLabel:'Google Play listing (Android)',
  cta:'Check official country and payout eligibility',
  verified:'2026-11-01'
 },
 {
  id:'userlytics-ph-usability',name:'Userlytics — Paid Website & App Usability Tests',status:'active-ph',badge:'PHILIPPINES • PAYPAL • DESKTOP & MOBILE STUDIES',
  summary:'Userlytics accepts testers in countries where PayPal can receive payments; PayPal’s official country feature list includes the Philippines. Its official tester page advertises USD $10–$50 per study, with the reward shown before a test begins. Typical tests take about 20–40 minutes, but invitations are limited and selected randomly; no test volume or income is guaranteed.',
  requirements:['Free tester registration; Philippines eligibility depends on maintaining a working PayPal account able to receive payments','The official Userlytics page advertises USD $10–$50 per study; actual reward depends on the specific invitation and is shown before starting','Tests may require a Windows or Mac computer, high-speed internet, headphones, microphone and sometimes webcam; selected studies can use iOS or Android phones','Approved-test payments are made every 15 days; the September 2026 tester terms allow up to 30 days after full completion','Important privacy/rights warning: tests may record your screen, voice and face; the current terms allow use of generated data to train/improve AI and assign copyright in recordings and test content to Userlytics. Read the terms before joining','No application fee. Never provide passwords, card details or government ID during a test unless the official study explicitly requires a legitimate and necessary verification step'],
  official:'https://www.userlytics.com/user-experience-research/paid-ux-testing/',
  secondary:'https://www.userlytics.com/user-experience-research/legal-resources/terms-of-service-testers/',
  secondaryLabel:'Official tester terms and privacy conditions',
  cta:'Join official tester program',
  verified:'2026-10-31'
 },
 {
  id:'gcash-quick-rewards-hustle-ph',name:'GCash Quick Rewards by Hustle PH — Surveys & Digital Tasks',status:'active-ph',badge:'PHILIPPINES • GCASH • SURVEYS + TASKS • 18+',
  summary:'GCash’s official Help Center confirms that Quick Rewards by Hustle PH offers surveys and digital missions inside the GCash app. It is a legitimate Philippines-specific supplementary-rewards route, not employment or guaranteed income. Mission availability, reward values and extra qualifications vary.',
  requirements:['Must be at least 18 and have a Fully Verified GCash account','For foreign nationals residing in the Philippines, GCash lists a Philippine SIM and an accepted resident ID for verification; accepted examples include ACR, SRRV, Philippine driver’s license, DFA Diplomat ID or DOLE Alien Employment Permit. A foreign passport alone is not listed for the resident-with-PH-SIM category; confirm your exact documents with GCash before relying on this opportunity','Open GCash → View All → Earn Money → Quick Rewards; choose a mission and read its steps, deadline and qualification rules before starting','Hustle PH reviews completed missions in approximately 5–7 working days. After a successful withdrawal confirmation, GCash says funds should reach the wallet within 24–48 hours','The official Help Center article does not publish a universal pay rate or minimum cash-out amount; rely only on the reward and withdrawal details displayed in the live app','Some missions have additional eligibility requirements; not every user will see or qualify for every task','No fee is required by the official guide. Never pay anyone to unlock missions, and never share your GCash MPIN, OTP, password or recovery codes; report suspicious messages through official GCash support'],
  official:'https://help.gcash.com/hc/en-us/articles/40213432323481-What-is-Quick-Rewards-by-Hustle-PH',
  secondary:'https://new.gcash.com/',
  secondaryLabel:'Official GCash website',
  tertiary:'https://help.gcash.com/hc/en-us/articles/900000948786-Accepted-IDs-for-GCash-verification',
  tertiaryLabel:'GCash accepted IDs, including foreign residents with PH SIM',
  cta:'Open official Quick Rewards guide',
  verified:'2026-11-03'
 },
 {
  id:'toluna-ph-surveys',name:'Toluna Influencers — Philippines Surveys & Rewards',status:'active-ph',badge:'PHILIPPINES • FREE JOIN • ANDROID & IPHONE',
  summary:'Toluna’s official Philippines site offers free survey and opinion-panel membership. Members earn points for eligible surveys and other activities, then redeem rewards from the Philippines-specific catalogue. It is supplemental pocket money, not a job or guaranteed income; survey invitations and qualification vary.',
  requirements:['Free registration on the Philippines-specific Toluna site; the official PH FAQ says signup and participation are free','The PH FAQ says a new member receives 500 welcome points and that survey rewards vary widely by length and eligibility; points are not cash and no fixed hourly rate is promised','The available reward catalogue depends on country and may include vouchers or cash options; inspect the actual PH Rewards Centre before spending time on surveys','Points expire 16 months after earning them; some survey points may take up to six weeks after a survey closes to post','Available on iPhone and Android through the official Toluna Influencers apps; use only the official developer listings','Screen-outs may receive no points. Do not pay a registration or withdrawal fee, and never share OTPs or passwords'],
  official:'https://www.toluna.com/en-PH/',
  secondary:'https://apps.apple.com/ph/app/toluna-influencers/id1473731257',
  secondaryLabel:'Official iPhone app',tertiary:'https://play.google.com/store/apps/details?id=com.toluna.webservice',tertiaryLabel:'Official Android app',
  cta:'Join Toluna Philippines',
  verified:'2026-10-31'
 },
 {
  id:'yougov-ph-panel',name:'YouGov — Philippines Paid Survey Panel',status:'active-ph',badge:'PHILIPPINES • FREE JOIN • ANDROID & IPHONE',
  summary:'YouGov operates a Philippines panel where members earn points for surveys and other research activity, then redeem rewards from their account’s country-specific YouGov Wallet. The official Philippines join page is live and the official iPhone and Android apps are available. Survey frequency and reward thresholds vary; this is not guaranteed income.',
  requirements:['Join through the official Philippines panel; complete the introductory survey and keep your profile accurate to receive relevant invitations','Points are awarded according to survey length and complexity; the official reward threshold and available payout choices are shown in the Philippines account, not guaranteed at a universal rate','Official iPhone app is listed in the Philippines App Store; official Android app is published by YouGov PLC on Google Play','Survey invitations vary and may be infrequent; no fixed number of surveys or earnings is promised','Review the YouGov Pulse feature and its Accessibility/data-transmission permissions before enabling it; check the current privacy settings and consent details','No joining fee. Ignore third-party messages asking for deposits, OTPs or account passwords'],
  official:'https://account.yougov.com/ph-fil/join/main',
  secondary:'https://apps.apple.com/ph/app/yougov/id1154082222',
  secondaryLabel:'Official iPhone app',tertiary:'https://play.google.com/store/apps/details?id=com.yougov.mobile.online',tertiaryLabel:'Official Android app',
  cta:'Join official Philippines panel',
  verified:'2026-10-31'
 },
 {
  id:'google-opinion-rewards-ph',name:'Google Opinion Rewards — Not Available in the Philippines',status:'waitlist',badge:'PHILIPPINES NOT ON CURRENT ANDROID COUNTRY LIST',
  summary:'Google’s current official Android availability list does not include the Philippines. The official page also says only users in supported countries who are over 18 are eligible for surveys. Do not install unofficial APKs, change your account country falsely or use a VPN to bypass eligibility.',
  requirements:['Philippines is absent from Google’s official Android country list as checked October 31, 2026','The cited official availability page lists Android countries only; it does not establish Philippine iPhone availability','Google Opinion Rewards uses the country associated with the Google Account to determine eligibility and reward currency; do not misrepresent residence','Recheck the official country list if Google adds the Philippines later'],
  official:'https://support.google.com/opinionrewards/answer/6322274?hl=en',
  cta:'Check Google’s official country list',
  verified:'2026-10-31'
 },
 {
  id:'outlier',name:'Outlier',status:'location-check',badge:'PHILIPPINES ALLOWED • PROJECT-SPECIFIC',
  summary:'Outlier’s official flexible-working guidelines (effective July 15, 2026) explicitly include the Philippines as a permitted country, but each paid AI-training project may impose narrower location and skill restrictions. A permitted country does NOT guarantee an open project or earnings.',
  requirements:['The Philippines appears on Outlier’s official permitted-country list; verify the exact role before applying','Identity and actual work location may be checked during onboarding; update your primary location if you relocate','Do not mask your actual location with a VPN or claim another country to bypass project restrictions','Project availability, skills, screening, pay and task volume vary'],
  official:'https://app.outlier.ai/opportunities?hl=en-US',
  secondary:'https://outlier.ai/legal/flexible-working-guidelines',
  secondaryLabel:'Official permitted-country and location policy',
  cta:'Check live opportunities',
  verified:'2026-10-26'
 },
 {
  id:'user-interviews-ph',name:'User Interviews — Paid Research Studies',status:'waitlist',badge:'PHILIPPINES NOT CURRENTLY SUPPORTED',
  summary:'The official participant-support country list, updated October 5, 2026, does not include the Philippines. Do not expect to qualify for studies while residing in the Philippines unless the company updates its country list.',
  requirements:['The Philippines is absent from the current supported-country list','The company says people in countries not listed cannot yet participate; recheck the official list before applying','Eligibility follows supported-country rules; do not use a false address or VPN to bypass location restrictions'],
  official:'https://support.userinterviews.com/hc/en-us/articles/51535822654099-Countries-where-you-can-participate-in-studies',
  cta:'Check official country eligibility',
  verified:'2026-10-29'
 },

  {
  id:'prolific',name:'Prolific',status:'waitlist',badge:'NOT CURRENTLY PH-SUPPORTED',
  summary:'Paid studies and AI-task work are legitimate opportunities, but Prolific’s current participant-country list does not include the Philippines. Eligibility is based on where you currently live, not citizenship.',
  requirements:['Philippines residence is not currently on the supported participant-country list','A waitlist may be available, but access is not guaranteed','If residency changes, re-check the official current-country list before applying'],
  official:'https://www.prolific.com/participants-join-us',
  cta:'View official participant information',
  verified:'2026-09-25'
 },
 {
  id:'alignerr-ai-training-specialist',name:'Alignerr — AI Training, Data Labeling & Evaluation Roles',status:'active-ph',badge:'PHILIPPINES-LISTED ROLES • REMOTE CONTRACT • USD $40–$120/HR ADVERTISED',
  summary:'Alignerr has an employer-posted Philippines Data Labeling Specialist listing and additional Philippines LinkedIn postings for several remote AI-evaluation roles. Its official job pages advertise USD $40–$120/hour, 10–40 hours/week and weekly payouts. The headline range is not a guaranteed rate or workload: actual pay, project matching, paid hours and availability depend on skills and the assignment. Some linked official pages are labeled Remote/General rather than Philippines-specific, so confirm that the project accepts a Philippines-based contractor before completing assessments.',
  requirements:['The Data Labeling Specialist has a Philippines-specific employer LinkedIn listing. Additional Philippines postings have been found for Film Scene Description Specialist, Audio Quality Reviewer, Document Review Specialist, Social Media Content Evaluator and AI Data Quality Analyst; their official job pages say Remote/General, so confirm country eligibility at application','The employer advertises USD $40–$120/hour, 10–40 hours/week and weekly payouts on its official pages; this is a posted range, not a promise of the maximum rate, paid hours or continuing assignments','Several roles require no prior AI experience. Skills vary: careful visual observation and structured writing for film scenes; headphones and attentive listening for audio review; strong reading comprehension for document review; current social-media knowledge for content evaluation; and analytical English writing for AI quality review','Work is remote contract work using web-based tools. A reliable computer, internet connection and ability to follow detailed guidelines are expected; the audio role specifically asks for headphones or earbuds','Ask the official recruiter to confirm the actual project rate, whether screening/training is paid, payment terms, contractor eligibility from the Philippines and current task volume before accepting','Apply only through the official Alignerr job pages or the employer’s verified LinkedIn postings. Never pay an application, screening, training, equipment or release fee; never send passwords, OTPs or crypto recovery phrases'],
  examples:['Data Labeling Specialist — text, image and audio classification (Philippines-specific LinkedIn listing)','Film Scene Description Specialist — structured descriptions of camera movement, framing, blocking, pacing and mood','Audio Quality Reviewer — listen for clarity, distortion, pronunciation and transcript accuracy','Document Review Specialist — classify and extract structured information from documents','Social Media Content Evaluator — assess AI-generated posts for tone, relevance and cultural fit','AI Data Quality Analyst — evaluate AI outputs for accuracy, relevance and consistency'],
  official:'https://www.alignerr.com/jobs/65cbb1b3-c9b7-423c-bae0-31cc2e9d56c6',
  secondary:'https://ph.linkedin.com/jobs/view/data-labeling-specialist-at-alignerr-4477616131',
  secondaryLabel:'Employer LinkedIn listing — Philippines',
  moreLinks:[
   {label:'Film Scene Description Specialist — official role',url:'https://www.alignerr.com/jobs/3e485d8d-c344-4ff7-81df-32aa94e3b239'},
   {label:'Audio Quality Reviewer — official role',url:'https://www.alignerr.com/jobs/d6719c38-9661-4832-8e33-acc9ecab784d'},
   {label:'Document Review Specialist — official role',url:'https://www.alignerr.com/jobs/6b997e72-0b4d-42ca-87a9-1e6429339379'},
   {label:'Social Media Content Evaluator — official role',url:'https://www.alignerr.com/jobs/7bd5c2d0-2ca2-48b1-8464-cf88618a3036'},
   {label:'AI Data Quality Analyst — official role',url:'https://www.alignerr.com/jobs/a4e5f9ee-7041-41c3-ae66-85587cbe42e0'}
  ],
  cta:'Apply through official Alignerr job page',
  verified:'2026-11-01'
 },
 {
  id:'alignerr-video-annotation-specialist',name:'Alignerr — Video Annotation Specialist',status:'active-ph',badge:'PHILIPPINES • REMOTE CONTRACT • USD $40–$120/HR ADVERTISED',
  summary:'A new Philippines LinkedIn listing for Alignerr’s fully remote Video Annotation Specialist contract. Alignerr’s official job page advertises USD $40–$120/hour, 10–40 hours per week and weekly payouts. Actual pay depends on skills and experience, and project hours or task availability are not guaranteed. Work includes segmenting video scenes and labeling camera angles, shot sizes, movement and on-screen action. No professional video-production or AI background is required.',
  requirements:['The employer’s LinkedIn listing identifies the Philippines; the role is fully remote and hourly contract-based','The employer advertises 10–40 hours per week, but actual hours, assignment volume and continuation depend on project availability','No professional video-production, film or AI experience is required; strong visual attention, patience, consistency and careful instruction-following are essential','Work includes breaking videos into shots/scenes, tagging camera angles, shot sizes, movement and on-screen action, and flagging ambiguous transitions','Alignerr advertises USD $40–$120/hour and weekly payouts; the actual rate is determined by skills and experience. Confirm the specific rate, project, payout terms and available hours with the official recruiter before accepting','Apply only through Alignerr’s official job page or its Philippines LinkedIn listing. Never pay a screening, equipment, training or release fee'],
  official:'https://www.alignerr.com/jobs/835c8afa-2f2a-4878-af32-78f102b1c513',
  secondary:'https://ph.linkedin.com/jobs/view/video-annotation-specialist-at-alignerr-4484297905',
  secondaryLabel:'Alignerr Philippines LinkedIn listing',
  cta:'Apply through official Alignerr job page',
  verified:'2026-11-01'
 },

 {
  id:'alignerr-english-audio-transcription-specialist',name:'Alignerr — English Audio Transcription Specialist (Manila)',status:'active-ph',badge:'PHILIPPINES • REMOTE FREELANCE • USD 10–35/HR ADVERTISED • 10–40 HRS/WK',
  summary:'Alignerr’s official Manila listing describes a fully remote, flexible hourly contract transcribing English audio for AI training. It states that no prior transcription or AI experience is required and advertises USD 10–35/hour, 10–40 hours/week and weekly payouts. These are advertised terms, not guaranteed work, paid hours or a guaranteed rate.',
  requirements:['The official role is specifically written for Manila/Philippines talent and describes fully remote freelance contract work','Strong English listening comprehension, clear written English, careful spelling and punctuation, and the ability to follow detailed transcription rules are required','Work includes verbatim transcription of conversations, interviews, lectures, podcasts and customer interactions; capture fillers and speaker changes and flag unclear or inaudible segments','No prior transcription, AI or technical experience is required; transcription, captioning, BPO audio work and fast accurate typing are helpful but not mandatory','The official page advertises USD 10–35/hour, 10–40 hours/week and weekly payouts. Confirm the actual project rate, paid hours, assessment/training terms and payout method; assignments and income are not guaranteed','Apply only through the official Alignerr page. Never pay an application, screening, training, equipment or release fee; never share passwords, OTPs or crypto recovery phrases'],
  official:'https://www.alignerr.com/en/jobs/9a4a33ed-d48b-44ab-a415-496a2a128fdb',
  cta:'Apply on official Alignerr page',
  verified:'2026-11-02'
 },
 {
  id:'alignerr-customer-support-task-author',name:'Alignerr — Customer Support Task Author (AI Training)',status:'active-ph',badge:'PHILIPPINES • REMOTE CONTRACT • USD $20–$50/HR ADVERTISED • 10–40 HRS/WK',
  summary:'Alignerr’s current official listing targets experienced support engineers, technical support specialists and customer-success engineers in Manila and across the Philippines. Contractors create realistic customer-support triage tasks and scoring rubrics used to train/evaluate AI agents. The advertised USD $20–$50/hour and 10–40 hours/week are not guaranteed; project matching, paid hours and continuation depend on the assignment.',
  requirements:['The employer explicitly describes the role as fully remote and suitable for experienced professionals in Manila and across the Philippines','Requires hands-on product-support experience in a support-engineering, technical-support or customer-success engineering role','Must understand real product failure modes, escalation paths, ticket queues, account configuration, runbooks and knowledge-base tools','Work includes writing realistic ticket-triage scenarios, defining objective scoring rubrics, testing task environments and reviewing AI-drafted prompts/rubrics','The official listing advertises USD $20–$50/hour, 10–40 hours/week and weekly payouts; confirm the actual rate, paid screening/training, hours, contractor terms and payout route with Alignerr before accepting','No previous AI-training experience is listed as a requirement, but relevant professional support experience is essential','Apply only through the official Alignerr job page and its linked application portal; never pay an application, assessment, training, equipment or release fee'],
  official:'https://www.alignerr.com/jobs/543e6d17-c69e-41c5-b5b2-71a94a91b55c',
  secondary:'https://app.alignerr.com/signin?job=543e6d17-c69e-41c5-b5b2-71a94a91b55c',
  secondaryLabel:'Official Alignerr application portal',
  cta:'Apply through official Alignerr portal',
  verified:'2026-11-03'
 },
 {
  id:'thoth-ai-remote-annotation-trainer',name:'Thoth AI — Remote Data Annotation Trainer & Onboarding Coach',status:'location-check',badge:'REMOTE IN TITLE • METRO MANILA LOCATION • FULL-TIME • PAY NOT DISCLOSED',
  summary:'Thoth AI’s employer-posted LinkedIn role is titled Remote Data Annotation Trainer & Onboarding Coach and shows Metro Manila as its location. Work includes training and onboarding new labelers, coaching them on project guidelines and quality expectations, monitoring onboarding performance, providing feedback and updating training materials. The listing does not publish pay or explicitly confirm nationwide remote eligibility; confirm that work from Negros Oriental is accepted before applying.',
  requirements:['Full-time role; the employer listing uses “Remote” in the title but displays Metro Manila as the location, so province-wide remote eligibility is not yet confirmed','Responsibilities include delivering training sessions, onboarding and coaching labelers, monitoring performance and quality, and updating training materials with project-management feedback','Pay, work schedule, required prior training/annotation experience and contract details are not disclosed in the public posting; request these in writing','Use the employer-posted LinkedIn listing and confirm that applicants living outside Metro Manila may work fully remotely before proceeding','Do not pay recruitment, screening, training or equipment fees and do not share passwords, OTPs or banking credentials with recruiters'],
  official:'https://ph.linkedin.com/jobs/view/remote-data-annotation-trainer-onboarding-coach-at-thoth-ai-4483086131',
  secondary:'https://ph.linkedin.com/company/aithoth/jobs',
  secondaryLabel:'Thoth AI employer jobs page',
  cta:'Check employer listing and location terms',
  verified:'2026-11-02'
 },
 {
  id:'rise-data-labs-global-expert-network',name:'Rise Data Labs — Global Expert Network for AI Training & Evaluation',status:'active-ph',badge:'GLOBAL REMOTE CONTRACTS • ADVANCED PROFESSIONAL EXPERTS • USD $50–$150/HR ADVERTISED',
  summary:'Rise Data Labs’ official expert portal currently lists remote contract projects whose individual role pages explicitly say “Global. All countries welcome.” Current recently posted examples include Finance Expert ($50–$100/hour; posted Nov 2), Legal & Paralegal Expert ($50–$150/hour; posted Oct 31), and Healthcare Expert ($50–$150/hour; posted Oct 31). An older QuickBooks/Sales Operations project was posted September 11 and is not treated as a current opening. The network requires an advanced degree or deep professional experience; prior AI experience is not required. Rates are role-specific, project volume varies, and weekly payment applies only to approved work.',
  requirements:['The official expert portal says location requirements vary by role; the current Finance, Legal/Paralegal and Healthcare roles linked here each state Global / all countries welcome','Applicants need an advanced degree or deep professional experience. This is not a beginner click-work platform; each role requires established professional expertise in its domain','Finance Expert: USD $50–$100/hour; ideally 40 hours/week for two weeks, minimum 20 hours/week; finance experience such as investment research, asset management, financial modeling, accounting or corporate finance','Legal & Paralegal Expert: USD $50–$150/hour; professional experience as a paralegal, legal researcher, attorney, legal operations or compliance professional; project hours not stated','Healthcare Expert: USD $50–$150/hour; relevant professional experience and qualifications/licensure where applicable; project hours not stated','The network application includes a profile, interview and skills assessment. Approval does not guarantee a project; check each project’s rate, hours, deadline and country terms before accepting','The official portal says approved work is paid weekly. No application or release fee is listed; never pay to join, unlock tasks or receive earnings, and never share passwords or OTPs'],
  official:'https://experts.risedatalabs.com/',
  secondary:'https://experts.risedatalabs.com/jobs/finance-expert-ai-training-evaluation-cmov7',
  secondaryLabel:'Finance Expert — USD $50–$100/hour, global',
  moreLinks:[
   {label:'Legal & Paralegal Expert — USD $50–$150/hour, global',url:'https://experts.risedatalabs.com/jobs/legal-paralegal-expert-%E2%80%94-ai-training-evaluation-0qn42'},
   {label:'Healthcare Expert — USD $50–$150/hour, global',url:'https://experts.risedatalabs.com/jobs/healthcare-expert-%E2%80%94-ai-training-evaluation-x5d4n'},
   {label:'Older QuickBooks/Sales Operations project (posted Sep 11; confirm still available)',url:'https://experts.risedatalabs.com/jobs/quickbooks-expert-with-sales-operations-experience-l7q1d'}
  ],
  cta:'Join official expert network and review projects',
  verified:'2026-11-02'
 },
 {
  id:'respondent-ph-paid-research',name:'Respondent — Paid Research Studies & Interviews',status:'active-ph',badge:'PHILIPPINES • FREE PARTICIPANT SIGN-UP • REMOTE RESEARCH',
  summary:'Respondent’s official participant panel lists approximately 103,000 Philippines participants and USD $84,000 in incentives paid in the country, and its help centre includes the Philippines among its primary target markets. Participant sign-up is free. Its current participant page says most sessions pay USD $50–$250 depending on length and seniority; the help centre gives more specific illustrative ranges of USD $40–$150 for remote interviews and USD $5–$25 for short unmoderated tasks. Researchers select participants, so invitations and income are not guaranteed.',
  requirements:['Respondent’s official panel snapshot lists about 103,000 participants in the Philippines and USD $84,000 in total incentives paid there; its help centre also lists the Philippines as a primary target market','Participant sign-up is free and does not require a credit card; the participant page says most people receive about 1–3 study invitations per month, but selection and income are not guaranteed','Complete an accurate profile and apply only to studies that genuinely match your experience, occupation and location; researchers choose participants','Screening questionnaires are unpaid; do not treat screeners or study invitations as guaranteed income','After the researcher confirms attendance/completion, incentives are delivered through Tremendous, typically 7–10 business days later','Respondent deducts a 5% fulfillment fee with a USD $1 minimum; available gift cards or payout options depend on the Philippines redemption catalogue at the time of payment','Check the Tremendous redemption choices for the Philippines before committing to a study if you need a particular cash-out method; never pay anyone to qualify or release a reward'],
  official:'https://www.respondent.io/become-a-participant',
  secondary:'https://help.respondent.io/en/articles/5471299-what-countries-can-i-recruit-in-on-respondent',
  secondaryLabel:'Official country-market information',
  tertiary:'https://help.respondent.io/en/articles/12552519-getting-paid-on-respondent-timeline-currencies-how-to-redeem',
  tertiaryLabel:'Official payout timing, options and fees',
  cta:'Join as a participant — free',
  verified:'2026-11-01'
 },
 {
  id:'triaba-ph-surveys',name:'Triaba — Philippines Paid Survey Panel',status:'active-ph',badge:'PHILIPPINES • FREE JOIN • MOBILE & WEB SURVEYS',
  summary:'Triaba’s Philippines panel offers paid consumer surveys through its website and mobile browser. Its official pages advertise approximately ₱3.50–₱91 or more per completed survey, depending on length and type. Survey invitations, qualification and earnings vary; this is supplemental rewards activity, not a job or guaranteed income.',
  requirements:['Free registration through the Philippines-specific panel; keep demographic and contact details accurate','Official advertised reward range is ₱3.50–₱91 or more per completed survey; screening out or having no matching survey may produce little or no reward','The current official Philippines payment table lists PayPal at ₱560 with a 4% fee; GCash at ₱500–₱10,000; GrabGifts at ₱200; and Globe Telecom, SmartBro, Touch Mobile, Garena, Lazada, Smart and several other local rewards from ₱250–₱500. Transfers generally take 1–5 business days','Surveys may be completed on a phone or computer; no special device or purchase is required','Never pay a registration or withdrawal fee, and do not provide OTPs, passwords or unrelated financial credentials to anyone claiming to be a Triaba recruiter'],
  official:'https://www.triaba.com/ph/join',
  secondary:'https://www.triaba.com/ph/Payment',
  secondaryLabel:'Official Philippines payment thresholds and fees',
  cta:'Join the official Philippines panel',
  verified:'2026-11-01'
 },
 {
  id:'rakuten-insight-ph-surveys',name:'Rakuten Insight — Philippines Survey Panel',status:'active-ph',badge:'PHILIPPINES • FREE WEB PANEL • IPHONE APP AVAILABLE',
  summary:'Rakuten Insight operates a Philippines-specific survey panel. Members sign up free, complete surveys and exchange points for country-specific rewards. The official site does not publish a universal Philippines pay rate or fixed redemption threshold; check the reward catalogue inside the PH account. The official iPhone app is listed in the Philippines App Store.',
  requirements:['Use the Philippines-specific member site and keep your profile accurate; survey frequency and qualification vary','No fixed per-survey pay rate is published on the current PH landing page; points and rewards depend on the survey and local catalogue','The official iPhone app is listed in the Philippines App Store and requires iOS 16 or later','The Android link from the PH website currently leads to a Google Play listing labeled English (US) that says participation requires being located in the United States; use the PH website on Android unless Rakuten provides a confirmed Philippines-specific Play listing','The official PH panel recently displayed an inquiry-response delay notice dated October 28, 2026; allow extra time for support replies','Review the privacy policy and app permissions before joining; no purchase or application fee is required'],
  official:'https://member.insight.rakuten.com.ph/',
  secondary:'https://apps.apple.com/ph/app/rakuten-insight-earn-cash/id1622323537',
  secondaryLabel:'Official Philippines App Store listing',
  tertiary:'https://play.google.com/store/apps/details?id=us.rakuten.insight.member',
  tertiaryLabel:'Android link — US-only listing; PH eligibility not verified',
  cta:'Open official Philippines panel',
  verified:'2026-11-01'
 },
 {
  id:'klkt-phone-data-collection',name:'KLKT by CNTXT AI — Phone Photo & Video Data Tasks',status:'location-check',badge:'PHILIPPINES TASKS SHOWN • IPHONE & ANDROID • FREE TO JOIN',
  summary:'KLKT’s official website shows “Homes in the Philippines” as a task example and says the service operates in more than 20 countries. The app is free to join and pays only for accepted tasks; every task shows whether it is open in your country. No universal task rate is published. Payout methods advertised by the developer include bank transfer, PayPal, Western Union and MoneyGram.',
  requirements:['The official website specifically depicts household tasks in the Philippines, but task-level availability must be confirmed inside the app after selecting your real country','The developer lists iPhone 11–17 and selected recent Pixel and Galaxy models for most video tasks; the app checks the device at signup','A head strap is required for many first-person video tasks; some projects provide a kit. Do not buy equipment until a live PH task confirms the requirement and any reimbursement terms','Only accepted tasks are paid; no fixed hourly or per-photo rate is published. Confirm the exact task amount and payout method before recording','Important privacy warning: Google Play’s current Data Safety section says data is not encrypted. Avoid recording private family activities, children, faces, IDs, passwords, financial details, screens or bystanders; review the developer privacy terms before submitting','The developer says recording starts only when you press record and lets you review each recording before submission; never pay a joining fee or share OTPs, passwords or wallet recovery phrases'],
  official:'https://www.klkt.app/',
  secondary:'https://apps.apple.com/ph/app/klkt/id6759249321',
  secondaryLabel:'Official Philippines iPhone App Store listing',
  tertiary:'https://play.google.com/store/apps/details?id=com.cntxt.cntxtai.data.services',
  tertiaryLabel:'Official Android Google Play listing — review data-safety warning',
  cta:'Check official KLKT tasks',
  verified:'2026-11-01'
 },
 {
  id:'vimo-phone-video-tasks',name:'Vimo — First-Person Phone Video Tasks (Country Check)',status:'location-check',badge:'IPHONE APP LISTED IN PH • PAYOUT ELIGIBILITY NOT CONFIRMED',
  summary:'Vimo’s official website advertises free, no-experience video tasks paying USD $5–$20 per approved hour of footage. Its Philippine App Store listing is live and supports iPhone, but the website currently describes its 30+ operating countries as being across Latin America and the Caribbean and does not confirm Philippine payout eligibility. Treat this as a country-check lead only—not an available Philippine earning opportunity until signup accepts the Philippines and displays a payable task.',
  requirements:['The official Philippines App Store listing is free and requires iOS 17 or later; the developer also says Android phones recording at 1080p/30fps or better may qualify','The website advertises USD $5–$20 per approved footage hour, a review period of up to one week and payment within five days after approval; earnings are not guaranteed','The website shows a USD 30 payout minimum, with a promotion to lower it to USD $10 after inviting three friends; confirm current terms in the account before relying on this','Country eligibility is unresolved: the official website describes 30+ countries across Latin America and the Caribbean, not the Philippines. App Store availability alone does not prove that Philippine tasks or payouts are supported','The app-store release notes describe gift-card and mobile-airtime cash-outs, while the website says payout methods vary by country and mentions local bank payout; verify the actual Philippines method before recording','A forehead head mount may be required for some tasks; do not purchase equipment until a live PH task and payout route are confirmed','The App Store privacy label says the app may collect precise/coarse location, physical address, financial information, name, email, photos/videos and audio; read the consent and data-use terms before recording','Keep faces and bystanders out of footage, and do not record private documents, screens, addresses or confidential household details'],
  official:'https://www.joinvimo.com/',
  secondary:'https://apps.apple.com/ph/app/vimo-record-earn/id6809894989',
  secondaryLabel:'Official Philippines App Store listing',
  cta:'Check country eligibility before joining',
  verified:'2026-11-01'
 },

 {
  id:'tsmg-team-coordinator',name:'TSMG — Team Coordinator (AI Device Testing & Data Collection)',status:'active-ph',badge:'PHILIPPINES • REMOTE • FULL-TIME CONTRACT • PAY NOT DISCLOSED',
  summary:'TSMG currently lists a full-time contract Team Coordinator role as remote in the Philippines. The project coordinates participant sessions and structured data collection/usability testing for consumer medical devices such as blood-pressure monitors, glucose meters and weight scales. Pay is not disclosed.',
  requirements:['The employer listing explicitly says Remote in Philippines and Contract Full time','Responsibilities include coordinating local participants, onboarding and guidance, scheduling, device logistics/procurement when required, session execution and checking metadata/documentation','Previous coordination or training experience is a plus, not a stated requirement; strong organization, multitasking, English communication and independent work are required. Local-language knowledge is preferred but not mandatory','The role supports local operations and sessions; applicants outside Metro Manila should confirm whether Negros Oriental is within the project territory and whether any in-person session, travel or device-handling duties are required','Salary, work hours, contract duration, equipment and reimbursement terms are not disclosed; obtain these in writing before accepting','Apply only through the employer-hosted Lever page. No application fee is listed; never pay a recruiter or intermediary for screening, equipment, training or job placement'],
  official:'https://jobs.lever.co/tsmg/05dbe915-0dbd-48ba-9720-110d5fe72ac4',
  secondary:'https://jobs.lever.co/tsmg?location=Remote+in+Philippines',
  secondaryLabel:'Official TSMG Philippines job board',
  cta:'Apply through official TSMG listing',
  verified:'2026-11-04'
 },
 {
  id:'lifepoints-ph-surveys',name:'LifePoints — Philippines Paid Surveys & Mobile Rewards',status:'active-ph',badge:'PHILIPPINES • FREE TO JOIN • ANDROID + IPHONE + WEB',
  summary:'LifePoints is a Philippines market-research panel operated by Lightspeed/Kantar. Registration is free and the current PH sign-up page advertises a 10-LifePoints welcome bonus. The official guide says surveys average about 10–20 minutes. Reward values and survey frequency vary, so this is supplemental rewards activity rather than guaranteed income.',
  requirements:['The official LifePoints Help Centre lists the Philippines among supported survey markets; use the Philippines panel and provide truthful profile details','Free registration; the current PH sign-up page advertises 10 LP welcome points. No special skills are required. The points offered for each survey are shown before starting; survey availability and earnings vary','The official PH rewards catalogue lists PayPal, Amazon, Lazada, GCash, Globe, GrabFood, GrabGifts, Smart, UNICEF and other options. Exact redemption thresholds and availability can change and should be checked in the signed-in account','The official Philippines website says the app can be downloaded from the App Store or Google Play. The current iPhone App Store listing requires iOS 15.1 or later; the current Google Play listing is published by Kantar Profiles and was updated October 29, 2026','The official how-it-works page mentions polls and diaries, but the current rewards page says LifePoints does not offer mystery shopping or product testing. Treat the core earning method as online surveys; do not assume paid product-testing tasks','Important privacy warning: the current Google Play Data Safety panel says the app may share personal information and health/fitness data and states that data is not encrypted. The iPhone privacy label lists identifiers/usage data for tracking and may collect location, contact details and other data. Review permissions and privacy terms; consider using the web panel instead of the app if you are uncomfortable with those disclosures','The official PH guide says points expire if the account is inactive for 30 days after signup or within any 90-day period. Start at least one survey or other qualifying account activity before long inactivity; points may be forfeited if the account is closed','No fee is required to join. Use only the official panel and app-store publisher links; never pay anyone to join or release rewards'],
  official:'https://www.lifepointspanel.com/en-ph/registration',
  secondary:'https://www.lifepointspanel.com/en-ph/how-it-works',
  secondaryLabel:'Official survey, points and activity guide',
  tertiary:'https://apps.apple.com/ph/app/lifepoints-paid-surveys-app/id1508335904',
  tertiaryLabel:'Official Philippines iPhone app listing',
  moreLinks:[
   {label:'Official Android app — Google Play, Kantar Profiles',url:'https://play.google.com/store/apps/details?id=com.kantarprofiles.lifepoints'},
   {label:'Official Philippines rewards catalogue',url:'https://www.lifepointspanel.com/en-ph/rewards'},
   {label:'Official supported-country list',url:'https://lifepoints.zendesk.com/hc/en-id/articles/360024807931-Who-can-join-LifePoints'}
  ],
  cta:'Join the official Philippines panel',
  verified:'2026-11-04'
},
 {
  id:'ipsos-isay-ph-maintenance-check',name:'Ipsos iSay — Philippines Surveys & GCash Rewards (Maintenance Check)',status:'location-check',badge:'PHILIPPINES • OFFICIAL PANEL • PUBLIC SITE REDIRECTED TO MAINTENANCE',
  summary:'Ipsos iSay has an official Philippines survey panel and a local rewards catalogue that includes GCash and gift-card options. However, during the November 4, 2026 check, the live English Philippines landing and rewards URLs redirected to an Ipsos Interactive maintenance page. The panel is legitimate, but current registration and redemption availability could not be confirmed; do not use unofficial replacement links.',
  requirements:['The official PH panel describes online surveys and a rewards catalogue; survey invitations, eligibility and earnings are not guaranteed','The official PH rewards FAQ says newly registered members must wait 96 hours after registration before redeeming rewards. Points remain available only while the membership stays active; check the live FAQ for current terms once the site returns','A cached/indexed official catalogue indicates local GCash and gift-card rewards, but exact point-to-peso denominations could not be independently verified while the live catalogue redirects to maintenance. Do not rely on old screenshots or third-party reward tables','Live access issue: the public PH landing and rewards URLs redirected to enter.ipsosinteractive.com/maintenance/maintenance.html during this verification. Treat registration and redemption as temporarily unverified until the official site returns','Do not submit identity or payment details through social-media messages, WhatsApp links or unofficial mirror sites. Use only the official Ipsos iSay domain; never pay an intermediary to join or release rewards'],
  official:'https://www.ipsosisay.com/en-ph/',
  secondary:'https://www.ipsosisay.com/en-ph/faq-rewards-redeeming-points',
  secondaryLabel:'Official Philippines rewards FAQ (may be unavailable during maintenance)',
  tertiary:'https://www.ipsosisay.com/en-ph/stay-safe-on-ipsos-isay',
  tertiaryLabel:'Official Ipsos anti-scam and account-safety guidance',
  cta:'Check whether the official PH panel has returned',
  verified:'2026-11-04'
},
 {
  id:'impact-hub-manila-2026-hubber',name:'Impact Hub Manila — 2026 Hubber / Venture-Builder Rolling Intake',status:'location-check',badge:'PHILIPPINES + SEA FOUNDERS • ROLLING INTAKE • FREE TO APPLY',
  summary:'Impact Hub Manila currently invites idea-stage through seed-stage founders across Southeast Asia to apply for its Hubber community and 2026 venture-builder programs. The official page advertises free application, no pitch deck required and a five-business-day response target. Support includes mentorship, capital connections, events, a Bonifacio Global City workspace and access to programs in climate, AI for Good, agritech, health and inclusive finance. This is not a guaranteed grant or cash award.',
  requirements:['The official site says rolling intake, free application, idea-stage welcome and open to founders across Southeast Asia; a pitch deck is not required at the initial application stage','Target ventures address climate, responsible AI/AI for Good, agritech, health or inclusive finance and should explain measurable benefit to Filipino communities','The page says founders keep their equity, intellectual property and direction; it does not publish a guaranteed cash award or grant amount for every accepted Hubber','Some program tracks are described as grant-supported for accepted founders, but membership tiers and track participation vary; confirm the exact costs, funding terms, deliverables, selection criteria and any equity/IP conditions in writing before joining','The physical workspace is in Bonifacio Global City, Taguig. Remote/hybrid participation from Negros Oriental is not confirmed; ask whether the chosen track can be completed remotely before committing to travel','This is a private venture-builder/community program, not a DICT or DOST government grant and not paid employment'],
  official:'https://impacthub.ph/',
  secondary:'https://impacthub.net/',
  secondaryLabel:'Global Impact Hub network',
  cta:'Review official Hubber application',
  verified:'2026-11-04'
 },
 {
  id:'dost-pcaarrd-sgf-2026-closed',name:'DOST-PCAARRD — 2026 Startup Grant Fund (Separate Program; Closed)',status:'closed',badge:'CLOSED • APRIL 15, 2026 • NOT THE DICT STARTUP GRANT FUND',
  summary:'DOST-PCAARRD ran a separate 2026 Startup Grant Fund for startups and spin-offs commercializing agriculture, aquatic and natural-resources technologies. Its official call closed April 15, 2026. This is not the DICT/IIDB Startup Grant Fund being monitored in this Vault.',
  requirements:['Official DOST-PCAARRD call accepted proposals February 16–April 15, 2026; the deadline has passed and this call is closed','The program supports eligible startup and spin-off companies commercializing technologies in agriculture, aquatic and natural resources (AANR), not general-purpose software ventures','Do not confuse this DOST-PCAARRD program with the separate DICT/IIDB Startup Grant Fund 2026 call, which remains pending official launch as of November 4','Safety warning: the current rendered DOST-PCAARRD article page footer displayed many unrelated gambling/SEO links. Avoid those unrelated links and verify any future DOST application materials by navigating from the official DOST-PCAARRD homepage or contacting the agency directly'],
  official:'https://www.pcaarrd.dost.gov.ph/index.php/quick-information-dispatch-qid-articles/dost-pcaarrd-opens-call-for-2026-startup-grant-fund-program',
  secondary:'https://www.pcaarrd.dost.gov.ph/',
  secondaryLabel:'Official DOST-PCAARRD homepage — use official navigation only',
  cta:'Review closed call and distinguish it from DICT SGF',
  verified:'2026-11-04'
 },
 {
  id:'eu-green-up-to-scale-msme-grant-2026-closed',name:'EU Green Up to Scale Up — MSME Transformation Grant (Second Call; Closed)',status:'closed',badge:'CLOSED • MAY 11, 2026 • €250K–€500K NETWORK GRANTS',
  summary:'The EU-funded Green Up to Scale Up second call offered €250,000–€500,000 grants to Philippine circular-economy networks supporting MSMEs in agriculture/fisheries, food, textile and tourism/hospitality. The official Expertise France POPS application platform confirms a May 11, 2026, 12:00 Paris-time deadline, so this call is closed even though the EU Delegation announcement still displays an “Apply now” heading.',
  requirements:['The POPS application platform lists the submission deadline as May 11, 2026 at 12:00 Paris time; do not treat the older EU Delegation “Apply now” page as proof that applications remain open','The call was designed to award approximately 3–6 grants to multi-stakeholder networks, not individual founders applying for personal cash','The lead applicant had to be a legal Philippine entity, SEC-registered, with at least one partner organization forming a network; the project targeted MSME transformation in agriculture/fisheries, food production, textiles or tourism/hospitality','Grant requests were €250,000–€500,000 per lead applicant; audited financial statements for the most recent two years were required under the published Q&A','Retain this record only to prevent stale application links from being presented as open; reactivate only if Expertise France publishes a new call with a new deadline'],
  official:'https://pops.expertisefrance.fr/sdm/ent2/gen/ficheCsl.action?PCSLID=CSL_2026_V4M7tCIXxi&ongletActif=2',
  secondary:'https://www.eeas.europa.eu/delegations/philippines/apply-now-green-scale-msme-transformation-grant_en',
  secondaryLabel:'EU Delegation announcement (older “Apply now” page; call closed)',
  cta:'Review official closed-call record',
  verified:'2026-11-04'
 }
];

const statusLabel=(s:Opportunity['status'])=>s==='active-ph'?'Verified PH path':s==='closed'?'Closed / deadline passed':s==='location-check'?'Check eligibility / location':'Waitlist / unavailable in PH';

export default function OpportunityVault(){
 const[filter,setFilter]=useState<'all'|'active-ph'|'location-check'|'waitlist'|'closed'>('all'),[msg,setMsg]=useState('');
 const visible=opportunities.filter(x=>filter==='all'||x.status===filter);
 async function copy(code:string){try{await navigator.clipboard.writeText(code);setMsg('Referral code copied. Atlas currently advertises USD 10, USD 50 and USD 100 milestone bonuses for both people after 1, 20 and 50 approved hours, respectively, for friends who sign up from October 11, 2026. Verify progress in the app.')}catch{setMsg('Referral code: '+code)}}
 return <main className="page opportunityVault cinematicSurface">
  <header><a href="/">← Home</a><span>MAGNANIMOUS OPPORTUNITY VAULT</span><a href="/creator-growth">Creator Growth →</a></header>
  <section className="hero">
   <div className="hero-art" aria-hidden="true"/>
   <div className="hero-copy">
    <small>♛ I AM MAGNANIMOUS WAY™ • OPPORTUNITY VAULT</small>
    <h1>Discover real opportunities.</h1>
    <p>Current requirements. Official sources. No fake promises.</p>
    <span className="hero-promise">The Vault keeps outside opportunities separate from Magnanimous. Each listing links to its official source and clearly shows eligibility and verification dates.</span>
   </div>
   <div className="hero-rail" aria-hidden="true">DISCOVER ✦ VERIFY ✦ APPLY ✦ GROW</div>
  </section>
  <section className="rules">
   <b>Safety rule</b><span>Never pay an application fee. Equipment, identity verification or platform-specific onboarding can have separate requirements; verify them on the official source before spending money.</span>
   <b>Truth rule</b><span>Displayed pay is not guaranteed income. Availability, task volume, approval and payouts are controlled by the outside platform.</span>
  </section>
  <nav>{[['all','All'],['active-ph','Verified PH'],['location-check','Eligibility / location'],['waitlist','Waitlist / unavailable'],['closed','Closed / expired']] .map(([id,label])=><button key={id} className={filter===id?'on':''} onClick={()=>setFilter(id as any)}>{label}</button>)}</nav>
  {msg&&<div className="msg">{msg}</div>}
  <section className="grid">
   {visible.map(o=><article key={o.id} className={o.status}>
    <div className="top"><div><small>{o.badge}</small><h2>{o.name}</h2></div><em>{statusLabel(o.status)}</em></div>
    <p>{o.summary}</p>
    <h3>Current facts</h3><ul>{o.requirements.map(x=><li key={x}>{x}</li>)}</ul>
    {o.examples?.length?<><h3>Examples seen in the current official listing</h3><ul>{o.examples.map(x=><li key={x}>{x}</li>)}</ul></>:null}
    {o.referral&&<div className="ref"><span>Optional referral code supplied by I AM Magnanimous Way™</span><b>{o.referral}</b><button onClick={()=>copy(o.referral!)}>Copy code</button><small>No bonus amount is promised here; current referral terms must be checked in the app.</small></div>}
    <div className="actions"><a href={o.official} target="_blank" rel="noreferrer">{o.cta}</a>{o.secondary&&<a href={o.secondary} target="_blank" rel="noreferrer">{o.secondaryLabel||'Open secondary source'}</a>}{o.tertiary&&<a href={o.tertiary} target="_blank" rel="noreferrer">{o.tertiaryLabel||'Open third source'}</a>}{o.moreLinks?.map(link=><a key={link.url} href={link.url} target="_blank" rel="noreferrer">{link.label}</a>)}</div>
    <footer>Last source verification: {o.verified}</footer>
   </article>)}
  </section>
  <section className="watch">
   <small>STARTUP FUNDING WATCH • 2026-11-04 (PH TIME)</small><h2>DICT / IIDB Startup Grant Fund 2026 — October target elapsed; official call still not verified</h2><p>As of November 4, 2026 Philippine time, the October 2026 publication/opening target has elapsed. The latest SGF-specific official IIDB post still describes the September 2, 2026 public consultation on a draft revised circular and says publication/effectivity plus the next Call for Applications were targeted within October. The official IIDB page has since published Philippine Startup Challenge and Philippine Startup Week updates, but no verified SGF launch notice, effective revised circular, final eligibility rules, application templates or submission deadline. DICT SGF also told the user on October 7, 2026 that eligibility, procedures, templates and application details would be published when the 2026 call officially launches through DICT/IIDB channels. Keep this as a high-priority pending watch item—not an open grant. Do not submit documents or pay anyone claiming to accept SGF applications before the official call appears. Do not confuse it with the separate DOST-PCAARRD Startup Grant Fund or DEPDev Innovation Grants. Recheck the <a href="https://www.linkedin.com/posts/dict-iidb_dict-iidb-startupgrantfund-activity-7502542376213598208-hx9S" target="_blank" rel="noreferrer">official IIDB update</a> and <a href="https://startup.gov.ph/programs" target="_blank" rel="noreferrer">government Startup Philippines programs</a> before applying or sharing documents.</p>
   <h2>Philippine Startup Week 2026 — November 9–12</h2><p>The official <a href="https://phsw.startup.gov.ph/" target="_blank" rel="noreferrer">Philippine Startup Week portal</a> lists November 9–12 at the M.I.C.E. Center in Quezon City. The flagship <a href="https://ignite.ph/" target="_blank" rel="noreferrer">IGNITE X conference</a> is November 10; its <a href="https://luma.com/rdibkjhw" target="_blank" rel="noreferrer">registration page</a> says host approval is required and does not display an attendance price. The government <a href="https://startup.gov.ph/phsw-register/" target="_blank" rel="noreferrer">Pre-Register page</a> rendered only the portal header/footer during this check; the official IIDB announcement links to that same page. Confirm registration, fees and any virtual option with the organizer before travel. These are networking/learning events, not published grants or guaranteed investor meetings.</p>
   <h2>AIM-Dado Banatao Incubator — 2026–2027 form is expired</h2><p>The current <a href="https://aim.edu/dado-banatao-incubator/" target="_blank" rel="noreferrer">AIM-DBI official page</a> still features THINCOHORT 2026–2027, but its linked <a href="https://aim.edu/wp-content/uploads/2026/02/AIM-Form_Edited_2026_.pdf" target="_blank" rel="noreferrer">official application PDF</a> states that the 2026–2027 intake closed May 31, 2026. Do not submit that expired form as a current application. The same official page describes the next 2027–2028 intake as opening April 1, 2027 and closing May 31, 2027. THINCOHORT is a mostly onsite/hybrid 12-month incubator and mentorship program, not a published cash grant; plan for Makati participation and confirm the next form when it opens.</p>
   <h2>DOST-PCAARRD Startup Grant Fund 2026 — separate call closed April 15</h2><p>The <a href="https://www.pcaarrd.dost.gov.ph/index.php/quick-information-dispatch-qid-articles/dost-pcaarrd-opens-call-for-2026-startup-grant-fund-program" target="_blank" rel="noreferrer">official DOST-PCAARRD call</a> was for agriculture, aquatic and natural-resources startups and closed April 15, 2026. It is not the DICT/IIDB SGF. The current rendered article footer displayed unrelated gambling/SEO links; avoid those external footer links and use official DOST-PCAARRD navigation or contact details only.</p>
   <h2>EU Green Up to Scale Up MSME Transformation Grant — closed May 11</h2><p>The EU Delegation page still carries an “Apply now” heading, but the official <a href="https://pops.expertisefrance.fr/sdm/ent2/gen/ficheCsl.action?PCSLID=CSL_2026_V4M7tCIXxi&amp;ongletActif=2" target="_blank" rel="noreferrer">Expertise France POPS application record</a> confirms the deadline was May 11, 2026 at 12:00 Paris time. The second call is closed; do not submit through stale copies of the announcement.</p>
   <h2>Ipsos iSay Philippines — public site maintenance check</h2><p>The official <a href="https://www.ipsosisay.com/en-ph/" target="_blank" rel="noreferrer">Philippines panel</a> and <a href="https://www.ipsosisay.com/en-ph/rewards" target="_blank" rel="noreferrer">rewards page</a> redirected to an Ipsos Interactive maintenance page during the November 4 check. Its indexed official catalogue still lists local GCash and gift-card rewards, but registration/redemption availability is not verified until the public site returns. Do not use unofficial replacement sign-up links.</p>
      <h2>AI Data Innovations — current employer rate is USD $8/hour</h2><p>The current <a href="https://ph.linkedin.com/jobs/view/technical-data-annotator-remote-position-at-ai-data-innovations-4479543236" target="_blank" rel="noreferrer">employer-posted LinkedIn listing</a> states USD $8.00/hour for an approximately 12-week remote AI Safety &amp; Guardrails project. Weekly hours remain to be confirmed. The earlier <a href="https://ph.linkedin.com/jobs/view/technical-data-annotator-remote-position-at-ai-data-innovations-4463376446" target="_blank" rel="noreferrer">USD $6.50/hour predecessor listing</a> is no longer the current application listing. The Vault uses the newer employer-posted USD $8 rate; confirm the actual hours, rate, screening, payment schedule and contractor terms in writing. Do not pay intermediaries.</p>
   <h2>Innodata Robotics Annotator Rater — application closed</h2><p>LinkedIn now marks Innodata’s <a href="https://ph.linkedin.com/jobs/view/robotics-annotator-rater-work-from-home-at-innodata-inc-4465962689" target="_blank" rel="noreferrer">Robotics Annotator Rater (Work From Home)</a> listing as no longer accepting applications. Third-party job-board mirrors may still display copies as active; do not rely on those mirrors or submit documents through a reposted link. The expired listing described a project planned for October 28–December 31, 2026, but the employer application is closed.</p>
   <h2>Alignerr — one related application URL returned 404</h2><p>The official Alignerr URL for an Audio Transcription &amp; Alignment Specialist candidate listing returned 404 during this check and was not added. The separate <a href="https://www.alignerr.com/en/jobs/9a4a33ed-d48b-44ab-a415-496a2a128fdb" target="_blank" rel="noreferrer">English Audio Transcription Specialist</a> listing remains live and is listed separately above. Always apply through the live employer page rather than stale reposts.</p>
   <h2>DOST-PCIEERD Driving Urban Transition 2026 — deadline November 17</h2><p>The official <a href="https://pcieerd.dost.gov.ph/work-with-us/2026-dost-pcieerd-dut-call-for-proposal-concept-proposal/" target="_blank" rel="noreferrer">DUT 2026 call page</a> lists a concept-proposal deadline of November 17, 2026 at 5:00 PM Philippine time through DPMISv2. This is a transnational research/innovation grant, not general startup operating cash: it requires at least three partners from three participating countries, at least two from EC co-fund-eligible countries, and a qualified Filipino principal investigator connected to an HEI/RDI with a relevant master’s degree. The call allocates up to PHP 25 million across a maximum of three projects over three years; a 15% counterpart is generally required except for public-good projects. Check the full call and templates before deciding whether a research-institution consortium can meet the requirements.</p>
   <h2>Unverified names stay out of the active list.</h2><p>Older notes mentioned ClarU.ai/Claru.ai, but no sufficiently authoritative current opportunity source has been verified, so it is not presented as an active earning option. AniAni remains a Metro Manila Android pilot with no independently verified payout history. WorldSight is listed only as a country-check lead because its official site does not identify its five live countries or confirm Philippine payout access. Vimo’s public site describes its current 30+ country footprint as Latin America and the Caribbean; it still does not confirm Philippine payout eligibility.</p>
   <h2>WorldSight app and payout caution</h2><p>WorldSight’s official website links to an App Store page that currently returns 404, while its Google Play listing says Stripe Connect payouts require identity verification. Its FAQ instead describes a W-8BEN payout flow and says U.S. persons are not supported. The five live countries are unnamed and Philippine payout support is unconfirmed. U.S. citizens/persons should not treat it as an available earning option.</p>
   <h2>Deepgram Tagalog labeling post — verify before applying</h2><p>A LinkedIn post advertises a Tagalog labeling/editor opportunity, but it does not appear among the roles on Deepgram’s current official careers portal. Deepgram explicitly warns candidates to confirm every role on that portal and to verify recruiters; report suspicious approaches to careers@deepgram.com. Keep this post out of the active list until Deepgram confirms it. Never send banking details, passwords or login codes to an unverified recruiter.</p>
  </section>
  <style jsx>{`
   *{box-sizing:border-box}.page{min-height:100vh;background:#060b10;color:#f2f8ff;padding:22px 28px 70px;font-family:Inter,system-ui,sans-serif;background-image:radial-gradient(circle at 85% 0,rgba(75,201,255,.12),transparent 30%),radial-gradient(circle at 12% 38%,rgba(83,255,174,.08),transparent 27%)}header,.hero,.rules,nav,.grid,.watch,.msg{max-width:1450px;margin-left:auto;margin-right:auto}header{display:flex;justify-content:space-between;gap:12px;color:#7d95a8;font-size:9px;letter-spacing:.14em}header a{color:#83dcff;text-decoration:none}.hero{padding:48px 0 28px}.hero small,.watch small{font-size:9px;letter-spacing:.18em;color:#72e5ba;font-weight:900}.hero h1{font-size:clamp(42px,6vw,76px);line-height:.95;margin:9px 0;max-width:1100px}.hero p,.watch p{max-width:980px;color:#8299aa;line-height:1.65}.rules{display:grid;grid-template-columns:130px 1fr;gap:7px 16px;border:1px solid #203844;border-radius:14px;padding:16px;background:#09131a}.rules b{color:#9cebd0;font-size:10px}.rules span{color:#8299aa;font-size:10px;line-height:1.5}nav{display:flex;gap:7px;flex-wrap:wrap;margin-top:12px}nav button{border:1px solid #294657;background:#0a1620;color:#9fb7c7;border-radius:9px;padding:9px 11px;cursor:pointer}nav button.on{background:#75e4bd;color:#06150f;border-color:#75e4bd;font-weight:900}.msg{margin-top:10px;padding:11px;border:1px solid #2f6656;background:#0a211b;color:#adf4da;border-radius:10px}.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:12px}.grid article{border:1px solid #213b49;background:#08131b;border-radius:17px;padding:19px}.grid article.active-ph{border-color:#2c6550}.grid article.waitlist{border-color:#554547}.grid article.closed{border-color:#76534a;opacity:.95}.top{display:flex;justify-content:space-between;gap:12px}.top small{font-size:8px;letter-spacing:.13em;color:#74dfb9}.top h2{font-size:27px;margin:5px 0}.top em{font-style:normal;font-size:8px;border:1px solid #325163;border-radius:999px;padding:6px 8px;height:max-content;color:#aac0cf}.grid p,.grid li{color:#8ba0b0;font-size:10px;line-height:1.55}.grid h3{font-size:10px;margin:15px 0 5px;color:#d7e7f2}.grid ul{margin:0;padding-left:18px}.ref{margin-top:13px;border:1px solid #285745;background:#091e17;border-radius:11px;padding:12px}.ref span,.ref small,.ref b{display:block}.ref span,.ref small{font-size:8px;color:#83a397}.ref b{font-size:23px;letter-spacing:.08em;margin:5px 0;color:#a6f2d5}.ref button{border:1px solid #3d7c65;background:#102d23;color:#d8fff0;border-radius:7px;padding:7px 9px;cursor:pointer}.actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:15px}.actions a{border:1px solid #356075;border-radius:9px;padding:9px 11px;color:#ccefff;text-decoration:none;font-size:9px;font-weight:800}.grid footer{margin-top:13px;font-size:8px;color:#637d8e}.watch{margin-top:12px;border:1px solid #263d49;border-radius:15px;padding:19px;background:#081219}@media(max-width:780px){.page{padding:18px 12px 55px}.grid{grid-template-columns:1fr}.rules{grid-template-columns:1fr}.top{align-items:flex-start}.hero{padding-top:32px}header span{display:none}}
   /* Cinematic original interior artwork: preserves the existing facts and working filters. */
   .hero{position:relative;isolation:isolate;overflow:hidden;min-height:420px;padding:42px 0 40px;margin-top:16px;margin-bottom:17px;border:2px solid #d9a846;border-radius:20px;background:#050d27;box-shadow:0 0 0 1px #2bc8ff,0 0 28px #178ee677,0 25px 80px #000a}
   .hero-art{position:absolute;inset:-3%;z-index:-1;background-image:linear-gradient(90deg,rgba(1,7,24,.88),rgba(1,7,24,.53) 43%,rgba(1,7,24,.02) 80%),url('/magnanimous-opportunity-palace-v2.webp');background-size:cover;background-position:center;animation:opportunityDepth 18s ease-in-out infinite alternate}
   .hero-copy{max-width:65%;padding:35px clamp(26px,4vw,55px) 42px;text-shadow:0 3px 20px #000c}
   .hero small{color:#ffdb83;font-size:11px;text-shadow:0 0 14px #d68a27;letter-spacing:.16em}
   .hero h1{max-width:710px;color:#ffe7a2;font-weight:950;font-size:clamp(45px,5.5vw,78px);line-height:1.02;letter-spacing:-.035em;text-shadow:0 2px 0 #785120,0 4px 0 #39210d,0 8px 25px #020615,0 0 30px #ffc96277}
   .hero p{color:#96ecff;font-size:clamp(16px,1.9vw,23px);font-weight:800;line-height:1.4;margin:15px 0}
   .hero-promise{display:block;max-width:560px;color:#f0faff;font-size:13px;line-height:1.65;background:linear-gradient(90deg,#04132dba,#071b378a);padding:12px 16px;border-left:3px solid #f3c668;border-radius:0 10px 10px 0}
   .hero-rail{position:absolute;bottom:0;right:0;left:0;display:flex;align-items:center;justify-content:center;min-height:27px;background:linear-gradient(90deg,#061733,#0d2d59,#061733);border-top:1px solid #d9a846;color:#ffd887;letter-spacing:.22em;font-weight:900;font-size:10px}
   /* Rules and card finishes are applied by the higher-specificity shared design system. */
   @keyframes opportunityDepth{from{transform:scale(1)}to{transform:scale(1.045)}}
   @media(max-width:820px){.hero-copy{max-width:82%;padding:25px 24px 40px}.hero-art{background-position:62% center}}
   @media(max-width:550px){.hero{min-height:490px}.hero-copy{max-width:100%;padding:20px 18px 50px}.hero-art{background-image:linear-gradient(180deg,#020922f5,#020922b5 53%,#02092244),url('/magnanimous-opportunity-palace-v2.webp');background-position:70% center}.hero h1{font-size:clamp(28px,8.7vw,43px);overflow-wrap:anywhere}.hero small{font-size:9px}.hero-promise{font-size:12px}.hero-rail{font-size:8px;letter-spacing:.13em}}
   /* The desktop treasure chamber above remains exactly as approved. Phones get their own portrait composition. */
   @media(max-width:760px) and (orientation:portrait){
    .hero{min-height:650px}
    .hero-copy{max-width:100%;padding:27px 20px 56px}
    .hero-art{background-image:linear-gradient(180deg,rgba(1,7,24,.95),rgba(1,7,24,.83) 42%,rgba(1,7,24,.04) 77%),url('/magnanimous-opportunity-palace-mobile-v2.webp');background-size:cover;background-position:center;animation:none}
    .hero h1{font-size:clamp(28px,7.9vw,46px);overflow-wrap:anywhere}
    .hero p{font-size:clamp(14px,3.6vw,17px);line-height:1.46}
    .hero-promise{max-width:100%;font-size:12px}
    .hero-rail{font-size:8px;letter-spacing:.1em;padding:5px 8px;text-align:center}
   }
   @media(prefers-reduced-motion:reduce){.hero-art{animation:none}}
  `}</style>
 </main>
}