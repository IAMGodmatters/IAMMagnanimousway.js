import { requirePlatformOwner } from './platform-owner-guard.js';

const json = (data, status = 200) => Response.json(data, {
  status,
  headers: { 'cache-control': 'no-store' }
});

export const MAGNANIMOUS_CLOUD_ABSORPTION_MAP = Object.freeze([
  { benchmark: 'Droplets / virtual compute', magnanimous: 'compute-instance desired state + attachable host executor', status: 'control-plane-native-capacity-external' },
  { benchmark: 'regions and sizes', magnanimous: 'provider-neutral regions + capacity profiles', status: 'control-plane-native' },
  { benchmark: 'SSH keys', magnanimous: 'Magnanimous SSH public-key catalog', status: 'control-plane-native' },
  { benchmark: 'images / snapshots / backups', magnanimous: 'image catalog + snapshots + backup/restore lineage', status: 'software-native-host-capacity-for-block-snapshots' },
  { benchmark: 'App Platform', magnanimous: 'app/service/worker/job desired-state model + standalone release pipeline', status: 'software-native-capacity-external' },
  { benchmark: 'Functions', magnanimous: 'scheduled/event durable-work function contract', status: 'software-native-capacity-external' },
  { benchmark: 'Kubernetes', magnanimous: 'standard Kubernetes cluster/node-pool desired state', status: 'control-plane-native-capacity-external' },
  { benchmark: 'managed databases', magnanimous: 'Magnanimous SQL today + replaceable PostgreSQL-compatible targets', status: 'native-sql-available' },
  { benchmark: 'Spaces object storage', magnanimous: 'Magnanimous Object Store', status: 'native' },
  { benchmark: 'Volumes / file storage', magnanimous: 'block-volume + file-share resource contracts', status: 'control-plane-native-capacity-external' },
  { benchmark: 'VPC/private networking', magnanimous: 'private-network resource + internal service networks', status: 'software-native' },
  { benchmark: 'cloud firewalls', magnanimous: 'firewall policy resource + application/reverse-proxy controls', status: 'software-native-host-enforcement-where-required' },
  { benchmark: 'load balancers', magnanimous: 'health-checked load-balancer desired state + replaceable ingress implementation', status: 'control-plane-native-capacity-external' },
  { benchmark: 'DNS', magnanimous: 'CoreDNS authoritative profile + guarded zone generator', status: 'software-native-public-authority-external' },
  { benchmark: 'monitoring / alerts', magnanimous: 'Prometheus metrics + analytics + alert-rule resource model', status: 'native' },
  { benchmark: 'projects / resource management', magnanimous: 'Magnanimous Cloud projects, inventory, actions and usage ledger', status: 'native' },
  { benchmark: 'billing / invoices', magnanimous: 'usage ledger and billing integration boundaries', status: 'usage-native-payment-settlement-external' }
]);


export const DIGITALOCEAN_VISIBLE_TOOL_CONTRACTS = Object.freeze([
  'account_get_information','action_get','action_list','balance_get','billing_history_list',
  'change_kernel_droplet','disable_backups_droplet','disable_backups_droplets_tag','droplet_action','droplet_backup_policy',
  'droplet_create','droplet_delete','droplet_enable_private_net','droplet_get','droplet_kernels','droplet_list',
  'enable_backups_droplet','enable_backups_droplets_tag','enable_ipv6_droplet','enable_ipv6_droplets_tag',
  'enable_private_net_droplets_tag','get_invoice','image_action_convert','image_action_get','image_action_transfer',
  'image_create','image_delete','image_get','image_list','image_update','invoice_list',
  'key_create','key_delete','key_get','key_list','power_cycle_droplet','power_cycle_droplets_tag',
  'power_off_droplet','power_off_droplets_tag','power_on_droplet','power_on_droplets_tag','reboot_droplet',
  'rebuild_droplet','rebuild_droplet_by_slug','region_list','rename_droplet','reset_droplet_password',
  'resize_droplet','restore_droplet','shutdown_droplet','shutdown_droplets_tag','size_list',
  'snapshot_droplet','snapshot_droplets_tag'
]);

function nativeContractForObservedTool(tool) {
  if (tool === 'account_get_information') return 'magnanimous-cloud-summary';
  if (tool.startsWith('action_') || tool === 'droplet_action') return 'magnanimous-cloud-action-ledger';
  if (/balance|billing|invoice/.test(tool)) return 'magnanimous-usage-ledger-plus-external-payment-settlement-boundary';
  if (tool === 'region_list' || tool === 'size_list') return 'magnanimous-region-and-capacity-catalog';
  if (tool.startsWith('key_')) return 'magnanimous-ssh-key-resource';
  if (tool.startsWith('image_')) return 'magnanimous-image-and-snapshot-resource';
  if (/backup|snapshot/.test(tool)) return 'magnanimous-backup-and-snapshot-policy';
  if (/private_net|ipv6/.test(tool)) return 'magnanimous-private-network-resource';
  if (/droplet|power_|reboot|rebuild|resize|restore|shutdown|kernel|rename|password/.test(tool)) return 'magnanimous-compute-instance-resource-and-staged-action';
  return 'magnanimous-cloud-resource-action';
}

