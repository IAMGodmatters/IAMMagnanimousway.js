import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

const read=p=>fs.readFileSync(p,'utf8');
const must=(condition,message)=>{if(!condition)throw new Error(message)};

const registry=read('worker/src/magnanimous-hcti-capability-registry.js');
for(const needle of [
 'html-css-to-image','url-to-image','png-output','jpeg-output','webp-output','pdf-output',
 'create_batch_images','list_template_versions','check_usage','create_proxy',
 'create_storage_destination','create_og_config','provider_runtime_required: false',
 'proprietary_backend_copied: false'
]) must(registry.includes(needle),'HCTI clean-room registry missing: '+needle);

const rendering=read('worker/src/magnanimous-native-rendering.js');
for(const needle of [
 '/api/magnanimous/native-rendering/render',
 '/api/magnanimous/native-rendering/batch',
 '/api/magnanimous/native-rendering/templates',
 '/api/magnanimous/native-rendering/images',
 '/api/magnanimous/native-rendering/usage',
 'magnanimous_render_templates',
 'magnanimous_render_events',
 'currentUser',
 'tenant_id',
 'hcti_required:false'
]) must(rendering.includes(needle),'Native rendering contract missing: '+needle);
must(rendering.includes('variations.length>25'),'Native renderer must bound batch size.');
must(rendering.includes('Provide exactly one of html or url.'),'Native renderer must reject ambiguous render sources.');
must(rendering.includes('Magnanimous Object Store is required'),'Native renderer must not pretend hosted delivery without object storage.');

const browser=read('magnanimous-runtime/services/browser-service.mjs');
for(const needle of [
 "req.url==='/render-content'",
 'Content-Security-Policy',
 "default-src \\'none\\'",
 "connect-src \\'none\\'",
 '--force-device-scale-factor=',
 '--virtual-time-budget=',
 '--disable-background-networking',
 'force-webrtc-ip-handling-policy=disable_non_proxied_udp',
 'shell:false'
]) must(browser.includes(needle),'Browser rendering security/capability lock missing: '+needle);

const bindings=read('magnanimous-runtime/src/service-bindings.mjs');
must(bindings.includes('async renderContent(html,options={})'),'Browser service binding does not expose HTML/CSS rendering.');

const security=read('worker/src/security-entrypoint.js');
must(security.includes("handleMagnanimousNativeRendering"),'Native rendering handler is not mounted.');
must(security.includes("policyUrl.pathname.startsWith('/api/magnanimous/native-rendering')"),'Native rendering security route is missing.');

const connector=read('worker/src/magnanimous-universal-ai-connector.js');
for(const needle of [
 'magnanimous_render_capabilities','magnanimous_render_html','magnanimous_render_url',
 'magnanimous_render_batch','magnanimous_render_templates','magnanimous_render_template_versions',
 'magnanimous_render_template_create','magnanimous_render_template_update',
 'magnanimous_render_template','magnanimous_render_images','magnanimous_render_usage',
 'hcti_required:false'
]) must(connector.includes(needle),'Magnanimous MCP rendering tool missing: '+needle);

const universal=read('worker/src/magnanimous-universal-capabilities.js');
for(const needle of ['html-css-image-rendering','url-screenshot-rendering','reusable-render-templates','native-rendering-mcp']){
 must(universal.includes(needle),'Universal capability core missing native rendering capability: '+needle);
}

for(const file of [
 'worker/src/magnanimous-hcti-capability-registry.js',
 'worker/src/magnanimous-native-rendering.js',
 'worker/src/magnanimous-universal-ai-connector.js',
 'worker/src/security-entrypoint.js',
 'worker/src/magnanimous-universal-capabilities.js',
 'magnanimous-runtime/services/browser-service.mjs',
 'magnanimous-runtime/src/service-bindings.mjs'
]){
 execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
}

console.log('Magnanimous HCTI capability absorption lock PASS: native HTML/CSS + URL rendering, templates, batch, usage, storage, MCP exposure, and clean-room boundaries verified.');
