import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {publicStoreContact} from '../../worker/src/native-store-runtime.js';
import {setPlatformCredential} from '../../worker/src/platform-credentials.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const page=fs.readFileSync(path.join(root,'frontend/app/shop/page.tsx'),'utf8');
const runtime=fs.readFileSync(path.join(root,'worker/src/native-store-runtime.js'),'utf8');
const credentials=fs.readFileSync(path.join(root,'worker/src/platform-credentials.js'),'utf8');

assert.deepEqual(publicStoreContact({}),{whatsapp_number:'',google_voice_number:''});
assert.deepEqual(publicStoreContact({STORE_WHATSAPP_PHONE:'+639171234567',STORE_GOOGLE_VOICE_PHONE:'+14155552671'}),{whatsapp_number:'639171234567',google_voice_number:'+14155552671'});
assert.deepEqual(publicStoreContact({STORE_WHATSAPP_PHONE:'invalid',STORE_GOOGLE_VOICE_PHONE:'javascript:alert(1)'}),{whatsapp_number:'',google_voice_number:''});
assert.deepEqual(publicStoreContact({STORE_WHATSAPP_PHONE:'+123',STORE_GOOGLE_VOICE_PHONE:'+123'}),{whatsapp_number:'',google_voice_number:''});
assert.match(runtime,/getIntegrationRuntimeEnv\(env,\['STORE_WHATSAPP_PHONE','STORE_GOOGLE_VOICE_PHONE'\]\)/);
assert.match(runtime,/contact:publicStoreContact\(contactEnv\)/);
assert.match(credentials,/id:'store-contact'/);
assert.match(page,/https:\/\/wa\.me\/\$\{contact\.whatsapp_number\}/);
assert.match(page,/rel="noopener noreferrer"/);
assert.match(page,/pay only through the secure store checkout/);
assert.match(page,/contact\.whatsapp_number&&/);
assert.match(page,/contact\.google_voice_number&&/);

const fakeDb={prepare(){throw new Error('Invalid numbers must be rejected before database access.')}};
for(const key of ['STORE_WHATSAPP_PHONE','STORE_GOOGLE_VOICE_PHONE']){
 for(const invalid of ['555-1212','+01234567890','+63917 123 4567','https://example.com','+123']){
  await assert.rejects(()=>setPlatformCredential({DB:fakeDb},{id:'owner'},key,invalid),/Enter a phone number/);
 }
}
console.log('WhatsApp store contact lock PASS — validated owner inputs, safe public exposure, opt-in UI, and checkout separation.');
