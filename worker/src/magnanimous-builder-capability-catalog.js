// First-party Magnanimous Builder capability catalog.
// These are provider-neutral operation contracts owned by Magnanimous AI.
// External services may satisfy a contract when required, but no provider owns the identity,
// memory, planning, policy, routing, verification, learning, or contract definition.

export const MAGNANIMOUS_BUILDER_TOOL_CONTRACTS=Object.freeze([
 {tool:'search',purpose:'Search Magnanimous projects, workspaces, code, or indexed engineering records.'},
 {tool:'fetch',purpose:'Fetch a known project, artifact, file, or engineering record by identifier.'},
 {tool:'list_projects',purpose:'List Magnanimous projects and their current state.'},
 {tool:'list_resources',purpose:'Inspect configured resources, bindings, credentials metadata, and available service classes without exposing secret values.'},
 {tool:'list_files',purpose:'List a project file tree, metadata, dependencies, and build settings.'},
 {tool:'read_file',purpose:'Read one project file with optional references and bounded ranges.'},
 {tool:'read_files',purpose:'Read multiple project files in one bounded operation.'},
 {tool:'search_code',purpose:'Search project source using string or regular-expression matching.'},
 {tool:'get_guides',purpose:'Retrieve Magnanimous engineering guidance and reusable technique references.'},
 {tool:'get_guide',purpose:'Retrieve one Magnanimous engineering guidance topic.'},
 {tool:'write_file',purpose:'Create or replace a reviewed project file.'},
 {tool:'edit_file',purpose:'Apply a targeted text edit to an existing project file.'},
 {tool:'delete_file',purpose:'Delete a project file through the existing destructive-action gate.'},
 {tool:'remove_dependency',purpose:'Remove a project dependency after impact review.'},
 {tool:'create_project',purpose:'Create a new Magnanimous project workspace with first-party conventions.'},
 {tool:'apply_patch',purpose:'Apply a multi-file atomic patch to a project workspace.'},
 {tool:'get_logs',purpose:'Inspect runtime, browser, build, or deployment logs before diagnosing failures.'},
 {tool:'typecheck',purpose:'Run project type checks and return exact diagnostics.'},
 {tool:'run_tests',purpose:'Run the project test suite and return exact pass/fail evidence.'},
 {tool:'add_dependency',purpose:'Add a reviewed dependency compatible with the project runtime.'},
 {tool:'run_code_in_vm',purpose:'Execute bounded engineering code in an isolated server-side sandbox.'},
 {tool:'run_code_in_browser',purpose:'Execute bounded diagnostic code against an authorized live preview/browser surface.'},
 {tool:'navigate_preview',purpose:'Navigate an authorized application preview to a requested route or state.'},
 {tool:'screenshot_preview',purpose:'Capture an authorized preview screenshot for visual verification.'},
 {tool:'get_current_context',purpose:'Read the current authorized editor or project context when needed for an ambiguous task.'},
 {tool:'view_annotation',purpose:'Inspect a user-provided visual annotation attached to the current project context.'},
 {tool:'get_job_status',purpose:'Read the state of a long-running build, test, generation, or deployment job.'},
 {tool:'rename_file',purpose:'Rename project files while preserving or updating references.'},
 {tool:'copy_file',purpose:'Copy project files to new names or locations within the same workspace.'},
 {tool:'query_database',purpose:'Run read-only database queries for authorized project data inspection.'},
 {tool:'execute_sql',purpose:'Run reviewed database mutations or migrations through the database-mutation gate.'},
 {tool:'pull_database_schema',purpose:'Introspect an authorized database and refresh typed schema metadata.'},
 {tool:'create_checkpoint',purpose:'Create a named restore point after a coherent verified unit of work.'},
 {tool:'update_project_metadata',purpose:'Update project metadata and runtime configuration through reviewed settings.'},
 {tool:'generate_image',purpose:'Generate project-specific visual assets through an authorized creative engine.'},
 {tool:'upload_asset',purpose:'Upload an owned or authorized project asset into managed storage.'},
 {tool:'request_user_upload',purpose:'Request a user-provided file when local bytes are required and unavailable to the runtime.'},
 {tool:'provision_resource',purpose:'Provision an authorized managed backend resource through the existing resource gate.'},
 {tool:'request_external_resource',purpose:'Request an external credential or service connection through a secure connection flow.'},
 {tool:'get_publish_status',purpose:'Inspect deployment and publication state without mutating it.'},
 {tool:'publish_app',purpose:'Publish a verified application through the existing deployment gate.'},
 {tool:'unpublish_app',purpose:'Take a published application offline through the destructive-action gate.'},
 {tool:'cancel_request',purpose:'Cancel a still-pending external or resource request when cancellation is supported.'},
 {tool:'get_preview_url',purpose:'Return an authorized live preview URL for verification and review.'}
]);

