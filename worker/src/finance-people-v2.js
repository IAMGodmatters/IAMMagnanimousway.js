import { currentUser } from './integrations.js';
import { getKnowledgeContext } from './knowledge-runtime.js';

const now = () => Math.floor(Date.now() / 1000);
const json = (data, status = 200) => Response.json(data, { status, headers: { 'cache-control': 'no-store' } });
const micros = value => Math.round((Number(value) || 0) * 1_000_000);
const amount = value => Number(value || 0) / 1_000_000;
const currency = value => String(value || 'USD').trim().toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3) || 'USD';
const country = value => String(value || '').trim().toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2);
const txt = (value, max = 5000) => String(value || '').trim().slice(0, max);
const choice = (value, allowed, fallback) => allowed.includes(String(value)) ? String(value) : fallback;

const CREATE = [
  `CREATE TABLE IF NOT EXISTS finance_settings (tenant_id TEXT PRIMARY KEY,base_currency TEXT NOT NULL DEFAULT 'USD',reporting_currency TEXT NOT NULL DEFAULT 'USD',home_country TEXT NOT NULL DEFAULT '',fiscal_year_start_month INTEGER NOT NULL DEFAULT 1,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS finance_accounts (id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,code TEXT NOT NULL,name TEXT NOT NULL,type TEXT NOT NULL,subtype TEXT NOT NULL DEFAULT '',currency TEXT NOT NULL DEFAULT 'USD',active INTEGER NOT NULL DEFAULT 1,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL,UNIQUE(tenant_id,code))`,
  `CREATE TABLE IF NOT EXISTS finance_journals (id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,user_id TEXT NOT NULL,journal_date INTEGER NOT NULL,description TEXT NOT NULL DEFAULT '',reference TEXT NOT NULL DEFAULT '',source TEXT NOT NULL DEFAULT 'manual',status TEXT NOT NULL DEFAULT 'posted',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS finance_journal_lines (id TEXT PRIMARY KEY,journal_id TEXT NOT NULL,tenant_id TEXT NOT NULL,account_id TEXT NOT NULL,debit_micros INTEGER NOT NULL DEFAULT 0,credit_micros INTEGER NOT NULL DEFAULT 0,currency TEXT NOT NULL,original_micros INTEGER NOT NULL DEFAULT 0,fx_rate REAL NOT NULL DEFAULT 1,base_micros INTEGER NOT NULL DEFAULT 0,memo TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS finance_documents (id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,user_id TEXT NOT NULL,kind TEXT NOT NULL,document_no TEXT NOT NULL DEFAULT '',counterparty TEXT NOT NULL DEFAULT '',country_code TEXT NOT NULL DEFAULT '',currency TEXT NOT NULL,subtotal_micros INTEGER NOT NULL DEFAULT 0,tax_micros INTEGER NOT NULL DEFAULT 0,total_micros INTEGER NOT NULL DEFAULT 0,issue_date INTEGER,due_date INTEGER,status TEXT NOT NULL DEFAULT 'open',notes TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS finance_fx_cache (currency TEXT PRIMARY KEY,rate_per_eur REAL NOT NULL,as_of TEXT NOT NULL,fetched_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS finance_tax_tasks (id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,user_id TEXT NOT NULL,country_code TEXT NOT NULL,jurisdiction TEXT NOT NULL DEFAULT '',tax_type TEXT NOT NULL,period_label TEXT NOT NULL DEFAULT '',due_at INTEGER,status TEXT NOT NULL DEFAULT 'planned',estimated_micros INTEGER NOT NULL DEFAULT 0,currency TEXT NOT NULL DEFAULT 'USD',source_url TEXT NOT NULL DEFAULT '',notes TEXT NOT NULL DEFAULT '',professional_review_required INTEGER NOT NULL DEFAULT 1,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS hr_workers (id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,user_id TEXT NOT NULL,first_name TEXT NOT NULL,last_name TEXT NOT NULL DEFAULT '',work_email TEXT NOT NULL DEFAULT '',worker_type TEXT NOT NULL DEFAULT 'employee',country_code TEXT NOT NULL DEFAULT '',currency TEXT NOT NULL DEFAULT 'USD',pay_micros INTEGER NOT NULL DEFAULT 0,pay_frequency TEXT NOT NULL DEFAULT 'monthly',department TEXT NOT NULL DEFAULT '',role_title TEXT NOT NULL DEFAULT '',manager_name TEXT NOT NULL DEFAULT '',start_date INTEGER,end_date INTEGER,status TEXT NOT NULL DEFAULT 'active',classification_review TEXT NOT NULL DEFAULT 'not-reviewed',notes TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS hr_leave_requests (id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,worker_id TEXT NOT NULL,leave_type TEXT NOT NULL DEFAULT 'vacation',start_at INTEGER NOT NULL,end_at INTEGER NOT NULL,status TEXT NOT NULL DEFAULT 'pending',notes TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS hr_payroll_runs (id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,user_id TEXT NOT NULL,country_code TEXT NOT NULL DEFAULT '',period_start INTEGER,period_end INTEGER,currency TEXT NOT NULL DEFAULT 'USD',gross_micros INTEGER NOT NULL DEFAULT 0,employee_tax_micros INTEGER NOT NULL DEFAULT 0,employer_tax_micros INTEGER NOT NULL DEFAULT 0,benefits_micros INTEGER NOT NULL DEFAULT 0,net_micros INTEGER NOT NULL DEFAULT 0,employer_cost_micros INTEGER NOT NULL DEFAULT 0,status TEXT NOT NULL DEFAULT 'draft',notes TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS hr_expenses (id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,worker_id TEXT,category TEXT NOT NULL DEFAULT 'other',currency TEXT NOT NULL DEFAULT 'USD',amount_micros INTEGER NOT NULL DEFAULT 0,incurred_at INTEGER,status TEXT NOT NULL DEFAULT 'submitted',description TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`
];

