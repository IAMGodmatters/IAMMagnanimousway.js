import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ENDPOINT = 'https://api.cloudflare.com/client/v4/graphql';
const LIMIT = 10000;
const HOUR = 60 * 60 * 1000;

export function buildWorkersQuery(accountTag, start, end) {
  return {
    query: 'query GetWorkersAnalytics($accountTag: string, $datetimeStart: string, $datetimeEnd: string) { viewer { accounts(filter: { accountTag: $accountTag }) { workersInvocationsAdaptive(limit: 10000, filter: { datetime_geq: $datetimeStart, datetime_leq: $datetimeEnd }) { sum { subrequests requests errors } quantiles { cpuTimeP50 cpuTimeP99 } dimensions { datetime scriptName status } } } } }',
    variables: { accountTag, datetimeStart: start, datetimeEnd: end },
  };
}
function numberOrZero(value) {
  const valueNumber = Number(value);
  return Number.isFinite(valueNumber) ? valueNumber : 0;
}
export function summarizeRows(rows) {
  const byScript = new Map();
  for (const row of rows) {
    const dimensions = row?.dimensions || {};
    const scriptName = String(dimensions.scriptName || 'unknown').slice(0, 128);
    const status = String(dimensions.status || 'unknown').slice(0, 64);
    let summary = byScript.get(scriptName);
    if (!summary) {
      summary = { scriptName, requestsEstimate: 0, errorsEstimate: 0, subrequestsEstimate: 0, exceededResourcesEstimate: 0, maxCpuTimeP50: null, maxCpuTimeP99: null, statuses: {}, rows: 0, firstSeen: null, lastSeen: null };
      byScript.set(scriptName, summary);
    }
    const requests = numberOrZero(row?.sum?.requests);
    summary.requestsEstimate += requests;
    summary.errorsEstimate += numberOrZero(row?.sum?.errors);
    summary.subrequestsEstimate += numberOrZero(row?.sum?.subrequests);
    summary.statuses[status] = (summary.statuses[status] || 0) + requests;
    if (status === 'exceededResources') summary.exceededResourcesEstimate += requests;
    const p50 = Number(row?.quantiles?.cpuTimeP50), p99 = Number(row?.quantiles?.cpuTimeP99);
    if (Number.isFinite(p50)) summary.maxCpuTimeP50 = summary.maxCpuTimeP50 === null ? p50 : Math.max(summary.maxCpuTimeP50, p50);
    if (Number.isFinite(p99)) summary.maxCpuTimeP99 = summary.maxCpuTimeP99 === null ? p99 : Math.max(summary.maxCpuTimeP99, p99);
    const timestamp = String(dimensions.datetime || '');
    if (timestamp) {
      if (!summary.firstSeen || timestamp < summary.firstSeen) summary.firstSeen = timestamp;
      if (!summary.lastSeen || timestamp > summary.lastSeen) summary.lastSeen = timestamp;
    }
    summary.rows += 1;
  }
  return [...byScript.values()].sort((a, b) => b.exceededResourcesEstimate - a.exceededResourcesEstimate || b.errorsEstimate - a.errorsEstimate || b.requestsEstimate - a.requestsEstimate);
}
export async function fetchWorkersMetrics({ accountId, token, start, end, fetchImpl = fetch }) {
  if (!accountId) throw new Error('CLOUDFLARE_ACCOUNT_ID is missing.');
  if (!token) throw new Error('No Cloudflare analytics token is configured. Add CLOUDFLARE_ANALYTICS_READ_TOKEN with Account Analytics:Read, or grant that read-only scope to CLOUDFLARE_API_TOKEN.');
  const response = await fetchImpl(ENDPOINT, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token, Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(buildWorkersQuery(accountId, start, end)),
    signal: AbortSignal.timeout(20000),
  });
  const payload = await response.json().catch(() => ({}));
  const graphErrors = Array.isArray(payload.errors) ? payload.errors.map(item => String(item?.message || 'GraphQL error')).join('; ') : '';
  if (!response.ok || graphErrors) {
    const detail = graphErrors || response.statusText || 'Unknown Cloudflare API error';
    throw new Error('Cloudflare Analytics query failed (' + response.status + '): ' + detail + '. Verify the token has Account Analytics:Read.');
  }
  const accounts = payload?.data?.viewer?.accounts;
  if (!Array.isArray(accounts) || !accounts.length) throw new Error('Cloudflare returned no account analytics. Verify CLOUDFLARE_ACCOUNT_ID and token access.');
  const rows = accounts[0]?.workersInvocationsAdaptive;
  if (!Array.isArray(rows)) throw new Error('Cloudflare did not return Workers invocation metrics. Check Analytics API access and the GraphQL response.');
  return { rows, truncated: rows.length >= LIMIT };
}
export async function runAudit(env = process.env, fetchImpl = fetch, now = Date.now()) {
  const accountId = String(env.CLOUDFLARE_ACCOUNT_ID || '').trim();
  const token = String(env.CLOUDFLARE_ANALYTICS_READ_TOKEN || env.CLOUDFLARE_API_TOKEN || '').trim();
  if (!accountId) throw new Error('CLOUDFLARE_ACCOUNT_ID is missing. No Cloudflare request was made.');
  if (!token) throw new Error('Cloudflare analytics token is missing. Add CLOUDFLARE_ANALYTICS_READ_TOKEN with Account Analytics:Read. No Cloudflare request was made.');
  const end = new Date(now).toISOString(), start = new Date(now - 24 * HOUR).toISOString();
  const { rows, truncated } = await fetchWorkersMetrics({ accountId, token, start, end, fetchImpl });
  if (!rows.length) throw new Error('Cloudflare returned zero rows for the 24-hour window. This is not proof of zero usage; check account ID, data availability and token scope.');
  const summaries = summarizeRows(rows);
  const result = {
    windowUtc: { start, end },
    source: 'Cloudflare workersInvocationsAdaptive',
    sampling: 'Adaptive analytics estimates, not exact raw request counts.',
    rowsReturned: rows.length,
    truncatedAtLimit: truncated,
    resourceStatusMeaning: 'exceededResources combines Workers error 1102 and 1027; this dataset alone does not distinguish CPU from daily request exhaustion.',
    workers: summaries,
    nextEvidence: 'Use the Cloudflare Workers dashboard and invocation logs or wrangler tail to identify exact route, version and stack. Do not change or upgrade a Worker from this aggregate alone.',
  };
  console.log(JSON.stringify(result, null, 2));
  if (truncated) console.warn('WARNING: GraphQL returned the full row limit; this report may be truncated.');
  if (summaries.some(item => item.exceededResourcesEstimate > 0)) {
    console.error('ALERT: One or more Worker scripts returned exceededResources invocations in this 24-hour window.');
    process.exitCode = 1;
  }
  return result;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runAudit().catch(error => {
    console.error('Cloudflare read-only analytics audit failed: ' + String(error?.message || error));
    process.exitCode = 1;
  });
}
