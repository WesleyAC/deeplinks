import { test, expect } from '@playwright/test';
import connect from 'connect';
import serveStatic from 'serve-static';

const port = 25381;
const url = `http://localhost:${port}/tests/e2e.html`;

test.beforeAll(() => {
  connect()
    .use(serveStatic(`${__dirname}/../`))
    .listen(port);
});

test('check server is running', async ({ page }) => {
  await page.goto(url);
  await expect(page).toHaveTitle('deeplinks e2e test');
});

test('misc', async ({ page }) => {
  const tests = {
    '#1JmqE9nH3Z:121:158': 'valueless until you get the screw out',
    '#1.JmqE9nH3Z:121:158': 'valueless until you get the screw out',
    '#1.JmqE9nH3Z:121.JmqE9nH3Z:158': 'valueless until you get the screw out',
    '#1JmqE9nH3Z:121.JmqE9nH3Z:158': 'valueless until you get the screw out',
    '#1J9W3o85TQ:12.3EdKovNLr:11': '統一碼 💚💙💜🧡💛💚💙💜🧡💛💚💙💜🧡\n\n🐢🐢',
    '#16SHlbtTkC:4.CBcmrfV8L:4': 'links.js e2e',
  };
  for (const hash of Object.keys(tests)) {
    await page.goto('about:blank');
    await page.goto(url + hash);
    await page.waitForEvent('domcontentloaded');
    const selected = await page.evaluate('document.getSelection().toString()');
    expect(selected).toBe(tests[hash]);
  }
});
