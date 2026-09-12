import { test, expect } from '@playwright/test';

test('voice transcript auto-sends, ignores late recognition errors, and speaks the reply', async ({ page }) => {
  await page.addInitScript(() => {
    class FakeUtterance {
      text: string;
      voice: any = null;
      rate = 1;
      pitch = 1;
      volume = 1;
      onstart: null | (() => void) = null;
      onend: null | (() => void) = null;
      onerror: null | (() => void) = null;
      constructor(text: string) { this.text = text; }
    }

    class FakeRecognition {
      lang = 'en-US';
      interimResults = true;
      continuous = false;
      maxAlternatives = 1;
      onstart: null | (() => void) = null;
      onend: null | (() => void) = null;
      onerror: null | ((event: any) => void) = null;
      onresult: null | ((event: any) => void) = null;
      start() {
        window.setTimeout(() => {
          this.onstart?.();
          const result: any = [{ transcript: 'Hey how are you doing today tell me something about yourself' }];
          result.isFinal = true;
          this.onresult?.({ resultIndex: 0, results: [result] });
          // Mobile WebKit can report a terminal recognition error after a usable final result.
          this.onerror?.({ error: 'no-speech' });
          this.onend?.();
        }, 20);
      }
      stop() { this.onend?.(); }
    }

    const spoken: string[] = [];
    Object.defineProperty(window, '__iamSpoken', { value: spoken, configurable: true });
    Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: FakeUtterance, configurable: true });
    Object.defineProperty(window, 'webkitSpeechRecognition', { value: FakeRecognition, configurable: true });
    Object.defineProperty(window, 'SpeechRecognition', { value: FakeRecognition, configurable: true });
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        paused: false,
        getVoices: () => [{ name: 'QA Natural Voice', lang: 'en-US' }],
        cancel: () => {},
        resume: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        speak: (utterance: FakeUtterance) => {
          spoken.push(utterance.text);
          window.setTimeout(() => {
            utterance.onstart?.();
            utterance.onend?.();
          }, 5);
        }
      }
    });
  });

  await page.route('**/api/magnanimous/health', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) }));
  await page.route('**/api/chat', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ answer: 'I am doing well. I am Magnanimous AI, here to help you think, create, research, and get things done.' })
    });
  });

  await page.goto('/magnanimous', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /Talk to Magnanimous AI/i }).click();

  await expect(page.locator('.mag-message.user .mag-bubble p')).toContainText('Hey how are you doing today');
  await expect(page.locator('.mag-compose textarea')).toHaveValue('');
  await expect(page.locator('.voice-notice')).not.toContainText(/could not hear that clearly/i);
  await expect(page.locator('.mag-message.assistant .mag-bubble p').last()).toContainText('I am doing well');

  await expect.poll(async () => page.evaluate(() => ((window as any).__iamSpoken as string[]).filter(text => text.trim()))).toContain('I am doing well. I am Magnanimous AI, here to help you think, create, research, and get things done.');
});
