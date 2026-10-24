import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assessAiTransparency,chatAiTransparency} from '../../worker/src/ai-transparency.js';

const read=path=>readFileSync(path,'utf8');
const text=chatAiTransparency();
assert.equal(text.kind,'text');
assert.equal(text.ai_generated,true);
assert.equal(text.interacting_with_ai,true);
assert.match(text.visible_disclosure.text,/AI-generated text/);
assert.equal(text.machine_readable.content_embedded,false);
assert.equal(text.machine_readable.c2pa_signed,false);
assert.equal(text.legal_compliance_certified,false);

const ordinary=assessAiTransparency({kind:'text',ai_generated:true});
assert.equal(ordinary.visible_disclosure.required_for_this_context,false);
const publicText=assessAiTransparency({kind:'text',public_interest:true});
assert.equal(publicText.visible_disclosure.required_for_this_context,true);
const reviewed=assessAiTransparency({kind:'text',public_interest:true,human_reviewed:true,editorial_responsibility:true});
assert.equal(reviewed.visible_disclosure.required_for_this_context,false);
const partial=assessAiTransparency({kind:'text',public_interest:true,human_reviewed:true});
assert.equal(partial.visible_disclosure.required_for_this_context,true);
const deepfake=assessAiTransparency({kind:'video',deepfake:true,artistic_context:true});
assert.equal(deepfake.visible_disclosure.required_for_this_context,true);
assert.equal(deepfake.visible_disclosure.artistic_context,true);
assert.equal(assessAiTransparency({kind:'video',deepfake:true,ai_generated:false,standard_editing_only:true}).visible_disclosure.required_for_this_context,true,'Declared deepfakes must not silently bypass the disclosure gate.');
const human=assessAiTransparency({kind:'video',ai_generated:false});
assert.equal(human.ai_generated,false);
assert.equal(human.visible_disclosure.recommended,false);
const edited=assessAiTransparency({kind:'image',standard_editing_only:true});
assert.equal(edited.ai_generated,false);

const provider=read('worker/src/provider-entrypoint.js');
assert.ok(provider.includes('ai_transparency:chatAiTransparency()'),'Chat responses must contain AI-origin JSON metadata.');
const director=read('worker/src/magnanimous-video-director.js');
assert.ok(director.includes('planned_ai_transparency'),'Video director must identify planned content disclosures.');
assert.ok(director.includes('verified_credentials_emitted_in_plan:false'),'Planning must not claim signed C2PA.');

const social=read('worker/src/social-publishing-runtime.js');
assert.ok(social.includes("code:'AI_DISCLOSURE_REQUIRED'"),'Declared deepfake/public-interest publishing must require label.');
assert.ok(social.includes("code:'AI_MEDIA_DISCLOSURE_CONFIRMATION_REQUIRED'"),'Deepfake media needs explicit visible-media acknowledgement.');
assert.ok(social.indexOf('AI_DISCLOSURE_REQUIRED')<social.indexOf('await youtubePublish(env,row,body)'), 'Disclosure gate must run BEFORE uploading.');

assert.ok(read('worker/src/magnanimous-agent-skills.js').includes("name:'ai-transparency-review'"), 'Built-in article50 skill must be discoverable.');
const component=read('frontend/components/AIInteractionDisclosure.tsx');
assert.ok(component.includes('aria-label="AI interaction disclosure"'),'Notice must be accessible.');
for(const page of ['frontend/app/ai-chat/page.tsx','frontend/app/magnanimous/page.tsx','frontend/app/agents/page.tsx'])
  assert.ok(read(page).includes('<AIInteractionDisclosure'),'AI chat and voice specialist interfaces need first-exposure disclosure.');
assert.ok(read('frontend/app/social-media/page.tsx').includes('AI-generated draft'), 'Social Studio must label AI draft output.');
assert.ok(read('frontend/app/social-connect/page.tsx').includes('visible_media_disclosure_confirmed'), 'Creator must verify disclosure on realistic synthetic videos.');
console.log('Magnanimous Article 50 transparency baseline: PASS (metadata, visible notices, and disclosure gates).');
console.log('Not certified: binary watermark/signature embed and C2PA interoperability still require end-to-end verification.');
