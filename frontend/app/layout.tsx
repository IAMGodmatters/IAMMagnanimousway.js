import React from 'react';
import type {Metadata,Viewport} from 'next';
import PlatformChrome from './platform-chrome';
import GlobalTools from './global-tools';
import InteractionClarity from './interaction-clarity';
import PlatformRuntimeScript from './platform-runtime-script';
import ApiBudgetGuard from './api-budget-guard';
import PlatformDesignSystem from './platform-design-system';
import CinematicExperience from './cinematic-experience';
import CinematicDesignSystem from './cinematic-design-system';

const siteUrl='https://iammagnanimousway.com';
const googleVerification=process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION||'';

export const viewport:Viewport={width:'device-width',initialScale:1,viewportFit:'cover'};

export const metadata:Metadata={
  metadataBase:new URL(siteUrl),
  title:{default:'I AM Magnanimous Way™ | AI Business Execution Platform',template:'%s | I AM Magnanimous Way™'},
  description:'I AM Magnanimous Way™ is a free-first AI business execution platform operated under the registered business name God Matters, centered on Magnanimous AI for planning and coordinating work across business tools, CRM, content, calling, video, connected accounts and specialized AI capabilities.',
  applicationName:'I AM Magnanimous Way™',
  keywords:['God Matters','I AM Magnanimous Way','Magnanimous AI','AI business orchestrator','AI business execution platform','professional business plan','business launch','free AI tools','AI agents','AI assistant','CRM','AI video','business automation'],
  robots:{index:true,follow:true,googleBot:{index:true,follow:true,'max-image-preview':'large','max-snippet':-1,'max-video-preview':-1}},
  openGraph:{type:'website',url:siteUrl,siteName:'I AM Magnanimous Way™',title:'I AM Magnanimous Way™ | Magnanimous AI',description:'Magnanimous AI plans, creates, connects and coordinates work across your business stack. Registered business name: God Matters.',images:[{url:'/iam-operator-share.svg',width:1200,height:630,alt:'I AM Magnanimous Way — Magnanimous AI'}]},
  twitter:{card:'summary_large_image',title:'I AM Magnanimous Way™ | Magnanimous AI',description:'Magnanimous AI for business execution, CRM, content, calling, video and connected work. Registered business name: God Matters.',images:['/iam-operator-share.svg']},
  verification:googleVerification?{google:googleVerification}:undefined
};

