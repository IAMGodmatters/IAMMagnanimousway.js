const now = () => Math.floor(Date.now() / 1000);
const json = (data, status = 200) => Response.json(data, { status, headers: { 'cache-control': 'no-store' } });

function b64(bytes) {
  let value = '';
  for (const byte of bytes) value += String.fromCharCode(byte);
  return btoa(value);
}

function fromB64(value) {
  const raw = atob(String(value || ''));
  return Uint8Array.from(raw, c => c.charCodeAt(0));
}

async function ensureTables(env) {
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS bootstrap_keypair (
    id INTEGER PRIMARY KEY CHECK(id=1),
    public_spki_b64 TEXT NOT NULL,
    private_pkcs8_b64 TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS bootstrap_secrets (
    credential_key TEXT PRIMARY KEY,
    ciphertext_b64 TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`).run();
}

async function getOrCreateKeypair(env) {
  await ensureTables(env);
  let row = await env.DB.prepare('SELECT * FROM bootstrap_keypair WHERE id=1').first();
  if (row) return row;

  const pair = await crypto.subtle.generateKey({
    name: 'RSA-OAEP',
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: 'SHA-256'
  }, true, ['encrypt', 'decrypt']);
  const publicSpki = new Uint8Array(await crypto.subtle.exportKey('spki', pair.publicKey));
  const privatePkcs8 = new Uint8Array(await crypto.subtle.exportKey('pkcs8', pair.privateKey));
  const createdAt = now();
  await env.DB.prepare('INSERT OR IGNORE INTO bootstrap_keypair(id,public_spki_b64,private_pkcs8_b64,created_at) VALUES(1,?,?,?)')
    .bind(b64(publicSpki), b64(privatePkcs8), createdAt).run();
  row = await env.DB.prepare('SELECT * FROM bootstrap_keypair WHERE id=1').first();
  return row;
}

async function importPrivateKey(row) {
  return crypto.subtle.importKey(
    'pkcs8',
    fromB64(row.private_pkcs8_b64),
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['decrypt']
  );
}

export async function getBootstrapSecrets(env) {
  if (!env?.DB) return {};
  try {
    await ensureTables(env);
    const { results } = await env.DB.prepare('SELECT credential_key,ciphertext_b64 FROM bootstrap_secrets').all();
    if (!results?.length) return {};
    const keypair = await getOrCreateKeypair(env);
    const privateKey = await importPrivateKey(keypair);
    const out = {};
    for (const row of results) {
      try {
        const plain = await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, privateKey, fromB64(row.ciphertext_b64));
        out[row.credential_key] = new TextDecoder().decode(plain);
      } catch (error) {
        console.error('bootstrap secret decrypt failed', row.credential_key, error);
      }
    }
    return out;
  } catch (error) {
    console.error('bootstrap secret load failed', error);
    return {};
  }
}

export async function handleBootstrap(request, env) {
  const url = new URL(request.url);
  if (url.pathname !== '/api/bootstrap/public-key') return null;
  if (request.method !== 'GET') return json({ detail: 'Method not allowed.' }, 405);
  if (!env?.DB) return json({ detail: 'Database binding is not configured.' }, 503);
  try {
    const row = await getOrCreateKeypair(env);
    return json({
      algorithm: 'RSA-OAEP-2048-SHA256',
      public_spki_b64: row.public_spki_b64,
      created_at: row.created_at
    });
  } catch (error) {
    return json({ detail: error?.message || 'Secure bootstrap key generation failed.' }, 500);
  }
}
