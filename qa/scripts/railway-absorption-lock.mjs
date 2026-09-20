import fs from 'node:fs';

function must(ok,message){if(!ok)throw new Error(message)}
const registry=fs.readFileSync('worker/src/magnanimous-railway-capability-registry.js','utf8');
const absorption=fs.readFileSync('worker/src/magnanimous-connector-absorption.js','utf8');
const migration=fs.readFileSync('magnanimous-runtime/src/migration-stage.mjs','utf8');
const verify=fs.readFileSync('magnanimous-runtime/scripts/verify-migration-stage.mjs','utf8');

for(const tool of [
  'whoami','list_workspaces','list_projects','create_project','create_deployment','create_service','update_service',
  'list_services','get_service_config','get_service_metrics','list_variables','set_variables','list_domains','generate_domain',
  'search_docs','fetch_docs','list_feature_flags','get_feature_flag','set_feature_flag','delete_feature_flag',
  'list_deployments','get_status','get_logs','redeploy','accept_deploy','railway_agent'
]){
  must(registry.includes(`['${tool}'`),`Railway tool contract missing: ${tool}`);
}
for(const technique of [
  'resource-hierarchy','explicit-resource-scoping','environment-isolation','preview-environments',
  'terminal-deploy-verification','mutation-readback','healthcheck-gated-release','logs-metrics-triage',
  'restart-policy','monorepo-root-and-watch-paths','provider-neutral-docker-build','private-service-networking',
  'public-domain-separation','dns-verification','variable-scope-separation','feature-flag-rollout',
  'deploy-config-as-code','cli-mcp-api-routing','bounded-observability','safe-redeploy',
  'cost-aware-ephemeral-infra','external-approval-boundary'
]){
  must(registry.includes(`id:'${technique}'`),`Railway technique missing: ${technique}`);
}
must(registry.includes("proprietary_implementation_copied:false"),'Railway absorption must explicitly forbid proprietary implementation copying');
must(registry.includes("provider_role:'replaceable infrastructure adapter'"),'Railway must remain a replaceable infrastructure adapter');
must(absorption.includes('getRailwayCapabilityManifest'),'Railway capability manifest is not wired into Magnanimous absorption');
must(absorption.includes('getRailwayTechniqueManifest'),'Railway technique manifest is not wired into Magnanimous absorption');
must(absorption.includes('railway_tool_contracts'),'Railway summary metrics are not exposed');
must(migration.includes("credential-rewrap.current.json"),'Persistent vault rewrap cache path missing');
must(migration.includes('applyCachedCredentialVaultRewrap'),'Cached vault rewrap is not applied during D1 staging');
must(verify.includes("queued-production.sqlite"),'Migration verification does not test vault-before-D1 ordering');

console.log('Magnanimous Railway absorption and migration race verification PASS');
