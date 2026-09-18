import fs from 'node:fs';
const sql=fs.readFileSync('worker/migrations/0034_music_studio.sql','utf8');
for(const table of ['music_projects','music_assets','music_generations','music_exports']) if(!sql.includes('CREATE TABLE IF NOT EXISTS '+table)) throw new Error('Missing '+table);
for(const field of ['tenant_id TEXT NOT NULL','owner_user_id TEXT NOT NULL','rights_status','source_rights','consent_record','cost_units']) if(!sql.includes(field)) throw new Error('Missing safety/persistence field '+field);
if(/suno/i.test(sql)) throw new Error('Music persistence must be independent of outside music brands.');
console.log('Music Studio persistence contract passed.');
