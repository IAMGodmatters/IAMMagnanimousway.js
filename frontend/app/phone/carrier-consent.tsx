'use client';

import { useEffect, useRef, useState } from 'react';

const api = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export default function CarrierConsent() {
  const [visible, setVisible] = useState(false);
  const [provider, setProvider] = useState('Twilio AI carrier');
  const [contactPermission, setContactPermission] = useState(false);
  const [aiDisclosure, setAiDisclosure] = useState(true);
  const consentRef = useRef(false);
  const disclosureRef = useRef(true);

  useEffect(() => { consentRef.current = contactPermission; }, [contactPermission]);
  useEffect(() => { disclosureRef.current = aiDisclosure; }, [aiDisclosure]);

  useEffect(() => {
    const nativeFetch = window.fetch.bind(window);
    const token = localStorage.getItem('odin_admin_token') || localStorage.getItem('iam_account_token') || '';

    nativeFetch(`${api}/api/phone/config`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      cache: 'no-store'
    }).then(async response => {
      const data = await response.json().catch(() => ({}));
      if (response.ok && data?.aiCarrier) {
        setVisible(true);
        setProvider(data.provider || 'Twilio AI carrier');
      }
    }).catch(() => {});

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const target = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      const outbound = target.includes('/api/phone/calls/outbound') && String(init?.method || 'GET').toUpperCase() === 'POST';
      if (!outbound) return nativeFetch(input, init);

      let payload: any = {};
      try { payload = init?.body ? JSON.parse(String(init.body)) : {}; } catch { payload = {}; }
      payload.consent_confirmed = consentRef.current;
      payload.ai_disclosure_accepted = disclosureRef.current;
      const headers = new Headers(init?.headers || {});
      headers.set('content-type', 'application/json');
      return nativeFetch(input, { ...init, headers, body: JSON.stringify(payload) });
    };

    return () => { window.fetch = nativeFetch; };
  }, []);

  if (!visible) return null;

  return <aside className="carrierConsent">
    <div className="head"><span>●</span><div><small>CARRIER MODE</small><b>{provider}</b></div></div>
    <p>Carrier calls from the Call Center use your automated MAGNANIMOUS AI receptionist. Confirm these before pressing <strong>PLACE PHONE CALL</strong>.</p>
    <label><input type="checkbox" checked={contactPermission} onChange={event => setContactPermission(event.target.checked)} /><span>I confirm this person may be contacted and this outreach follows the rules that apply to me.</span></label>
    <label><input type="checkbox" checked={aiDisclosure} onChange={event => setAiDisclosure(event.target.checked)} /><span>The call will clearly disclose that the assistant is automated AI and is not a human.</span></label>
    <div className={contactPermission && aiDisclosure ? 'ready' : 'waiting'}>{contactPermission && aiDisclosure ? 'READY FOR CARRIER CALL' : 'CONFIRM CONTACT PERMISSION'}</div>
    <a href="/ai-receptionist">Open full AI Receptionist controls →</a>
    <style jsx>{`
      .carrierConsent{position:fixed;right:18px;bottom:78px;z-index:2147482500;width:min(390px,calc(100vw - 36px));box-sizing:border-box;padding:16px;border:1px solid #23566c;border-radius:16px;background:rgba(5,15,23,.97);color:#e9f8ff;box-shadow:0 22px 70px rgba(0,0,0,.58);font-family:Inter,system-ui,sans-serif}.head{display:flex;gap:9px;align-items:center}.head>span{color:#62e5aa}.head small{display:block;color:#5d8498;font-size:8px;letter-spacing:.15em}.head b{font-size:12px}.carrierConsent p{color:#8ca6b5;font-size:11px;line-height:1.5}.carrierConsent label{display:flex;gap:8px;align-items:flex-start;margin:9px 0;color:#bfd4df;font-size:10px;line-height:1.45}.carrierConsent input{margin-top:2px}.ready,.waiting{margin-top:10px;padding:8px 10px;border-radius:8px;font-size:9px;font-weight:900;letter-spacing:.1em}.ready{border:1px solid #27634f;color:#70e7b1;background:#092118}.waiting{border:1px solid #654f24;color:#f1c966;background:#20190a}.carrierConsent a{display:block;margin-top:10px;color:#79dcff;text-decoration:none;font-size:10px}@media(max-width:650px){.carrierConsent{right:10px;bottom:70px;width:calc(100vw - 20px)}}
    `}</style>
  </aside>;
}
