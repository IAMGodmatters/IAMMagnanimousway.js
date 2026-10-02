// Clean-room HCTI capability research snapshot for Magnanimous AI.
// Public documentation is used only to learn observable contracts and workflows.
// No HCTI private source code, credentials, hidden prompts, internal infrastructure,
// copyrighted implementation, or trade secrets are copied.

export const MAGNANIMOUS_HCTI_RESEARCH = Object.freeze({
  researched_at: '2026-10-02',
  provider: 'HTML/CSS to Image (HCTI)',
  provider_runtime_required: false,
  provider_credentials_required_for_native_path: false,
  clean_room: true,
  public_sources: [
    'https://docs.htmlcsstoimage.com/getting-started/',
    'https://docs.htmlcsstoimage.com/getting-started/using-the-api/',
    'https://docs.htmlcsstoimage.com/getting-started/url-to-image/',
    'https://docs.htmlcsstoimage.com/getting-started/templates/',
    'https://docs.htmlcsstoimage.com/getting-started/create-and-render/',
    'https://docs.htmlcsstoimage.com/integrations/mcp/',
    'https://docs.htmlcsstoimage.com/integrations/mcp/tools/',
    'https://docs.htmlcsstoimage.com/management-api/',
    'https://docs.htmlcsstoimage.com/management-api/api-keys/',
    'https://docs.htmlcsstoimage.com/management-api/proxies/',
    'https://docs.htmlcsstoimage.com/management-api/storage-destinations/',
    'https://docs.htmlcsstoimage.com/management-api/og-configs/',
    'https://docs.htmlcsstoimage.com/management-api/iac/',
    'https://htmlcsstoimage.com/pricing'
  ]
});

export const MAGNANIMOUS_RENDERING_FAMILIES = Object.freeze([
  {
    id: 'rendering',
    capabilities: [
      'html-css-to-image','url-to-image','png-output','jpeg-output','webp-output','pdf-output',
      'viewport-width-height','device-scale','render-delay','color-scheme','screen-print-media',
      'selector-screenshot','full-page-screenshot','custom-request-headers','cookie-banner-blocking',
      'public-http-screenshot','self-contained-html-assets'
    ]
  },
  {
    id: 'image-lifecycle',
    capabilities: [
      'create-image','list-images','get-image','delete-image','batch-create','batch-delete',
      'usage-accounting','deduplication-window','format-conversion','resize-crop-transform'
    ]
  },
  {
    id: 'templates',
    capabilities: [
      'create-template','update-template','list-templates','get-template','template-versioning',
      'list-template-versions','render-template','pin-template-version','template-values'
    ]
  },
  {
    id: 'delivery',
    capabilities: [
      'signed-render-url','signed-template-url','hosted-render-url','object-storage-delivery',
      's3-compatible-storage-destination','optional-provider-storage-disable','retention-control'
    ]
  },
  {
    id: 'open-graph',
    capabilities: [
      'og-image-config','domain-image-route','page-metadata-mapping','title-description-fallbacks',
      'page-level-render-overrides','template-mapping'
    ]
  },
  {
    id: 'networking',
    capabilities: [
      'managed-safe-egress','proxy-routing','proxy-crud','proxy-disable','origin-scoped-custom-headers',
      'private-network-deny','redirect-revalidation'
    ]
  },
  {
    id: 'security-management',
    capabilities: [
      'scoped-api-keys','permissioned-image-actions','permissioned-template-actions',
      'permissioned-management-actions','key-disable-reenable','least-privilege-credentials',
      'management-rate-limits','secret-non-return'
    ]
  },
  {
    id: 'integrations',
    capabilities: [
      'rest-api','mcp-server','oauth-mcp','postman','javascript','typescript','python','ruby','php',
      'dotnet','go','java','rust','kotlin','elixir','terraform','pulumi','zapier','make','n8n'
    ]
  }
]);

export const MAGNANIMOUS_HCTI_VISIBLE_TOOLS = Object.freeze([
  'create_image','create_url_image','create_templated_image','create_batch_images',
  'list_templates','list_template_versions','check_usage','get_max_batch_size',
  'create_proxy','list_proxies','get_proxy','update_proxy','delete_proxy',
  'create_storage_destination','list_storage_destinations','get_storage_destination',
  'update_storage_destination','delete_storage_destination','get_aws_storage_external_id',
  'create_og_config','list_og_configs','get_og_config','update_og_config','delete_og_config'
]);

