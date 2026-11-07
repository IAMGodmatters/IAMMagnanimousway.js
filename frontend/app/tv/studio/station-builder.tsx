'use client';
import {useCallback,useEffect,useState} from 'react';
import Link from 'next/link';
import {getPlatformAuthToken} from '../../lib/magnanimous-session';
import styles from './station-builder.module.css';

const api=process.env.NEXT_PUBLIC_API_BASE_URL||'';
type Station={id:string;slug:string;name:string;description:string;visibility:string;station_url:string};
async function read(r:Response){const t=await r.text();try{return JSON.parse(t)}catch{return{detail:t||'Request failed.'}}}
const slugify=(v:string)=>v.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,48);

export default function StationBuilder(){
 const[token,setToken]=useState(''),[stations,setStations]=useState<Station[]>([]),[name,setName]=useState('My Magnanimous TV Station'),[slug,setSlug]=useState('my-magnanimous-tv-station'),[description,setDescription]=useState('My own channel, powered by Magnanimous TV.'),[visibility,setVisibility]=useState('public'),[loading,setLoading]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const load=useCallback(async(t:string)=>{const r=await fetch(api+'/api/tv/stations',{headers:{Authorization:'Bearer '+t},cache:'no-store'}),d=await read(r);if(!r.ok)throw new Error(d.detail||'Could not load your stations.');setStations(d.stations||[])},[]);
 useEffect(()=>{const t=getPlatformAuthToken();if(t){setToken(t);void load(t).catch(e=>setError(e.message))}},[load]);
 function changeName(v:string){setName(v);setSlug(slugify(v))}
 async function create(e:React.FormEvent){e.preventDefault();if(!token){setError('Sign in to create your own station.');return}setLoading(true);setError('');setNotice('');try{const r=await fetch(api+'/api/tv/stations',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({name,slug,description,visibility})}),d=await read(r);if(!r.ok)throw new Error(d.detail||'Station could not be created.');setStations(old=>[d.station,...old]);setNotice('Your Magnanimous TV station profile has been created. Live broadcasting is not connected yet.');}catch(e:any){setError(e?.message||'Station could not be created.')}finally{setLoading(false)}}
 return <section className={styles.wrap}>
  <div className={styles.heading}><div><p className={styles.eyebrow}>PERSONAL STATIONS</p><h2>Create your own TV station</h2><p>Each account can create up to five station profiles. Your channel keeps the Magnanimous TV identity while letting you choose its name and description.</p></div><span className={styles.count}>{stations.length} / 5 stations</span></div>
  {!token?<div className={styles.signin}><p>Sign in to create and manage your personal station.</p><Link href="/login?returnTo=%2Ftv%2Fstudio">Sign in to Magnanimous →</Link></div>:<form className={styles.form} onSubmit={create}>
   <label>Station name<input value={name} onChange={e=>changeName(e.target.value)} minLength={3} maxLength={80} required/></label>
   <label>Station address<input value={slug} onChange={e=>setSlug(slugify(e.target.value))} minLength={3} maxLength={48} required/><small>iammagnanimousway.com/tv/station?slug={slug||'your-station'}</small></label>
   <label>About this station<textarea value={description} onChange={e=>setDescription(e.target.value)} maxLength={280} rows={3}/></label>
   <label>Who can watch?<select value={visibility} onChange={e=>setVisibility(e.target.value)}><option value="public">Public — anyone can find and watch the station profile</option><option value="unlisted">Unlisted — only people with the station link</option></select></label>
   <button type="submit" disabled={loading||stations.length>=5}>{loading?'Creating station…':'Create my station'}</button>
  </form>}
  {error&&<p className={styles.error}>{error}</p>}{notice&&<p className={styles.notice}>{notice}</p>}
  {stations.length>0&&<div className={styles.list}><h3>Your stations</h3>{stations.map(s=><article key={s.id}><div><strong>{s.name}</strong><span>{s.description}</span><small>{s.visibility==='public'?'Public station':'Unlisted station'} · Magnanimous TV</small></div><a href={s.station_url} target="_blank" rel="noreferrer">Open station ↗</a></article>)}</div>}
  <p className={styles.disclaimer}>A station profile is not yet a live channel. Live ingest, scheduled playout, public HLS playback, creator moderation and social destinations are separate launch requirements.</p>
 </section>;
}
