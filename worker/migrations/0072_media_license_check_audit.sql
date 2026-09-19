-- Add auditable user-attested license checks without changing existing saved assets.
ALTER TABLE media_library_assets ADD COLUMN license_checked_at INTEGER NOT NULL DEFAULT 0;
ALTER TABLE media_library_assets ADD COLUMN license_checked_by TEXT NOT NULL DEFAULT '';
ALTER TABLE media_library_assets ADD COLUMN license_snapshot TEXT NOT NULL DEFAULT '';
