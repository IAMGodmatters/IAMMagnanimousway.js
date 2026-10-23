"use client";

import type { CSSProperties } from "react";
import { MODE_VISUALS, normalizeMode } from "../lib/mode-visuals";

/** Companion artwork to the protected homepage, with real HTML overlaid for accessibility. */
export default function ModeHero({ mode }: { mode: string }) {
  const activeMode = normalizeMode(mode);
  const active = MODE_VISUALS[activeMode];
  return (
    <section
      className={`mode-hero ${active.themeClass}`}
      style={{ "--hero-accent": active.accent } as CSSProperties}
      aria-label={`${activeMode} AI workspace`}
    >
      <div className="hero-scenery" aria-hidden="true" />
      <div className="hero-copy">
        <div className="hero-brand">
          <span className="hero-crown" aria-hidden="true">♛</span>
          <span>I AM MAGNANIMOUS WAY™</span>
          <span className="hero-separator" aria-hidden="true">✦</span>
          <span>AI COMMAND CENTER</span>
        </div>
        <h1>{active.title}</h1>
        <p>{active.subtitle}</p>
        <div className="hero-mode-label">
          <span className="hero-mode-dot" aria-hidden="true" />
          <span>SELECTED WORKSPACE</span>
          <strong>{activeMode}</strong>
        </div>
      </div>
      <div className="mode-medallion">
        <img src={active.image} alt="" />
        <div className="medallion-copy">
          <span>MAGNANIMOUS AI</span>
          <strong>{activeMode} Mode</strong>
        </div>
      </div>
      <div className="hero-bottom-rail" aria-hidden="true">
        <span>CREATE</span><i>✦</i><span>REASON</span><i>✦</i><span>AUTOMATE</span><i>✦</i><span>GROW</span>
      </div>
      <style jsx>{`
        .mode-hero {
          position: relative; isolation: isolate; min-height: 420px; margin: 17px 0 18px;
          overflow: hidden; border: 2px solid #dcb056; border-radius: 20px; color: #fff; background: #030d26;
          box-shadow: 0 0 0 1px rgba(71,204,255,.68), 0 0 30px rgba(35,153,255,.29),
            0 28px 65px rgba(0,0,0,.55), inset 0 0 26px rgba(250,177,40,.14);
        }
        .hero-scenery {
          position: absolute; inset: -3%; z-index: -1;
          background-image: linear-gradient(90deg, rgba(1,7,27,.83) 0%, rgba(1,7,27,.48) 38%, rgba(0,6,22,.05) 68%),
            url('/magnanimous-ai-command-palace-v2.webp');
          background-position: center; background-size: cover;
          animation: breathe 18s ease-in-out infinite alternate;
        }
        .mode-hero:after {
          content: ''; position: absolute; pointer-events: none; inset: 0;
          background: linear-gradient(180deg, rgba(6,16,43,.08) 65%, rgba(2,8,30,.55)); z-index: -1;
        }
        .hero-copy {
          position: relative; max-width: 64%;
          padding: 55px 20px 82px clamp(25px,4vw,56px);
          text-shadow: 0 3px 16px #020616, 0 0 10px #020616;
        }
        .hero-brand {
          display: flex; gap: 9px; align-items: center; flex-wrap: wrap;
          color: #ffda82; font-size: 10px; letter-spacing: .14em; font-weight: 900;
        }
        .hero-crown { color: #ffce62; font-size: 28px; line-height: 1; filter: drop-shadow(0 0 6px #ffb43a); }
        .hero-separator { color: #69e4ff; }
        h1 {
          margin: 20px 0 14px; font-size: clamp(40px,5.1vw,74px); font-weight: 950;
          line-height: 1.02; letter-spacing: -.038em; color: #fff1ba;
          -webkit-text-stroke: .35px rgba(250,198,104,.58);
          text-shadow: 0 2px 0 #775020, 0 4px 0 #39210c, 0 8px 20px #000b28,
            0 0 30px rgba(250,196,70,.4);
        }
        p { max-width: 435px; color: #e7f8ff; font-size: clamp(14px,1.5vw,18px); font-weight: 600; line-height: 1.55; }
        .hero-mode-label {
          margin-top: 24px; display: flex; align-items: center; gap: 9px;
          width: max-content; max-width: 100%; padding: 9px 16px;
          border: 1px solid #eec76b; border-radius: 20px;
          background: linear-gradient(110deg,rgba(5,21,57,.94),rgba(7,57,103,.84));
          box-shadow: 0 0 18px rgba(88,196,255,.42), inset 0 0 13px rgba(67,198,255,.19);
          font-size: 10px; letter-spacing: .07em; font-weight: 800; color: #8de9ff;
        }
        .hero-mode-label strong { color: #ffe5a6; font-size: 12px; }
        .hero-mode-dot { width: 10px; height: 10px; border-radius: 50%; background: #21e3fb; box-shadow: 0 0 14px #08d5ff; }
        .mode-medallion {
          position: absolute; bottom: 35px; right: 28px;
          display: flex; align-items: center; gap: 10px; padding: 8px 13px 8px 8px;
          border: 1px solid #e4b64d; border-radius: 13px;
          background: linear-gradient(135deg,rgba(3,17,48,.94),rgba(1,8,25,.83));
          box-shadow: 0 0 22px rgba(253,188,64,.24), inset 0 0 17px rgba(42,180,248,.2);
          backdrop-filter: blur(12px);
        }
        .mode-medallion img { width: 58px; height: 49px; border: 1px solid #59daff; border-radius: 9px; object-fit: cover; }
        .medallion-copy span { display: block; color: #90ecff; font-size: 9px; letter-spacing: .1em; font-weight: 900; }
        .medallion-copy strong { display: block; margin-top: 5px; color: #ffe5a3; font-size: 12px; }
        .hero-bottom-rail {
          position: absolute; right: 0; bottom: 0; left: 0; min-height: 25px;
          display: flex; align-items: center; justify-content: center; gap: 23px;
          background: linear-gradient(90deg,#061533,#0f2b57,#061533);
          border-top: 1px solid rgba(251,199,75,.68); color: #f5cd74;
          font-size: 9px; font-weight: 900; letter-spacing: .25em;
        }
        .hero-bottom-rail i { font-style: normal; color: #6ce1ff; }
        @keyframes breathe { from { transform: scale(1); } to { transform: scale(1.045); } }
        @media (max-width: 850px) {
          .mode-hero { min-height: 395px; }
          .hero-copy { max-width: 73%; padding: 38px 22px 110px; }
          .hero-scenery { background-position: 55% center; }
        }
        @media (max-width: 550px) {
          .mode-hero { min-height: 460px; }
          .hero-copy { max-width: 100%; padding: 28px 18px 145px; }
          .hero-scenery {
            background-position: 68% center;
            background-image: linear-gradient(180deg,rgba(1,7,27,.92),rgba(1,7,27,.45) 58%,rgba(1,7,27,.1)),
              url('/magnanimous-ai-command-palace-v2.webp');
          }
          .hero-brand { font-size: 8px; gap: 6px; }
          h1 { font-size: clamp(35px,10vw,48px); }
          p { font-size: 14px; }
          .mode-medallion { right: 12px; bottom: 34px; }
          .hero-bottom-rail { gap: 9px; font-size: 7px; letter-spacing: .13em; }
        }
        /* Standalone phone portrait. The approved desktop hero and image stay unchanged. */
        @media (max-width: 760px) {
          .mode-hero { min-height: clamp(650px, 115vw, 850px); }
          .hero-copy { max-width: 100%; padding: 29px 20px 180px; }
          .hero-scenery {
            background-image: linear-gradient(180deg,rgba(1,7,27,.95) 0%,rgba(1,7,27,.82) 40%,rgba(1,7,27,.09) 78%),
              url('/magnanimous-ai-command-palace-mobile-v2.webp');
            background-size: cover;
            background-position: center;
            animation: none;
          }
          .hero-brand { font-size: 9px; gap: 6px; }
          h1 { font-size: clamp(30px, 8vw, 46px); overflow-wrap: anywhere; }
          p { font-size: clamp(13px, 3.6vw, 16px); }
          .hero-mode-label { width: auto; flex-wrap: wrap; padding: 9px 12px; }
          .mode-medallion { right: 12px; bottom: 35px; }
          .hero-bottom-rail { gap: clamp(6px, 2vw, 16px); font-size: 8px; letter-spacing: .08em; }
        }
        @media (prefers-reduced-motion: reduce) { .hero-scenery { animation: none; } }
      `}</style>
    </section>
  );
}