export const MAGNANIMOUS_RENDERING_NATIVE_MAP = Object.freeze([
  ['html-css-to-image','Magnanimous Browser /render-content','implemented'],
  ['url-to-image','Magnanimous Browser /render','implemented-safe-egress'],
  ['png-output','Chromium screenshot','implemented'],
  ['pdf-output','Chromium print-to-pdf','implemented'],
  ['jpeg-output','Magnanimous Media Transform','implemented'],
  ['webp-output','Magnanimous Media Transform','implemented'],
  ['viewport-width-height','Chromium window sizing','implemented'],
  ['device-scale','Chromium device scale factor','implemented'],
  ['render-delay','Chromium virtual-time budget','implemented'],
  ['color-scheme','local HTML emulation','implemented-html'],
  ['screen-print-media','Chromium rendering mode','partial'],
  ['selector-screenshot','Magnanimous Native Web Playwright screenshot path','mapped-local-bridge'],
  ['full-page-screenshot','Magnanimous Native Web Playwright screenshot path','mapped-local-bridge'],
  ['cookie-banner-blocking','Magnanimous Native Web browser flow','mapped-local-bridge'],
  ['custom-request-headers','Magnanimous safe-egress + Native Web authorized flows','mapped-guarded'],
  ['create-image','Magnanimous Native Rendering API','implemented'],
  ['list-images','Magnanimous Object Store + render ledger','implemented'],
  ['get-image','Magnanimous Object Store','implemented'],
  ['delete-image','Magnanimous Object Store + render ledger','implemented'],
  ['batch-create','Magnanimous Native Rendering API, max 25','implemented'],
  ['batch-delete','Magnanimous Native Rendering API','implemented'],
  ['usage-accounting','Magnanimous render ledger','implemented'],
  ['resize-crop-transform','Magnanimous Media Transform / ImageMagick','implemented'],
  ['create-template','Magnanimous render template store','implemented'],
  ['update-template','Magnanimous render template version store','implemented'],
  ['list-templates','Magnanimous render template store','implemented'],
  ['template-versioning','Magnanimous render template store','implemented'],
  ['render-template','Magnanimous Native Rendering API','implemented'],
  ['hosted-render-url','Magnanimous Object Store file route','implemented'],
  ['signed-render-url','Magnanimous authenticated/session delivery boundary','mapped'],
  ['object-storage-delivery','Magnanimous Object Store','implemented'],
  ['s3-compatible-storage-destination','Magnanimous provider-neutral object storage adapters','mapped'],
  ['og-image-config','Magnanimous template + metadata workflow','mapped'],
  ['proxy-routing','Magnanimous Browser Egress controlled proxy','implemented-single-egress'],
  ['proxy-crud','Magnanimous Cloud desired-state resource contract','mapped'],
  ['scoped-api-keys','Magnanimous OAuth/scoped connector tokens','implemented-equivalent'],
  ['management-rate-limits','Magnanimous rate limiter / policy layer','implemented-equivalent'],
  ['mcp-server','Magnanimous Universal Connector','implemented'],
  ['terraform','Magnanimous Cloud desired-state/IaC compatibility','mapped'],
  ['pulumi','Magnanimous Cloud desired-state/IaC compatibility','mapped']
].map(([capability,native_target,status])=>Object.freeze({capability,native_target,status})));

export const MAGNANIMOUS_RENDERING_POLICY = Object.freeze({
  identity: 'Magnanimous Native Rendering',
  brain: 'Magnanimous AI',
  free_first: true,
  native_first: true,
  external_hcti_required: false,
  proprietary_backend_copied: false,
  provider_accounts_are_replaceable: true,
  security: [
    'public http(s) URL targets only',
    'private/local address rejection',
    'redirect revalidation through Magnanimous egress',
    'no shell interpolation',
    'deny-by-default Chromium snapshot network policy',
    'tenant-scoped template and render metadata',
    'secret values are never returned by rendering management surfaces'
  ],
  truth_rule: 'A rendering capability is reported ready only when the current Magnanimous runtime has the required native browser/media/object-store binding or a verified authorized fallback.'
});

export function getMagnanimousRenderingCapabilitySummary() {
  const implemented = MAGNANIMOUS_RENDERING_NATIVE_MAP.filter(x=>String(x.status).startsWith('implemented')).length;
  return {
    ...MAGNANIMOUS_HCTI_RESEARCH,
    policy: MAGNANIMOUS_RENDERING_POLICY,
    families: MAGNANIMOUS_RENDERING_FAMILIES,
    visible_provider_tool_patterns: MAGNANIMOUS_HCTI_VISIBLE_TOOLS,
    native_map: MAGNANIMOUS_RENDERING_NATIVE_MAP,
    mapped_capability_count: MAGNANIMOUS_RENDERING_NATIVE_MAP.length,
    implemented_capability_count: implemented,
    note: 'Magnanimous reproduces public capability patterns through original native code and existing first-party services. Provider-specific infrastructure remains replaceable and is not misrepresented as owned.'
  };
}
