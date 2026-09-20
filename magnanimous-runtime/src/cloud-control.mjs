import os from 'node:os';
import crypto from 'node:crypto';

export const MAGNANIMOUS_CLOUD_RESOURCE_KINDS = Object.freeze({
  project: { family: 'management', capacity: 'control-plane', native: true },
  'compute-instance': { family: 'compute', capacity: 'host-capacity', native: false },
  'container-service': { family: 'compute', capacity: 'host-capacity', native: false },
  'kubernetes-cluster': { family: 'containers', capacity: 'host-capacity', native: false },
  app: { family: 'paas', capacity: 'host-capacity', native: false },
  worker: { family: 'paas', capacity: 'host-capacity', native: false },
  job: { family: 'paas', capacity: 'host-capacity', native: false },
  function: { family: 'serverless', capacity: 'host-capacity', native: false },
  database: { family: 'data', capacity: 'native-runtime', native: true },
  'object-bucket': { family: 'storage', capacity: 'native-runtime', native: true },
  'block-volume': { family: 'storage', capacity: 'host-capacity', native: false },
  'file-share': { family: 'storage', capacity: 'host-capacity', native: false },
  image: { family: 'images', capacity: 'control-plane', native: true },
  snapshot: { family: 'images', capacity: 'host-capacity', native: false },
  'backup-policy': { family: 'images', capacity: 'control-plane', native: true },
  'private-network': { family: 'networking', capacity: 'control-plane', native: true },
  firewall: { family: 'networking', capacity: 'control-plane', native: true },
  'load-balancer': { family: 'networking', capacity: 'host-capacity', native: false },
  'public-ip': { family: 'networking', capacity: 'external-public-network', native: false },
  'dns-zone': { family: 'networking', capacity: 'control-plane', native: true },
  'ssh-key': { family: 'security', capacity: 'control-plane', native: true },
  alert: { family: 'management', capacity: 'control-plane', native: true }
});

export const MAGNANIMOUS_CLOUD_CAPABILITIES = Object.freeze([
  { id: 'projects', family: 'management', contract: 'group resources, ownership, tags and lifecycle state', status: 'implemented-control-plane' },
  { id: 'regions-and-sizes', family: 'compute', contract: 'provider-neutral placement and capacity profiles', status: 'implemented-control-plane' },
  { id: 'compute-instances', family: 'compute', contract: 'instance desired-state, image, size, network and lifecycle actions', status: 'implemented-control-plane-requires-host-capacity' },
  { id: 'app-platform', family: 'paas', contract: 'service, worker, job and static/app release definitions', status: 'implemented-control-plane-requires-host-capacity' },
  { id: 'functions', family: 'serverless', contract: 'event/schedule-triggered function deployment definitions', status: 'implemented-control-plane-requires-host-capacity' },
  { id: 'kubernetes', family: 'containers', contract: 'cluster/node-pool desired state using standard Kubernetes contracts', status: 'implemented-control-plane-requires-host-capacity' },
  { id: 'managed-databases', family: 'data', contract: 'database service definitions backed by native SQL today and replaceable engines later', status: 'native-sql-available' },
  { id: 'object-storage', family: 'storage', contract: 'Magnanimous object buckets/prefixes over first-party object storage', status: 'native-runtime-available' },
  { id: 'block-and-file-storage', family: 'storage', contract: 'persistent volume/share desired state with attach/detach lifecycle', status: 'implemented-control-plane-requires-host-capacity' },
  { id: 'images-snapshots-backups', family: 'images', contract: 'image catalog, snapshot records, backup schedules and restore lineage', status: 'implemented-control-plane' },
  { id: 'private-networking', family: 'networking', contract: 'VPC-style private networks and resource membership', status: 'implemented-control-plane' },
  { id: 'firewalls', family: 'networking', contract: 'allow/deny ingress and egress policy definitions', status: 'implemented-control-plane' },
  { id: 'load-balancing', family: 'networking', contract: 'health-checked upstream groups and routing policy', status: 'implemented-control-plane-requires-host-capacity' },
  { id: 'dns', family: 'networking', contract: 'authoritative DNS desired state through Magnanimous DNS profile', status: 'native-software-available-public-authority-external' },
  { id: 'ssh-keys', family: 'security', contract: 'SSH public-key catalog and fingerprints', status: 'implemented-control-plane' },
  { id: 'monitoring-alerts', family: 'management', contract: 'metrics, health checks, alert rules and action audit ledger', status: 'native-metrics-plus-control-plane' },
  { id: 'usage-ledger', family: 'management', contract: 'resource/action usage ledger without pretending to be a payment settlement rail', status: 'implemented-control-plane' }
]);

