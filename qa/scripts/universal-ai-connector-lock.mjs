import fs from 'node:fs';

const connector=fs.readFileSync('worker/src/magnanimous-universal-ai-connector.js','utf8');
const entry=fs.readFileSync('worker/src/entrypoint.js','utf8');
const page=fs.readFileSync('frontend/app/ai-connectors/page.tsx','utf8');
const wrangler=fs.readFileSync('worker/wrangler.jsonc','utf8');
const failures=[];
const must=(source,text,label)=>{if(!source.includes(text))failures.push(label)};

must(connector,"MODERN_PROTOCOL='2026-07-28'",'modern MCP protocol support missing');
must(connector,"LEGACY_PROTOCOL='2025-11-25'",'legacy MCP compatibility missing');
must(connector,"path==='/mcp'",'public /mcp route missing');
must(connector,"path==='/.well-known/magnanimous-ai-connector.json'",'well-known connector discovery route missing');
must(connector,"server/discover",'modern MCP discovery missing');
must(connector,"tools/list",'MCP tools/list missing');
must(connector,"tools/call",'MCP tools/call missing');
must(connector,"magnanimous_ask",'Magnanimous brain tool missing');
must(connector,"magnanimous_mail_search",'native multi-account mail tool missing');
must(connector,"magnanimous_communications_execute",'communications execution tool missing');
must(connector,"token_hash",'hashed connector token storage missing');
must(connector,"mail.write",'mail write scope missing');
must(connector,"communications.write",'communications write scope missing');
must(connector,"confirm=true is required",'email confirmation gate missing');
must(connector,"confirm_destructive",'destructive communications gate passthrough missing');
must(connector,"confirm_sensitive",'sensitive communications gate passthrough missing');
must(entry,"handleMagnanimousUniversalAIConnector",'production entrypoint no longer routes universal connector');
must(wrangler,'"/mcp"','Cloudflare asset routing no longer sends /mcp to the Worker first');
must(wrangler,'"/.well-known/*"','Cloudflare asset routing no longer sends connector discovery to the Worker first');
must(page,"CREATE INSTALL TOKEN",'AI connector owner UI missing token creation');
must(page,"Write access OFF by default",'AI connector owner UI no longer communicates safe default');

if(failures.length){console.error('Universal AI connector contract failed:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Universal AI connector contract locked.');
