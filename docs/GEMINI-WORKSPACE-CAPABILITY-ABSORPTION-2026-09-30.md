# Gemini / Google Workspace Capability Absorption — 2026-09-30

## Verdict

The shared claim is **substantially true as a capability description**, but the phrase “alternative to ChatGPT Plus, Claude Pro, Perplexity Pro” is a comparison/opinion rather than a factual equivalence claim.

Google currently documents Gemini workflows that cover:
- web and multi-source Deep Research;
- Deep Research using authorized Gmail, Drive, Docs, Sheets, Slides, PDFs and Chat sources alongside the web;
- first-draft and document-editing workflows in Docs;
- natural-language file retrieval, summaries and cross-file understanding in Drive;
- source-scoped answers and source comparison;
- generation/export of Google Docs, Sheets, Slides, PDF, DOCX, XLSX, CSV, LaTeX, TXT, RTF and Markdown;
- connected-app workflows;
- Gemini API Google Search grounding with citations;
- Gemini API File Search / RAG;
- structured function calling;
- remote MCP over Streamable HTTP;
- combinations of built-in tools and custom tools;
- Google Workspace APIs for programmatic Drive/Docs/Sheets/Slides interoperability.

Availability is not uniform. Some product features depend on account type, subscription, language, region, rollout state and Workspace administrator permissions.

## Magnanimous action

These patterns are absorbed into **Magnanimous AI**, not exposed as a Gemini-branded product layer.

Implementation:
- `worker/src/magnanimous-gemini-capability-registry.js` records the verified public capability contracts and official source ledger.
- `worker/src/magnanimous-connector-absorption.js` includes those contracts in the full brain manifest, source-provenance lookup, native-target ranking and independence accounting.
- Existing Magnanimous-owned services remain the first execution targets: Research Orchestrator, Knowledge Workspace, Evidence Auditor, Workspace Suite, Data Platform, Operations Hub, Tool Gateway, Dev Agent and model router.
- Google account data or Google-specific actions remain an explicit authorized external boundary.
- Gemini model compute remains replaceable. Magnanimous AI remains the public identity, memory, planning, orchestration, policy and verification layer.

## Official sources retained

1. https://blog.google/products-and-platforms/products/workspace/gemini-workspace-updates-march-2026/
2. https://blog.google/products-and-platforms/products/gemini/deep-research-workspace-app-integration/
3. https://blog.google/innovation-and-ai/products/gemini-app/new-connected-apps-gemini/
4. https://blog.google/innovation-and-ai/products/gemini-app/generate-files-in-gemini/
5. https://support.google.com/drive/answer/16686008
6. https://support.google.com/drive/answer/16685111
7. https://support.google.com/docs/answer/14206696
8. https://support.google.com/docs/answer/16813283
9. https://support.google.com/gemini/answer/14959807
10. https://ai.google.dev/gemini-api/docs/google-search
11. https://ai.google.dev/gemini-api/docs/file-search
12. https://ai.google.dev/gemini-api/docs/function-calling
13. https://ai.google.dev/gemini-api/docs/tools
14. https://ai.google.dev/gemini-api/docs/tool-combination
15. https://developers.google.com/workspace/guides/enable-apis
16. https://developers.google.com/workspace/drive/api/reference/rest/v3
17. https://developers.google.com/workspace/sheets/api/guides/concepts

## Boundary

Magnanimous may reproduce the **observable workflow patterns and public API contracts** with original provider-neutral implementation. It must not copy or claim ownership of Google proprietary model weights, private prompts, training data, source code, internal ranking/retrieval implementation, credentials or restricted account data.

A benchmark capability is not labeled live merely because Google has it. Magnanimous must have a real execution surface or authorized adapter and direct verification before claiming the outcome works.
