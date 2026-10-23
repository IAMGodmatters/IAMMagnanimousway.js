export type StrategyWork={
 id:number;
 title:string;
 goal:string;
 status:string;
 stage:string;
 progress:number;
 updated_at:number;
 steps?:Array<{id:number;title:string;status:string}>;
};
export type StrategyHealth='complete'|'attention'|'in-progress'|'planned';
export type StrategyRow=StrategyWork&{health:StrategyHealth;reason:string;safeProgress:number};

const bounded=(v:unknown)=>Math.max(0,Math.min(100,Number.isFinite(Number(v))?Number(v):0));
const validTime=(v:unknown)=>Number.isFinite(Number(v))&&Number(v)>0?Number(v):0;

/**
 * Advisory signals only, based on account-owned Work Engine data.
 * Never turn a heuristic into a confirmed outage or silently execute work.
 */
export function classifyStrategyWork(item:StrategyWork,nowSeconds=Math.floor(Date.now()/1000)):StrategyRow{
 const status=String(item.status||'planned').toLowerCase();
 const safeProgress=bounded(item.progress);
 const updated=validTime(item.updated_at);
 let health:StrategyHealth='planned',reason='Ready to plan';
 if(status==='completed'){
  health='complete';reason='Reported completed; verify evidence in Work Engine';
 }else if(status==='failed'){
  health='attention';reason='Work Engine reports a failed job';
 }else if(status==='waiting'){
  health='attention';reason='Waiting for a decision or dependency';
 }else if(status==='cancelled'){
  health='planned';reason='Cancelled; excluded from active execution';
 }else if(status==='working'){
  if(updated&&nowSeconds-updated>=7*86400){
   health='attention';reason='Potentially stalled: no recorded update for at least 7 days';
  }else{health='in-progress';reason='Work Engine reports active progress';}
 }else if(safeProgress>0){
  health='in-progress';reason='Progress recorded; status requires review';
 }
 return {...item,health,reason,safeProgress};
}

export function strategySummary(items:StrategyWork[],nowSeconds=Math.floor(Date.now()/1000)){
 const rows=(Array.isArray(items)?items:[]).filter(x=>Number.isFinite(Number(x.id))).map(x=>classifyStrategyWork(x,nowSeconds));
 return {
  rows,
  total:rows.length,
  complete:rows.filter(x=>x.health==='complete').length,
  attention:rows.filter(x=>x.health==='attention').length,
  working:rows.filter(x=>x.health==='in-progress').length,
  planned:rows.filter(x=>x.health==='planned').length,
  averageProgress:rows.length?Math.round(rows.reduce((n,x)=>n+x.safeProgress,0)/rows.length):0
 };
}

export function buildStrategyGoal(input:{title:string;outcome:string;measure:string;target:string;due:string}){
 const clip=(s:string,n:number)=>String(s||'').trim().slice(0,n);
 const title=clip(input.title,100);
 const outcome=clip(input.outcome,1600);
 const measure=clip(input.measure,180);
 const target=clip(input.target,180);
 const due=clip(input.due,10);
 if(!title||!outcome)throw new Error('Provide both an objective and a clear outcome.');
 if((measure&&!target)||(!measure&&target))throw new Error('Provide both a measure and its target, or leave both blank.');
 if(due&&!/^\d{4}-\d{2}-\d{2}$/.test(due))throw new Error('Use a valid target date.');
 const goal=[outcome,measure?'Measure: '+measure+' | Target: '+target:'',due?'Target date: '+due:'','Approval rule: changes to external systems require separate authorization.','Completion rule: verified evidence is required before marking the result complete.'].filter(Boolean).join('\n');
 return {title,goal};
}
