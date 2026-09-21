# Magnanimous Unified Capability Mesh — 2026-09-21

## Purpose

Magnanimous AI now has one provider-neutral capability router joining four previously separate execution surfaces:

1. **Magnanimous Native Web** — clean-room TinyFish-independent browser/search/fetch/research/session capability.
2. **Magnanimous Dev Agent / GitHub** — repository reads, search, workflow inspection, staged repository writes and CI/release control.
3. **Magnanimous Cloud + Cloudflare adapter** — first-party cloud-control contracts plus optional guarded Cloudflare reads and separately confirmed provider mutations.
4. **Railway-compatible deployment rail** — provider-neutral Railway capability contracts plus an exact-commit deployment workflow that Magnanimous can stage through its GitHub adapter.

Magnanimous remains the brain, identity, memory owner, policy layer, router, verifier and learning system. Provider brands are execution rails, not product identity.

## Runtime routes

- `GET /api/magnanimous/capability-mesh` — readiness and routing summary.
- `GET /api/magnanimous/capability-mesh/catalog` — unified capability catalog.
- `POST /api/magnanimous/capability-mesh/self-check` — records a live readiness snapshot.
- `POST /api/magnanimous/capability-mesh/route` — routes an approved capability request to the correct existing handler.

The mesh does **not** self-approve mutations. GitHub and Cloudflare writes remain staged and separately confirmed. Railway exact deployment is staged as a GitHub workflow-dispatch action and therefore inherits the Dev Agent confirmation gate.

## Native-first routing

The order is:

1. first-party Magnanimous runtime,
2. owner-controlled local execution,
3. authorized account adapter,
4. replaceable infrastructure/capacity rail.

A capability is not called ready just because its contract exists. Readiness is based on actual Local Bridge heartbeat/capability evidence or configured provider credentials/bindings.

## Provider boundaries

- **TinyFish:** not required for supported native web capabilities. No TinyFish runtime key or wallet is required.
- **GitHub:** live private/write/workflow operations still require an authorized GitHub repository credential.
- **Cloudflare:** optional provider reads/actions require the dedicated server-side Cloudflare credential. Native Magnanimous software does not require Cloudflare for identity or control-plane ownership.
- **Railway:** exact-deploy workflow is installed. Direct autonomous Railway provider fallback requires the production-scoped Railway project token or another verified deployment rail. Railway remains optional capacity.
- **Physical infrastructure:** real CPU/RAM/disk, public IPs, Internet transit, DNS/registrar authority and regulated networks cannot be created by software contracts alone.

## Initiative loop

A scheduled mesh self-check records readiness history. The owner page at `/owner-capability-mesh` exposes live status, native-web readiness, GitHub authorization state, optional provider readiness and suggested next actions. It can also stage a current-main Railway promotion without bypassing the separate approval boundary.
