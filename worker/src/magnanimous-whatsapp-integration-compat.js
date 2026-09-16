import { INTEGRATIONS } from './integrations.js';

// Preserve the legacy plural capability while exposing the singular action name
// already implemented by assistant-integrations.js. This avoids creating a
// second send path and keeps all existing permission/confirmation gates intact.
export function ensureWhatsAppIntegrationCompatibility(){
  const def=INTEGRATIONS.find(item=>item?.id==='whatsapp');
  if(!def)return false;
  if(!Array.isArray(def.capabilities))def.capabilities=[];
  if(!def.capabilities.includes('send_messages'))def.capabilities.push('send_messages');
  if(!def.capabilities.includes('send_message'))def.capabilities.push('send_message');
  return true;
}
