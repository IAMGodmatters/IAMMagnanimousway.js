import Link from 'next/link';
import styles from './tv-network.module.css';
import ProgrammeGuide from './programme-guide';

export type TvChannelKey='philippines'|'worldwide';
const channelData={
  philippines:{
    name:'Magnanimous TV Philippines',label:'PHILIPPINE EDITION',flag:'🇵🇭',
    intro:'A channel for the people, places and stories of the Philippines — from local communities to national conversations.',
    focus:['Philippine news and public affairs','Cebuano and regional voices','Entertainment and original Filipino productions','Education, documentaries and science','Philippine sports and community events','Lifestyle, food, travel and culture','Faith and inspiration'],
    languages:'Filipino · English · Cebuano · Regional languages',
    audience:'Intended for viewers in the Philippines.',
    territory:'Philippines-only access is a planned requirement. Geographic access control is not active until a server-side provider is configured and independently tested.'
  },
  worldwide:{
    name:'Magnanimous TV Worldwide',label:'GLOBAL EDITION',flag:'🌏',
    intro:'A global meeting place for Filipinos abroad and viewers everywhere — connecting communities through Filipino stories and international programming.',
    focus:['Filipino communities and diaspora stories','International news and documentaries','Filipino entertainment and original productions','Education, technology and science','Culture, travel, food and lifestyle','Sports and community events','Faith and inspiration'],
    languages:'English · Filipino · Cebuano',
    audience:'Intended for worldwide viewing, including Filipinos overseas.',
    territory:'Worldwide distribution is planned. Actual availability will depend on the selected streaming host, content rights and applicable regional restrictions.'
  }
} satisfies Record<TvChannelKey,{name:string;label:string;flag:string;intro:string;focus:string[];languages:string;audience:string;territory:string}>;

export function TvChannelPage({channel}:{channel:TvChannelKey}){
  const data=channelData[channel];
  return <main className={styles.page}>
    <header className={styles.topbar}><Link href="/tv" className={styles.brand}><span className={styles.brandMark}>M</span><span><strong>MAGNANIMOUS TV</strong><small>AN INTERNET TELEVISION NETWORK</small></span></Link><Link href="/tv" className={styles.backLink}>← All channels</Link></header>
    <section className={styles.channelHero}>
      <p className={styles.eyebrow}>{data.label}</p><div className={styles.channelHeroFlag}>{data.flag}</div><h1>{data.name}</h1><p>{data.intro}</p><span className={styles.prelaunch}>● BROADCAST FEED NOT CONNECTED</span>
    </section>
    <section className={styles.playerSection}>
      <div className={styles.player} role="status" aria-label="Broadcast player not connected"><div className={styles.playIcon}>▶</div><strong>Live feed is not connected</strong><span>The live television feed has not been connected yet.</span><small>We will show the broadcast here once a rights-cleared stream is configured and tested.</small></div>
      <div className={styles.playerInfo}><p className={styles.eyebrow}>CHANNEL INFORMATION</p><h2>Watch {data.name}</h2><p>{data.audience}</p><p className={styles.territory}>{data.territory}</p><div className={styles.languagePill}>{data.languages}</div></div>
    </section>
    <section className={styles.channelPrograms}><p className={styles.eyebrow}>PROGRAMMING AREAS</p><h2>What this channel will cover</h2><div className={styles.focusGrid}>{data.focus.map((item,i)=><div className={styles.focusItem} key={item}><span>0{i+1}</span>{item}</div>)}</div></section>
    <section className={styles.featuredProgramme}>
      <p className={styles.eyebrow}>OPEN-LICENSED FILIPINO PROGRAMME</p>
      <h2>Bahay Kubo — Kabataang Silay Rondalla</h2>
      <p className={styles.featuredIntro}>A Filipino folk-song performance that can be watched here without you uploading a video. The file is hosted by Wikimedia Commons and carries a Creative Commons Attribution 3.0 licence.</p>
      <video className={styles.featuredPlayer} controls preload="metadata" playsInline>
        <source src="https://upload.wikimedia.org/wikipedia/commons/a/ab/Bahay_Kubo_by_Kabataang_Silay_Rondalla.webm" type="video/webm"/>
        Your browser does not support WebM video. <a href="https://commons.wikimedia.org/wiki/File:Bahay_Kubo_by_Kabataang_Silay_Rondalla.webm">Open the programme on Wikimedia Commons</a>.
      </video>
      <p className={styles.featuredCredit}>Attribution: marsilingco · Performer: Kabataang Silay Rondalla · <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noreferrer">CC BY 3.0</a> · No changes made.</p>
      <p className={styles.featuredCredit}>Source and licence record: <a href="https://commons.wikimedia.org/wiki/File:Bahay_Kubo_by_Kabataang_Silay_Rondalla.webm" target="_blank" rel="noreferrer">Wikimedia Commons file page</a>.</p>
    </section>
    <ProgrammeGuide channel={channel}/>
    <footer className={styles.footer}><span>Magnanimous TV Network</span><span>Presented by I Am Magnanimous Way™</span><Link href="/tv">Switch channel</Link></footer>
    <p className={styles.disclaimer}>Internet streaming only. This page does not represent a licensed terrestrial broadcast. Actual launch requires a working stream, rights-cleared programming, tested access controls and applicable legal/compliance review.</p>
  </main>;
}
