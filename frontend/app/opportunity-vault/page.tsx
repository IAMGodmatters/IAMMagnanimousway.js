const VAULT_URL='https://opportunity-vault-n6t5cz.v2.appdeploy.ai/';

export default function OpportunityVaultBridge(){
 return <main className="vault-bridge">
  <section>
   <small>SEPARATE PRODUCT • NOT PART OF MAGNANIMOUS AI</small>
   <h1>Opportunity Vault</h1>
   <p>Opportunity Vault stays separate from I AM MAGNANIMOUS WAY™ and Magnanimous AI. This page is only a safe doorway to the standalone paid opportunity platform.</p>
   <a href={VAULT_URL}>Open the standalone Opportunity Vault →</a>
   <p className="note">The standalone Vault curates outside opportunities and official source links. I AM MAGNANIMOUS WAY™ does not control acceptance, task availability, pay, or payouts from those outside sources.</p>
  </section>
  <style jsx>{`
   .vault-bridge{min-height:100vh;display:grid;place-items:center;background:#060a11;color:#eef8ff;padding:24px;font-family:Inter,system-ui,sans-serif}
   section{width:min(760px,100%);border:1px solid #294152;border-radius:24px;background:#0a111b;padding:clamp(28px,6vw,56px);box-shadow:0 24px 80px rgba(0,0,0,.35)}
   small{color:#7de6f8;font-weight:900;letter-spacing:.12em}
   h1{font-size:clamp(44px,8vw,76px);line-height:.95;margin:16px 0}
   p{color:#a9b8c7;font-size:18px;line-height:1.65}
   a{display:inline-block;margin:14px 0;padding:14px 18px;border-radius:12px;background:#123746;color:#e9fbff;text-decoration:none;font-weight:900;border:1px solid #3d7b91}
   .note{font-size:14px;color:#8496a8}
  `}</style>
 </main>
}
