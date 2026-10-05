import {test,expect} from '@playwright/test';

test.describe('Magnanimous free-plan live depth',()=>{
 test('unknown public page returns a real 404 instead of an auth redirect',async({request})=>{
  const response=await request.get('/__magnanimous_missing_route_404_probe__',{maxRedirects:0});
  expect(response.status()).toBe(404);
  expect(String(response.headers()['content-type']||'')).toContain('text/html');
 });

 test('runtime exposes first-party storage capacity telemetry',async({request})=>{
  const response=await request.get('/__magnanimous_runtime/health');
  expect(response.status()).toBe(200);
  const data=await response.json();
  expect(data?.status).toBe('ok');
  expect(data?.first_party_capabilities?.object_storage).toBe(true);
  expect(data?.storage?.mode).toBe('magnanimous-content-addressed-object-store');
  expect(Number(data?.storage?.logical_bytes||0)).toBeGreaterThanOrEqual(0);
  if(data?.storage?.filesystem){
   expect(Number(data.storage.filesystem.total_bytes||0)).toBeGreaterThan(0);
   expect(Number(data.storage.filesystem.free_bytes||0)).toBeGreaterThanOrEqual(0);
  }
 });

 test('general Magnanimous answers an SSDI link request with useful official guidance',async({request})=>{
  const response=await request.post('/api/chat',{
   timeout:44_000,
   data:{
    message:'Give me the official Social Security Administration link to apply for SSDI and explain the basic application steps. I need the direct official link, not just a description.',
    provider:'auto',
    use_knowledge:true,
    use_tools:false,
    learn_links:false,
    remember_search:false,
    live_search:true
   }
  });
  expect(response.status(),await response.text().catch(()=>'' )).toBe(200);
  const data=await response.json();
  const output=String(data?.output||data?.answer||'');
  expect(output.length,'Magnanimous returned an undersized answer').toBeGreaterThan(350);
  expect(output.toLowerCase(),'Magnanimous did not include an official SSA URL in its answer').toMatch(/https?:\/\/[^\s)]*ssa\.gov/);
  const sources=Array.isArray(data?.sources)?data.sources:[];
  expect(sources.length,'SSDI request was not grounded in fresh sources').toBeGreaterThan(0);
  expect(sources.some((x:any)=>/ssa\.gov/i.test(String(x?.url||''))),'No official SSA source was returned').toBe(true);
 });
});
