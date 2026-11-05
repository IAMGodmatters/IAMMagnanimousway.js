// A read-only graph compiled from Magnanimous's actual ecosystem registry.
// Source/configuration evidence is NEVER described as a successful live probe.
function stableId(value){
 const id=String(value||'');
 if(!/^[a-z0-9][a-z0-9-]*$/.test(id))throw new TypeError('Invalid ecosystem registry identifier.');
 return id;
}

export function buildMagnanimousEcosystemBlueprint(summary){
 if(!summary||!Array.isArray(summary.providers))throw new TypeError('Ecosystem summary is required.');
 const nodes=[{id:'brain:magnanimous',kind:'brain',name:'Magnanimous AI',status:'native-owned',evidence:'identity-and-policy-contract'}];
 const edges=[],domains=new Map(),ids=new Set(['brain:magnanimous']),warnings=[];
 const addNode=node=>{
  if(ids.has(node.id))throw new Error(`Duplicate ecosystem blueprint node: ${node.id}`);
  ids.add(node.id);nodes.push(node);
 };
 const addEdge=(from,to,kind)=>{if(!ids.has(from)||!ids.has(to))throw new Error('Dangling ecosystem blueprint edge.');edges.push({from,to,kind});};

 for(const provider of summary.providers){
  const id=stableId(provider.id),domain=stableId(provider.category),domainId=`domain:${domain}`,providerId=`provider:${id}`;
  if(!domains.has(domain)){
   domains.set(domain,{id:domain,name:domain.split('-').join(' '),providers:[]});
   addNode({id:domainId,kind:'domain',name:domain,status:'cataloged',evidence:'declared-provider-category'});
   addEdge('brain:magnanimous',domainId,'governs');
  }
  const configured=provider.readiness?.configured===true;
  const readiness=configured?'configured-unverified':'not-configured';
  addNode({id:providerId,kind:'provider',name:String(provider.name||id),status:readiness,
   evidence:configured?'configuration-presence-only':'registry-only',access:String(provider.access||''),live_verified:false});
  addEdge(domainId,providerId,'routes-to');
  const capabilities=Array.isArray(provider.capabilities)?provider.capabilities:[];
  const seenCapabilities=new Set();
  for(const capability of capabilities){
   const capabilityId=stableId(capability.id);
   if(seenCapabilities.has(capabilityId))throw new Error(`Duplicate capability for provider ${id}.`);
   seenCapabilities.add(capabilityId);
   const nodeId=`capability:${id}/${capabilityId}`;
   addNode({id:nodeId,kind:'capability',name:String(capability.name||capabilityId),status:'catalog-only',
    mode:String(capability.mode||'adapter'),evidence:'declared-capability-contract',live_verified:false});
   addEdge(providerId,nodeId,'advertises');
  }
  domains.get(domain).providers.push({id,name:String(provider.name||id),status:readiness,capability_count:capabilities.length});
 }

 // Dependencies are added only when BOTH source registry endpoints exist.
 for(const provider of summary.providers){
  if(!provider.network_parent)continue;
  const from=`provider:${stableId(provider.id)}`,to=`provider:${stableId(provider.network_parent)}`;
  if(ids.has(to))addEdge(from,to,'depends-on');
  else warnings.push(`Unknown declared parent for ${provider.id}; relation omitted.`);
 }
 const sortedDomains=[...domains.values()].sort((a,b)=>a.id.localeCompare(b.id));
 for(const domain of sortedDomains)domain.providers.sort((a,b)=>a.id.localeCompare(b.id));
 const sourceCapabilities=summary.providers.reduce((n,p)=>n+(p.capabilities?.length||0),0);
 const graphCapabilities=nodes.filter(n=>n.kind==='capability').length;
 if(sourceCapabilities!==graphCapabilities)throw new Error('Ecosystem blueprint lost capability coverage.');
 if(summary.provider_count!==undefined&&summary.provider_count!==summary.providers.length)throw new Error('Provider count mismatch.');
 if(summary.capability_count!==undefined&&summary.capability_count!==graphCapabilities)throw new Error('Capability count mismatch.');

 return{
  identity:'Magnanimous AI',mode:'compiled-registry-blueprint',status:'source-mapped-not-live-verified',
  owner_only:true,read_only:true,provider_credentials_included:false,external_probes_performed:false,
  live_provider_connections_verified:0,source_checked_at:summary.source_checked_at||null,
  counts:{nodes:nodes.length,edges:edges.length,domains:sortedDomains.length,providers:summary.providers.length,capabilities:graphCapabilities,
   configured_unverified:summary.providers.filter(p=>p.readiness?.configured===true).length},
  domains:sortedDomains,graph:{nodes,edges},
  integrity:{status:'passed',dangling_edges:0,duplicate_node_ids:0,source_coverage:'complete',warnings},
  safety:{brain_owner:'Magnanimous AI',memory_owner:'Magnanimous AI',no_new_authority:true,
   spending_allowed:false,provider_writes_allowed:false,
   note:'Configuration presence is not a successful authenticated provider call, and an advertised capability is not verified execution.'}
 };
}
