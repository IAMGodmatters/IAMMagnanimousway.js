export class MagnanimousRateLimiter{
  constructor(){this.windows=new Map();this.lastSweep=0}
  check(key,{limit=600,windowMs=60000}={}){
    const now=Date.now(),name=String(key||'anonymous'),max=Math.max(1,Number(limit)||600),span=Math.max(1000,Number(windowMs)||60000);
    if(now-this.lastSweep>span){for(const [k,v] of this.windows)if(v.resetAt<=now)this.windows.delete(k);this.lastSweep=now}
    let row=this.windows.get(name);
    if(!row||row.resetAt<=now)row={count:0,resetAt:now+span};
    row.count++;this.windows.set(name,row);
    return{allowed:row.count<=max,limit:max,remaining:Math.max(0,max-row.count),resetAt:row.resetAt,retryAfterMs:Math.max(0,row.resetAt-now)};
  }
}
