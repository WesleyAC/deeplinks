import { port } from './config';
import { test, expect } from '@playwright/test';

const url = `http://localhost:${port}/tests/e2e.html`;

test('check server is running', async ({ page }) => {
  await page.goto(url);
  await expect(page).toHaveTitle('deeplinks e2e test');
});

async function testHash(page: Page, hash: string, testFn: (Page) => void) {
  console.log(`Testing hash: ${hash}`);
  await page.goto('about:blank');
  await page.goto(url + hash);
  await page.waitForLoadState('domcontentloaded');
  await testFn(page);
}

test('misc', async ({ page }) => {
  const tests = {
    '#1JmqE9nH3Z:121:158': 'valueless until you get the screw out',
    '#1.JmqE9nH3Z:121:158': 'valueless until you get the screw out',
    '#1.JmqE9nH3Z:121.JmqE9nH3Z:158': 'valueless until you get the screw out',
    '#1JmqE9nH3Z:121.JmqE9nH3Z:158': 'valueless until you get the screw out',
    '#1J9W3o85TQ:12.3EdKovNLr:11': '統一碼 💚💙💜🧡💛💚💙💜🧡💛💚💙💜🧡\n\n🐢🐢',
    '#16SHlbtTkC:4.CBcmrfV8L:4': 'links.js e2e',
  };
  page.on('dialog', async () => {
    throw 'Unexpected dialog box';
  });
  for (const hash of Object.keys(tests)) {
    const expected = tests[hash];
    const testFn = async (page) => {
      const selected = await page.evaluate('document.getSelection().toString()');
      expect(selected).toBe(expected);
    };
    await testHash(page, hash, testFn);
  }
});

test('multiselect', async ({ page }, testInfo) => {
  const multiselectKnownGoodBrowsers = ['firefox'];
  const tests = {
    '#193nojgL33:21.3fpc_LoVz:0,3fpc_LoVz:5.VVGZj9Vjq:0': ['bold', 'italic'],
    '#1.J9W3o85TQ:7:15,J9W3o85TQ:16:18,J9W3o85TQ:26.J9W3o85TQ:28,J9W3o85TQ:36:38,3EdKovNLr:0:18,VIMmaQoVW:229.JmqE9nH3Z:10': ['我是少量的統一碼', '💚', '💚', '💚', ' 🐢🐢🐢\n\n', 'unimportant.\n\nRight'],
  };
  page.on('dialog', async (dialog) => {
    if (multiselectKnownGoodBrowsers.includes(testInfo.project.name) || dialog._initializer.message !== 'You opened a link that highlighted multiple selections of text, but your browser does not support this — only the first selection is being shown.') {
      throw 'Unexpected dialog box';
    } else {
      await dialog.dismiss();
    }
  });
  for (const hash of Object.keys(tests)) {
    const expected = tests[hash];
    const testFn = async (page) => {
      const selected = await page.evaluate('document.getSelection().toString()');
      if (multiselectKnownGoodBrowsers.includes(testInfo.project.name)) {
        expect(selected).toBe(expected.join(''));
      } else {
        expect([expected.join(''), expected[0]]).toContain(selected);
      }
      // Even if multiselect wasn't supported, don't rewrite URL
      expect(page.url()).toBe(url + hash);
    };
    await testHash(page, hash, testFn);
  }
});
