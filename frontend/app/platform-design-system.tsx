import React from 'react';

export default function PlatformDesignSystem(){
  return <style>{`
    :root{
      --iam-bg:#020817;
      --iam-bg-2:#06162c;
      --iam-surface:rgba(7,20,38,.82);
      --iam-surface-strong:rgba(8,26,48,.94);
      --iam-line:rgba(101,215,255,.22);
      --iam-line-strong:rgba(101,215,255,.48);
      --iam-text:#eefaff;
      --iam-muted:#9fc1d3;
      --iam-cyan:#65e7ff;
      --iam-blue:#4a9dff;
      --iam-violet:#9179ff;
      --iam-gold:#ffd36e;
      --iam-green:#6ce9b0;
      --iam-danger:#ff8798;
      --iam-radius:18px;
      --iam-shadow:0 18px 60px rgba(0,0,0,.34),inset 0 1px 0 rgba(255,255,255,.035);
      --iam-shadow-hover:0 24px 75px rgba(0,0,0,.46),0 0 40px rgba(56,205,255,.09),inset 0 1px 0 rgba(255,255,255,.07);
    }
    html{background:var(--iam-bg);scrollbar-gutter:stable}
    body.iam-design-v2{
      min-height:100vh;
      color:var(--iam-text);
      background:radial-gradient(circle at 76% -10%,rgba(62,142,255,.11),transparent 34%),radial-gradient(circle at 0 75%,rgba(80,224,255,.07),transparent 30%),var(--iam-bg);
      -webkit-font-smoothing:antialiased;
      text-rendering:optimizeLegibility;
      font-synthesis:none;
    }
    body.iam-design-v2 :where(h1,h2,h3){text-wrap:balance}
    body.iam-design-v2 :where(p,li,small){text-wrap:pretty}
    body.iam-design-v2 :where(a,button,input,textarea,select){-webkit-tap-highlight-color:transparent}
    body.iam-design-v2 :where(a,button){transition:transform .18s ease,border-color .18s ease,background .18s ease,color .18s ease,box-shadow .18s ease,opacity .18s ease}
    body.iam-design-v2 :where(button:not(:disabled),a[href]){cursor:pointer}
    body.iam-design-v2 :where(button:not(:disabled)):active{transform:translateY(1px) scale(.99)}
    body.iam-design-v2 :where(button:disabled,[aria-disabled="true"]){opacity:.5;cursor:not-allowed;filter:saturate(.5)}
    body.iam-design-v2 :where(input,textarea,select){
      border-color:rgba(102,193,229,.3)!important;
      background-color:rgba(4,15,29,.82)!important;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.025),0 8px 24px rgba(0,0,0,.12);
    }
    body.iam-design-v2 :where(input,textarea,select):focus{
      border-color:var(--iam-cyan)!important;
      box-shadow:0 0 0 3px rgba(101,231,255,.11),inset 0 1px 0 rgba(255,255,255,.04);
      outline:none;
    }
    body.iam-design-v2 :where(.panel,.card,.sys,.module-panel,.video-preview,.notice,.result,.workspace,.metric,.crm-visual-copy,.crm-chart,.crm-stats>div,.crm-grid article){
      box-shadow:var(--iam-shadow);
      border-color:var(--iam-line)!important;
    }
    body.iam-design-v2 :where(.card,.sys,.ai-app-card,.module-action,.cx-link){transform:translateZ(0)}
    body.iam-design-v2 :where(.card,.sys,.ai-app-card):hover{
      transform:translateY(-3px);
      border-color:var(--iam-line-strong)!important;
      box-shadow:var(--iam-shadow-hover);
    }
    body.iam-design-v2 :where(.primary,.module-action,.panel>button,.admin button,.crm-box button:not(.close):not(.linkbtn)){
      box-shadow:0 10px 30px rgba(42,183,255,.16),inset 0 1px 0 rgba(255,255,255,.22);
    }
    body.iam-design-v2 :where(.badge,.status,.module-status){backdrop-filter:blur(10px);box-shadow:inset 0 1px 0 rgba(255,255,255,.05)}
    body.iam-design-v2 ::-webkit-scrollbar{width:11px;height:11px}
    body.iam-design-v2 ::-webkit-scrollbar-track{background:#030a15}
    body.iam-design-v2 ::-webkit-scrollbar-thumb{background:linear-gradient(#1f5f81,#293f70);border:3px solid #030a15;border-radius:999px}
    body.iam-design-v2 ::-webkit-scrollbar-thumb:hover{background:linear-gradient(#2f83a8,#4b58a4)}

    /* Public home: premium depth without changing any actions or routes. */
    body.iam-design-v2 .page .topbar{
      border-bottom-color:rgba(89,219,255,.32)!important;
      background:linear-gradient(180deg,rgba(3,18,43,.97),rgba(3,14,32,.93))!important;
      backdrop-filter:blur(18px) saturate(1.25);
      box-shadow:0 12px 42px rgba(0,0,0,.36),inset 0 -1px 0 rgba(111,226,255,.08)!important;
    }
    body.iam-design-v2 .page .hero{
      background:linear-gradient(100deg,rgba(3,18,46,.99) 0 29%,rgba(4,27,58,.86) 47%,rgba(1,12,35,.16) 100%)!important;
      border-bottom-color:rgba(83,211,255,.24)!important;
    }
    body.iam-design-v2 .page .heroCopy{
      filter:drop-shadow(0 18px 40px rgba(0,0,0,.22));
    }
    body.iam-design-v2 .page .hero h1{
      letter-spacing:-.045em!important;
      text-shadow:0 6px 30px rgba(0,0,0,.26);
    }
    body.iam-design-v2 .page .actions a,
    body.iam-design-v2 .page .heroBottom a{
      border-radius:13px!important;
      backdrop-filter:blur(14px);
      box-shadow:0 10px 28px rgba(0,0,0,.2),inset 0 1px 0 rgba(255,255,255,.06);
    }
    body.iam-design-v2 .page .actions a:hover,
    body.iam-design-v2 .page .heroBottom a:hover{transform:translateY(-2px);border-color:#74ecff!important;box-shadow:0 14px 35px rgba(0,0,0,.3),0 0 24px rgba(74,211,255,.1)}
    body.iam-design-v2 .page .workspaceWrap{padding-top:25px!important}
    body.iam-design-v2 .page .card,
    body.iam-design-v2 .page .sys{
      min-height:94px!important;
      border-radius:16px!important;
      background:linear-gradient(135deg,rgba(8,30,59,.98),rgba(5,34,67,.9) 64%,rgba(12,59,87,.82))!important;
      box-shadow:0 16px 44px rgba(0,0,0,.28),inset 0 1px 0 rgba(128,232,255,.06)!important;
      overflow:hidden;
      position:relative;
    }
    body.iam-design-v2 .page .card:before,
    body.iam-design-v2 .page .sys:before{
      content:'';position:absolute;inset:0;pointer-events:none;background:linear-gradient(120deg,rgba(101,231,255,.07),transparent 35%,rgba(145,121,255,.045));opacity:.9;
    }
    body.iam-design-v2 .page .card:hover,
    body.iam-design-v2 .page .sys:hover{transform:translateY(-4px) scale(1.008)!important;box-shadow:0 24px 60px rgba(0,0,0,.38),0 0 32px rgba(64,200,255,.09)!important}
    body.iam-design-v2 .page .icon{border:1px solid rgba(101,231,255,.16);box-shadow:inset 0 0 28px rgba(55,198,255,.055),0 10px 26px rgba(0,0,0,.22)}
    body.iam-design-v2 .page .revenue{border-radius:18px!important;background:linear-gradient(135deg,rgba(7,22,45,.95),rgba(6,18,37,.88))!important;box-shadow:var(--iam-shadow)}

    /* Module, CRM and specialist surfaces share the same depth language. */
    body.iam-design-v2 :where(.module-page,.crm-app,.crm-login){background-color:var(--iam-bg)!important}
    body.iam-design-v2 .module-hero{
      border-color:var(--iam-line)!important;
      background:linear-gradient(135deg,rgba(11,27,47,.94),rgba(8,17,31,.9))!important;
      box-shadow:0 28px 90px rgba(0,0,0,.42),inset 0 1px 0 rgba(255,255,255,.045)!important;
    }
    body.iam-design-v2 :where(.module-panel,.video-preview,.crm-visual-copy,.crm-chart,.crm-stats>div,.crm-grid article){
      background-color:rgba(7,18,32,.86)!important;
      backdrop-filter:blur(12px);
    }
    body.iam-design-v2 .module-icon{box-shadow:0 14px 42px rgba(0,0,0,.35),0 0 50px rgba(0,207,255,.12)!important}
    body.iam-design-v2 .crm-header button,
    body.iam-design-v2 .module-panel button,
    body.iam-design-v2 .module-action{border-radius:12px!important}

    /* Shared command chrome: quieter, more premium and easier to scan. */
    body.iam-design-v2 .iam-command-button,
    body.iam-design-v2 .iam-va-button{
      background:linear-gradient(155deg,rgba(11,27,43,.97),rgba(5,10,19,.97))!important;
      border-color:rgba(105,224,255,.45)!important;
      box-shadow:0 18px 54px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.07)!important;
    }
    body.iam-design-v2 .iam-command-button:hover,
    body.iam-design-v2 .iam-va-button:hover{transform:translateY(-2px);border-color:#79eaff!important;box-shadow:0 22px 64px rgba(0,0,0,.55),0 0 30px rgba(72,211,255,.11)!important}
    body.iam-design-v2 .iam-command-menu,
    body.iam-design-v2 .iam-va-panel{
      border-color:rgba(105,224,255,.28)!important;
      background:linear-gradient(160deg,rgba(7,20,35,.985),rgba(5,10,20,.985))!important;
      box-shadow:0 30px 100px rgba(0,0,0,.66),inset 0 1px 0 rgba(255,255,255,.045)!important;
      backdrop-filter:blur(22px) saturate(1.3);
    }
    body.iam-design-v2 .iam-command-menu a{border:1px solid transparent}
    body.iam-design-v2 .iam-command-menu a:hover,
    body.iam-design-v2 .iam-command-menu a.active{border-color:rgba(91,219,255,.18);background:linear-gradient(90deg,rgba(21,47,70,.92),rgba(17,33,55,.82))!important;transform:translateX(2px)}
    body.iam-design-v2 .iam-nudge{backdrop-filter:blur(16px);box-shadow:0 18px 60px rgba(0,0,0,.5)!important}

    @media(max-width:760px){
      body.iam-design-v2 .page .workspaceWrap{padding-top:18px!important}
      body.iam-design-v2 .page .card,body.iam-design-v2 .page .sys{min-height:88px!important}
      body.iam-design-v2 .iam-command-menu{width:min(310px,calc(100vw - 20px))!important;max-height:74vh}
    }
    @media(prefers-reduced-motion:reduce){
      body.iam-design-v2 :where(a,button,.card,.sys,.ai-app-card){transition:none!important;transform:none!important}
    }
  `}</style>;
}