const now = () => Date.now();
const clean = (value, max = 160) => String(value ?? '').trim().slice(0, max);
const parseJson = (value, fallback = {}) => {
  try { return value ? JSON.parse(value) : fallback; } catch { return fallback; }
};

export class MagnanimousCloudControl {
  constructor({ db, objectStore = null, env = process.env } = {}) {
    if (!db) throw new Error('Magnanimous Cloud requires the Magnanimous SQL binding.');
    this.db = db;
    this.objectStore = objectStore;
    this.env = env;
    this.ready = this.#init();
  }

  async #init() {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS magnanimous_cloud_projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT NOT NULL DEFAULT '',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS magnanimous_cloud_resources (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        kind TEXT NOT NULL,
        name TEXT NOT NULL,
        region TEXT NOT NULL,
        state TEXT NOT NULL,
        desired_state TEXT NOT NULL,
        capacity_class TEXT NOT NULL,
        spec_json TEXT NOT NULL,
        status_json TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS magnanimous_cloud_resources_project_kind
        ON magnanimous_cloud_resources(project_id, kind, updated_at DESC);
      CREATE TABLE IF NOT EXISTS magnanimous_cloud_actions (
        id TEXT PRIMARY KEY,
        resource_id TEXT NOT NULL,
        action TEXT NOT NULL,
        status TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        result_json TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS magnanimous_cloud_actions_resource
        ON magnanimous_cloud_actions(resource_id, created_at DESC);
      CREATE TABLE IF NOT EXISTS magnanimous_cloud_usage (
        id TEXT PRIMARY KEY,
        resource_id TEXT,
        metric TEXT NOT NULL,
        quantity REAL NOT NULL,
        unit TEXT NOT NULL,
        recorded_at INTEGER NOT NULL,
        metadata_json TEXT NOT NULL
      );
    `);

    const defaultProject = await this.db.prepare(
      'SELECT id FROM magnanimous_cloud_projects WHERE slug=? LIMIT 1'
    ).bind('magnanimous-core').first();

    if (!defaultProject?.id) {
      const stamp = now();
      await this.db.prepare(
        'INSERT INTO magnanimous_cloud_projects(id,name,slug,description,created_at,updated_at) VALUES(?,?,?,?,?,?)'
      ).bind(
        'mcloud-project-core',
        'Magnanimous Core',
        'magnanimous-core',
        'First-party Magnanimous infrastructure resources.',
        stamp,
        stamp
      ).run();
    }
  }

  hostCapacity() {
    return {
      mode: 'current-standalone-host',
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      cpu_cores: os.cpus().length,
      total_memory_bytes: os.totalmem(),
      free_memory_bytes: os.freemem(),
      public_ip_owned_or_allocated: false,
      note: 'This reports only the machine running Magnanimous. Public IP space, upstream transit and datacenter capacity remain real infrastructure boundaries.'
    };
  }

  async summary() {
    await this.ready;
    const projects = await this.db.prepare('SELECT COUNT(*) AS n FROM magnanimous_cloud_projects').first('n');
    const resources = await this.db.prepare('SELECT COUNT(*) AS n FROM magnanimous_cloud_resources').first('n');
    const actions = await this.db.prepare('SELECT COUNT(*) AS n FROM magnanimous_cloud_actions').first('n');
    const byKind = await this.db.prepare(
      'SELECT kind, COUNT(*) AS count FROM magnanimous_cloud_resources GROUP BY kind ORDER BY kind'
    ).all();

    return {
      identity: 'Magnanimous Cloud',
      brain: 'Magnanimous AI',
      architecture: 'provider-neutral-first-party-cloud-control-plane',
      external_provider_required_for_control_plane: false,
      physical_capacity_required_for_compute: true,
      provider_branding_public: false,
      region: clean(this.env.MAGNANIMOUS_CLOUD_REGION || 'owner-local-1', 64),
      projects: Number(projects || 0),
      resources: Number(resources || 0),
      actions: Number(actions || 0),
      resources_by_kind: byKind.results || [],
      capabilities: MAGNANIMOUS_CLOUD_CAPABILITIES,
      resource_kinds: MAGNANIMOUS_CLOUD_RESOURCE_KINDS,
      host_capacity: this.hostCapacity(),
      boundaries: [
        'Magnanimous owns the software control plane, desired state, policy, audit, routing and resource model.',
        'Owner hardware or a replaceable infrastructure host supplies real CPU, RAM, disks and public network reachability.',
        'Public IP allocation, BGP transit, global anycast, carrier-scale DDoS absorption and datacenter operations cannot be created by repository code alone.',
        'Third-party providers may be attached as replaceable capacity adapters without owning Magnanimous identity or memory.'
      ]
    };
  }

  async listProjects() {
    await this.ready;
    const result = await this.db.prepare(
      'SELECT id,name,slug,description,created_at,updated_at FROM magnanimous_cloud_projects ORDER BY created_at ASC'
    ).all();
    return result.results || [];
  }

  async createProject(input = {}) {
    await this.ready;
    const name = clean(input.name, 120);
    if (!name) throw new Error('Project name is required.');
    const slug = clean(input.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), 80);
    if (!slug) throw new Error('Project slug is required.');
    const stamp = now();
    const id = 'mcloud-project-' + crypto.randomUUID();
    await this.db.prepare(
      'INSERT INTO magnanimous_cloud_projects(id,name,slug,description,created_at,updated_at) VALUES(?,?,?,?,?,?)'
    ).bind(id, name, slug, clean(input.description, 500), stamp, stamp).run();
    return this.db.prepare('SELECT * FROM magnanimous_cloud_projects WHERE id=?').bind(id).first();
  }

  async listResources({ project_id = '', kind = '' } = {}) {
    await this.ready;
    const clauses = [];
    const params = [];
    if (clean(project_id, 120)) { clauses.push('project_id=?'); params.push(clean(project_id, 120)); }
    if (clean(kind, 80)) { clauses.push('kind=?'); params.push(clean(kind, 80)); }
    const sql = `SELECT * FROM magnanimous_cloud_resources${clauses.length ? ' WHERE ' + clauses.join(' AND ') : ''} ORDER BY updated_at DESC LIMIT 500`;
    const result = await this.db.prepare(sql).bind(...params).all();
    return (result.results || []).map(row => ({
      ...row,
      spec: parseJson(row.spec_json),
      status: parseJson(row.status_json)
    }));
  }

  async getResource(id) {
    await this.ready;
    const row = await this.db.prepare('SELECT * FROM magnanimous_cloud_resources WHERE id=? LIMIT 1').bind(clean(id, 160)).first();
    if (!row) return null;
    return { ...row, spec: parseJson(row.spec_json), status: parseJson(row.status_json) };
  }

  async createResource(input = {}) {
    await this.ready;
    const kind = clean(input.kind, 80);
    const definition = MAGNANIMOUS_CLOUD_RESOURCE_KINDS[kind];
    if (!definition) throw new Error('Unsupported Magnanimous Cloud resource kind.');
    const name = clean(input.name, 120);
    if (!name) throw new Error('Resource name is required.');

    const projectId = clean(input.project_id || 'mcloud-project-core', 160);
    const project = await this.db.prepare('SELECT id FROM magnanimous_cloud_projects WHERE id=? LIMIT 1').bind(projectId).first();
    if (!project?.id) throw new Error('Magnanimous Cloud project was not found.');

    const stamp = now();
    const id = 'mcloud-' + kind + '-' + crypto.randomUUID();
    const region = clean(input.region || this.env.MAGNANIMOUS_CLOUD_REGION || 'owner-local-1', 64);
    const capacity = definition.capacity;
    const nativeReady = Boolean(definition.native);
    const state = nativeReady ? 'defined-native-control' : 'defined-awaiting-capacity';
    const status = {
      control_plane: 'active',
      execution: nativeReady ? 'native-control-available' : 'requires-authorized-host-capacity',
      physical_capacity_bound: nativeReady ? null : false,
      provider_required: false,
      external_capacity_allowed: true
    };
    const spec = input.spec && typeof input.spec === 'object' ? input.spec : {};

    await this.db.prepare(
      `INSERT INTO magnanimous_cloud_resources
      (id,project_id,kind,name,region,state,desired_state,capacity_class,spec_json,status_json,created_at,updated_at)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`
    ).bind(
      id, projectId, kind, name, region, state, clean(input.desired_state || 'active', 40),
      capacity, JSON.stringify(spec), JSON.stringify(status), stamp, stamp
    ).run();

    return this.getResource(id);
  }

  async stageAction(resourceId, action, payload = {}) {
    await this.ready;
    const resource = await this.getResource(resourceId);
    if (!resource) throw new Error('Magnanimous Cloud resource was not found.');
    const actionName = clean(action, 80);
    if (!actionName) throw new Error('Action is required.');

    const destructive = new Set(['delete','destroy','rebuild','restore','power-off','shutdown','detach','revoke']);
    const stamp = now();
    const id = 'mcloud-action-' + crypto.randomUUID();
    const needsCapacity = resource.capacity_class === 'host-capacity' || resource.capacity_class === 'external-public-network';
    const status = destructive.has(actionName)
      ? 'staged-requires-explicit-approval'
      : needsCapacity
        ? 'staged-awaiting-capacity-executor'
        : 'staged-native-control';

    const result = {
      executed: false,
      reason: destructive.has(actionName)
        ? 'Consequential infrastructure actions are staged and require a separate approval/executor step.'
        : needsCapacity
          ? 'The Magnanimous control plane owns desired state, but a real authorized capacity executor is not attached.'
          : 'Action recorded in the native control plane; no external provider action was required.'
    };

    await this.db.prepare(
      'INSERT INTO magnanimous_cloud_actions(id,resource_id,action,status,payload_json,result_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)'
    ).bind(id, resource.id, actionName, status, JSON.stringify(payload || {}), JSON.stringify(result), stamp, stamp).run();

    return { id, resource_id: resource.id, action: actionName, status, result, created_at: stamp, updated_at: stamp };
  }

  async listActions(resourceId = '') {
    await this.ready;
    const id = clean(resourceId, 160);
    const result = id
      ? await this.db.prepare('SELECT * FROM magnanimous_cloud_actions WHERE resource_id=? ORDER BY created_at DESC LIMIT 250').bind(id).all()
      : await this.db.prepare('SELECT * FROM magnanimous_cloud_actions ORDER BY created_at DESC LIMIT 250').all();
    return (result.results || []).map(row => ({
      ...row,
      payload: parseJson(row.payload_json),
      result: parseJson(row.result_json)
    }));
  }

  async recordUsage({ resource_id = null, metric, quantity = 0, unit = 'count', metadata = {} } = {}) {
    await this.ready;
    const metricName = clean(metric, 120);
    if (!metricName) throw new Error('Usage metric is required.');
    const id = 'mcloud-usage-' + crypto.randomUUID();
    await this.db.prepare(
      'INSERT INTO magnanimous_cloud_usage(id,resource_id,metric,quantity,unit,recorded_at,metadata_json) VALUES(?,?,?,?,?,?,?)'
    ).bind(id, resource_id ? clean(resource_id, 160) : null, metricName, Number(quantity || 0), clean(unit, 40), now(), JSON.stringify(metadata || {})).run();
    return { id, metric: metricName, quantity: Number(quantity || 0), unit: clean(unit, 40) };
  }
}

export function openMagnanimousCloudControl(options) {
  return new MagnanimousCloudControl(options);
}
