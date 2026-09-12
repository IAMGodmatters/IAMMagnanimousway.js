import fs from 'node:fs';

const read=(p)=>fs.readFileSync(p,'utf8');
const must=(text,needle,label)=>{if(!text.includes(needle))throw new Error(`PUBLIC TEACHING / QA OBSERVATION LOCK FAILED: ${label}`)};

const runtime=read('worker/src/qa-observation-runtime.js');
const progress=read('worker/src/progress-entrypoint.js');
const migration=read('worker/migrations/0037_qa_observations.sql');
const layout=read('frontend/app/magnanimous/layout.tsx');
const panel=read('frontend/app/magnanimous/public-teaching-panel.tsx');
const owner=read('frontend/app/owner-ai-training-review/page.tsx');
const fullQa=read('.github/workflows/full-platform-qa.yml');

must(layout,"import PublicTeachingPanel from './public-teaching-panel'",'standalone Magnanimous must mount the public teaching panel');
must(layout,'privacy-scrubbed excerpts','standalone Magnanimous must disclose owner QA excerpt monitoring');
must(panel,'/api/agents/branch/submissions/public','public teaching panel must submit to the approval-only public endpoint');
must(panel,'OWNER APPROVAL REQUIRED','public teaching UI must clearly state owner approval is required');
must(runtime,"/api/agents/branch/submissions/public",'public teaching endpoint must remain available');
must(runtime,"'public-qa'",'public submissions must be identifiable in the owner queue');
must(runtime,"'pending'",'public teaching must enter pending review rather than live knowledge');
must(runtime,'recent?.total||0)>=6','public teaching must retain hourly anti-spam throttling');
must(runtime,'isPlatformOwnerUser','observation review must remain platform-owner-only');
must(runtime,"/api/owner/qa-observation",'owner QA observation API must remain available');
must(runtime,'cleanText','observation excerpts must remain scrubbed/truncated before storage');
must(progress,'captureQaObservationRequest','progress layer must capture core Q&A requests');
must(progress,'recordQaObservation','progress layer must record Q&A outcomes and downstream failures');
must(progress,'recordQaException','progress layer must record thrown downstream failures');
must(migration,'CREATE TABLE IF NOT EXISTS qa_observations','Q&A observation migration must exist');
must(owner,'Q&A OBSERVATION','owner review screen must expose the Q&A observation view');
must(owner,'/api/owner/qa-observation','owner review screen must load owner-only QA observation data');
must(owner,"startsWith('public:')",'owner teaching queue must label public contributions safely');
must(fullQa,'schedule:','full-platform QA must retain scheduled regression coverage');
must(fullQa,'qa-regression-issue','full-platform QA must retain automatic regression issue reporting');

console.log('Public teaching / QA observation lock passed: public contributions stay owner-gated, core Q&A is observed with privacy scrubbing, and platform-wide regression QA remains scheduled.');
