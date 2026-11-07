import Link from 'next/link';
import type {Metadata} from 'next';
import styles from './studio.module.css';

export const metadata:Metadata={title:'Magnanimous TV Studio | Magnanimous',description:'The Magnanimous TV control room for creators and personal stations.'};

const tools=[
 {title:'Video Studio',detail:'Prepare recordings and video projects with Magnanimous tools.',href:'/video-studio',action:'Open Video Studio',mark:'VS'},
 {title:'Native Video Stack',detail:'Use your camera, record, upload, edit and manage private media.',href:'/video-stack',action:'Open Video Stack',mark:'NV'},
 {title:'Social Studio',detail:'Prepare social publishing and connected destinations where authorized.',href:'/social-media',action:'Open Social Studio',mark:'SS'},
 {title:'Philippines Channel',detail:'Preview the local edition of the Magnanimous network.',href:'/tv/philippines',action:'View channel',mark:'PH'},
 {title:'Worldwide Channel',detail:'Preview the global edition for Filipinos abroad and worldwide viewers.',href:'/tv/worldwide',action:'View channel',mark:'🌏'}
];

export default function TvStudioPage(){
 return <main className={styles.page}>
  <header className={styles.topbar}><Link href="/tv" className={styles.brand}><span className={styles.brandMark}>M</span><span><strong>MAGNANIMOUS TV</strong><small>CREATOR CONTROL ROOM</small></span></Link><Link href="/tv" className={styles.back}>← Network home</Link></header>
  <section className={styles.hero}><p className={styles.eyebrow}>MAGNANIMOUS BROADCASTING</p><h1>Your station starts here.</h1><p>One place to prepare programmes, create your own station identity, and work toward broadcasting to your audience. Every station is built on Magnanimous technology and carries the Magnanimous TV mark.</p><div className={styles.heroBadges}><span>Free-first tools</span><span>Personal creator workflow</span><span>Worldwide-ready design</span></div></section>
  <section className={styles.section}><div className={styles.sectionTitle}><div><p className={styles.eyebrow}>YOUR CREATOR TOOLS</p><h2>Open your production workspace</h2></div><p>These tools already exist in Magnanimous. No duplicate media library is being created.</p></div><div className={styles.toolGrid}>{tools.map((tool)=><article className={styles.tool} key={tool.href}><span className={styles.mark}>{tool.mark}</span><h3>{tool.title}</h3><p>{tool.detail}</p><Link href={tool.href}>{tool.action} <span>→</span></Link></article>)}</div></section>
  <section className={styles.section}><p className={styles.eyebrow}>AUTOMATIC PROGRAMMING</p><h2>Start with information we can lawfully reuse.</h2><p className={styles.copy}>The first automatic programme format should be original Magnanimous explainers built from PSA OpenSTAT aggregated statistics. PSA says OpenSTAT data can be freely reused and redistributed with source attribution, and publishes an API for automated reporting. The exact dataset, table, release, units and attribution must travel with each bulletin. PSA Data Archive microdata has different, restrictive terms and must not be treated as OpenSTAT. News stories, films, songs and artist recordings are not automatically cleared just because they are online.</p><div className={styles.source}><div><strong>PSA OpenSTAT</strong><span>Official Philippine statistics · open-data reuse with source attribution · API rate limit: 10 requests per 10 seconds</span></div><a href="https://openstat.psa.gov.ph/About" target="_blank" rel="noreferrer">Read OpenSTAT licence ↗</a></div><div className={styles.source}><div><strong>IPOPHL copyright guidance</strong><span>Check permissions for songs, recordings, performances and video before broadcasting.</span></div><a href="https://www.ipophil.gov.ph/copyright/" target="_blank" rel="noreferrer">Read guidance ↗</a></div></section>
  <section className={styles.notice}><strong>Live broadcasting status</strong><p>The existing video stack can record, upload, play and edit media. Its current live endpoint creates a session record only; it does not yet transmit a live feed to viewers. The production media server, scheduled playout, destination connections and rights-cleared programme library must be completed and tested before this studio is advertised as a live broadcast service.</p><Link href="/video-stack">Open the existing native video stack →</Link></section>
  <footer className={styles.footer}><span>Magnanimous TV Studio</span><span>Powered by I Am Magnanimous Way™</span><Link href="/">Magnanimous home</Link></footer>
 </main>;
}
