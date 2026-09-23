// Observable plugin capability delta captured 2026-09-23.
// Provider-neutral benchmark only: no proprietary code, hidden prompts, credentials,
// private data, model weights, or authorization state is copied or inferred.
export const LATEST_PLUGIN_CAPABILITY_DELTA=Object.freeze([
  {
    "namespace": "Acumen_by_Talarion",
    "tool": "search",
    "purpose": "Verified, dated, sourced recent-world fact retrieval."
  },
  {
    "namespace": "Acumen_by_Talarion",
    "tool": "feedback",
    "purpose": "Research-result feedback capture."
  },
  {
    "namespace": "3Min_API",
    "tool": "worker_list",
    "purpose": "Discover registered workers."
  },
  {
    "namespace": "3Min_API",
    "tool": "task_create",
    "purpose": "Hand a job to a registered worker."
  },
  {
    "namespace": "3Min_API",
    "tool": "task_list",
    "purpose": "List running and completed tasks."
  },
  {
    "namespace": "3Min_API",
    "tool": "task_get",
    "purpose": "Read a task status or outcome."
  },
  {
    "namespace": "3Min_API",
    "tool": "task_cancel",
    "purpose": "Cancel unfinished tasks."
  },
  {
    "namespace": "3Min_API",
    "tool": "help",
    "purpose": "Guided API onboarding and service help."
  },
  {
    "namespace": "3Min_API",
    "tool": "endpoints",
    "purpose": "Create and manage JSON HTTP endpoints."
  },
  {
    "namespace": "3Min_API",
    "tool": "api_call",
    "purpose": "Write to and read from managed endpoints."
  },
  {
    "namespace": "3Min_API",
    "tool": "logs",
    "purpose": "Inspect received and failed records."
  },
  {
    "namespace": "3Min_API",
    "tool": "stats",
    "purpose": "Inspect API usage and response statistics."
  },
  {
    "namespace": "3Min_API",
    "tool": "collaborators",
    "purpose": "Manage collaborator access and API keys."
  },
  {
    "namespace": "3Min_API",
    "tool": "subscription",
    "purpose": "Inspect plan and usage information."
  },
  {
    "namespace": "3Min_API",
    "tool": "wordpress_plugin",
    "purpose": "Generate WordPress data-collection integration guidance."
  },
  {
    "namespace": "API_Documentation_Checker",
    "tool": "extract_api_contract",
    "purpose": "Extract explicit API contracts from supplied materials."
  },
  {
    "namespace": "API_Documentation_Checker",
    "tool": "check_api_documentation_coverage",
    "purpose": "Compare documentation coverage against an explicit API contract."
  },
  {
    "namespace": "API_Documentation_Checker",
    "tool": "compare_api_contract_versions",
    "purpose": "Compare two explicit API contract versions."
  },
  {
    "namespace": "API_Impact_Mapper",
    "tool": "extract_api_changes",
    "purpose": "Extract explicit API changes from supplied evidence."
  },
  {
    "namespace": "API_Impact_Mapper",
    "tool": "classify_breaking_changes",
    "purpose": "Classify explicit API changes against breaking-change categories."
  },
  {
    "namespace": "API_Impact_Mapper",
    "tool": "generate_impact_map",
    "purpose": "Map API changes to supplied consumers, tests, and documentation evidence."
  },
  {
    "namespace": "Sugra_API",
    "tool": "sugra_entity_screen",
    "purpose": "Screen a person or organization against a sanctions corpus."
  },
  {
    "namespace": "Sugra_API",
    "tool": "sugra_entity_lookup",
    "purpose": "Resolve an entity identifier to a KYB envelope."
  },
  {
    "namespace": "Sugra_API",
    "tool": "search_endpoints",
    "purpose": "Search a structured data endpoint catalog."
  },
  {
    "namespace": "Sugra_API",
    "tool": "describe_endpoint",
    "purpose": "Describe a catalog endpoint."
  },
  {
    "namespace": "Sugra_API",
    "tool": "call_endpoint",
    "purpose": "Call a selected structured-data endpoint."
  },
  {
    "namespace": "Sugra_API",
    "tool": "list_toolsets",
    "purpose": "List catalog capability groups."
  },
  {
    "namespace": "Sugra_API",
    "tool": "fetch_data",
    "purpose": "Select and call a suitable structured-data endpoint."
  },
  {
    "namespace": "Sugra_API",
    "tool": "list_sources",
    "purpose": "List catalog source families."
  },
  {
    "namespace": "Sugra_API",
    "tool": "resolve_entity",
    "purpose": "Resolve free text to a canonical market or macro entity."
  },
  {
    "namespace": "Sugra_API",
    "tool": "get_snapshot",
    "purpose": "Get a composed current entity view."
  },
  {
    "namespace": "Sugra_API",
    "tool": "get_timeseries",
    "purpose": "Get a bounded entity timeseries."
  }
]);

export function getLatestPluginCapabilityDeltaSummary(){
 return {captured_at:'2026-09-23',namespaces:new Set(LATEST_PLUGIN_CAPABILITY_DELTA.map(x=>x.namespace)).size,tool_contracts:LATEST_PLUGIN_CAPABILITY_DELTA.length,authorization_state:'not-assumed',proprietary_copying:false};
}
