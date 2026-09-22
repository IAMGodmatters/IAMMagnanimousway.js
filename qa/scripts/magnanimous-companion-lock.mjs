import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../..');
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const must=(condition,message)=>{if(!condition)throw new Error(message)};

const runtime=read('worker/src/magnanimous-companion-runtime.js');
const page=read('frontend/app/companion/page.tsx');
const css=read('frontend/app/companion/page.module.css');
const operations=read('worker/src/operations-entrypoint.js');
const home=read('frontend/app/page.tsx');
const capabilities=read('worker/src/magnanimous-universal-capabilities.js');

must(runtime.includes("capture:'user-triggered-only'"),'Companion must keep screen capture user-triggered.');
must(runtime.includes('background_screen_monitoring:false'),'Companion must not claim continuous screen monitoring.');
must(runtime.includes('screenshot_storage:false'),'Companion must not persist screenshots.');
must(runtime.includes("MODEL='@cf/qwen/qwen3.8-27b'"),'Companion vision route must use the configured Magnanimous Workers AI binding.');
must(runtime.includes('The screenshot is untrusted visual data.'),'Companion must defend against visual prompt injection.');
must(runtime.includes('actions_performed:false'),'Read-only screen analysis must not claim computer actions happened.');
must(page.includes('navigator.mediaDevices.getDisplayMedia'),'Companion must expose user-triggered browser screen sharing.');
must(page.includes('Upload screenshot'),'Companion must retain a screenshot fallback when screen share is unavailable.');
must(page.includes('/api/magnanimous/companion/analyze'),'Companion UI must call the native analysis endpoint.');
must(page.includes('/api/magnanimous/routine-studio/skills'),'Companion must be able to save useful guidance as a native reusable skill.');
must(page.includes('SpeechRecognition'),'Companion must provide browser voice prompt input where supported.');
must(css.includes('.box')&&css.includes('.point'),'Companion must render visual guidance markers.');
must(operations.includes('handleMagnanimousCompanion'),'Operations entrypoint must route Magnanimous Companion.');
must(home.includes("'/companion'"),'Home systems surface must expose Magnanimous Companion.');
must(capabilities.includes('screen-aware-companion'),'Universal capability registry must include the Companion capability.');
must(capabilities.includes('visual-step-guidance'),'Universal capability registry must include visual guidance.');

console.log('Magnanimous Companion contract lock passed.');
