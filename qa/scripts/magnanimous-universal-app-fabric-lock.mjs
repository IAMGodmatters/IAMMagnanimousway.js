import fs from 'node:fs';
import assert from 'node:assert/strict';

const root=fs.existsSync('worker/src/magnanimous-universal-app-fabric.js')?'.':'..';
const read=path=>fs.readFileSync(`${root}/${path}`,'utf8');
const fabric=read('worker/src/magnanimous-universal-app-fabric.js');
const mesh=read('worker/src/magnanimous-capability-mesh.js');
const social=read('worker/src/social-publishing-runtime.js');
const connections=read('frontend/app/connections/page.tsx');
const liveSnapshot=read('worker/src/magnanimous-live-plugin-tool-research-snapshot.js');

function has(source,needle,message){assert(source.includes(needle),message)}

has(fabric,'getCapabilityAbsorptionManifest','Universal App Fabric must consume the full Magnanimous absorption manifest');
has(fabric,"plugin_visibility_is_authorization:false",'Plugin visibility must never be treated as account authorization');
has(fabric,"FROM integrations WHERE tenant_id=?",'Fabric must include real general connected-account records');
has(fabric,"FROM social_connections WHERE tenant_id=?",'Fabric must include real first-party social connection records');
has(fabric,"proprietary_copying:false",'Fabric must preserve the no-proprietary-copying rule');
has(fabric,"authorization_inferred_from_plugin_visibility:false",'LinkedIn authorization must not be inferred from plugin visibility');

for(const route of [
 "'apps.summary'","'apps.catalog'","'apps.resolve'","'connections.summary'","'social.connections'",
 "'social.linkedin.publish'","'social.tiktok.publish'","'social.youtube.publish'"
])has(mesh,route,`Capability Mesh missing ${route}`);

has(mesh,"if(input.confirm!==true)",'External social publishing through the mesh must require explicit confirmation');
has(mesh,'handleSocialPublishing','Capability Mesh must reuse the existing first-party social publishing runtime instead of duplicating provider internals');

has(social,"linkedin:{name:'LinkedIn'",'Existing first-party LinkedIn provider contract must remain present');
has(social,"https://api.linkedin.com/rest/posts",'Existing direct LinkedIn member publishing endpoint must remain present');
has(social,"body.explicit_consent!==true",'Existing LinkedIn explicit-consent gate must remain present');
has(social,"social_connections",'Social publishing connection truth must remain tenant scoped');
has(connections,'href="/social-connect"','Main Connections surface must expose first-party social publishing connections');

assert(!fabric.includes('access_token TEXT'),'Universal App Fabric must not create or expose its own token store');
for(const namespace of ['Acumen_by_Talarion','Hercules','Tavily'])has(liveSnapshot,`\"namespace\": \"${namespace}\"`,`Current visible plugin namespace must be absorbed: ${namespace}`);

assert(!fabric.includes('client_secret'),'Universal App Fabric must not copy provider credentials into capability metadata');

console.log('Magnanimous Universal App Fabric lock passed.');
