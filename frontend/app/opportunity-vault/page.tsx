'use client';
import {useState} from 'react';

type Opportunity={
 id:string;name:string;status:'active-ph'|'location-check'|'waitlist'|'closed';
 badge:string;summary:string;requirements:string[];examples?:string[];official:string;secondary?:string;secondaryLabel?:string;tertiary?:string;tertiaryLabel?:string;cta:string;referral?:string;verified:string;
};

const opportunities:Opportunity[]=[
 {
  id:'atlas',name:'Atlas Capture',status:'location-check',badge:'IPHONE VIDEO TASKS • COUNTRY AVAILABILITY VARIES',
  summary:'The official Atlas Capture opportunity page and Philippines App Store listing describe iPhone-based first-person home-task video capture. The official listing specifies iPhone 11 or newer, a head strap, and pay per approved hour; rates and task availability vary by country. ScamAdviser currently gives the official atlascapture.io domain a low-trust/caution signal; automated reputation scores are not proof of fraud, but they add uncertainty. A separate atlascapture.work site is not linked from the official domain, is not verified as affiliated with Atlas Capture LLC, makes conflicting Android/payout claims and is flagged as very high risk. Do not use atlascapture.work; do not pay fees or send sensitive data to either site.',
  requirements:['Official Philippines App Store listing is for iPhone; the official opportunity page specifies iPhone 11 or newer. Android support is not confirmed by the official app listing','A head strap is required; confirm whether it is actually supplied and whether any cost applies before spending money','Only approved hours are paid; task volume and pay vary by country and task','The current official site says withdrawals start at USD $10 and unlock after 5 approved hours; verify payout method and Philippines eligibility in-app','Do not use atlascapture.work unless Atlas Capture LLC confirms it through atlascapture.io; that lookalike domain is newly registered, hides its owner and is rated very high risk by ScamAdviser','Do not buy equipment from unsolicited messages or third-party sellers expecting reimbursement; App Store and Trustpilot user reviews include reports of delayed or unpaid work, rejected tasks and support problems. These are user reports, not independently adjudicated findings, but they make earnings uncertain—verify a successful first payout before investing significant time','Review video licensing/privacy terms and keep children, faces, IDs, screens, addresses and confidential household details out of frame'],
  examples:['Official tasks include folding laundry, washing dishes, watering plants and wiping counters','Pay is per approved hour; no universal country rate is published','Withdrawal threshold: USD $10 after 5 approved hours, according to the current official site'],
  official:'https://www.atlascapture.io/opportunities',
  secondary:'https://apps.apple.com/ph/app/atlas-capture/id6755671397',
  cta:'Open official opportunities',
  referral:'2PDR9UXD',
  verified:'2026-10-31'
 },
 {
  id:'kled-iphone-data-tasks',name:'Kled — iPhone Photo/Video Data Tasks',status:'location-check',badge:'IPHONE ONLY • CONFIRM LIVE PH TASKS',
  summary:'The free Kled app is listed in the Philippines App Store and offers paid photo/video uploads and special data-collection tasks for AI training. Earnings for ordinary uploads vary by content value and demand; a Kled task listing advertises USD $0.30 per accepted photo for one specific task in supported Southeast Asian countries, including the Philippines. Confirm the task is still available in-app before relying on that rate.',
  requirements:['iPhone only and 18+; the official App Store listing is available in the Philippines','The app lists PayPal, Venmo or Solana wallet payouts; a developer response states a USD $25 minimum cashout. Confirm PayPal availability and all payout/identity requirements in-app before uploading','Uploads are reviewed and may be licensed to AI companies for training. Do not upload private/family photos, children, IDs, financial information or images of people without consent','Specific tasks are piecework: the USD $0.30 figure applies only to the named task and accepted photos; rejected submissions are unpaid and general camera-roll uploads have no fixed rate','Do not pay a joining fee or share OTPs, passwords or crypto recovery phrases; avoid crypto payouts unless you understand the risks'],
  official:'https://apps.apple.com/ph/app/kled/id6752585718',
  secondary:'https://ph.linkedin.com/jobs/view/transit-departure-boards-paid-data-task-remote-contract-at-kled-ai-4484264268',
  secondaryLabel:'Example task details from Kled listing',
  cta:'Open official App Store listing',
  verified:'2026-10-29'
 },

 {
  id:'welo',name:'Welo Global',status:'active-ph',badge:'PHILIPPINES • ACTIVE ROLES',
  summary:'Current official Philippines listings include remote/freelance AI training, quality review, ads rating and video annotation. Some AI Trainers Network entries are talent pools, not active paid job openings.',
  requirements:['Requirements differ by role','Apply only through the official Welo/Lever listing','Do not assume every role is open indefinitely; the official list is the live source'],
  examples:['AI Data Quality Specialist — English (Philippines)','AI Trainers Network — Cebuano / English / Tagalog (talent pools; no immediate work)','Robot Manipulation Video Annotator','Ads Quality Rater — Filipino (Philippines)'],
  official:'https://jobs.lever.co/weloglobal/?location=Philippines',
  cta:'Open current Philippines roles',
  verified:'2026-10-23'
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
  verified:'2026-10-23'
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
  summary:'TSMG officially lists remote full-time or part-time Filipino-language quality review of AI speech transcripts, including punctuation, capitalization and normalization. Employer does not disclose a pay rate. The application says payment is based on VALIDATED WORK, not hours worked.',
  requirements:['Remote in the Philippines; excellent written Filipino and attention to detail','Check transcription accuracy against project rules and source audio where needed','Basic computer skills and reliable internet; prior transcription, proofreading or QA experience is a plus','Independent-contractor and short-term project terms appear in the official application','Verify per-unit pay, rejection criteria and payment schedule before accepting work; no earnings guaranteed'],
  official:'https://jobs.lever.co/tsmg/cbef245a-5e6e-4204-b2b5-fd9fec71f50c/apply',
  secondary:'https://jobs.lever.co/tsmg?location=Remote+in+Philippines',
  secondaryLabel:'Employer Philippines job board',
  cta:'Open official TSMG application',
  verified:'2026-10-26'
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
  id:'userlytics-ph-usability',name:'Userlytics — Paid Website & App Usability Tests',status:'active-ph',badge:'PHILIPPINES • PAYPAL • DESKTOP & MOBILE STUDIES',
  summary:'Userlytics accepts testers in countries where PayPal can receive payments; PayPal’s official country feature list includes the Philippines. Its official tester page advertises USD $10–$50 per study, with the reward shown before a test begins. The official tester FAQ says typical tests take 20–40 minutes; invitations are limited and selected from the contributor pool, so no test volume or income is guaranteed.',
  requirements:['Free tester registration; Philippines eligibility depends on maintaining a working PayPal account able to receive payments','The official Userlytics page advertises USD $10–$50 per study; actual reward depends on the specific invitation and is shown before starting','Tests may require a Windows or Mac computer, high-speed internet, headphones, microphone and sometimes webcam; selected studies can use iOS or Android phones','Approved-test payments are made every 15 days; the September 2026 tester terms allow up to 30 days after full completion','Important privacy/rights warning: tests may record your screen, voice and face; the current terms allow use of generated data to train/improve AI and assign copyright in recordings and test content to Userlytics. Read the terms before joining','No application fee. Never provide passwords, card details or government ID during a test unless the official study explicitly requires a legitimate and necessary verification step'],
  official:'https://www.userlytics.com/user-experience-research/paid-ux-testing/',
  secondary:'https://www.userlytics.com/user-experience-research/legal-resources/terms-of-service-testers/',
  secondaryLabel:'Official tester terms and privacy conditions',
  tertiary:'https://www.userlytics.com/user-experience-research/paid-ux-testing/frequently-asked-questions-testers/',
  tertiaryLabel:'Official tester FAQ: typical duration and payment timing',
  cta:'Join official tester program',
  verified:'2026-10-31'
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
   id:'alignerr-ph-entry-ai',name:'Alignerr — English Audio Transcription Specialist (Manila)',status:'active-ph',badge:'PHILIPPINES / MANILA • REMOTE • BEGINNER-FRIENDLY',
   summary:'The official English Audio Transcription Specialist listing explicitly identifies Manila/Philippines, advertises USD $10–$35/hour and lists 10–40 hours/week. It says prior transcription or AI experience is not required. The rate and hours are advertised ranges, not guaranteed work or earnings.',
   requirements:['Strong English listening and written comprehension; no previous transcription or AI experience required','Computer and reliable internet required; this is not a phone-only task','The listing describes an hourly freelance contract and weekly payout; confirm exact rate, screening, task supply, rejection rules and payment terms before accepting','No guaranteed hours or income; do not pay a recruiter or share passwords, OTPs or crypto recovery phrases'],
   official:'https://www.alignerr.com/en/jobs/9a4a33ed-d48b-44ab-a415-496a2a128fdb',
   cta:'Apply on official Alignerr listing',
   verified:'2026-10-31'
  },
  {
   id:'alignerr-global-ai-quality',name:'Alignerr — AI Data Quality Analyst',status:'location-check',badge:'REMOTE LISTING • PHILIPPINES ELIGIBILITY NOT STATED',
   summary:'The official remote listing advertises USD $40–$120/hour and 10–40 hours/week for reviewing AI outputs for factual accuracy and relevance. The public page does not explicitly identify the Philippines, so confirm that Philippine residents can onboard before treating it as available.',
   requirements:['The listing says prior AI or technical experience is not required; strong English, analytical judgment and detailed guideline-following are needed','Computer and reliable internet required; not phone-only','USD $40–$120/hour is the advertised range, not a guaranteed rate; ask which rate applies to the task and confirm actual work volume, screening and payment terms','Do not use a false address or VPN to bypass country checks; no application fee is advertised'],
   official:'https://www.alignerr.com/jobs/1804f5ac-2feb-4360-a0c3-9af017539b26',
   cta:'Check country eligibility on official listing',
   verified:'2026-10-31'
  },
  {
   id:'alignerr-global-video-annotation',name:'Alignerr — Video Annotation Specialist',status:'location-check',badge:'REMOTE LISTING • PHILIPPINES ELIGIBILITY NOT STATED',
   summary:'The official remote listing advertises USD $40–$120/hour and 10–40 hours/week for labeling video scenes, camera angles and actions. The public page does not explicitly identify the Philippines, so confirm country eligibility before applying.',
   requirements:['The listing says professional video or AI experience is not required; careful observation, strong English and reliable guideline-following are important','Computer and reliable internet required; not phone-only','The USD $40–$120/hour range and weekly hours are advertised, not guaranteed; confirm the actual task rate, work supply and contract/payment terms','No application fee is advertised; never pay a recruiter or provide passwords, OTPs or recovery phrases'],
   official:'https://www.alignerr.com/jobs/98116e05-9cfc-437e-b96c-132d9a5476c4',
   cta:'Check country eligibility on official listing',
   verified:'2026-10-31'
  },
  {
   id:'alignerr-ph-expert-author',name:'Alignerr — Expert AI Task Author Projects (Philippines)',status:'active-ph',badge:'PHILIPPINES • REMOTE • ADVANCED EXPERIENCE',
   summary:'Current official Philippines role pages include Customer Support Task Author (USD $20–$50/hour) and Finance & Accounting Task Author (USD $60–$120/hour). These are broad advertised ranges, not guaranteed pay; the roles require real professional experience and are hourly freelance contracts.',
   requirements:['Customer Support Task Author: for experienced support engineers, technical support specialists or customer-success engineers who can write and score realistic support-triage tasks; the page lists 10–40 hours/week','Finance & Accounting Task Author: for experienced accountants or finance analysts with strong reconciliation, revenue-recognition and spreadsheet skills; CPA Philippines is a plus; work is flexible and task-based','AI experience is not required, but hands-on domain experience is required','Confirm exact rate, task supply, expected workload, screening and contract/payment terms before accepting; no guaranteed hours or income','No application fee is advertised. Never pay a recruiter or provide passwords, OTPs or recovery phrases'],
   examples:['Customer Support Task Author — USD $20–$50/hour advertised','Finance & Accounting Task Author — USD $60–$120/hour advertised'],
   official:'https://www.alignerr.com/jobs/543e6d17-c69e-41c5-b5b2-71a94a91b55c',
   secondary:'https://www.alignerr.com/jobs/1bbf57c7-49d5-4da7-b0f5-2837461959a7',
   secondaryLabel:'Official Finance & Accounting Task Author listing',
   cta:'Review expert task-author roles',
   verified:'2026-10-31'
  },
  {
   id:'innodata-ph-llm-video-audio',name:'Innodata Knowledge Services — LLM Video & Audio Annotation',status:'closed',badge:'PHILIPPINES • APPLICATION CLOSED',
   summary:'The company-posted LinkedIn listing is now marked as no longer accepting applications. Keep this record closed and do not direct applicants to the expired form unless Innodata republishes the role.',
   requirements:['Bachelor’s degree in any course, excellent English reading and comprehension, strong observation skills, a personal computer/laptop and reliable internet','Work includes reviewing video/audio, comparing AI-generated descriptions, labeling objects/actions/sounds and checking annotation quality','Part-time project work; pay rate, weekly hours, task volume, contract duration and payment schedule are not disclosed—ask for them in writing before accepting','Apply through the company-posted listing and verify the recruiter’s identity before sending documents','Innodata’s official careers page says it never asks for payment, banking details or sensitive personal information during the application process; report suspected impersonation to verifyjoboffer@innodata.com'],
   official:'https://ph.linkedin.com/jobs/view/llm-video-audio-annotation-specialists-at-innodata-knowledge-services-inc-4466668593',
   secondary:'https://innodatacareers.com/',
   secondaryLabel:'Official Innodata careers and recruitment scam warning',
   cta:'Open official Innodata listing',
   verified:'2026-10-31'
  },
  {
   id:'innodata-ph-ai-evaluation',name:'Innodata — AI Evaluation Specialist Roles (STEM / Technical)',status:'active-ph',badge:'PHILIPPINES • REMOTE • ADVANCED STEM / TECH',
   summary:'Two current Innodata Knowledge Services Philippines contract listings are visible: AI Evaluation Specialists — STEM Graduates, and Technical AI Evaluation Specialists. Both are remote; the employer does not disclose pay in the job posts.',
   requirements:['STEM evaluation role: graduate in Physics, Data Science, Mathematics, Engineering or a related STEM field, with background in spatial reasoning, video ML, spatial RL or related areas','Technical AI Evaluation role: CS/IT or related graduate, 2+ years programming experience, code evaluation and strong analytical skills; project-based full-time work for approximately three months','The STEM role is contract work; exact hours and duration are not stated. The technical role is full-time project-based for three months','Ask for the pay rate, weekly hours, screening, contract, task allocation and payment schedule in writing before accepting; no guaranteed work or income','Innodata’s official careers page says it never asks for payment, banking details or sensitive personal information during application; report suspected impersonation to verifyjoboffer@innodata.com'],
   official:'https://ph.linkedin.com/jobs/view/ai-evaluation-specialists-%E2%80%93-stem-graduates-at-innodata-knowledge-services-inc-4476639384',
   secondary:'https://ph.linkedin.com/jobs/view/technical-ai-evaluation-specialists-at-innodata-knowledge-services-inc-4476625833',
   secondaryLabel:'Technical AI Evaluation Specialist listing',
   tertiary:'https://innodatacareers.com/',
   tertiaryLabel:'Official Innodata careers and recruitment scam warning',
   cta:'Review official Innodata AI evaluation roles',
   verified:'2026-10-31'
  },
  {
   id:'deepgram-ph-language-labeling',name:'Deepgram — Philippine-Language Freelance Labeling',status:'active-ph',badge:'PHILIPPINES • REMOTE • TAGALOG / CEBUANO / DIALECTS',
   summary:'Deepgram has current company-posted remote freelance listings for Tagalog, Cebuano/Visaya, and Ilonggo/Hiligaynon plus Kapampangan language labeling. Work includes transcribing, reviewing and correcting speech data used to train voice AI. Pay is not disclosed.',
   requirements:['Native or near-native fluency in the specific language is required, plus strong English comprehension, attention to detail and reliable weekly output','The listings describe recurring weekly workload and quality targets, not occasional microtasks; labeling can take longer than the audio itself','No degree requirement is stated in the listings; previous transcription or annotation experience is helpful but not listed as mandatory','Ask the recruiter for the per-hour or per-unit rate, expected weekly volume, quality/rejection rules and payment schedule before accepting','Apply only through the company-posted Deepgram listings. No application fee is advertised; never pay to unlock tasks or buy required equipment from a recruiter'],
   examples:['Tagalog — active company-posted listing','Cebuano / Visaya — active company-posted listing','Ilonggo / Hiligaynon / Kapampangan — active company-posted listing'],
   official:'https://ph.linkedin.com/jobs/view/freelance-labeling-editor-tagalog-at-deepgram-4479815443',
   secondary:'https://ph.linkedin.com/jobs/view/freelance-labeling-editor-cebuano-visaya-at-deepgram-4475537023',
   secondaryLabel:'Cebuano / Visaya role',
   tertiary:'https://ph.linkedin.com/jobs/view/freelance-labeling-editor-ilokano-hiligaynon-kapampangan-at-deepgram-4475518844',
   tertiaryLabel:'Ilonggo / Hiligaynon / Kapampangan role',
   cta:'Open language-specific Deepgram roles',
   verified:'2026-10-31'
  },
  {
   id:'rws-cebuano-conversation-recording',name:'RWS — AI Conversation Recording Contributor (Cebuano)',status:'active-ph',badge:'PHILIPPINES • WORK FROM HOME • USD $7/HOUR',
   summary:'RWS has a current company-posted freelance project for native-level Cebuano speakers. The Tagbilaran listing says work from home, flexible task-based work of approximately 2–4 hours daily, immediate start and an advertised rate of USD $7/hour. Project duration is still to be confirmed.',
   requirements:['Native-level everyday Cebuano fluency and advanced English to understand instructions; do not imitate an accent or dialect that is not your own','Freelance, remote and task-based; approximately 2–4 hours daily is an estimate, not guaranteed hours','Quiet room and a computer microphone or headset with microphone; reliable internet and access to the online recording platform required','Work includes individual or two-person natural conversation recording, voice/voice-text interactions, annotation and metadata','Recordings and related metadata may be used to evaluate speech AI and incorporated into research, development, testing and improvement datasets; read the consent and usage terms before recording and obtain consent from every conversation participant','The listing does not disclose payment schedule, project end date or rejection rules; obtain these in writing before accepting. No experience is required and no application fee is advertised'],
   official:'https://ph.linkedin.com/jobs/view/ai-conversation-recording-contributor-cebuano-at-rws-4481376934',
   secondary:'https://www.rws.com/',
   secondaryLabel:'Official RWS company website',
   cta:'Open RWS Cebuano project listing',
   verified:'2026-10-31'
  },
  {
   id:'innodata-ph-robotics-annotator',name:'Innodata — Robotics Annotator Rater (Work From Home)',status:'active-ph',badge:'PHILIPPINES • 100% REMOTE • PROJECT THROUGH DEC 31',
   summary:'A current company-recruiter-posted Innodata project is explicitly 100% remote and runs October 28–December 31, 2026. Annotators review household-task videos, mark action timestamps and hand/object details, and write concise descriptions. Pay and working hours are not disclosed.',
   requirements:['College graduate with any four-year degree; previous data annotation, AI training, video/image evaluation, QA, transcription or captioning is helpful but not required','Must use a desktop or laptop; mobile devices are not supported. Stable high-speed internet required','Project-based contract; project dates are October 28–December 31, 2026; work hours are still to follow','Ask for rate, hours, payment schedule, quality thresholds and task availability in writing before accepting','Innodata’s official careers page says it never asks applicants for payment, banking details or sensitive personal information; report suspected impersonation to verifyjoboffer@innodata.com'],
   official:'https://ph.linkedin.com/jobs/view/robotics-annotator-rater-work-from-home-at-innodata-inc-4476406055',
   secondary:'https://innodatacareers.com/',
   secondaryLabel:'Official Innodata careers and recruitment scam warning',
   cta:'Open official Innodata project listing',
   verified:'2026-10-31'
  },
  {
   id:'innodata-ph-domain-experts',name:'Innodata — Senior AI Domain Expert Projects',status:'location-check',badge:'PHILIPPINES • PART-TIME • WORK ARRANGEMENT / PAY TO CONFIRM',
   summary:'Innodata has current company-recruiter-posted Philippines listings for Senior Engineering Domain Expert, Senior Energy & Environmental Systems Domain Expert, and Quantitative Social Scientist / Causal Inference Statistician / Biostatistician Expert. These are specialist AI-training, benchmarking and technical-evaluation projects; compensation is not disclosed and each posting does not clearly state the work arrangement.',
   requirements:['Engineering role: degree in a relevant engineering discipline and 3+ years of professional or advanced research experience; specialist areas include electrical, mechanical, civil, chemical, aerospace, industrial and related engineering','Energy/environment role: relevant degree and 3+ years of professional or academic research in energy systems, hydrology, atmospheric science, environmental systems, wildfire science or petroleum engineering','Quantitative social-science role: Master’s or PhD in a relevant quantitative discipline and 3+ years of research/professional experience with SEM, causal inference, econometrics, psychometrics or biostatistics','All roles require strong technical writing, evidence evaluation and subject-matter expertise; no pay range is disclosed','Confirm remote eligibility from your location, expected hours, project duration, compensation, assessment and payment terms before applying','Innodata states it never asks applicants for payment, banking details or sensitive personal information; use the official company-posted job and careers channels'],
   official:'https://ph.linkedin.com/jobs/view/senior-engineering-domain-expert-ai-training-benchmarking-technical-evaluation-at-innodata-inc-4481426805',
   secondary:'https://ph.linkedin.com/jobs/view/senior-energy-environmental-systems-domain-expert-ai-training-benchmarking-technical-evaluation-at-innodata-inc-4481438265',
   secondaryLabel:'Senior Energy & Environmental Systems Expert listing',
   tertiary:'https://ph.linkedin.com/jobs/view/quantitative-social-scientist-causal-inference-statistician-people-analytics-scientist-or-biostatistician-expert-ai-training-benchmarking-technical-evaluation-at-innodata-inc-4481432662',
   tertiaryLabel:'Quantitative Social Scientist / Statistician Expert listing',
   cta:'Review Innodata specialist roles',
   verified:'2026-10-31'
  },
  {
   id:'premise-ph-local-tasks',name:'Premise — Local Photo, Survey & Information Tasks',status:'location-check',badge:'PHILIPPINES IPHONE APP • LOCAL TASKS VARY BY CITY',
   summary:'Premise offers free iOS and Android apps for paid local photo/data-collection tasks, surveys and short information-gathering missions. Its official iPhone app is listed in the Philippines App Store; the Android app is on Google Play, but this review did not independently confirm Philippines storefront availability for Android. Premise says task availability depends on local research needs and changes frequently. There is no fixed pay rate or guaranteed task volume; check the live task marketplace in your area before spending time.',
   requirements:['Free to download and join; the Philippines iPhone App Store listing is rated 18+. Google Play displays an Everyone rating, so check the current in-app age and task terms','The iPhone app is confirmed in the Philippines App Store. The official Android app is on Google Play, but confirm that it can be installed from your Philippines Google Play account before relying on it','The official contributor site lists PayPal, Payoneer or Bitcoin depending on country. Confirm the actual Philippines payout methods, minimum cashout and any fees in-app before completing tasks','No universal per-task rate or guaranteed supply; tasks are driven by current local research demand','Apple and Google store privacy disclosures include location, personal information and user content such as photos/videos. Avoid faces, children, IDs, addresses, financial records and private property unless the task is legitimate and all required consent is obtained','Recent Google Play reviews report long periods with few or no tasks and difficulty reaching minimum cashout; Premise support replied on June 30, 2026 that it had temporarily redirected research effort to other regions. These are user reports and a company support response, not proof of misconduct, but treat this as low-priority supplemental earning and do not invest time until suitable local tasks appear'],
   official:'https://contributors.premise.com/',
   secondary:'https://apps.apple.com/ph/app/premise-earn-money/id1390094962',
   secondaryLabel:'Official iPhone app (Philippines)',
   tertiary:'https://play.google.com/store/apps/details?id=com.premise.android.prod',
   tertiaryLabel:'Official Android app and recent task-availability responses',
   cta:'Open official contributor program',
   verified:'2026-10-31'
  },
  {
   id:'aidi-ph-technical-annotator',name:'AI Data Innovations — Technical Data Annotator (AI Safety & Guardrails)',status:'location-check',badge:'PHILIPPINES • REMOTE • 12-WEEK PROJECT • VERIFY APPLY ROUTE',
   summary:'A company-posted LinkedIn listing describes a remote, project-based independent-contractor role for approximately 12 weeks at USD $8/hour; weekly hours are to be confirmed. The work reviews multi-turn AI coding-assistant conversations for prompt-injection and safety risks. The company website describes AI data annotation and remote data collection, but the job post’s external careers-page URL is not exposed in the public text, so verify the application route and recruiter before sharing documents.',
   requirements:['Computer Science, Software Engineering, IT or related STEM degree, or equivalent technical training and demonstrable experience','Familiarity with at least one programming language, basic code/configuration/log interpretation, application-security concepts and professional English','Remote Philippines; approximately 12 weeks; independent contractor/project-based; weekly hours not disclosed','Technical screening and project training/calibration required; tasks may include potentially harmful, offensive or sensitive content','Advertised pay is USD $8/hour. Confirm hours, acceptance/rejection rules, payment schedule and written contract before working; do not pay an application or onboarding fee'],
   official:'https://ph.linkedin.com/jobs/view/technical-data-annotator-remote-position-at-ai-data-innovations-4479543236',
   secondary:'https://aidatainnovations.com/',
   secondaryLabel:'Company website and identity check',
   cta:'Review company-posted LinkedIn job',
   verified:'2026-10-31'
  },
  {
   id:'crowtado-ph-phone-data',name:'Crowtado — Phone Video / Audio Data Tasks',status:'location-check',badge:'FREE TO JOIN • PHILIPPINES TASKS NOT CONFIRMED',
   summary:'Crowtado’s official site allows free signup in most countries. First-person video tasks are open in many countries and display the pay before recording, but the Philippines is not explicitly confirmed for a current task. Only accepted submissions are paid; task availability depends on country and language.',
   requirements:['Smartphone required; first-person video tasks also need a head or chest mount. Some paired-conversation tasks are limited to US/Canada native American-English speakers','Free to join and no Crowtado fee; no fixed income or set hours are guaranteed','Official withdrawal minimum is USD $10, or USD $25 for bank transfers; PayPal, Wise and other methods vary by country. Confirm Philippines payout availability before recording','Recordings are used as AI training data. Read the contributor agreement and privacy policy; accepted content may be licensed and reused. Get consent from anyone recorded and never record children or private information','Do not submit family photos, IDs, passwords, bank cards, private conversations, addresses or confidential household details'],
   official:'https://www.crowtado.com/en',
   secondary:'https://www.crowtado.com/en/terms',
   secondaryLabel:'Official contributor terms and content licence',
   tertiary:'https://www.crowtado.com/en/trust',
   tertiaryLabel:'Official pay and data-use explanation',
   cta:'Create free account and check PH tasks',
   verified:'2026-10-31'
  },
  {
   id:'egovista-ph-phone-capture',name:'EgoVista — Smartphone First-Person Capture Network',status:'location-check',badge:'GLOBAL SIGNUP • NO PH MISSIONS VERIFIED',
   summary:'EgoVista says contributor accounts are open worldwide, with no country excluded as policy, but a payment route must exist for the contributor’s country. Its signup page locks the country after registration, so confirm Philippines payment availability before creating an account. Public missions currently describe research partners in France, Spain and Scandinavia; no Philippines mission has been verified. Pay is per hour of accepted usable footage at a rate shown on each mission. The current Terms v2.4 say payment within 15 days after approval, while the public contributor page still says within 30 days—ask the company to clarify and rely on the terms you accept.',
   requirements:['Free signup, age 18+ and no minimum commitment; the signup page lists iPhone 12 or newer, older iPhones, recent Android (2022+), GoPro and smart glasses. A hands-free head/chest mount is needed for a phone or action camera','The signup page says the country is locked after registration. Confirm that Philippines is selectable and that a payment route is available before creating the account','Public missions currently describe research partners in France, Spain and Scandinavia; no Philippines mission is verified. A specific mission may restrict where the footage itself must be recorded','Only accepted usable footage is paid; the mission page shows the rate before joining. Terms v2.4 (effective September 11, 2026) state payment within 15 days after approval; the public contributor page still says 30 days, so ask for clarification before accepting','The terms grant a worldwide, long-duration non-exclusive license to accepted footage and derivatives for AI/robotics datasets. Faces are pseudonymised before external processing; voice is used only if a mission expressly requests it, and voice cloning/synthesis is excluded. Get consent and keep children, IDs, private screens and sensitive household details out of frame'],
   official:'https://www.egovista.app/contribute',
   secondary:'https://www.egovista.app/cgu',
   secondaryLabel:'Official Contributor Terms v2.4 and payment conditions',
   tertiary:'https://www.egovista.app/signup',
   tertiaryLabel:'Official signup page — country is locked after registration',
   cta:'Check country and mission availability before signup',
   verified:'2026-10-31'
  },
  {
   id:'mytron-ph-phone-data',name:'MyTron Labs — Smartphone Video Data Collection',status:'location-check',badge:'PHILIPPINES LISTED • EARLY-STAGE • PAYOUT NOT INDEPENDENTLY VERIFIED',
   summary:'MyTron Labs’ official contributor page lists the Philippines among countries accepting collectors, advertises USD $2–$10 per hour depending on project, and says payouts are weekly to local bank or mobile wallet. Signup is free and no prior experience or special equipment is required. The contributor page says weekly payouts to local bank or mobile wallet, while the trust page lists UPI, PayPal, Wise and AirTM; neither page confirms which methods are currently active for Philippine contributors. The trust page reports payments in seven countries but does not name them, so Philippine payouts remain unverified.',
   requirements:['Modern smartphone; the site says no special equipment or experience is required and onboarding is by region/project','Advertised pay USD $2–$10/hour; task availability and rates depend on environment and project; no minimum work commitment','The signup form asks for name, email, password, mobile number and country; an optional but preferred two-minute environment video is requested. Do not upload a video showing people, children, addresses, IDs, screens, valuables or private spaces. The company identifies itself as MyTron Labs LLP (LLPIN ACV-7478, incorporated in India in 2026); this registry entry was not independently confirmed in this review. Its privacy policy says PAN/Aadhaar are collected only for India-based contributors, not contributors outside India','Privacy policy says recordings may capture surroundings, voices and other people; some data may be licensed to clients and may remain in anonymised datasets after account deletion. Read the exact task consent before recording','The site advertises a 20% lifetime referral share; treat this as a referral promotion, not guaranteed task income. Confirm a Philippine payout method and an actual project offer before spending time or sharing footage'],
   official:'https://www.mytronlabs.com/join-as-contributor',
   secondary:'https://www.mytronlabs.com/privacy-policy',
   secondaryLabel:'Official privacy policy and data-use terms',
   tertiary:'https://www.mytronlabs.com/trust',
   tertiaryLabel:'Company trust and payment claims',
   cta:'Review free signup and country availability',
   verified:'2026-10-31'
  },
  {
   id:'loggy3-ph-desktop-data',name:'Loggy3 — Desktop Activity Data Collection (High Privacy Risk)',status:'location-check',badge:'PHILIPPINES • VERY HIGH PRIVACY RISK • NOT RECOMMENDED ON PERSONAL PC',
   summary:'Loggy3 advertises availability in the Philippines and USD $0.10–$1.00 per active recording hour by tier, up to 10 paid hours/day, with twice-monthly payouts through Dots and GCash/PayPal options depending on country. However, its own privacy notice says the desktop app records screen activity, keystrokes, mouse movements, network/hardware data and content visible on screen; recording data is retained for at least five years. This is a serious privacy trade-off, not a routine survey app.',
   requirements:['Windows 10/11 or macOS computer and age 18+; not an iPhone/Android-only task','Official website claims average earnings of USD $100/month, but that is a company average, not a guarantee; tier rates are USD $0.10, $0.25, $0.50 and $1.00 per active recording hour','Privacy notice permits collection of files, documents, audio, video, images and communications displayed while recording; it may include microphone/webcam feeds when enabled, while the FAQ says they are not recorded—this is a policy inconsistency','Screen/input recordings are retained for at least five years; identity/account and payment records may be retained for seven years after account closure','Strong recommendation: do not install on a personal or primary computer containing banking, passwords, private messages, family photos, IDs or confidential work. Consider only a dedicated clean device after reading the full privacy notice and understanding the consent','The site says no minimum withdrawal and twice-monthly processing via Dots; confirm GCash/PayPal availability for Philippines before installing'],
   official:'https://loggy3.com/',
   secondary:'https://loggy3.com/privacy',
   secondaryLabel:'Official privacy notice — screen/key data and five-year retention',
   cta:'Read privacy notice before considering installation',
   verified:'2026-10-31'
  },

  {
   id:'dost-tapi-technicom-2',name:'DOST-TAPI — TECHNiCOM 2.0 Technology Commercialization Assistance',status:'location-check',badge:'PHILIPPINE INNOVATION GRANT • INQUIRY ONLY • NO OPEN CALL VERIFIED',
   summary:'DOST-TAPI’s official channel confirms TECHNiCOM 2.0 funds pilot testing, technical validation and commercialization of research-based technologies and early-stage startups. One official example is a ₱4,970,270 grant to BIOMATS PH Inc. for a bioprinter pilot-testing and technical-validation project. That is one award, not a published funding cap or a guaranteed amount for other applicants.',
   requirements:['Potential fit is a Philippine research-based technology, prototype or early-stage startup seeking pilot testing, validation or commercialization; confirm entity, ownership, IP, co-funding and technical-readiness rules directly with DOST-TAPI','The ₱4,970,270 BIOMATS PH award is an example only; no general minimum/maximum award or current 2026 application deadline was verified','No current open application window or complete 2026 application package was found; contact DOST-TAPI and request current guidelines, eligibility checklist and application forms','Do not pay intermediaries or assume the historical award amount is available to every applicant'],
   official:'https://www.linkedin.com/posts/dosttapi_biomats-ph-inc-moa-signing-under-technicom-activity-7472603992498503681-OhhR',
   secondary:'https://www.linkedin.com/company/dosttapi/',
   secondaryLabel:'Official DOST-TAPI channel',
   cta:'Check current TECHNiCOM 2.0 intake with DOST-TAPI',
   verified:'2026-10-31'
  },
  {
   id:'dost-tapi-evfp',name:'DOST-TAPI — Expanded Venture Financing Program (EVFP)',status:'location-check',badge:'PHILIPPINE STARTUPS • FINANCIAL ASSISTANCE • TERMS / INTAKE TO CONFIRM',
   summary:'DOST-TAPI’s official announcement says EVFP provides financial assistance for commercialization and utilization of innovative technologies and inventions. Eligible categories described by DOST-TAPI include startups, spin-offs, TECHNiCOM graduates, Startup Grant Fund graduates and other innovative startup companies. A current general application window, funding amount, instrument and complete 2026 package were not verified.',
   requirements:['Potential fit is a Philippine startup, spin-off or innovative startup company commercializing an innovative technology or invention; verify the exact entity, ownership, operating-age, IP and co-funding requirements with DOST-TAPI','The official announcement does not publish a universal award amount, deadline, repayment terms or equity instrument; obtain the complete written financing terms before proceeding','No open 2026 call or public general application form was verified; contact DOST-TAPI at info@tapi.dost.gov.ph and request the current EVFP guidelines and intake process','Do not pay intermediaries or assume approval; DOST-TAPI screening and financing terms apply'],
   official:'https://www.linkedin.com/posts/dosttapi_doon-philippines-moa-signing-under-dost-tapis-activity-7470052103655260160-IWVe',
   secondary:'https://www.linkedin.com/company/dosttapi/',
   secondaryLabel:'Official DOST-TAPI channel',
   cta:'Ask DOST-TAPI for current EVFP eligibility and intake',
   verified:'2026-10-31'
  },
  {
   id:'landbank-dost-lifting',name:'LANDBANK + DOST — LIFTING MSMEs Lending Program',status:'location-check',badge:'PHILIPPINES • LOAN FINANCING • NOT A GRANT',
   summary:'DOST and LANDBANK announced a partnership to improve financing access for DOST-assisted MSMEs and startups through LANDBANK’s LIFTING MSMEs Lending Program. The official DOST announcement identifies indicative loan amounts of ₱500,000 for startups, ₱5 million for expanding MSMEs and up to ₱50 million for enterprises levelling up. DOST uses a referral process for its assisted enterprises and LANDBANK performs the lending review. This is debt financing, not a grant.',
   requirements:['The official DOST announcement identifies ₱500,000 for startups, ₱5 million for expanding MSMEs and up to ₱50 million for enterprises levelling up; these are loan amounts, not grants','The partnership focuses on DOST-assisted MSMEs/startups connected with programs such as SETUP, TECHNiCOM and the Startup Grant Fund; DOST uses a referral process and LANDBANK performs its own credit review','LANDBANK performs its own credit evaluation and loan approval; a DOST referral does not guarantee approval','Ask LANDBANK for current interest rate, repayment term, collateral/security, fees, required financial statements, eligible expenses and deadline before applying','Do not treat this as a grant or assume approval; borrowing creates repayment obligations'],
   official:'https://www.dost.gov.ph/knowledge-resources/news/4379-dost-landbank-to-grow-local-msmes-thru-technology-upgrades-and-financing.html',
   secondary:'https://www.landbank.com/news/landbank-dost-strengthen-nationwide-support-for-msmes-startups',
   secondaryLabel:'Official LANDBANK program information',
   cta:'Review official LANDBANK financing information',
   verified:'2026-10-31'
  },

];

