# Approved Homepage Artwork Lock

The homepage artwork is owner-approved and must not be replaced, redesigned, restyled, recolored, hidden, cropped, substituted, or otherwise altered unless the owner explicitly requests a design change.

## Mobile

Known-working canonical fallback: `frontend/public/mobile-dashboard-approved.webp`

Required fallback Git blob SHA-1: `65036a811159196e6fe1789760db162e901cf4fa`

High-resolution enhancement: `frontend/public/mobile-dashboard-approved-sharp.webp`

Required enhancement Git blob SHA-1: `1b894696ed7bcdc1613c93d36e29fa2210acaad3`

The mobile homepage must always keep the known-working owner-approved portrait artwork visible underneath any high-resolution enhancement. The enhancement must use the same approved design, remain pointer-transparent, and may never become the only recovery path. If the enhancement fails to load or paint, the known-working approved artwork must remain visible. Substitute or simplified artwork is not allowed. Homepage helper overlays must not cover the approved mobile artwork.

## Computer / Desktop

Canonical visual source: `frontend/public/crm-upgrade.jpeg`

Required SHA-256: `4782F5011B660DC4A189B1A2A315352C241CAD40C4800AD2A5C78949837EC548`

The desktop homepage artwork must remain unchanged.

## Enforcement

CI and production visual verification must fail when a locked artwork identity changes unexpectedly, when the homepage points to different artwork, when substitute artwork is made visible, when the known-working fallback is removed, or when the high-resolution layer can block interactions. Functional hotspots, accessibility, navigation, delivery hardening, and bug fixes may be repaired without modifying the approved design itself.
