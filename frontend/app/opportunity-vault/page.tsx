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
  id:'arca-sdr-worldwide',name:'Arca.ph — Sales Development Representative (Remote)',status:'active-ph',badge:'REMOTE WORLDWIDE • US EASTERN HOURS • 3+ YEARS OUTBOUND • PAY NOT DISCLOSED',
  summary:'Arca.ph’s official open-role page lists a remote worldwide SDR contract for a U.S. client. The role focuses on outbound calls to supplied leads using a provided dialer, qualifying prospects and booking appointments. Applicants must have at least three years of professional outbound sales, cold-calling or appointment-setting experience.',
  requirements:['Official listing says remote worldwide; applicants must be able to work U.S. Eastern hours','At least 3 years of professional outbound sales, cold-calling or appointment-setting experience and hands-on dialer experience are required','Must be willing to spend at least 6 hours dialing each working day; supplied leads and a dialer are provided','Strong spoken English, CRM recordkeeping, lead qualification and consistent follow-up are required','B2B calling and experience with GoHighLevel, HubSpot, Salesforce, Pipedrive or similar CRMs are helpful','Pay, contract rate and payment schedule are not disclosed; confirm these and the client details before accepting. No candidate application fee is stated on the public listing; do not pay an intermediary'],
  official:'https://arca.ph/careers/jobs/sales-development-representative-sdr-2436',
  secondary:'https://arca.ph/careers/jobs',
  secondaryLabel:'Arca.ph official current open roles',
  cta:'View official role and apply',
  verified:'2026-11-05'
 },
 {
  id:'arca-senior-backend-fintech-crypto',name:'Arca.ph — Senior Backend Engineer (Fintech/Crypto)',status:'active-ph',badge:'REMOTE WORLDWIDE • US EASTERN HOURS • SENIOR FINTECH/CRYPTO EXPERIENCE • PAY NOT DISCLOSED',
  summary:'Arca.ph is recruiting globally for a U.S. fintech client building institutional digital-asset trading and off-exchange settlement infrastructure. The role owns production backend services and integrations, primarily using Python and Go, with a strong emphasis on transaction correctness, reconciliation, auditability and blockchain integrations.',
  requirements:['Official listing says remote worldwide; team works U.S. Eastern hours','Requires senior-level ownership of substantial production backend systems and professional financial transaction experience in trading, settlement, banking, payments, custody, risk or accounting','Practical understanding of settlement, reconciliation and financial data integrity is required; professional blockchain/digital-asset knowledge is also required','Strong Python or Go, SQL and relational data modeling skills; experience with concurrency, transaction isolation, idempotency, recovery and audit trails is important','Pay, contract terms and payment schedule are not disclosed; confirm them before accepting','Apply only through the official Arca.ph role page; do not pay a third party to secure an introduction'],
  official:'https://arca.ph/careers/jobs/senior-backend-engineer-fintechcrypto-2432',
  secondary:'https://arca.ph/careers/jobs',
  secondaryLabel:'Arca.ph official current open roles',
  cta:'View official role and apply',
  verified:'2026-11-05'
 },
 {
  id:'arca-devops-engineer-worldwide',name:'Arca.ph — DevOps Engineer (Remote)',status:'active-ph',badge:'REMOTE WORLDWIDE • FULL-TIME • APPROX. 40 HOURS/WEEK • PAY NOT DISCLOSED',
  summary:'Arca.ph’s official listing describes a full-time remote DevOps role for a U.S. client, open to engineers worldwide. Work covers cloud infrastructure, CI/CD, infrastructure as code, containers, observability, deployment reliability, incident recovery and cloud-cost control.',
  requirements:['Official listing says remote worldwide and indicates an intended 40-hour work week; U.S. Eastern-hours overlap and on-call expectations are to be discussed','At least 3 years of professional DevOps, cloud infrastructure, platform engineering or SRE experience with direct production responsibility','Hands-on experience with AWS, Azure or Google Cloud; CI/CD; infrastructure as code; Docker and Kubernetes/ECS or equivalent; Linux, networking, DNS and TLS','Scripting with Bash, Python, PowerShell or Go; monitoring/logging; least-privilege access, secrets management and secure deployment practices','Pay, contract terms and payment schedule are not disclosed; confirm them before accepting','Apply through the official Arca.ph role page; no third-party recruiter payment is required to obtain an interview'],
  official:'https://arca.ph/careers/jobs/devops-engineer-2424',
  secondary:'https://arca.ph/careers/jobs',
  secondaryLabel:'Arca.ph official current open roles',
  cta:'View official role and apply',
  verified:'2026-11-05'
 },
 {
  id:'arca-mobile-engineer-ios-android',name:'Arca.ph — Mobile Engineer (iOS & Android)',status:'active-ph',badge:'REMOTE WORLDWIDE • MID-LEVEL • 3+ YEARS MOBILE DEVELOPMENT • PAY NOT DISCLOSED',
  summary:'Arca.ph’s official listing describes a remote worldwide mobile engineering role for a U.S. client, building and maintaining production iOS and Android apps. The work spans product implementation, APIs, authentication, mobile architecture, testing, performance, accessibility, CI/CD and App Store/Google Play releases.',
  requirements:['Official listing says remote worldwide; work is aligned with U.S. Eastern hours','At least 3 years of professional mobile application development experience and demonstrated work on both iOS and Android','Strong proficiency in Swift/SwiftUI and Kotlin/Jetpack Compose, or cross-platform React Native/TypeScript or Flutter/Dart','Must have shipped or supported production apps in Apple App Store and Google Play; API integration, authentication, push notifications, testing, Git and mobile CI/CD experience required','Pay, contract terms and payment schedule are not disclosed; confirm them before accepting','Apply only through the official Arca.ph role page; do not pay an intermediary to secure an introduction'],
  official:'https://arca.ph/careers/jobs/mobile-engineer-ios-android-2423',
  secondary:'https://arca.ph/careers/jobs',
  secondaryLabel:'Arca.ph official current open roles',
  cta:'View official role and apply',
  verified:'2026-11-05'
 },

 {
  id:'luel-ai-data-collection-iphone-location-check',name:'Luel — iPhone AI Data Collection App (Payout Country Unconfirmed)',status:'location-check',badge:'IPHONE ONLY • PH APP STORE LISTING • PAYOUT COUNTRY UNCONFIRMED • HIGH BIOMETRIC/VOICE RIGHTS RISK',
  summary:'Luel is an iPhone-only AI data-collection app listed in the Philippines App Store. Tasks may include voice/audio, video, images, daily activities, live conversations and document collection. The App Store description advertises payouts in 40+ countries through Wise or Stripe bank transfer (Venmo is US-only), but Luel does not publicly identify the supported payout countries or confirm Philippine withdrawals. The App Store’s November 5 version 1.0.5 update says new-contributor sign-up has been restored and the payout screen now shows the minimum required to request withdrawal. This is a location-check listing, not verified Philippine income.',
  requirements:['Requires an iPhone running iOS 16 or later; the app is free to download in the Philippines App Store; the Terms require users to be at least 18 or the age of majority in their jurisdiction','The App Store lists Wise and Stripe bank transfer as payout methods and Venmo for U.S. users, but no public country list or Philippine payout confirmation was found; verify that a Philippines payout account can be configured before doing any task','High privacy and intellectual-property warning: Luel’s Terms grant a perpetual, irrevocable, worldwide, sublicensable and transferable license over contributor content, including personal information, biometric data, voice, likeness and images, for use, sale, licensing and transfer to AI-data customers','The Terms expressly permit creating synthetic/digital replicas from contributor voice, likeness and other identifying attributes; they state Luel owns those digital replicas and related derivative works, and contributors assign the associated rights','Once content has been sold or licensed to a business, the Terms say that sale/license is final and the contributor cannot recall the business copy or demand removal from trained models; rejected submissions may receive no compensation and rates, caps and eligibility may change','Do not submit children’s images or voices, private family recordings, confidential documents, IDs, financial information, or other people’s content without informed consent and the necessary rights','Only consider participation after reading the current Terms and Privacy Notice, confirming Philippine payout availability in the app, and deciding whether the broad biometric, voice, likeness and digital-replica rights are acceptable; do not treat the advertised 40+ countries as proof that the Philippines is supported'],
  official:'https://apps.apple.com/ph/app/luel/id6760899231',
  secondary:'https://www.luel.ai/terms',
  secondaryLabel:'Luel official Terms of Service (last modified September 17, 2026)',
  tertiary:'https://www.luel.ai/privacy',
  tertiaryLabel:'Luel official Privacy Notice',
  cta:'Review app listing, payout availability and terms before participating',
  verified:'2026-11-05'
 }, {
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
  verified:'2026-11-05'
 },
 {
  id:'welo-cursa-qc',name:'Welo Data — Project Cursa Video Annotation QC (V2)',status:'active-ph',badge:'PHILIPPINES • REMOTE • QUALITY REVIEW',
  summary:'Official remote freelance quality-review role for checking robotics-video annotations and giving specific feedback. Advertised pay: USD $4.03 per hour; hours and selection are not guaranteed.',
  requirements:['Philippines is explicitly eligible on the official listing','Excellent written English, spatial reasoning, detailed checking and constructive feedback required','Prior QC, proofreading or annotation-review experience is useful'],
  official:'https://jobs.lever.co/weloglobal/9bd19b88-42a1-4681-9625-120ea954f16c',
  cta:'Apply on official Welo listing',
  verified:'2026-11-05'
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
  id:'doola-customer-care-agent-ph',name:'doola — Customer Care Agent (Remote Philippines)',status:'active-ph',badge:'PHILIPPINES • FULL-TIME REMOTE • 2+ YEARS SUPPORT EXPERIENCE • PAY NOT DISCLOSED',
  summary:'doola currently lists a full-time remote Customer Care Agent role explicitly open to applicants working remotely from the Philippines. The role supports customers by email and phone, resolves account/business-formation questions, maintains case records and escalates complex issues. Pay is not disclosed.',
  requirements:['The official employer-hosted Lever listing explicitly includes Remote in Philippines; full-time remote role','Requires at least 2 years of customer-service experience; chat or phone support preferred','Strong written and verbal communication, ability to handle multiple conversations, meet response/resolution/customer-satisfaction KPIs, keep accurate records and solve problems','Work includes real-time email and phone support, follow-up, escalation and keeping customers informed; HubSpot, Intercom or other help-desk experience is a bonus','Salary, shift, equipment, employment classification, Philippine payroll/contract terms and benefits are not disclosed on the listing; confirm these in writing before accepting','Apply only through the official doola Lever listing. No application fee is advertised; never pay for screening, training, equipment or placement'],
  official:'https://jobs.lever.co/doola/999a0f10-0738-42f7-a9f6-5c7192e74873',
  secondary:'https://jobs.lever.co/doola?location=Remote+in+Latin+America',
  secondaryLabel:'Official doola remote job listings',
  cta:'Apply through the official doola listing',
  verified:'2026-11-04'
 },

 {
  id:'doola-tax-reviewer-ph',name:'doola — Tax Reviewer (Remote Philippines)',status:'active-ph',badge:'PHILIPPINES • FULL-TIME REMOTE • ACTIVE EA/CPA + PTIN REQUIRED • PAY NOT DISCLOSED',
  summary:'doola lists a permanent, full-time remote Tax Reviewer role explicitly open to Remote in Philippines. The reviewer checks U.S. federal and state business income-tax returns, calculations, documentation and compliance, and helps resolve technical tax issues. Compensation is not disclosed.',
  requirements:['The official employer-hosted listing explicitly includes Remote in Philippines; permanent, full-time remote role','Requires an active Enrolled Agent (EA) or CPA license and an active PTIN, or ability to obtain a PTIN before tax season','Requires experience reviewing federal and state business income-tax returns; strong knowledge of quarterly estimates, tax notices and tax dispute resolution','Experience with Forms 1120, 5472 and 1065 is specifically required, particularly for non-U.S. business owners and partnerships','Work includes reviewing returns, identifying errors, researching U.S. federal/state tax rules, guiding preparers and sometimes speaking with clients by email or video','Pay is not disclosed. Confirm compensation, schedule, equipment, employment classification and Philippine work/payroll terms in writing before accepting','This is a credentialed tax-professional role, not an entry-level data-entry job. Apply only through the official doola Lever listing; no application fee is advertised'],
  official:'https://jobs.lever.co/doola/66c28540-e255-4c66-8092-fd0745105c43',
  cta:'Apply through the official doola listing',
  verified:'2026-11-04'
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
  id:'philippine-startup-week-2026',name:'Philippine Startup Week 2026 — Founder & Investor Networking Conference',status:'location-check',badge:'QUEZON CITY • NOVEMBER 9–12, 2026 • FREE PARTICIPANT PRE-REGISTRATION',
  summary:'The official Philippine Startup Week portal lists the four-day conference at the M.I.C.E. Center in Quezon City for November 9–12, 2026; it starts tomorrow, November 9. The government registration page lists free participant pre-registration; exhibitor, community-event and pre-event submissions require review and approval. The November 10 schedule includes an investor stage with Gobi Partners, Foxmont Capital Partners and Kickstart Ventures, plus DOST’s “HEADSTART: From Grant to Growth” session. These are networking and learning opportunities, not grants, jobs or guaranteed investment awards.',
  requirements:['Starts tomorrow, Monday, November 9; event dates: November 9–12, 2026; venue: M.I.C.E. Center, Quezon City','The official info portal is live at phsw.startup.gov.ph and its Pre-Register button routes to the government Startup Philippines registration page. The indexed registration page lists Participant pre-registration as free; exhibitor, community-event and pre-event submissions are reviewed and require approval','The registration page is dynamically rendered and the static web reader shows only its shell; if the form does not load, use the official portal button or contact startup.web@dict.gov.ph rather than an unofficial form','IGNITE X 2026 takes place November 10; registration opens at 8:30 AM and the Luma page says host approval is required. No separate attendance price is displayed for IGNITE X; confirm any fee or participation conditions before travel','The November 10 main-event schedule lists an investor stage from 10:20–11:30 AM with Gobi Partners, Foxmont Capital Partners and Kickstart Ventures, plus DOST’s “HEADSTART: From Grant to Growth” session from 1:00–5:00 PM in Vinta Hall; attendance does not guarantee investor meetings or funding','The published venues are in Quezon City. No virtual-attendance option or travel support was confirmed; do not assume remote participation','Do not confuse the closed Startup World Cup Philippines application (deadline October 30, 2026) with registration to attend IGNITE X or Philippine Startup Week'],
  official:'https://phsw.startup.gov.ph/',
  secondary:'https://startup.gov.ph/phsw-register/',
  secondaryLabel:'Official government registration page — participant pre-registration listed as free',
  moreLinks:[
   {label:'Official November 10 main-event schedule — investor stage and DOST HEADSTART session',url:'https://phsw.startup.gov.ph/main-event/'},
   {label:'IGNITE X 2026 official event details',url:'https://ignite.ph/'},
   {label:'IGNITE X registration — host approval required',url:'https://luma.com/rdibkjhw'},
   {label:'Official IIDB announcements',url:'https://ph.linkedin.com/company/dict-iidb'}
  ],
  cta:'Pre-register through the official Startup Week portal',
  verified:'2026-11-08'
},
 {
  id:'dost-pcieerd-dut-2026',name:'DOST-PCIEERD — Driving Urban Transition (DUT) 2026 Grant',status:'location-check',badge:'PHILIPPINES • INTERNATIONAL RESEARCH CONSORTIUM • DEADLINE NOV 17, 2026',
  summary:'An official open DOST-PCIEERD concept-proposal call under the Driving Urban Transition Partnership. It supports transnational urban research/innovation, not unrestricted startup operating cash. The Philippine call has three eligible topic areas and allocates up to PHP 25,000,000 across a maximum of three projects for the full three-year duration, not PHP 25 million per applicant.',
  requirements:['Concept proposal deadline: November 17, 2026 at 5:00 PM Philippine time through the DOST Project Management Information System (DPMISv2). Late submissions are not accepted','Consortium must include at least three partners from three participating countries; at least two partners must be from countries eligible for EC co-funding','Eligible Philippine proponents include Filipino public or private entities with proven competence. Filipino researchers should be connected to public/private universities or colleges, Research and Development Institutes, or qualified startups, especially DOST-supported Technology Business Incubators. The Philippine Principal Investigator must hold at least a relevant master’s degree and provide capability/track-record evidence and institutional endorsement','The three Philippine call topics are (1) innovative maintenance of urban green and blue spaces; (2) positive-energy-district solutions in private housing across different urban contexts; and (3) sustainable positive energy districts, energy-system flexibility and integrated technologies','For startup proponents, the call requests authenticated DTI registration or SEC incorporation documents and latest GIS, business permit and licenses, latest income tax returns, audited financial statements and other financial reports, disclosure of other businesses, and required sworn affidavits from owners/officers','Required proposal materials include the DOST proposal form, workplan, agency-head endorsement, Gender and Development score sheet, letter of intent/cooperation and consortium proposal. The official pre-proposal template and submission guidelines are linked below','The call says the grant covers 100% of project cost while the applicant organization must provide at least 15% counterpart funding in cash or kind, except for public-good projects. Confirm exact budget treatment with DOST-PCIEERD before preparing figures','Capital/infrastructure costs and master’s/PhD student stipends are excluded. Only concept proposals approved in this stage may proceed to full proposals, scheduled February 2027 to April 15, 2027','This is a demanding R&D consortium opportunity. A normal software or AI startup is not eligible unless its project genuinely fits the urban-transition topics and it can meet the Filipino-PI, institutional, consortium and counterpart requirements'],
  official:'https://pcieerd.dost.gov.ph/work-with-us/2026-dost-pcieerd-dut-call-for-proposal-concept-proposal/',
  secondary:'https://pcieerd.dost.gov.ph/wp-content/uploads/2026/09/DUT-Call-2026_Preproposal-template.docx',
  secondaryLabel:'Official pre-proposal template',
  tertiary:'https://dpmisv2.dost.gov.ph/',
  tertiaryLabel:'DOST e-Proposal portal',
  cta:'Review official grant and eligibility',
  verified:'2026-11-04'
},
 {
  id:'bettergovph-fellowship-2026',name:'BetterGovPH Fellowship — Civic Technology Pilot Cohort',status:'active-ph',badge:'PHILIPPINES • APPLICATION DEADLINE NOV 17, 2026 • ₱450K SHARED PROJECT FUND',
  summary:'A three-month civic-technology fellowship jointly organized by BetterGovPH, WeSolve Foundation, the Philippine Open Government Partnership and the Department of Budget and Management, with partner agencies and civil-society groups. The fellowship website says it is not an official government website; this is a partner-run fellowship, not a DICT/DBM grant call. Individuals, teams, organizations and informal groups can apply. Applications close November 17, 2026 (nine days from this check). The official page lists a gross ₱450,000 funding pool shared among selected fellows/projects according to approved budgets; the fund is still being raised, the amount per team is not guaranteed, and this is not employment.',
  requirements:['Applications close Tuesday, November 17, 2026. The pilot cohort runs December 2026–March 2027, with weekly sprints, mentorship, technical consultations, government engagement and Demo Day','Eligible applicants include civic-technology developers, software engineers, data scientists/analysts, product designers/UX specialists, open-data practitioners, researchers, technologists, student developers/academic teams, civic-tech organizations and volunteer groups','Apply as an individual, team, existing organization or informal group. Applicants must demonstrate they can commit time and effort throughout the fellowship period','Selected fellows must deliver a working civic-tech solution, platform enhancement, data tool, dashboard or API service; provide technical/data-schema documentation, source repository and deployment instructions; and participate in the program','Projects address public challenges including e-government, open data/FOI, budget and procurement, education, infrastructure monitoring, health, energy, gender and development, local-government transparency and accountability','Gross funding pool is PHP 450,000 shared among selected fellows, teams and/or team members based on approved project budgets. Funding is subject to taxes/deductions, does not constitute employment, and the official page says the organizers are still raising the fellowship fund; do not assume a guaranteed stipend or award','Outputs are encouraged to be released under open licenses. If applying with an existing commercial product, clarify IP and licensing terms first and submit only a separately scoped public-interest component you are willing to license as required','The official page links to the application form and guidelines. Do not pay intermediaries or anyone promising selection or a guaranteed share of the pool'],
  official:'https://fellowship.bettergov.ph/',
  secondary:'https://docs.google.com/presentation/d/1aQ9yRlwcRfA15OIKaje5XHaPI1-af0fJ85dP313qvUs/htmlpresent',
  secondaryLabel:'Official fellowship guidelines',
  cta:'Apply through official BetterGovPH page',
  verified:'2026-11-08'
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
  summary:'The USTP-CDO Technology Business Incubator official homepage and current application page confirm Cohort 10 is accepting applications through December 30, 2026 for 20 startups, with hybrid delivery. The site advertises access to ₱5M+ in grant and funding programs; this is a competitive funding pathway, not a guaranteed ₱5M award to each applicant.',
  requirements:['The official application page welcomes early-stage founders, student founders, faculty spin-offs, alumni founders and external innovators across sectors including AgriTech, FoodTech, EdTech, HealthTech, GovTech, FinTech, ClimateTech and CreativeTech','Program delivery is hybrid and based at USTP-CDO in Cagayan de Oro. No nationwide residency rule is published, but applicants outside Northern Mindanao should confirm travel, participation and eligibility before applying','The site advertises mentorship, free IP support, free business-registration assistance, prototyping access, ecosystem connections, investor/demo-day exposure and 0% equity','The official application page labels Cohort 10 open, with a December 30, 2026 deadline and a target of 20 startups. The application collects startup and personal information and requires explicit Data Privacy Act consent','The old deep link containing the cohort query parameter timed out during verification; the current official application page at /incubate/apply loads and should be used instead','Grant access is competitive; the site advertises ₱5M+ in grant and funding programs but does not publish a guaranteed per-startup award or individual disbursement terms. Do not treat the headline as guaranteed income','The official page labels application free. Do not pay intermediaries or anyone promising guaranteed admission or grant awards'],
  official:'https://cdobites.com/incubate/apply',
  secondary:'https://cdobites.com/',
  secondaryLabel:'Official CDObites TBI homepage',
  cta:'Open current official Cohort 10 application',
  verified:'2026-11-04'
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
  summary:'Applications closed October 30, 2026 at 11:59 PM Philippine time. On November 3, the Philippine organizer announced seven regional finalists: CrisisOps, Pickers, Pili AdheSeal, Proficio, Rezbin, Saltric Power and TalentHero. They will pitch at IGNITE X on November 10; one will represent the Philippines in San Francisco for the global US$1 million investment prize. This is a competition outcome, not a grant or guaranteed award for every applicant. The official Philippines Apply button had routed to a page headed MAURITIUS REGIONAL COMPETITION; do not submit through that mismatched form.',
  requirements:['Applications closed October 30, 2026 at 11:59 PM PHT; this is no longer an open application opportunity','The official organizer announced the seven Philippine regional finalists on November 3: CrisisOps, Pickers, Pili AdheSeal, Proficio, Rezbin, Saltric Power and TalentHero. They are scheduled to pitch at IGNITE X on November 10, 2026','One finalist will represent the Philippines in San Francisco and compete for the global US$1 million investment prize; this is not a guaranteed grant or cash award for every finalist','The official IGNITE X Luma event page still contains stale Startup World Cup copy showing an October 26 deadline and linking to the Mauritius application route. That copy is outdated: the Philippines application closed October 30 and the organizer announced the seven finalists on November 3. Do not use the stale Luma application link or submit Philippine company information through it','Keep this listing for finalist/event tracking only; reactivate applications only if the official Philippines organizer publishes a new call with a corrected route and deadline','Do not pay an unverified application fee or send confidential pitch materials through a mismatched or unofficial form'],
  official:'https://www.startupworldcup.io/philippines-2026',
  secondary:'https://ignite.ph/swc',
  secondaryLabel:'Philippine organizer updates',
  cta:'View event status and finale details',
  verified:'2026-11-04'
 },

 {
  id:'egocapture-indonesia-only-ph-watch',name:'EgoCapture — Robotics Household Video Data Collection (Indonesia-Only Tasks)',status:'location-check',badge:'ANDROID + IPHONE • APP LISTED IN PH • TASKS CURRENTLY INDONESIA ONLY',
  summary:'EgoCapture by GL Technology Holdings is a free phone app for recording everyday household tasks for robotics training. Its Philippines App Store listing currently says “Now collecting in Indonesia.” The app describes payment per approved hour of footage, but no Philippine tasks, rates or payout eligibility are confirmed. Keep this as a watch item only—not a Philippine earning recommendation.',
  requirements:['The app is listed in the Philippines App Store and Google Play, but the official Philippines App Store description explicitly says it is now collecting in Indonesia; no Philippines task or payout route was verified as of November 4, 2026','Available for Android and iPhone; the Philippines iPhone listing requires iOS 17.0 or later. The app is free to install and supports Filipino language, but language and store availability do not prove country eligibility','The developer says contributors are paid per hour of footage that passes quality review; the task-specific rate is shown in the app. No public Philippine rate, payment method or cash-out threshold was verified','Do not buy a head/neck mount or record anything until the app itself displays a live Philippine task, its exact payment terms and a working payout method','The app instructions require clear first-person footage of hands during chores; the developer says not to record children or bathrooms/changing areas and says unapproved recordings can be deleted before approval','Privacy review required: Apple lists email, phone, photos/videos, audio and identifiers as data that may be linked to the user; Google Play says personal information, photos/videos and app activity may be collected and encrypted in transit. Review consent and deletion terms before uploading','Never record children, bystanders, private conversations, IDs, screens, financial details or anyone without consent; never pay an intermediary to unlock tasks'],
  official:'https://apps.apple.com/ph/app/egocapture-get-paid-to-record/id6809194022',
  secondary:'https://play.google.com/store/apps/details?id=ai.roboloop.egocapture',
  secondaryLabel:'Official Android Google Play listing',
  tertiary:'https://roboloop.ai/',
  tertiaryLabel:'Official developer website',
  cta:'Check country eligibility only; do not treat as open in the Philippines',
  verified:'2026-11-04'
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
  id:'usertesting-global-ph-location-check',name:'UserTesting — Paid Website, App & Product Tests',status:'location-check',badge:'GLOBAL TESTER NETWORK • PHILIPPINES SUPPORT CHECK REQUIRED • VERIFIED PAYPAL',
  summary:'UserTesting’s Applicant FAQ, updated November 3, 2026, says contributors are welcome from around the world but directs applicants to confirm country support through sign-in or support. A separate October 14 country-filter guide lists the Philippines among additional markets for Classic studies; that is a customer-side recruitment list, not a guarantee that every new Philippine applicant will be accepted. Test rewards are shown before acceptance and are usually paid to a verified PayPal account 14 days after completion. The practice test is unpaid and UserTesting does not withhold taxes.',
  requirements:['Free registration; applicants must be at least 18, create a profile, set up PayPal and pass the practice test. The practice test is unpaid','The November 3, 2026 Applicant FAQ says UserTesting welcomes contributors worldwide, but applicants must confirm that their actual country is supported by signing in or contacting support','The October 14, 2026 Additional country filters article includes the Philippines among the additional markets for Classic research. This is a customer-side recruiting feature and does not guarantee that a new Philippine account will be accepted or that every study type is available','Use the real country where you live. U.S. citizenship does not justify selecting a U.S. residence while physically living in the Philippines; never use a VPN, proxy or another person’s PayPal account to bypass a location check','UserTesting currently supports testing in English, French and German; applicants must speak, read and write fluently in one of those languages','Each test displays its reward before acceptance; the practice test is unpaid and invitations are not guaranteed. Formats include surveys, recorded website/app tests and scheduled live conversations','A verified PayPal account is mandatory. Payments usually arrive 14 days after test completion. UserTesting does not withhold taxes; contributors are responsible for reporting income as required in their country','Mobile minimums: latest two iOS versions or Android 10+; computer tests require a supported OS/browser, microphone and at least 5 Mbps upload speed','Read each test’s recording notice and privacy terms; do not reveal passwords, financial account details, private messages or confidential documents'],
  official:'https://www.usertesting.com/get-paid-to-test',
  secondary:'https://support.usertesting.com/hc/en-us/articles/4405063917075-Applicant-FAQ',
  secondaryLabel:'Official applicant FAQ — updated November 3, 2026',
  tertiary:'https://help.usertesting.com/hc/en-us/articles/11880337236253-Additional-country-filters',
  tertiaryLabel:'Official country-filter guide — Philippines listed for Classic studies',
  cta:'Check actual Philippines eligibility at official sign-up',
  verified:'2026-11-08'
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
  id:'gcash-quick-rewards-hustle-ph',name:'Hustle PH — GCash Quick Rewards + Standalone iPhone Missions',status:'active-ph',badge:'PHILIPPINES • FREE • GCASH / MAYA • IPHONE APP + GCASH ROUTE • 18+',
  summary:'Hustle PH is a Philippines-only consumer-research and micro-mission panel. The official company site confirms a GCash Quick Rewards route; the current Philippines App Store also lists a free standalone iPhone app. Missions include surveys, store checks, mystery shopping, product reviews, purchase-experience feedback, quality checks, beta tests, interviews and group discussions. Rewards are paid only after a mission is reviewed and approved; no universal mission rate is published.',
  requirements:['The official GCash route is GCash → View All → Earn Money → Quick Rewards. The company says GCash respondents must be fully KYC-verified and at least 18 years old','The standalone Hustle PH iPhone app is free, rated 18+ and requires iOS 15.5 or later. Its App Store listing says approved missions pay to GCash or Maya','Tasks can be online or location-based. Store checks and mystery-shopping missions may require travel or purchases; read the mission details, location, reimbursement terms, deadline and exact reward before accepting','The app listing says most missions take under five minutes, but this is a marketing estimate, not a guaranteed completion time. Mission availability varies by campaign, city and participant profile','Every standalone-app mission is reviewed before payment; rejected submissions are not guaranteed to be paid. No universal mission rate, minimum cash-out or fixed weekly earnings are published','For the GCash Quick Rewards route, the official Help Center says review typically takes about 5–7 working days and successful withdrawals should reach GCash within 24–48 hours. The Help Center does not publish a universal rate or minimum withdrawal','For foreign nationals residing in the Philippines, GCash lists a Philippine SIM and an accepted resident ID for verification; accepted examples include ACR, SRRV, Philippine driver’s license, DFA Diplomat ID or DOLE Alien Employment Permit. A foreign passport alone is not listed for the resident-with-PH-SIM category; confirm exact documents with GCash','Privacy warning: the iPhone app privacy label says the app may link precise/coarse location, physical address, email, name, phone, photos/videos, device ID, sensitive information and other data to the user. Review the privacy policy and grant only necessary permissions','No fee is required by the official app or guide. Never pay to unlock missions and never share GCash MPIN, OTP, password or recovery codes. Do not photograph people, children, private homes or personal documents without permission'],
  official:'https://help.gcash.com/hc/en-us/articles/40213432323481-What-is-Quick-Rewards-by-Hustle-PH',
  secondary:'https://hustle-ph.com/',
  secondaryLabel:'Official Hustle PH / Agile Data Solutions site',
  tertiary:'https://apps.apple.com/ph/app/hustle-ph/id6474293403',
  tertiaryLabel:'Official Philippines iPhone app listing',
  moreLinks:[
   {label:'Official GCash accepted-ID rules',url:'https://help.gcash.com/hc/en-us/articles/900000948786-Accepted-IDs-for-GCash-verification'},
   {label:'Official Agile Data Solutions company site',url:'https://www.agiledatasolutions.tech/'}
  ],
  cta:'Open official Hustle PH guide or iPhone app',
  verified:'2026-11-04'
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
  id:'google-opinion-rewards-ph',name:'Google Opinion Rewards — Not Available in the Philippines',status:'waitlist',badge:'PHILIPPINES NOT ON CURRENT ANDROID OR IOS SURVEY-ELIGIBILITY LISTS',
  summary:'Google’s current official country lists do not include the Philippines for Google Opinion Rewards. The Android list currently covers 39 countries, while the iOS list is limited to Canada, France, Germany, the United Kingdom and the United States. A localized Google Play listing may be visible, but listing visibility does not make Philippine residents eligible to receive surveys.',
  requirements:['As of November 4, 2026, the official Android availability list does not include the Philippines; users must be in a supported country and over 18 to receive surveys','The official iOS availability list currently names only Canada, France, Germany, the United Kingdom and the United States; the Philippines is not included','Do not assume that a Filipino-language Google Play listing means the app pays in the Philippines; Google uses supported-country eligibility and account-country rules','Do not install unofficial APKs, change your account country falsely or use a VPN to bypass eligibility; no legitimate Philippine payout path was verified'],
  official:'https://support.google.com/opinionrewards/answer/6322274?hl=en',
  secondary:'https://support.google.com/opinionrewards/answer/7386064?hl=en',
  secondaryLabel:'Official iOS country eligibility list',
  tertiary:'https://play.google.com/store/apps/details?hl=fil&id=com.google.android.apps.paidtasks',
  tertiaryLabel:'Google Play listing in Filipino — listing visibility does not confer PH eligibility',
  cta:'Check Google’s official country lists',
  verified:'2026-11-04'
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
  id:'prolific',name:'Prolific',status:'waitlist',badge:'PH NEW SIGN-UPS WAITLIST ONLY • SMALL EXISTING PH PANEL',
  summary:'Prolific’s current participant-onboarding country list excludes the Philippines, so new Philippines-based applicants are directed to the waitlist and are not guaranteed an invitation. A separate researcher-facing panel snapshot does count a small existing Philippines participant population. These two official pages are not contradictory about existing participants versus new sign-ups: do not advertise Prolific as open Philippine registration until the participant onboarding list includes the Philippines.',
  requirements:['The current participant identity-verification/onboarding FAQ excludes the Philippines from its supported-country list and says residents of unsupported countries may join the waitlist; invitations are not guaranteed','A separate researcher-facing panel snapshot dated June 18, 2026 lists a small existing participant population in the Philippines. That is evidence of existing panel members, not proof that new PH registration is open','Eligibility is based on current country of residence, not citizenship. Prolific requires the phone number, ID/residence details and PayPal account to match the country of residence when invited to complete onboarding','Prolific requires PayPal as its participant payment method; do not use a U.S. PayPal/account address or VPN to bypass Philippine residence restrictions','Re-check the official participant onboarding country list before applying; only change this record to active-PH if that onboarding page explicitly adds the Philippines'],
  official:'https://www.prolific.com/participants-join-us',
  secondary:'https://participant-help.prolific.com/en/articles/445010-verifying-my-identity-faq',
  secondaryLabel:'Official participant onboarding and supported-country list',
  tertiary:'https://researcher-help.prolific.com/en/articles/445224-who-are-the-participants-on-prolific',
  tertiaryLabel:'Researcher-facing participant population snapshot',
  cta:'View official participant information',
  verified:'2026-11-04'
 },
 {
  id:'alignerr-ai-training-specialist',name:'Alignerr — AI Training, Data Labeling & Evaluation Roles',status:'active-ph',badge:'PHILIPPINES-LISTED ROLES • REMOTE CONTRACT • USD $40–$120/HR ADVERTISED',
  summary:'Alignerr has an employer-posted Philippines Data Labeling Specialist listing and additional Philippines LinkedIn postings for several remote AI-evaluation roles. Its official job pages advertise USD $40–$120/hour, 10–40 hours/week and weekly payouts. The headline range is not a guaranteed rate or workload: actual pay, project matching, paid hours and availability depend on skills and the assignment. Some linked official pages are labeled Remote/General rather than Philippines-specific, so confirm that the project accepts a Philippines-based contractor before completing assessments.',
  requirements:['The Data Labeling Specialist has a Philippines-specific employer LinkedIn listing. Additional Philippines postings include Video Annotation Specialist, Audio Quality Reviewer, Document Review Specialist, Social Media Content Evaluator and AI Data Quality Analyst; confirm country eligibility at each application. The earlier Film Scene Description Specialist employer listing is closed and is not an active example.','The employer advertises USD $40–$120/hour, 10–40 hours/week and weekly payouts on its official pages; this is a posted range, not a promise of the maximum rate, paid hours or continuing assignments','Several roles require no prior AI experience. Skills vary: careful visual observation and structured writing for film scenes; headphones and attentive listening for audio review; strong reading comprehension for document review; current social-media knowledge for content evaluation; and analytical English writing for AI quality review','Work is remote contract work using web-based tools. A reliable computer, internet connection and ability to follow detailed guidelines are expected; the audio role specifically asks for headphones or earbuds','Ask the official recruiter to confirm the actual project rate, whether screening/training is paid, payment terms, contractor eligibility from the Philippines and current task volume before accepting','Apply only through the official Alignerr job pages or the employer’s verified LinkedIn postings. Never pay an application, screening, training, equipment or release fee; never send passwords, OTPs or crypto recovery phrases'],
  examples:['Data Labeling Specialist — text, image and audio classification (Philippines-specific LinkedIn listing)','Film Scene Description Specialist — CLOSED: employer LinkedIn posting 4423301045 now says applications are no longer accepted; do not use stale job-board mirrors','Audio Quality Reviewer — listen for clarity, distortion, pronunciation and transcript accuracy','Document Review Specialist — classify and extract structured information from documents','Social Media Content Evaluator — assess AI-generated posts for tone, relevance and cultural fit','AI Data Quality Analyst — evaluate AI outputs for accuracy, relevance and consistency'],
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
  verified:'2026-11-06'
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
  id:"rws-cebuano-conversation-recording",
  name:"RWS TrainAI — AI Conversation Recording Contributor (Cebuano)",
  status:'closed',
  badge:'CLOSED • DIRECT JOB AND APPLICATION ROUTES RETURN 404 • CHECK RWS FOR FUTURE ROLES',
  summary:'The RWS TrainAI board still displays a stale Cebuano contributor card, but the job-specific page and its /apply route both return HTTP 404 as of November 8, 2026. The listing is therefore closed for application purposes; do not use copies of the dead job link. The official RWS TrainAI board remains available for future openings.',
  requirements:['The job-specific application page and the direct /apply route both return HTTP 404; the stale card on the RWS job board is not an application route','No replacement live Cebuano conversation-recording application was verified in this check. Do not send identity or payment documents through reposted copies of the expired link','The official RWS TrainAI board is retained below only so members can browse future openings. A new role must have a live employer page and working application before it is reactivated'],
  official:'https://jobs.lever.co/rws?team=TrainAI',
  cta:'Browse official RWS TrainAI listings for future roles',
  verified:'2026-11-08'
 },
 {
  id:"imerit-ai-trainer-video-annotation-ph",
  name:"iMerit — AI Trainer, Video Annotation (Philippines)",
  status:"active-ph",
  badge:"PHILIPPINES • REMOTE CONTRACT • NO PRIOR AI EXPERIENCE • PAY NOT DISCLOSED",
  summary:"iMerit's employer-posted Philippines opportunity asks contractors to review short robotics and everyday-action videos, identify objects and actions, assess clarity and plausibility of movement, and rate video quality. The employer says no prior AI, robotics or video-annotation experience is required. Three projects were described as available in the current posting, but certification is required and passing it does not guarantee assignment.",
  requirements:["The employer's LinkedIn listing identifies the Philippines and describes the work as fully remote, independent-contractor project work","No prior AI, robotics or video-annotation experience is required; strong written English, careful observation, analytical thinking and the ability to follow detailed instructions are required","Tasks include identifying objects, actions and events, reviewing camera angles and visibility, rating video clarity and evaluating whether movements are clear and plausible","The employer says three projects are currently available, but candidates must complete a certification process and project allocation depends on assessment results and project needs; certification does not guarantee a paid assignment","Pay, guaranteed hours, payout frequency and the exact project duration are not disclosed. Confirm the actual rate, available work, payment method and whether certification is paid before accepting","The official iMerit careers site also lists AI Trainer - Video Annotation among its country-specific contractor roles; use the employer's own listing and careers site rather than third-party copies","Do not pay an application, certification, training, equipment or release fee. Do not send passwords, OTPs or banking login details to recruiters"],
  official:"https://ph.linkedin.com/jobs/view/ai-trainer-%E2%80%93-video-annotation-at-imerit-4485325548",
  secondary:"https://imerit.ai/careers-listing/",
  secondaryLabel:"Official iMerit careers portal",
  cta:"Review employer posting and careers portal",
  verified:"2026-11-06"
 },
 {
  id:"innodata-robotics-annotator-rater-remote-ph",
  name:"Innodata — Robotics Annotator Rater (New Employer Posting)",
  status:"active-ph",
  badge:"PHILIPPINES • 100% REMOTE • PROJECT-BASED THROUGH DEC 31 • PAY NOT DISCLOSED",
  summary:"A newer employer-posted Innodata LinkedIn listing is currently open for a 100% remote, project-based Robotics Annotator Rater assignment. The project is listed for October 28–December 31, 2026, with working hours still to follow. This is a newer posting, not the older duplicate that LinkedIn marked closed.",
  requirements:["The current employer-posted LinkedIn listing identifies Mandaue, Philippines and states 100% remote work; it is a project-based contract scheduled October 28–December 31, 2026","The current listing requires a graduate of any four-year college course. Prior data annotation, AI training, video/image evaluation, QA, transcription or captioning experience is an advantage, not a stated requirement","Work involves reviewing household-task videos, identifying valid actions, marking accurate start/end timestamps, identifying hand designation and writing concise Natural Language Descriptions under project guidelines","You must have your own desktop or laptop and stable high-speed internet; mobile devices are explicitly unsupported","Working hours are still to follow and pay is not disclosed. Confirm the exact rate, schedule, paid onboarding, project continuity and payout terms before accepting","The older employer posting ID 4465962689 is closed; use only the newer employer listing ID 4476406055 and do not rely on third-party reposts of the closed predecessor","Never pay recruitment, training, equipment, assessment or release fees and never provide banking passwords, OTPs or account recovery codes"],
  official:"https://ph.linkedin.com/jobs/view/robotics-annotator-rater-work-from-home-at-innodata-inc-4476406055",
  cta:"Open the current employer-posted listing",
  verified:"2026-11-06"
 },
 {
  id:"welo-ai-trainers-global-portal",
  name:"Welo Data — AI Trainers Global Contributor Portal",
  status:"location-check",
  badge:"GLOBAL REMOTE • 100+ LANGUAGE PAIRS • COUNTRY ELIGIBILITY AT SIGN-UP • TASK PAY VARIES",
  summary:"Welo Data has launched a dedicated AI Trainers portal for people who contribute language, cultural, everyday or professional expertise to AI training and evaluation. The official site advertises remote, schedule-flexible project work and says most projects do not require formal credentials or prior AI experience. It does not publish a definitive country list or a universal rate, so Philippine onboarding and the actual project terms must be confirmed in the official portal.",
  requirements:["The official site advertises more than 500,000 contributors worldwide and support for 100+ language pairs; these are company-reported network figures, not a promise of work for each applicant","Project areas include everyday knowledge and culture, linguistics, law, coding, medicine, mathematics, finance and STEM; project matching and qualification depend on the applicant's actual skills","The site says most projects do not require an AI background or formal credential, but contributors must complete a skills assessment aligned with their expertise and not everyone is accepted","Work is described as fully remote and schedule-flexible, with no minimum hours; task volume and country availability vary by project. The official site does not publish a country-by-country eligibility list, so confirm that the portal accepts the Philippines before completing assessments","Compensation varies by task type, complexity and project volume. The company says payment is issued after completed project work, while the exact payment method, frequency and earnings visibility are confirmed during onboarding; no guaranteed hourly rate or income is published","Requires a computer or laptop, stable internet and a modern browser; some specialized projects may require additional language, software or technical skills","Welo Data explicitly says it will never ask contributors to pay fees, buy equipment or share sensitive information outside its secure platforms. Apply only through the official portal and require an official agreement before starting"],
  official:"https://aitrainers.tech/",
  secondary:"https://app.welodata.ai/auth/sign-up-or-login",
  secondaryLabel:"Official Welo Data AI Trainers application portal",
  cta:"Check official global contributor eligibility",
  verified:"2026-11-06"
 },
 {
  id:"telus-tagalog-linguist-expert-ai-community",
  name:"TELUS International AI Data Solutions — Tagalog Linguist Expert (AI Community)",
  status:"location-check",
  badge:"PHILIPPINES • PART-TIME • ADVANCED TAGALOG LINGUISTICS • PAY AND REMOTE STATUS UNDISCLOSED",
  summary:"TELUS has an employer-posted Philippines role for a Tagalog Linguist Expert in its AI Community. The work evaluates speech AI, pronunciation, prosody, dialect variation, transcription accuracy and linguistic quality for text-to-speech and speech-recognition systems. It is a specialist role, not beginner annotation work; the public posting does not state a pay rate or explicitly confirm remote work.",
  requirements:["The employer listing identifies the Philippines and describes a part-time role; it does not state whether work can be performed remotely from outside Metro Manila, so confirm work location before applying","Requires either a bachelor's degree in Linguistics, Phonetics, Phonology, Speech-Language Pathology, Computational Linguistics, Language Sciences or a related discipline, or at least two years of relevant professional linguistic/speech-analysis experience","Native-level Tagalog (C1/C2+) is mandatory, along with professional English (B1+) and a subject-specific linguistic assessment; identity verification is required after application","Work includes evaluating TTS pronunciation, naturalness, rhythm, intonation and emotional register; reviewing ASR transcription errors; analyzing phonetics, morphology, syntax and dialect variation; and annotating speech datasets","Familiarity with IPA/SAMPA, spectrogram analysis, acoustic phonetics, prosodic analysis, dialectology and speech datasets is useful; this is not a general-purpose voice-recording task","Pay, hours, project duration and payment terms are not disclosed. Ask the employer to confirm these and the remote-work arrangement before proceeding","Use the employer-posted TELUS listing only. Never pay recruitment, assessment, training or equipment fees or share passwords and OTPs"],
  official:"https://ph.linkedin.com/jobs/view/tagalog-linguist-expert-ai-community-at-telus-international-ai-data-solutions-4482081515",
  cta:"Review specialist requirements with TELUS",
  verified:"2026-11-06"
 },
 {
  id:"welo-robotics-video-qa-expert-ph",
  name:"Welo Data — Robotics Video QA & Annotation Expert",
  status:"location-check",
  badge:"QUEZON CITY LISTING • FULL-TIME • WORK MODE AND PAY NOT DISCLOSED",
  summary:"Welo Data has a new employer-posted full-time Philippines listing for a Robotics Video QA & Annotation Expert. The role reviews robot-manipulation video annotations for language accuracy, labeling detail and consistency across camera views. The public listing shows Quezon City but does not state whether the job is remote, hybrid or onsite, and it does not publish compensation.",
  requirements:["The employer-posted listing identifies Quezon City and full-time employment; no remote or work-from-home arrangement is stated, so do not assume applicants in Negros Oriental can perform it remotely","Work includes checking robot-manipulation video annotations against a style guide, finding missing or incorrect object references and missed failure events, providing actionable feedback and maintaining a quality-control log","The public posting does not disclose salary, required years of experience, schedule, contract duration or equipment. Confirm all of these and the work location before applying","This is a quality-control/specialist role, not a beginner phone task or guaranteed freelance assignment","Apply only through the employer-posted Welo Data listing and never pay a recruiter or intermediary"],
  official:"https://ph.linkedin.com/jobs/view/robotics-video-qa-annotation-expert-at-welo-data-4485853829",
  secondary:"https://www.welodata.ai/",
  secondaryLabel:"Official Welo Data website",
  cta:"Check location and employment terms first",
  verified:"2026-11-06"
 },

 {
  id:"huint-paid-photo-tasks-ph-not-supported",
  name:"Huint — Paid Photo Tasks (Philippines Not Supported)",
  status:"location-check",
  badge:"PHILIPPINES NOT SUPPORTED • IPHONE ONLY • ANDROID PLANNED EARLY 2027",
  summary:"Huint is a legitimate-looking iPhone photo and real-world verification task marketplace, but its own Terms of Service currently restrict taskers to 12 payout-supported countries: Australia, Canada, France, Germany, Ireland, Italy, Japan, Mexico, the Netherlands, Spain, the United Kingdom and the United States. The Philippines is not on that list, so this is not currently a Philippine earning opportunity.",
  requirements:["Huint requires taskers to be at least 18 and physically located in one of its 12 supported payout countries; the Philippines is explicitly absent from the published list","Tasks involve location-based photos, observations and verification. The app says it shows the task requirements and pay before acceptance; accepted submissions are reviewed before payment","The official site says payouts are made to a bank through Stripe. It does not publish a universal pay rate or guaranteed task volume; the amount is shown per task before acceptance","The current app is iPhone-only and requires iOS 17 or later. Huint's official site says Android is planned for early 2027, not currently available","Apple's privacy label says the app may collect precise and approximate location, photos/videos, payment information, contact details, identifiers, usage data and diagnostics. Review the privacy policy and do not capture private homes, people or sensitive material without permission","Do not install through unofficial app packages or use a false country, address, bank account or VPN to bypass payout restrictions. Recheck the official supported-country list before reconsidering"],
  official:"https://huint.io/",
  secondary:"https://huint.io/terms",
  secondaryLabel:"Official Huint Terms and supported-country list",
  tertiary:"https://apps.apple.com/us/app/huint-paid-photo-tasks/id6773487476",
  tertiaryLabel:"Official Apple App Store listing",
  cta:"Check supported countries before considering",
  verified:"2026-11-06"
 },

 {
  id:"alignerr-ai-chatbot-tester-ph",
  name:"Alignerr — AI Chatbot Tester (Philippines)",
  status:"active-ph",
  badge:"PHILIPPINES • FULLY REMOTE • USD $40–$120/HR ADVERTISED • NO PRIOR AI EXPERIENCE",
  summary:"Alignerr's employer-posted Philippines contract asks contributors to converse with AI chatbots, test varied scenarios and edge cases, and rate responses for helpfulness, accuracy, tone and safety. The listing is entry-level, fully remote and says no prior AI or technical experience is required. Alignerr advertises USD $40–$120/hour, but the actual rate depends on skills and experience and is not guaranteed.",
  requirements:["The employer listing identifies the Philippines, fully remote work and an hourly independent contract with an advertised commitment of 10–40 hours per week","No prior AI or technical experience is required. Applicants should be naturally curious, comfortable exploring different topics, able to judge answers objectively and write clear, precise English feedback","Work includes open-ended chatbot conversations, testing unusual or edge-case prompts, checking factual accuracy, tone, helpfulness, consistency and safety, and recording findings in structured feedback forms and rating rubrics","Alignerr advertises a base pay range of USD $40–$120/hour and states that the actual rate is based on skills and experience. This is not a guaranteed rate, minimum number of hours or guaranteed project assignment; confirm the written project rate, paid hours, assessment terms and payout schedule before accepting","The public posting does not promise a fixed contract duration or guaranteed weekly workload; projects and extensions depend on demand","Apply through the employer-posted Alignerr listing or its official website. Never pay an application, assessment, training, equipment or release fee; do not provide passwords, OTPs or banking login details"],
  official:"https://ph.linkedin.com/jobs/view/ai-chatbot-tester-at-alignerr-4483798512",
  secondary:"https://www.alignerr.com/",
  secondaryLabel:"Official Alignerr website",
  cta:"Review the employer-posted remote contract",
  verified:"2026-11-06"
 },
 {
  id:"alignerr-robotics-technician-video-data-ph",
  name:"Alignerr — Robotics Technician (AI Training Video Collection)",
  status:"active-ph",
  badge:"PHILIPPINES • REMOTE • SMARTPHONE OR CAMERA • USD $40–$120/HR ADVERTISED",
  summary:"Alignerr's new Philippines contract pays contributors to record ordinary household or workplace activities for robotics AI training. The employer says no robotics, engineering or AI background is required; a smartphone or camera, reliable internet and the ability to follow recording instructions are required. The advertised USD $40–$120/hour range is employer-published but not guaranteed.",
  requirements:["The employer listing identifies the Philippines, fully remote work and an hourly contract with an advertised commitment of 10–40 hours per week","No robotics, engineering or AI background is required. Contributors need a smartphone or camera capable of clear video, reliable internet for uploads and the ability to follow detailed recording sequences and metadata instructions","Tasks may include recording ordinary activities such as cooking, cleaning, organizing, folding laundry or opening doors in an approved home or workspace, then uploading video and completing simple metadata forms","Alignerr advertises USD $40–$120/hour; the actual rate depends on skills and experience. Confirm the assigned rate, paid recording time, accepted-task rules, upload requirements and payment schedule in writing. Task volume and paid hours are not guaranteed","Privacy and consent are essential: record only the task and approved space. Do not include children, visitors, other household members, coworkers, private conversations, IDs, screens, financial papers, medical information or personal documents. Obtain clear consent from every identifiable person and stop recording if anyone enters the frame without consent","Check storage, upload limits and mobile data use before accepting tasks; large video files may require Wi-Fi and significant device storage","Apply only through the official employer listing. Never pay for a task slot, training, equipment, assessment or payout release"],
  official:"https://ph.linkedin.com/jobs/view/robotics-technician-at-alignerr-4484415288",
  secondary:"https://www.alignerr.com/",
  secondaryLabel:"Official Alignerr website",
  cta:"Review the phone-video task contract and privacy rules",
  verified:"2026-11-06"
 },
 {
  id:"alignerr-content-reviewer-ph",
  name:"Alignerr — Content Reviewer (AI Training)",
  status:"active-ph",
  badge:"PHILIPPINES • FULLY REMOTE • USD $40–$120/HR ADVERTISED • ENTRY LEVEL",
  summary:"Alignerr's Philippines Content Reviewer contract evaluates AI-generated text for clarity, accuracy, tone and overall quality. The employer describes it as fully remote and entry-level, with no prior AI, technical or editorial experience required. Strong English reading comprehension and objective written feedback are essential.",
  requirements:["The employer listing identifies the Philippines, fully remote work and an hourly contract with an advertised commitment of 10–40 hours per week","No prior AI, technology or editorial experience is required. Applicants need strong English reading comprehension, clear written communication, critical thinking and the ability to explain quality judgments","Work includes reviewing AI-generated text across topics such as news, culture, science and everyday life, flagging misleading or inappropriate content, and submitting structured ratings and written notes","Alignerr advertises USD $40–$120/hour; the actual rate depends on skills and experience. Confirm the assigned rate, project volume, paid assessment terms, contract duration and payout schedule; no minimum hours or earnings are guaranteed","The listing describes asynchronous independent work, but does not promise a fixed number of assignments or continuing work","Use the employer-posted Alignerr listing or official website only. Never pay an application, assessment, training or payout fee"],
  official:"https://ph.linkedin.com/jobs/view/content-reviewer-at-alignerr-4484415303",
  secondary:"https://www.alignerr.com/",
  secondaryLabel:"Official Alignerr website",
  cta:"Review the employer-posted remote contract",
  verified:"2026-11-06"
 },
 {
  id:"alignerr-image-description-specialist-ph",
  name:"Alignerr — Image Description Specialist (AI Training)",
  status:"active-ph",
  badge:"PHILIPPINES • FULLY REMOTE • USD $40–$120/HR ADVERTISED • ENTRY LEVEL",
  summary:"Alignerr's Philippines Image Description Specialist contract involves writing clear, detailed descriptions of photos, illustrations, diagrams and charts so AI systems can learn to interpret visual content. The employer says no photography, art or AI background is required; strong observation and descriptive written English are important.",
  requirements:["The employer listing identifies the Philippines, fully remote work and an hourly contract with an advertised commitment of 10–40 hours per week","No photography, art or AI background is required. Applicants need strong observation, clear descriptive English, attention to detail and the ability to follow structured annotation guidelines","Work includes describing visual elements such as objects, scenes, people, actions and spatial relationships in photos, illustrations, diagrams and charts; output must be consistent, accurate and detailed","Alignerr advertises USD $40–$120/hour; the actual rate depends on skills and experience. Confirm the assigned rate, paid assessment terms, project volume, duration and payout schedule before accepting; no minimum hours or earnings are guaranteed","The posting describes independent asynchronous work but does not promise ongoing projects or a fixed weekly workload","Apply only through the official employer listing or Alignerr website. Never pay application, assessment, training, equipment or release fees"],
  official:"https://ph.linkedin.com/jobs/view/image-description-specialist-at-alignerr-4484402664",
  secondary:"https://www.alignerr.com/",
  secondaryLabel:"Official Alignerr website",
  cta:"Review the employer-posted remote contract",
  verified:"2026-11-06"
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
  id:'rise-data-labs-global-expert-network',name:'Rise Data Labs — Global Expert Network for AI Training & Evaluation',status:'active-ph',badge:'GLOBAL REMOTE CONTRACTS • ADVANCED EXPERTS • FINANCE ROLE USD $150/HR',
  summary:'Rise Data Labs’ official portal has a live Global Finance Expert contract at USD $150/hour, with an immediate start and an ideal 40 hours/week for two weeks (minimum 20 hours/week). Its page explicitly says Global / all countries welcome. A separate Finance Expert listing on the portal advertises USD $50–$100/hour, but the older direct link previously stored in the Vault now returns 404; use the official opportunities board for that separate listing. Legal and Healthcare expert roles remain separately listed at USD $50–$150/hour. This is advanced professional work, not beginner annotation; selection and project hours are not guaranteed.',
  requirements:['The live Global Finance Expert page explicitly says all countries welcome, so a U.S. citizen residing in the Philippines may apply if the professional requirements are met; list actual residence and confirm contractor/tax onboarding rather than selecting a false U.S. work location','The USD $150/hour Global Finance project seeks experienced finance professionals in investment banking, private equity, investment research, asset management, financial modeling/valuation, corporate finance/FP&A, accounting or related fields. Prior AI training is helpful but not required','The Global Finance role says start immediately, ideally 40 hours/week for two weeks and minimum 20 hours/week. The published rate applies to selected project work; no continuing work or minimum total earnings are guaranteed','The official board separately lists a Finance Expert role at USD $50–$100/hour; its previous direct URL returned 404, so use the official board rather than stale copies for that role','Legal & Paralegal Expert: USD $50–$150/hour; professional experience in paralegal work, legal research, legal operations, attorney or compliance work','Healthcare Expert: USD $50–$150/hour; relevant professional experience and qualifications/licensure where applicable','The network application includes a profile, interview and skills assessment. Approval does not guarantee a project; check each project’s rate, hours, deadline and country terms before accepting','The official portal says approved work is paid weekly. No application or release fee is listed; never pay to join, unlock tasks or receive earnings, and never share passwords or OTPs'],
  official:'https://experts.risedatalabs.com/',
  secondary:'https://experts.risedatalabs.com/jobs/finance-expert-ai-training-evaluation-global-jvaaq',
  secondaryLabel:'Finance Expert — Global, USD $150/hour, 20–40 hours/week for two weeks',
  moreLinks:[
   {label:'Legal & Paralegal Expert — USD $50–$150/hour, global',url:'https://experts.risedatalabs.com/jobs/legal-paralegal-expert-%E2%80%94-ai-training-evaluation-0qn42'},
   {label:'Healthcare Expert — USD $50–$150/hour, global',url:'https://experts.risedatalabs.com/jobs/healthcare-expert-%E2%80%94-ai-training-evaluation-x5d4n'},
   {label:'Older QuickBooks/Sales Operations project (posted Sep 11; confirm still available)',url:'https://experts.risedatalabs.com/jobs/quickbooks-expert-with-sales-operations-experience-l7q1d'}
  ],
  cta:'Join official expert network and review projects',
  verified:'2026-11-08'
 },
 {
  id:'respondent-ph-paid-research',name:'Respondent — Paid Research Studies & Interviews',status:'active-ph',badge:'PHILIPPINES • FREE PARTICIPANT SIGN-UP • REMOTE RESEARCH',
  summary:'Respondent’s official participant panel lists approximately 103,000 Philippines participants and USD $84,000 in incentives paid in the country, and its help centre includes the Philippines among its primary target markets. Participant sign-up is free. Its current participant page says most sessions pay USD $50–$250 depending on length and seniority; the help centre gives more specific illustrative ranges of USD $40–$150 for remote interviews and USD $5–$25 for short unmoderated tasks. Researchers select participants, so invitations and income are not guaranteed.',
  requirements:['Respondent’s official panel snapshot lists about 103,000 participants in the Philippines and USD $84,000 in total incentives paid there; its help centre also lists the Philippines as a primary target market','Participant sign-up is free and does not require a credit card; the participant page says most people receive about 1–3 study invitations per month, but selection and income are not guaranteed','Complete an accurate profile and apply only to studies that genuinely match your experience, occupation and location; researchers choose participants','Screening questionnaires are unpaid; do not treat screeners or study invitations as guaranteed income','After the researcher confirms attendance/completion, incentives are delivered through Tremendous, typically 7–10 business days later','Respondent deducts a 5% fulfillment fee with a USD $1 minimum; available gift cards or payout options depend on the Philippines redemption catalogue at the time of payment','Tremendous currently lists GCash as a possible Philippines monetary redemption option, but Respondent says payout options are sender-configured and vary by participant/payment; GCash is not guaranteed on every reward. Check the exact redemption screen before accepting if you need GCash; never pay anyone to qualify or release a reward'],
  official:'https://www.respondent.io/become-a-participant',
  secondary:'https://help.respondent.io/en/articles/5471299-what-countries-can-i-recruit-in-on-respondent',
  secondaryLabel:'Official country-market information',
  tertiary:'https://help.respondent.io/en/articles/12552519-getting-paid-on-respondent-timeline-currencies-how-to-redeem',
  tertiaryLabel:'Official payout timing, options and fees',
  cta:'Join as a participant — free',
  verified:'2026-11-04'
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
  id:'lifepoints-ph-surveys',name:'LifePoints — Philippines Paid Surveys & Mobile Rewards',status:'active-ph',badge:'PHILIPPINES • FREE TO JOIN • IPHONE + WEB • ANDROID LINK CHECK',
  summary:'LifePoints is a Philippines market-research panel operated by Lightspeed/Kantar. Registration is free and the current PH sign-up page advertises a 10-LifePoints welcome bonus. The official guide says surveys average about 10–20 minutes. Reward values and survey frequency vary, so this is supplemental rewards activity rather than guaranteed income.',
  requirements:['The official LifePoints Help Centre lists the Philippines among supported survey markets; use the Philippines panel and provide truthful profile details','Free registration; the current PH sign-up page advertises 10 LP welcome points. No special skills are required. The points offered for each survey are shown before starting; survey availability and earnings vary','The official PH rewards catalogue lists PayPal, Amazon, Lazada, GCash, Globe, GrabFood, GrabGifts, Smart, UNICEF and other options. Exact redemption thresholds and availability can change and should be checked in the signed-in account','The official Philippines website says the app can be downloaded from the App Store or Google Play. The current iPhone App Store listing is free, rated 16+ and requires iOS 15.1 or later. A direct Philippines-region Google Play listing could not be independently confirmed in this check; use the official website store links rather than guessed app IDs','The official how-it-works page mentions polls and diaries, but the current rewards page says LifePoints does not offer mystery shopping or product testing. Treat the core earning method as online surveys; do not assume paid product-testing tasks','Privacy warning: the iPhone App Store privacy label (developer-supplied and not independently verified by Apple) lists identifiers and usage data used for tracking, plus email, name, physical address, coarse location and customer-support content linked to the user; it also lists health/fitness, financial and sensitive information as categories that may be collected but not linked. The official app page claims advanced encryption and says it does not sell personal information. The PH website also says optional cookies/pixels may transfer data to third parties outside the country if accepted; review privacy and cookie choices before joining','The official membership terms allow suspension if no survey is started within the first 30 days after joining or if no survey is started within any 90-day period; LifePoints then expire. Start at least one survey within the first 30 days and participate in at least one survey every 90 days to keep the account active; points may be forfeited if the account is closed','No fee is required to join. Use only the official panel and app-store publisher links; never pay anyone to join or release rewards'],
  official:'https://www.lifepointspanel.com/en-ph/registration',
  secondary:'https://www.lifepointspanel.com/en-ph/lifepoints-app',
  secondaryLabel:'Official LifePoints Philippines app information',
  tertiary:'https://apps.apple.com/ph/app/lifepoints-paid-surveys-app/id1508335904',
  tertiaryLabel:'Official Philippines iPhone app listing',
  moreLinks:[
   {label:'Official Philippines rewards catalogue',url:'https://www.lifepointspanel.com/en-ph/rewards'},
   {label:'Official supported-country list',url:'https://lifepoints.zendesk.com/hc/en-id/articles/360024807931-Who-can-join-LifePoints'}
  ],
  cta:'Join the official Philippines panel',
  verified:'2026-11-04'
},
 {
  id:'ipsos-isay-ph-maintenance-check',name:'Ipsos iSay — Philippines Surveys & GCash Rewards (Access Check)',status:'location-check',badge:'PHILIPPINES • FREE SURVEYS • GCASH/GIFT CARD REWARDS • DIRECT ACCESS UNVERIFIED',
  summary:'The official Philippines panel and indexed rewards pages currently describe free membership, paid surveys and local rewards. The indexed official catalogue lists GCash PHP 100 for 1,150 points, GCash PHP 200 for 2,300 points, GrabGifts PHP 200 for 2,300 points, Xoxoday PHP 100 for 1,000 points and an Ipsos Foundation PHP 50 donation for 500 points. Automated direct retrieval of the English and Filipino panel/rewards pages returned HTTP 403 on November 4, so interactive sign-up, login, stock and redemption could not be independently verified. Keep this as a legitimate location-check listing, not guaranteed cash income.',
  requirements:['Membership is free according to the official Philippines joining FAQ; survey invitations, qualification and earnings depend on profile and available studies and are not guaranteed','The indexed official Philippines catalogue currently lists GCash PHP 100 = 1,150 points; GCash PHP 200 = 2,300 points; GrabGifts PHP 200 = 2,300 points; Xoxoday PHP 100 = 1,000 points; and an Ipsos Foundation PHP 50 donation = 500 points. Reward stock and point costs can change; confirm in the signed-in catalogue before spending points','The official Philippines rewards FAQ requires newly registered members to wait 96 hours before redeeming. Points remain available only while the membership stays active; digital gift cards are delivered to the registered email and are generally non-refundable after issue','Automated direct retrieval returned HTTP 403 for the official English and Filipino Philippines pages on November 4, 2026. Indexed official content is visible, but this check could not verify the live interactive sign-up, account login, current reward stock or redemption path','Survey point amounts are shown before each survey and can vary with survey length; completing a profile does not itself earn points','Do not submit identity or payment details through social-media messages, WhatsApp links or unofficial mirror sites. Use only the official Ipsos iSay domain; never pay an intermediary to join or release rewards'],
  official:'https://www.ipsosisay.com/en-ph/',
  secondary:'https://www.ipsosisay.com/en-ph/rewards',
  secondaryLabel:'Official Philippines rewards catalogue',
  tertiary:'https://www.ipsosisay.com/en-ph/faq-rewards-redeeming-points',
  tertiaryLabel:'Official Philippines redemption rules and 96-hour new-member hold',
  cta:'Check the official Philippines panel and reward catalogue',
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
 },

 {
  id:'meta-viewpoints-ph-iphone',name:'Meta Viewpoints — iPhone Surveys, Tasks & Research Programs',status:'location-check',badge:'PHILIPPINES APP STORE • IPHONE ONLY • PROGRAMS NOT GUARANTEED',
  summary:'Meta Viewpoints is a free iPhone app listed in the Philippines App Store. It offers points for participating in surveys, tasks and research programs, and says participants receive program-specific data-use details before deciding whether to join. The app may notify users when programs become available, but no current Philippine task schedule, pay rate, points-to-cash conversion or redemption threshold is published.',
  requirements:['The official Philippines App Store listing says the app is free, iPhone only and requires iOS 15.1 or later','Programs may include surveys, tasks, research and product trials. You receive points only for programs successfully completed; the app says it will notify you when programs become available. No task frequency or earnings are guaranteed','No official Philippines pay rate, cash value per point, withdrawal threshold or payout timetable was verified; check the exact reward and payment method shown inside each program before joining','The app says it explains what data a program collects and how it will be used before participation, and that users decide whether to join. Do not accept a program until its data terms and required permissions are clear','Important privacy warning: Apple’s App Privacy label lists potentially linked financial/payment information, precise and coarse location, name/email/phone, contacts, audio and other user content, identifiers, usage data and sensitive information. Review the program-specific notice and deny permissions that are not needed for the task','The App Store listing says Meta does not sell Viewpoints information to third parties and does not publicly share activity on linked accounts without permission; still review the full terms and privacy policy before enrolling','No Android Philippines listing was verified in this check; do not install APKs or unofficial copies'],
  official:'https://apps.apple.com/ph/app/meta-viewpoints/id1474938269',
  secondary:'https://viewpoints.facebook.com/',
  secondaryLabel:'Official Meta Viewpoints site',
  tertiary:'https://www.facebook.com/help/viewpoints/tos',
  tertiaryLabel:'Official Viewpoints terms (Meta login may be required)',
  cta:'Review the official iPhone app and program terms',
  verified:'2026-11-04'
 },
 {
  id:'sss-dict-freelancer-protection-2026',name:'SSS–DICT Freelancer Social Protection Partnership (MOU)',status:'location-check',badge:'PHILIPPINES • FREELANCER PROTECTION • NOT A GRANT OR JOB',
  summary:'SSS and DICT signed an MOU on October 21, 2026, announced by SSS on October 30, to expand social-security awareness and coverage for Filipino freelancers and virtual assistants. It encourages eligible freelancers to register as self-employed SSS members and explores future skills development, job creation and matching initiatives. This is a social-protection policy partnership, not a cash grant or new paid-job program.',
  requirements:['The MOU aims to increase SSS awareness, registration, membership and compliance among Filipino freelancers and online workers; it does not announce a separate grant, stipend or new job application form','Eligible self-employed members may qualify for sickness, maternity, disability, retirement, funeral and death benefits, and may apply for SSS salary, emergency and micro-loan programs subject to the applicable loan rules and qualifying conditions','The SSS article states a 15% contribution rate and a self-employed Monthly Salary Credit range of ₱5,000–₱35,000. It lists monthly contributions from ₱760 at the minimum to ₱5,280 at the maximum, including Employees’ Compensation and Mandatory Provident Fund components','Contributions are not free. Review the current SSS contribution schedule and your actual earnings before registering or committing to payments','The MOU describes future joint initiatives for freelancer education, partnerships, job creation and matching, but no new enrollment schedule or dedicated program portal was announced as of November 4, 2026','The announcement specifically targets Filipino freelancers and virtual assistants; eligibility for non-Filipino residents is not clarified. Contact SSS before assuming that a foreign resident can enroll under this partnership','Use only the official SSS website and My.SSS channels. Do not pay intermediaries who promise special membership, loans or guaranteed benefits'],
  official:'https://www.sss.gov.ph/news-and-updates/sss-dict-sign-partnership-to-expand-social-security-coverage-for-freelancers-2/',
  secondary:'https://www.sss.gov.ph/self-employed/',
  secondaryLabel:'Official SSS self-employed coverage and registration rules',
  tertiary:'https://www.sss.gov.ph/news-and-updates/',
  tertiaryLabel:'Official SSS news and updates',
  cta:'Review official SSS freelancer coverage details',
  verified:'2026-11-04'
 },

 {
  id:'premise-contributor-ph-mobile-tasks',name:'Premise Contributor — Local Photo, Data Collection & Survey Tasks',status:'location-check',badge:'PH APP STORE • ANDROID + IPHONE • PAYOUT METHODS COUNTRY-DEPENDENT',
  summary:'Premise is a free mobile task marketplace for local information, photo submissions and surveys. Its Philippines App Store listing describes tasks such as photographing local conditions, construction zones, store prices and community events. The official contributor site says payouts can be made through PayPal, Payoneer or Bitcoin depending on country, but the specific Philippine payout methods and thresholds were not published in the sources checked.',
  requirements:['Free contributor app and account; the official Philippines iPhone listing is rated 18+ and requires iOS 15.0 or later','Tasks may include local photo capture, prices, store information, traffic/construction observations, community events and surveys. Task availability changes with project demand and location; check the in-app marketplace for your city before spending time','The official contributor site lists PayPal, Payoneer or Bitcoin as possible payout methods depending on the country. Philippine-specific methods, cash-out minimums and exact task rates were not verified; do not assume GCash or Maya support','The official site says contributors choose tasks in the marketplace and are paid after completing accepted work. There is no guaranteed number of tasks or earnings per day','The iPhone App Privacy label lists location, contact information, photos/videos, audio and other user content, browsing history, identifiers, usage data and sensitive information as data that may be collected or linked to the user. Review the privacy policy and permissions before joining','Android app is published by Premise Data Corp. on Google Play, and the official contributor site supports iOS and Android; however, a Philippines-region Play listing could not be independently confirmed in this check','Use only the official Premise app and contributor website. Do not submit photos of private people, children, IDs, private property or restricted locations without valid consent; never pay an intermediary to unlock tasks'],
  official:'https://contributors.premise.com/',
  secondary:'https://apps.apple.com/ph/app/premise-earn-money/id1390094962',
  secondaryLabel:'Official Philippines iPhone app listing',
  tertiary:'https://play.google.com/store/apps/developer?hl=en_US&id=Premise+Data+Corp.',
  tertiaryLabel:'Official Premise Data Corp. Google Play developer page',
  cta:'Review official contributor payout and privacy terms',
  verified:'2026-11-04'
 },
 {
  id:'startup-ph-program-directory-status-check',name:'Startup Philippines Program Directory — Stale Open-Status Warning',status:'location-check',badge:'OFFICIAL GOVERNMENT DIRECTORY • STATUS / DATE CONFLICT',
  summary:'The official Startup Philippines program directory currently indexes several programs with an “Open” status even though their displayed start dates have already passed as of November 4, 2026. Examples include QBO Accelerator (start date June 1, 2026), IdeaSpace Incubation (July 15, 2026) and DOST-CRADLE Grant (May 30, 2026). The dynamic program cards did not render in the static page reader, so current intake availability could not be confirmed.',
  requirements:['The directory is an official DICT/DOST/DTI government platform, but its indexed Open labels conflict with start dates in May–July 2026 that are already past','Do not treat QBO Accelerator, IdeaSpace Incubation or DOST-CRADLE as accepting new applications solely because the directory says Open; ask the program owner to confirm the current cohort, remaining slots, deadline, award amount and application route','The directory also lists rolling mentorship and upcoming programs with past start dates; verify each program individually before submitting business documents','Contact Startup Philippines through startup.web@dict.gov.ph or its official contact page and ask for a current written confirmation. Do not pay agents who promise access to government programs','Startup Philippines registration is free, but registration or verification does not guarantee eligibility for grants, funding or incentives. This directory-status issue is separate from the pending DICT Startup Grant Fund 2026 call'],
  official:'https://startup.gov.ph/programs',
  secondary:'https://startup.gov.ph/contact/',
  secondaryLabel:'Official Startup Philippines contact page',
  cta:'Verify program status with the government portal',
  verified:'2026-11-04'
 },
 {
  id:"neonlink-ai-enabled-executive-assistant-ph",
  name:"Neon Link — AI-Enabled Executive Assistant (Philippines Remote)",
  status:"active-ph",
  badge:"PHILIPPINES • REMOTE • PHP 46,000–58,000/MONTH • US NIGHT SHIFT • 3+ YEARS EA/VA",
  summary:"Neon Link's official careers page lists a Philippines-based remote AI-enabled executive assistant contract supporting a US founder or small-business owner. The work covers inbox and calendar management, travel, CRM upkeep, follow-ups, AI-assisted drafting and simple automations. The advertised range is PHP 46,000–58,000 per month; the engagement may be project-based or full-time depending on the client.",
  requirements:["The employer says remote anywhere in the Philippines; Monday–Friday during US business hours, which means night shift in the Philippines; exact shift is set with the client","Requires 3+ years as an executive assistant or virtual assistant directly supporting US founders or business owners; strong Google Workspace or Microsoft 365, daily practical AI-tool use and at least one automation built in Zapier, Make, n8n, Power Automate or similar","Work includes inbox triage and approved replies, calendar management across US time zones, travel planning, CRM updates, follow-up ownership, AI-assisted research/drafting and weekly founder summaries","Advertised pay: PHP 46,000–58,000/month. The listing describes contract, project-based or full-time engagement depending on the client; confirm the exact written offer, benefits, schedule and payment terms","Requires own computer with at least 16 GB RAM and Core i5/Ryzen 5/Apple M-series or better, webcam, noise-cancelling headset, fiber internet of at least 50 Mbps plus backup connection, UPS/generator and a quiet private workspace","The employer says a confidentiality agreement and current NBI clearance are required. Because the role accesses a founder's email, calendar and accounts, use only client-provisioned accounts and their password manager; never store credentials or payment details on a personal account","Neon Link says it never charges to apply, test, train or start and only contacts applicants from neonlink.ai email addresses. Do not pay for equipment, training, screening or job placement"],
  official:"https://neonlink.ai/careers/job/ai-enabled-executive-assistant/",
  secondary:"https://neonlink.ai/careers/",
  secondaryLabel:"Neon Link official current roles and applicant-safety rules",
  cta:"Review official role and apply",
  verified:"2026-11-06"
 },
 {
  id:"neonlink-ai-video-editor-ph",
  name:"Neon Link — AI Video Editor (Philippines Remote)",
  status:"active-ph",
  badge:"PHILIPPINES • REMOTE • PHP 46,000–70,000/MONTH • AI VIDEO PORTFOLIO REQUIRED",
  summary:"Neon Link's official careers page lists a Philippines remote AI Video Editor contract creating short-form and advertising videos for US businesses. Work uses standard editing tools plus AI-generated footage, avatars and voiceovers. Advertised pay is PHP 46,000–70,000/month, with US business-hours night shifts Monday–Friday.",
  requirements:["The employer says remote anywhere in the Philippines; Monday–Friday on US business hours (night shift locally), weekends off; exact shift is set with the client","Requires either 2+ years editing short-form or advertising video for brands/businesses, or a channel/page the applicant grew using short-form video, with a portfolio","Requires hands-on published work using AI video tools such as Veo, Kling or Runway plus avatar/voice tools such as HeyGen, Synthesia or ElevenLabs; strong Premiere Pro, DaVinci Resolve, Final Cut, CapCut or similar, captions and basic motion graphics","Advertised pay: PHP 46,000–70,000/month, including the night-hours rate. Contract may be project-based or full-time depending on the engagement; confirm written rate and workload","Requires own editing computer with at least 16 GB RAM, Core i7/Ryzen 7/Apple M-series and a dedicated GPU on Windows, webcam/headset, fiber internet of at least 50 Mbps plus backup, UPS/generator and quiet workspace","The employer requires confidentiality and a current NBI clearance. Keep client footage, scripts and unreleased assets in client accounts; do not publish them in a portfolio without written permission. Use only voices and likenesses the client has rights to use","Neon Link says it never charges to apply, test, train or start and only contacts applicants from neonlink.ai email addresses. Never pay for equipment, assessments or placement"],
  official:"https://neonlink.ai/careers/job/ai-video-editor/",
  secondary:"https://neonlink.ai/careers/",
  secondaryLabel:"Neon Link official current roles and applicant-safety rules",
  cta:"Review official role and apply",
  verified:"2026-11-06"
 },
 {
  id:"neonlink-ai-automation-specialist-ph",
  name:"Neon Link — AI Automation Specialist (n8n, Make, Zapier)",
  status:"active-ph",
  badge:"PHILIPPINES • REMOTE • PHP 58,000–74,000/MONTH • 2+ YEARS AUTOMATION",
  summary:"Neon Link's official careers page lists a Philippines remote AI Automation Specialist contract building client workflows with n8n, Make or Zapier, APIs/webhooks and LLM steps. Advertised pay is PHP 58,000–74,000/month for a full-time client engagement; earlier project work is priced per project in advance.",
  requirements:["The employer says remote anywhere in the Philippines, with at least 3 hours of overlap with US business hours for calls and handoffs; exact engagement schedule depends on the client","Requires 2+ years building automations for real users in n8n, Make, Zapier, Power Automate or a similar platform; practical APIs, webhooks, JSON and authentication knowledge; at least one working LLM-enabled workflow; enough JavaScript or Python to write code steps","Work includes mapping a client's manual process, connecting CRMs/inboxes/spreadsheets/accounting tools through APIs and webhooks, adding LLM classification/extraction/summarization/drafting with human approval, retries, duplicate protection, alerts, logs and runbooks","Advertised pay: PHP 58,000–74,000/month for a full-time client engagement, depending on experience; project work before that is paid per project at a rate agreed up front. Confirm the written rate, hours and contract terms","Requires own computer with at least 16 GB RAM and Core i5/Ryzen 5/Apple M-series or better, webcam/headset, fiber internet of at least 50 Mbps plus backup, UPS/generator and quiet workspace","The employer requires a confidentiality agreement and current NBI clearance. Build inside client-owned accounts, keep credentials and API keys in the client's password manager, and hand over admin access and connection documentation","Neon Link says it never charges to apply, test, train or start and only contacts applicants from neonlink.ai email addresses. Do not pay an intermediary or buy equipment to secure a role"],
  official:"https://neonlink.ai/careers/job/ai-automation-specialist/",
  secondary:"https://neonlink.ai/careers/",
  secondaryLabel:"Neon Link official current roles and applicant-safety rules",
  cta:"Review official role and apply",
  verified:"2026-11-06"
 },
 {
  id:"neonlink-gohighlevel-ai-specialist-ph",
  name:"Neon Link — GoHighLevel AI Specialist (Agents, Workflows, CRM)",
  status:"active-ph",
  badge:"PHILIPPINES • REMOTE • PHP 49,000–58,000/MONTH • 2+ YEARS GOHIGHLEVEL",
  summary:"Neon Link's official careers page lists a Philippines remote GoHighLevel AI Specialist contract building CRM pipelines, workflows, funnels, Conversation AI and voice agents for US small businesses. Advertised pay is PHP 49,000–58,000/month.",
  requirements:["The employer says remote anywhere in the Philippines; Monday–Friday during US business hours (night shift locally), weekends off; exact shift is set with the client","Requires 2+ years building in GoHighLevel for a real business or agency, including workflows, pipelines, funnels, forms and calendars; hands-on Conversation AI or voice AI with real leads; webhooks and integrations through Zapier, Make or n8n","Work includes lead follow-up and appointment automations, AI chat/voice agents with human handoff, CRM pipelines and data hygiene, funnels/forms/calendars, integrations and reporting","Advertised pay: PHP 49,000–58,000/month, including the night-hours rate. Engagement may be project-based or full-time depending on the client; confirm the exact offer, hours and payment terms","Requires own computer with at least 16 GB RAM and Core i5/Ryzen 5/Apple M-series or better, Windows 10/11 or macOS, webcam, noise-cancelling headset, fiber internet of at least 50 Mbps plus backup, UPS/generator and quiet workspace","The employer requires a confidentiality agreement and current NBI clearance. Work only in client-provisioned accounts; keep lead lists, logins and API keys out of personal accounts","Neon Link says it never charges to apply, test, train or start and only contacts applicants from neonlink.ai email addresses. Do not pay for placement, onboarding or equipment"],
  official:"https://neonlink.ai/careers/job/gohighlevel-ai-specialist/",
  secondary:"https://neonlink.ai/careers/",
  secondaryLabel:"Neon Link official current roles and applicant-safety rules",
  cta:"Review official role and apply",
  verified:"2026-11-06"
 },
 {
  id:"neonlink-ai-agent-engineer-ph",
  name:"Neon Link — AI Agent Engineer (MCP, Agent SDKs, Claude Code)",
  status:"active-ph",
  badge:"PHILIPPINES • REMOTE • PHP 90,000–130,000/MONTH • ADVANCED",
  summary:"Neon Link's official careers page lists a Philippines remote AI Agent Engineer contract building tool-using agents and MCP servers for US businesses. Advertised pay is PHP 90,000–130,000/month for a full-time client engagement; earlier project work is priced per project in advance.",
  requirements:["The employer says remote anywhere in the Philippines, with at least 3 hours of overlap with US business hours for calls and handoffs","Requires 2+ years shipping software in Python or TypeScript, including at least one agent that takes real actions with tools; hands-on tool calling and an agent framework/SDK such as Claude Agent SDK, OpenAI Agents SDK or LangGraph; built or extended an MCP server or comparable tool integration; and practical evaluation/trace skills","Work includes mapping multi-step business tasks, building tool-using agents, scoped MCP integrations and audit logs, guardrails, step/spend limits, safe defaults, human approval before customer-facing, financial or destructive actions, reliability evaluation and runbooks","Advertised pay: PHP 90,000–130,000/month for a full-time client engagement, depending on experience; earlier project work is paid per project at a rate agreed up front. Confirm the written rate and contract scope","Requires own computer with at least 16 GB RAM and Core i5/Ryzen 5/Apple M-series or better, Windows/macOS/Linux, webcam/headset, fiber internet of at least 50 Mbps plus backup, UPS/generator and quiet workspace","The employer requires a confidentiality agreement and current NBI clearance. Use only client-provisioned accounts and keep client data, code and API keys out of personal accounts and public repositories","Neon Link says it never charges to apply, test, train or start and only contacts applicants from neonlink.ai email addresses. Do not pay an intermediary or purchase equipment to obtain a job"],
  official:"https://neonlink.ai/careers/job/ai-agent-engineer/",
  secondary:"https://neonlink.ai/careers/",
  secondaryLabel:"Neon Link official current roles and applicant-safety rules",
  cta:"Review official role and apply",
  verified:"2026-11-06"
 },
 {
  id:"neonlink-ai-native-fullstack-ph",
  name:"Neon Link — AI-Native Full-Stack Developer (React/Next.js, Supabase)",
  status:"active-ph",
  badge:"PHILIPPINES • REMOTE • PHP 58,000–66,000/MONTH • 2+ YEARS WEB APPS",
  summary:"Neon Link's official careers page lists a Philippines remote AI-native full-stack developer contract building internal tools, client portals and small applications with React/Next.js, TypeScript, Postgres/Supabase and AI coding agents. Advertised pay is PHP 58,000–66,000/month.",
  requirements:["The employer says remote anywhere in the Philippines, with at least 3 hours of overlap with US business hours for calls and handoffs","Requires 2+ years building and shipping web apps used by real users; strong React or Next.js with TypeScript, Postgres schema design/migrations/queries, authentication and row-level security; daily use of AI coding agents and ability to review/test generated changes","Work includes turning spreadsheet processes into apps, building internal tools and client portals, securing user access, connecting APIs/webhooks/serverless functions, production deployment and handover","Advertised pay: PHP 58,000–66,000/month for a full-time client engagement, depending on experience; project work before that is paid per project at an agreed rate","Requires own computer with at least 16 GB RAM and Core i5/Ryzen 5/Apple M-series or better, Windows/macOS/Linux, webcam/headset, fiber internet of at least 50 Mbps plus backup, UPS/generator and quiet workspace","The employer requires a confidentiality agreement and current NBI clearance. Keep client data, code and API keys in client-controlled accounts and out of public repositories","Neon Link says it never charges to apply, test, train or start and only contacts applicants from neonlink.ai email addresses. Do not pay for placement or equipment"],
  official:"https://neonlink.ai/careers/job/ai-native-full-stack-developer/",
  secondary:"https://neonlink.ai/careers/",
  secondaryLabel:"Neon Link official current roles and applicant-safety rules",
  cta:"Review official role and apply",
  verified:"2026-11-06"
 },
 {
  id:"rekreate-fullstack-developer-ph",
  name:"Rekreate Digital — Full-Stack Developer (React + TypeScript)",
  status:"active-ph",
  badge:"PHILIPPINES • REMOTE • PAY NOT DISCLOSED • PORTFOLIO-FIRST",
  summary:"Rekreate Digital's official careers page lists a Philippines-remote Full-Stack Developer role building React/TypeScript client apps and dashboards with Postgres and Supabase. The employer says it values shipped work and practical skills over formal credentials. Salary, contract type, hours and application deadline are not published.",
  requirements:["The employer identifies the role as Remote · Philippines; its public careers page does not state a salary, contract type, hours or closing date","Work includes React and TypeScript interfaces, client dashboards, Postgres/Supabase data structures and end-to-end feature ownership, including scope, build, test and release","The application asks for skills/stack, project links, what the applicant has built and availability; no résumé file upload is required, but at least one link is requested","The stated hiring process is a short call of about 30 minutes followed by a small scoped task. The page does not say whether the task is paid; ask before starting and keep any evaluation task tightly limited","The employer's privacy policy identifies Rekreate Digital Marketing Services as a BIR-registered Philippine sole proprietorship and explains that applications are stored in a private Google Sheet via Google Apps Script, with internal Discord/email notifications; unsuccessful applications are retained for up to 12 months after the role is filled","Do not send government ID numbers, bank details, health information or other sensitive personal data in the initial application. The employer says it does not need these to assess applicants","Use only the official careers page and verify any recruiter contact against the company's own domain. No application fee is published; never pay an agent or intermediary to secure an interview"],
  official:"https://rekreatedigital.com/careers",
  secondary:"https://rekreatedigital.com/privacy-policy",
  secondaryLabel:"Official recruitment privacy policy and business identity",
  cta:"Apply through the official careers form",
  verified:"2026-11-06"
 },
 {
  id:"rekreate-ai-automation-engineer-ph",
  name:"Rekreate Digital — AI Automation Engineer (n8n + LLM Agents)",
  status:"active-ph",
  badge:"PHILIPPINES • REMOTE • PAY NOT DISCLOSED • PORTFOLIO-FIRST",
  summary:"Rekreate Digital's official careers page lists a Philippines-remote AI Automation Engineer role building n8n workflows and LLM-connected automations for client operations. Work includes email, reports, follow-ups, alerts and integrations with calendars, spreadsheets, CRMs and accounting tools. Salary, contract type, hours and deadline are not published.",
  requirements:["The employer identifies the role as Remote · Philippines; its public careers page does not state salary, contract type, hours or a closing date","Work includes building n8n workflows that run independently, connecting email/calendars/spreadsheets/CRMs/accounting tools, adding LLM steps, designing retries and failure handling, and fixing live automations","The employer says it will teach its patterns for retries, spending limits and human approval before risky actions; applicants should be able to show relevant work or projects and explain how they handle reliability","The application asks for skills/stack, project links, what the applicant has built and availability; no résumé file upload is required, but at least one link is requested","The stated hiring process is a 30-minute call and a small scoped task. The page does not say whether the task is paid; ask before starting and do not perform open-ended production work as an unpaid assessment","The employer's privacy policy identifies Rekreate Digital Marketing Services as a BIR-registered Philippine sole proprietorship and says job applications are recorded in a private Google Sheet through Google Apps Script, with internal Discord/email notifications and up to 12 months retention after the role is filled","Do not send government ID numbers, bank details, health information or other sensitive personal data in the initial application. No application fee is published; never pay an agent or intermediary"],
  official:"https://rekreatedigital.com/careers",
  secondary:"https://rekreatedigital.com/privacy-policy",
  secondaryLabel:"Official recruitment privacy policy and business identity",
  cta:"Apply through the official careers form",
  verified:"2026-11-06"
 },
 {
  id:'taskalpha-project-orion-ph-egocentric-video',
  name:'TaskAlpha / Flipside — Project Orion iPhone Video Data Collection',
  status:'location-check',
  badge:'PHILIPPINES RESIDENTS • IPHONE 11+ + HEAD MOUNT • USD $3.60 PER ACCEPTED HOUR • UP TO 50 APPROVED HOURS/HOUSEHOLD',
  summary:'Flipside’s current employer-posted Project Orion notice says new contributor slots are open again. Contributors record short first-person household-activity videos with their own iPhone. Pay is USD $3.60 per approved hour, with up to 50 approved hours per household; unapproved time is unpaid. TaskAlpha’s official Project Registry currently lists Orion as Onboarding and says accepted hours are paid through TaskAlpha. The project-specific join page did not render in this check, so confirm that the application route loads and the project is still available before sharing ID or recording.',
  requirements:['The employer posting identifies the project as remote in the Philippines and says it is accepting new contributors; TaskAlpha’s official registry lists Project Orion as Onboarding. The direct join link is on TaskAlpha’s domain, but the form did not render in this check','Requires iPhone 11 or newer and a head mount; videos are captured directly through the mobile app. The employer says no special skills are required','Advertised rate is USD $3.60 per approved hour (Indeed currently displays PHP 227.81 as its conversion); maximum 50 approved hours per household. Only accepted hours are paid; task volume and approval are not guaranteed','This is independent-contractor project work, not employment. TaskAlpha’s current terms require age 18+, legal capacity to contract, accurate country and tax-residency information, work outside Singapore, no sanctions/embargo, and no VPN/proxy/location spoofing. The current terms do not state a nationality restriction; a U.S. citizen residing in the Philippines should use the actual Philippine location and tax-residency information','Current terms say accepted fees are transferred to the payment processor within 30 days of the approved payment batch. The available payout provider and any minimums/fees depend on the country and project agreement. TaskAlpha does not withhold income taxes; the contributor is responsible for tax and registration in every relevant jurisdiction','High privacy/IP risk: TaskAlpha requires government ID, residential address, selfie/liveness video, payout/tax details, device/IP/geolocation and uploaded video/metadata. Current Terms assign worldwide IP rights in Work Product to TaskAlpha upon creation. The privacy-policy preview effective November 23, 2026 says accepted deliverables go to Flipside as Customer and may be licensed or sold to its clients; accepted recordings become part of customer datasets, while account/identity data may be retained for seven years','Do not record children. Do not include identifiable people without written consent or capture private/sensitive household information, screens, IDs, addresses or conversations. Read the project-specific Contributor Agreement and Participant Consent Form before accepting','TaskAlpha’s previewed Terms and Privacy updates take effect November 23, 2026; review them before applying or recording. The new terms describe payment every two weeks, within 30 days after the cycle close'],
  official:'https://taskalpha.io/projects',
  secondary:'https://taskalpha.io/join/orion?partner=c25e7f8fb9',
  secondaryLabel:'Project Orion application — official TaskAlpha route; form not load-verified this run',
  tertiary:'https://taskalpha.io/legal/terms',
  tertiaryLabel:'Current TaskAlpha terms and November 23, 2026 update preview',
  moreLinks:[
   {label:'TaskAlpha privacy policy and November 23 update preview',url:'https://taskalpha.io/legal/privacy'}
  ],
  cta:'Review the official project registry and onboarding route',
  verified:'2026-11-08'
 },
 {
  id:'qbo-qmmunity-startup-membership',
  name:'QBO Innovation — Free QMMUNITY Startup Membership',
  status:'location-check',
  badge:'PHILIPPINES • FREE MEMBERSHIP • MENTORS / INVESTOR ACCESS / INCUBATION • NO GUARANTEED FUNDING',
  summary:'QBO says membership, programs and services are free. Startup members are tech-enabled, scalable ventures with a new or unique business model and a working prototype/MVP; the application includes sign-up and an interview. Startup members can access mentoring, incubation, investor pitching/matching and community programs. Regular members can join QLITAN and BASIQS. This is ecosystem support, not a cash grant or guaranteed investment.',
  requirements:['The official QBO page says membership, programs and services are free; it describes startup members as tech-enabled and scalable, with a new or unique business model and a working prototype/MVP','Startup membership requires online sign-up and an interview; QBO says selected startups are notified by email. No application deadline or cash award is published','Startup members may access incubation, mentorship, investor matching/pitching, co-working and community programs; these are support services, not guaranteed funding or investment','Regular members can access QLITAN and BASIQS events; startup-specific programs are exclusive to startup members','The public page states no citizenship or Filipino-ownership restriction. Confirm whether QBO requires a Philippine-registered or locally operating entity for startup-member status before submitting company documents','QBO is based in Makati; confirm remote participation and any in-person requirements before spending on travel'],
  official:'https://www.qboinnovation.com/for-startups',
  secondary:'https://www.qboinnovation.com/',
  secondaryLabel:'Official QBO site and membership information',
  cta:'Review free QBO membership and apply',
  verified:'2026-11-08'
 },
 {
  id:'qbo-community-wednesday-cebu-2026-11-11',
  name:'QBO × Zero-Ten Park — Community Wednesday: Coworking Mixer + Office Hours',
  status:'location-check',
  badge:'NOVEMBER 11, 2026 • 9 AM–7 PM • CEBU IT PARK / CEBU MANDAUE / MAKATI • HOST APPROVAL REQUIRED',
  summary:'A Philippine Startup Week community side event organized by Zero-Ten Park Philippines and QBO Innovation. It offers founder networking, coworking, mentor office hours and peer support. Cebu IT Park and Cebu Mandaue branches are available alongside Makati. Registration requires both the event request and Philippine Startup Week registration; a request does not guarantee a slot.',
  requirements:['Wednesday, November 11, 2026, 9:00 AM–7:00 PM Philippine time. Choose Zero-Ten Park Cebu IT Park, Cebu Mandaue or Makati during registration','Register through the official Luma event page and separately complete the official Philippine Startup Week participant registration','Luma states host approval is required and participation is subject to review and venue availability; submitting a request does not guarantee a confirmed slot','The event page displays no attendance price. Confirm any fee, approved venue and branch instructions before travel; transportation and accommodation are not covered','This is networking, coworking and mentor office hours—not a grant, paid job or guaranteed investor meeting'],
  official:'https://luma.com/rf7tfgfg',
  secondary:'https://startup.gov.ph/phsw-register/',
  secondaryLabel:'Official Philippine Startup Week participant registration',
  cta:'Request a place and select a Cebu branch',
  verified:'2026-11-08'
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
   <small>STARTUP FUNDING WATCH • 2026-11-08 (PH TIME)</small><h2>DICT / IIDB Startup Grant Fund 2026 — October target elapsed; official call still not verified</h2><p>As of November 8, 2026 Philippine time, the October 2026 publication/opening target has elapsed. The latest SGF-specific official IIDB post still describes the September 2, 2026 public consultation on a draft revised circular and says publication/effectivity plus the next Call for Applications were targeted within October. The current official IIDB feed’s newest visible updates concern Philippine Startup Week and the DICT–SSS freelancer partnership; no verified SGF launch notice, effective revised circular, final eligibility rules, application templates or submission deadline has appeared. DICT SGF also told the user on October 7, 2026 that eligibility, procedures, templates and application details would be published when the 2026 call officially launches through DICT/IIDB channels. Keep this as a high-priority pending watch item—not an open grant. Do not submit documents or pay anyone claiming to accept SGF applications before the official call appears. Do not confuse it with the separate DOST-PCAARRD Startup Grant Fund or DEPDev Innovation Grants. Recheck the <a href="https://www.linkedin.com/posts/dict-iidb_dict-iidb-startupgrantfund-activity-7502542376213598208-hx9S" target="_blank" rel="noreferrer">official IIDB Startup Grant Fund update</a> and <a href="https://startup.gov.ph/programs" target="_blank" rel="noreferrer">government Startup Philippines programs</a> before applying or sharing documents.</p>
   <h2>Philippine Startup Week 2026 — starts tomorrow, November 9</h2><p>The official <a href="https://phsw.startup.gov.ph/" target="_blank" rel="noreferrer">Philippine Startup Week information portal</a> is now live for November 9–12 at the M.I.C.E. Center in Quezon City. The official <a href="https://startup.gov.ph/phsw-register/" target="_blank" rel="noreferrer">Startup Philippines registration page</a> lists participant pre-registration as free; exhibitor, community-event and pre-event submissions are subject to review. The November 10 main-event schedule lists an investor stage from 10:20–11:30 AM with Gobi Partners, Foxmont Capital Partners and Kickstart Ventures, plus DOST’s “HEADSTART: From Grant to Growth” session from 1:00–5:00 PM in Vinta Hall. The flagship <a href="https://ignite.ph/" target="_blank" rel="noreferrer">IGNITE X conference</a> is also November 10; its <a href="https://luma.com/rdibkjhw" target="_blank" rel="noreferrer">registration page</a> says host approval is required and displays no separate attendance price. The registration form is dynamically rendered and may show only its page shell in static readers; use the official portal button or contact startup.web@dict.gov.ph if it does not load. Confirm any fee and virtual option before travel. These are networking/learning events, not published grants or guaranteed investor meetings. A separate QBO Innovation × Zero-Ten Park Community Wednesday runs November 11, 9:00 AM–7:00 PM, with Cebu IT Park, Cebu Mandaue and Makati venue choices; registration requires both the Luma request and PHSW registration, and host approval is required. The event page displays no attendance price, so confirm any fee and travel cost before leaving home.</p>
   <h2>AIM-Dado Banatao Incubator — 2026–2027 form is expired</h2><p>The current <a href="https://aim.edu/dado-banatao-incubator/" target="_blank" rel="noreferrer">AIM-DBI official page</a> still features THINCOHORT 2026–2027, but its linked <a href="https://aim.edu/wp-content/uploads/2026/02/AIM-Form_Edited_2026_.pdf" target="_blank" rel="noreferrer">official application PDF</a> states that the 2026–2027 intake closed May 31, 2026. Do not submit that expired form as a current application. The same official page describes the next 2027–2028 intake as opening April 1, 2027 and closing May 31, 2027. THINCOHORT is a mostly onsite/hybrid 12-month incubator and mentorship program, not a published cash grant; plan for Makati participation and confirm the next form when it opens.</p>
   <h2>DOST-PCAARRD Startup Grant Fund 2026 — separate call closed April 15</h2><p>The <a href="https://www.pcaarrd.dost.gov.ph/index.php/quick-information-dispatch-qid-articles/dost-pcaarrd-opens-call-for-2026-startup-grant-fund-program" target="_blank" rel="noreferrer">official DOST-PCAARRD call</a> was for agriculture, aquatic and natural-resources startups and closed April 15, 2026. It is not the DICT/IIDB SGF. The current rendered article footer displayed unrelated gambling/SEO links; avoid those external footer links and use official DOST-PCAARRD navigation or contact details only.</p>
   <h2>EU Green Up to Scale Up MSME Transformation Grant — closed May 11</h2><p>The EU Delegation page still carries an “Apply now” heading, but the official <a href="https://pops.expertisefrance.fr/sdm/ent2/gen/ficheCsl.action?PCSLID=CSL_2026_V4M7tCIXxi&amp;ongletActif=2" target="_blank" rel="noreferrer">Expertise France POPS application record</a> confirms the deadline was May 11, 2026 at 12:00 Paris time. The second call is closed; do not submit through stale copies of the announcement.</p>
   <h2>Ipsos iSay Philippines — official reward catalogue refreshed; direct access still unverified</h2><p>The indexed official <a href="https://www.ipsosisay.com/en-ph/" target="_blank" rel="noreferrer">Philippines panel</a> and <a href="https://www.ipsosisay.com/en-ph/rewards" target="_blank" rel="noreferrer">rewards catalogue</a> now display free sign-up and local reward denominations: GCash PHP 100 for 1,150 points; GCash PHP 200 for 2,300 points; GrabGifts PHP 200 for 2,300 points; Xoxoday PHP 100 for 1,000 points; and an Ipsos Foundation PHP 50 donation for 500 points. The official <a href="https://www.ipsosisay.com/en-ph/faq-rewards-redeeming-points" target="_blank" rel="noreferrer">redemption FAQ</a> confirms a 96-hour hold for newly registered members. Automated direct retrieval of the English and Filipino panel/rewards pages returned HTTP 403 on November 4, so interactive sign-up, login, current stock and redemption were not independently verified. Keep the listing at location-check and use only official Ipsos iSay pages; do not use unofficial replacement links.</p>
      <h2>SSS–DICT freelancer protection partnership — announced October 30</h2><p>The <a href="https://www.sss.gov.ph/news-and-updates/sss-dict-sign-partnership-to-expand-social-security-coverage-for-freelancers-2/" target="_blank" rel="noreferrer">official SSS announcement</a> says the agencies signed an MOU on October 21 to encourage self-employed SSS membership for Filipino freelancers and virtual assistants. This is not a grant or free benefit: SSS states a 15% contribution rate, with self-employed monthly contributions currently ranging from ₱760 to ₱5,280. The MOU also explores future skills and job-matching initiatives, but no separate program enrollment call was published. Non-Filipino resident eligibility is not clarified.</p>
   <h2>Meta Viewpoints — Philippine iPhone listing verified</h2><p>The <a href="https://apps.apple.com/ph/app/meta-viewpoints/id1474938269" target="_blank" rel="noreferrer">official PH App Store listing</a> is free and iPhone-only, but Meta does not guarantee that a program or paid task will be available. It publishes no guaranteed pay rate. Apple’s privacy label lists extensive data categories, including location, contacts, audio/user content, financial/payment information and sensitive information; review each program’s consent and data notice before joining.</p>
   <h2>Google Opinion Rewards — still unavailable in the Philippines</h2><p>Google’s current <a href="https://support.google.com/opinionrewards/answer/6322274?hl=en" target="_blank" rel="noreferrer">Android availability list</a> and <a href="https://support.google.com/opinionrewards/answer/7386064?hl=en" target="_blank" rel="noreferrer">iOS availability list</a> both exclude the Philippines. A localized Play Store listing does not establish eligibility to receive surveys.</p>
      <h2>Hustle PH standalone iPhone app — new access route</h2><p>The <a href="https://apps.apple.com/ph/app/hustle-ph/id6474293403" target="_blank" rel="noreferrer">official Philippines App Store listing</a> now provides a standalone iPhone route alongside GCash Quick Rewards. It advertises GCash/Maya payments for approved missions such as surveys, store checks, mystery shopping, product reviews and beta testing. No universal mission rate is published; some missions require local travel or purchases, and the app privacy label includes location, contact details and photos/videos.</p>
   <h2>Premise Contributor — local mobile tasks</h2><p>The <a href="https://apps.apple.com/ph/app/premise-earn-money/id1390094962" target="_blank" rel="noreferrer">official Philippines iPhone listing</a> offers local photo/data-collection and survey tasks. The official <a href="https://contributors.premise.com/" target="_blank" rel="noreferrer">contributor site</a> lists PayPal, Payoneer or Bitcoin depending on country, but the Philippines payout methods and thresholds are not confirmed; task availability varies by location.</p>
   <h2>Startup Philippines directory — stale program-status warning</h2><p>The official <a href="https://startup.gov.ph/programs" target="_blank" rel="noreferrer">government program directory</a> currently indexes “Open” labels for QBO Accelerator, IdeaSpace Incubation and DOST-CRADLE while showing start dates in May–July 2026, already past as of November 4. Confirm the current cohort and application deadline with <a href="https://startup.gov.ph/contact/" target="_blank" rel="noreferrer">Startup Philippines support</a> before submitting documents.</p>
      <h2>AI Data Innovations — current employer rate is USD $8/hour</h2><p>The current <a href="https://ph.linkedin.com/jobs/view/technical-data-annotator-remote-position-at-ai-data-innovations-4479543236" target="_blank" rel="noreferrer">employer-posted LinkedIn listing</a> states USD $8.00/hour for an approximately 12-week remote AI Safety &amp; Guardrails project. Weekly hours remain to be confirmed. The earlier <a href="https://ph.linkedin.com/jobs/view/technical-data-annotator-remote-position-at-ai-data-innovations-4463376446" target="_blank" rel="noreferrer">USD $6.50/hour predecessor listing</a> is no longer the current application listing. The Vault uses the newer employer-posted USD $8 rate; confirm the actual hours, rate, screening, payment schedule and contractor terms in writing. Do not pay intermediaries.</p>
   <h2>Innodata Robotics Annotator Rater — older listing closed; newer employer posting is live</h2><p>The older <a href="https://ph.linkedin.com/jobs/view/robotics-annotator-rater-work-from-home-at-innodata-inc-4465962689" target="_blank" rel="noreferrer">Innodata posting ID 4465962689</a> is no longer accepting applications. A separate newer employer-posted <a href="https://ph.linkedin.com/jobs/view/robotics-annotator-rater-work-from-home-at-innodata-inc-4476406055" target="_blank" rel="noreferrer">posting ID 4476406055</a> is currently live and states 100% remote, project-based work through December 31, 2026, with a four-year degree required, own desktop/laptop and stable internet; pay and hours remain undisclosed. Use only the newer employer listing and confirm the actual rate, schedule and payout terms. Do not rely on third-party mirrors of the closed predecessor.</p>
   <h2>Innodata Robotics Data Collection Tester — United States only</h2><p>Innodata’s official Greenhouse page lists a separate Robotics Data Collection Tester at USD $10–$12/hour for up to 4 hours per day, using a head-mounted camera while performing household tasks. The page explicitly labels the role Remote - United States and asks applicants which U.S. state they are located in and whether they are legally authorized to work in the U.S. It does not confirm Philippines-based work, so do not classify it as a Philippine remote job or assume that U.S. citizenship alone removes the location restriction. Innodata says it never asks applicants for payment or banking details; it directs suspected recruitment scams to verifyjoboffer@innodata.com.</p>
   <h2>Alignerr — one related application URL returned 404</h2><p>The official Alignerr URL for an Audio Transcription &amp; Alignment Specialist candidate listing returned 404 during this check and was not added. The separate <a href="https://www.alignerr.com/en/jobs/9a4a33ed-d48b-44ab-a415-496a2a128fdb" target="_blank" rel="noreferrer">English Audio Transcription Specialist</a> listing remains live and is listed separately above. Always apply through the live employer page rather than stale reposts.</p>
   <h2>DOST-PCIEERD Driving Urban Transition 2026 — deadline November 17</h2><p>The official <a href="https://pcieerd.dost.gov.ph/work-with-us/2026-dost-pcieerd-dut-call-for-proposal-concept-proposal/" target="_blank" rel="noreferrer">DUT 2026 call page</a> lists a concept-proposal deadline of November 17, 2026 at 5:00 PM Philippine time through DPMISv2. This is a transnational research/innovation grant, not general startup operating cash: it requires at least three partners from three participating countries, at least two from EC co-fund-eligible countries, and a qualified Filipino principal investigator connected to an HEI/RDI with a relevant master’s degree. The call allocates up to PHP 25 million across a maximum of three projects over three years; a 15% counterpart is generally required except for public-good projects. Check the full call and templates before deciding whether a research-institution consortium can meet the requirements.</p>
   <h2>Unverified names stay out of the active list.</h2><p>Older notes mentioned ClarU.ai/Claru.ai, but no sufficiently authoritative current opportunity source has been verified, so it is not presented as an active earning option. AniAni remains a Metro Manila Android pilot with no independently verified payout history. WorldSight is listed only as a country-check lead because its official site does not identify its five live countries or confirm Philippine payout access. Vimo’s public site describes its current 30+ country footprint as Latin America and the Caribbean; it still does not confirm Philippine payout eligibility.</p>
   <h2>WorldSight app and payout caution</h2><p>WorldSight’s official website links to an App Store page that currently returns 404, while its Google Play listing says Stripe Connect payouts require identity verification. Its FAQ instead describes a W-8BEN payout flow and says U.S. persons are not supported. The five live countries are unnamed and Philippine payout support is unconfirmed. U.S. citizens/persons should not treat it as an available earning option.</p>
   <h2>Deepgram Tagalog labeling post — verify before applying</h2><p>A LinkedIn post advertises a Tagalog labeling/editor opportunity, but it does not appear among the roles on Deepgram’s current official careers portal. Deepgram explicitly warns candidates to confirm every role on that portal and to verify recruiters; report suspicious approaches to careers@deepgram.com. Keep this post out of the active list until Deepgram confirms it. Never send banking details, passwords or login codes to an unverified recruiter.</p>
  
   <h2>ASEAN Digital Awards 2027 — Philippine nomination deadline passed October 31</h2><p>The <a href="https://ph.linkedin.com/company/dictgovph" target="_blank" rel="noreferrer">official DICT LinkedIn company feed</a> published the ADA 2027 call with a Philippines submission deadline of October 31, 2026. The regional <a href="https://aiti.gov.bn/ada2027" target="_blank" rel="noreferrer">Brunei AITI page</a> lists November 13 for submissions to ASEAN country coordinators, but that does not reopen the Philippines' national nomination window. Keep this closed for Philippine applicants unless DICT publishes a new national selection process.</p>
   <h2>Alignerr Film Scene Description Specialist — employer listing closed</h2><p>The employer's <a href="https://ph.linkedin.com/jobs/view/film-scene-description-specialist-at-alignerr-4423301045" target="_blank" rel="noreferrer">Philippines LinkedIn posting</a> now explicitly says it is no longer accepting applications. Some scraped job-board copies still describe it as active; do not recommend those copies or treat the role as open unless Alignerr publishes a new live employer listing.</p>
   <h2>Deepgram Medical Transcription QA Analyst — hold pending official careers confirmation</h2><p>A new Philippines LinkedIn post attributed to a Deepgram HR manager advertises a remote-first full-time Medical QA Analyst requiring at least two years of medical transcription, medical editing or medical QA experience. However, the role did not appear on <a href="https://deepgram.com/careers" target="_blank" rel="noreferrer">Deepgram's official careers portal</a> during this check. Deepgram's own candidate-safety instructions say to confirm a role on that portal and report suspicious recruiting approaches to careers@deepgram.com. Keep this out of the active opportunities until Deepgram confirms the exact opening through its official careers site or a verified company contact; do not send sensitive documents or banking information to an unverified recruiter.</p>
<h2>Foreign-resident employment eligibility — DOLE Department Order 248-25</h2><p>For Philippines-based roles, the current <a href="https://dole.gov.ph/php_assets/uploads/2025/01/Department-Order-248-25-New-Rules-and-Regulations-on-the-Employment-of-Foreign-Nationals-in-the-Philippines.pdf" target="_blank" rel="noreferrer">DOLE Department Order 248, Series of 2025</a> lists permanent, probationary and temporary resident visa holders among categories exempt from securing an Alien Employment Permit (AEP). However, Rule V, Sections 1–2 says an exempt foreign national intending to be employed in the Philippines must request a Certificate of Exemption from the DOLE Regional Office and provide employer, passport and visa/ACR details. This does not automatically settle every independent-contractor or foreign-client arrangement; ask DOLE and the prospective employer to confirm the correct classification and paperwork before starting. Do not assume a residence visa alone resolves every work arrangement.</p>
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