const statusLabel=(s:Opportunity['status'])=>s==='active-ph'?'Verified PH path':s==='closed'?'Closed / deadline passed':s==='location-check'?'Check eligibility / location':'Waitlist / unavailable in PH';

export default function OpportunityVault(){
 const[filter,setFilter]=useState<'all'|'active-ph'|'location-check'|'waitlist'|'closed'>('all'),[msg,setMsg]=useState('');
 const visible=opportunities.filter(x=>filter==='all'||x.status===filter);
 async function copy(code:string){try{await navigator.clipboard.writeText(code);setMsg('Referral code copied. The current bonus or referral terms are controlled by Atlas, so verify them inside the app before relying on them.')}catch{setMsg('Referral code: '+code)}}
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
    <div className="actions"><a href={o.official} target="_blank" rel="noreferrer">{o.cta}</a>{o.secondary&&<a href={o.secondary} target="_blank" rel="noreferrer">{o.secondaryLabel||'Open secondary source'}</a>}{o.tertiary&&<a href={o.tertiary} target="_blank" rel="noreferrer">{o.tertiaryLabel||'Open third source'}</a>}</div>
    <footer>Last source verification: {o.verified}</footer>
   </article>)}
  </section>
  <section className="watch">
   <small>STARTUP FUNDING WATCH • 2026-10-31 (PH TIME)</small><h2>DICT / IIDB Startup Grant Fund 2026 — October target elapsed; official call still not verified</h2><p>As of October 31, 2026 Philippine time, I could not verify a published official 2026 DICT/IIDB Call for Applications, final eligibility rules, application templates or a submission deadline. IIDB’s official public update had targeted the revised circular and next call for October 2026; that target month has now elapsed without a verified call in the sources checked. This is consistent with the October 7 DICT SGF message that eligibility, procedures, templates and application details would be published when the official call launches. Keep this as a high-priority pending watch item—not an open grant. Do not confuse it with the separate DOST-PCAARRD Startup Grant Fund or DEPDev Innovation Grants. Check the <a href="https://www.linkedin.com/posts/dict-iidb_dict-iidb-startupgrantfund-activity-7502542376213598208-hx9S" target="_blank" rel="noreferrer">official IIDB update</a> and <a href="https://startup.gov.ph/programs" target="_blank" rel="noreferrer">government Startup Philippines programs</a> before applying or sharing documents.</p>
   <h2>Unverified names stay out of the active list.</h2><p>Older notes mentioned ClarU.ai/Claru.ai, but no sufficiently authoritative current opportunity source has been verified, so it is not presented as an active earning option. AniAni is listed with pilot and privacy warnings, not a verified payout history.</p>
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
