# Deployment hotfix

The enterprise contact-center/BPO release applied migrations 0030 and 0031 successfully, but the first Worker bundle was rejected by Wrangler because two local-hour helper expressions had one extra closing parenthesis. No production Worker code from that failed bundle was activated. The hotfix removes the extra parenthesis and re-runs the full validation/deployment pipeline.
