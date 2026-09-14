import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('frontend');
const ignored = new Set(['node_modules', '.next', 'out']);
const textExtensions = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.json', '.css', '.html']);
const forbiddenPublicNames = [
  'NEXT_PUBLIC_SESSION_SECRET',
  'NEXT_PUBLIC_ADMIN_PASSWORD',
  'NEXT_PUBLIC_OPENAI_API_KEY',
  'NEXT_PUBLIC_STRIPE_SECRET_KEY',
  'NEXT_PUBLIC_INTEGRATION_CREDENTIALS_KEY',
  'NEXT_PUBLIC_TWILIO_AUTH_TOKEN',
  'NEXT_PUBLIC_MUX_TOKEN_SECRET'
];
const credentialPatterns = [
  /\bsk-[A-Za-z0-9_-]{24,}\b/,
  /\bgh[pousr]_[A-Za-z0-9_]{24,}\b/,
  /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/,
  /\bAIza[A-Za-z0-9_-]{28,}\b/
];

const violations = [];
function visit(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) { visit(file); continue; }
    if (!textExtensions.has(path.extname(entry.name))) continue;
    const text = fs.readFileSync(file, 'utf8');
    for (const name of forbiddenPublicNames) if (text.includes(name)) violations.push(`${file}: forbidden public secret variable ${name}`);
    for (const pattern of credentialPatterns) if (pattern.test(text)) violations.push(`${file}: credential-like value committed to frontend source`);
  }
}

visit(root);
if (violations.length) {
  console.error(violations.join('\n'));
  process.exit(1);
}
console.log('Frontend secret boundary verified.');
