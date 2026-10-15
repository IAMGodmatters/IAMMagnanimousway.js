# Approved Homepage Artwork Lock

The homepage artwork is owner-approved and must not be replaced, redesigned, restyled, recolored, hidden, cropped, substituted, or otherwise altered unless the owner explicitly requests a design change.

## Mobile

Canonical visual source: `frontend/public/mobile-dashboard-approved.webp`

Required Git blob SHA-1: `20055cee777421537713a9153c377e6cfca77b02`

The mobile homepage must display these exact approved portrait artwork bytes as the primary visible design. If a resilience background is needed, it must use the same approved artwork bytes rather than a substitute or simplified design. Homepage helper overlays must not cover the approved mobile artwork.

## Computer / Desktop

Canonical visual source: `frontend/public/crm-upgrade.jpeg`

Required SHA-256: `4782F5011B660DC4A189B1A2A315352C241CAD40C4800AD2A5C78949837EC548`

The desktop homepage artwork must remain unchanged.

## Enforcement

CI and production visual verification must fail when either canonical artwork identity changes, when the homepage points to different artwork, when substitute artwork is made visible, or when CSS intentionally hides the approved mobile artwork. Functional hotspots, accessibility, navigation, and bug fixes may be repaired without modifying the artwork itself.
