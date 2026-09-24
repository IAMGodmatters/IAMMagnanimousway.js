# I AM MAGNANIMOUS WAY™ — Deep Telecom, Carrier and Contact-Center Architecture Study

Date: 2026-09-24
Scope: carrier structure, SIP/PSTN, PBX, browser calling, contact-center design, route economics, resilience, quality telemetry, regulatory truth boundaries, and implementation actions.

## Executive architecture conclusion

The strongest structure for Magnanimous is not to make any single CPaaS, carrier, or CCaaS vendor the platform. The durable design is:

1. **Magnanimous AI** — brain, policy, orchestration, memory, verification and decision layer.
2. **Magnanimous Telecom / Magnanimous Carrier** — public communications identity and customer contract.
3. **Magnanimous-owned control plane** — customer tenancy, queues, campaigns, IVR, callbacks, CDRs, billing/rating, fraud/compliance controls, provider inventory, route policy and audit.
4. **Magnanimous-owned SIP/PBX/media core** — Kamailio + Asterisk now; SBC/RTPengine can be added when scale or topology requires them.
5. **Native browser-agent media** — Asterisk SIP-over-WSS with DTLS-SRTP, ICE, RTCP mux and Opus, gated behind real TLS/browser verification.
6. **Replaceable PSTN interconnects** — at least one primary and one secondary wholesale/SIP route, selected by destination, health, measured quality and cost.
7. **Compatibility transports** — Twilio/other SDK/API rails remain optional fallbacks while native media is deployed and verified.
8. **Regulated authority stays external** — source code cannot create NTC/FCC authority, numbering rights, E911/911 capability, spectrum rights or carrier interconnection agreements.

This structure preserves platform ownership while allowing the carrier layer to change by geography, price and quality.

## Why one global carrier is the wrong design

No public rate card proves that one carrier is cheapest or highest quality for every destination. A production system should therefore route by destination prefix, route health, current rate, maximum rate, ASR, ACD, PDD, network failure rate, sample freshness/count, and operator priority.

This pass implements those control-plane rules without silently changing existing live carrier execution.

## Current carrier benchmark

Rates below are public-list snapshots researched on 2026-09-24. They are not promises of account-specific price. Destination, number type, volume tier, taxes, surcharges and negotiated contracts can change the effective rate. The platform should refresh rate data before a production route-policy change.

### Telnyx

Role: strong programmable carrier/SIP/network candidate, not Magnanimous identity.

Official references:
- https://telnyx.com/pricing/voice-api
- https://telnyx.com/pricing/elastic-sip
- https://telnyx.com/pricing

Current public structure:
- Voice API platform fee: $0.002/min plus SIP-trunk transport.
- SIP trunking public starting figures include outbound from $0.005/min and inbound from $0.0032/min; destination passthrough varies.
- Browser/app calling and recording are separate primitives.
- Telnyx exposes machine-readable public pricing and destination-based rate decks.

Architecture value:
- SIP-first and API-first model.
- Strong candidate for numbers, SIP, emergency-service integrations and network APIs where its coverage/contract fits.
- Must remain one route among multiple healthy interconnects.

### Plivo

Role: alternate SIP/API route, particularly worth benchmarking for Philippine traffic.

Official references:
- https://www.plivo.com/sip-trunking/pricing/ph/
- https://www.plivo.com/sip-trunking/coverage/ph/
- https://www.plivo.com/voice/pricing/ph/

Published Philippine SIP examples at research time:
- local outbound: starts at $0.153/min;
- mobile outbound: starts at $0.198/min;
- coverage page lists local inbound around $0.220/min;
- local DID rental: $25/month.

Architecture value:
- On some Philippine routes its published SIP termination is below Twilio's published Philippine SIP termination.
- It should be selected only when the actual destination rate, quality and contract support the choice.

### Twilio

Role: broad compatibility ecosystem and current browser Voice SDK fallback; not public platform identity.

Official references:
- https://www.twilio.com/en-us/sip-trunking/pricing/ph
- https://www.twilio.com/en-us/voice/pricing/ph
- https://www.twilio.com/docs/sip-trunking/pricing-trunking-resource

Published Philippine SIP examples at research time:
- termination starts around $0.2026/min;
- Philippine mobile around $0.2898/min;
- local origination around $0.3293/min;
- Programmable Voice browser/app interface is separately metered.

Architecture value:
- Strong compatibility path.
- Account-specific pricing API can be used for current rates.
- Should not remain the permanent browser-agent media dependency once the native Asterisk WebRTC rail is production-verified.

### Bandwidth

Role: direct-network/BYOC benchmark and possible interconnect candidate, particularly for U.S. and supported international footprints.

Official references:
- https://www.bandwidth.com/pricing/
- https://www.bandwidth.com/products/sip-trunking/

Public positioning:
- owned/operated network;
- direct-to-carrier pricing model;
- SIP trunking and BYOC integrations;
- public site reports full-stack PSTN replacement in 40+ countries and PSTN interconnect reach in more markets;
- many rates are quote/volume based rather than a simple universal public destination price.

