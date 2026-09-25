# Magnanimous Global Mobile — Public Pattern Absorption

Magnanimous AI remains the command brain. Magnanimous Telecom remains the customer-facing telecom identity. This document records public product and regulatory patterns researched from Popcorn Labs, Inc. and converts only those observable patterns into original Magnanimous-native product architecture. No Popcorn source code, private API, hidden prompt, credentials, private model weights, restricted datasets, eSIM secrets, carrier agreements or undisclosed wholesale-network implementation are copied.

## Publicly observed product patterns

Public Popcorn materials describe:
- a single US-number mobile service intended for use globally;
- eSIM activation and device setup;
- multi-line/family management;
- tablet/data-device additions;
- number port-in;
- in-app backup calling;
- call forwarding;
- an optional AI assistant for incoming calls;
- selectable ring/screen behavior for missed calls, unknown callers or all calls;
- spam handling;
- post-call summaries and recordings, with transcripts described as an evolving feature;
- device compatibility based on eSIM support and carrier-unlocked devices;
- global roaming/coverage claims tied to the actual service plan;
- fair-use controls even when a retail plan is marketed as unlimited.

Primary public product/help sources:
- https://popcorn.space/
- https://popcorn.space/global
- https://popcorn.space/pricing
- https://popcorn.space/terms
- https://popcorn.space/privacy
- https://help.popcorn.space/en/articles/14723076-setting-up-assistant
- https://help.popcorn.space/en/articles/14737118-using-assistant
- https://help.popcorn.space/en/articles/14498627-what-is-call-forwarding
- https://help.popcorn.space/en/articles/10922748-can-i-add-family-friends-to-my-plan
- https://help.popcorn.space/en/articles/9076103-can-i-bring-my-number-to-popcorn
- https://help.popcorn.space/en/articles/10922779-does-popcorn-work-with-my-phone

## Public regulatory/source evidence

Popcorn's terms identify Popcorn Labs, Inc. as a licensed US carrier. Public regulatory records also show a US FCC Form 499 filer entry and state-level reseller authority activity. Those facts are useful as an architectural benchmark, but they do not grant Magnanimous any authority.

Public records reviewed:
- FCC Form 499 Filer Database entry for Popcorn Labs, Inc., Filer ID 837077.
- Illinois Commerce Commission docket P2025-0853, describing Popcorn Labs, Inc. as seeking/receiving wireless authority to operate as a reseller of telecommunications services statewide.
- ITU Operational Bulletin No. 1342, listing Popcorn Labs, Inc. for a US issuer identifier effective May 16, 2026.

The public sources do **not** establish a complete list of Popcorn's current wholesale host networks, roaming partners, SM-DP+ provider, private interconnect contracts, AI vendors or commercial rate cards. Magnanimous must not invent those relationships or present guesses as "true source" evidence.

## Magnanimous-native capabilities added

### Global Mobile profile
A signed-in Magnanimous user can maintain:
- AI assistant mode: off, missed only, unknown callers only, or all calls;
- ring mode: always, contacts only, or never;
- spam action: screen, block, voicemail, or ring;
- assistant voice/tone preference;
- summary and transcript preference;
- recording preference with explicit compliance confirmation plus jurisdiction;
- forwarding mode: off, Magnanimous app, Magnanimous AI assistant, or verified external target;
- automatic vs manually preferred network-selection guidance.

These are Magnanimous policy records. They do not silently reprogram an outside carrier.

### Multi-line and device control
The native control plane supports:
- primary, additional, tablet and backup line records;
- account-managed household/family style line organization;
- device platform/model records;
- eSIM-capability confirmation;
- carrier-unlocked confirmation;
- preferred access mode (automatic/5G/LTE/Wi-Fi-first);
- backup-device designation.

Creating these records does not activate public mobile service.

### Spam policy
Users can maintain a Magnanimous-native E.164 manual block list. The list is owned by the user's workspace and does not copy a third-party spam database.

### Existing Magnanimous capabilities reused
The Global Mobile layer intentionally reuses already-built Magnanimous systems instead of duplicating them:
- /telecom/sim — SIM/eSIM inventory and authorized provisioning adapter workflow;
- /telecom/network — numbering, porting, carrier/regulatory readiness;
- /softphone — in-app/backup calling;
- /ai-receptionist — AI call handling;
- /contact-center — summaries, transcripts/analysis, supervision and consent-gated recording;
- /telecom/plans — retail plan/subscription policy;
- /telecom/operations — OSS/BSS, service orders, balances, routing, fraud and assurance.

## Safety and truth boundaries

- Raw Ki, OPc, ADM, confirmation codes, reusable activation codes and profile packages remain prohibited from ordinary application storage.
- eSIM creation/activation requires an authorized MNO/MVNO/SM-DP+ relationship.
- Public-number activation, emergency calling, direct numbering and carrier status remain externally gated.
- Recording is never enabled by a silent default. The Global Mobile profile requires a jurisdiction plus explicit compliance confirmation before recording can be enabled.
- Covert monitoring remains disabled.
- A saved forwarding or screening preference is not reported as a carrier-side change unless a verified adapter actually executes it.
- Country coverage must come from the active authorized mobile adapter/plan. No copied "180+ countries" claim is inserted into Magnanimous product truth.
- "Unlimited" retail language must still be backed by explicit fair-use/rating policy.
- External provider names remain private infrastructure details unless an owner/admin engineering surface needs them.

## Pricing policy

Popcorn's current public retail price is research evidence only; it is not copied into Magnanimous pricing.

Magnanimous keeps its standing provider-cost policy:
1. verify the actual direct-origin provider cost;
2. prefer free/native paths where possible;
3. require funded/approved paid capacity;
4. apply the platform's configured 20% markup only to real external origin cost;
5. enforce caps and idempotency;
6. never create a hidden metered fallback.

## Unresolved external dependency

The major remaining dependency is not source code. It is an authorized real mobile-network relationship capable of issuing/activating eSIM profiles, delivering supported country/network truth, porting numbers, handling roaming and satisfying jurisdiction-specific telecom obligations. Until that exists and is verified, Magnanimous Global Mobile remains a truthful native control plane plus the already-live Magnanimous communications tools rather than a falsely claimed facilities-based mobile network.
