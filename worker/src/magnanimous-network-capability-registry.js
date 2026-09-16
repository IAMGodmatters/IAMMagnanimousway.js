const cap=(id,name,mode='knowledge',notes='')=>({id,name,mode,notes});
const family=(id,name,capabilities)=>({id,name,capabilities});

export const MAGNANIMOUS_NETWORK_FAMILIES=Object.freeze([
 family('access','Wireless and subscriber access',[
  cap('wifi-ptp','Point-to-point wireless backhaul'),
  cap('wifi-ptmp','Point-to-multipoint fixed wireless access'),
  cap('licensed-microwave','Licensed microwave links','regulated-gated'),
  cap('private-lte-5g','Private LTE/5G radio access','regulated-gated'),
  cap('fiber-access','Fiber access / PON'),
  cap('ethernet-access','Metro Ethernet / switched access'),
  cap('cpe','Customer-premises equipment provisioning'),
  cap('site-survey','RF/site survey and link budget planning')
 ]),
 family('transport','Backhaul, transport and points of presence',[
  cap('pop','Point-of-presence design'),cap('aggregation','Access aggregation'),cap('fiber-backhaul','Owned/leased fiber backhaul'),
  cap('wireless-backhaul','Wireless backhaul'),cap('redundant-backhaul','Redundant diverse-path backhaul'),cap('ixp','Internet exchange participation','organization-gated'),
  cap('transit','IP transit interconnection','contract-gated'),cap('peering','Private/public peering','contract-gated')
 ]),
 family('routing','Autonomous routing and Internet number resources',[
  cap('asn','Autonomous System Number planning','registry-gated'),cap('bgp','BGP routing','regulated-gated'),cap('ipv6-lir','IPv6 LIR allocation planning','registry-gated'),
  cap('ipv6-pi','Provider-independent IPv6 planning','registry-gated'),cap('ipv4','IPv4 delegation/scarcity planning','registry-gated'),cap('rpki','RPKI ROA management','registry-gated'),
  cap('irr','IRR route objects','registry-gated'),cap('prefix-filtering','Prefix filtering / max-prefix / bogon controls'),cap('route-policy','Local-pref, communities and routing policy')
 ]),
 family('subscriber-core','Subscriber control and service edge',[
  cap('bng-bras','BNG/BRAS subscriber termination'),cap('pppoe','PPPoE subscriber sessions'),cap('ipoe','IPoE/DHCP subscriber sessions'),
  cap('radius','RADIUS AAA'),cap('dhcp','DHCP/DHCPv6'),cap('prefix-delegation','IPv6 prefix delegation'),cap('cgnat','Carrier-grade NAT'),
  cap('qos','QoS/shaping/fair-use policy'),cap('captive-portal','Captive portal / onboarding'),cap('subscriber-provisioning','Subscriber provisioning')
 ]),
 family('dns-ipam','DNS and address management',[
  cap('authoritative-dns','Authoritative DNS'),cap('recursive-dns','Recursive resolver'),cap('dnssec','DNSSEC','guarded'),cap('reverse-dns','Reverse DNS / PTR'),
  cap('ipam','IP address management'),cap('dhcp-dns','DHCP/DNS integration'),cap('rdap-whois','RDAP/WHOIS operations','registry-gated')
 ]),
 family('operations','NOC, observability and automation',[
  cap('nms','Network management system'),cap('snmp','SNMP/telemetry'),cap('streaming-telemetry','Streaming telemetry'),cap('syslog','Central syslog'),
  cap('netflow','NetFlow/sFlow/IPFIX'),cap('latency-loss','Latency/loss/jitter monitoring'),cap('config-backup','Network config backup'),cap('inventory','Asset/site/IP inventory'),
  cap('outage-detection','Outage detection'),cap('capacity-planning','Capacity planning'),cap('change-control','Staged network change control','guarded')
 ]),
 family('security','Network security and abuse handling',[
  cap('edge-firewall','Edge firewall'),cap('ddos','DDoS detection/mitigation'),cap('acl','Infrastructure ACLs'),cap('management-plane','Management-plane isolation'),
  cap('customer-isolation','Subscriber isolation'),cap('abuse-mailbox','Abuse response'),cap('logging-retention','Security logging/retention'),cap('backup-recovery','Config/data backup and recovery')
 ]),
 family('business','ISP business and service assurance',[
  cap('plans','Service plans and speed tiers'),cap('billing','Usage/subscription billing','spend-locked'),cap('sla','Service levels'),cap('ticketing','Trouble tickets'),
  cap('install-workflow','Install/activation workflow'),cap('field-service','Field-service dispatch'),cap('customer-portal','Customer portal'),cap('speed-measurement','Broadband performance measurement')
 ]),
 family('philippines-compliance','Philippines licensing and spectrum gates',[
  cap('vas-registration','NTC VAS registration','regulatory-gated'),cap('cpcn','CPCN / public telecom authority','regulatory-gated'),cap('radio-station-license','Radio station licensing','regulatory-gated'),
  cap('equipment-approval','NTC type approval/acceptance','regulatory-gated'),cap('wdn-registration','Wireless data network/device registration','regulatory-gated'),
  cap('spectrum','Spectrum/frequency authorization','regulatory-gated'),cap('service-standards','Internet access service performance standards','regulatory-gated')
 ])
]);

