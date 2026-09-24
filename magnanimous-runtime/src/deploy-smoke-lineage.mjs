const RUNTIME_IMPACT_PATH = /^(magnanimous-runtime\/|worker\/|frontend\/|video-gateway\/|api\/|package\.json$|package-lock\.json$)/;

export async function deploymentSmokeRevisionAllowed(sourceSha, revision, repository, fetchImpl = globalThis.fetch) {
  const source = String(sourceSha || '').trim();
  const live = String(revision || '').trim();
  const repo = String(repository || '').trim();

  if (!/^[0-9a-f]{40}$/i.test(source) || !/^[0-9a-f]{40}$/i.test(live) || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo)) {
    return false;
  }
  if (source === live) return true;
  if (typeof fetchImpl !== 'function') return false;

  const compareUrl = 'https://api.github.com/repos/' + repo + '/compare/' + live + '...' + source;
  let response;
  try {
    response = await fetchImpl(compareUrl, {
      headers: {
        accept: 'application/vnd.github+json',
        'user-agent': 'magnanimous-runtime-smoke-lineage'
      }
    });
  } catch {
    return false;
  }
  if (!response?.ok) return false;

  let comparison;
  try {
    comparison = await response.json();
  } catch {
    return false;
  }

  if (comparison?.status !== 'ahead') return false;
  const aheadBy = Number(comparison?.ahead_by || 0);
  const totalCommits = Number(comparison?.total_commits || 0);
  const files = Array.isArray(comparison?.files) ? comparison.files : [];

  // GitHub compare can cap file lists. This exception is intentionally narrow:
  // only a short chain of control-plane-only commits may reuse the live runtime.
  if (aheadBy < 1 || aheadBy > 50 || totalCommits < 1 || totalCommits > 50 || files.length >= 300) return false;
  if (!files.length) return false;

  return files.every((entry) => {
    const filename = String(entry?.filename || '');
    return filename && !RUNTIME_IMPACT_PATH.test(filename);
  });
}

export { RUNTIME_IMPACT_PATH };
