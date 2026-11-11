import fs from 'node:fs';

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), 'utf8');
const page = read('../../frontend/app/studio-tools/page.tsx');
const tools = read('../../frontend/app/studio-tools/utility-tools.tsx');
const core = read('../../frontend/app/studio-tools/utility-tools-core.mjs');
const styles = read('../../frontend/app/studio-tools/utility-tools.css');
const requiredTools = ['focus', 'calculator', 'converter', 'text', 'json', 'backup'];
const failures = [];
const check = (ok, message) => { if (!ok) failures.push(message); };

check(requiredTools.every((name) => tools.includes("['" + name + "'")), 'All six utility modules must remain available.');
check(core.includes('export function calculate(') && core.includes('Division by zero is not allowed.'), 'Calculator must use the bounded arithmetic parser.');
check(core.includes('export function convert(') && core.includes('Temperature'), 'Unit converter must retain temperature and standard unit conversion.');
check(tools.includes('file.size>2*1024*1024') && core.includes('records.length > 500') && core.includes('backup.records.length > 500'), 'Backup import must enforce file and record limits.');
check(core.includes('backup_source_id') && tools.includes('Existing records will not be deleted or replaced.'), 'Backup restore must be additive and safely deduplicated.');
check(tools.includes('exportedAt:new Date().toISOString(),theme') && tools.includes("backup.theme==='light'||backup.theme==='dark'"), 'Portable backups must preserve the light/dark theme preference.');
check(tools.includes('window.confirm(') && tools.includes('onRestore(data)') && tools.includes('const backup=JSON.parse(await file.text())') && tools.includes('normalizeBackup(backup)'), 'Backup import must require affirmative user confirmation and use the authenticated restore callback.');
check(!tools.includes('localStorage.setItem(STORAGE_KEY') && !tools.includes('localStorage.setItem("magnanimous-studio-workspace'), 'Customer workspace records must not be stored in browser localStorage.');
check(page.includes("'/api/operations/records'") && page.includes('board_id:boardId') && page.includes('backup_source_id'), 'Workspace restore must write through the tenant-scoped Operations API.');
check(page.includes("String(item.data?.kind||'')+':'+item.id") && page.includes('known.has(sourceId)'), 'Repeated cloud exports and previously imported backups must be deduplicated.');
check(!page.includes('tenant_id:'), 'Browser requests must not submit a tenant identifier.');
check(page.includes('<UtilityTools items={items} loading={loading} onRestore={restoreBackup}/>'), 'The authenticated Studio Tools route must mount the integrated utility suite.');
check(styles.includes('@media(max-width:560px)'), 'Utility tools must retain a narrow-screen responsive layout.');
if (failures.length) { console.error('Studio Tools integration lock failed:\n- ' + failures.join('\n- ')); process.exit(1); }
console.log('Studio Tools integration lock passed.');
