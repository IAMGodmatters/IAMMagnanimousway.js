import React from 'react';

export default function TermsPage(){
  return <main style={s.page}><article style={s.card}>
    <a href="/signup" style={s.back}>← Back to signup</a>
    <div style={s.eyebrow}>I AM MAGNANIMOUS WAY™</div>
    <h1 style={s.h1}>Terms of Service</h1>
    <p style={s.meta}>Effective September 1, 2026 • Version 1.0-2026-09-01</p>

    <p>These Terms govern access to and use of the I AM Magnanimous Way platform, including AI tools, workspaces, CRM, creator tools, integrations, and related services. By creating an account or using the platform, you agree to these Terms.</p>

    <h2 style={s.h2}>Accounts</h2>
    <p>You must provide accurate account information, keep your login credentials secure, and use the platform only through accounts you are authorized to access. You are responsible for activity performed through your account unless prohibited by applicable law.</p>

    <h2 style={s.h2}>Acceptable use</h2>
    <p>You may not use the platform to violate law, infringe the rights of others, compromise security, distribute malware, attempt unauthorized access, abuse platform resources, impersonate others, or use connected services in ways that violate their rules or applicable law.</p>

    <h2 style={s.h2}>AI-generated content</h2>
    <p>AI outputs can be incomplete, inaccurate, or unsuitable for a particular purpose. You are responsible for reviewing outputs before relying on, publishing, sending, or acting on them. The platform does not guarantee that AI output is error-free, unique, or appropriate for legal, medical, financial, safety-critical, or other high-stakes decisions.</p>

    <h2 style={s.h2}>Your content and connected services</h2>
    <p>You retain responsibility for information, prompts, files, media, customer data, and other content you submit. You represent that you have the rights and permissions necessary to use that content and any connected third-party service. You authorize the platform to process submitted content as needed to provide requested features.</p>

    <h2 style={s.h2}>Privacy and account records</h2>
    <p>Personal information is handled as described in the <a href="/privacy" style={s.link}>Privacy Notice</a>. Registration and account activity may be stored for service, security, administration, support, and customer/lead-management purposes. Optional promotional marketing requires a separate opt-in.</p>

    <h2 style={s.h2}>Service availability</h2>
    <p>Features may depend on third-party providers, APIs, hosting, networks, quotas, or integrations. The platform may change, suspend, limit, or discontinue features when reasonably necessary for maintenance, security, legal compliance, provider changes, or service operation.</p>

    <h2 style={s.h2}>Security and suspension</h2>
    <p>Accounts may be restricted or suspended when reasonably necessary to protect users, the platform, third parties, or connected services; investigate misuse; comply with law; or respond to material violations of these Terms.</p>

    <h2 style={s.h2}>No unlawful resale or misuse</h2>
    <p>Access to platform tools does not grant rights to resell, sublicense, copy, reverse engineer, or exploit third-party services contrary to their licenses or terms. Any commercial use must comply with applicable provider rules and law.</p>

    <h2 style={s.h2}>Disclaimer and limitation</h2>
    <p>To the extent permitted by applicable law, the platform is provided on an “as available” basis without a guarantee of uninterrupted operation or particular results. Nothing in these Terms excludes rights or liabilities that cannot legally be excluded.</p>

    <h2 style={s.h2}>Changes</h2>
    <p>These Terms may be updated as the platform changes. Material updates may require renewed acceptance before continued use where appropriate or legally required.</p>

    <h2 style={s.h2}>Contact</h2>
    <p>Questions about these Terms may be submitted through the support or contact channel published within I AM Magnanimous Way.</p>

    <p style={s.foot}>These Terms are designed as a general platform agreement and remain subject to applicable consumer, contract, privacy, intellectual-property, and other law.</p>
  </article></main>
}

const s:Record<string,React.CSSProperties>={
  page:{minHeight:'100vh',background:'#05070d',color:'#edf3ff',padding:'32px 18px',fontFamily:'system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif'},
  card:{maxWidth:900,margin:'0 auto',padding:'38px 34px',border:'1px solid rgba(120,150,255,.22)',borderRadius:24,background:'rgba(9,13,25,.9)',lineHeight:1.7},
  back:{color:'#75ddff',textDecoration:'none',fontWeight:700},eyebrow:{marginTop:28,fontSize:12,letterSpacing:'.18em',fontWeight:800,color:'#77dfff'},h1:{fontSize:'clamp(34px,6vw,56px)',margin:'8px 0'},meta:{color:'#8594aa'},h2:{marginTop:30,fontSize:22,color:'#dce8ff'},link:{color:'#75ddff',fontWeight:700},foot:{marginTop:36,paddingTop:20,borderTop:'1px solid rgba(255,255,255,.1)',color:'#8d9bb0',fontSize:13}
};