export const MAGNANIMOUS_BUILDER_CAPABILITY_FAMILIES=Object.freeze([
 {id:'project-discovery',tools:['search','fetch','list_projects','list_files','search_code','read_file','read_files'],magnanimous_target:'engineering-operator'},
 {id:'code-authoring',tools:['write_file','edit_file','apply_patch','rename_file','copy_file','delete_file','add_dependency','remove_dependency'],magnanimous_target:'engineering-operator'},
 {id:'quality-verification',tools:['typecheck','run_tests','get_logs','run_code_in_vm','run_code_in_browser','get_job_status'],magnanimous_target:'engineering-operator'},
 {id:'preview-and-ui-observation',tools:['get_preview_url','navigate_preview','screenshot_preview','get_current_context','view_annotation'],magnanimous_target:'product-design-agent'},
 {id:'database-and-schema',tools:['query_database','execute_sql','pull_database_schema'],magnanimous_target:'data-platform'},
 {id:'resources-and-auth',tools:['list_resources','provision_resource','request_external_resource'],magnanimous_target:'universal-tool-gateway'},
 {id:'assets-and-media',tools:['generate_image','upload_asset','request_user_upload'],magnanimous_target:'creative-studio'},
 {id:'project-lifecycle',tools:['create_project','create_checkpoint','update_project_metadata'],magnanimous_target:'tool-deployment'},
 {id:'production-publishing',tools:['get_publish_status','publish_app','unpublish_app','cancel_request'],magnanimous_target:'deployment-operator'},
 {id:'platform-knowledge',tools:['get_guides','get_guide'],magnanimous_target:'knowledge-workspace'}
]);

const SAFE_AUTO=new Set(['search','fetch','list_projects','list_resources','list_files','read_file','read_files','search_code','get_guides','get_guide','get_logs','typecheck','run_tests','navigate_preview','screenshot_preview','get_current_context','view_annotation','get_job_status','query_database','pull_database_schema','get_publish_status','get_preview_url']);
const DESTRUCTIVE=new Set(['delete_file','remove_dependency','unpublish_app','cancel_request']);
const PUBLISH=new Set(['publish_app']);
const RESOURCE=new Set(['provision_resource','request_external_resource','request_user_upload']);
const CODE_EXEC=new Set(['run_code_in_vm','run_code_in_browser']);
const DB_WRITE=new Set(['execute_sql']);

export function getMagnanimousBuilderCapabilityFamily(tool=''){
 const name=String(tool||'');
 return MAGNANIMOUS_BUILDER_CAPABILITY_FAMILIES.find(x=>x.tools.includes(name))||{id:'platform-capability',tools:[name],magnanimous_target:'universal-tool-gateway'};
}
export function getMagnanimousBuilderNativeTarget(tool=''){
 return getMagnanimousBuilderCapabilityFamily(tool).magnanimous_target;
}
export function getMagnanimousBuilderToolPolicy(tool=''){
 const name=String(tool||''),family=getMagnanimousBuilderCapabilityFamily(name);
 let action_class='project-write',auto_initiate=false,requires_confirmation=false;
 if(SAFE_AUTO.has(name)){action_class='read-inspect-verify';auto_initiate=true}
 else if(DESTRUCTIVE.has(name)){action_class='destructive';requires_confirmation=true}
 else if(PUBLISH.has(name)){action_class='publish-deploy';requires_confirmation=true}
 else if(RESOURCE.has(name)){action_class='resource-or-credential';requires_confirmation=true}
 else if(CODE_EXEC.has(name)){action_class='sandbox-code-execution';requires_confirmation=true}
 else if(DB_WRITE.has(name)){action_class='database-mutation';requires_confirmation=true}
 return{tool:name,family:family.id,native_target:family.magnanimous_target,suggestive:true,auto_initiate,requires_confirmation,action_class};
}

export const MAGNANIMOUS_BUILDER_POLICY=Object.freeze({
 identity_owner:'Magnanimous AI',
 memory_owner:'Magnanimous AI',
 planner_owner:'Magnanimous AI',
 policy_owner:'Magnanimous AI',
 verification_owner:'Magnanimous AI',
 learning_owner:'Magnanimous AI',
 mode:'first-party-provider-neutral-builder-contracts',
 external_execution:'replaceable-only-when-reality-requires-it',
 proprietary_copying:false
});

export function getMagnanimousBuilderSummary(){
 return{
  captured_at:'2026-09-20',
  builder_tools:MAGNANIMOUS_BUILDER_TOOL_CONTRACTS.length,
  capability_families:MAGNANIMOUS_BUILDER_CAPABILITY_FAMILIES.length,
  proprietary_implementation_copied:false,
  runtime_dependency:'magnanimous-first-party'
 };
}
