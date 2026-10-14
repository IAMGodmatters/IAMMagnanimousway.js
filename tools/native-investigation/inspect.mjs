import { createHash } from 'node:crypto';

const ALLOWED = new Set(['javascript', 'json', 'text', 'sourcemap']);
export function inspectEvidence({content, kind='text', source='user-upload', authorized=false}) {
  if (authorized !== true) throw new Error('Target authorization required');
  if (!ALLOWED.has(kind)) throw new Error('Unsupported inspection type');
  if (typeof content !== 'string') throw new TypeError('Text input required');
  const bytes = Buffer.byteLength(content, 'utf8');
  if (bytes > 1024 * 1024) throw new Error('Input exceeds 1 MiB');
  const sha256 = createHash('sha256').update(content).digest('hex');
  const lines = content.split(/\r?\n/);
  const indicators = [];
  const patterns = [
    ['import', /\bimport\s*(?:\(|[{'*"\w])/],
    ['export', /\bexport\s+(?:default|const|function|class|\{)/],
    ['function', /\b(?:async\s+)?function\s+[A-Za-z_$]/],
    ['network-reference', /\b(?:fetch|XMLHttpRequest)\s*\(/],
  ];
  lines.forEach((line, i) => {
    for (const [type, pattern] of patterns) {
      if (pattern.test(line)) indicators.push({line:i+1,type,classification:'static-inference'});
    }
  });
  return {schemaVersion:1,source:String(source).slice(0,200),kind,bytes,sha256,lineCount:lines.length,indicators:indicators.slice(0,250),executionPerformed:false,networkAccessPerformed:false};
}
