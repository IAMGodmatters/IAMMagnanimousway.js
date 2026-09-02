'use client';

import { useEffect, useState } from 'react';

const api = process.env.NEXT_PUBLIC_API_BASE_URL || '';

type Plan = {
  plan: string;
  premium: boolean;
  status: string;
  price_cents: number;
  currency: string;
  interval: string;
  stripe_configured: boolean;
  webhook_configured: boolean;
  cancel_at_period_end?: boolean;
  current_period_end?: number | null;
  stripe_customer?: boolean;
};

async function read(response: Response) {
  const text = await response.text();
  try { return JSON.parse(text); } catch { return { error: text || `Request failed (${response.status})` }; }
}

export default function BillingPage() {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  function token() {
    return localStorage.getItem('iam_account_token') || localStorage.getItem('odin_admin_token') || '';
  }
  function headers() { return { Authorization: `Bearer ${token()}` }; }

  async function load() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${api}/api/billing/status`, { headers: headers(), cache: 'no-store' });
      const data = await read(response);
      if (response.status === 401) { location.replace('/login'); return; }
      if (!response.ok) throw new Error(data.error || 'Unable to load billing.');
      setPlan(data);
    } catch (e: any) {
      setError(e?.message || 'Unable to load billing.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!token()) { location.replace('/login'); return; }
    const query = new URLSearchParams(location.search);
    if (query.get('checkout') === 'success') setNotice('Payment completed. Your Premium access updates automatically after Stripe confirms the subscription.');
    if (query.get('checkout') === 'cancelled') setNotice('Checkout was cancelled. Your free plan is still active.');
    load();
  }, []);

  async function openCheckout() {
    setBusy('checkout'); setError(''); setNotice('');
    try {
      const response = await fetch(`${api}/api/billing/checkout`, { method: 'POST', headers: headers() });
      const data = await read(response);
      if (!response.ok) throw new Error(data.error || 'Unable to start checkout.');
      if (!data.url) throw new Error('Stripe did not return a checkout link.');
      location.href = data.url;
    } catch (e: any) {
      setError(e?.message || 'Unable to start checkout.');
      setBusy('');
    }
  }

  async function openPortal() {
    setBusy('portal'); setError(''); setNotice('');
    try {
      const response = await fetch(`${api}/api/billing/portal`, { method: 'POST', headers: headers() });
      const data = await read(response);
      if (!response.ok) throw new Error(data.error || 'Unable to open billing management.');
      if (!data.url) throw new Error('Stripe did not return a billing-management link.');
      location.href = data.url;
    } catch (e: any) {
      setError(e?.message || 'Unable to open billing management.');
      setBusy('');
    }
  }

  const endDate = plan?.current_period_end ? new Date(plan.current_period_end * 1000).toLocaleDateString() : '';

  return <main className="billing">
    <header><a href="/">← Dashboard</a><span>I AM MAGNANIMOUS WAY™ • PLAN & BILLING</span></header>

    <section className="hero">
      <small>FREE FIRST • PREMIUM OPTIONAL</small>
      <h1>Use I AM for free.<br/><em>Upgrade only when you want more.</em></h1>
      <p>The free workspace remains the foundation of the platform. Premium is an optional $49/month upgrade for users who want expanded automation, voice/video-agent capacity, and advanced business and creator workflows.</p>
      {!loading && plan && <div className="current">CURRENT PLAN <b>{plan.plan.toUpperCase()}</b><span>{plan.status}</span></div>}
    </section>

    {error && <div className="error">{error}</div>}
    {notice && <div className="notice">{notice}</div>}

    <section className="plans">
      <article>
        <div className="tag">MAIN PLAN</div>
        <h2>Free</h2>
        <div className="price"><b>$0</b><span>/ forever</span></div>
        <p>Start using the platform without a subscription.</p>
        <ul>
          <li>Odin and core AI tools</li>
          <li>Writing, research, Bible study, marketing and business helpers</li>
          <li>Core creator and social tools</li>
          <li>CRM, lead workspace and browser calling</li>
          <li>Personal workspace and connected-account controls</li>
          <li>Ad-supported access where enabled</li>
        </ul>
        <div className="active">{plan?.premium ? 'FREE ACCESS INCLUDED' : '✓ YOUR ACTIVE BASE PLAN'}</div>
      </article>

      <article className="premium">
        <div className="tag">OPTIONAL UPGRADE</div>
        <h2>Premium</h2>
        <div className="price"><b>$49</b><span>/ month</span></div>
        <p>For users who want more automation and higher-value agent workflows while keeping the same account.</p>
        <ul>
          <li>Everything included in Free</li>
          <li>Expanded AI and automation capacity</li>
          <li>Premium voice-agent and calling workflows</li>
          <li>Video/avatar assistant integration access</li>
          <li>Advanced creator, business and customer-service workflows</li>
          <li>Priority access to newly released premium capabilities</li>
        </ul>
        {loading ? <button disabled>LOADING…</button> : plan?.plan === 'owner' ?
          <div className="active gold">OWNER • FULL ACCESS</div> : plan?.premium ? <>
            <div className="active gold">✓ PREMIUM ACTIVE{plan.cancel_at_period_end && endDate ? ` UNTIL ${endDate}` : ''}</div>
            {plan.stripe_customer && <button onClick={openPortal} disabled={!!busy}>{busy === 'portal' ? 'OPENING…' : 'MANAGE BILLING'}</button>}
          </> :
          <button onClick={openCheckout} disabled={!!busy || !plan?.stripe_configured}>{busy === 'checkout' ? 'OPENING STRIPE…' : plan?.stripe_configured ? 'UPGRADE TO PREMIUM • $49/MO' : 'PREMIUM CHECKOUT NEEDS OWNER SETUP'}</button>
        }
        {!loading && plan && !plan.stripe_configured && <p className="setup">The platform is ready for Stripe, but the owner must connect the Stripe secret key before checkout can accept payments.</p>}
      </article>
    </section>

    <section className="promise">
      <div><small>NO FORCED PAYWALL</small><h3>The free platform stays useful.</h3><p>Premium is designed to fund higher-cost features and help cover operating expenses—not remove the core free experience.</p></div>
      <a href="/">RETURN TO I AM →</a>
    </section>

    <footer>Payments are processed by Stripe on Stripe-hosted checkout and billing pages. I AM does not store card numbers.</footer>

    <style jsx>{`
      .billing{min-height:100vh;background:#05090f;color:#eaf7ff;padding:24px 34px 70px;font-family:Inter,system-ui,sans-serif;background-image:radial-gradient(circle at 72% 12%,rgba(0,190,255,.13),transparent 30%),radial-gradient(circle at 18% 68%,rgba(242,181,70,.08),transparent 28%)}
      header{max-width:1180px;margin:auto;display:flex;justify-content:space-between;color:#6c8799;font-size:9px;letter-spacing:.16em}header a{color:#9be8ff;text-decoration:none}
      .hero{max-width:1180px;margin:26px auto 14px;padding:38px;border:1px solid #17364a;border-radius:24px;background:linear-gradient(130deg,#08141e,#05080d)}
      .hero small,.promise small{color:#e8b956;font-size:9px;font-weight:900;letter-spacing:.2em}.hero h1{font-size:clamp(42px,7vw,76px);line-height:.94;margin:10px 0}.hero h1 em{font-family:Georgia,serif;font-weight:400;color:#8de4ff}.hero p{max-width:850px;color:#8ca5b7;line-height:1.65}.current{display:inline-flex;align-items:center;gap:8px;margin-top:13px;padding:8px 11px;border:1px solid #24516a;border-radius:999px;color:#718da0;font-size:9px}.current b{color:#8fe5ff}.current span{color:#d9b769}
      .error,.notice{max-width:1180px;margin:10px auto;padding:12px 14px;border-radius:10px}.error{border:1px solid #71313a;background:#211014;color:#ffadb6}.notice{border:1px solid #24546d;background:#071923;color:#b9ebff}
      .plans{max-width:1180px;margin:auto;display:grid;grid-template-columns:1fr 1fr;gap:12px}.plans article{border:1px solid #173447;border-radius:20px;background:#071019;padding:28px;position:relative;overflow:hidden}.plans article.premium{border-color:#69512a;background:linear-gradient(145deg,#0a1118,#121006)}.plans article.premium:after{content:'';position:absolute;width:240px;height:240px;border-radius:50%;right:-110px;top:-110px;background:rgba(229,174,69,.06)}
      .tag{color:#668398;font-size:8px;letter-spacing:.2em}.premium .tag{color:#e1b15a}.plans h2{font-size:34px;margin:8px 0}.price{display:flex;align-items:end;gap:6px}.price b{font-size:54px;line-height:1}.price span{color:#70899a;margin-bottom:8px}.plans p{color:#819aaa;line-height:1.55}.plans ul{list-style:none;padding:0;margin:22px 0}.plans li{padding:9px 0;border-bottom:1px solid #112b3b;color:#aec2cf;font-size:12px}.plans li:before{content:'✓';color:#66d8ff;margin-right:9px}.premium li:before{color:#e6b758}
      button{width:100%;border:0;border-radius:10px;padding:13px 15px;background:linear-gradient(90deg,#168eb8,#b27b27);color:white;font-weight:900;cursor:pointer}button:disabled{opacity:.5;cursor:default}.active{border:1px solid #205441;border-radius:10px;padding:12px;color:#82e2aa;text-align:center;font-size:10px;font-weight:900}.active.gold{border-color:#675126;color:#f3c76d}.setup{font-size:9px!important;color:#d1ae6d!important}
      .promise{max-width:1180px;margin:14px auto;padding:25px;border:1px solid #273b47;border-radius:17px;display:flex;justify-content:space-between;align-items:center;gap:20px;background:#071019}.promise h3{font-size:27px;margin:5px 0}.promise p{margin:0;color:#7b94a4}.promise a{color:#9be7ff;text-decoration:none;white-space:nowrap}
      footer{max-width:1180px;margin:20px auto;color:#5e7889;font-size:9px;border-top:1px solid #112b3b;padding-top:14px}
      @media(max-width:760px){.billing{padding:18px 14px 55px}.plans{grid-template-columns:1fr}.hero{padding:27px}.promise{align-items:flex-start;flex-direction:column}.promise a{white-space:normal}}
    `}</style>
  </main>;
}
