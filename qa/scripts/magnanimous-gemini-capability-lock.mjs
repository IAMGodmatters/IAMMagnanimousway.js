import assert from 'node:assert/strict';
import { getCapabilityAbsorptionManifest, getConnectorAbsorptionSummary, getCapabilityResearchRecord } from '../../worker/src/magnanimous-connector-absorption.js';
import { GEMINI_PUBLIC_RESEARCH, getGeminiCapabilityManifest, getGeminiAbsorptionSummary } from '../../worker/src/magnanimous-gemini-capability-registry.js';
import { classifyCapabilityRealization } from '../../worker/src/magnanimous-capability-realization.js';

const full=getCapabilityAbsorptionManifest();
const gemini=getGeminiCapabilityManifest();
const summary=getGeminiAbsorptionSummary();
const absorption=getConnectorAbsorptionSummary();

assert.ok(gemini.length>=30,'Gemini/Workspace public capability absorption must cover the verified research, workspace, file, tool and connected-app surface.');
for(const capability of [
  'gemini-web-deep-research','gemini-workspace-deep-research','gemini-source-scoped-research',
  'gemini-source-citation-tracking','gemini-natural-language-file-search','gemini-cross-file-synthesis',
  'gemini-file-search-rag','gemini-research-to-document','gemini-document-first-draft',
  'gemini-spreadsheet-generation','gemini-presentation-generation','gemini-multi-format-file-generation',
  'gemini-workspace-export','gemini-workspace-cross-app-context','gemini-connected-app-orchestration',
  'gemini-function-calling','gemini-remote-mcp','gemini-search-grounding','gemini-code-execution-tool',
  'gemini-tool-combination','gemini-workspace-api-interoperability','gemini-agentic-task-orchestration'
])assert.ok(gemini.some(x=>x.capability===capability),'Missing Gemini benchmark capability: '+capability);

assert.ok(GEMINI_PUBLIC_RESEARCH.sources.length>=15,'Gemini benchmark must retain a broad official-source ledger.');
assert.ok(GEMINI_PUBLIC_RESEARCH.sources.every(x=>/^https:\/\/(?:blog\.google|support\.google|ai\.google\.dev|developers\.google\.com)/.test(x)),'Gemini research ledger must use official Google domains.');
assert.match(GEMINI_PUBLIC_RESEARCH.boundary,/does not copy Google source code/i);

for(const row of gemini){
  assert.ok(row.native_target,'Every Gemini benchmark capability needs a Magnanimous native target.');
  assert.ok(row.boundary!==undefined,'Every Gemini benchmark capability needs an explicit boundary.');
  assert.ok(Array.isArray(row.magnanimous_owned)&&row.magnanimous_owned.includes('workflow-orchestration'),'Magnanimous must own Gemini-benchmarked workflow orchestration.');
  assert.equal(row.authorization_state,'not-assumed');
  assert.equal(row.research?.proprietary_implementation_copied,false);
  assert.ok(Array.isArray(row.research?.sources)&&row.research.sources.length>=15,'Each Gemini capability must retain official source provenance.');
  const realized=classifyCapabilityRealization(row);
  assert.ok(['native-ready','hybrid-ready'].includes(realized.status),row.capability+' must resolve to an existing Magnanimous execution surface.');
  const research=getCapabilityResearchRecord(row);
  assert.equal(research.connector_id,'gemini-benchmark');
  assert.ok(Array.isArray(research.sources)&&research.sources.length>=15,'Research record must preserve Gemini source URLs.');
}

assert.equal(summary.provider_required_for_identity,false);
assert.equal(summary.provider_required_for_memory,false);
assert.equal(summary.provider_required_for_planning,false);
assert.equal(summary.provider_required_for_orchestration,false);
assert.equal(summary.provider_required_for_verification,false);
assert.equal(summary.google_required_only_for_google_specific_account_data_or_services,true);
assert.equal(absorption.gemini_capability_contracts,gemini.length);
assert.equal(absorption.gemini.capability_contracts,gemini.length);
assert.ok(absorption.research_sources.some(x=>/Gemini\/Workspace/i.test(x)),'Connector absorption summary must name official Gemini/Workspace research.');
for(const row of gemini)assert.ok(full.some(x=>x.id===row.id),'Full Magnanimous brain must include '+row.id);

console.log('Magnanimous Gemini / Workspace capability lock PASS:',{
  capabilities:gemini.length,
  official_sources:GEMINI_PUBLIC_RESEARCH.sources.length,
  native_targets:summary.native_targets,
  full_brain:full.length
});
