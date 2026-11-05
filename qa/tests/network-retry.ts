import type { APIRequestContext, APIResponse, Page, RequestOptions, Response } from '@playwright/test';

const transientStatuses = new Set([429, 502, 503, 504]);
const backoffMs = [1_000, 2_000, 4_000];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isTransientStatus(status: number) {
  return transientStatuses.has(status);
}

export async function gotoWithBackoff(page: Page, url: string, waitUntil: 'domcontentloaded' | 'load' = 'domcontentloaded'): Promise<Response | null> {
  let response: Response | null = null;
  for (let attempt = 0; attempt <= backoffMs.length; attempt += 1) {
    response = await page.goto(url, { waitUntil });
    if (!response || !isTransientStatus(response.status())) return response;
    if (attempt < backoffMs.length) await page.waitForTimeout(backoffMs[attempt]);
  }
  return response;
}

export async function requestWithBackoff(
  request: APIRequestContext,
  url: string,
  options: RequestOptions = {},
): Promise<APIResponse> {
  let response: APIResponse | null = null;
  for (let attempt = 0; attempt <= backoffMs.length; attempt += 1) {
    response = await request.fetch(url, options);
    if (!isTransientStatus(response.status())) return response;
    if (attempt < backoffMs.length) await sleep(backoffMs[attempt]);
  }
  return response!;
}
