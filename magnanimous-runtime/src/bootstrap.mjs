import { loadRuntimeSecrets } from './runtime-secret-store.mjs';
import { cleanupOrphanedMigrationStageFiles } from './migration-stage.mjs';
import './reels-route-bootstrap.mjs';

try {
  const cleanup=await cleanupOrphanedMigrationStageFiles({migrationRoot:process.env.MAGNANIMOUS_MIGRATION_ROOT||'/app/persist/migration'});
  if(cleanup.removed){
    console.warn('Magnanimous bootstrap freed orphaned migration-stage storage',{
      removed:cleanup.removed,
      bytes:cleanup.bytes
    });
  }
} catch(error) {
  console.error('Magnanimous bootstrap staging cleanup failed',String(error?.message||error));
}

const staged=await loadRuntimeSecrets();
if(staged.loaded){
  console.log('Magnanimous persistent runtime secrets loaded: '+staged.count+' configured keys.');
}
await import('./server.mjs');