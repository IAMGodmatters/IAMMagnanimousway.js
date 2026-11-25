import test from 'node:test';
import assert from 'node:assert/strict';
import { buildWorkersQuery, fetchWorkersMetrics, runAudit, summarizeRows } from './cloudflare-worker-analytics-audit.mjs';

test('groups estimated invocation metrics by Worker and status', () => {
  const result = summarizeRows([
    { dimensions: { scriptName: 'iam-magnanimous', status: 'success', datetime: '2026-11-25T00:00:00Z' }, sum: { requests: 100, errors: 0, subrequests: 10 }, quantiles: { cpuTimeP50: 200, cpuTimeP99: 900 } },
    { dimensions: { scriptName: 'iam-magnanimous', status: 'exceededResources', datetime: '2026-11-25T01:00:00Z' }, sum: { requests: 7, errors: 7, subrequests: 0 }, quantiles: { cpuTimeP50: 9500, cpuTimeP99: 11000 } },
    { dimensions: { scriptName: 'other-worker', status: 'success', datetime: '2026-11-25T00:00:00Z' }, sum: { requests: 3, errors: 0, subrequests: 1 }, quantiles: { cpuTimeP50: 50, cpuTimeP99: 100 } },
  ]);
  assert.equal(result[0].scriptName, 'iam-magnanimous');
  assert.equal(result[0].requestsEstimate, 107);
  assert.equal(result[0].errorsEstimate, 7);
  assert.equal(result[0].exceededResourcesEstimate, 7);
  assert.equal(result[0].statuses.success, 100);
  assert.equal(result[0].statuses.exceededResources, 7);
  assert.equal(result[0].maxCpuTimeP99, 11000);
  assert.equal(result[1].scriptName, 'other-worker');
});
test('does not report missing CPU quantiles as zero', () => {
  const [summary] = summarizeRows([
    { dimensions: { scriptName: 'worker-without-quantiles', status: 'success' }, sum: { requests: 1, errors: 0 }, quantiles: { cpuTimeP50: null, cpuTimeP99: null } },
  ]);
  assert.equal(summary.maxCpuTimeP50, null);
  assert.equal(summary.maxCpuTimeP99, null);
});

test('builds a bounded account-wide 24-hour Workers GraphQL query', () => {
  const request = buildWorkersQuery('account-123', '2026-11-24T00:00:00.000Z', '2026-11-25T00:00:00.000Z');
  assert.match(request.query, /workersInvocationsAdaptive\(limit: 10000/);
  assert.match(request.query, /datetime_geq: \$datetimeStart/);
  assert.match(request.query, /datetime_leq: \$datetimeEnd/);
  assert.match(request.query, /scriptName status/);
  assert.deepEqual(request.variables, { accountTag: 'account-123', datetimeStart: '2026-11-24T00:00:00.000Z', datetimeEnd: '2026-11-25T00:00:00.000Z' });
});
test('reports missing Account Analytics read permission without disclosing a token', async () => {
  await assert.rejects(fetchWorkersMetrics({
    accountId: 'account-123', token: 'test-token', start: '2026-11-24T00:00:00.000Z', end: '2026-11-25T00:00:00.000Z',
    fetchImpl: async () => new Response(JSON.stringify({ errors: [{ message: 'Authentication error' }] }), { status: 200 }),
  }), /Account Analytics:Read/);
});
test('fails closed when the audit has no account ID or token', async () => {
  await assert.rejects(runAudit({}, async () => { throw new Error('must not fetch'); }), /CLOUDFLARE_ACCOUNT_ID is missing/);
  await assert.rejects(runAudit({ CLOUDFLARE_ACCOUNT_ID: 'account-123' }, async () => { throw new Error('must not fetch'); }), /analytics token is missing/);
});
test('rejects a general Cloudflare API token instead of accepting broader permissions', async () => {
  await assert.rejects(
    runAudit({ CLOUDFLARE_ACCOUNT_ID: 'account-123', CLOUDFLARE_API_TOKEN: 'general-token' }, async () => { throw new Error('must not fetch'); }),
    /analytics token is missing/,
  );
});
test('does not treat an empty response as proof that no Cloudflare errors occurred', async () => {
  const mockFetch = async () => new Response(JSON.stringify({ data: { viewer: { accounts: [{ workersInvocationsAdaptive: [] }] } } }), { status: 200 });
  await assert.rejects(runAudit({ CLOUDFLARE_ACCOUNT_ID: 'account-123', CLOUDFLARE_ANALYTICS_READ_TOKEN: 'test-token' }, mockFetch, Date.parse('2026-11-25T00:00:00Z')), /not proof of zero usage/);
});
