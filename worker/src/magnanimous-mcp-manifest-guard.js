// Magnanimous-native, provider-neutral MCP manifest integrity controls.
// Inspired by open-source agent observability practices; no Orca code is copied.
const MAX_SCHEMA_BYTES = 30000;
const MAX_DEPTH = 30;
const encoder = new TextEncoder();

function canonical(value, depth=0) {
  if (depth > MAX_DEPTH) throw new Error('MCP schema nesting exceeds safety limit.');
  if (Array.isArray(value)) return value.map(item => canonical(item, depth+1));
  if (value && typeof value === 'object') {
    if (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) {
      throw new Error('MCP schema must be a JSON object.');
    }
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key],depth+1)]));
  }
  if (value === null || ['string','boolean'].includes(typeof value) || (typeof value === 'number' && Number.isFinite(value))) return value;
  throw new Error('MCP schema contains a non-JSON value.');
}

export function normalizeMagnanimousMcpManifest(tool) {
  const name = String(tool?.name ?? '').trim();
  if (!name || name.length > 200 || /[\u0000-\u001f]/.test(name)) throw new Error('MCP tool name must contain 1-200 safe characters.');
  const description = String(tool?.description ?? '');
  if (description.length > 3000) throw new Error('MCP tool description exceeds 3000 characters.');
  const input = tool?.inputSchema ?? tool?.input_schema ?? {};
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('MCP input schema must be an object.');
  const schemaJson = JSON.stringify(canonical(input));
  if (encoder.encode(schemaJson).byteLength > MAX_SCHEMA_BYTES) throw new Error('MCP input schema exceeds 30000 bytes.');
  return {name, description, schemaJson};
}

export function sameMagnanimousMcpManifest(current, proposed) {
  const old = normalizeMagnanimousMcpManifest({
    name:current.tool_name ?? current.name, description:current.description,
    inputSchema:JSON.parse(current.input_schema_json ?? current.schemaJson ?? '{}')
  });
  return old.name === proposed.name && old.description === proposed.description && old.schemaJson === proposed.schemaJson;
}

export async function fingerprintMagnanimousMcpManifest(manifest) {
  const bytes = encoder.encode(JSON.stringify([manifest.name, manifest.description, manifest.schemaJson]));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
}
