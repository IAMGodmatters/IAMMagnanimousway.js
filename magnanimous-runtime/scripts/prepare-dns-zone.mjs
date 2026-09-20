import fs from 'node:fs/promises';
import path from 'node:path';
import net from 'node:net';

function badIp(ip){
 if(net.isIP(ip)!==4)return true;
 const p=ip.split('.').map(Number);
 if(p[0]===10||p[0]===127||p[0]===0||p[0]>=224)return true;
 if(p[0]===169&&p[1]===254)return true;
 if(p[0]===172&&p[1]>=16&&p[1]<=31)return true;
 if(p[0]===192&&p[1]===168)return true;
 if(p[0]===192&&p[1]===0&&p[2]===2)return true;
 if(p[0]===198&&p[1]===51&&p[2]===100)return true;
 if(p[0]===203&&p[1]===0&&p[2]===113)return true;
 return false;
}
const ns1=String(process.env.MAGNANIMOUS_DNS_NS1_IP||''),ns2=String(process.env.MAGNANIMOUS_DNS_NS2_IP||''),origin=String(process.env.MAGNANIMOUS_DNS_ORIGIN_IP||'');
for(const [name,ip] of [['MAGNANIMOUS_DNS_NS1_IP',ns1],['MAGNANIMOUS_DNS_NS2_IP',ns2],['MAGNANIMOUS_DNS_ORIGIN_IP',origin]])if(badIp(ip))throw new Error(name+' must be a real public IPv4 address, not private/test/documentation space.');
if(ns1===ns2)throw new Error('Authoritative DNS requires two independent public resolver addresses.');
const serial=String(process.env.MAGNANIMOUS_DNS_SERIAL||new Date().toISOString().slice(0,10).replaceAll('-','')+'01');
const ttl=Math.max(60,Math.min(Number(process.env.MAGNANIMOUS_DNS_TTL||300),86400));
let extra='';
const extraFile=process.env.MAGNANIMOUS_DNS_EXTRA_RECORDS_FILE;
if(extraFile)extra=await fs.readFile(path.resolve(extraFile),'utf8');
const zone=[
 '$ORIGIN iammagnanimousway.com.',
 '$TTL '+ttl,
 '@ IN SOA ns1.iammagnanimousway.com. hostmaster.iammagnanimousway.com. (',
 '  '+serial+' 3600 900 1209600 '+ttl,
 ')',
 '@ IN NS ns1.iammagnanimousway.com.',
 '@ IN NS ns2.iammagnanimousway.com.',
 'ns1 IN A '+ns1,
 'ns2 IN A '+ns2,
 '@ IN A '+origin,
 'www IN CNAME @',
 '',
 '; Preserved mail/TXT/verification records:',
 extra.trim(),
 ''
].join('\n');
const out=path.resolve('magnanimous-runtime/dns/generated/db.iammagnanimousway.com');
await fs.mkdir(path.dirname(out),{recursive:true});
await fs.writeFile(out,zone);
console.log(JSON.stringify({ok:true,zone:out,ns1,ns2,origin,serial,ttl,extra_records_file:extraFile||null},null,2));
