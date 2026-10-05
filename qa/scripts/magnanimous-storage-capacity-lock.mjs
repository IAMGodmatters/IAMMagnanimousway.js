import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {openMagnanimousObjectStore} from '../../magnanimous-runtime/src/object-store.mjs';

const root=await fs.mkdtemp(path.join(os.tmpdir(),'magnanimous-storage-lock-'));
try{
  const store=openMagnanimousObjectStore(root);
  const before=await store.capacity();
  assert.equal(before.durable,true,'Native object storage must report durable capacity.');
  assert.equal(before.backend,'magnanimous-native-filesystem-object-store');
  assert.ok(before.total_bytes>0,'Native object storage must report filesystem capacity.');
  assert.ok(before.free_bytes>0,'Native object storage must report available capacity.');
  assert.ok(before.used_percent>=0&&before.used_percent<=100,'Storage utilization percent must be bounded.');

  const written=await store.put('qa/capacity.json',JSON.stringify({ok:true}),{httpMetadata:{contentType:'application/json'}});
  assert.ok(written.etag&&written.size>0,'Native object store write must return integrity metadata.');
  assert.equal(await (await store.get('qa/capacity.json')).text(),JSON.stringify({ok:true}),'Native object store read-after-write must succeed.');

  const source=await fs.readFile(new URL('../../magnanimous-runtime/src/object-store.mjs',import.meta.url),'utf8');
  for(const contract of ['MAGNANIMOUS_STORAGE_RESERVE_BYTES','MAGNANIMOUS_STORAGE_RESERVE','status=507','fs.statfs']){
    assert.ok(source.includes(contract),`Storage exhaustion protection missing: ${contract}`);
  }
  console.log('Magnanimous storage capacity lock PASS');
}finally{
  await fs.rm(root,{recursive:true,force:true});
}