async function ensureTables(env) {
  for (const sql of CREATE) await env.DB.prepare(sql).run();
}

async function getSettings(env, tenant) {
  let row = await env.DB.prepare('SELECT * FROM finance_settings WHERE tenant_id=?').bind(tenant).first();
  if (!row) {
    const ts = now();
    await env.DB.prepare('INSERT INTO finance_settings(tenant_id,base_currency,reporting_currency,home_country,fiscal_year_start_month,created_at,updated_at) VALUES(?,?,?,?,?,?,?)')
      .bind(tenant, 'USD', 'USD', '', 1, ts, ts).run();
    row = await env.DB.prepare('SELECT * FROM finance_settings WHERE tenant_id=?').bind(tenant).first();
  }
  return row;
}

async function ensureDefaultAccounts(env, tenant, baseCurrency) {
  const ts = now();
  const accounts = [
    ['1000', 'Cash & Bank', 'asset', 'cash'],
    ['1100', 'Accounts Receivable', 'asset', 'receivable'],
    ['2000', 'Accounts Payable', 'liability', 'payable'],
    ['3000', 'Owner Equity', 'equity', 'equity'],
    ['4000', 'Revenue', 'revenue', 'revenue'],
    ['5000', 'Operating Expense', 'expense', 'expense']
  ];
  for (const [code, name, type, subtype] of accounts) {
    await env.DB.prepare('INSERT OR IGNORE INTO finance_accounts(id,tenant_id,code,name,type,subtype,currency,active,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)')
      .bind(crypto.randomUUID(), tenant, code, name, type, subtype, baseCurrency, 1, ts, ts).run();
  }
}

async function accountByCode(env, tenant, code) {
  return env.DB.prepare('SELECT * FROM finance_accounts WHERE tenant_id=? AND code=? AND active=1').bind(tenant, code).first();
}

function aiText(out) {
  return String(out?.response || out?.result?.response || out?.result?.text || out?.text || '').trim();
}

async function runAI(env, system, prompt) {
  if (!env.AI) throw new Error('Built-in AI is not available.');
  const models = ['@cf/meta/llama-3.1-8b-instruct-fast', '@cf/meta/llama-3.2-1b-instruct'];
  const errors = [];
  for (const model of models) {
    try {
      const out = await env.AI.run(model, { messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }], max_tokens: 2200 });
      const result = aiText(out);
      if (result) return { result, model };
    } catch (e) {
      errors.push(e?.message || 'AI failed');
    }
  }
  throw new Error(errors.join(' | ') || 'AI compliance assistant could not generate a result.');
}