export const MAGNANIMOUS_NETWORK_ARCHITECTURE=Object.freeze({
 identity:'Magnanimous Network / Internet Service Platform',
 brain_identity:'Magnanimous AI',
 public_provider_identity:'Magnanimous',
 provider_internal_only:true,
 target:'Own as much of the access, routing, addressing, DNS, automation and customer-service stack as lawfully and economically practical.',
 reality_boundary:'A globally reachable Internet service still interconnects with other autonomous networks through transit, peering or an exchange. Magnanimous may own its network and ASN/IP resources without falsely claiming the global Internet has no other network dependencies.',
 preferred_ip_strategy:'IPv6-first with provider-independent or LIR resources when eligible; use IPv4 only where justified and conserve it with dual-stack transition and CGNAT where lawful.',
 routing_safety:'BGP announcements, RPKI/IRR changes, route leaks, prefix withdrawals and network-wide firewall changes are consequential and remain disabled until explicit authorized network-control gates exist.',
 spectrum_safety:'Do not transmit on licensed spectrum or operate regulated public telecom facilities merely because planning software exists. NTC authority, spectrum/equipment permissions and ownership/entity rules must be satisfied first.',
 billing_safety:'Service-plan knowledge is allowed; paid transit, peering ports, spectrum, tower leases, hardware purchases and number-resource fees remain spend-locked.',
 source_checked_at:'2026-09-17'
});

export const APNIC_READINESS_MODEL=Object.freeze({
 region:'Asia Pacific',
 asn:'Eligible when currently multihomed, needing to interconnect with another AS, or able to demonstrate that condition will be met shortly after assignment.',
 ipv6_lir:'Minimum initial allocation is normally /32 for an eligible LIR that is not an end site, plans to announce IPv6 within two years, and meets APNIC assignment/existing-LIR criteria.',
 ipv6_multihoming:'Portable IPv6 assignments for multihoming have a minimum /48.',
 ipv4:'Initial LIR criteria include having used or immediately needing a /24 and demonstrating a plan to use a /23 within a year; IPv4 is scarce and should not be the long-term architecture dependency.',
 actions:'Applications, fees, attestations, ROAs, route objects and live BGP announcements require real organization authority and separate confirmation.'
});

export function magnanimousNetworkSummary(){
 return{
  ...MAGNANIMOUS_NETWORK_ARCHITECTURE,
  family_count:MAGNANIMOUS_NETWORK_FAMILIES.length,
  capability_count:MAGNANIMOUS_NETWORK_FAMILIES.reduce((total,f)=>total+f.capabilities.length,0),
  families:MAGNANIMOUS_NETWORK_FAMILIES,
  internet_number_resources:APNIC_READINESS_MODEL,
  execution_state:'knowledge-and-planning-ready; regulated and live routing actions remain gated'
 };
}
