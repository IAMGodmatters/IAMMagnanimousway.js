"use client";

import type { CSSProperties } from "react";

import { MODE_VISUALS, normalizeMode } from "../lib/mode-visuals";

export default function ModeHero({ mode }: { mode: string }) {
  const activeMode = normalizeMode(mode);
  const active = MODE_VISUALS[activeMode];

  return (
    <section className={`mode-hero ${active.themeClass}`}>
      <div className="mode-hero-copy">
        <small>I AM MAGNANIMOUS WAY™</small>
        <h1>{active.title}</h1>
        <p>{active.subtitle}</p>
        <span>{activeMode} assistant active</span>
      </div>
      <div
        className="mode-hero-visual-shell"
        style={{ "--mode-accent": active.accent } as CSSProperties}
      >
        <img
          src={active.image}
          alt={`${activeMode} Magnanimous AI assistant`}
          className="mode-hero-image"
        />
      </div>
      <style jsx>{`
        .mode-hero {
          position: relative;
          min-height: 360px;
          margin: 24px 0 15px;
          display: grid;
          grid-template-columns: minmax(280px, 0.72fr) minmax(480px, 1.28fr);
          align-items: stretch;
          overflow: hidden;
          border: 1px solid color-mix(in srgb, var(--mode-accent) 48%, transparent);
          border-radius: 24px;
          background:
            radial-gradient(circle at 82% 18%, color-mix(in srgb, var(--mode-accent) 28%, transparent), transparent 34%),
            linear-gradient(135deg, var(--mode-bg-1), var(--mode-bg-2));
          box-shadow:
            0 24px 80px rgba(0, 0, 0, 0.42),
            0 0 54px color-mix(in srgb, var(--mode-accent) 14%, transparent);
          transition: background 320ms ease, border-color 320ms ease, box-shadow 320ms ease;
        }
        .mode-hero-copy {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: clamp(26px, 4vw, 52px);
          background: linear-gradient(90deg, var(--mode-bg-1) 56%, transparent);
        }
        .mode-hero-copy small {
          color: var(--mode-accent);
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.19em;
        }
        .mode-hero-copy h1 {
          max-width: 590px;
          margin: 11px 0 12px;
          font-size: clamp(42px, 6vw, 76px);
          line-height: 0.98;
          letter-spacing: -0.045em;
        }
        .mode-hero-copy p {
          max-width: 500px;
          margin: 0;
          color: color-mix(in srgb, var(--mode-bg-3) 76%, white);
          font-size: 16px;
          line-height: 1.55;
        }
        .mode-hero-copy span {
          width: max-content;
          margin-top: 21px;
          padding: 7px 10px;
          border: 1px solid color-mix(in srgb, var(--mode-accent) 38%, transparent);
          border-radius: 999px;
          background: color-mix(in srgb, var(--mode-bg-1) 72%, transparent);
          color: var(--mode-accent);
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .mode-hero-visual-shell {
          position: relative;
          min-height: 360px;
          overflow: hidden;
          background: var(--mode-bg-2);
        }
        .mode-hero-visual-shell:before {
          content: "";
          position: absolute;
          z-index: 1;
          inset: 0;
          pointer-events: none;
          background: linear-gradient(90deg, var(--mode-bg-1), transparent 30%);
        }
        .mode-hero-visual-shell:after {
          content: "";
          position: absolute;
          inset: auto 0 0;
          height: 28%;
          pointer-events: none;
          background: linear-gradient(transparent, color-mix(in srgb, var(--mode-bg-1) 70%, transparent));
        }
        .mode-hero-image {
          width: 100%;
          height: 100%;
          min-height: 360px;
          display: block;
          object-fit: cover;
          object-position: center;
          filter: saturate(1.04) contrast(1.03);
        }
        @media (max-width: 980px) {
          .mode-hero {
            grid-template-columns: 1fr;
          }
          .mode-hero-copy {
            min-height: 250px;
            background: linear-gradient(180deg, var(--mode-bg-1), color-mix(in srgb, var(--mode-bg-1) 88%, transparent));
          }
          .mode-hero-visual-shell {
            order: -1;
            min-height: 300px;
            aspect-ratio: 16 / 9;
          }
          .mode-hero-visual-shell:before {
            background: linear-gradient(180deg, transparent 58%, var(--mode-bg-1));
          }
          .mode-hero-image {
            min-height: 300px;
          }
        }
        @media (max-width: 560px) {
          .mode-hero {
            margin-top: 18px;
            border-radius: 18px;
          }
          .mode-hero-copy {
            min-height: 220px;
            padding: 24px 20px 30px;
          }
          .mode-hero-copy h1 {
            font-size: 44px;
          }
          .mode-hero-visual-shell,
          .mode-hero-image {
            min-height: 225px;
          }
        }
      `}</style>
    </section>
  );
}
