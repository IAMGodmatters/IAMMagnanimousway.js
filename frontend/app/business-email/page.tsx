export const metadata = {
  title: 'Business Email Center | I AM Magnanimous Way',
  description: 'Set up a legitimate professional business email through official providers, then connect it to your I AM assistant.'
};

const providers = [
  {
    name: 'Cloudflare Email Routing',
    badge: 'FREE RECEIVING / FORWARDING',
    href: 'https://www.cloudflare.com/products/email-routing/',
    best: 'Best free option when you already own a domain and mainly need professional incoming addresses.',
    detail: 'Create addresses such as hello@yourbusiness.com and forward incoming mail to an inbox you already use. Cloudflare Email Routing is free, but it is not a full outbound mailbox by itself.',
    tier: 'Free where supported'
  },
  {
    name: 'Zoho Mail',
    badge: 'FREE PLAN IN SELECTED REGIONS',
    href: 'https://www.zoho.com/mail/',
    best: 'Strong low-cost choice for a real custom-domain mailbox.',
    detail: 'Zoho supports custom-domain business email. Its Forever Free plan can host one domain for up to five users with web-only access in selected data centers; availability depends on region.',
    tier: 'Free / Paid'
  },
  {
    name: 'Google Workspace',
    badge: 'OFFICIAL GOOGLE BUSINESS EMAIL',
    href: 'https://workspace.google.com/',
    best: 'Best for businesses that want Gmail with their own domain.',
    detail: 'Use a custom address such as you@yourcompany.com with Gmail, Drive, Calendar and Google business tools.',
    tier: 'Paid'
  },
  {
    name: 'Microsoft 365',
    badge: 'OFFICIAL MICROSOFT BUSINESS EMAIL',
    href: 'https://www.microsoft.com/microsoft-365/business',
    best: 'Best for Outlook, Teams and Microsoft business tools.',
    detail: 'Microsoft 365 Business plans support custom business email such as you@yourbusiness.com together with Outlook and Microsoft services.',
    tier: 'Paid'
  },
  {
    name: 'Proton for Business',
    badge: 'PRIVACY-FIRST BUSINESS EMAIL',
    href: 'https://proton.me/business/mail',
    best: 'Best when privacy and encrypted business communication are priorities.',
    detail: 'Paid Proton business plans support custom email domains and professional addresses with privacy-focused mail and calendar tools.',
    tier: 'Paid'
  }
];

