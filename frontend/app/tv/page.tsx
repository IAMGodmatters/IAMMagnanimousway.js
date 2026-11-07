import Link from 'next/link';
import type {Metadata} from 'next';
import styles from './tv-network.module.css';

export const metadata:Metadata={
  title:'Magnanimous TV Network',
  description:'Two internet television channels: a Philippines edition and a worldwide edition for Filipino communities everywhere.',
};

const categories=['News & public affairs','Entertainment','Education & documentaries','Sports','Lifestyle & community','Filipino culture','Faith & inspiration'];

export default function TvNetworkPage(){
  return <main className={styles.page}>
    <header className={styles.topbar}>
      <Link href="/" className={styles.brand}><span className={styles.brandMark}>M</span><span><strong>MAGNANIMOUS TV</strong><small>AN INTERNET TELEVISION NETWORK</small></span></Link>
      <span className={styles.networkStatus}>NETWORK PREVIEW</span>
    </header>
    <section className={styles.hero}>
      <p className={styles.eyebrow}>ONE NETWORK · TWO CHANNELS · FILIPINO STORIES EVERYWHERE</p>
      <h1>Television that brings<br/><em>people together.</em></h1>
      <p className={styles.heroText}>A home for Philippine stories, entertainment, learning, culture and community — made for viewers at home and Filipinos around the world.</p>
      <div className={styles.heroMeta}><span>🇵🇭 Philippines</span><span>🌏 Worldwide</span><span>English · Filipino · Cebuano</span></div>
    </section>
    <section className={styles.channels} aria-labelledby="channels-title">
      <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>CHOOSE YOUR CHANNEL</p><h2 id="channels-title">Two destinations. One network.</h2></div><p>Both channels share one network identity and programming library, with separate audience experiences.</p></div>
      <div className={styles.channelGrid}>
        <article className={styles.channelCard}>
          <div className={styles.channelArt + ' ' + styles.phArt}><span className={styles.channelNumber}>01 / PH</span><span className={styles.globe}>🇵🇭</span><span className={styles.artLabel}>PHILIPPINE EDITION</span></div>
          <div className={styles.cardBody}><div className={styles.cardTitle}><h3>Magnanimous TV Philippines</h3><span className={styles.coming}>PRE-LAUNCH</span></div><p>Programming focused on life across the Philippines, including regional voices, local stories and national conversations.</p><ul><li>Philippine news and public affairs</li><li>Regional and Cebuano programming</li><li>Entertainment, education and sports</li></ul><Link className={styles.primaryLink} href="/tv/philippines">Explore Philippines channel <span>→</span></Link></div>
        </article>
        <article className={styles.channelCard}>
          <div className={styles.channelArt + ' ' + styles.worldArt}><span className={styles.channelNumber}>02 / WORLD</span><span className={styles.globe}>🌏</span><span className={styles.artLabel}>GLOBAL EDITION</span></div>
          <div className={styles.cardBody}><div className={styles.cardTitle}><h3>Magnanimous TV Worldwide</h3><span className={styles.coming}>PRE-LAUNCH</span></div><p>Filipino stories and international programming for overseas communities, families and viewers everywhere.</p><ul><li>Filipino communities worldwide</li><li>International features and documentaries</li><li>Culture, entertainment and learning</li></ul><Link className={styles.primaryLink} href="/tv/worldwide">Explore worldwide channel <span>→</span></Link></div>
        </article>
      </div>
    </section>
    <section className={styles.programming}>
      <p className={styles.eyebrow}>A NETWORK FOR EVERYONE</p><h2>More than one kind of story.</h2>
      <p className={styles.programmingIntro}>Magnanimous TV is a general-interest network. Faith and inspiration are included as one subject area among many — not the whole channel.</p>
      <div className={styles.categoryGrid}>{categories.map((item,index)=><div className={styles.category} key={item}><span>{['◉','✦','▤','◈','⌂','◎','✧'][index]}</span>{item}</div>)}</div>
    </section>
    <section className={styles.creator}>
      <div><p className={styles.eyebrow}>BUILT WITH THE COMMUNITY</p><h2>Filipino creators belong here.</h2><p>We plan to welcome independent producers, community storytellers and documentary makers. Submissions will open after the review, rights-clearance and moderation process is ready.</p></div>
      <div className={styles.creatorNote}><strong>Creator submissions</strong><span>Opening after launch-readiness checks</span><small>Programs must be original or properly licensed. Every submission will be reviewed before any broadcast.</small></div>
    </section>
    <footer className={styles.footer}><span>Magnanimous TV Network</span><span>Presented by I Am Magnanimous Way™</span><Link href="/">Return to Magnanimous</Link></footer>
    <p className={styles.disclaimer}>This is an internet-TV pre-launch website, not a terrestrial television broadcast. No live feed is connected yet. Channel availability, geographic restrictions, schedules and program rights must be configured and tested before public broadcast.</p>
  </main>;
}
