import { loadRuntimeSecrets } from './runtime-secret-store.mjs';

const staged=await loadRuntimeSecrets();
if(staged.loaded){
  console.log('Magnanimous persistent runtime secrets loaded: '+staged.count+' configured keys.');
}
await import('./server.mjs');
