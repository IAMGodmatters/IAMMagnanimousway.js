import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const frontend=path.resolve(here,'..');
const partsDir=path.join(frontend,'artwork','mobile-approved');
const output=path.join(frontend,'public','mobile-dashboard-approved.webp');
const expectedSha256='DAD07958984B667E2661E6A96BFCEB4BA5B494E5D8E616BE30F7342BC5721903';
const expectedBytes=237522;

const parts=fs.readdirSync(partsDir).filter(name=>/^part-\d\d\.b64$/.test(name)).sort();
if(parts.length!==8)throw new Error(`Expected 8 approved mobile artwork chunks, found ${parts.length}`);

const encoded=parts.map(name=>fs.readFileSync(path.join(partsDir,name),'utf8').trim()).join('');
const bytes=Buffer.from(encoded,'base64');
const sha256=crypto.createHash('sha256').update(bytes).digest('hex').toUpperCase();

if(bytes.length!==expectedBytes)throw new Error(`Approved mobile artwork byte length changed: ${bytes.length} (expected ${expectedBytes})`);
if(bytes.subarray(0,4).toString()!=='RIFF'||bytes.subarray(8,12).toString()!=='WEBP')throw new Error('Approved mobile artwork is not a valid WebP container');
if(sha256!==expectedSha256)throw new Error(`Approved mobile artwork integrity failure: ${sha256}`);

fs.writeFileSync(output,bytes);
console.log(`Approved mobile artwork rebuilt (${bytes.length} bytes, ${sha256})`);