Architecture value:
- Useful second-source/direct-network benchmark where contract and geography fit.
- Should be evaluated with real quote + route quality rather than assumed cheapest.

### SignalWire

Role: low-cost SIP/WebRTC benchmark for supported geographies.

Official reference:
- https://signalwire.com/pricing/rates

Published U.S. examples at research time:
- SIP: $0.003/min inbound and outbound;
- WebRTC: $0.003/min inbound and outbound;
- recording and other media features are separately priced.

Architecture value:
- Useful cost benchmark and optional transport.
- Public U.S. pricing must not be treated as Philippine pricing or universal global economics.

## Owned PBX and browser media study

Official Asterisk references:
- https://docs.asterisk.org/Configuration/WebRTC/Configuring-Asterisk-for-WebRTC-Clients/
- https://docs.asterisk.org/Latest_API/API_Documentation/Module_Configuration/res_pjsip/
- https://docs.asterisk.org/Configuration/Miscellaneous/Interactive-Connectivity-Establishment-ICE-in-Asterisk/
- https://docs.asterisk.org/Configuration/Interfaces/Asterisk-REST-Interface-ARI/Introduction-to-ARI-and-Media-Manipulation/ARI-and-Media-Part-1-Recording/
- https://docs.asterisk.org/Configuration/Interfaces/Asterisk-REST-Interface-ARI/Introduction-to-ARI-and-Bridges/ARI-and-Bridges-Holding-Bridges/

Asterisk supports secure WebSocket signaling, PJSIP WebRTC endpoints, DTLS-SRTP media, ICE, RTCP mux, Opus/G.711, ARI bridges, holding bridges and bridge recording.

### Gap found in the prior source

The repository already named Asterisk WebRTC as the native target and contained a WSS transport placeholder, but the target was not actually usable:
- Asterisk HTTP was loopback-only;
- TLS was disabled;
- no gated browser endpoint contract existed;
- the WSS source did not prove a trusted public certificate;
- a public STUN service was hard-coded even though deployment topology might not require it;
- UI/backend wording could imply a native target without differentiating source readiness from live readiness.

### Fix applied in this pass

The branch now:
- renders the WSS transport only when native WebRTC is explicitly enabled;
- requires a readable TLS certificate and private key before enabling the WSS source;
- adds a dedicated WebRTC PJSIP endpoint with webrtc=yes;
- uses DTLS-SRTP, ICE, RTCP mux and Opus/G.711;
- exposes an authenticated /v1/webrtc readiness contract from the Telecom Core;
- removes the hard-coded public STUN dependency;
- makes STUN optional/operator-selected;
- keeps WebRTC disabled by default;
- adds TELECOM_NATIVE_WEBRTC_LIVE=false as the platform truth gate;
- keeps the compatibility browser softphone available;
- refuses to call native WebRTC live until real browser registration and two-way media are proven.

TURN remains a deployment/topology decision. Restrictive NAT environments may require a TURN/media relay even when STUN is present.

## Contact-center benchmark and structure

Mature contact-center systems consistently converge on the same functional layers:
- omnichannel interaction intake;
- skills/priority routing;
- routing profiles and queue policy;
- IVR/self-service;
- callbacks;
- outbound campaigns;
- agent presence/state;
- supervisor monitoring/coaching;
- recording and retention controls;
- quality management;
- workforce forecasting/scheduling;
- real-time and historical analytics;
- agent assist;
- post-contact summaries;
- CRM/customer context;
- fraud, consent, DNC and calling-window controls.

Amazon Connect's current documentation, for example, describes routing by agent profiles/skills, queue hours and flow logic; it also documents callbacks, recording/analytics controls, workforce scheduling, performance evaluation and real-time agent assistance:
- https://docs.aws.amazon.com/connect/latest/adminguide/about-routing.html
- https://aws.amazon.com/products/connect/customer/pricing/
- https://docs.aws.amazon.com/connect/latest/adminguide/set-up-recordings.html

The conclusion is not to move Magnanimous onto Amazon Connect. The useful conclusion is to keep these patterns as product requirements while Magnanimous owns the customer, routing, policy and PBX/control plane.

## Current Magnanimous contact-center position

Already present or materially implemented:
- inbound/outbound records;
- agent states;
- queues;
- preview/progressive/power campaigns;
- IVR;
- callbacks;
- voicemail;
- dispositions/retries;
- DNC enforcement;
- calling-hour and campaign-cap controls;
- CRM context foundations;
- AI assist/call intelligence foundations;
- omnichannel inbox;
- WFM/QA/health foundations;
- free browser-to-browser calling;
- compatibility carrier softphone;
- provider-private customer experience;
- carrier route planner.

Not yet claimed live:
- native browser-agent SIP/WSS media;
- native Stasis-managed full call lifecycle;
- supervisor monitor/whisper/barge over the owned PBX;
- bridge-level recording in the production telecom host;
- route-plan authority over every legacy live carrier adapter.

