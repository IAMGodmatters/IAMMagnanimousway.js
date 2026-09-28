export default function PluginSupportPage(){
 return <main>
  <section className="card">
   <small>I AM MAGNANIMOUS WAY™</small>
   <h1>Magnanimous AI Plugin Support</h1>
   <p className="lead">Support for the Magnanimous AI plugin, its remote MCP connection, Native Web tools, native cloud/deployment operations, native edge/runtime operations, authentication, privacy and account access.</p>

   <div className="grid">
    <article>
     <b>CONTACT</b>
     <p>Email support for plugin installation, connection failures, authorization issues, and tool behavior.</p>
     <a href="mailto:Godmattersinc@iammagnanimousway.com">Godmattersinc@iammagnanimousway.com</a>
    </article>
    <article>
     <b>MCP ENDPOINT</b>
     <p>The production remote MCP endpoint is hosted on the I AM MAGNANIMOUS WAY™ domain.</p>
     <code>https://iammagnanimousway.com/mcp</code>
    </article>
    <article>
     <b>PRIVACY</b>
     <p>Review how I AM MAGNANIMOUS WAY™ handles platform and connected-service data.</p>
     <a href="/privacy">Privacy Policy →</a>
    </article>
    <article>
     <b>TERMS</b>
     <p>Review the terms that apply to use of the platform and its connected tools.</p>
     <a href="/terms">Terms of Service →</a>
    </article>
   </div>

   <section className="help">
    <h2>Before contacting support</h2>
    <p>Do not send passwords, API keys, OAuth access or refresh tokens, recovery codes, full payment-card details, or government identification by email. For an authorization problem, include the time of the error, the tool name, and the non-secret error message shown by ChatGPT or Magnanimous AI.</p>
   </section>

   <section className="boundary">
    <h2>Native operations boundary</h2>
    <p>Magnanimous implements its own web/browser, cloud/deployment and edge/runtime control contracts. Public TinyFish, Railway and Cloudflare capabilities may be used as clean-room benchmarks, but their proprietary source code, hidden prompts, credentials, private APIs, model weights, anti-bot infrastructure and trade secrets are not represented as owned by I AM MAGNANIMOUS WAY™. Physical compute and public-network capacity still require owner-operated or replaceable infrastructure.</p>
   </section>
  </section>
  <footer>Magnanimous AI • I AM MAGNANIMOUS WAY™</footer>
  <style>{`
   *{box-sizing:border-box}body{margin:0}.card{width:min(920px,calc(100vw - 32px));margin:auto;border:1px solid #263a4a;background:#071019;border-radius:22px;padding:34px;box-shadow:0 24px 80px rgba(0,0,0,.35)}
   main{min-height:100vh;background:radial-gradient(circle at 50% 0,#143148 0,#071018 40%,#030507 80%);color:#edf8ff;padding:38px 16px 70px;font-family:Inter,system-ui,sans-serif}
   small{color:#d8ad62;font-size:9px;letter-spacing:.18em;font-weight:900}h1{font-size:clamp(36px,6vw,62px);line-height:1;margin:10px 0 14px}.lead{color:#91a8b8;line-height:1.65;max-width:760px}
   .grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:22px}.grid article,.help,.boundary{border:1px solid #183447;border-radius:14px;padding:17px;background:#061019}.grid b{font-size:9px;letter-spacing:.14em;color:#8ce8ff}.grid p,.help p,.boundary p{color:#8098a8;font-size:11px;line-height:1.6}.grid a{color:#9ceaff;text-decoration:none;font-weight:800;font-size:11px}.grid code{color:#bdeeff;font-size:10px;overflow-wrap:anywhere}
   .help,.boundary{margin-top:10px}.help h2,.boundary h2{font-size:16px;margin:0 0 8px}.boundary{border-color:#4b412d}.boundary h2{color:#e0bb70}
   footer{text-align:center;color:#4f6a7c;font-size:9px;margin-top:16px}@media(max-width:700px){.card{padding:24px}.grid{grid-template-columns:1fr}}
  `}</style>
 </main>
}
