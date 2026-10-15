# Approved Homepage Artwork Lock

The homepage artwork is owner-approved and must not be replaced, redesigned, restyled, recolored, hidden, cropped, substituted, or otherwise altered unless the owner explicitly requests a design change.

## Mobile

Canonical visual source: `frontend/public/mobile-dashboard-approved-locked.jpeg`

Required SHA-256: `7939B2BD5F404C9378F3CD745DC1448C6BD00D0B799FDBD93AE2EE8C276BABAA`

The mobile homepage must display this exact portrait artwork as the primary visible design. A resilience fallback may exist only behind it and must never supersede it while the approved image loads successfully.

## Computer / Desktop

Canonical visual source: `frontend/public/crm-upgrade.jpeg`

Required SHA-256: `4782F5011B660DC4A189B1A2A315352C241CAD40C4800AD2A5C78949837EC548`

The desktop homepage artwork must remain unchanged.

## Enforcement

CI/QA must fail when either canonical artwork hash changes, when the homepage points to a different artwork source, or when CSS intentionally hides the approved mobile artwork. Functional overlays/hotspots may be repaired without changing the artwork itself.
