import fs from 'node:fs';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';

const [databasePath,sourceStatsPath]=process.argv.slice(2);
if(!databasePath||!sourceStatsPath)throw new Error('Usage: node verify-production-parity.mjs <database.sqlite> <source-stats.json>');

const sourcePayload=JSON.parse(fs.readFileSync(sourceStatsPath,'utf8'));
const sourceRows=[];
function walk(value){
  if(Array.isArray(value)){for(const item of value)walk(item);return}
  if(value&&typeof value==='object'){
    if(Object.prototype.hasOwnProperty.call(value,'table_count')&&Object.prototype.hasOwnProperty.call(value,'tenants'))sourceRows.push(value);
    for(const item of Object.values(value))walk(item);
  }
}
walk(sourcePayload);
assert.ok(sourceRows.length,'Could not locate source D1 parity statistics.');
const source=sourceRows[sourceRows.length-1];

const db=new DatabaseSync(databasePath,{readOnly:true});
try{
  const integrity=db.prepare('PRAGMA integrity_check').get();
  assert.equal(Object.values(integrity||{})[0],'ok','SQLite integrity_check must pass.');

  const fk=db.prepare('PRAGMA foreign_key_check').all();
  assert.equal(fk.length,0,'Imported production copy has foreign-key violations.');

  const local=db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%') AS table_count,
      (SELECT COUNT(*) FROM tenants) AS tenants,
      (SELECT COUNT(*) FROM users) AS users,
      (SELECT COUNT(*) FROM auth_sessions) AS auth_sessions,
      (SELECT COUNT(*) FROM tenant_settings) AS tenant_settings,
      (SELECT COUNT(*) FROM settings) AS settings,
      (SELECT COUNT(*) FROM ads) AS ads,
      (SELECT COUNT(*) FROM magnanimous_connector_capability_absorption WHERE status='tool-foundry-specified') AS capability_ledger,
      (SELECT COUNT(*) FROM magnanimous_capability_realizations) AS capability_realizations,
      (SELECT manifest_count FROM magnanimous_capability_materialization_state WHERE id='full-brain') AS manifest_count,
      (SELECT native_ready_count FROM magnanimous_capability_realization_state WHERE id='full-brain') AS native_ready,
      (SELECT hybrid_ready_count FROM magnanimous_capability_realization_state WHERE id='full-brain') AS hybrid_ready,
      (SELECT bridge_required_count FROM magnanimous_capability_realization_state WHERE id='full-brain') AS bridge_required,
      (SELECT specified_only_count FROM magnanimous_capability_realization_state WHERE id='full-brain') AS specified_only
  `).get();

  for(const key of ['table_count','tenants','users','auth_sessions','tenant_settings','settings','ads','capability_ledger','capability_realizations','manifest_count','native_ready','hybrid_ready','bridge_required','specified_only']){
    assert.equal(Number(local[key]),Number(source[key]),'Production parity mismatch for '+key);
  }

  assert.equal(Number(local.manifest_count),3535,'Expected the current full Magnanimous capability brain.');
  assert.equal(Number(local.native_ready),59,'Expected current native-ready capability count.');
  assert.equal(Number(local.hybrid_ready),3476,'Expected current hybrid-ready capability count.');
  assert.equal(Number(local.bridge_required),0,'No bridge-required capability should remain.');
  assert.equal(Number(local.specified_only),0,'No specified-only capability should remain.');

  const legacyProvider=db.prepare(`
    SELECT COUNT(*) AS count
    FROM magnanimous_connector_capability_absorption
    WHERE lower(connector_id) LIKE '%floot%'
       OR lower(connector_name) LIKE '%floot%'
       OR lower(capability_id) LIKE '%floot%'
  `).get();
  assert.equal(Number(legacyProvider.count),0,'Retired provider rows must not exist in the current production brain.');

  console.log('Magnanimous production-data parity PASS: schema, core counts, integrity, foreign keys and 3,535-capability brain match.');
}finally{
  db.close();
}
