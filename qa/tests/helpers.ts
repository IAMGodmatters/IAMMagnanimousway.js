import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import type { Page } from '@playwright/test';

export type RuntimeProblem = { type: 'pageerror' | 'console'; message: string };

const pageFilePattern = /^page\.(tsx|ts|jsx|js)$/;

function cleanRoute(segments: string[]): string | null {
  const clean = segments.filter((segment) => {
    if (!segment) return false;
    if (segment.startsWith('(') && segment.endsWith(')')) return false;
    if (segment.startsWith('@')) return false;
    return true;
  });
  if (clean.some((segment) => segment.includes('[') || segment.includes(']'))) return null;
  const route = '/' + clean.join('/');
  return route === '//' ? '/' : route;
}

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

export function discoverStaticRoutes(): string[] {
  const appDir = path.resolve(process.cwd(), '../frontend/app');
  const routes = new Set<string>();

  for (const file of walk(appDir)) {
    if (!pageFilePattern.test(path.basename(file))) continue;
    const relDir = path.relative(appDir, path.dirname(file));
    const route = cleanRoute(relDir === '' ? [] : relDir.split(path.sep));
    if (route) routes.add(route);
  }

  routes.add('/');
  return [...routes].sort();
}

export function discoverStaticRoutesFromGitRef(ref: string): string[] | null {
  try {
    const output = execFileSync('git', ['ls-tree', '-r', '--name-only', ref, '--', 'frontend/app'], {
      cwd: path.resolve(process.cwd(), '..'),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    const routes = new Set<string>();
    for (const raw of output.split(/\r?\n/)) {
      const file = raw.trim();
      if (!file || !pageFilePattern.test(path.posix.basename(file))) continue;
      const rel = file.replace(/^frontend\/app\/?/, '');
      const relDir = path.posix.dirname(rel);
      const route = cleanRoute(relDir === '.' ? [] : relDir.split('/'));
      if (route) routes.add(route);
    }
    routes.add('/');
    return [...routes].sort();
  } catch {
    return null;
  }
}

export function watchRuntime(page: Page) {
  const problems: RuntimeProblem[] = [];
  page.on('pageerror', (error) => problems.push({ type: 'pageerror', message: error.message }));
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    if (/favicon|third[- ]party cookie|failed to load resource.*404/i.test(text)) return;
    if (/hydration|uncaught|typeerror|referenceerror|syntaxerror|failed to fetch/i.test(text)) {
      problems.push({ type: 'console', message: text });
    }
  });
  return problems;
}

export function isSameOriginHref(href: string, baseURL: string): boolean {
  try {
    const url = new URL(href, baseURL);
    return url.origin === new URL(baseURL).origin;
  } catch {
    return false;
  }
}

export function normalizeInternalPath(href: string, baseURL: string): string | null {
  try {
    const url = new URL(href, baseURL);
    if (url.origin !== new URL(baseURL).origin) return null;
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    if (url.pathname.startsWith('/_next/')) return null;
    return `${url.pathname}${url.search}` || '/';
  } catch {
    return null;
  }
}
