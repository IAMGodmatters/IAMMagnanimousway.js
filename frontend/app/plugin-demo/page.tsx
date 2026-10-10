import type {Metadata} from 'next';

export const metadata:Metadata={
 title:'Magnanimous AI Plugin Demo',
 description:'Public review demo for the Magnanimous AI connection.',
 alternates:{canonical:'/plugin-demo/'},
 robots:{index:false,follow:true},
};

const slides=[
 ['ONE PLUGIN • THREE AREAS','Magnanimous AI','Native web/browser research, provider-neutral cloud/deployment control, and native edge/runtime contracts share one Magnanimous MCP connection.'],
 ['CUSTOMER-SAFE OAUTH','Safe by account role','Normal accounts receive capabilities.read, brain.ask and web.read. Owner/admin accounts may authorize the guarded privileged scope set.'],
 ['PUBLIC RESEARCH','Source-backed web work','Connected AI clients can search public sources, fetch rendered pages, and return source-backed findings through Magnanimous Native Web.'],
 ['OWNER OPERATIONS','Cloud + edge through Magnanimous','Privileged accounts can map external deployment and edge concepts to Magnanimous-owned desired-state and action contracts.'],
 ['PROVIDER INDEPENDENCE','Clean-room compatibility','External services may be replaceable compatibility benchmarks or optional capacity rails. Their proprietary implementations are not copied or represented as Magnanimous-owned.'],
 ['FAIR USAGE PRICING','$0 base • final price shown','Free Magnanimous-native paths stay free. If paid metered usage is required, the final Magnanimous customer price is shown before use and funded from prepaid usage credits. Internal cost and margin calculations stay owner-private.'],
 ['REVIEW READY','Public production surface','MCP, OAuth discovery, PKCE, support, privacy, terms, brand assets and domain verification are deployed and continuously smoke-tested.']
];

export default function PluginDemo(){
 return <main>
  <header><span>I AM MAGNANIMOUS WAY™</span><a href="/plugin-support/">PLUGIN SUPPORT →</a></header>
  <section className="stage" aria-label="Magnanimous AI plugin review demo">
   {slides.map((s,i)=><article className={"slide s"+(i+1)} key={s[0]}>
    <small>{s[0]}</small><h1>{s[1]}</h1><p>{s[2]}</p>
    {i===0&&<code>https://iammagnanimousway.com/mcp</code>}
    {i===1&&<code>OAuth 2.1 • Authorization Code • PKCE S256</code>}
    {i===2&&<code>search • fetch • magnanimous_web_research</code>}
    {i===3&&<code>magnanimous_operate</code>}
    {i===4&&<code>Magnanimous AI remains the customer-facing identity.</code>}
    {i===5&&<code>https://iammagnanimousway.com/plugin-support/</code>}
   </article>)}
   <div className="progress"/>
  </section>
  <section className="facts">
   <b>REVIEW NOTES</b>
   <span>This demo describes verified production contracts. It does not simulate provider purchases or claim physical infrastructure that is not present.</span>
  </section>
  <footer>Magnanimous AI • connection review demo • 2026-09-28</footer>
  <style>{`
   *{box-sizing:border-box}body{margin:0;background:#03070b}
   main{min-height:100vh;background:radial-gradient(circle at 50% 0,#143347 0,#071018 42%,#030507 82%);color:#effaff;padding:28px;font-family:Inter,system-ui,sans-serif}
   header,.stage,.facts,footer{width:min(1040px,calc(100vw - 36px));margin-left:auto;margin-right:auto}
   header{display:flex;justify-content:space-between;align-items:center;color:#d8ad62;font-size:10px;letter-spacing:.14em;font-weight:900}
   header a{color:#8de9f3;text-decoration:none}
   .stage{position:relative;height:520px;margin-top:22px;border:1px solid #274b5d;border-radius:26px;background:#06111a;overflow:hidden;box-shadow:0 32px 100px rgba(0,0,0,.42)}
   .slide{position:absolute;inset:0;padding:70px 74px;opacity:0;transform:translateY(18px);animation:show 42s linear infinite}
   .slide small{color:#83e7ee;font-size:10px;letter-spacing:.16em;font-weight:900}
   .slide h1{font:800 clamp(48px,7vw,82px)/.96 Inter,system-ui,sans-serif;margin:14px 0 22px;max-width:850px}
   .slide p{max-width:820px;color:#9bb4c1;font-size:22px;line-height:1.55}
   .slide code{display:inline-block;margin-top:26px;border:1px solid #295669;background:#031019;border-radius:10px;padding:13px 16px;color:#a9eff6;font-size:14px}
   .s1{animation-delay:0s}.s2{animation-delay:6s}.s3{animation-delay:12s}.s4{animation-delay:18s}.s5{animation-delay:24s}.s6{animation-delay:30s}.s7{animation-delay:36s}
   @keyframes show{0%{opacity:0;transform:translateY(18px)}3%,14%{opacity:1;transform:translateY(0)}16.5%,100%{opacity:0;transform:translateY(-12px)}}
   .progress{position:absolute;left:0;bottom:0;height:4px;background:linear-gradient(90deg,#72e5f0,#8cefc6,#d8aa58);animation:progress 42s linear infinite}
   @keyframes progress{from{width:0}to{width:100%}}
   .facts{margin-top:14px;border:1px solid #223e4d;border-radius:14px;background:#061019;padding:16px 18px;display:grid;gap:5px}.facts b{font-size:9px;letter-spacing:.13em;color:#d8ad62}.facts span{font-size:12px;color:#89a2b0;line-height:1.5}
   footer{text-align:center;color:#547080;font-size:9px;margin-top:18px}
   @media(max-width:720px){main{padding:18px}.stage{height:560px}.slide{padding:48px 28px}.slide p{font-size:18px}.slide code{font-size:11px;overflow-wrap:anywhere}}
  `}</style>
 </main>
}