const recurring=(name:string,price:string,unitText:'MONTH'|'YEAR')=>({'@type':'Offer',price,priceCurrency:'USD',name,priceSpecification:{'@type':'UnitPriceSpecification',price,priceCurrency:'USD',unitText}});
const structuredData={
  '@context':'https://schema.org',
  '@graph':[
    {'@type':'Organization','@id':`${siteUrl}/#organization`,name:'God Matters',alternateName:['I AM Magnanimous Way™','God Matters All The Time'],url:siteUrl,brand:{'@type':'Brand',name:'I AM Magnanimous Way™'}},
    {'@type':'WebSite','@id':`${siteUrl}/#website`,url:siteUrl,name:'I AM Magnanimous Way™',alternateName:'God Matters',publisher:{'@id':`${siteUrl}/#organization`},inLanguage:'en'},
    {'@type':'SoftwareApplication','@id':`${siteUrl}/#software`,name:'I AM Magnanimous Way™',alternateName:'Magnanimous AI',url:siteUrl,applicationCategory:'BusinessApplication',operatingSystem:'Web',description:'A free-first AI business execution platform centered on Magnanimous AI with specialized AI capabilities, professional business planning, CRM, calling, video, connected actions and business workflows.',offers:[
      {'@type':'Offer',price:'0',priceCurrency:'USD',name:'Free'},
      recurring('Magnanimous Unlimited Fair-Use','19.99','MONTH'),
      recurring('Magnanimous CRM Pro','79','MONTH'),
      recurring('Magnanimous Studio','79','MONTH'),
      recurring('Professional Business Plan','79','MONTH'),
      recurring('Magnanimous Business','309','MONTH'),
      recurring('Magnanimous Business Annual','3708','YEAR')
    ]}
  ]
};

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="en"><body className="iam-design-v2"><CinematicExperience/><a className="iam-skip-link" href="#iam-main">Skip to main content</a><a className="iam-shop-link" href="/shop" aria-label="Open God Matters Marketplace">🛍 Shop</a><div id="iam-main" className="iam-shell-content">{children}</div>
    <aside className="iam-business-identity" aria-label="Business identity"><strong>God Matters</strong><span>Registered business name (DBA) • I AM MAGNANIMOUS WAY™ brand</span></aside>
    <ApiBudgetGuard/><PlatformChrome/><GlobalTools/><InteractionClarity/><PlatformDesignSystem/><CinematicDesignSystem/>
    <style>{`html{color-scheme:dark;scroll-behavior:smooth;max-width:100%;overflow-x:hidden}body{margin:0;max-width:100%;overflow-x:hidden}.iam-skip-link{position:fixed;left:16px;top:12px;z-index:2147483647;transform:translateY(-150%);padding:11px 14px;border-radius:9px;background:#eafaff;color:#051015;font:900 13px Inter,system-ui,sans-serif;text-decoration:none;box-shadow:0 8px 30px rgba(0,0,0,.4)}.iam-skip-link:focus{transform:translateY(0)}.iam-shop-link{position:fixed;right:16px;top:96px;z-index:2147483001;padding:10px 14px;border:1px solid rgba(255,211,110,.55);border-radius:999px;background:rgba(5,18,38,.94);color:#ffe39a;text-decoration:none;font:900 11px Inter,system-ui,sans-serif;letter-spacing:.04em;box-shadow:0 10px 28px rgba(0,0,0,.35);backdrop-filter:blur(10px)}.iam-shop-link:hover{border-color:#63e6ff;color:#eaffff}.iam-business-identity{margin:0;padding:15px 20px;border-top:1px solid rgba(99,230,255,.28);background:#020b1e;color:#b9d5e4;display:flex;justify-content:center;align-items:center;gap:12px;flex-wrap:wrap;text-align:center;font:600 11px Inter,system-ui,sans-serif;letter-spacing:.02em}.iam-business-identity strong{color:#fff;font-size:13px}.iam-business-identity span{color:#9fc6d9}:where(a,button,input,textarea,select,[role="button"]):focus-visible{outline:3px solid #63e6ff!important;outline-offset:3px!important}::selection{background:#55d9f0;color:#041017}html[data-iam-public="true"] .iam-intelligence-art,html[data-iam-public="true"] .iam-command-button,html[data-iam-public="true"] .iam-command-menu,html[data-iam-public="true"] .iam-va-button,html[data-iam-public="true"] .iam-nudge,html[data-iam-public="true"] .iam-va-panel,html[data-iam-public="true"] .iam-global-tools{display:none!important}html[data-iam-standalone="true"] .iam-shop-link,html[data-iam-standalone="true"] .iam-business-identity,html[data-iam-standalone="true"] .iam-help-link,html[data-iam-standalone="true"] .iam-brand-watermark,html[data-iam-standalone="true"] .iam-intelligence-art,html[data-iam-standalone="true"] .iam-command-button,html[data-iam-standalone="true"] .iam-command-menu,html[data-iam-standalone="true"] .iam-va-button,html[data-iam-standalone="true"] .iam-nudge,html[data-iam-standalone="true"] .iam-va-panel,html[data-iam-standalone="true"] .iam-global-tools{display:none!important}@media(max-width:1024px){html,body{overflow-y:auto!important;-webkit-overflow-scrolling:touch}.iam-shop-link{right:10px;top:142px;padding:9px 12px;font-size:10px}.iam-business-identity{padding:13px 12px;gap:6px;flex-direction:column}.iam-shell-content,.exactHome,.mobileExactStage{height:auto!important;max-height:none!important;overflow-y:visible!important}.mobileReferenceFrame{background-color:#01050d!important;background-image:url('/mobile-dashboard-approved.webp?lock=1b894696ed7bcdc1613c93d36e29fa2210acaad3')!important;background-position:center top!important;background-repeat:no-repeat!important;background-size:100% 100%!important;aspect-ratio:941/1672!important}.mobileReferenceArtwork{opacity:1!important;visibility:visible!important;pointer-events:none!important}body:has(.mobileReferenceFrame) .iam-help-link,body:has(.mobileReferenceFrame) .iam-tour-launch,body:has(.mobileReferenceFrame) .iam-progress-save{display:none!important}}@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}*,*:before,*:after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important;scroll-behavior:auto!important}}`}</style>
    <style>{`
      /* Site-wide footer continues the approved palace colors; content and visibility rules are unchanged. */
      .iam-business-identity{position:relative;isolation:isolate;overflow:hidden;min-height:78px;box-sizing:border-box;padding:20px 25px;border-top:2px solid #eac477;background:linear-gradient(95deg,rgba(1,8,26,.97),rgba(4,24,54,.91) 47%,rgba(1,8,26,.97)),url('/magnanimous-ai-command-palace-v2.webp') center 79%/cover no-repeat;box-shadow:inset 0 2px rgba(106,221,255,.42),inset 0 19px 26px rgba(3,15,41,.45),0 -13px 35px rgba(1,9,28,.4);color:#d3edff;gap:20px;text-shadow:0 2px 8px #000c}
      .iam-business-identity:before{content:'';position:absolute;inset:0;z-index:-1;pointer-events:none;background:radial-gradient(ellipse at 18% 110%,rgba(255,199,89,.16),transparent 37%),radial-gradient(ellipse at 81% -55%,rgba(78,215,255,.25),transparent 45%);animation:iamFooterPalaceGlow 15s ease-in-out infinite alternate}
      .iam-business-identity:after{content:'';position:absolute;left:7%;right:7%;top:0;height:1px;pointer-events:none;background:linear-gradient(90deg,transparent,#77e8ff 22%,#ffda82 51%,#77e8ff 80%,transparent);box-shadow:0 0 15px rgba(255,217,140,.85)}
      .iam-business-identity strong{font:950 clamp(15px,1.45vw,19px) Inter,system-ui,sans-serif;color:#ffe3a2;letter-spacing:.05em;text-shadow:0 1px #91632b,0 3px #39250e,0 7px 18px #000c,0 0 21px rgba(255,200,92,.28)}
      .iam-business-identity span{font-weight:750;font-size:clamp(10px,.9vw,12px);letter-spacing:.05em;color:#b9e8ff}
      @keyframes iamFooterPalaceGlow{from{opacity:.5}to{opacity:1}}
      @media(max-width:820px){.iam-business-identity{min-height:90px;padding:18px 14px 22px;gap:8px;flex-direction:column;background-position:center 76%}.iam-business-identity strong{font-size:17px}.iam-business-identity span{font-size:10px;max-width:310px;line-height:1.55}}
      @media(prefers-reduced-motion:reduce){.iam-business-identity:before{animation:none}}
    `}</style>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(structuredData)}}/>
    <PlatformRuntimeScript/>
  </body></html>
}
