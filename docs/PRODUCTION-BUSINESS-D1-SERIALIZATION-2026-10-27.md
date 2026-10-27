# Business-operations production smoke and D1 import contention

Date: October 27, 2026.

Evidence: GitHub Actions `verify-business-operations`, run `40461485877`, failed when an FX API request returned HTTP 500 with `D1_ERROR: Currently processing a long-running import.` This was observed during overlapping deployment/database work, not proof of a finance calculation defect.

Change: `.github/workflows/business-operations-production-check.yml` joins the `magnanimous-main-production-deployment` concurrency group already used by the deploy workflow, with a FIFO `queue: max` and `cancel-in-progress: false` policy. As a result, a business-operations verification from one release cannot run at the same time as a later release's production deployment/import in the same GitHub repository.

The workflow still executes after a successful `Build and Deploy I AM` run, still exercises production finance/HR/support/call-center endpoints, still cleans its test tenant, and still **fails** on real errors. It does not suppress 500s or mark failures green. This coordination prevents one known cause of transient `D1_ERROR` but cannot rule out imports started outside this GitHub concurrency group.

Test: `node qa/scripts/magnanimous-business-operations-deploy-serialization-lock.mjs`. A fresh post-merge business-operations production run is required to verify the operational effect.
