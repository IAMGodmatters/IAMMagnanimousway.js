# Mobile production visual runner reliability

On October 27, 2026, otherwise unchanged mobile screenshot jobs intermittently timed out at headless Chrome image decoding. The verified production WebP and JPEG files passed byte/hash and RIFF checks before Chrome launched. One previous rerun completed successfully, indicating a hosted browser startup/environment failure rather than verified artwork loss.

`.github/workflows/mobile-production-visual.yml` now allows **at most two** independent Chrome attempts for the local decode check and for each of the three production viewport renders. Each attempt uses a fresh browser profile directory under the ephemeral GitHub runner. Failed attempts emit warnings; if neither succeeds, the job still fails with its diagnostic log. The overall workflow stays capped at 15 minutes.

The previously required evidence remains unchanged: exact mobile and desktop artwork hashes, WebP structure, actual browser-decoded image dimensions, expected responsive HTML markers, output screenshot existence and minimum size. No visual mismatch is ignored. No new paid service or model is introduced.

QA: `node qa/scripts/magnanimous-mobile-browser-retry-lock.mjs`, YAML parser and `bash -n` for the embedded shell. Actual hosted behavior requires the next post-merge mobile production run.
