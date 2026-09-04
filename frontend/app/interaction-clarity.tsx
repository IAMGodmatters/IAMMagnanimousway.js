"use client";

import { useEffect, useState } from "react";
import { guideHref, topicFor } from "./interaction-catalog";

function labelFor(element: HTMLElement) {
  const aria =
    element.getAttribute("aria-label") || element.getAttribute("title") || "";
  const text = (element.innerText || element.textContent || "")
    .replace(/\s+/g, " ")
    .trim();
  return (aria || text || element.tagName).slice(0, 180);
}

function targetFor(element: HTMLElement) {
  if (element instanceof HTMLAnchorElement) {
    const href = element.getAttribute("href") || "";
    return href.startsWith("http")
      ? "Opens an outside website"
      : `Opens ${href || "another page"}`;
  }
  return "Runs this action on the current page";
}

export default function InteractionClarity() {
  const [path, setPath] = useState("/");

  useEffect(() => {
    const current = location.pathname || "/";
    setPath(current);

    const scan = () => {
      document
        .querySelectorAll<HTMLElement>('a[href],button,[role="button"]')
        .forEach((element) => {
          const label = labelFor(element);
          if (!element.getAttribute("title") && label) {
            element.setAttribute("title", `${label} — ${targetFor(element)}.`);
          }
          if (
            !element.getAttribute("aria-label") &&
            element.tagName === "BUTTON" &&
            label
          ) {
            element.setAttribute("aria-label", label);
          }
          element.classList.add("iam-action-ready");
        });
    };

    scan();
    const observer = new MutationObserver(scan);
    observer.observe(document.body, { subtree: true, childList: true });
    return () => observer.disconnect();
  }, []);

  const pageTopic = topicFor(path);
  return (
    <>
      <aside className="iam-help-link">
        <a href={guideHref(pageTopic.key, path)}>ⓘ Platform guide</a>
      </aside>
      <style jsx global>{`
        .iam-action-ready:not(:disabled) {
          cursor: pointer;
        }
        .iam-action-ready:focus-visible {
          outline: 2px solid #54d9ef !important;
          outline-offset: 3px !important;
        }
        .iam-help-link {
          position: fixed;
          left: 50%;
          bottom: 14px;
          transform: translateX(-50%);
          z-index: 2147482997;
          font-family: Inter, system-ui, sans-serif;
        }
        .iam-help-link a {
          display: block;
          border: 1px solid rgba(84, 217, 239, 0.45);
          border-radius: 999px;
          background: rgba(5, 12, 18, 0.94);
          color: #bceefa;
          text-decoration: none;
          padding: 9px 13px;
          font-size: 12px;
          font-weight: 800;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
          backdrop-filter: blur(12px);
          white-space: nowrap;
        }
        @media (max-width: 700px) {
          .iam-help-link {
            bottom: 74px;
          }
        }
      `}</style>
    </>
  );
}
