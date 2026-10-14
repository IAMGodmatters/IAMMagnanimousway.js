# Magnanimous Native Investigation Foundry

This is an additive, free-first investigation capability owned by Magnanimous AI. External analyzers (including REA) are optional workers, never the identity, memory, policy, or authority layer.

## Supported native baseline
- Passive inspection of user-supplied JavaScript, JSON, text, and source-map metadata
- SHA-256 evidence identifiers, provenance, explicit inference-versus-observation labels
- No execution, arbitrary network fetches, secret collection, decryption, or target modification
- Strict byte limits; tenant-scoped evidence storage must be enforced by the calling application before enabling persistence
- REA adapter remains disabled by default, requiring an explicitly approved local operator setup

## Optional REA provider
Upstream: https://github.com/morluto/rea (MIT; retain upstream license and notices when redistributing source).
REA uses Node.js >=22.19 and offers MCP/CLI integrations, evidence records, passive web/Electron observations, managed PE triage, and Ghidra/Hopper analysis subject to host/tool availability.
Run locally only after reviewing the upstream release, dependency tree, and installer effects. Never run untrusted binaries in the production Cloudflare Worker.

## Security and commercial boundaries
Only inspect owned or expressly authorized targets. Do not bypass access controls, DRM, paywalls, licenses, authentication, or consent. Do not copy third-party proprietary source or trademarks. Keep provider costs off unless explicitly funded and enabled. Owner approval and tenant isolation must gate any future remote target acquisition, active probing, binary execution, or privileged analysis.

## Verification
Run `node --test tools/native-investigation/*.test.mjs`. This module is standalone and is not wired into customer-facing routes until authentication, persistence, billing and security review are completed.
