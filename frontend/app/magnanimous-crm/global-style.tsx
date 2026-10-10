'use client';
export default function MagnanimousCrmGlobalStyle(){return <style jsx global>{`
 .shell .card,.shell .metric{border:1px solid #193945;background:linear-gradient(145deg,rgba(9,29,40,.98),rgba(5,10,15,.98));border-radius:13px;padding:14px;display:grid;gap:6px;box-shadow:0 18px 42px rgba(0,0,0,.32),0 6px 18px rgba(47,180,220,.06),inset 0 1px 0 rgba(255,255,255,.04)}
 .shell .card small,.shell .metric small{font-size:8px;color:#6d96a6}
 .shell .metric b{font-size:24px}
 .shell .hero,.shell .bundle,.shell .dash,.shell .capGrid article,.shell .bench article,.shell .launch,.shell .two>article,.shell .readiness,.shell .hero aside{box-shadow:0 24px 58px rgba(0,0,0,.38),0 8px 24px rgba(55,197,235,.07),inset 0 1px 0 rgba(255,255,255,.04);transform-style:preserve-3d}
 .shell .hero,.shell .dash,.shell .capGrid article,.shell .bench article,.shell .two>article,.shell .hero aside{background-image:linear-gradient(145deg,rgba(9,29,40,.98),rgba(5,10,15,.98))}
 .shell .card,.shell .metric,.shell .capGrid article,.shell .bench article,.shell .two>article,.shell .actions a,.shell .launch a{transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease}
 .shell .actions a,.shell .launch a{box-shadow:0 8px 20px rgba(0,0,0,.24),inset 0 1px 0 rgba(255,255,255,.05)}
 @media(hover:hover) and (pointer:fine){.shell .card:hover,.shell .metric:hover,.shell .capGrid article:hover,.shell .bench article:hover,.shell .two>article:hover{transform:translateY(-2px);border-color:#2d6073;box-shadow:0 29px 64px rgba(0,0,0,.42),0 10px 28px rgba(66,209,244,.09)}.shell .actions a:hover,.shell .launch a:hover{transform:translateY(-1px);box-shadow:0 12px 26px rgba(0,0,0,.3),0 5px 18px rgba(80,220,255,.08)}}
 @media(prefers-reduced-motion:reduce){.shell .card,.shell .metric,.shell .capGrid article,.shell .bench article,.shell .two>article,.shell .actions a,.shell .launch a{transition:none!important;transform:none!important}}
`}</style>}