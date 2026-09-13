import {processPendingAutoTeaching} from './auto-teaching-runtime.js';

export function runQaLearningNow(env,ctx){
 const task=processPendingAutoTeaching(env,{limit:8,minAgeSeconds:0}).catch(error=>console.error('Immediate QA learning queue failed',error));
 if(ctx?.waitUntil)ctx.waitUntil(task);
 return task;
}
