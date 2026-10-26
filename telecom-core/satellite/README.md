# Magnanimous Telecom Satellite Backhaul

Satellite connectivity is a replaceable WAN/backhaul rail beneath Magnanimous Telecom. Magnanimous remains the public identity, policy, communications, SIP/PBX and orchestration layer.

## 2026 Philippines selection

For a fixed Magnanimous Telecom site, the default cost-first target is Starlink Residential Lite when the service address is eligible. The mobile/portable target is Starlink Mini with a Roam plan. These are procurement defaults only; the runtime adapter is provider-neutral so Starlink can be replaced by another satellite ISP without changing Magnanimous identity.

Do not claim a physical satellite link is active until hardware is installed, the account is activated, and health probes verify the WAN path.

## Routing policy

- terrestrial WAN remains preferred when healthy by default;
- satellite automatically becomes failover when terrestrial WAN is unavailable;
- satellite can be promoted to primary by configuration;
- voice is permitted on a healthy/degraded satellite path;
- video is suppressed when the satellite path is degraded;
- bulk synchronization is blocked on metered satellite plans by default;
- PSTN authority, numbering, emergency calling, SIM/eSIM authority and carrier status are independent from satellite Internet availability.

## Deployment contract

The edge router/firewall should expose satellite as a separate WAN interface and feed link health into Magnanimous. Use DNS/TLS normally; do not depend on inbound public IPv4. Keep SIP registrations outbound and persistent so CGNAT does not become a public-identity dependency. TURN/WebRTC and SIP keepalive behavior should tolerate path changes.

## Procurement truth lock

Purchasing hardware or service creates an Internet/backhaul connection only. It does not make Magnanimous a licensed satellite operator, spectrum licensee, mobile network operator, emergency carrier, or direct numbering authority.
