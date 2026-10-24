import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL('../../' + path, import.meta.url), 'utf8');
const cloudInit = read('telecom-core/oci/cloud-init.yaml.tftpl');
const terraform = read('telecom-core/oci/main.tf');
const cloudShell = read('telecom-core/oci/cloud-shell-plan.sh');
const publisher = read('telecom-core/oci/publish-source.sh');
const docs = read('telecom-core/oci/CLOUD-SHELL.md');

assert(!/git, clone|git clone|https:\/\/github\.com|git@github\.com|\$\{repo_url\}|\$\{repo_ref\}/.test(cloudInit),
  'Cloud-init must not fetch source or receive any repository URL.');
assert(!/repo_url\s*=\s*var\.repo_url|repo_ref\s*=\s*var\.repo_ref/.test(terraform),
  'OCI guest metadata must not receive repository identifiers.');
assert(!/repo_url\s*=\s*"\$REPO_URL"|repo_ref\s*=\s*"\$REPO_REF"/.test(cloudShell),
  'Cloud Shell must not pass Git URLs into Terraform state or cloud-init.');
assert(cloudShell.includes('without embedded credentials'), 'Cloud Shell must refuse credentials in repository URLs.');
assert(publisher.includes('git -C "$REPO_DIR" archive --format=tar --output="$ARCHIVE" HEAD telecom-core'),
  'Only the committed Telecom subtree may be exported, without unrelated platform code, .git or local secrets.');
assert(publisher.includes('StrictHostKeyChecking=yes'), 'Source transfer must validate the destination host key.');
assert(publisher.includes('test ! -e /opt/IAMMagnanimousway.js'), 'Existing remote source must not be overwritten.');
assert(publisher.includes('PUBLIC_IP must be a valid publicly routable IPv4'), 'Publisher must reject invalid targets.');
assert(!/StrictHostKeyChecking=no|sshpass|GITHUB_TOKEN|GH_TOKEN|GITHUB_PAT|git clone/.test(publisher),
  'Publisher must not embed tokens, bypass SSH trust, or clone source on the guest.');
assert(docs.includes('publish-source.sh PUBLIC_IP'), 'Manual source delivery must be documented.');
assert(docs.includes('preflight'), 'Telecom preflight must remain in the activation instructions.');

console.log('OCI private-source delivery lock passed: committed source only, verified SSH trust, no GitHub credential leakage.');
