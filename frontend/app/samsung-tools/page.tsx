import styles from './samsung-tools.module.css';

export default function SamsungToolsPage(){
 return <main className={styles.shell}>
  <header className={styles.header}><a className={styles.brand} href="/">I AM MAGNANIMOUS WAY™</a><nav aria-label="Site navigation"><a href="/free-tools">Free Tools</a><a href="/solutions">Solutions</a><a href="/">Home</a></nav></header>
  <section className={styles.hero}>
   <div className={styles.overline}>FREE OPEN-SOURCE RESOURCE · SAMSUNG</div>
   <h1>Samsung device diagnostics, with control kept in your hands.</h1>
   <p className={styles.lead}>Explore <strong>Heimdall</strong>, the independent MIT-licensed Samsung USB toolkit. Magnanimous AI integrates <strong>consent-gated local USB detection</strong> for authorized owners through its protected Local Bridge.</p>
   <div className={styles.actions}><a className={styles.primary} href="https://github.com/Benjamin-Dobell/Heimdall" rel="noopener noreferrer" target="_blank">EXPLORE ORIGINAL SOURCE ↗</a><a className={styles.secondary} href="/local-bridge">OWNER DIAGNOSTICS →</a></div>
   <div className={styles.facts}><span>Free software</span><span>Local installation required</span><span>No public firmware-write controls</span></div>
  </section>
  <section className={styles.content} aria-label="Open-source Samsung tools">
   <div className={styles.heading}><small>WHAT IS INCLUDED</small><h2>Free to research. Private by design.</h2><p>Magnanimous AI retains identity, reasoning, permissions, and orchestration. Heimdall is separate, optional device-servicing infrastructure.</p></div>
   <div className={styles.cards}>
    <article><span>01 / SOURCE</span><h3>Legitimate, open-source code</h3><p>Read the original Heimdall project and its documentation. The MIT license permits commercial use and modification when required notices are retained.</p><a href="https://github.com/Benjamin-Dobell/Heimdall/blob/master/LICENSE" rel="noopener noreferrer" target="_blank">ORIGINAL MIT LICENSE ↗</a></article>
    <article><span>02 / INSTALLATION</span><h3>Owner-local software status</h3><p>The protected Magnanimous Local Bridge can identify an installed Heimdall executable and check its reported version, without touching a connected phone.</p><a href="/local-bridge">OPEN OWNER LOCAL BRIDGE →</a></article>
    <article><span>03 / USB DETECTION</span><h3>Device-owner permission first</h3><p>With the local CLI and compatible hardware, owners may separately authorize and confirm a limited USB detection task. This is not remote phone repair offered to the public.</p><a href="/local-bridge">AUTHORIZED OWNER CONTROLS →</a></article>
   </div>
  </section>
  <section className={styles.safety}><div><small>SAFETY & COMPATIBILITY</small><h2>No firmware flashing through the public website.</h2></div><div><p>Heimdall's original project contains firmware flashing and partition tools, but <strong>Magnanimous does not expose those operations remotely.</strong> There is no account-lock bypass, device erase, unrestricted shell, or automatic driver replacement.</p><p>Its code is older, and compatibility with recent Samsung devices is not guaranteed. A trusted local executable, permission to service the device, proper backups, and physical testing are necessary. The public page itself never accesses a USB device.</p></div></section>
  <section className={styles.resources}><div><small>ATTRIBUTION</small><h2>Original software, original credit.</h2><p>Heimdall: copyright © Benjamin Dobell and Glass Echidna, MIT license. Proprietary firmware and drivers may have separate terms. Magnanimous AI is not an official Heimdall distributor or partner.</p></div><div className={styles.resourceLinks}><a href="https://github.com/Benjamin-Dobell/Heimdall" rel="noopener noreferrer" target="_blank">Official upstream repository ↗</a><a href="https://github.com/Benjamin-Dobell/Heimdall/blob/master/README.md" rel="noopener noreferrer" target="_blank">Project documentation ↗</a><a href="https://github.com/Benjamin-Dobell/Heimdall/blob/master/LICENSE" rel="noopener noreferrer" target="_blank">MIT license ↗</a><a href="/free-tools">More free tools →</a></div></section>
  <footer className={styles.footer}><a href="/">I AM MAGNANIMOUS WAY™</a><span>Public information does not grant access to private devices or computers.</span></footer>
 </main>
}