export default function BusinessEmailPage(){
  return <main className="page">
    <header><a href="/">← Dashboard</a><span>OFFICIAL BUSINESS EMAIL CENTER</span></header>

    <section className="hero">
      <small>100% LEGITIMATE PROVIDER PATHS</small>
      <h1>Get a real business email from the official provider.</h1>
      <p>I AM does not sell fake inboxes, recycled accounts, or unofficial “aged” email accounts. Choose an established provider, create or verify your own business domain, then connect the resulting Gmail or Outlook mailbox to your personal assistant if you want AI help with email.</p>
      <div className="actions"><a href="/connections">CONNECT MY EMAIL TO AI →</a><a href="/assistant-actions">OPEN MY ASSISTANT</a></div>
    </section>

    <section className="guide">
      <div><b>1</b><span>Own or buy a domain</span></div>
      <div><b>2</b><span>Choose an official email provider</span></div>
      <div><b>3</b><span>Verify the domain with that provider</span></div>
      <div><b>4</b><span>Create your business address</span></div>
      <div><b>5</b><span>Connect Gmail/Outlook to I AM if desired</span></div>
    </section>

    <section className="notice"><b>Important:</b> A legitimate custom-domain email normally requires control of the domain. Free options can have limits. Cloudflare Email Routing is excellent for free incoming forwarding, but a full send-and-receive mailbox requires an email/SMTP provider.</section>

    <section className="grid">
      {providers.map(p=><article key={p.name}>
        <div className="top"><small>{p.badge}</small><span>{p.tier}</span></div>
        <h2>{p.name}</h2>
        <h3>{p.best}</h3>
        <p>{p.detail}</p>
        <a href={p.href} target="_blank" rel="noreferrer">OPEN OFFICIAL PROVIDER ↗</a>
      </article>)}
    </section>

    <section className="automation">
      <small>SELF-SERVICE AUTOMATION</small>
      <h2>No platform-owner approval is required.</h2>
      <p>Each user authorizes their own account at the provider. Once connected, I AM automatically applies that user’s Free or Full Business tier. The user can allow or disable AI read/write access for their own connected accounts. You, as platform owner, do not have to approve every connection, post, email action or social-media command.</p>
      <div><a href="/connections">LINK ACCOUNTS →</a><a href="/pricing">COMPARE FREE & FULL BUSINESS</a></div>
    </section>

    <footer>Official provider links only • User-owned domain verification • Secure provider authorization • No unofficial business-email accounts</footer>

    <style>{`
      *{box-sizing:border-box}.page{min-height:100vh;background:#050a10;color:#ecf9ff;padding:24px 32px 70px;font-family:Inter,system-ui,sans-serif;background-image:radial-gradient(circle at 78% 14%,rgba(30,190,255,.12),transparent 30%),radial-gradient(circle at 15% 80%,rgba(255,184,60,.08),transparent 28%)}header{max-width:1320px;margin:auto;display:flex;justify-content:space-between;font-size:10px;letter-spacing:.16em;color:#6f8898}header a{color:#91e5ff;text-decoration:none}.hero{max-width:1320px;margin:26px auto 12px;padding:38px;border:1px solid #183a4e;border-radius:24px;background:linear-gradient(125deg,#081722,#05090e)}.hero small,.automation small{color:#e9b957;font-weight:900;letter-spacing:.18em;font-size:9px}.hero h1{font-size:clamp(40px,6vw,72px);line-height:.98;margin:10px 0}.hero p,.automation p{max-width:920px;color:#8ba5b6;line-height:1.65}.actions,.automation div{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}.actions a,.automation a{padding:11px 14px;border:1px solid #28556d;border-radius:9px;text-decoration:none;color:#bcefff;font-size:10px;font-weight:900}.guide{max-width:1320px;margin:10px auto;display:grid;grid-template-columns:repeat(5,1fr);gap:8px}.guide div{border:1px solid #153449;background:#071019;border-radius:12px;padding:14px;display:flex;gap:9px;align-items:center}.guide b{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;background:#0d2b3c;color:#69ddff}.guide span{font-size:10px;color:#8aa2b1}.notice{max-width:1320px;margin:10px auto;border:1px solid #5d4829;background:#151108;border-radius:12px;padding:14px;color:#c9b58c;line-height:1.55;font-size:11px}.grid{max-width:1320px;margin:auto;display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.grid article{border:1px solid #17374a;border-radius:16px;background:#071019;padding:20px}.top{display:flex;justify-content:space-between;gap:10px}.top small{color:#6edfff;font-size:8px;letter-spacing:.12em;font-weight:900}.top span{font-size:9px;color:#d9b365}.grid h2{font-size:26px;margin:9px 0 5px}.grid h3{font-size:13px;color:#c8eafa;margin:0 0 8px}.grid p{color:#7892a3;line-height:1.6;font-size:11px;min-height:54px}.grid a{display:inline-block;margin-top:8px;color:#7de2ff;text-decoration:none;border:1px solid #214b61;border-radius:8px;padding:10px 12px;font-size:9px;font-weight:900}.automation{max-width:1320px;margin:12px auto;padding:28px;border:1px solid #3f3927;border-radius:17px;background:linear-gradient(120deg,#0e0d08,#071019)}.automation h2{font-size:32px;margin:7px 0}footer{max-width:1320px;margin:22px auto 0;border-top:1px solid #142d3e;padding-top:15px;color:#627c8d;font-size:9px}@media(max-width:900px){.guide{grid-template-columns:1fr 1fr}.grid{grid-template-columns:1fr}.page{padding:18px 14px}.hero{padding:25px}}@media(max-width:520px){.guide{grid-template-columns:1fr}.hero h1{font-size:40px}}
    `}</style>
  </main>
}
