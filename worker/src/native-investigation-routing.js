const ROUTES=[
 {id:'source-repository',label:'Source repository',match:({name,hint})=>/\b(repo|repository|source tree|checkout)\b/i.test(hint)||/^(?:package\.json|pyproject\.toml|Cargo\.toml|go\.mod)$/i.test(name),mode:'repository-tools',provider:'magnanimous-native',execution:false,description:'Use repository inspection first; do not invoke a binary reverse-engineering engine when complete source is available.'},
 {id:'javascript-application',label:'JavaScript / Electron application',match:({name,hint})=>/\.(?:js|mjs|cjs|jsx|ts|tsx|asar)$/i.test(name)||/\b(?:javascript|electron|asar|source map)\b/i.test(hint),mode:'static-first',provider:'magnanimous-native-or-rea-local',execution:false,description:'Start with static JavaScript/module analysis. Use an optional local specialist only when shipped-artifact evidence is required.'},
 {id:'archive-package',label:'Archive / application package',match:({name,hint})=>/\.(?:zip|ipa|msix|appx|dmg)$/i.test(name)||/\barchive|application package\b/i.test(hint),mode:'inventory-first',provider:'local-specialist',execution:false,description:'Inventory members and metadata before deeper inspection; preserve source digests and do not execute members.'},
 {id:'android-package',label:'Android package',match:({name,hint})=>/\.apk$/i.test(name)||/\bandroid|apk\b/i.test(hint),mode:'managed-mobile-static',provider:'local-specialist',execution:false,description:'Inspect package structure and code statically first; runtime work remains a separate, explicitly authorized lane.'},
 {id:'managed-assembly',label:'.NET managed assembly',match:({name,hint})=>/\.(?:dll|exe)$/i.test(name)&&/\b(?:dotnet|\.net|managed|cli assembly)\b/i.test(hint),mode:'managed-static',provider:'local-specialist',execution:false,description:'Inspect metadata, types and managed code without executing the target.'},
 {id:'firmware',label:'Firmware image',match:({name,hint})=>/\.(?:bin|img|rom|fw)$/i.test(name)&&/\b(?:firmware|rom|embedded)\b/i.test(hint),mode:'region-map-first',provider:'local-specialist',execution:false,description:'Map regions and extraction boundaries before deeper analysis; extraction requires a caller-selected output directory.'},
 {id:'web-capture',label:'Recorded web/network capture',match:({name,hint})=>/\.(?:har|saz|qlog)$/i.test(name)||/\b(?:har|saz|qlog|web capture|network capture)\b/i.test(hint),mode:'recording-only',provider:'magnanimous-native-or-local',execution:false,description:'Analyze the supplied recording. Do not fetch recorded URLs or imply live attribution.'},
 {id:'packet-capture',label:'Packet capture',match:({name,hint})=>/\.(?:pcap|pcapng)$/i.test(name)||/\b(?:pcap|packet capture)\b/i.test(hint),mode:'recording-only',provider:'local-specialist',execution:false,description:'Inspect recorded traffic with bounded field selection and paging. This lane does not acquire live traffic.'},
 {id:'signal-recording',label:'Logic / signal recording',match:({name,hint})=>/\.(?:sr|vcd)$/i.test(name)||/\b(?:logic trace|signal recording|sigrok)\b/i.test(hint),mode:'recording-only',provider:'local-specialist',execution:false,description:'Decode a supplied recording with explicit decoder/channel settings; no hardware acquisition is implied.'},
 {id:'wasm',label:'WebAssembly artifact',match:({name,hint})=>/\.wasm$/i.test(name)||/\bwebassembly|wasm\b/i.test(hint),mode:'offline-static',provider:'local-specialist',execution:false,description:'Decode explicit local WebAssembly bytes to analysis text; decoded WAT is not original source.'},
 {id:'evm',label:'EVM bytecode',match:({name,hint})=>/\b(?:evm|bytecode|solidity selector)\b/i.test(hint),mode:'offline-static',provider:'local-specialist',execution:false,description:'Infer candidate selectors and interface facts from supplied bytecode without chain lookup or execution.'},
 {id:'sqlite',label:'SQLite database snapshot',match:({name,hint})=>/\.(?:sqlite|sqlite3|db)$/i.test(name)||/\bsqlite\b/i.test(hint),mode:'snapshot-read',provider:'local-specialist',execution:false,description:'Inspect schema first, then bounded rows from a quiescent snapshot. Preserve database/WAL identity when present.'},
 {id:'recorded-crash',label:'Recorded crash / core',match:({name,hint})=>/\.(?:core|dmp|mdmp)$/i.test(name)||/\b(?:core dump|recorded crash|minidump)\b/i.test(hint),mode:'recording-only',provider:'local-specialist',execution:false,description:'Analyze recorded threads, mappings and registers without attaching to a live process.'},
 {id:'native-binary',label:'Native binary',match:({name,hint})=>/\.(?:exe|dll|so|dylib|elf|mach-o|bin)$/i.test(name)||/\b(?:native binary|elf|pe binary|mach-o|decompile|disassemble)\b/i.test(hint),mode:'offline-native-first',provider:'local-specialist',execution:false,description:'Use static binary metadata first, then an approved local engine such as Ghidra, Hopper or IDA when needed.'},
 {id:'browser-runtime',label:'Browser runtime observation',match:({name,hint})=>/\b(?:browser page|dom runtime|open page|browser scenario)\b/i.test(hint),mode:'passive-or-declared-actions',provider:'local-browser-specialist',execution:'declared-actions-only',description:'Prefer passive observation. Any click, type or navigation must be declared and user-authorized.'}
];

function normalize(value){return String(value||'').trim();}

export function routeInvestigationTarget({name='',hint=''}={}){
 const target={name:normalize(name),hint:normalize(hint)};
 const matched=ROUTES.find(route=>route.match(target));
 return matched?{id:matched.id,label:matched.label,mode:matched.mode,provider:matched.provider,execution:matched.execution,description:matched.description}:{id:'generic-text-evidence',label:'Generic text evidence',mode:'browser-local-static',provider:'magnanimous-native',execution:false,description:'Use the native browser-local inspector and escalate only if the evidence requires a more specific authorized provider.'};
}

export function nativeInvestigationCapabilityMap(){
 return ROUTES.map(({match,...route})=>route);
}

export function investigationSelfAuditRules(){
 return {
  routeFirst:true,
  summaryFirst:true,
  sourceDigestRequired:true,
  explicitAuthorizationRequired:true,
  distinguishObservationFromInference:true,
  noImplicitTargetFetch:true,
  noImplicitExecution:true,
  noAccessControlBypass:true,
  providerNeutralEvidence:true,
  externalEnginesRemainReplaceable:true
 };
}
