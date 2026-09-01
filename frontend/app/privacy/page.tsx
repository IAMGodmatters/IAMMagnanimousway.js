import React from 'react';

export default function PrivacyPage(){
  return <main style={s.page}><article style={s.card}>
    <a href="/signup" style={s.back}>← Back to signup</a>
    <div style={s.eyebrow}>I AM MAGNANIMOUS WAY™</div>
    <h1 style={s.h1}>Privacy Notice</h1>
    <p style={s.meta}>Effective September 1, 2026 • Version 1.0-2026-09-01</p>

    <p>I AM Magnanimous Way provides account-based AI, workspace, CRM, creator, and related platform services. This notice explains what personal information may be collected, why it is processed, how it may be used, and the choices available to users.</p>

    <h2 style={s.h2}>Information we collect</h2>
    <p>When you create or use an account, we may collect your name, email address, workspace or business name, account identifiers, signup and login activity, account status, information you choose to enter into platform features, support communications, and limited technical/security information needed to operate and protect the service. Passwords are not stored in readable plain text; authentication credentials are stored using security protections such as hashing.</p>

    <h2 style={s.h2}>Why we process information</h2>
    <p>Information may be processed to create and administer accounts, authenticate users, provide platform features, maintain security, prevent abuse, provide support, operate tenant workspaces and CRM functions, maintain records, improve reliability, and manage customer or lead relationships arising from registration and use of the platform.</p>

    <h2 style={s.h2}>Lead and customer management</h2>
    <p>Registration information such as your name, email, workspace, signup date, account status, and account activity may be visible to authorized I AM Magnanimous Way owner/administrative personnel for customer service, relationship management, account administration, and legitimate lead-management purposes. Your password is not shown in the owner lead directory.</p>

    <h2 style={s.h2}>Marketing choices</h2>
    <p>Promotional marketing is optional. If you separately opt in during signup, we may use your contact information to send product updates, offers, ministry or business news, and promotional messages. You may withdraw that marketing consent later. Declining marketing does not prevent you from creating or using an account.</p>

    <h2 style={s.h2}>Service providers and integrations</h2>
    <p>Information may be processed by hosting, database, AI, communications, analytics, security, payment, or integration providers only as reasonably necessary to provide enabled features. If you connect an outside service, information may also be exchanged with that service according to your instructions and the provider's own terms and privacy practices.</p>

    <h2 style={s.h2}>Retention</h2>
    <p>Account and operational records may be retained while an account is active and for a reasonable period afterward when needed for security, legal obligations, dispute handling, fraud prevention, backup recovery, or legitimate business administration. Information should not be kept longer than reasonably necessary for the stated purpose.</p>

    <h2 style={s.h2}>Your choices and rights</h2>
    <p>Depending on applicable law, you may have rights to be informed, access your personal information, request correction, object to certain processing, withdraw consent where processing is based on consent, request deletion where legally available, and lodge a complaint with an applicable privacy regulator. Requests can be made through the support or contact channel published within I AM Magnanimous Way.</p>

    <h2 style={s.h2}>Security</h2>
    <p>Reasonable administrative and technical safeguards are used to protect account information, but no online service can guarantee absolute security. Users are responsible for keeping their own login credentials confidential.</p>

    <h2 style={s.h2}>Children and legal capacity</h2>
    <p>Users must have the legal capacity required by applicable law to create an account and agree to the platform terms. Where parental or guardian authorization is legally required, an account should not be created without that authorization.</p>

    <h2 style={s.h2}>Changes to this notice</h2>
    <p>If material privacy practices change, this notice may be updated and the effective date or version will change. Where required, renewed notice or consent will be requested.</p>

    <p style={s.foot}>This notice is intended to provide transparent information about platform processing and does not replace rights or obligations imposed by applicable privacy law.</p>
  </article></main>
}

const s:Record<string,React.CSSProperties>={
  page:{minHeight:'100vh',background:'#05070d',color:'#edf3ff',padding:'32px 18px',fontFamily:'system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif'},
  card:{maxWidth:900,margin:'0 auto',padding:'38px 34px',border:'1px solid rgba(120,150,255,.22)',borderRadius:24,background:'rgba(9,13,25,.9)',lineHeight:1.7},
  back:{color:'#75ddff',textDecoration:'none',fontWeight:700},eyebrow:{marginTop:28,fontSize:12,letterSpacing:'.18em',fontWeight:800,color:'#77dfff'},h1:{fontSize:'clamp(34px,6vw,56px)',margin:'8px 0'},meta:{color:'#8594aa'},h2:{marginTop:30,fontSize:22,color:'#dce8ff'},foot:{marginTop:36,paddingTop:20,borderTop:'1px solid rgba(255,255,255,.1)',color:'#8d9bb0',fontSize:13}
};
