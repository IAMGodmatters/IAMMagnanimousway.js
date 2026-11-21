# Faction Group reel/video research — accessible batch 2

**Research date:** 2026-10-28 (Asia/Manila); revalidated 2026-10-31.
**Platform:** I AM MAGNANIMOUS WAY™. Magnanimous AI remains the central intelligence and orchestrator.
**Source page:** https://www.facebook.com/people/The-Faction-Group-LLC/100091065962204/?sk=videos

## Evidence quality and coverage

The available public page and prior authorized browser inspection exposed ten reel links with longer author-written captions, one additional video URL/caption, and the previously audited security reel. Twelve distinct identifiers are recorded. These are caption/topic observations, not full spoken-audio transcripts or a complete archive. No private material was accessed. Marketing statistics, anecdotes, earnings figures, and security-incident claims are not independently verified unless separately supported by primary evidence.

## Video register

| Video | Caption-supported topic (paraphrased) | Magnanimous relevance and verification boundary |
| --- | --- | --- |
| https://www.facebook.com/reel/28753552417604749/ | Retrieval from company documents and fine-tuning | Prefer permissioned retrieval for changing facts; fine-tune only with approved, rights-cleared data and explicit training consent. |
| https://www.facebook.com/reel/2177096433688755/ | Paid professional AI training roles | Opportunity Vault should verify original listings and legitimacy; rates and earnings claims remain unverified. |
| https://www.facebook.com/reel/1851094802741650/ | Local GPU memory sizing | Add capacity preflight, quantization-aware estimates, context/KV-cache overhead and safe fallback. Weight size alone does not prove runtime fit. |
| https://www.facebook.com/reel/1584937932941162/ | Renting hardware and model hosting | Compare provider retention, model license, egress, tenant isolation and total cost. No automatic paid provisioning. |
| https://www.facebook.com/reel/1665598515092077/ | Credential misuse and unsupervised agents | Use scoped credentials, agent identity, audit logs and a kill switch; cited incidents were not independently verified. |
| https://www.facebook.com/reel/1731054055051523/ | Bounded agent roles and human approval | Enforce least privilege and separate approval for consequential actions in backend policy, not prompts alone. |
| https://www.facebook.com/reel/1109234588581666/ | Local GPU cluster sizing | Buy or rent hardware only after measured utilization, compliance, latency and cost justify it. |
| https://www.facebook.com/reel/1179905091026727/ | Voice-agent latency and hangups | Measure end-of-speech to first audible response, barge-in, timeout and hangup rates. The cited scenario is not a Magnanimous SLA. |
| https://www.facebook.com/reel/1452937746788882/ | Hosted routing for open models | Keep provider adapters replaceable and disclose actual data egress; hosted open-weight inference is not automatically local/private. |
| https://www.facebook.com/reel/3017667775244130/ | Monetizing operational records | Never export or monetize customer tickets, emails or invoices without clear contractual authority, consent, minimization and auditability. |
| https://www.facebook.com/100091065962204/videos/1274175121464493 | AI proposes code, AI reviews, human decides release | Require independent CI evidence and explicit release authorization; a green test suite is not itself production approval. |
| https://www.facebook.com/reel/1873276024056468/ | Buyer security evidence and audit process | Earlier caption/summary only; do not claim complete spoken transcript or independent validation of company claims. |

## Primary-source cross-checks

- Faction's public methodology: https://gofactiongroup.com/conveyor-belt/ and https://gofactiongroup.com/audit/ . These describe the company's own process and are not independent certification.
- OWASP AI Agent Security Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/AI_Agent_Security_Cheat_Sheet.html .
- CISA and partner guidance on careful adoption of agentic AI: https://www.cyber.gov.au/publication/careful-adoption-of-agentic-ai-services .
- GitHub Actions secure-use guidance: https://docs.github.com/en/actions/reference/security/secure-use .
- Hugging Face quantization documentation: https://huggingface.co/docs/transformers/quantization/bitsandbytes .

## Independent implementation priorities

1. Enforce job-scoped OIDC and disable persisted Git credentials on deployment checkouts.
2. Label legacy integration permission defaults separately from explicit owner policy; preserve existing behavior until a tenant-safe migration and owner UI are ready.
3. Ensure a connected account is inventory, not an independent grant for agent writes.
4. Keep consequential actions bound to explicit, time-limited user approval and exact action parameters.
5. Build measured voice-latency and GPU-capacity tests before making performance promises.
6. Preserve Magnanimous-owned identity, memory, orchestration and authorization; external providers remain replaceable tools.

## Not completed / limitations

- The twelve-item register is not an exhaustive Facebook archive and does not include full audio transcription.
- No paid audit, penetration test, GPU purchase, provider provisioning, external account write, customer-data export, or production deployment was performed.
- Live revision parity, Cloudflare free quota, voice SLA and mobile visual composition remain separate verification requirements.
- A source inventory or passing CI workflow does not certify production readiness.
