# Magnanimous native repository trust gate and atomic multi-file editing

Date: 2026-10-27. Scope: new additive Developer Agent features in I AM MAGNANIMOUS WAY™.

## Source and clean-room boundaries

The public Facebook reel `https://www.facebook.com/reel/28009082505458553/` is captioned by Jens Heitmann as showing a Claude Code hook that checks each GitHub repository before using it. The publicly accessible page metadata established the subject, **not the exact implementation or every spoken word**. The new controls below are independently written Magnanimous code, not a copied upstream hook, private Claude source, or third-party licensing shortcut.

Primary references: [Claude Code hooks reference](https://code.claude.com/docs/en/hooks) (PreToolUse gates and exit-code decisions), [GitHub dependency review](https://docs.github.com/en/code-security/concepts/supply-chain-security/dependency-review), and Magnanimous's existing owner-gated GitHub REST adapter.

## Repository preflight

**Owner UI:** `/developer-agent` → “Check an unfamiliar GitHub repository before using it”.

**Owner API:** `POST /api/magnanimous/dev-agent/repo-preflight` with `{ "repository": "owner/name" }` or a canonical `https://github.com/owner/name` URL. This route is behind the existing platform-owner guard and does not need a newly configured paid service.

The inspector:

1. Rejects non-GitHub URLs, private repositories, malformed identifiers and unverified GitHub metadata.
2. Resolves the public repository's default branch to an immutable commit/tree SHA.
3. Reviews a bounded file list for package lifecycle scripts, agent settings/hooks, MCP files, CI workflow permissions, install scripts, hard-coded credentials and remote-download-to-shell patterns.
4. Reports specific findings and which files were actually sampled, without sending file source to the browser or installing it.
5. Blocks if metadata/tree/content are unavailable, large/truncated, or show high-risk signals. Otherwise it returns `review-required`, **never** an automatic execute/install approval.

This is deliberately **a partial static supply-chain check**. It is not full malware analysis, historical commit verification, a license assessment, a dependency-lockfile vulnerability scan, an official Claude hook installation, or a promise that a repository is trustworthy. The existing OSV workflow remains the separate dependency-vulnerability check. An unfamiliar repository's own `.claude/`, `.cursor/` or equivalent instructions must remain untrusted.

## Atomic multi-file change sets

**Owner UI:** `/developer-agent` → Stage Action → “Atomic multi-file edit (up to 10)”.

**Owner API:** Stage an `upsert_files` action through the existing `POST /api/magnanimous/dev-agent/actions` with payload:

```json
{
  "branch": "feat/my-change",
  "expected_head_sha": "<40-character Git commit SHA from the branch-head lookup>",
  "message": "Implement reviewed multi-file change",
  "files": [
    { "path": "src/feature.js", "content": "export const feature = true;\n" },
    { "path": "docs/feature.md", "content": "# Feature\n" }
  ]
}
```

Use the new read-only `POST /api/magnanimous/dev-agent/branch-head` endpoint or the UI “Capture Exact Branch Head” control, then **review all complete replacement file contents** before staging. The existing staging ledger and separate 15-minute owner confirmation gate remain mandatory.

Only after confirmation does Magnanimous create Git blobs, one tree and one commit; it advances the feature branch in a single non-forced ref update if the saved HEAD still matches. Concurrent updates fail closed with a conflict instead of silently overwriting edits. Maximum ten text files, 65,536 bytes per file, 240,000 bytes total. Default and production branch writes are rejected by this new action. No production deployment or PR is created automatically.

**Remaining gap:** This adds a truthful atomic multi-file *editing primitive* for owner-reviewed changes. It does not yet generate AI-authored cross-file patches, run project code in per-task isolated sandboxes, build an automatically refreshed symbol/semantic repository index, or provision cost-controlled autonomous cloud coding workers. The existing Vibe Studio HTML preview and Full Platform QA Playwright workflows are distinct facilities; do not mislabel them as full Cursor parity.

## Ownership and anti-clone reality

The authoritative GitHub repository was **public** at the time of this change. Public content and any already-forked/copied history cannot be made uncopyable with JavaScript, copyright notices or a monitor. The existing clone-exposure watch and distribution-origin readiness checks remain useful detection/preparation steps. Moving to private requires confirming every GitHub App, CI runner, release artifact and production dependency continues to work without unauthenticated source fetches; rotate any credential found exposed separately. An authorized privacy migration can reduce *future* exposure but cannot retract previous copies.

## Verification

- `node qa/scripts/magnanimous-repo-preflight-lock.mjs`
- `node qa/scripts/magnanimous-multi-file-change-lock.mjs`
- `node qa/scripts/magnanimous-dev-agent-lock.mjs`
- Both new locks are also included in `.github/workflows/full-platform-qa.yml`.
- Production readiness needs a successful exact-commit CI run, successful deployment smoke, and owner-authenticated live endpoint checks; source and local tests alone do not prove that.
