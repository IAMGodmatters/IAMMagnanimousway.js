# Unfenced.ai Capability Absorption — 2026-10-05

## Objective

Absorb the useful **publicly observable capability patterns** documented by Unfenced.ai into Magnanimous AI while keeping Magnanimous AI as the identity, memory, planner, policy layer, orchestrator and verifier.

This is a clean-room capability benchmark. It is **not** a copy of proprietary source code or private infrastructure.

## Publicly documented Unfenced surface

The official public pages reviewed on 2026-10-05 describe a browser-agent service centered on:

- fetching public URLs through a real browser and returning clean readable content;
- markdown, JSON, text and HTML output choices;
- multiple fetch tiers / escalation paths;
- reading PDFs as text sources;
- live browser sessions for signed-in pages, clicks and forms;
- an open → observe → act workflow with page controls represented through references;
- stored credentials kept outside model context and injected by the browser service when needed;
- MCP access plus ordinary HTTP/SDK access;
- API-key and OAuth authentication patterns;
- per-site permission / delegated-authority controls;
- confirmation requirements for consequential actions;
- real-IP / residential-egress positioning;
- signed hash-chained action receipts;
- legal rules against unauthorized access, credential misuse and actions outside delegated authority.

Unfenced's Terms of Service state that the service is in private preview, experimental, free of charge during preview, and carries no SLA. That is retained as an availability caveat rather than treating marketing claims as production proof.

## Magnanimous overlap already present

Before this benchmark was added, Magnanimous already had a first-party Native Web / Local Bridge browser layer with:

- Chromium-based public web search;
- JavaScript-rendered fetch;
- 1–10 URL batch fetch;
- source-backed browser research;
- multi-step read flows;
- confirmation-gated click/fill/select/press flows;
- persistent browser sessions;
- persistent local Chromium profiles;
- visible manual profile sign-in;
- screenshots;
- scheduled monitoring;
- completion webhooks;
- native goal planning;
- private/local network target blocking;
- proxy support without claiming an owned proxy network;
- a deliberate rule that remote browser tasks may not carry secret/password values.

This means Magnanimous does **not** need Unfenced as a permanent runtime dependency to gain most of the observable workflow class.

## New brain contracts

`worker/src/magnanimous-unfenced-capability-registry.js` records the Unfenced public benchmark as provider-neutral Magnanimous contracts. The registry covers:

1. public URL fetch;
2. clean readable extraction;
3. JavaScript-rendered fetch;
4. PDF-as-source reading;
5. tiered fetch routing;
6. multiple output formats;
7. MCP read/action contracts;
8. HTTP/SDK access;
9. API-key/OAuth patterns;
10. live page opening;
11. page observation;
12. referenced-element actions;
13. form/click workflows;
14. signed-in session reuse;
15. secret-isolated credential use;
16. site permission allowlists;
17. action confirmation gates;
18. delegated-authority policy;
19. sealed session/credential storage;
20. browser session audit records;
21. signed hash-chained receipts;
22. failure normalization;
23. real-browser execution;
24. real-IP egress;
25. optional residential egress.

## Native targets

The benchmark maps onto existing Magnanimous-owned surfaces rather than creating an Unfenced-branded subsystem:

- `native-web-browser` — public search/fetch, Chromium rendering, browser sessions, profiles and confirmed actions;
- `knowledge-workspace` — clean content, source handling and document ingestion;
- `universal-tool-gateway` — MCP/HTTP/OAuth/API-key tool contracts;
- `magnanimous-config-vault` — encrypted credential/config references;
- `operations-hub` — action staging, confirmation policy, retries and failure recovery;
- `security-auditor` — delegated authority and site/action scope policy;
- `evidence-auditor` — browser/action evidence and receipt records;
- `magnanimous-network-gateway` — real network/proxy boundary.

## Truthful gaps that remain

The benchmark must **not** turn a specification into a false production claim.

### Residential/geo proxy fleet

Magnanimous currently supports local authenticated proxy configuration and per-run unauthenticated proxy input, but does not own or claim an Unfenced-like residential/geo proxy fleet. That remains an optional external network-capacity boundary until real infrastructure is deployed and verified.

### Model-invisible remote secret injection

Magnanimous currently takes the stricter approach: browser session cookies can remain in an owner-controlled local browser profile, while remote tasks refuse password/secret field filling. The Unfenced pattern of selecting a named vault credential and injecting it into a page without exposing the value to the model is absorbed as a target contract, **not claimed live** until Magnanimous builds and verifies a vault-to-browser injection path with site/scope restrictions, audit logs and revocation.

### Signed hash-chained receipts

Magnanimous now writes a tamper-evident per-device hash-chained receipt for completed or failed Native Web browser tasks. The receipt stores hashes rather than duplicating fetched page content, can be retrieved by task, and has an owner-only verification route. Optional HMAC-SHA-256 signing activates only when `MAGNANIMOUS_RECEIPT_SIGNING_KEY` is configured as a secret binding; without that key the chain remains hash-linked but is truthfully reported as unsigned.

## Safety / authority rule

Browser capability is not permission.

Magnanimous must:

- deny private/local targets on public-web paths;
- require owner/user authorization for signed-in account use;
- require confirmation for consequential page actions;
- avoid credential values in model-visible prompts and task payloads;
- respect delegated authority and site rules;
- preserve audit evidence;
- never claim an external action occurred without a real tool result.

## Official source ledger

1. https://unfenced.ai/
2. https://unfenced.ai/docs
3. https://unfenced.ai/behind-login
4. https://unfenced.ai/legal
5. https://unfenced.ai/legal/terms-of-service
6. https://unfenced.ai/legal/acceptable-use-policy
7. https://unfenced.ai/legal/privacy-policy
8. https://unfenced.ai/legal/data-processing-addendum
9. https://unfenced.ai/legal/subprocessors

## Boundary

Magnanimous may reproduce observable workflow patterns and public contracts with original provider-neutral implementation. It must not copy or claim ownership of Unfenced proprietary source code, hidden prompts, browser infrastructure, anti-bot implementation, credentials, sealed user data, residential proxy sourcing, private datasets or internal operational methods.

The goal is **capability independence**, not vendor impersonation.
