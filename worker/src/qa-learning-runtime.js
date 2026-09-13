import {processPendingAutoTeaching} from './auto-teaching-runtime.js';

export function runQaLearningQueue(env,ctx){
 const task=processPendingAutoTeaching(env,{limit:8,minAgeSeconds:45}).catch(error=>console.error('QA learning queue failed',error));
 if(ctx?.waitUntil)ctx.waitUntil(task);
 return task;
}
