import {currentUser} from './integrations.js';
import {connectedYouTubeContext} from './social-publishing-runtime.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
const now=()=>Math.floor(Date.now()/1000);
const clean=(v,n=500)=>String(v||'').replace(/\s+/g,' ').trim().slice(0,n);
const median=values=>{const a=values.map(Number).filter(Number.isFinite).sort((x,y)=>x-y);if(!a.length)return 0;const m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2};
const average=values=>{const a=values.map(Number).filter(Number.isFinite);return a.length?a.reduce((x,y)=>x+y,0)/a.length:0};
const isoDateAgo=days=>new Date(Date.now()-days*86400000).toISOString().slice(0,10);
const ytBase='https://www.googleapis.com/youtube/v3';

const NATIVE_CAPABILITIES=Object.freeze([
 ['youtube-search','Public YouTube search','official-api'],
 ['trending-videos','Trending / high-velocity discovery','official-api'],
 ['outlier-discovery','Channel-relative breakout discovery','official-api-plus-native-math'],
 ['channel-stats','Channel statistics','official-api'],
 ['video-stats','Video statistics and velocity','official-api-plus-native-history'],
 ['channel-videos','Long-form / Shorts / live inventory','official-api'],
 ['comments','Comment threads and replies','official-api'],
 ['comment-insights','Audience questions, requests and pain points','native-analysis'],
 ['keyword-research','Keyword demand/competition proxy without fabricated search volume','official-api-plus-native-math'],
 ['title-score','CTR-oriented title quality score','native-analysis'],
 ['title-ideas','Title variants with native scoring','native-analysis'],
 ['thumbnail-brief','Thumbnail concept / contrast / focal-point brief','native-analysis'],
 ['chapters','Timestamp chapter planning from supplied captions','native-analysis'],
 ['script-plan','Long-form script structure and hook plan','native-analysis'],
 ['clip-plan','Short-form clip selection from supplied transcript','native-analysis'],
 ['feedback','Save Creator Growth feedback inside the signed-in Magnanimous workspace','native-storage'],
 ['creator-jobs','List persisted Movie Maker jobs and canonical poll links','native-storage'],
 ['earnings-estimate','RPM-based earnings range calculator','native-math'],
 ['owned-channel-analytics','Views, watch time, retention, traffic and geography','authorized-official-api'],
 ['best-time-to-post','Historical publishing-performance windows','official-api-plus-native-math'],
 ['change-history','Magnanimous-observed title/thumbnail changes','native-history'],
 ['performance-trends','Magnanimous-observed video growth curves','native-history'],
 ['movie-maker','Image, movie and narration generation','magnanimous-native'],
 ['media-compose','Scene composition, overlays, narration and music','magnanimous-native'],
 ['media-edit','Trim, audio extraction, thumbnails, loudness and probe','magnanimous-native'],
 ['social-publishing','Authorized YouTube, TikTok and LinkedIn publishing','authorized-official-api'],
 ['similar-videos','High-performing related video discovery','official-api-plus-native-ranking'],
 ['similar-channels','Related creator discovery','official-api-plus-native-ranking'],
 ['channel-search','YouTube channel discovery','official-api'],
 ['comment-replies','Draft audience replies by tone','native-analysis'],
 ['owned-transcript','Read caption tracks for videos owned by the connected YouTube channel','authorized-official-api'],
 ['youtube-video-update','Update owned video metadata only after explicit confirmation','authorized-official-api'],
 ['youtube-comment-reply','Post a reply on an owned video only after explicit confirmation','authorized-official-api'],
 ['bookmarks','Save creator research inside Magnanimous','native-storage'],
 ['competitor-tracking','Track creator competitors per workspace','native-storage']
].map(([id,name,implementation])=>({id,name,implementation})));

async function ensureSchema(env){
 if(!env?.DB)return;
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS creator_video_snapshots(
  video_id TEXT NOT NULL,channel_id TEXT NOT NULL DEFAULT '',observed_at INTEGER NOT NULL,
  title TEXT NOT NULL DEFAULT '',thumbnail_url TEXT NOT NULL DEFAULT '',views INTEGER NOT NULL DEFAULT 0,
  likes INTEGER NOT NULL DEFAULT 0,comments INTEGER NOT NULL DEFAULT 0,published_at TEXT NOT NULL DEFAULT '',
  PRIMARY KEY(video_id,observed_at)
 )`).run();
 await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_creator_snapshots_video ON creator_video_snapshots(video_id,observed_at DESC)').run();
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS creator_bookmarks(
  id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,user_id TEXT NOT NULL,kind TEXT NOT NULL,
  external_id TEXT NOT NULL DEFAULT '',title TEXT NOT NULL DEFAULT '',url TEXT NOT NULL DEFAULT '',
  payload_json TEXT NOT NULL DEFAULT '{}',tags_json TEXT NOT NULL DEFAULT '[]',created_at INTEGER NOT NULL
 )`).run();
 await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_creator_bookmarks_tenant ON creator_bookmarks(tenant_id,user_id,created_at DESC)').run();
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS creator_competitors(
  tenant_id TEXT NOT NULL,user_id TEXT NOT NULL,channel_id TEXT NOT NULL,title TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL,PRIMARY KEY(tenant_id,user_id,channel_id)
 )`).run();
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS creator_feedback(
  id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,user_id TEXT NOT NULL,category TEXT NOT NULL DEFAULT 'general',
  message TEXT NOT NULL,context_json TEXT NOT NULL DEFAULT '{}',created_at INTEGER NOT NULL
 )`).run();
 await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_creator_feedback_tenant ON creator_feedback(tenant_id,user_id,created_at DESC)').run();
}

