import fs from 'node:fs';

const read=(p)=>fs.readFileSync(p,'utf8');
const must=(text,needle,label)=>{if(!text.includes(needle))throw new Error(`PUBLIC TEACHING / QA OBSERVATION LOCK FAILED: ${label}`)};

const runtime=read('worker/src/qa-observation-runtime.js');
const progress=read('worker/src/progress-entrypoint.js');
const progressBase=read('worker/src/progress-entrypoint-base.js');
const autoTeaching=read('worker/src/auto-teaching-runtime.js');
const immediateQueue=read('worker/src/qa-learning-now-runtime.js');
const queuedReview=read('worker/src/qa-learning-runtime.js');
const migration=read('worker/migrations/0037_qa_observations.sql');
const layout=read('frontend/app/magnanimous/layout.tsx');
const panel=read('frontend/app/magnanimous/public-teaching-panel.tsx');
const owner=read('frontend/app/owner-ai-training-review/page.tsx');
const fullQa=read('.github/workflows/full-platform-qa.yml');

must(layout,"import PublicTeachingPanel from './public-teaching-panel'",'standalone Magnanimous must mount the public teaching panel');
must(layout,'privacy-scrubbed excerpts','standalone Magnanimous must disclose owner QA excerpt monitoring');
must(panel,'/api/agents/branch/submissions/public','public teaching panel must submit to the public teaching endpoint');
must(panel,'AUTOMATIC QA REVIEW','public teaching UI must disclose automatic QA review');
must(panel,'held for owner oversight','uncertain public teaching must remain available for owner oversight');
must(runtime,"/api/agents/branch/submissions/public",'public teaching endpoint must remain available');
must(runtime,"'public-qa'",'public submissions must remain identifiable in the QA queue');
must(runtime,"'pending'",'public teaching must enter quarantine before automatic review');
must(runtime,'recent?.total||0)>=6','public teaching must retain hourly anti-spam throttling');
must(runtime,'isPlatformOwnerUser','observation review must remain platform-owner-only');
must(runtime,"/api/owner/qa-observation",'owner QA observation API must remain available');
must(runtime,'cleanText','observation excerpts must remain scrubbed/truncated before storage');
must(runtime,'qaQualityIssue','successful Q&A must retain automatic obvious-quality detection');
must(runtime,"kind='qa-quality'",'quality issues must remain first-class owner observations');
must(runtime,'quality_flagged','owner must retain a manual answer-quality flag path');

must(progress,"import app from './progress-entrypoint-base.js'",'automatic teaching wrapper must preserve the existing progress runtime');
must(progress,'runQaLearningNow','public submissions must trigger immediate automatic QA review');
must(progress,'runQaLearningQueue','normal QA submissions and usage must drain the automatic review queue');
must(progress,'automatic_qa_review','API responses must expose automatic QA review state');
must(progressBase,'captureQaObservationRequest','base progress layer must capture core Q&A requests');
must(progressBase,'recordQaObservation','base progress layer must record Q&A outcomes and downstream failures');
must(progressBase,'recordQaException','base progress layer must record thrown downstream failures');

must(autoTeaching,"AUTO_REVIEWER='system:auto-qa'",'automatic teaching must use an explicit system reviewer identity');
must(autoTeaching,"['public-qa','qa-contributor']",'only designated QA teaching sources may enter automatic promotion');
must(autoTeaching,'INJECTION_RE','prompt-injection screening must remain active');
must(autoTeaching,'SECRET_RE','credential and secret screening must remain active');
must(autoTeaching,'EXECUTION_IDENTITY_RE','execution-provider identity screening must remain active');
must(autoTeaching,'HIGH_STAKES_RE','high-stakes teaching must remain held for human review');
must(autoTeaching,'UNTRUSTED DATA','AI review must treat submitted teaching as untrusted data');
must(autoTeaching,'score>=92','automatic promotion must retain a high quality threshold');
must(autoTeaching,'requires_external_verification!==true','unverified factual claims must not auto-promote');
must(autoTeaching,'MAGNANIMOUS_HEAVY_MODEL','automatic teaching review should prefer the Magnanimous heavy reasoning helper when configured');
must(autoTeaching,'current_approved_teaching','automatic teaching must compare candidates against current approved branch teaching');
must(autoTeaching,'deduplicated:Boolean(existing?.id)','automatic teaching must avoid duplicate durable lessons');
must(autoTeaching,'prompt_injection!==true','prompt-injection candidates must not auto-promote');
must(autoTeaching,'GLOBAL_BRANCH_TENANT','approved automatic teaching must enter global specialist knowledge');
must(autoTeaching,"status='approved'",'automatically accepted teaching must be marked approved after promotion');
must(autoTeaching,'[AUTO-QA HOLD]','uncertain teaching must remain held rather than learned');
must(autoTeaching,'[AUTO-QA RETRY]','temporary reviewer failures must remain retryable rather than learned');
must(immediateQueue,'minAgeSeconds:0','public teaching must support immediate QA review');
must(queuedReview,'minAgeSeconds:45','normal QA queue must retain a short quarantine window');

must(migration,'CREATE TABLE IF NOT EXISTS qa_observations','Q&A observation migration must exist');
must(owner,'Q&A OBSERVATION','owner review screen must expose the Q&A observation view');
must(owner,'/api/owner/qa-observation','owner review screen must load owner-only QA observation data');
must(owner,"startsWith('public:')",'owner teaching queue must label public contributions safely');
must(fullQa,'schedule:','full-platform QA must retain scheduled regression coverage');
must(fullQa,'qa-regression-issue','full-platform QA must retain automatic regression issue reporting');

console.log('Public teaching / QA observation lock passed: teaching is quarantined, automatically quality-gated before learning, uncertain material remains under owner oversight, Q&A is privacy-scrubbed, and platform-wide regression QA remains scheduled.');
