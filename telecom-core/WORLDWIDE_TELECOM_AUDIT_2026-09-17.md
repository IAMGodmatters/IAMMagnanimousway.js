# Magnanimous Telecom — worldwide activation audit

Reviewed: 2026-09-17

## Executive result

Magnanimous already owns substantial software control: Magnanimous AI orchestration, telecom service/runtime, owned SIP registrar/proxy design, Asterisk PBX/media routing, provider-neutral carrier bridges, SIM/eSIM abstractions, regulatory readiness tracking, owner-gated paid/regulatory actions, and the new native communications workstream.

The remaining blockers to calling the *entire telecom* active are not primarily UI features. They are live infrastructure, credentials/contracts, regulatory authority, numbering/interconnection, emergency-service compliance, and verified production operations. These must not be simulated.

## New external research absorbed

### U.S. direct numbering

NANPA's 2026 NAS guidance requires an OCN present in NAS and associated with a category eligible for direct numbering. Eligible categories include CLEC and IPES for interconnected VoIP. Direct numbering therefore remains an authority/OCN/NAS workstream, not a software toggle.

Once numbering resources are assigned, utilization/forecast reporting is an ongoing operational obligation. NANPA states NRUF Form 502 is due semi-annually, generally February 1 and August 1. Routing/rating records also require operational administration after assignment.

### Architecture

Keep the current native-first split:
- Kamailio: owned SIP edge/registrar/proxy.
- Asterisk: owned PBX/media/AI/PSTN routing anchor.
- PostgreSQL/D1: durable account, policy, regulatory and audit state.
- Magnanimous AI: public brain/control/orchestration layer.
- Wholesale carriers/MVNO/eSIM/push/TURN providers: replaceable adapters only.

Do not expose upstream providers as the customer-facing identity.

## Activation gates

### Can be activated by software/configuration
- SIP account lifecycle and internal SIP calling.
- Magnanimous-to-Magnanimous internet messaging/audio/video after production realtime/WebRTC adapters are deployed.
- Provider health checks when credentials exist.
- Number/SIM/eSIM search and previews when provider credentials exist.
- Owner dashboards, audit logs, failover policy and truthful readiness reporting.

### Requires external account/contract or money
- Public VPS/compute for SIP/PBX/TURN if no suitable host exists.
- PSTN wholesale interconnect/trunk account.
- SIM/eSIM wholesale/MVNO account.
- Telephone-number orders and SIM/eSIM purchases.
- Production push-notification credentials.

Never incur these charges automatically without the required confirmation.

### Requires authority/compliance evidence
- Direct NANP numbering.
- California carrier/CPCN authority where applicable.
- Philippine facilities-based public telecom authority/franchise/CPCN where applicable.
- Emergency calling representations.
- Direct interconnection rights.
- Any claim that Magnanimous owns assigned public numbering resources.

## Worldwide design

The worldwide strategy is a country-capability matrix, not one universal legal switch. Each jurisdiction gets independent states for voice termination/origination, number availability, number portability, emergency services, messaging, physical SIM, eSIM, mobile data, identity/KYC, lawful intercept/retention requirements, tax/billing, and direct-carrier authority.

A country must default to unavailable for a regulated capability until the corresponding adapter plus legal/compliance evidence is verified. Provider availability never equals regulatory authorization.

## Immediate engineering actions

1. Preserve the owned Kamailio/Asterisk/SIP core and provider-neutral bridge.
2. Deploy only after a real host, DNS, TLS, secrets and firewall are configured.
3. Keep paid purchases locked until owner-confirmed at transaction time.
4. Keep emergency/regulatory actions locked until jurisdiction-specific compliance is verified.
5. Add evidence-required state transitions: `approved` and `verified` must never be accepted without documentary evidence/reference.
6. Add country capability records and use them to gate public product availability.
7. Add carrier health/failover scoring without leaking provider identity publicly.
8. Add CDR, fraud limits, spend limits, rate limits, international-dial policy and abuse monitoring before public PSTN launch.
9. Complete Magnanimous Communications production persistence/realtime/WebRTC/TURN adapters and bridge authorized PSTN calls to the owned telecom core.
10. Add operational runbooks: backup/restore, key rotation, incident response, number portability, emergency outage, carrier failover and regulatory renewal/reporting.

## Truth lock

`software_ready`, `provider_connected`, `commercially_available`, `regulator_authorized`, `direct_numbering_authorized`, and `production_verified` are separate states. No code path, seed, dashboard edit or provider credential may collapse them into one state.

This audit is an engineering/compliance readiness document, not a regulator filing, license, carrier contract, or legal opinion.