export const DIGITALOCEAN_TOOL_ABSORPTION = Object.freeze(
  DIGITALOCEAN_VISIBLE_TOOL_CONTRACTS.map(tool => Object.freeze({
    observed_tool: tool,
    native_contract: nativeContractForObservedTool(tool),
    proprietary_backend_copied: false
  }))
);

export const MAGNANIMOUS_CLOUD_POLICY = Object.freeze({
  identity: 'Magnanimous Cloud',
  brain: 'Magnanimous AI',
  architecture: 'provider-neutral-first-party-cloud-control-plane',
  proprietary_copying: false,
  learned_from: 'public capability classes, documented API behavior, open standards and existing first-party runtime contracts',
  provider_rule: 'DigitalOcean and every other infrastructure vendor remain optional capacity adapters beneath Magnanimous.',
  truth_rule: 'A native control-plane contract does not create physical servers, public IP space, transit, datacenter operations, carrier-scale DDoS capacity or regulated authority.'
});

function control(env) {
  const binding = env?.MAGNANIMOUS_CLOUD_CONTROL;
  return binding && typeof binding.summary === 'function' ? binding : null;
}

function catalog(bindingActive = false) {
  return {
    ...MAGNANIMOUS_CLOUD_POLICY,
    native_control_plane_active: bindingActive,
    absorption_map: MAGNANIMOUS_CLOUD_ABSORPTION_MAP,
    observed_digitalocean_tool_contract_count: DIGITALOCEAN_VISIBLE_TOOL_CONTRACTS.length,
    observed_tool_absorption: DIGITALOCEAN_TOOL_ABSORPTION,
    resource_families: [
      'projects','regions-and-sizes','compute-instances','container-services','kubernetes',
      'apps-workers-jobs','functions','databases','object-storage','block-storage','file-storage',
      'images-snapshots-backups','private-networks','firewalls','load-balancers','public-ip-boundaries',
      'dns','ssh-keys','monitoring-alerts','usage-ledger'
    ],
    external_capacity_boundary: [
      'real CPU/RAM/disk hardware',
      'public IP allocation',
      'internet transit/BGP',
      'global anycast and large-scale DDoS absorption',
      'physical datacenter operations'
    ]
  };
}

async function body(request) {
  return request.clone().json().catch(() => ({}));
}

function idFromPath(pathname) {
  const match = pathname.match(/^\/api\/magnanimous\/cloud\/resources\/([^/]+)(?:\/actions)?$/);
  return match ? decodeURIComponent(match[1]) : '';
}

export async function handleMagnanimousCloudProvider(request, env) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/api/magnanimous/cloud')) return null;

  const denied = await requirePlatformOwner(request, env);
  if (denied) return denied;

  const binding = control(env);

  try {
    if (url.pathname === '/api/magnanimous/cloud' && request.method === 'GET') {
      return json(binding
        ? { ...await binding.summary(), absorption: catalog(true) }
        : { ...catalog(false), status: 'control-plane-code-present-runtime-binding-not-active' });
    }

    if (url.pathname === '/api/magnanimous/cloud/catalog' && request.method === 'GET') {
      return json(catalog(Boolean(binding)));
    }

    if (url.pathname === '/api/magnanimous/cloud/projects') {
      if (!binding) return json({ detail: 'Magnanimous Cloud native runtime binding is not active on this execution rail.' }, 503);
      if (request.method === 'GET') return json({ projects: await binding.listProjects() });
      if (request.method === 'POST') return json({ project: await binding.createProject(await body(request)) }, 201);
      return json({ detail: 'Method not allowed.' }, 405);
    }

    if (url.pathname === '/api/magnanimous/cloud/resources') {
      if (!binding) return json({ detail: 'Magnanimous Cloud native runtime binding is not active on this execution rail.' }, 503);
      if (request.method === 'GET') {
        return json({ resources: await binding.listResources({
          project_id: url.searchParams.get('project_id') || '',
          kind: url.searchParams.get('kind') || ''
        }) });
      }
      if (request.method === 'POST') {
        return json({ resource: await binding.createResource(await body(request)) }, 201);
      }
      return json({ detail: 'Method not allowed.' }, 405);
    }

    const resourceId = idFromPath(url.pathname);
    if (resourceId && !url.pathname.endsWith('/actions')) {
      if (!binding) return json({ detail: 'Magnanimous Cloud native runtime binding is not active on this execution rail.' }, 503);
      if (request.method !== 'GET') return json({ detail: 'Method not allowed.' }, 405);
      const resource = await binding.getResource(resourceId);
      return resource ? json({ resource }) : json({ detail: 'Resource not found.' }, 404);
    }

    if (resourceId && url.pathname.endsWith('/actions')) {
      if (!binding) return json({ detail: 'Magnanimous Cloud native runtime binding is not active on this execution rail.' }, 503);
      if (request.method === 'GET') return json({ actions: await binding.listActions(resourceId) });
      if (request.method === 'POST') {
        const input = await body(request);
        return json({
          action: await binding.stageAction(resourceId, input.action, input.payload || {})
        }, 202);
      }
      return json({ detail: 'Method not allowed.' }, 405);
    }

    return json({ detail: 'Magnanimous Cloud route not found.' }, 404);
  } catch (error) {
    const detail = String(error?.message || error || 'Magnanimous Cloud operation failed.');
    const clientError = /required|unsupported|not found/i.test(detail);
    return json({ detail, code: 'MAGNANIMOUS_CLOUD_ERROR' }, clientError ? 400 : 500);
  }
}
