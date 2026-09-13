import app from './progress-entrypoint-base.js';
import {runQaLearningQueue} from './qa-learning-runtime.js';
import {runQaLearningNow} from './qa-learning-now-runtime.js';

export default{
 async fetch(request,env,ctx){
  const response=await app.fetch(request,env,ctx);
  const path=new URL(request.url).pathname;
  if(response.ok&&request.method==='POST'&&path==='/api/agents/branch/submissions/public')runQaLearningNow(env,ctx);
  else if(response.ok&&request.method==='POST'&&path==='/api/agents/branch/submissions')runQaLearningQueue(env,ctx);
  else if(response.ok&&request.method==='GET'&&path.startsWith('/api/agents'))runQaLearningQueue(env,ctx);
  else if(response.ok&&(path==='/api/chat'||path==='/api/agents/chat'))runQaLearningQueue(env,ctx);
  return response;
 }
};