import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { evaluateMainRulesets } from '../lib/main-ruleset-audit.mjs';

const repository = process.env.GITHUB_REPOSITORY || 'IAMGodmatters/IAMMagnanimousway.js';
const token = process.env.RULESET_AUDIT_TOKEN || process.env.GITHUB_TOKEN || '';
const apiRoot = 'https://api.github.com/repos/' + repository;
const headers = {
  Accept: 'application/vnd.github+json',
  Authorization: 'Bearer ' + token,
  'User-Agent': 'iam-magnanimous-way-main-ruleset-audit',
  'X-GitHub-Api-Version': '2022-11-28'
};

function report(status, details) {
  const heading = status === 'pass' ? 'PASS' : status === 'manual' ? 'MANUAL VERIFICATION REQUIRED' : 'OWNER ACTION REQUIRED';
  const summary = [
    '## GitHub main ruleset audit',
    '',
    '**Result:** ' + heading,
    '',
    ...details.map(item => '- ' + item),
    '',
    'This is a read-only audit. It evaluates GitHub effective branch rules, including inherited organization rulesets, and checks applicable bypass actors. It does not change repository settings.',
    ''
  ].join('\n');
  console.log((status === 'pass' ? '::notice::' : '::warning::') + heading + ': ' + details.join(' '));
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
}

async function readJson(url) {
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error('GitHub API returned HTTP ' + response.status + ' for ' + url);
  return response.json();
}

async function readAllRulesets() {
  const all = [];
  for (let page = 1; page <= 10; page += 1) {
    const rows = await readJson(
      apiRoot + '/rulesets?includes_parents=true&targets=branch&per_page=100&page=' + page
    );
    if (!Array.isArray(rows)) throw new Error('GitHub returned a non-array ruleset response.');
    all.push(...rows);
    if (rows.length < 100) return all;
  }
  throw new Error('Ruleset pagination exceeded 10 pages; complete verification is not possible.');
}

export async function runMainRulesetAudit() {
  if (!token) {
    report('manual', ['GITHUB_TOKEN is unavailable; no ruleset enforcement claim can be made.']);
    return { status: 'manual' };
  }

  try {
    // GitHub's branch-rules endpoint is authoritative for which rules actually
    // apply to main, including inherited organization/enterprise rulesets.
    const branchRules = await readJson(apiRoot + '/rules/branches/main');
    if (!Array.isArray(branchRules)) throw new Error('GitHub returned a non-array effective branch-rules response.');

    const rulesets = await readAllRulesets();
    const active = rulesets.filter(item =>
      item && item.target === 'branch' && item.enforcement === 'active'
    );
    const applicableIds = new Set(
      branchRules
        .filter(rule => rule && rule.ruleset_id !== undefined && rule.ruleset_id !== null)
        .map(rule => String(rule.ruleset_id))
    );
    const detailsById = {};
    for (const item of active) {
      if (!applicableIds.has(String(item.id))) continue;
      detailsById[String(item.id)] = await readJson(
        apiRoot + '/rulesets/' + encodeURIComponent(item.id) + '?includes_parents=true'
      );
    }

    const assessment = evaluateMainRulesets(active, detailsById, branchRules);
    if (assessment.status === 'pass') {
      report('pass', [
        'Applicable rulesets, including inherited rulesets: ' + assessment.activeRulesets + '.',
        'Required pull-request approvals: ' + assessment.requiredApprovals + '.',
        'Exact required status checks: ' + assessment.requiredCheckContexts.join('; ') + '.',
        'Strict up-to-date policy: enabled.',
        'Unrestricted bypass actors: ' + assessment.unrestrictedBypassActors + '.'
      ]);
    } else {
      report(assessment.status === 'manual' ? 'manual' : 'warning', assessment.gaps);
    }
    return assessment;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    report('manual', ['The effective ruleset audit could not be completed: ' + detail]);
    return { status: 'manual', gaps: [detail] };
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await runMainRulesetAudit();
