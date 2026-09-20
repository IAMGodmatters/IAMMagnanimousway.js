import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';

import { openMagnanimousDb } from '../src/d1-compat.mjs';
import { openMagnanimousCloudControl, MAGNANIMOUS_CLOUD_CAPABILITIES } from '../src/cloud-control.mjs';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'magnanimous-cloud-control-'));
const databasePath = path.join(root, 'cloud.sqlite');
const db = openMagnanimousDb(databasePath);

try {
  const cloud = openMagnanimousCloudControl({ db, env: { MAGNANIMOUS_CLOUD_REGION: 'test-owner-1' } });

  const summary = await cloud.summary();
  assert.equal(summary.identity, 'Magnanimous Cloud');
  assert.equal(summary.brain, 'Magnanimous AI');
  assert.equal(summary.external_provider_required_for_control_plane, false);
  assert.equal(summary.physical_capacity_required_for_compute, true);
  assert.equal(summary.region, 'test-owner-1');
  assert.ok(MAGNANIMOUS_CLOUD_CAPABILITIES.length >= 15);

  const initialProjects = await cloud.listProjects();
  assert.ok(initialProjects.some(project => project.id === 'mcloud-project-core'));

  const project = await cloud.createProject({ name: 'Cloud Verification', slug: 'cloud-verification' });
  assert.equal(project.slug, 'cloud-verification');

  const nativeStorage = await cloud.createResource({
    project_id: project.id,
    kind: 'object-bucket',
    name: 'verification-objects',
    spec: { versioning: true }
  });
  assert.equal(nativeStorage.state, 'defined-native-control');
  assert.equal(nativeStorage.status.execution, 'native-control-available');

  const compute = await cloud.createResource({
    project_id: project.id,
    kind: 'compute-instance',
    name: 'verification-compute',
    spec: { cpu: 2, memory_mb: 2048, image: 'magnanimous-linux' }
  });
  assert.equal(compute.state, 'defined-awaiting-capacity');
  assert.equal(compute.status.execution, 'requires-authorized-host-capacity');
  assert.equal(compute.status.physical_capacity_bound, false);

  const start = await cloud.stageAction(compute.id, 'power-on');
  assert.equal(start.status, 'staged-awaiting-capacity-executor');
  assert.equal(start.result.executed, false);

  const destructive = await cloud.stageAction(compute.id, 'delete');
  assert.equal(destructive.status, 'staged-requires-explicit-approval');
  assert.equal(destructive.result.executed, false);

  const resources = await cloud.listResources({ project_id: project.id });
  assert.equal(resources.length, 2);
  assert.ok(resources.every(resource => resource.project_id === project.id));

  const actions = await cloud.listActions(compute.id);
  assert.equal(actions.length, 2);

  await cloud.recordUsage({ resource_id: compute.id, metric: 'control_plane_operation', quantity: 1, unit: 'operation' });

  console.log('Magnanimous Cloud Control verification PASS');
} finally {
  db.close();
  fs.rmSync(root, { recursive: true, force: true });
}
