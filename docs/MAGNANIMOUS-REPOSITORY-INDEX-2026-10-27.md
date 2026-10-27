# Magnanimous native repository file-map index

The Owner-only Developer Agent includes a free, tenant-scoped repository metadata index. It is **not** yet a complete Cursor-style semantic, symbol, or embedding index.

## Use

On `/developer-agent/`, choose an allowed repository and a Git branch/ref. Press **Build / Refresh Index**. Magnanimous resolves the ref to an immutable GitHub commit, downloads the complete Git tree metadata, validates it and stores only file paths, Git blob identifiers, and file sizes in the platform database. It does not clone, install, run, send source to AI providers, or index source contents. After building, enter a file or directory fragment and select **Search Index**. **Index Status** shows the pinned revision.

API: `POST /api/magnanimous/dev-agent/repo-index` (platform owner authentication required)

- `{ "repo": "IAMGodmatters/IAMMagnanimousway.js", "ref": "main", "operation": "build" }`
- `{ "repo": "IAMGodmatters/IAMMagnanimousway.js", "ref": "main", "operation": "search", "query": "worker/src", "limit": 30 }`
- `{ "repo": "IAMGodmatters/IAMMagnanimousway.js", "ref": "main", "operation": "status" }`

Each snapshot is keyed by `(tenant_id, repo, ref)` and retains its immutable commit ID and timestamp. It is explicitly **not automatically current** when the branch moves. A manually refreshed index replaces the old snapshot only after the remote tree is verified complete. Truncated trees, invalid metadata, more than 5,000 tree entries, or snapshots over 750 KB are rejected without overwriting the prior index. Search returns at most 50 results.

## Security and scope

- Owner guard and repository allowlist run before indexing. Database queries are restricted by tenant ID.
- No GitHub token, source-file content, secrets, AI prompts, or chat data is stored in the index.
- Rebuild requests make read-only GitHub API calls. No third-party code executes.
- This is lexical **filename/path** search. Existing GitHub code search and owner source reader remain separate; model-assisted multi-file synthesis, semantic embeddings, and isolated execution are not claimed.
- A successful local test does not prove authenticated deployment behavior until the production owner endpoint is exercised.

Test: `node qa/scripts/magnanimous-repository-index-lock.mjs`.
