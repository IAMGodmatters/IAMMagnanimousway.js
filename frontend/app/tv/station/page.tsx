'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import styles from './station.module.css';

const api=process.env.NEXT_PUBLIC_API_BASE_URL||'';
type Station={name:string;slug:string;description:string;visibility:string;primary_color:string;secondary_color:string;station_url:string};
export default function PublicTvStation(){
 const[station,setStation]=useState<Station|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(true);
 useEffect(()=>{const slug=new URLSearchParams(window.location.search).get('slug')||'';if(!/^[a-z0-9](?:[a-z0-9-]{1,46}[a-z0-9])?$/.test(slug)){setError('This station address is not valid.');setLoading(false);return}fetch(api+'/api/tv/stations/public/'+encodeURIComponent(slug),{cache:'no-store'}).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.detail||'Station not found.');setStation(d)}).catch(e=>setError(e.message||'Station could not be loaded.')).finally(()=>setLoading(false))},[]);
 if(loading)return <main className={styles.page}><p>Loading Magnanimous TV station…</p></main>;
 if(error||!station)return <main className={styles.page}><header><Link href="/tv" className={styles.brand}>MAGNANIMOUS TV</Link></header><section className={styles.empty}><h1>Station not found</h1><p>{error||'This station is not available.'}</p><Link href="/tv/studio">Create your own station →</Link></section></main>;
 return <main className={styles.page} style={{'--station-primary':station.primary_color,'--station-secondary':station.secondary_color} as React.CSSProperties}>
  <header className={styles.topbar}><Link href="/tv" className={styles.brand}><span className={styles.mark}>M</span><span><strong>MAGNANIMOUS TV</strong><small>POWERED BY I AM MAGNANIMOUS WAY™</small></span></Link><Link href="/tv" className={styles.back}>Magnanimous TV Network</Link></header>
  <section className={styles.hero}><p className={styles.eyebrow}>PERSONAL STATION · {station.visibility.toUpperCase()}</p><h1>{station.name}</h1><p>{station.description}</p><span className={styles.brandline}>A PERSONAL CHANNEL ON MAGNANIMOUS TV</span></section>
  <section className={styles.player}><div className={styles.play}>▶</div><h2>Broadcast coming soon</h2><p>This station profile is ready. Its live stream and scheduled programme feed have not been connected yet.</p><span>MAGNANIMOUS TV · YOUR STATION</span></section>
  <footer className={styles.footer}><span>{station.name}</span><span>Powered by I Am Magnanimous Way™</span><Link href="/tv/studio">Create or manage a station</Link></footer>
 </main>;
}
