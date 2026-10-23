import React from 'react';

export default function CinematicDesignSystem(){
 return <style>{`
  :root{
   --cinema-black:#03060d;
   --cinema-ink:#07111f;
   --cinema-navy:#0a1830;
   --cinema-cyan:#55e5ff;
   --cinema-violet:#826bff;
   --cinema-gold:#f5ca69;
   --cinema-emerald:#43e7b3;
   --cinema-glass:rgba(7,18,34,.78);
   --cinema-line:rgba(107,221,255,.22);
   --cinema-shadow:0 28px 80px rgba(0,0,0,.46),0 8px 28px rgba(3,42,76,.18),inset 0 1px 0 rgba(255,255,255,.06);
   --cinema-shadow-hover:0 38px 100px rgba(0,0,0,.58),0 0 45px rgba(71,215,255,.12),inset 0 1px 0 rgba(255,255,255,.10);
  }
  body.iam-design-v2{background:var(--cinema-black);color:#f2f8ff}
  body.iam-design-v2 :where(.cinematicHome,.cinematicSurface,.cinematicLogin,.crmExperience){isolation:isolate;position:relative;overflow-x:hidden}
  body.iam-design-v2 :where(.cinematicHome,.cinematicSurface,.cinematicLogin,.crmExperience):before{
   content:'';position:absolute;z-index:-1;inset:0;pointer-events:none;
   background:
    radial-gradient(circle at 76% 8%,rgba(85,229,255,.14),transparent 31%),
    radial-gradient(circle at 20% 28%,rgba(130,107,255,.11),transparent 29%),
    radial-gradient(circle at 62% 86%,rgba(245,202,105,.055),transparent 25%),
    linear-gradient(180deg,#030711 0%,#061226 46%,#02060d 100%);
  }
  body.iam-design-v2 :where(.cinematicHome,.cinematicSurface,.cinematicLogin,.crmExperience):after{
   content:'';position:absolute;z-index:-1;inset:0;pointer-events:none;opacity:.42;
   background-image:linear-gradient(rgba(104,219,255,.024) 1px,transparent 1px),linear-gradient(90deg,rgba(104,219,255,.024) 1px,transparent 1px);
   background-size:72px 72px;
   mask-image:linear-gradient(180deg,#000 0,rgba(0,0,0,.48) 62%,transparent 100%);
  }
  body.iam-design-v2 :where(.cinematicHome,.opportunityVault,.travelAgency,.crmExperience) :where(.card,.sys,.panel,.rules,.watch,.grid article,.stats article,.crmVisualFrame,.crm .metric,.crm .forecast,.crm .accountCard){
   transform-style:preserve-3d;
   backface-visibility:hidden;
  }
  body.iam-design-v2 :where(.cinematicHome .card,.cinematicHome .sys,.opportunityVault .grid article,.travelAgency .panel,.travelAgency .stats article,.crmExperience .crm .panel,.crmExperience .crm .metric,.crmExperience .crm .accountCard){
   position:relative;overflow:hidden;
   border-color:var(--cinema-line)!important;
   box-shadow:var(--cinema-shadow)!important;
   transition:transform .24s cubic-bezier(.2,.8,.2,1),box-shadow .24s ease,border-color .24s ease,filter .24s ease!important;
  }
  body.iam-design-v2 :where(.cinematicHome .card,.cinematicHome .sys,.opportunityVault .grid article,.travelAgency .panel,.travelAgency .stats article,.crmExperience .crm .panel,.crmExperience .crm .metric,.crmExperience .crm .accountCard):after{
   content:'';position:absolute;inset:-45% -70%;pointer-events:none;opacity:0;
   background:linear-gradient(112deg,transparent 38%,rgba(255,255,255,.11) 48%,rgba(90,226,255,.10) 52%,transparent 62%);
   transform:translateX(-36%) rotate(4deg);transition:opacity .22s ease,transform .65s cubic-bezier(.2,.8,.2,1);
  }
  body.iam-design-v2 :where(.cinematicHome .card,.cinematicHome .sys,.opportunityVault .grid article,.travelAgency .panel,.travelAgency .stats article,.crmExperience .crm .panel,.crmExperience .crm .metric,.crmExperience .crm .accountCard):hover{
   transform:perspective(1100px) translateY(-6px) rotateX(1.1deg) rotateY(-.65deg)!important;
   border-color:rgba(98,230,255,.5)!important;box-shadow:var(--cinema-shadow-hover)!important;filter:saturate(1.05)
  }
  body.iam-design-v2 :where(.cinematicHome .card,.cinematicHome .sys,.opportunityVault .grid article,.travelAgency .panel,.travelAgency .stats article,.crmExperience .crm .panel,.crmExperience .crm .metric,.crmExperience .crm .accountCard):hover:after{opacity:1;transform:translateX(34%) rotate(4deg)}

  body.iam-design-v2 .cinematicHome{background:transparent!important}
  body.iam-design-v2 .cinematicHome .topbar{
   background:linear-gradient(180deg,rgba(3,12,30,.92),rgba(4,11,24,.82))!important;
   border-color:rgba(87,222,255,.28)!important;backdrop-filter:blur(24px) saturate(1.35);
   box-shadow:0 16px 55px rgba(0,0,0,.45),inset 0 -1px 0 rgba(117,229,255,.09)!important;
  }
  body.iam-design-v2 .cinematicHome .hero{
   background:radial-gradient(circle at 75% 42%,rgba(76,202,255,.18),transparent 29%),radial-gradient(circle at 56% 18%,rgba(130,107,255,.12),transparent 31%),linear-gradient(102deg,rgba(2,10,27,.99) 0 31%,rgba(5,24,52,.92) 52%,rgba(3,8,22,.72) 100%)!important;
   box-shadow:inset 0 -1px 0 rgba(93,224,255,.18),0 28px 90px rgba(0,0,0,.32);
  }
  body.iam-design-v2 .cinematicHome .hero:after{content:'';position:absolute;inset:-25% -15%;pointer-events:none;z-index:1;background:conic-gradient(from 210deg at 70% 45%,transparent 0 35%,rgba(100,229,255,.055) 42%,transparent 49% 72%,rgba(142,103,255,.05) 78%,transparent 86%);animation:cinemaOrbit 20s linear infinite}
  body.iam-design-v2 .cinematicHome .heroCopy,body.iam-design-v2 .cinematicHome .heroBottom{z-index:5}
  body.iam-design-v2 .cinematicHome .heroCopy{width:min(45%,590px);padding-right:28px!important}
  body.iam-design-v2 .cinematicHome .artFrame{z-index:3;right:1.5%!important;top:9%!important;width:42%!important;height:70%!important;padding:0!important;filter:drop-shadow(0 30px 75px rgba(0,0,0,.4));mask-image:radial-gradient(ellipse at 55% 50%,#000 48%,rgba(0,0,0,.92) 60%,transparent 84%);-webkit-mask-image:radial-gradient(ellipse at 55% 50%,#000 48%,rgba(0,0,0,.92) 60%,transparent 84%)}
  body.iam-design-v2 .cinematicHome .artFrame img{width:100%!important;height:100%!important;object-fit:cover!important;object-position:55% 50%!important;animation:cinemaFloat 7s ease-in-out infinite;filter:drop-shadow(0 0 42px rgba(47,203,255,.28)) saturate(1.04) contrast(1.03)!important}
  body.iam-design-v2 .cinematicHome .heroBottom{left:44px!important;right:44px!important;bottom:20px!important}
  body.iam-design-v2 .cinematicHome .hero h1 span{background:linear-gradient(95deg,#baf8ff 0%,#55e5ff 34%,#967cff 68%,#f5ca69 100%);-webkit-background-clip:text;background-clip:text;color:transparent;text-shadow:none}
  body.iam-design-v2 .cinematicHome .actions .primary{background:linear-gradient(100deg,#45e7ce,#55dfff 52%,#9e79ff)!important;box-shadow:0 14px 34px rgba(72,211,255,.24),inset 0 1px 0 rgba(255,255,255,.35)}
  body.iam-design-v2 .cinematicHome :where(.card,.sys){background:linear-gradient(145deg,rgba(8,29,55,.94),rgba(4,14,28,.95) 66%,rgba(18,35,61,.9))!important;border-radius:17px!important}
  body.iam-design-v2 .cinematicHome .icon:not(.moduleMark){background:radial-gradient(circle at 35% 25%,rgba(100,233,255,.17),rgba(4,14,28,.9) 66%)!important;border:1px solid rgba(89,225,255,.21);box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 12px 25px rgba(0,0,0,.32),0 0 30px rgba(85,229,255,.055)}

  body.iam-design-v2 .opportunityVault{background:transparent!important}
  body.iam-design-v2 .opportunityVault .hero h1{max-width:710px;background:none!important;-webkit-background-clip:initial;background-clip:initial;color:#ffe7a2!important;-webkit-text-fill-color:#ffe7a2;text-shadow:0 2px 0 #785120,0 4px 0 #39210d,0 8px 25px #020615,0 0 30px rgba(255,201,98,.47)!important}
  body.iam-design-v2 .opportunityVault .rules{background:linear-gradient(125deg,#071b35,#050e22)!important;border-color:#c39240!important;box-shadow:0 0 24px rgba(255,208,106,.07),inset 0 1px rgba(255,255,255,.07)!important}
  body.iam-design-v2 .opportunityVault .watch{background:linear-gradient(145deg,rgba(8,27,39,.9),rgba(5,13,24,.94))!important;border-color:rgba(244,187,79,.4)!important;box-shadow:var(--cinema-shadow)}
  body.iam-design-v2 .opportunityVault .grid article{background:radial-gradient(circle at 85% 5%,rgba(240,188,73,.08),transparent 27%),linear-gradient(135deg,#0c2441,#030d20 70%)!important;border-radius:21px!important;border-color:#3a98b9!important;box-shadow:0 15px 40px rgba(0,0,0,.53),inset 0 1px rgba(255,255,255,.06)!important}
  body.iam-design-v2 .opportunityVault .grid article:hover{border-color:#f1c261!important;box-shadow:0 20px 50px rgba(0,0,0,.6),0 0 25px rgba(230,170,55,.14)!important}
  body.iam-design-v2 .opportunityVault nav button.on{background:linear-gradient(90deg,#4de7b4,#66e6ff)!important;box-shadow:0 10px 30px rgba(70,226,190,.18)}

  body.iam-design-v2 .travelAgency{background:transparent!important;perspective:1600px}
  body.iam-design-v2 .travelAgency>header{position:relative;padding:42px 0 34px!important}
  body.iam-design-v2 .travelAgency>header:after{content:'GLOBAL • VERIFIED • FREE-FIRST';position:absolute;right:0;bottom:8px;color:rgba(115,225,255,.35);font:900 8px Inter,system-ui,sans-serif;letter-spacing:.18em}
  body.iam-design-v2 .travelAgency>header h1{background:linear-gradient(100deg,#f5fbff,#78e9ff 48%,#a48bff 76%,#f5ca69);-webkit-background-clip:text;background-clip:text;color:transparent;letter-spacing:-.045em}
  body.iam-design-v2 .travelAgency .panel,body.iam-design-v2 .travelAgency .stats article{background:radial-gradient(circle at 90% 0,rgba(74,214,255,.07),transparent 27%),linear-gradient(150deg,rgba(9,25,38,.94),rgba(4,11,20,.97))!important;border-radius:21px!important}
  body.iam-design-v2 .travelAgency .sandboxLab{background:radial-gradient(circle at 86% 0,rgba(67,231,179,.09),transparent 27%),linear-gradient(150deg,rgba(7,31,29,.94),rgba(4,12,20,.97))!important}
  body.iam-design-v2 .travelAgency .flightLab{background:radial-gradient(circle at 86% 0,rgba(92,173,255,.10),transparent 27%),linear-gradient(150deg,rgba(7,24,39,.94),rgba(4,12,20,.97))!important}
  body.iam-design-v2 .travelAgency button{box-shadow:0 11px 28px rgba(0,0,0,.27),inset 0 1px 0 rgba(255,255,255,.11)}
  /* Original illustrated travel chamber: content stays real HTML, never baked into the image. */
  body.iam-design-v2 .travelAgency>header{
   min-height:440px;box-sizing:border-box;position:relative;isolation:isolate;
   align-items:center!important;gap:24px;padding:40px 36px!important;
   border:2px solid #d8af57;border-radius:24px;overflow:hidden;
   background-color:#06152d;
   background-image:linear-gradient(90deg,rgba(2,8,25,.97) 0%,rgba(2,10,28,.91) 34%,rgba(2,10,28,.63) 53%,rgba(2,10,28,.06) 84%),url('/magnanimous-travel-palace-v2.webp')!important;
   background-size:cover;background-position:50% center;
   box-shadow:0 0 0 1px rgba(57,191,255,.68),0 0 32px rgba(58,174,239,.22),0 29px 65px rgba(0,0,0,.6);
   animation:cinemaTravelDrift 19s ease-in-out infinite alternate;
  }
  body.iam-design-v2 .travelAgency>header:after{display:none}
  body.iam-design-v2 .travelAgency>header>div:first-child{position:relative;z-index:1;max-width:680px;text-shadow:0 3px 17px rgba(0,0,0,.65)}
  body.iam-design-v2 .travelAgency>header small{color:#ffda83!important;text-shadow:0 0 17px rgba(251,190,91,.42)}
  body.iam-design-v2 .travelAgency>header h1{background:none!important;-webkit-background-clip:initial;background-clip:initial;color:#ffe6a3!important;-webkit-text-fill-color:#ffe6a3!important;max-width:730px;line-height:1.05;overflow-wrap:anywhere;text-shadow:0 2px 0 #785022,0 4px 0 #35220c,0 8px 27px #01050d,0 0 29px rgba(251,194,101,.24)!important}
  body.iam-design-v2 .travelAgency>header p{max-width:640px;color:#e1f5ff!important;font-weight:600}
  body.iam-design-v2 .travelAgency>header nav{position:relative;z-index:2;align-self:flex-end;justify-content:flex-end}
  body.iam-design-v2 .travelAgency>header nav a{background:linear-gradient(115deg,rgba(4,15,42,.95),rgba(6,47,82,.85));border-color:#d7af63;color:#ffe9bd;box-shadow:0 9px 25px rgba(0,0,0,.5),inset 0 1px rgba(255,255,255,.16);backdrop-filter:blur(12px)}
  body.iam-design-v2 .travelAgency>header nav a:hover{border-color:#75e7ff;color:#fff}
  body.iam-design-v2 .travelAgency .panel,body.iam-design-v2 .travelAgency .stats article{border-color:rgba(241,190,93,.57)!important;box-shadow:0 17px 40px rgba(0,0,0,.37),inset 0 1px rgba(255,255,255,.07)!important}
  body.iam-design-v2 .travelAgency .panel:hover,body.iam-design-v2 .travelAgency .stats article:hover{border-color:#f0c66d!important;box-shadow:0 21px 55px rgba(0,0,0,.47),0 0 25px rgba(245,196,105,.1)!important}
  body.iam-design-v2 .travelAgency .stats b,body.iam-design-v2 .travelAgency h2{color:#f9d790}
  body.iam-design-v2 .travelAgency button:not(:disabled){background:linear-gradient(110deg,#113e73,#d6a64b)!important;color:#fff6df;border-color:#c7a157!important}
  body.iam-design-v2 .travelAgency :is(button,a,input,select):focus-visible{outline:3px solid #8eeaff;outline-offset:3px}

  body.iam-design-v2 .cinematicLogin{background:radial-gradient(circle at 20% 46%,rgba(27,109,137,.23),transparent 31%),radial-gradient(circle at 80% 38%,rgba(40,97,177,.22),transparent 30%),radial-gradient(circle at 50% 110%,rgba(130,107,255,.12),transparent 38%),linear-gradient(145deg,#010307,#07111b 50%,#03060b)!important}
  body.iam-design-v2 .cinematicLogin .card{border-color:rgba(245,202,105,.7)!important;background:linear-gradient(155deg,rgba(7,12,20,.92),rgba(3,7,12,.97))!important;box-shadow:0 40px 130px rgba(0,0,0,.76),0 0 70px rgba(255,178,49,.10),inset 0 1px 0 rgba(255,255,255,.08)!important;backdrop-filter:blur(20px) saturate(1.18)}
  body.iam-design-v2 .cinematicLogin .robot{filter:drop-shadow(0 30px 55px rgba(0,0,0,.5)) drop-shadow(0 0 34px rgba(255,164,20,.19))!important}
  body.iam-design-v2 .cinematicLogin .globe{box-shadow:0 0 70px rgba(0,190,255,.32),inset 0 0 52px rgba(0,180,255,.18)!important}

  body.iam-design-v2 .crmExperience{perspective:1600px}
  body.iam-design-v2 .crmExperience .crmVisualFrame{transform:perspective(1400px) rotateX(.65deg);box-shadow:0 45px 110px rgba(0,0,0,.58),0 0 60px rgba(54,181,255,.10),inset 0 1px 0 rgba(255,255,255,.11)!important}

  @supports(backdrop-filter:blur(12px)){
   body.iam-design-v2 :where(.cinematicHome .card,.cinematicHome .sys,.opportunityVault .grid article,.travelAgency .panel,.travelAgency .stats article,.crmExperience .crm .panel,.crmExperience .crm .metric,.crmExperience .crm .accountCard){backdrop-filter:blur(16px) saturate(1.16)}
  }
  @keyframes cinemaFloat{50%{transform:translate3d(0,-9px,0) scale(1.008)}}
  @keyframes cinemaOrbit{to{transform:rotate(360deg)}}
  @keyframes cinemaTravelDrift{from{background-position:50% center}to{background-position:53% center}}
  @keyframes cinemaTravelDriftMobile{from{background-position:66% center}to{background-position:68% center}}
  @media(max-width:1100px){
   body.iam-design-v2 .cinematicHome .heroCopy{width:auto!important;max-width:600px}
   body.iam-design-v2 .cinematicHome .artFrame{right:0!important;top:auto!important;bottom:74px!important;width:52%!important;height:44%!important;opacity:.78}
  }
  @media(max-width:760px){
   body.iam-design-v2 :where(.cinematicHome .card,.cinematicHome .sys,.opportunityVault .grid article,.travelAgency .panel,.travelAgency .stats article,.crmExperience .crm .panel,.crmExperience .crm .metric,.crmExperience .crm .accountCard):hover{transform:translateY(-2px)!important}
   body.iam-design-v2 .cinematicHome .artFrame{right:0!important;width:100%!important;height:40%!important;bottom:80px!important;opacity:.66}
   body.iam-design-v2 .cinematicHome .heroBottom{left:14px!important;right:14px!important;bottom:12px!important}
  }
  /* The tall illustration belongs to upright phones only; rotated phones keep the compact landscape hero. */
  @media(max-width:760px) and (orientation:portrait){
   body.iam-design-v2 .travelAgency>header:after{display:none}
   body.iam-design-v2 .travelAgency>header{display:flex!important;min-height:650px;flex-direction:column;align-items:flex-start!important;justify-content:flex-start;padding:30px 20px!important;background-image:linear-gradient(180deg,rgba(2,8,27,.95),rgba(3,11,27,.84) 40%,rgba(2,10,26,.08) 78%),url('/magnanimous-travel-palace-mobile-v2.webp')!important;background-position:center center;background-size:cover;animation:none}
   body.iam-design-v2 .travelAgency>header h1{font-size:clamp(29px,7.8vw,44px)}
   body.iam-design-v2 .travelAgency>header p{font-size:clamp(13px,3.4vw,16px);line-height:1.48}
   body.iam-design-v2 .travelAgency>header nav{align-self:flex-start;justify-content:flex-start;flex-wrap:wrap;gap:8px}
   body.iam-design-v2 .travelAgency>header nav a{font-size:12px;padding:9px 11px}
  }
  @media(prefers-reduced-motion:reduce){
   body.iam-design-v2 .cinematicHome .hero:after,body.iam-design-v2 .cinematicHome .artFrame img{animation:none!important}
   body.iam-design-v2 .travelAgency>header{animation:none!important}
   body.iam-design-v2 :where(.cinematicHome .card,.cinematicHome .sys,.opportunityVault .grid article,.travelAgency .panel,.travelAgency .stats article,.crmExperience .crm .panel,.crmExperience .crm .metric,.crmExperience .crm .accountCard){transition:none!important;transform:none!important}
  }
 `}</style>
}