Those items require runtime proof, not merely source code.

## Carrier route planner deep fix

Prior state:
- balanced/least-cost/priority policy existed;
- configured quality and rate signals existed;
- maximum rate could be stored;
- recent live CDR evidence was not part of route scoring.

New state:
- route selection keeps longest-prefix matching;
- down/unavailable/failed routes are excluded;
- routes above configured max_rate are excluded;
- the planner reads recent route CDR evidence;
- measured signals include ASR, ACD, PDD and network-failure rate;
- measured quality becomes eligible after a sample floor and freshness test;
- configured quality remains the fallback when evidence is insufficient;
- UI shows quality source, samples and measured metrics;
- the API truthfully states that legacy live adapters are not all executing through this selected-route contract yet.

This prevents a false claim that least cost or quality routing is already controlling every production call.

## Philippine regulatory truth boundary

Official NTC source:
- https://ntc.gov.ph/wp-content/uploads/2023/citizens_charter/9-29-23/6-05%20SID%20CCT%2009282023.pdf

The NTC Citizen's Charter includes a Certificate of Registration path for VoIP Provider / VoIP Reseller. The new VoIP Provider path shown in the cited document includes items such as:
- NTC application form;
- description of intended VoIP service;
- equipment/material list;
- functional block diagram and system configuration;
- valid interconnection and/or facilities lease agreement with an authorized network provider;
- corporate/DTI documentation;
- a stated paid-up-capital requirement for the provider path.

Do not assume provider and reseller requirements are identical. Before filing, verify the then-current NTC checklist for the exact operating model.

Magnanimous can build the software, PBX, routing, CDR, customer, billing and support layers now. It must not represent itself as a legally authorized public VoIP provider/reseller in the Philippines until the applicable NTC registration and required network agreements are actually in force.

## Recommended physical/network topology

### Initial production telecom node

- hardened Linux host with stable public IP;
- Kamailio SIP edge/registrar;
- Asterisk PBX/media/ARI;
- Postgres SIP identity store;
- Magnanimous Telecom control API;
- TLS certificate for WSS;
- firewall allowing only required SIP/WSS/RTP/control paths;
- private/loopback ARI;
- primary authorized SIP interconnect;
- optional secondary authorized SIP interconnect;
- health/quality telemetry exported to Magnanimous.

### Scale stage

Add only when traffic/topology requires it:
- redundant SIP edge nodes;
- RTPengine/media relays;
- active health checks;
- geo-aware DNS/failover;
- per-carrier CPS/concurrency policy;
- fraud velocity and destination controls;
- rate-deck ingestion;
- route quarantine;
- NOC alerts;
- dedicated recording/object storage;
- lawful retention/deletion controls.

## Cost design

The cost hierarchy should remain:
1. free authenticated browser-to-browser media when both parties can use Magnanimous;
2. owned PBX/media with wholesale/BYOC interconnect;
3. destination-aware low-cost authorized SIP route;
4. compatibility CPaaS/API path when needed;
5. premium AI/media features only when the workspace explicitly enables and can fund them.

The route engine must consider quality and failure rate as well as price. The cheapest nominal route is not cheapest if it creates retries, low ASR, poor audio or support load.

## Security design

- carrier/API credentials stay server-side;
- customer-facing UI uses Magnanimous identity;
- provider account presence is not treated as route health;
- WSS requires trusted TLS in production;
- ARI remains private;
- SIP/WebRTC credentials must be user/device scoped rather than a single public shared password when native agent provisioning is completed;
- recording is off by default until consent/jurisdiction policy permits it;
- emergency calling remains disabled until compliant routing/location service is configured and tested;
- purchase/regulatory actions remain explicitly gated.

## Deep-fix status

Implemented on branch fix/deep-telecom-architecture-2026-09-24:
- durable active-development checkpoint + QA lock;
- secure gated Asterisk WebRTC source configuration;
- optional STUN instead of hard-coded public STUN;
- authenticated WebRTC readiness API;
- native-vs-compatibility softphone truth state;
- expanded carrier candidate model;
- measured route-quality scoring;
- enforced max-rate exclusion;
- owner UI carrier matrix and measured route visibility;
- preserved existing working carrier compatibility paths.

Still external or runtime-gated:
- dedicated live Telecom Core host/domain;
- trusted WSS certificate deployment;
- real browser SIP registration and two-way media verification;
- direct native-browser client migration in the main agent desk;
- explicit selected-route adapter mapping for every live carrier;
- NTC/FCC or other legal authorizations;
- carrier contracts/interconnects;
- emergency-service authority/configuration;
- supervisor monitor/whisper/barge production activation.

## Promotion rule

Do not mark any carrier, native WebRTC path, emergency route, direct numbering authority, supervisor media feature or standalone telecom service as live without runtime/deployment evidence.

Do not remove a working compatibility transport merely because the native replacement exists in source. Promote the native path only after it is independently verified, then keep the compatibility path as fallback until operational evidence shows it can safely be retired.