async function refreshFx(env) {
  const cached = await env.DB.prepare('SELECT currency,rate_per_eur,as_of,fetched_at FROM finance_fx_cache ORDER BY fetched_at DESC LIMIT 1').first();
  if (cached && Number(cached.fetched_at) > now() - 21600) {
    const { results = [] } = await env.DB.prepare('SELECT currency,rate_per_eur,as_of,fetched_at FROM finance_fx_cache').all();
    return results;
  }
  try {
    const response = await fetch('https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml', { headers: { 'user-agent': 'I-AM-Magnanimous-Way/1.0' } });
    if (!response.ok) throw new Error(`ECB returned ${response.status}`);
    const xml = await response.text();
    const asOf = (xml.match(/time=['"]([^'"]+)['"]/) || [])[1] || new Date().toISOString().slice(0, 10);
    const fetchedAt = now();
    const rates = [{ currency: 'EUR', rate_per_eur: 1, as_of: asOf, fetched_at: fetchedAt }];
    for (const match of xml.matchAll(/currency=['"]([A-Z]{3})['"]\s+rate=['"]([0-9.]+)['"]/g)) {
      rates.push({ currency: match[1], rate_per_eur: Number(match[2]), as_of: asOf, fetched_at: fetchedAt });
    }
    if (rates.length < 5) throw new Error('ECB rate feed could not be parsed.');
    for (const rate of rates) {
      await env.DB.prepare('INSERT INTO finance_fx_cache(currency,rate_per_eur,as_of,fetched_at) VALUES(?,?,?,?) ON CONFLICT(currency) DO UPDATE SET rate_per_eur=excluded.rate_per_eur,as_of=excluded.as_of,fetched_at=excluded.fetched_at')
        .bind(rate.currency, rate.rate_per_eur, rate.as_of, rate.fetched_at).run();
    }
    return rates;
  } catch (error) {
    const { results = [] } = await env.DB.prepare('SELECT currency,rate_per_eur,as_of,fetched_at FROM finance_fx_cache').all();
    if (results.length) return results;
    throw error;
  }
}

async function getFxRate(env, fromValue, toValue) {
  const from = currency(fromValue);
  const to = currency(toValue);
  if (from === to) return { from, to, rate: 1, as_of: new Date().toISOString().slice(0, 10), source: 'same-currency' };
  const rows = await refreshFx(env);
  const map = new Map(rows.map(row => [row.currency, Number(row.rate_per_eur)]));
  if (!map.has(from) || !map.has(to)) throw new Error(`ECB reference rates do not currently include ${!map.has(from) ? from : to}.`);
  return {
    from,
    to,
    rate: map.get(to) / map.get(from),
    as_of: rows[0]?.as_of || '',
    source: 'European Central Bank reference rates',
    informational_only: true
  };
}

async function postJournal(env, user, body) {
  const tenant = String(user.tenant_id);
  const settings = await getSettings(env, tenant);
  const baseCurrency = currency(settings.base_currency);
  const inputLines = Array.isArray(body.lines) ? body.lines : [];
  if (inputLines.length < 2) throw new Error('A journal needs at least two lines.');
  const lines = [];
  let debits = 0;
  let credits = 0;
  for (const input of inputLines) {
    const account = await env.DB.prepare('SELECT id FROM finance_accounts WHERE tenant_id=? AND id=? AND active=1')
      .bind(tenant, String(input.account_id || '')).first();
    if (!account) throw new Error('Every journal line must use an active account in this workspace.');
    const debit = micros(input.debit);
    const credit = micros(input.credit);
    if ((debit > 0 && credit > 0) || (debit <= 0 && credit <= 0)) throw new Error('Each journal line must contain either a debit or a credit.');
    debits += debit;
    credits += credit;
    lines.push({
      account_id: account.id,
      debit_micros: debit,
      credit_micros: credit,
      currency: currency(input.currency || baseCurrency),
      original_micros: micros(input.original_amount ?? (debit || credit) / 1_000_000),
      fx_rate: Number(input.fx_rate || 1),
      base_micros: debit || credit,
      memo: txt(input.memo, 1000)
    });
  }
  if (debits !== credits) throw new Error(`Journal is not balanced. Debits ${amount(debits)} must equal credits ${amount(credits)} ${baseCurrency}.`);
  const id = crypto.randomUUID();
  const ts = now();
  const journalDate = Number(body.journal_date || 0) || ts;
  await env.DB.prepare('INSERT INTO finance_journals(id,tenant_id,user_id,journal_date,description,reference,source,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)')
    .bind(id, tenant, String(user.id), journalDate, txt(body.description, 1000), txt(body.reference, 200), txt(body.source || 'manual', 60), 'posted', ts, ts).run();
  for (const line of lines) {
    await env.DB.prepare('INSERT INTO finance_journal_lines(id,journal_id,tenant_id,account_id,debit_micros,credit_micros,currency,original_micros,fx_rate,base_micros,memo,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)')
      .bind(crypto.randomUUID(), id, tenant, line.account_id, line.debit_micros, line.credit_micros, line.currency, line.original_micros, line.fx_rate, line.base_micros, line.memo, ts).run();
  }
  return { id, base_currency: baseCurrency, debits: amount(debits), credits: amount(credits), status: 'posted' };
}

async function quickTransaction(env, user, body) {
  const tenant = String(user.tenant_id);
  const settings = await getSettings(env, tenant);
  const base = currency(settings.base_currency);
  const kind = String(body.kind || '');
  const originalAmount = Number(body.amount || 0);
  if (!['income', 'expense'].includes(kind) || originalAmount <= 0) throw new Error('Choose income or expense and enter an amount greater than zero.');
  const originalCurrency = currency(body.currency || base);
  const fx = originalCurrency === base
    ? { rate: 1, as_of: '', source: 'same-currency' }
    : body.fx_rate
      ? { rate: Number(body.fx_rate), as_of: 'manual', source: 'manual' }
      : await getFxRate(env, originalCurrency, base);
  const baseAmount = originalAmount * fx.rate;
  const cash = await accountByCode(env, tenant, '1000');
  const other = await accountByCode(env, tenant, kind === 'income' ? '4000' : '5000');
  const common = { currency: originalCurrency, original_amount: originalAmount, fx_rate: fx.rate };
  const lines = kind === 'income'
    ? [{ account_id: cash.id, debit: baseAmount, credit: 0, ...common }, { account_id: other.id, debit: 0, credit: baseAmount, ...common }]
    : [{ account_id: other.id, debit: baseAmount, credit: 0, ...common }, { account_id: cash.id, debit: 0, credit: baseAmount, ...common }];
  const journal = await postJournal(env, user, { lines, description: body.description || kind, reference: body.reference || '', source: 'quick-entry', journal_date: body.journal_date });
  return { journal, fx, original: { amount: originalAmount, currency: originalCurrency }, base: { amount: baseAmount, currency: base } };
}

async function financeAnalytics(env, tenant) {
  const settings = await getSettings(env, tenant);
  const base = currency(settings.base_currency);
  const yearAgo = now() - 366 * 86400;
  const days90 = now() - 90 * 86400;
  const pnl = await env.DB.prepare(`SELECT COALESCE(SUM(CASE WHEN a.type='revenue' THEN l.credit_micros-l.debit_micros ELSE 0 END),0) revenue,COALESCE(SUM(CASE WHEN a.type='expense' THEN l.debit_micros-l.credit_micros ELSE 0 END),0) expenses FROM finance_journal_lines l JOIN finance_journals j ON j.id=l.journal_id JOIN finance_accounts a ON a.id=l.account_id WHERE l.tenant_id=? AND j.status='posted' AND j.journal_date>=?`).bind(tenant, yearAgo).first();
  const cash = await env.DB.prepare(`SELECT COALESCE(SUM(l.debit_micros-l.credit_micros),0) balance FROM finance_journal_lines l JOIN finance_journals j ON j.id=l.journal_id JOIN finance_accounts a ON a.id=l.account_id WHERE l.tenant_id=? AND j.status='posted' AND a.subtype IN ('cash','bank')`).bind(tenant).first();
  const expense90 = await env.DB.prepare(`SELECT COALESCE(SUM(l.debit_micros-l.credit_micros),0) expenses FROM finance_journal_lines l JOIN finance_journals j ON j.id=l.journal_id JOIN finance_accounts a ON a.id=l.account_id WHERE l.tenant_id=? AND j.status='posted' AND a.type='expense' AND j.journal_date>=?`).bind(tenant, days90).first();
  const docs = await env.DB.prepare(`SELECT kind,currency,COALESCE(SUM(total_micros),0) total FROM finance_documents WHERE tenant_id=? AND status NOT IN ('paid','void','cancelled') GROUP BY kind,currency`).bind(tenant).all();
  const months = await env.DB.prepare(`SELECT strftime('%Y-%m',datetime(j.journal_date,'unixepoch')) month,COALESCE(SUM(CASE WHEN a.type='revenue' THEN l.credit_micros-l.debit_micros ELSE 0 END),0) revenue,COALESCE(SUM(CASE WHEN a.type='expense' THEN l.debit_micros-l.credit_micros ELSE 0 END),0) expenses FROM finance_journal_lines l JOIN finance_journals j ON j.id=l.journal_id JOIN finance_accounts a ON a.id=l.account_id WHERE l.tenant_id=? AND j.status='posted' AND j.journal_date>=? GROUP BY month ORDER BY month`).bind(tenant, yearAgo).all();
  const balances = await env.DB.prepare(`SELECT a.id,a.code,a.name,a.type,a.subtype,a.currency,COALESCE(SUM(CASE WHEN a.type IN ('liability','equity','revenue') THEN l.credit_micros-l.debit_micros ELSE l.debit_micros-l.credit_micros END),0) balance_micros FROM finance_accounts a LEFT JOIN finance_journal_lines l ON l.account_id=a.id LEFT JOIN finance_journals j ON j.id=l.journal_id WHERE a.tenant_id=? AND a.active=1 GROUP BY a.id ORDER BY a.code`).bind(tenant).all();
  const revenue = Number(pnl?.revenue || 0);
  const expenses = Number(pnl?.expenses || 0);
  const cashMicros = Number(cash?.balance || 0);
  const monthlyBurn = Number(expense90?.expenses || 0) / 3;
  return {
    base_currency: base,
    cash: amount(cashMicros),
    revenue_12m: amount(revenue),
    expenses_12m: amount(expenses),
    net_income_12m: amount(revenue - expenses),
    runway_months: monthlyBurn > 0 ? Number((cashMicros / monthlyBurn).toFixed(1)) : null,
    documents: (docs.results || []).map(row => ({ ...row, total: amount(row.total) })),
    monthly: (months.results || []).map(row => ({ month: row.month, revenue: amount(row.revenue), expenses: amount(row.expenses), net: amount(Number(row.revenue) - Number(row.expenses)) })),
    accounts: (balances.results || []).map(row => ({ ...row, balance: amount(row.balance_micros) }))
  };
}

async function peopleSummary(env, tenant, baseCurrency) {
  const workers = await env.DB.prepare("SELECT COUNT(*) total,SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) active,SUM(CASE WHEN worker_type='contractor' AND classification_review!='reviewed' AND status='active' THEN 1 ELSE 0 END) classification_reviews FROM hr_workers WHERE tenant_id=?").bind(tenant).first();
  const payroll = await env.DB.prepare("SELECT currency,COALESCE(SUM(employer_cost_micros),0) employer_cost FROM hr_payroll_runs WHERE tenant_id=? AND status IN ('approved','paid') AND period_end>=? GROUP BY currency").bind(tenant, now() - 366 * 86400).all();
  const leave = await env.DB.prepare("SELECT COUNT(*) n FROM hr_leave_requests WHERE tenant_id=? AND status='pending'").bind(tenant).first();
  return {
    workers: Number(workers?.total || 0),
    active: Number(workers?.active || 0),
    classification_reviews: Number(workers?.classification_reviews || 0),
    pending_leave: Number(leave?.n || 0),
    people_costs_12m: (payroll.results || []).map(row => ({ currency: row.currency, amount: amount(row.employer_cost) })),
    base_currency: baseCurrency
  };
}

async function complianceBrief(request, env, body) {
  const countryCode = country(body.country_code);
  const topic = txt(body.topic || body.question, 3000);
  if (!countryCode || !topic) throw new Error('Choose a country and describe the tax, payroll, employment, or cross-border compliance question.');
  const query = `${countryCode} ${topic} tax payroll employment cross-border compliance official requirements`;
  const grounding = await getKnowledgeContext(request, env, query, { liveSearch: true, news: false, remember: true, localLimit: 6, webLimit: 7, freshness: body.freshness || '' });
  const system = `You are the I AM Magnanimous Way cross-border finance and HR compliance assistant. Provide operational guidance, not legal or tax advice. Separate verified source-backed facts from assumptions. Cite supplied sources as [1], [2], etc. Identify registrations, filings, recordkeeping, payroll/tax, worker-classification, VAT/sales-tax, immigration or permanent-establishment issues only when relevant. Never invent filing thresholds, tax rates or deadlines. If an authoritative local source is absent, say it needs verification. Finish with a professional-review checklist for a qualified accountant, tax professional, payroll provider, or lawyer in the relevant jurisdiction.`;
  const ai = await runAI(env, system, `Country: ${countryCode}\nQuestion: ${topic}${grounding.context || ''}`);
  return {
    country_code: countryCode,
    answer: ai.result,
    model: ai.model,
    sources: grounding.sources || [],
    live_web_search: Boolean(grounding.search_configured),
    notice: 'Informational compliance assistance only. Local professional review is required before filing, paying tax, classifying workers, or making legal decisions.'
  };
}

async function overview(env, tenant, settings) {
  const [analytics, hr, tax, workers, documents] = await Promise.all([
    financeAnalytics(env, tenant),
    peopleSummary(env, tenant, currency(settings.base_currency)),
    env.DB.prepare("SELECT * FROM finance_tax_tasks WHERE tenant_id=? AND status NOT IN ('completed','cancelled') ORDER BY CASE WHEN due_at IS NULL THEN 1 ELSE 0 END,due_at LIMIT 10").bind(tenant).all(),
    env.DB.prepare('SELECT * FROM hr_workers WHERE tenant_id=? ORDER BY status,first_name LIMIT 20').bind(tenant).all(),
    env.DB.prepare('SELECT * FROM finance_documents WHERE tenant_id=? ORDER BY created_at DESC LIMIT 15').bind(tenant).all()
  ]);
  return {
    ok: true,
    settings,
    analytics,
    hr,
    tax_tasks: tax.results || [],
    workers: (workers.results || []).map(row => ({ ...row, pay: amount(row.pay_micros) })),
    documents: (documents.results || []).map(row => ({ ...row, subtotal: amount(row.subtotal_micros), tax: amount(row.tax_micros), total: amount(row.total_micros) })),
    principles: { double_entry: true, multi_currency: true, fx_reference_source: 'European Central Bank', professional_review_required: true }
  };
}

export async function handleFinancePeople(request, env) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/api/finance-people')) return null;
  if (!env?.DB) return json({ error: 'Finance and people database is not configured.' }, 503);

  try {
    await ensureTables(env);
    const user = await currentUser(request, env);
    if (!user) return json({ error: 'Sign in to use Finance & People.' }, 401);
    const tenant = String(user.tenant_id);
    const settings = await getSettings(env, tenant);
    await ensureDefaultAccounts(env, tenant, currency(settings.base_currency));

    if (request.method === 'GET' && url.pathname === '/api/finance-people/overview') {
      return json(await overview(env, tenant, settings));
    }
    if (request.method === 'GET' && url.pathname === '/api/finance-people/settings') return json({ settings });
    if (request.method === 'PUT' && url.pathname === '/api/finance-people/settings') {
      const body = await request.json().catch(() => ({}));
      const base = currency(body.base_currency || settings.base_currency);
      const reporting = currency(body.reporting_currency || settings.reporting_currency);
      const month = Math.max(1, Math.min(12, Number(body.fiscal_year_start_month || settings.fiscal_year_start_month || 1)));
      await env.DB.prepare('UPDATE finance_settings SET base_currency=?,reporting_currency=?,home_country=?,fiscal_year_start_month=?,updated_at=? WHERE tenant_id=?')
        .bind(base, reporting, country(body.home_country ?? settings.home_country), month, now(), tenant).run();
      return json({ ok: true, settings: await getSettings(env, tenant) });
    }
    if (request.method === 'GET' && url.pathname === '/api/finance-people/accounts') {
      const { results = [] } = await env.DB.prepare('SELECT * FROM finance_accounts WHERE tenant_id=? ORDER BY code').bind(tenant).all();
      return json({ accounts: results });
    }
    if (request.method === 'POST' && url.pathname === '/api/finance-people/accounts') {
      const body = await request.json().catch(() => ({}));
      const code = txt(body.code, 40);
      const name = txt(body.name, 200);
      if (!code || !name) return json({ error: 'Account code and name are required.' }, 400);
      const id = crypto.randomUUID();
      const ts = now();
      await env.DB.prepare('INSERT INTO finance_accounts(id,tenant_id,code,name,type,subtype,currency,active,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)')
        .bind(id, tenant, code, name, choice(body.type, ['asset','liability','equity','revenue','expense'], 'asset'), txt(body.subtype, 60), currency(body.currency || settings.base_currency), 1, ts, ts).run();
      return json({ ok: true, id }, 201);
    }
    if (request.method === 'GET' && url.pathname === '/api/finance-people/journals') {
      const { results = [] } = await env.DB.prepare('SELECT * FROM finance_journals WHERE tenant_id=? ORDER BY journal_date DESC,created_at DESC LIMIT 100').bind(tenant).all();
      return json({ journals: results });
    }
    if (request.method === 'POST' && url.pathname === '/api/finance-people/journals') {
      const journal = await postJournal(env, user, await request.json().catch(() => ({})));
      return json({ ok: true, journal }, 201);
    }
    if (request.method === 'POST' && url.pathname === '/api/finance-people/transactions/simple') {
      const result = await quickTransaction(env, user, await request.json().catch(() => ({})));
      return json({ ok: true, ...result }, 201);
    }
    if (request.method === 'GET' && url.pathname === '/api/finance-people/fx') {
      return json(await getFxRate(env, url.searchParams.get('from') || settings.base_currency, url.searchParams.get('to') || settings.reporting_currency));
    }
    if (request.method === 'GET' && url.pathname === '/api/finance-people/documents') {
      const { results = [] } = await env.DB.prepare('SELECT * FROM finance_documents WHERE tenant_id=? ORDER BY created_at DESC LIMIT 200').bind(tenant).all();
      return json({ documents: results.map(row => ({ ...row, subtotal: amount(row.subtotal_micros), tax: amount(row.tax_micros), total: amount(row.total_micros) })) });
    }
    if (request.method === 'POST' && url.pathname === '/api/finance-people/documents') {
      const body = await request.json().catch(() => ({}));
      const subtotal = Number(body.subtotal || 0);
      const tax = Number(body.tax || 0);
      const total = Number(body.total ?? subtotal + tax);
      if (total < 0) return json({ error: 'Document total cannot be negative.' }, 400);
      const id = crypto.randomUUID();
      const ts = now();
      await env.DB.prepare('INSERT INTO finance_documents(id,tenant_id,user_id,kind,document_no,counterparty,country_code,currency,subtotal_micros,tax_micros,total_micros,issue_date,due_date,status,notes,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
        .bind(id, tenant, String(user.id), choice(body.kind, ['invoice','bill'], 'invoice'), txt(body.document_no, 100), txt(body.counterparty, 300), country(body.country_code), currency(body.currency || settings.base_currency), micros(subtotal), micros(tax), micros(total), body.issue_date ? Number(body.issue_date) : now(), body.due_date ? Number(body.due_date) : null, choice(body.status, ['open','sent','part-paid','paid','overdue','void','cancelled'], 'open'), txt(body.notes, 5000), ts, ts).run();
      return json({ ok: true, id }, 201);
    }
    const documentMatch = url.pathname.match(/^\/api\/finance-people\/documents\/([^/]+)$/);
    if (documentMatch && request.method === 'PUT') {
      const body = await request.json().catch(() => ({}));
      const old = await env.DB.prepare('SELECT * FROM finance_documents WHERE tenant_id=? AND id=?').bind(tenant, documentMatch[1]).first();
      if (!old) return json({ error: 'Document not found.' }, 404);
      await env.DB.prepare('UPDATE finance_documents SET status=?,due_date=?,notes=?,updated_at=? WHERE tenant_id=? AND id=?')
        .bind(choice(body.status, ['open','sent','part-paid','paid','overdue','void','cancelled'], old.status), body.due_date === undefined ? old.due_date : (body.due_date ? Number(body.due_date) : null), body.notes === undefined ? old.notes : txt(body.notes, 5000), now(), tenant, documentMatch[1]).run();
      return json({ ok: true });
    }
    if (request.method === 'GET' && url.pathname === '/api/finance-people/tax-tasks') {
      const { results = [] } = await env.DB.prepare('SELECT * FROM finance_tax_tasks WHERE tenant_id=? ORDER BY CASE WHEN due_at IS NULL THEN 1 ELSE 0 END,due_at').bind(tenant).all();
      return json({ tasks: results.map(row => ({ ...row, estimated_amount: amount(row.estimated_micros) })) });
    }
    if (request.method === 'POST' && url.pathname === '/api/finance-people/tax-tasks') {
      const body = await request.json().catch(() => ({}));
      const countryCode = country(body.country_code);
      const taxType = txt(body.tax_type, 120);
      if (!countryCode || !taxType) return json({ error: 'Country and tax/compliance type are required.' }, 400);
      const id = crypto.randomUUID();
      const ts = now();
      await env.DB.prepare('INSERT INTO finance_tax_tasks(id,tenant_id,user_id,country_code,jurisdiction,tax_type,period_label,due_at,status,estimated_micros,currency,source_url,notes,professional_review_required,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
        .bind(id, tenant, String(user.id), countryCode, txt(body.jurisdiction, 200), taxType, txt(body.period_label, 100), body.due_at ? Number(body.due_at) : null, choice(body.status, ['planned','review','ready','filed','paid','completed','cancelled'], 'planned'), micros(body.estimated_amount), currency(body.currency || settings.base_currency), txt(body.source_url, 1500), txt(body.notes, 7000), 1, ts, ts).run();
      return json({ ok: true, id }, 201);
    }
    const taxMatch = url.pathname.match(/^\/api\/finance-people\/tax-tasks\/([^/]+)$/);
    if (taxMatch && request.method === 'PUT') {
      const body = await request.json().catch(() => ({}));
      const old = await env.DB.prepare('SELECT * FROM finance_tax_tasks WHERE tenant_id=? AND id=?').bind(tenant, taxMatch[1]).first();
      if (!old) return json({ error: 'Tax task not found.' }, 404);
      await env.DB.prepare('UPDATE finance_tax_tasks SET status=?,due_at=?,notes=?,source_url=?,updated_at=? WHERE tenant_id=? AND id=?')
        .bind(choice(body.status, ['planned','review','ready','filed','paid','completed','cancelled'], old.status), body.due_at === undefined ? old.due_at : (body.due_at ? Number(body.due_at) : null), body.notes === undefined ? old.notes : txt(body.notes, 7000), body.source_url === undefined ? old.source_url : txt(body.source_url, 1500), now(), tenant, taxMatch[1]).run();
      return json({ ok: true });
    }
    if (request.method === 'POST' && url.pathname === '/api/finance-people/compliance/brief') {
      return json({ ok: true, ...(await complianceBrief(request, env, await request.json().catch(() => ({})))) });
    }
    if (request.method === 'GET' && url.pathname === '/api/finance-people/workers') {
      const { results = [] } = await env.DB.prepare('SELECT * FROM hr_workers WHERE tenant_id=? ORDER BY status,first_name,last_name').bind(tenant).all();
      return json({ workers: results.map(row => ({ ...row, pay: amount(row.pay_micros) })) });
    }
    if (request.method === 'POST' && url.pathname === '/api/finance-people/workers') {
      const body = await request.json().catch(() => ({}));
      const firstName = txt(body.first_name, 120);
      if (!firstName) return json({ error: 'Worker first name is required.' }, 400);
      const workerType = choice(body.worker_type, ['employee','contractor','eor','intern','temporary'], 'employee');
      const id = crypto.randomUUID();
      const ts = now();
      await env.DB.prepare('INSERT INTO hr_workers(id,tenant_id,user_id,first_name,last_name,work_email,worker_type,country_code,currency,pay_micros,pay_frequency,department,role_title,manager_name,start_date,end_date,status,classification_review,notes,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
        .bind(id, tenant, String(user.id), firstName, txt(body.last_name,120), txt(body.work_email,320), workerType, country(body.country_code), currency(body.currency || settings.base_currency), micros(body.pay), choice(body.pay_frequency,['hourly','weekly','biweekly','semimonthly','monthly','annual'],'monthly'), txt(body.department,160), txt(body.role_title,200), txt(body.manager_name,200), body.start_date ? Number(body.start_date) : now(), body.end_date ? Number(body.end_date) : null, choice(body.status,['active','leave','inactive','terminated'],'active'), workerType === 'contractor' ? choice(body.classification_review,['not-reviewed','review-needed','reviewed'],'not-reviewed') : 'not-applicable', txt(body.notes,7000), ts, ts).run();
      return json({ ok: true, id }, 201);
    }
    const workerMatch = url.pathname.match(/^\/api\/finance-people\/workers\/([^/]+)$/);
    if (workerMatch && request.method === 'PUT') {
      const body = await request.json().catch(() => ({}));
      const old = await env.DB.prepare('SELECT * FROM hr_workers WHERE tenant_id=? AND id=?').bind(tenant, workerMatch[1]).first();
      if (!old) return json({ error: 'Worker not found.' }, 404);
      await env.DB.prepare('UPDATE hr_workers SET status=?,classification_review=?,department=?,role_title=?,manager_name=?,notes=?,updated_at=? WHERE tenant_id=? AND id=?')
        .bind(choice(body.status,['active','leave','inactive','terminated'],old.status), choice(body.classification_review,['not-reviewed','review-needed','reviewed','not-applicable'],old.classification_review), body.department === undefined ? old.department : txt(body.department,160), body.role_title === undefined ? old.role_title : txt(body.role_title,200), body.manager_name === undefined ? old.manager_name : txt(body.manager_name,200), body.notes === undefined ? old.notes : txt(body.notes,7000), now(), tenant, workerMatch[1]).run();
      return json({ ok: true });
    }
    if (request.method === 'GET' && url.pathname === '/api/finance-people/leave') {
      const { results = [] } = await env.DB.prepare('SELECT l.*,w.first_name,w.last_name FROM hr_leave_requests l LEFT JOIN hr_workers w ON w.id=l.worker_id WHERE l.tenant_id=? ORDER BY l.start_at DESC').bind(tenant).all();
      return json({ requests: results });
    }
    if (request.method === 'POST' && url.pathname === '/api/finance-people/leave') {
      const body = await request.json().catch(() => ({}));
      const worker = await env.DB.prepare('SELECT id FROM hr_workers WHERE tenant_id=? AND id=?').bind(tenant, String(body.worker_id || '')).first();
      if (!worker) return json({ error: 'Choose a worker from this workspace.' }, 400);
      const startAt = Number(body.start_at || 0);
      const endAt = Number(body.end_at || 0);
      if (!startAt || !endAt || endAt < startAt) return json({ error: 'Valid leave start and end dates are required.' }, 400);
      const id = crypto.randomUUID();
      const ts = now();
      await env.DB.prepare('INSERT INTO hr_leave_requests(id,tenant_id,worker_id,leave_type,start_at,end_at,status,notes,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)')
        .bind(id, tenant, worker.id, txt(body.leave_type || 'vacation',80), startAt, endAt, 'pending', txt(body.notes,3000), ts, ts).run();
      return json({ ok: true, id }, 201);
    }
    if (request.method === 'GET' && url.pathname === '/api/finance-people/payroll') {
      const { results = [] } = await env.DB.prepare('SELECT * FROM hr_payroll_runs WHERE tenant_id=? ORDER BY period_end DESC,created_at DESC').bind(tenant).all();
      return json({ runs: results.map(row => ({ ...row, gross: amount(row.gross_micros), employee_tax: amount(row.employee_tax_micros), employer_tax: amount(row.employer_tax_micros), benefits: amount(row.benefits_micros), net: amount(row.net_micros), employer_cost: amount(row.employer_cost_micros) })) });
    }
    if (request.method === 'POST' && url.pathname === '/api/finance-people/payroll') {
      const body = await request.json().catch(() => ({}));
      const gross = Number(body.gross || 0);
      const employeeTax = Number(body.employee_tax || 0);
      const employerTax = Number(body.employer_tax || 0);
      const benefits = Number(body.benefits || 0);
      const net = Number(body.net ?? gross - employeeTax);
      const employerCost = Number(body.employer_cost ?? gross + employerTax + benefits);
      if (gross < 0 || net < 0) return json({ error: 'Payroll amounts cannot be negative.' }, 400);
      const id = crypto.randomUUID();
      const ts = now();
      await env.DB.prepare('INSERT INTO hr_payroll_runs(id,tenant_id,user_id,country_code,period_start,period_end,currency,gross_micros,employee_tax_micros,employer_tax_micros,benefits_micros,net_micros,employer_cost_micros,status,notes,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
        .bind(id, tenant, String(user.id), country(body.country_code), body.period_start ? Number(body.period_start) : null, body.period_end ? Number(body.period_end) : now(), currency(body.currency || settings.base_currency), micros(gross), micros(employeeTax), micros(employerTax), micros(benefits), micros(net), micros(employerCost), choice(body.status,['draft','review','approved','paid','cancelled'],'draft'), txt(body.notes,7000), ts, ts).run();
      return json({ ok: true, id }, 201);
    }
    if (request.method === 'GET' && url.pathname === '/api/finance-people/expenses') {
      const { results = [] } = await env.DB.prepare('SELECT e.*,w.first_name,w.last_name FROM hr_expenses e LEFT JOIN hr_workers w ON w.id=e.worker_id WHERE e.tenant_id=? ORDER BY e.incurred_at DESC,e.created_at DESC').bind(tenant).all();
      return json({ expenses: results.map(row => ({ ...row, amount: amount(row.amount_micros) })) });
    }
    if (request.method === 'POST' && url.pathname === '/api/finance-people/expenses') {
      const body = await request.json().catch(() => ({}));
      const expenseAmount = Number(body.amount || 0);
      if (expenseAmount <= 0) return json({ error: 'Expense amount must be greater than zero.' }, 400);
      if (body.worker_id) {
        const worker = await env.DB.prepare('SELECT id FROM hr_workers WHERE tenant_id=? AND id=?').bind(tenant, String(body.worker_id)).first();
        if (!worker) return json({ error: 'Worker not found in this workspace.' }, 400);
      }
      const id = crypto.randomUUID();
      const ts = now();
      await env.DB.prepare('INSERT INTO hr_expenses(id,tenant_id,worker_id,category,currency,amount_micros,incurred_at,status,description,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)')
        .bind(id, tenant, body.worker_id ? String(body.worker_id) : null, txt(body.category || 'other',100), currency(body.currency || settings.base_currency), micros(expenseAmount), body.incurred_at ? Number(body.incurred_at) : now(), 'submitted', txt(body.description,3000), ts, ts).run();
      return json({ ok: true, id }, 201);
    }

    return json({ error: 'Finance & People endpoint not found.' }, 404);
  } catch (error) {
    console.error('finance people error', error);
    return json({ error: error?.message || 'Finance & People service error.' }, 500);
  }
}
