import { createPasswordRecord, verifyPassword } from '../../worker/src/password-security.js';

export default {
  async fetch() {
    try {
      const password = 'Workerd-Scrypt-Smoke-2026!';
      const record = await createPasswordRecord(password, {});
      const good = await verifyPassword(password, record.password_hash, record.password_salt, {});
      const bad = await verifyPassword(`${password}-wrong`, record.password_hash, record.password_salt, {});
      const ok = record.algorithm === 'scrypt-v1'
        && record.password_hash.startsWith('scrypt-v1$32768$8$2$')
        && good.valid === true
        && bad.valid === false;
      return Response.json({ ok, algorithm: record.algorithm, n: record.n, r: record.r, p: record.p }, { status: ok ? 200 : 500 });
    } catch (error) {
      return Response.json({ ok: false, error: String(error?.message || error) }, { status: 500 });
    }
  },
};
