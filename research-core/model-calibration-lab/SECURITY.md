# Security and operational boundary

This package is an offline evaluation utility. It accepts assessment objects and returns a deterministic report.

It does not:
- invoke a model, network, provider, GPU, or paid API;
- read customer data, credentials, environment variables, or model files;
- modify model weights or production routing;
- authorize a candidate for production deployment.

Treat model outputs and assessor evidence as untrusted data. Do not put secrets, credentials, or identifiable customer information in assessment evidence. Use approved synthetic or minimized test cases.

A candidate that fails a safety or critical-quality gate must not be promoted. Passing these checks only permits a separate review; it never overrides Magnanimous policy, security controls, tenant boundaries, or human approval.
