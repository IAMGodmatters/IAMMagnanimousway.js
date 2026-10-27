// Owner-only, per-tenant repository file-map snapshots. This is a metadata index,
// not semantic embeddings and not authorization to execute repository content.
const MAX_FILES = 5000;
const MAX_JSON_BYTES = 750000;
const MAX_PATH = 400;
const MAX_QUERY = 160;
const MAX_RESULTS = 50;
const SAFE_REF = /^[A-Za-z0-9._/-]+$/;

export function normalizeRepositoryIndexRef(input) {
  const ref = String(input || 'main').trim();
  return ref.length <= 160 && SAFE_REF.test(ref) && !ref.includes('..') && !ref.startsWith('/') && !ref.endsWith('/') ? ref : '';
}

export function sanitizeRepositoryTree(tree) {
  if (!tree || tree.truncated !== false || !Array.isArray(tree.tree)) {
    throw new Error('GitHub returned an incomplete or invalid tree. No index was saved.');
  }
  if (tree.tree.length > MAX_FILES) throw new Error(`Repository tree exceeds the ${MAX_FILES}-entry indexing limit.`);
  const files = [];
  for (const item of tree.tree) {
    if (item?.type !== 'blob') continue;
    const path = String(item.path || '');
    if (!path || path.length > MAX_PATH || path.includes('\\') || path.split('/').some(segment => !segment || segment === '.' || segment === '..')) {
      throw new Error('Repository contains an unsupported file path; the index was not saved.');
    }
    if (!/^[a-f0-9]{40}$/i.test(String(item.sha || ''))) throw new Error('Repository tree contains an invalid blob SHA.');
    files.push({ path, sha: String(item.sha).toLowerCase(), size: Number.isSafeInteger(item.size) && item.size >= 0 ? item.size : null });
  }
  files.sort((a, b) => a.path.localeCompare(b.path));
  const serialized = JSON.stringify(files);
  if (new TextEncoder().encode(serialized).length > MAX_JSON_BYTES) throw new Error('Repository index would exceed its storage limit.');
  return { files, serialized };
}

export function searchRepositoryFileIndex(files, input, limit = 25) {
  const query = String(input || '').trim().toLowerCase();
  if (!query || query.length > MAX_QUERY) throw new Error('Enter a file or directory fragment up to 160 characters.');
  const boundedLimit = Number.isInteger(limit) ? Math.max(1, Math.min(limit, MAX_RESULTS)) : 25;
  const hits = files.filter(item => item.path.toLowerCase().includes(query));
  return { query, total_count: hits.length, files: hits.slice(0, boundedLimit) };
}

async function ensureIndexSchema(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS magnanimous_repository_file_indices (
    tenant_id TEXT NOT NULL, repo TEXT NOT NULL, ref TEXT NOT NULL, commit_sha TEXT NOT NULL,
    files_json TEXT NOT NULL, file_count INTEGER NOT NULL, indexed_at INTEGER NOT NULL,
    PRIMARY KEY (tenant_id, repo, ref)
  )`).run();
}

const sha40 = value => /^[a-f0-9]{40}$/i.test(String(value || ''));

export async function handleMagnanimousRepositoryIndex({ db, tenantId, repo, ref, operation, query, limit, githubRequest }) {
  if (!db || !tenantId) return { status: 503, body: { detail: 'Tenant-scoped repository index storage is not configured.' } };
  await ensureIndexSchema(db);
  if (operation === 'build') {
    const commit = await githubRequest('GET', `/repos/${repo}/commits/${encodeURIComponent(ref)}`);
    if (!commit.ok) return { status: commit.status, body: { detail: 'Unable to resolve an immutable repository revision.', upstream_status: commit.status } };
    const commitSha = commit.data?.sha, treeSha = commit.data?.commit?.tree?.sha;
    if (!sha40(commitSha) || !sha40(treeSha)) return { status: 502, body: { detail: 'Repository commit/tree identity was incomplete.' } };
    const tree = await githubRequest('GET', `/repos/${repo}/git/trees/${treeSha}?recursive=1`);
    if (!tree.ok) return { status: tree.status, body: { detail: 'Repository tree indexing request failed.', upstream_status: tree.status } };
    let prepared;
    try { prepared = sanitizeRepositoryTree(tree.data); }
    catch (error) { return { status: 422, body: { detail: error.message, complete: false, indexed: false } }; }
    const indexedAt = Math.floor(Date.now() / 1000);
    await db.prepare(`INSERT INTO magnanimous_repository_file_indices
      (tenant_id,repo,ref,commit_sha,files_json,file_count,indexed_at)
      VALUES (?,?,?,?,?,?,?)
      ON CONFLICT(tenant_id,repo,ref) DO UPDATE SET
      commit_sha=excluded.commit_sha,files_json=excluded.files_json,
      file_count=excluded.file_count,indexed_at=excluded.indexed_at`)
      .bind(tenantId, repo, ref, commitSha.toLowerCase(), prepared.serialized, prepared.files.length, indexedAt).run();
    return { status: 200, body: { repo, ref, commit_sha: commitSha.toLowerCase(), indexed_at: indexedAt, file_count: prepared.files.length, complete: true, indexed: true, scope: 'File paths, blob hashes and byte sizes only; source contents and secrets are not stored.' } };
  }
  if (!['search', 'status'].includes(operation)) return { status: 400, body: { detail: 'Use build, search, or status.' } };
  const row = await db.prepare(`SELECT commit_sha,files_json,file_count,indexed_at FROM magnanimous_repository_file_indices
    WHERE tenant_id=? AND repo=? AND ref=?`).bind(tenantId, repo, ref).first();
  if (!row) return { status: 404, body: { detail: 'No repository index exists for this tenant and ref. Build it first.', code: 'REPO_INDEX_MISSING' } };
  const base = { repo, ref, commit_sha: row.commit_sha, indexed_at: row.indexed_at, file_count: row.file_count, exact_commit_snapshot: true, latest_branch_head_verified: false };
  if (operation === 'status') return { status: 200, body: base };
  try {
    const files = JSON.parse(row.files_json);
    if (!Array.isArray(files) || files.length !== Number(row.file_count)) throw new Error('Index data is inconsistent.');
    return { status: 200, body: { ...base, ...searchRepositoryFileIndex(files, query, limit) } };
  } catch (error) { return { status: 409, body: { detail: error.message || 'Stored repository index could not be read. Rebuild the index.' } }; }
}