async function authContext(env,user){
 const apiKey=String(env?.GOOGLE_API_KEY||'').trim();
 let connected=null;
 if(user&&env?.DB){try{connected=await connectedYouTubeContext(env,user.tenant_id)}catch(error){console.error('creator youtube context unavailable',error)}}
 return{apiKey,connected};
}
async function ytFetch(env,user,path,params={}){
 const auth=await authContext(env,user),u=new URL(ytBase+path);
 for(const[k,v]of Object.entries(params))if(v!==undefined&&v!==null&&String(v)!=='')u.searchParams.set(k,String(v));
 const headers={};
 if(auth.apiKey)u.searchParams.set('key',auth.apiKey);
 else if(auth.connected?.access_token)headers.authorization=`Bearer ${auth.connected.access_token}`;
 else throw new Error('YouTube public data is not configured. Add a Google API key or connect YouTube.');
 const r=await fetch(u.toString(),{headers}),d=await r.json().catch(()=>({}));
 if(!r.ok)throw new Error(d?.error?.message||`YouTube data request failed (${r.status}).`);
 return d;
}
async function resolveChannelId(env,user,input=''){
 const value=clean(input,300);if(/^UC[\w-]{20,}$/.test(value))return value;
 const ctx=await authContext(env,user);
 if(!value&&ctx.connected?.channel_id)return ctx.connected.channel_id;
 const handle=(value.match(/youtube\.com\/@([^/?]+)/i)?.[1]||value.replace(/^@/,'')).trim();
 if(handle&&/^[\w.-]+$/.test(handle)){
  const d=await ytFetch(env,user,'/channels',{part:'id,snippet',forHandle:handle,maxResults:1});
  if(d.items?.[0]?.id)return d.items[0].id;
 }
 const m=value.match(/youtube\.com\/channel\/(UC[\w-]+)/i);if(m)return m[1];
 throw new Error('YouTube channel could not be resolved.');
}
function videoView(item){const s=item?.statistics||{},sn=item?.snippet||{},published=Date.parse(sn.publishedAt||'')||Date.now(),ageHours=Math.max(1,(Date.now()-published)/3600000),views=Number(s.viewCount||0),likes=Number(s.likeCount||0),comments=Number(s.commentCount||0);return{
 video_id:item.id,title:sn.title||'',description:sn.description||'',channel_id:sn.channelId||'',channel_title:sn.channelTitle||'',published_at:sn.publishedAt||'',thumbnail_url:sn.thumbnails?.maxres?.url||sn.thumbnails?.high?.url||sn.thumbnails?.medium?.url||'',views,likes,comments,views_per_hour:Number((views/ageHours).toFixed(2)),engagement_rate:views?Number(((likes+comments)/views*100).toFixed(3)):0,duration:item?.contentDetails?.duration||''
}}
async function enrichVideos(env,user,ids){
 const unique=[...new Set(ids.filter(Boolean))].slice(0,50);if(!unique.length)return[];
 const d=await ytFetch(env,user,'/videos',{part:'snippet,statistics,contentDetails,status',id:unique.join(','),maxResults:50});
 const out=(d.items||[]).map(videoView);await recordSnapshots(env,out);return out;
}
async function recordSnapshots(env,videos){
 if(!env?.DB||!Array.isArray(videos)||!videos.length)return;await ensureSchema(env);const ts=now();
 for(const v of videos){try{await env.DB.prepare('INSERT OR IGNORE INTO creator_video_snapshots(video_id,channel_id,observed_at,title,thumbnail_url,views,likes,comments,published_at) VALUES(?,?,?,?,?,?,?,?,?)').bind(v.video_id,v.channel_id||'',ts,v.title||'',v.thumbnail_url||'',Number(v.views||0),Number(v.likes||0),Number(v.comments||0),v.published_at||'').run()}catch(error){console.error('creator snapshot failed',error)}}
}
async function searchVideos(env,user,{q='',channel_id='',max=15,order='relevance',published_after='',duration='any'}={}){
 const d=await ytFetch(env,user,'/search',{part:'snippet',type:'video',q:clean(q,180),channelId:channel_id||undefined,maxResults:clamp(max,1,25),order:['date','rating','relevance','title','videoCount','viewCount'].includes(order)?order:'relevance',publishedAfter:published_after||undefined,videoDuration:['short','medium','long'].includes(duration)?duration:undefined});
 const ids=(d.items||[]).map(x=>x.id?.videoId).filter(Boolean),details=await enrichVideos(env,user,ids),map=new Map(details.map(x=>[x.video_id,x]));
 return(d.items||[]).map(x=>map.get(x.id?.videoId)).filter(Boolean);
}
function titleScore(title,type='long'){
 const t=clean(title,140),len=t.length,words=t.split(/\s+/).filter(Boolean),lower=t.toLowerCase();
 let score=50;const notes=[];
 const ideal=type==='short'?[28,55]:[38,68];
 if(len>=ideal[0]&&len<=ideal[1]){score+=12;notes.push('Length is in a strong scan-friendly range.')}else if(len<20||len>90){score-=14;notes.push('Length is far from a typical scan-friendly range.')}else score+=3;
 if(/\d/.test(t)){score+=5;notes.push('Specific number/detail improves concreteness.')}
 if(/\b(how|why|what|when|best|fast|easy|truth|mistake|secret|before|after|from|without|vs)\b/i.test(t))score+=7;
 if(/\b(you|your)\b/i.test(t))score+=4;
 if(/[?!]/.test(t))score+=2;
 if(words.length>=5&&words.length<=12)score+=7;else if(words.length>16)score-=6;
 if(/[A-Z]{5,}/.test(t)){score-=8;notes.push('Avoid large all-caps blocks.')}
 const hype=(lower.match(/\b(shocking|insane|unbelievable|must see|you won't believe|crazy)\b/g)||[]).length;if(hype>1){score-=8;notes.push('Too many hype phrases can reduce trust.')}
 if(/\b(ultimate guide to|everything you need to know about)\b/i.test(t)){score-=4;notes.push('Generic framing can blend into crowded results.')}
 if(t.includes(':')||t.includes('—')||t.includes('-'))score+=2;
 return{score:Math.round(clamp(score,0,100)),title:t,type,length:len,word_count:words.length,notes};
}
function titleIdeas(topic,type='long',count=12){
 const t=clean(topic,100).replace(/[?.!]+$/,'');if(!t)return[];
 const templates=[
  `How to ${t} Without Wasting Time`,`I Tried ${t} — Here’s What Actually Happened`,`The Truth About ${t}`,
  `7 ${t} Mistakes to Avoid`,`${t}: What I Wish I Knew Earlier`,`Before You Try ${t}, Watch This`,
  `Why ${t} Works (and When It Doesn’t)`,`${t} From Start to Finish`,`Can ${t} Really Work?`,
  `The Fastest Practical Way to ${t}`,`What Nobody Explains About ${t}`,`${t} vs. the Common Way: What Changes?`
 ];
 return templates.slice(0,clamp(count,1,20)).map(title=>titleScore(title,type)).sort((a,b)=>b.score-a.score);
}
function parseTranscript(input){
 if(Array.isArray(input))return input.map((x,i)=>({start:Number(x.start??x.start_seconds??i*10)||0,text:clean(x.text||x.caption,1000)})).filter(x=>x.text);
 const raw=String(input||'');const rows=[];for(const line of raw.split(/\n+/)){const m=line.match(/^\s*(?:(\d{1,2}):)?(\d{1,2}):(\d{2})(?:\.(\d+))?\s+(.+)/);if(m){const h=Number(m[1]||0),min=Number(m[2]||0),sec=Number(m[3]||0),ms=Number('0.'+(m[4]||0));rows.push({start:h*3600+min*60+sec+ms,text:clean(m[5],1000)})}}
 return rows;
}
const fmtTime=sec=>{const n=Math.max(0,Math.floor(Number(sec)||0)),h=Math.floor(n/3600),m=Math.floor((n%3600)/60),s=n%60;return h?`${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`:`${m}:${String(s).padStart(2,'0')}`};
function chapterPlan(transcript,count=6){
 const rows=parseTranscript(transcript);if(!rows.length)return{exact:false,chapters:[],detail:'Timestamped transcript rows are required for exact chapter boundaries.'};
 const n=clamp(count,4,12),last=Math.max(rows.at(-1)?.start||0,1),target=last/n,out=[];let next=0;
 for(let i=0;i<rows.length&&out.length<n;i++){const row=rows[i];if(row.start+1>=next||i===0){const words=row.text.split(/\s+/).slice(0,7).join(' ').replace(/[.,!?]+$/,'');out.push({start_seconds:Math.floor(row.start),timestamp:fmtTime(row.start),title:words||`Part ${out.length+1}`});next=(out.length)*target}}
 if(out[0]){out[0].start_seconds=0;out[0].timestamp='0:00'}return{exact:true,chapters:out};
}
function transcriptClipPlan(transcript,max=8){
 const rows=parseTranscript(transcript);if(!rows.length)return{exact:false,clips:[],detail:'Timestamped transcript rows are required for precise clip planning.'};
 const scored=rows.map((r,i)=>{let s=0;const t=r.text;if(/[?!]/.test(t))s+=2;if(/\d/.test(t))s++;if(/\b(secret|mistake|truth|never|always|here's|why|how|problem|result|changed|important|listen|wait)\b/i.test(t))s+=2;if(t.length>80&&t.length<260)s++;return{...r,index:i,score:s}}).sort((a,b)=>b.score-a.score).slice(0,clamp(max,1,20)).sort((a,b)=>a.start-b.start);
 return{exact:true,clips:scored.map((x,i)=>{const next=rows[x.index+4]?.start??x.start+45,end=Math.min(next,x.start+60);return{clip:i+1,start_seconds:Math.max(0,Math.floor(x.start-2)),end_seconds:Math.max(Math.floor(x.start+12),Math.floor(end)),hook:x.text,reason:'High-signal transcript moment based on question/specificity/hook cues.'}})};
}
function wordTokens(text){return String(text||'').toLowerCase().replace(/https?:\/\/\S+/g,' ').replace(/[^\p{L}\p{N}'? ]/gu,' ').split(/\s+/).filter(x=>x.length>2)}
const STOP=new Set('the and for that this with from have your you are was were but not they their what when where how why who can could would should just into about like more some very really our out all get got its it is of to in on a an or as be by at we i my me'.split(' '));
function analyzeComments(comments){
 const texts=comments.map(x=>clean(typeof x==='string'?x:x.text||x.textOriginal||x.snippet?.topLevelComment?.snippet?.textOriginal,1200)).filter(Boolean);
 const freq=new Map();for(const t of texts)for(const w of wordTokens(t))if(!STOP.has(w))freq.set(w,(freq.get(w)||0)+1);
 const questions=texts.filter(x=>/\?|\b(how|why|what|where|when|can you|could you)\b/i.test(x)).slice(0,20);
 const requests=texts.filter(x=>/\b(please|can you|could you|would love|make a video|do a video|cover|explain|show us)\b/i.test(x)).slice(0,20);
 const pain=texts.filter(x=>/\b(hate|confusing|hard|difficult|problem|issue|annoy|wish|can't|cannot|struggle|boring)\b/i.test(x)).slice(0,20);
 return{comment_count:texts.length,top_terms:[...freq.entries()].sort((a,b)=>b[1]-a[1]).slice(0,20).map(([term,count])=>({term,count})),questions,content_requests:requests,pain_points:pain};
}
async function fetchComments(env,user,{video_id='',channel_id='',max=50}={}){
 const params={part:'snippet,replies',maxResults:clamp(max,1,100),textFormat:'plainText',order:'relevance'};
 if(video_id)params.videoId=video_id;else params.allThreadsRelatedToChannelId=channel_id;
 const d=await ytFetch(env,user,'/commentThreads',params);
 return(d.items||[]).map(x=>({id:x.id,text:x.snippet?.topLevelComment?.snippet?.textOriginal||'',author:x.snippet?.topLevelComment?.snippet?.authorDisplayName||'',likes:Number(x.snippet?.topLevelComment?.snippet?.likeCount||0),published_at:x.snippet?.topLevelComment?.snippet?.publishedAt||'',replies:(x.replies?.comments||[]).map(r=>({id:r.id,text:r.snippet?.textOriginal||'',author:r.snippet?.authorDisplayName||''}))}));
}
async function keywordProxy(env,user,keyword,region='US'){
 const videos=await searchVideos(env,user,{q:keyword,max:15,order:'relevance'});const k=clean(keyword,180).toLowerCase(),exact=videos.filter(v=>v.title.toLowerCase().includes(k)).length;
 const vph=videos.map(v=>v.views_per_hour),views=videos.map(v=>v.views),eng=videos.map(v=>v.engagement_rate);
 const demand=Math.log10(1+median(vph))*24,competition=videos.length?exact/videos.length*100:0;
 const opportunity=clamp(50+demand*4-competition*.35+median(eng)*2,0,100);
 return{keyword:clean(keyword,180),region_code:region,demand_proxy:{median_views_per_hour:Number(median(vph).toFixed(2)),median_views:Math.round(median(views)),median_engagement_rate:Number(median(eng).toFixed(3))},competition_proxy:{exact_phrase_title_share_pct:Number(competition.toFixed(1)),sample_size:videos.length},opportunity_score:Math.round(opportunity),monthly_search_volume:null,disclosure:'YouTube does not expose official keyword search volume through the public Data API. Magnanimous reports evidence-based demand and competition proxies instead of inventing monthly search counts.',sample:videos.slice(0,8)};
}
async function outlierSearch(env,user,keyword,max=5){
 const candidates=await searchVideos(env,user,{q:keyword,max:clamp(max,1,8),order:'viewCount'});
 const out=[];
 for(const v of candidates.slice(0,5)){
  const recent=await searchVideos(env,user,{channel_id:v.channel_id,max:12,order:'date'}).catch(()=>[]);
  const baseline=recent.filter(x=>x.video_id!==v.video_id).map(x=>x.views);const med=median(baseline),score=med?Number((v.views/med).toFixed(2)):null;
  out.push({...v,breakout_score:score,channel_recent_median_views:med||null,comparison_sample:baseline.length});
 }
 return out.sort((a,b)=>(b.breakout_score||0)-(a.breakout_score||0));
}
async function channelStats(env,user,input){
 const id=await resolveChannelId(env,user,input),d=await ytFetch(env,user,'/channels',{part:'snippet,statistics,contentDetails,status',id});
 const x=d.items?.[0];if(!x)throw new Error('Channel not found.');return{channel_id:x.id,title:x.snippet?.title||'',description:x.snippet?.description||'',thumbnail_url:x.snippet?.thumbnails?.high?.url||'',country:x.snippet?.country||null,subscribers:Number(x.statistics?.subscriberCount||0),views:Number(x.statistics?.viewCount||0),videos:Number(x.statistics?.videoCount||0),uploads_playlist:x.contentDetails?.relatedPlaylists?.uploads||null};
}
async function analyticsReport(env,user,body){
 const ctx=await connectedYouTubeContext(env,user.tenant_id);if(!ctx)throw new Error('Connect YouTube first.');if(!ctx.analytics_scope)throw new Error('Reconnect YouTube once to grant read-only analytics access.');
 const report=String(body.report||'overview'),start=String(body.start_date||isoDateAgo(28)),end=String(body.end_date||new Date().toISOString().slice(0,10));let metrics='views,estimatedMinutesWatched,subscribersGained,likes,comments',dimensions='day',filters='',sort='';
 if(report==='traffic_sources'){metrics='views,estimatedMinutesWatched,averageViewDuration';dimensions='insightTrafficSourceType';sort='-views'}
 else if(report==='geography'){metrics='views,estimatedMinutesWatched';dimensions='country';sort='-views'}
 else if(report==='top_videos'){metrics='views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage';dimensions='video';sort='-views'}
 else if(report==='retention'){const video=clean(body.video_id,40);if(!video)throw new Error('video_id is required for retention.');metrics='audienceWatchRatio,relativeRetentionPerformance,totalSegmentImpressions';dimensions='elapsedVideoTimeRatio';filters=`video==${video}`}
 const u=new URL('https://youtubeanalytics.googleapis.com/v2/reports');u.searchParams.set('ids',`channel==${ctx.channel_id}`);u.searchParams.set('startDate',start);u.searchParams.set('endDate',end);u.searchParams.set('metrics',metrics);u.searchParams.set('dimensions',dimensions);if(filters)u.searchParams.set('filters',filters);if(sort)u.searchParams.set('sort',sort);u.searchParams.set('maxResults',String(report==='retention'?100:50));
 const r=await fetch(u.toString(),{headers:{authorization:`Bearer ${ctx.access_token}`}}),d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d?.error?.message||`YouTube Analytics request failed (${r.status}).`);
 return{report,start_date:start,end_date:end,column_headers:d.columnHeaders||[],rows:d.rows||[]};
}
async function bestPostingWindows(env,user,input){
 const channel=await resolveChannelId(env,user,input),videos=await searchVideos(env,user,{channel_id:channel,max:25,order:'date'});const buckets=new Map();
 for(const v of videos){const d=new Date(v.published_at),key=`${d.getUTCDay()}-${d.getUTCHours()}`,ageDays=Math.max(1,(Date.now()-d.getTime())/86400000),pace=v.views/ageDays;const arr=buckets.get(key)||[];arr.push(pace);buckets.set(key,arr)}
 const days=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
 return[...buckets.entries()].map(([key,vals])=>{const[day,hour]=key.split('-').map(Number);return{day:days[day],hour_utc:hour,sample_size:vals.length,median_views_per_day:Number(median(vals).toFixed(1)),average_views_per_day:Number(average(vals).toFixed(1))}}).sort((a,b)=>b.median_views_per_day-a.median_views_per_day).slice(0,8);
}
async function changeHistory(env,videoId){
 await ensureSchema(env);const rows=(await env.DB.prepare('SELECT * FROM creator_video_snapshots WHERE video_id=? ORDER BY observed_at ASC').bind(videoId).all()).results||[],changes=[];let prev=null;
 for(const r of rows){if(!prev||r.title!==prev.title||r.thumbnail_url!==prev.thumbnail_url)changes.push({observed_at:r.observed_at,title:r.title,thumbnail_url:r.thumbnail_url,views:r.views});prev=r}
 return{video_id:videoId,changes,snapshot_count:rows.length,disclosure:'History begins when Magnanimous first observes the video; it does not claim edits made before that point.'};
}
async function performanceHistory(env,videoId){
 await ensureSchema(env);const rows=(await env.DB.prepare('SELECT observed_at,views,likes,comments FROM creator_video_snapshots WHERE video_id=? ORDER BY observed_at ASC').bind(videoId).all()).results||[];return{video_id:videoId,points:rows.map(r=>({observed_at:r.observed_at,views:Number(r.views||0),likes:Number(r.likes||0),comments:Number(r.comments||0)})),snapshot_count:rows.length};
}
function earnings({views=0,rpm_low=1,rpm_high=8}={}){
 const v=Math.max(0,Number(views)||0),lo=Math.max(0,Number(rpm_low)||0),hi=Math.max(lo,Number(rpm_high)||0),mid=(lo+hi)/2;return{views:v,rpm_range_usd:{low:lo,mid,high:hi},estimated_revenue_usd:{low:Number((v/1000*lo).toFixed(2)),mid:Number((v/1000*mid).toFixed(2)),high:Number((v/1000*hi).toFixed(2))},disclosure:'This is an RPM-based estimate, not actual YouTube revenue. Actual revenue depends on monetized playbacks, geography, niche, seasonality and the channel’s real RPM.'};
}
function thumbnailBrief(body){
 const title=clean(body.title,120),topic=clean(body.topic||body.description,180),style=clean(body.style||'high-contrast realistic creator thumbnail',120);
 const words=(title||topic).split(/\s+/).filter(Boolean),text=words.slice(0,4).join(' ');
 return{title,concept:{focal_subject:clean(body.subject||topic||'single clear subject',120),expression_or_action:clean(body.action||'strong readable emotion or action',120),background:'simple high-contrast background with separation from the subject',thumbnail_text:text,layout:'one dominant subject; one secondary visual cue; leave negative space for text',style},checks:['Readable at phone size','One dominant focal point','Strong foreground/background separation','No tiny text','No more than 3–5 thumbnail words','Thumbnail and title create one combined promise rather than repeating each other exactly']};
}
function scriptPlan(body){
 const topic=clean(body.topic||body.title,300),minutes=clamp(body.minutes||10,1,60),tone=clean(body.tone||'engaging and clear',80);return{topic,minutes,tone,sections:[
  {name:'Cold open',target_seconds:Math.min(20,Math.round(minutes*2)),goal:'Show the result, tension or surprising fact immediately.'},
  {name:'Promise',target_seconds:20,goal:'Tell viewers exactly what they will learn or see and why it matters.'},
  {name:'Context',target_seconds:Math.round(minutes*60*.12),goal:'Give only the background needed to understand the story.'},
  {name:'Main value',target_seconds:Math.round(minutes*60*.58),goal:'Deliver the strongest points in escalating order with examples and visual changes.'},
  {name:'Proof / objection',target_seconds:Math.round(minutes*60*.14),goal:'Address the most likely doubt using evidence, demonstration or comparison.'},
  {name:'Payoff + next action',target_seconds:Math.round(minutes*60*.1),goal:'Resolve the opening promise, summarize the takeaway and give one clear next action.'}
 ],retention_notes:['Open loops should be resolved, not dragged out artificially.','Add a meaningful visual/pacing change when the idea changes.','Cut repeated setup and filler before adding more effects.']};
}


async function youtubeOwnerContext(env,user){
 const ctx=await connectedYouTubeContext(env,user.tenant_id);
 if(!ctx)throw new Error('Connect YouTube first.');
 if(!ctx.write_scope)throw new Error('Reconnect YouTube once to grant the official owner write scope.');
 return ctx;
}
async function youtubeOwnerJson(ctx,path,params={},init={}){
 const u=new URL('https://www.googleapis.com/youtube/v3'+path);
 for(const[k,v]of Object.entries(params))if(v!==undefined&&v!==null&&String(v)!=='')u.searchParams.set(k,String(v));
 const r=await fetch(u.toString(),{...init,headers:{authorization:`Bearer ${ctx.access_token}`,'content-type':'application/json',...(init.headers||{})}});
 const d=await r.json().catch(()=>({}));
 if(!r.ok)throw new Error(d?.error?.message||`YouTube owner request failed (${r.status}).`);
 return d;
}
async function ownedVideoResource(ctx,videoId,parts='snippet,status'){
 const id=clean(videoId,40);if(!id)throw new Error('video_id is required.');
 const d=await youtubeOwnerJson(ctx,'/videos',{part:parts,id});
 const video=d.items?.[0];if(!video)throw new Error('Owned YouTube video was not found.');
 if(String(video.snippet?.channelId||'')!==String(ctx.channel_id||''))throw new Error('This video is not owned by the connected YouTube channel.');
 return video;
}
async function ownedTranscript(env,user,body){
 const ctx=await youtubeOwnerContext(env,user),video=await ownedVideoResource(ctx,body.video_id,'snippet'),language=clean(body.language,35).toLowerCase();
 const tracks=await youtubeOwnerJson(ctx,'/captions',{part:'id,snippet',videoId:video.id});
 let candidates=(tracks.items||[]).filter(x=>x?.id);
 if(language)candidates=candidates.filter(x=>String(x.snippet?.language||'').toLowerCase()===language);
 const track=candidates.find(x=>x.snippet?.trackKind!=='ASR')||candidates[0];
 if(!track)throw new Error(language?'No caption track exists in the requested language for this owned video.':'No downloadable caption track exists for this owned video.');
 const u=new URL(`https://www.googleapis.com/youtube/v3/captions/${encodeURIComponent(track.id)}`);u.searchParams.set('tfmt','vtt');
 const r=await fetch(u.toString(),{headers:{authorization:`Bearer ${ctx.access_token}`}});
 if(!r.ok){const d=await r.json().catch(()=>({}));throw new Error(d?.error?.message||`YouTube caption download failed (${r.status}).`)}
 return{video_id:video.id,title:video.snippet?.title||'',language:track.snippet?.language||null,track_name:track.snippet?.name||'',track_kind:track.snippet?.trackKind||'',format:'vtt',transcript:await r.text(),source:'authorized-official-api',disclosure:'YouTube caption download is available only when the connected account has permission to edit the owned video.'};
}
async function updateOwnedVideo(env,user,body){
 if(body.explicit_consent!==true)throw new Error('Explicit confirmation is required before changing YouTube video metadata.');
 const ctx=await youtubeOwnerContext(env,user),current=await ownedVideoResource(ctx,body.video_id,'snippet,status');
 const resource={id:current.id},parts=[],updated=[];
 const wantsSnippet=['title','description','tags','category_id'].some(k=>Object.prototype.hasOwnProperty.call(body,k));
 if(wantsSnippet){
  const s=current.snippet||{};if(!s.title||!s.categoryId)throw new Error('Current YouTube title/category could not be loaded safely.');
  const next={title:String(s.title),categoryId:String(s.categoryId),description:String(s.description||'')};
  if(Array.isArray(s.tags))next.tags=s.tags;
  if(s.defaultLanguage)next.defaultLanguage=String(s.defaultLanguage);
  if(Object.prototype.hasOwnProperty.call(body,'title')){const v=clean(body.title,100);if(!v)throw new Error('YouTube title cannot be empty.');next.title=v;updated.push('title')}
  if(Object.prototype.hasOwnProperty.call(body,'description')){next.description=String(body.description??'').slice(0,5000);updated.push('description')}
  if(Object.prototype.hasOwnProperty.call(body,'tags')){next.tags=Array.isArray(body.tags)?body.tags.map(x=>clean(x,500)).filter(Boolean).slice(0,500):[];updated.push('tags')}
  if(Object.prototype.hasOwnProperty.call(body,'category_id')){const v=clean(body.category_id,20);if(!v)throw new Error('category_id cannot be empty.');next.categoryId=v;updated.push('category_id')}
  resource.snippet=next;parts.push('snippet');
 }
 const wantsStatus=Object.prototype.hasOwnProperty.call(body,'privacy_status')||Object.prototype.hasOwnProperty.call(body,'publish_at');
 if(wantsStatus){
  const currentStatus=current.status||{},privacy=Object.prototype.hasOwnProperty.call(body,'privacy_status')?String(body.privacy_status):String(currentStatus.privacyStatus||'private');
  if(!['private','unlisted','public'].includes(privacy))throw new Error('privacy_status must be private, unlisted, or public.');
  if(body.publish_at&&privacy!=='private')throw new Error('Scheduled publishing requires privacy_status to remain private until YouTube publishes it.');
  const next={privacyStatus:privacy};
  if(typeof currentStatus.embeddable==='boolean')next.embeddable=currentStatus.embeddable;
  if(currentStatus.license)next.license=currentStatus.license;
  if(typeof currentStatus.publicStatsViewable==='boolean')next.publicStatsViewable=currentStatus.publicStatsViewable;
  if(typeof currentStatus.selfDeclaredMadeForKids==='boolean')next.selfDeclaredMadeForKids=currentStatus.selfDeclaredMadeForKids;
  if(typeof currentStatus.containsSyntheticMedia==='boolean')next.containsSyntheticMedia=currentStatus.containsSyntheticMedia;
  if(currentStatus.publishAt&&!Object.prototype.hasOwnProperty.call(body,'publish_at')&&privacy==='private')next.publishAt=currentStatus.publishAt;
  if(body.publish_at){const publishAt=new Date(String(body.publish_at));if(!Number.isFinite(publishAt.getTime())||publishAt.getTime()<=Date.now())throw new Error('publish_at must be a future ISO 8601 time.');next.publishAt=publishAt.toISOString();updated.push('publish_at')}
  if(Object.prototype.hasOwnProperty.call(body,'privacy_status'))updated.push('privacy_status');
  resource.status=next;parts.push('status');
 }
 if(!parts.length)throw new Error('Provide at least one supported video field to update.');
 const result=await youtubeOwnerJson(ctx,'/videos',{part:parts.join(',')},{method:'PUT',body:JSON.stringify(resource)});
 const v=result||{};return{ok:true,video_id:current.id,updated_fields:[...new Set(updated)],video:{title:v.snippet?.title||resource.snippet?.title||current.snippet?.title||'',description:v.snippet?.description??resource.snippet?.description??current.snippet?.description??'',tags:v.snippet?.tags??resource.snippet?.tags??current.snippet?.tags??[],privacy_status:v.status?.privacyStatus||resource.status?.privacyStatus||current.status?.privacyStatus||'',publish_at:v.status?.publishAt||resource.status?.publishAt||null},source:'authorized-official-api'};
}
async function postOwnedCommentReply(env,user,body){
 if(body.explicit_consent!==true)throw new Error('Explicit confirmation is required before posting a YouTube reply.');
 const parent=clean(body.parent_comment_id,120),text=clean(body.text||body.reply,10000);if(!parent||!text)throw new Error('parent_comment_id and reply text are required.');
 const ctx=await youtubeOwnerContext(env,user),comment=await youtubeOwnerJson(ctx,'/comments',{part:'snippet',id:parent});
 const top=comment.items?.[0];if(!top)throw new Error('The parent YouTube comment was not found.');
 const videoId=clean(top.snippet?.videoId,40);if(!videoId)throw new Error('The parent comment is not associated with a video.');
 await ownedVideoResource(ctx,videoId,'snippet');
 const created=await youtubeOwnerJson(ctx,'/comments',{part:'snippet'},{method:'POST',body:JSON.stringify({snippet:{parentId:parent,textOriginal:text}})});
 return{ok:true,video_id:videoId,parent_comment_id:parent,reply_id:created.id||'',text:created.snippet?.textOriginal||text,source:'authorized-official-api'};
}


async function channelSearch(env,user,query,limit=20){
 const d=await ytFetch(env,user,'/search',{part:'snippet',type:'channel',q:clean(query,180),maxResults:clamp(limit,1,25),order:'relevance'});
 const ids=(d.items||[]).map(x=>x.id?.channelId).filter(Boolean);if(!ids.length)return[];
 const detail=await ytFetch(env,user,'/channels',{part:'snippet,statistics',id:ids.join(','),maxResults:50});
 const byId=new Map((detail.items||[]).map(x=>[x.id,x]));
 return ids.map(id=>byId.get(id)).filter(Boolean).map(x=>({channel_id:x.id,title:x.snippet?.title||'',description:x.snippet?.description||'',thumbnail_url:x.snippet?.thumbnails?.high?.url||x.snippet?.thumbnails?.default?.url||'',subscribers:Number(x.statistics?.subscriberCount||0),views:Number(x.statistics?.viewCount||0),videos:Number(x.statistics?.videoCount||0)}));
}
async function similarVideos(env,user,videoId,limit=20){
 const seed=(await enrichVideos(env,user,[videoId]))[0];if(!seed)throw new Error('Seed video not found.');
 const query=clean(seed.title.replace(/[|:—-].*$/,'').split(/\s+/).slice(0,9).join(' '),180);
 const candidates=await searchVideos(env,user,{q:query,max:clamp(limit,1,25),order:'relevance'});
 const terms=new Set(wordTokens(seed.title+' '+seed.description).filter(x=>!STOP.has(x)));
 const scored=candidates.filter(v=>v.video_id!==seed.video_id).map(v=>{const words=new Set(wordTokens(v.title+' '+v.description).filter(x=>!STOP.has(x)));let overlap=0;for(const t of terms)if(words.has(t))overlap++;const semantic=terms.size?overlap/terms.size:0;const perf=Math.log10(1+v.views_per_hour);return{...v,similarity_signals:{shared_terms:overlap,term_overlap:Number(semantic.toFixed(3)),views_per_hour:v.views_per_hour},native_similarity_score:Number((semantic*70+Math.min(30,perf*8)).toFixed(2))}}).sort((a,b)=>b.native_similarity_score-a.native_similarity_score);
 return{seed,query,results:scored.slice(0,clamp(limit,1,25)),disclosure:'Similarity uses Magnanimous-owned lexical/topic overlap plus public performance signals; it is not vidIQ’s proprietary similarity index.'};
}
async function similarChannels(env,user,input,limit=20){
 const seed=await channelStats(env,user,input),recent=await searchVideos(env,user,{channel_id:seed.channel_id,max:12,order:'date'});
 const topic=clean(recent.map(v=>v.title).join(' ').split(/\s+/).filter(w=>w.length>4).slice(0,18).join(' '),180)||seed.title;
 const videos=await searchVideos(env,user,{q:topic,max:25,order:'relevance'}),agg=new Map();
 for(const v of videos){if(v.channel_id===seed.channel_id)continue;const cur=agg.get(v.channel_id)||{channel_id:v.channel_id,title:v.channel_title,matched_videos:0,views_per_hour:0,engagement_rate:0};cur.matched_videos++;cur.views_per_hour+=v.views_per_hour;cur.engagement_rate+=v.engagement_rate;agg.set(v.channel_id,cur)}
 const rows=[...agg.values()].map(x=>({...x,views_per_hour:Number((x.views_per_hour/x.matched_videos).toFixed(2)),engagement_rate:Number((x.engagement_rate/x.matched_videos).toFixed(3)),native_match_score:Number((x.matched_videos*12+Math.log10(1+x.views_per_hour)*10).toFixed(2))})).sort((a,b)=>b.native_match_score-a.native_match_score).slice(0,clamp(limit,1,25));
 return{seed:{channel_id:seed.channel_id,title:seed.title},topic_basis:topic,channels:rows,disclosure:'Related channels are ranked from public YouTube topic/performance evidence collected by Magnanimous.'};
}
function draftCommentReplies(comment,tones=['warm','helpful','concise']){
 const text=clean(comment,1000),topic=clean(text.replace(/https?:\/\/\S+/g,'').slice(0,160),160);
 const templates={
  warm:`Thank you for sharing that. I appreciate you taking the time to watch and comment. ${topic?'I hear what you’re saying about '+topic+'.':''}`,
  helpful:`Thank you for the question. ${topic?'On '+topic+', ':''}I’ll keep this in mind and make the next explanation as clear and practical as possible.`,
  concise:`Thank you for watching and for the feedback. I appreciate it.`,
  encouraging:`Thank you for being here. Keep going, and I hope the next video gives you something useful you can apply right away.`,
  professional:`Thank you for the thoughtful comment. I appreciate the feedback and will consider it in future content.`
 };
 return{comment:text,replies:[...new Set((Array.isArray(tones)?tones:['warm']).slice(0,5).map(x=>String(x).toLowerCase()))].map(t=>({tone:t,text:templates[t]||templates.helpful}))};
}
async function saveBookmark(env,user,body){
 const id=crypto.randomUUID(),kind=clean(body.kind||'creator-item',40),external=clean(body.external_id||body.video_id||body.channel_id||body.keyword,180),title=clean(body.title||external,240),url=clean(body.url,1000),tags=Array.isArray(body.tags)?body.tags.map(x=>clean(x,50)).filter(Boolean).slice(0,20):[];
 await env.DB.prepare('INSERT INTO creator_bookmarks(id,tenant_id,user_id,kind,external_id,title,url,payload_json,tags_json,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)').bind(id,String(user.tenant_id),String(user.id),kind,external,title,url,JSON.stringify(body.payload||body.data||{}),JSON.stringify(tags),now()).run();
 return{id,kind,external_id:external,title,url,tags};
}
async function listBookmarks(env,user,url){
 const kind=clean(url.searchParams.get('kind'),40),limit=clamp(url.searchParams.get('limit')||30,1,50),where=['tenant_id=?','user_id=?'],args=[String(user.tenant_id),String(user.id)];
 if(kind){where.push('kind=?');args.push(kind)}
 const rows=(await env.DB.prepare(`SELECT * FROM creator_bookmarks WHERE ${where.join(' AND ')} ORDER BY created_at DESC LIMIT ?`).bind(...args,limit).all()).results||[];
 return rows.map(r=>({id:r.id,kind:r.kind,external_id:r.external_id,title:r.title,url:r.url,tags:JSON.parse(r.tags_json||'[]'),payload:JSON.parse(r.payload_json||'{}'),created_at:r.created_at}));
}
async function addCompetitor(env,user,input){
 const stats=await channelStats(env,user,input),ts=now();await env.DB.prepare(`INSERT INTO creator_competitors(tenant_id,user_id,channel_id,title,created_at,updated_at) VALUES(?,?,?,?,?,?)
 ON CONFLICT(tenant_id,user_id,channel_id) DO UPDATE SET title=excluded.title,updated_at=excluded.updated_at`).bind(String(user.tenant_id),String(user.id),stats.channel_id,stats.title,ts,ts).run();return stats;
}
async function listCompetitors(env,user){
 const rows=(await env.DB.prepare('SELECT channel_id,title,created_at,updated_at FROM creator_competitors WHERE tenant_id=? AND user_id=? ORDER BY updated_at DESC').bind(String(user.tenant_id),String(user.id)).all()).results||[];return rows;
}

async function saveCreatorFeedback(env,user,body){
 const category=['bug','feature','quality','general'].includes(String(body.category||'').toLowerCase())?String(body.category).toLowerCase():'general',message=clean(body.message,3000);
 if(!message)throw new Error('Feedback message is required.');
 const id=crypto.randomUUID(),context=body.context&&typeof body.context==='object'?body.context:{};
 await env.DB.prepare('INSERT INTO creator_feedback(id,tenant_id,user_id,category,message,context_json,created_at) VALUES(?,?,?,?,?,?,?)').bind(id,String(user.tenant_id),String(user.id),category,message,JSON.stringify(context),now()).run();
 return{id,category,message,created_at:now(),scope:'magnanimous-workspace',external_submission:false};
}
async function listCreatorFeedback(env,user,url){
 const limit=clamp(url.searchParams.get('limit')||20,1,50),rows=(await env.DB.prepare('SELECT id,category,message,context_json,created_at FROM creator_feedback WHERE tenant_id=? AND user_id=? ORDER BY created_at DESC LIMIT ?').bind(String(user.tenant_id),String(user.id),limit).all()).results||[];
 return rows.map(r=>({id:r.id,category:r.category,message:r.message,context:JSON.parse(r.context_json||'{}'),created_at:r.created_at}));
}
async function movieJobsTableReady(env){
 const row=await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='movie_maker_jobs'").first();return Boolean(row?.name);
}
async function listCreatorJobs(env,user,url){
 if(!await movieJobsTableReady(env))return[];
 const limit=clamp(url.searchParams.get('limit')||30,1,50),rows=(await env.DB.prepare('SELECT id,kind,status,title,resolution,aspect_ratio,seconds,billing_mode,error_text,asset_id,created_at,updated_at FROM movie_maker_jobs WHERE tenant_id=? AND user_id=? ORDER BY updated_at DESC LIMIT ?').bind(String(user.tenant_id),String(user.id),limit).all()).results||[];
 return rows.map(r=>({...r,seconds:Number(r.seconds||0),poll_url:`/api/movie-maker/jobs/${r.id}`,provider_details_private:true}));
}
async function creatorJobState(env,user,id){
 if(!await movieJobsTableReady(env))return null;
 const r=await env.DB.prepare('SELECT id,kind,status,title,resolution,aspect_ratio,seconds,billing_mode,error_text,asset_id,created_at,updated_at FROM movie_maker_jobs WHERE id=? AND tenant_id=? AND user_id=?').bind(clean(id,120),String(user.tenant_id),String(user.id)).first();
 return r?{...r,seconds:Number(r.seconds||0),poll_url:`/api/movie-maker/jobs/${r.id}`,state_source:'Magnanimous persisted Movie Maker job state',provider_details_private:true}:null;
}

export async function handleCreatorGrowth(request,env){
 const url=new URL(request.url),path=url.pathname;if(!path.startsWith('/api/creator-growth'))return null;
 if(!env?.DB)return json({detail:'Creator intelligence storage is unavailable.'},503);
 const user=await currentUser(request,env);if(!user)return json({detail:'Sign in to use Creator Growth.'},401);
 try{
  await ensureSchema(env);
  if(request.method==='GET'&&path==='/api/creator-growth/capabilities'){
   const auth=await authContext(env,user);return json({identity:'Magnanimous AI',product:'Creator Growth',capabilities:NATIVE_CAPABILITIES,public_youtube_data_ready:Boolean(auth.apiKey||auth.connected),owned_youtube_connected:Boolean(auth.connected),analytics_ready:Boolean(auth.connected?.analytics_scope),youtube_owner_write_ready:Boolean(auth.connected?.write_scope),provider_details_private:true});
  }
  if(request.method==='POST'&&path==='/api/creator-growth/title-score'){const b=await request.json().catch(()=>({}));return json(titleScore(b.title,b.type))}
  if(request.method==='POST'&&path==='/api/creator-growth/title-ideas'){const b=await request.json().catch(()=>({}));return json({titles:titleIdeas(b.topic||b.keyword,b.type,b.count)})}
  if(request.method==='POST'&&path==='/api/creator-growth/thumbnail-brief'){return json(thumbnailBrief(await request.json().catch(()=>({}))))}
  if(request.method==='POST'&&path==='/api/creator-growth/chapters'){const b=await request.json().catch(()=>({}));return json(chapterPlan(b.transcript||b.captions,b.chapter_count))}
  if(request.method==='POST'&&path==='/api/creator-growth/clip-plan'){const b=await request.json().catch(()=>({}));return json(transcriptClipPlan(b.transcript||b.captions,b.max_clips))}
  if(request.method==='POST'&&path==='/api/creator-growth/script-plan'){return json(scriptPlan(await request.json().catch(()=>({}))))}
  if(request.method==='POST'&&path==='/api/creator-growth/earnings-estimate'){return json(earnings(await request.json().catch(()=>({}))))}
  if(request.method==='POST'&&path==='/api/creator-growth/search'){const b=await request.json().catch(()=>({}));return json({videos:await searchVideos(env,user,{q:b.query||b.keyword,max:b.limit,order:b.order,published_after:b.published_after,duration:b.duration})})}
  if(request.method==='POST'&&path==='/api/creator-growth/keyword-research'){const b=await request.json().catch(()=>({}));return json(await keywordProxy(env,user,b.keyword,b.region_code))}
  if(request.method==='POST'&&path==='/api/creator-growth/outliers'){const b=await request.json().catch(()=>({}));return json({videos:await outlierSearch(env,user,b.keyword,b.limit)})}
  if(request.method==='POST'&&path==='/api/creator-growth/channel-stats'){const b=await request.json().catch(()=>({}));return json(await channelStats(env,user,b.channel||b.channel_id||''))}
  if(request.method==='POST'&&path==='/api/creator-growth/channel-videos'){const b=await request.json().catch(()=>({})),id=await resolveChannelId(env,user,b.channel||b.channel_id||'');return json({channel_id:id,videos:await searchVideos(env,user,{channel_id:id,max:b.limit||25,order:b.order||'date',duration:b.duration||'any'})})}
  if(request.method==='POST'&&path==='/api/creator-growth/video-stats'){const b=await request.json().catch(()=>({})),videos=await enrichVideos(env,user,[b.video_id]);return videos[0]?json(videos[0]):json({detail:'Video not found.'},404)}
  if(request.method==='GET'&&path==='/api/creator-growth/trending'){const region=clean(url.searchParams.get('region')||'US',2).toUpperCase(),d=await ytFetch(env,user,'/videos',{part:'snippet,statistics,contentDetails',chart:'mostPopular',regionCode:region,maxResults:clamp(url.searchParams.get('limit')||20,1,50)}),videos=(d.items||[]).map(videoView);await recordSnapshots(env,videos);return json({region_code:region,videos})}
  if(request.method==='POST'&&path==='/api/creator-growth/comments'){const b=await request.json().catch(()=>({})),comments=await fetchComments(env,user,{video_id:b.video_id,channel_id:b.channel_id,max:b.limit||50});return json({comments})}
  if(request.method==='POST'&&path==='/api/creator-growth/comment-insights'){const b=await request.json().catch(()=>({}));let comments=Array.isArray(b.comments)?b.comments:[];if(!comments.length&&(b.video_id||b.channel_id))comments=await fetchComments(env,user,{video_id:b.video_id,channel_id:b.channel_id,max:b.limit||100});return json(analyzeComments(comments))}
  if(request.method==='POST'&&path==='/api/creator-growth/analytics'){return json(await analyticsReport(env,user,await request.json().catch(()=>({}))))}
  if(request.method==='POST'&&path==='/api/creator-growth/best-time'){const b=await request.json().catch(()=>({}));return json({windows:await bestPostingWindows(env,user,b.channel||b.channel_id||'') ,disclosure:'These are historical performance windows from observed upload results, not a claim that subscribers are online at those exact times.'})}
  if(request.method==='GET'&&path==='/api/creator-growth/change-history'){return json(await changeHistory(env,clean(url.searchParams.get('video_id'),40)))}
  if(request.method==='GET'&&path==='/api/creator-growth/performance-history'){return json(await performanceHistory(env,clean(url.searchParams.get('video_id'),40)))}
  if(request.method==='POST'&&path==='/api/creator-growth/channel-search'){const b=await request.json().catch(()=>({}));return json({channels:await channelSearch(env,user,b.query||b.keyword,b.limit)})}
  if(request.method==='POST'&&path==='/api/creator-growth/similar-videos'){const b=await request.json().catch(()=>({}));return json(await similarVideos(env,user,clean(b.video_id,40),b.limit))}
  if(request.method==='POST'&&path==='/api/creator-growth/similar-channels'){const b=await request.json().catch(()=>({}));return json(await similarChannels(env,user,b.channel||b.channel_id||'',b.limit))}
  if(request.method==='POST'&&path==='/api/creator-growth/comment-replies'){const b=await request.json().catch(()=>({}));return json(draftCommentReplies(b.comment,b.tones))}
  if(request.method==='POST'&&path==='/api/creator-growth/owned-transcript'){return json(await ownedTranscript(env,user,await request.json().catch(()=>({}))))}
  if(request.method==='POST'&&path==='/api/creator-growth/youtube-video-update'){return json(await updateOwnedVideo(env,user,await request.json().catch(()=>({}))))}
  if(request.method==='POST'&&path==='/api/creator-growth/youtube-comment-reply'){return json(await postOwnedCommentReply(env,user,await request.json().catch(()=>({}))))}
  if(request.method==='POST'&&path==='/api/creator-growth/bookmarks'){return json({saved:await saveBookmark(env,user,await request.json().catch(()=>({})))},201)}
  if(request.method==='GET'&&path==='/api/creator-growth/bookmarks'){return json({items:await listBookmarks(env,user,url)})}
  if(request.method==='POST'&&path==='/api/creator-growth/feedback'){return json({saved:await saveCreatorFeedback(env,user,await request.json().catch(()=>({})))},201)}
  if(request.method==='GET'&&path==='/api/creator-growth/feedback'){return json({items:await listCreatorFeedback(env,user,url),external_submission:false})}
  if(request.method==='GET'&&path==='/api/creator-growth/jobs'){return json({jobs:await listCreatorJobs(env,user,url),canonical_poll:'Use each poll_url to refresh an active Movie Maker job.'})}
  const jm=path.match(/^\/api\/creator-growth\/jobs\/([^/]+)$/);if(jm&&request.method==='GET'){const job=await creatorJobState(env,user,jm[1]);return job?json(job):json({detail:'Creator job not found.'},404)}
  const bm=path.match(/^\/api\/creator-growth\/bookmarks\/([^/]+)$/);if(bm&&request.method==='DELETE'){await env.DB.prepare('DELETE FROM creator_bookmarks WHERE id=? AND tenant_id=? AND user_id=?').bind(bm[1],String(user.tenant_id),String(user.id)).run();return json({ok:true,removed:bm[1]})}
  if(request.method==='POST'&&path==='/api/creator-growth/competitors'){const b=await request.json().catch(()=>({}));return json({competitor:await addCompetitor(env,user,b.channel||b.channel_id||'')},201)}
  if(request.method==='GET'&&path==='/api/creator-growth/competitors'){return json({competitors:await listCompetitors(env,user)})}
  const cm=path.match(/^\/api\/creator-growth\/competitors\/([^/]+)$/);if(cm&&request.method==='DELETE'){await env.DB.prepare('DELETE FROM creator_competitors WHERE tenant_id=? AND user_id=? AND channel_id=?').bind(String(user.tenant_id),String(user.id),cm[1]).run();return json({ok:true,removed:cm[1]})}
  return json({detail:'Unsupported Creator Growth operation.'},405);
 }catch(error){console.error('creator growth runtime error',error);return json({detail:error?.message||'Creator Growth failed.',code:'CREATOR_GROWTH_ERROR'},502)}
}
