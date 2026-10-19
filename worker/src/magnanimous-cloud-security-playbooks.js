// Magnanimous-owned evidence-first cloud security investigation playbooks.
// Clean-room workflow design inspired by public security practices; no vendor SDK,
// live cloud telemetry or privileged execution is automatically provided.
const DEFINITIONS=[
 [
  "cloud-account-health",
  "Cloud account health assessment",
  "cloud account health|cloud posture baseline|security hygiene",
  "authorized account inventory, service health and security findings",
  "Account inventory with verified coverage and prioritized deviations"
 ],
 [
  "cloud-admin-access-review",
  "Cloud administrator access grouping",
  "administrator access grouping|cloud administrator access|admin permissions audit",
  "role bindings, privileged group memberships and MFA evidence",
  "Least-privilege role map and concrete approval-gated access improvements"
 ],
 [
  "cloud-alert-triage",
  "Cloud threat alert triage",
  "cloud alert triage|triage security alerts|prioritize cloud incidents",
  "alerts, severity, rule context, asset owners and timestamps",
  "Deduplicated, evidence-ranked alert list"
 ],
 [
  "cloud-asset-profile",
  "Cloud asset ownership and exposure profile",
  "cloud asset profile|cloud asset inventory|cloud resource owner",
  "asset metadata, cloud resources, owners, runtime configuration",
  "Asset profile with confidence and source freshness"
 ],
 [
  "cloud-cost-review",
  "Cloud expense anomalies and optimization",
  "cloud cost optimizer|cloud cost review|cloud budget leak",
  "itemized provider charges, usage baselines and price units",
  "Owner-approved low-risk savings opportunities, with no blind shutdown"
 ],
 [
  "cloud-compliance-gap",
  "Cloud compliance gap assessment",
  "cloud compliance gap|cloud framework readiness|compliance evidence",
  "control requirements, configuration evidence and organization scope",
  "Explicitly sourced pass/gap/unknown matrix"
 ],
 [
  "cloud-config-origin",
  "Cloud configuration change attribution",
  "cloud configuration origin|who changed cloud configuration|infrastructure config provenance",
  "configuration history, deployment event records and commit IDs",
  "Change timeline with attributable source when evidence exists"
 ],
 [
  "cloud-control-framework",
  "Custom cloud control framework comparison",
  "cloud custom framework|custom control framework|cloud framework mapping",
  "user-defined control framework, evidence and revision dates",
  "Control-to-evidence matrix without fabricated compliance assertions"
 ],
 [
  "cloud-cve-impact",
  "Cloud CVE blast-radius evaluation",
  "cve blast radius|affected cloud vulnerabilities|vulnerable package exposure",
  "dependency inventories, affected versions, advisories and reachable asset data",
  "Affected-assets assessment with explicit unverified conditions"
 ],
 [
  "cloud-data-exposure",
  "Cloud sensitive data exposure investigation",
  "cloud data exposure|public cloud bucket exposure|leaked customer data",
  "storage permissions, data classification and exposure paths",
  "Exposure map and reversible remediation proposal"
 ],
 [
  "cloud-exposure-map",
  "Cloud internet exposure path mapping",
  "cloud exposure map|cloud attack paths|internet reachable cloud services",
  "network routes, external endpoints, ingress permissions and identity boundaries",
  "Connectivity-backed exposure narrative with missing edges marked unknown"
 ],
 [
  "cloud-identity-audit",
  "Cloud identity review",
  "cloud identity review|overprivileged cloud identities|cloud access audit",
  "principal inventory, effective permissions, sign-in and token metadata",
  "Least-privilege and stale-access recommendations"
 ],
 [
  "cloud-impact-study",
  "Cloud security remediation impact analysis",
  "cloud impact analysis|cloud remediation blast radius|cloud change consequences",
  "dependency graph, service ownership, usage and rollback evidence",
  "Change impact/rollback plan with explicit customer-impact checks"
 ],
 [
  "cloud-inactive-access",
  "Inactive identity cleanup planning",
  "inactive identities cleanup|cloud dormant accounts|stale service accounts",
  "last-seen sign-ins, business ownership, API usage and exception policy",
  "Candidate-only cleanup report; no automatic account deletion"
 ],
 [
  "cloud-investigation",
  "Cloud security investigation orchestration",
  "investigate cloud security|cloud incident investigation|investigate suspicious access",
  "time-scoped event records, alert chains and trusted asset inventory",
  "Evidence-backed incident timeline and next investigative actions"
 ],
 [
  "cloud-kubernetes-connector",
  "Kubernetes connector troubleshooting",
  "kubernetes connector troubleshoot|k8s security connector|kubernetes telemetry setup",
  "authorized cluster version, service account permissions, connectivity and error messages",
  "Least-privileged connection troubleshooting guide"
 ],
 [
  "cloud-mfa-coverage",
  "Cloud MFA enforcement assessment",
  "cloud mfa enforcement|cloud accounts without mfa|mfa coverage audit",
  "identity policy and enrollment reports, break-glass exemptions",
  "Coverage gaps and staged MFA policy rollout; never lock out owner"
 ],
 [
  "cloud-daily-security-brief",
  "Cloud morning security briefing",
  "cloud morning briefing|daily security briefing|cloud security recap",
  "current alerts, changes, exposure and source freshness",
  "Concise verified change summary with action owners"
 ],
 [
  "cloud-access-rightsizing",
  "Cloud identity rightsizing review",
  "overprivileged identities rightsizing|rightsizing cloud access|cloud privilege reduction",
  "effective permissions, observed usage, delegated roles and service dependencies",
  "Proposed narrower role scopes and rollback plan; requires separate change approval"
 ],
 [
  "cloud-supply-chain-risk",
  "Cloud software supply chain exposure review",
  "cloud supply chain exposure|dependency security chain|third party cloud vulnerabilities",
  "dependencies, build provenance, SBOM, verified advisories and deploy manifests",
  "Vulnerable source-to-deployment links with verified package versions"
 ]
];
export const MAGNANIMOUS_CLOUD_SECURITY_PLAYBOOKS=Object.freeze(DEFINITIONS.map(([name,title,triggers,evidence,outcome])=>Object.freeze({
 name,
 description:`Assess ${title.toLowerCase()} using authorized read-only sources and report evidence, gaps and next actions. Use when the user asks about ${triggers.replaceAll('|',', ')}.`,
 triggers:triggers.split('|'),
 metadata:{owner:'Magnanimous AI',risk:'read-only-investigation',capability_requirements:`authorized evidence sources: ${evidence}; no external cloud security subscription implied`},
 instructions:`# ${title}

1. Confirm the operator's authorization, tenant and exact time window before accessing cloud or repository data.
2. Locate read-only evidence sources for: ${evidence}. Distinguish connected sources from unavailable ones.
3. Validate actual observations, event timestamps, effective permissions and provider identity where relevant. Do not invent missing findings.
4. Produce: ${outcome}. Label every unsupported claim unknown instead of asserting a clean bill of health.
5. Keep all tokens and personally sensitive records inside existing Magnanimous access boundaries; only provide the minimum necessary information.
6. For any removal, role change, payment, destructive or regulated action, use separate existing owner approval and change-management controls; never treat this skill as authorization.
7. Verify outcomes using fresh evidence if an authorized action is executed; otherwise report recommendations only.`
})));
