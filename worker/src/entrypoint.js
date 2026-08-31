import app from './index.js';

const CRM_TABLES = ['crm_contacts', 'crm_activities', 'crm_opportunities'];

async function repairLegacyCrmSchema(env) {
  if (!env?.DB) return;
  for (const table of CRM_TABLES) {
    try {
      await env.DB.prepare(`ALTER TABLE ${table} ADD COLUMN tenant_id TEXT`).run();
    } catch (e) {
      // Column already exists, or the table does not exist yet. The main app
      // initialization handles table creation and population on the same request.
    }
  }
}

export default {
  async fetch(request, env, ctx) {
    await repairLegacyCrmSchema(env);
    return app.fetch(request, env, ctx);
  }
};
