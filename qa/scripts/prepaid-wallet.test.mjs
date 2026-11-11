import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { creditWallet, debitWallet, walletStatus } from '../../worker/src/usage-guard.js';

class LocalD1 {
  constructor() { this.sqlite = new DatabaseSync(':memory:'); }
  prepare(sql) {
    const owner = this;
    const statement = { sql, values: [] };
    statement.bind = (...values) => { statement.values = values; return statement; };
    statement.run = async () => {
      const result = owner.sqlite.prepare(sql).run(...statement.values);
      return { meta: { changes: Number(result.changes), last_row_id: Number(result.lastInsertRowid || 0) } };
    };
    statement.first = async () => owner.sqlite.prepare(sql).get(...statement.values) || null;
    statement.all = async () => ({ results: owner.sqlite.prepare(sql).all(...statement.values) });
    return statement;
  }
  async batch(statements) {
    this.sqlite.exec('BEGIN IMMEDIATE');
    try {
      const results = statements.map((statement) => {
        const result = this.sqlite.prepare(statement.sql).run(...statement.values);
        return { meta: { changes: Number(result.changes), last_row_id: Number(result.lastInsertRowid || 0) } };
      });
      this.sqlite.exec('COMMIT');
      return results;
    } catch (error) {
      this.sqlite.exec('ROLLBACK');
      throw error;
    }
  }
}

async function fundedWallet(amount = 5) {
  const DB = new LocalD1();
  const env = { DB };
  await creditWallet(env, 'tenant-a', amount, { reference_id: 'funding-1' });
  return env;
}

test('concurrent different-reference debits cannot overspend a prepaid tenant wallet', async () => {
  const env = await fundedWallet(5);
  const attempts = await Promise.allSettled([
    debitWallet(env, 'tenant-a', 4, { reference_id: 'debit-a' }),
    debitWallet(env, 'tenant-a', 4, { reference_id: 'debit-b' }),
  ]);
  assert.equal(attempts.filter((x) => x.status === 'fulfilled').length, 1);
  const rejected = attempts.find((x) => x.status === 'rejected');
  assert.match(String(rejected?.reason?.message), /PREPAID_USAGE_BALANCE_EXHAUSTED/);
  const status = await walletStatus(env, 'tenant-a');
  assert.equal(status.balance_usd, 1);
  assert.equal(status.total_consumed_usd, 4);
  const events = await env.DB.prepare("SELECT COUNT(*) AS total FROM billing_usage_wallet_events WHERE tenant_id=? AND event_type='debit'").bind('tenant-a').first();
  assert.equal(Number(events.total), 1);
});

test('same debit reference is idempotent and a conflicting amount is rejected', async () => {
  const env = await fundedWallet(5);
  await debitWallet(env, 'tenant-a', 2, { reference_id: 'same-debit' });
  await debitWallet(env, 'tenant-a', 2, { reference_id: 'same-debit' });
  await assert.rejects(
    debitWallet(env, 'tenant-a', 3, { reference_id: 'same-debit' }),
    /PREPAID_USAGE_REFERENCE_CONFLICT/,
  );
  const status = await walletStatus(env, 'tenant-a');
  assert.equal(status.balance_usd, 3);
  assert.equal(status.total_consumed_usd, 2);
  const events = await env.DB.prepare("SELECT COUNT(*) AS total FROM billing_usage_wallet_events WHERE tenant_id=? AND event_type='debit'").bind('tenant-a').first();
  assert.equal(Number(events.total), 1);
});

test('concurrent distinct credits are atomic and a repeated Stripe reference cannot double-fund', async () => {
  const DB = new LocalD1();
  const env = { DB };
  await Promise.all([
    creditWallet(env, 'tenant-a', 5, { reference_id: 'stripe-credit-a' }),
    creditWallet(env, 'tenant-a', 7, { reference_id: 'stripe-credit-b' }),
  ]);
  await creditWallet(env, 'tenant-a', 5, { reference_id: 'stripe-credit-a' });
  await assert.rejects(creditWallet(env, 'tenant-a', 6, { reference_id: 'stripe-credit-a' }), /PREPAID_USAGE_REFERENCE_CONFLICT/);
  const status = await walletStatus(env, 'tenant-a');
  assert.equal(status.balance_usd, 12);
  assert.equal(status.total_funded_usd, 12);
  const events = await DB.prepare("SELECT COUNT(*) AS total FROM billing_usage_wallet_events WHERE tenant_id=? AND event_type='credit'").bind('tenant-a').first();
  assert.equal(Number(events.total), 2);
});

test('wallet funding and debiting reject missing idempotency references and invalid amounts', async () => {
  const env = await fundedWallet(5);
  await assert.rejects(creditWallet(env, 'tenant-a', 1), /PREPAID_USAGE_REFERENCE_REQUIRED/);
  await assert.rejects(debitWallet(env, 'tenant-a', Number.NaN, { reference_id: 'bad-amount' }), /PREPAID_USAGE_AMOUNT_INVALID/);
  await assert.rejects(debitWallet(env, 'tenant-a', 1), /PREPAID_USAGE_REFERENCE_REQUIRED/);
});

test('prepaid debits remain tenant-isolated', async () => {
  const env = await fundedWallet(5);
  await debitWallet(env, 'tenant-a', 3, { reference_id: 'tenant-a-debit' });
  await assert.rejects(
    debitWallet(env, 'tenant-b', 1, { reference_id: 'tenant-b-debit' }),
    /PREPAID_USAGE_BALANCE_EXHAUSTED/,
  );
  const a = await walletStatus(env, 'tenant-a');
  const b = await walletStatus(env, 'tenant-b');
  assert.equal(a.balance_usd, 2);
  assert.equal(a.total_consumed_usd, 3);
  assert.equal(b.balance_usd, 0);
  assert.equal(b.total_consumed_usd, 0);
});
