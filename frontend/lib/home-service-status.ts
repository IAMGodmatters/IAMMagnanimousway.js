// A reachable catalog is not proof that every listed service can execute.
export async function fetchHomeJson(url: string, fetcher: typeof fetch = fetch, timeoutMs = 10000): Promise<any> {
 const controller = new AbortController();
 const timer = setTimeout(() => controller.abort(), timeoutMs);
 try {
  const response = await fetcher(url, {signal: controller.signal, cache: 'no-store'});
  if (!response.ok) return {};
  const data = await response.json();
  return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
 } catch { return {}; }
 finally { clearTimeout(timer); }
}

export function homeCoreReachable(health: any, catalog: any): boolean {
 return health?.status === 'ok' && Array.isArray(catalog?.tools) && catalog.tools.length > 0;
}

export const HOME_CORE_STATUS = 'Platform health and tool catalog reachable. Individual services may require setup or sign-in.';
