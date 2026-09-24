import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const TARGET_URL = process.env.TARGET_URL || 'http://127.0.0.1:4173';
const STORAGE_KEY = 'action_os_ultimate_v1';
const marker = `E2E-${Date.now()}`;

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

try {
  await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });

  await page.evaluate((key) => localStorage.removeItem(key), STORAGE_KEY);
  await page.reload({ waitUntil: 'domcontentloaded' });

  // Follow the same path as a real user: Home -> Analysis.
  await page.locator('[data-view="create"]').click();
  await page.locator('#mainInput').waitFor({ state: 'visible', timeout: 10_000 });
  await page.locator('#mainInput').fill(`${marker} 重要な事業タスクを今日中に整理して、次の一手を決めたい。`);
  await page.locator('#tagsInput').fill('e2e, regression');
  await page.locator('#analyzeBtn').click();

  const resultCard = page.locator('#resultCard');
  await resultCard.waitFor({ state: 'visible', timeout: 10_000 });
  const resultText = await resultCard.innerText();
  assert.ok(resultText.trim().length > 20, 'analysis result should render meaningful content');

  await page.locator('#saveBtn').click();

  const saved = await page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  }, STORAGE_KEY);
  assert.ok(saved && Array.isArray(saved.items), 'saved state should contain items array');
  assert.equal(saved.items.length, 1, 'one analyzed item should be persisted');

  await page.locator('[data-view="library"]').click();
  await page.locator('#libraryList').waitFor({ state: 'visible' });
  const libraryText = await page.locator('#libraryList').innerText();
  assert.ok(libraryText.trim().length > 0, 'saved item should render in library');
  assert.doesNotMatch(libraryText, /保存した分析はありません|データがありません/, 'library should not be empty after save');

  await page.locator('[data-view="settings"]').click();

  // A broken/hostile JSON backup must not alter an already saved item.
  const corrupted = [
    { version: 1, items: [{ ...saved.items[0], tags: 'not-an-array' }] },
    { version: 1, items: [saved.items[0], saved.items[0]] },
    { version: 999, items: [saved.items[0]] },
  ];
  for (const [index, payload] of corrupted.entries()) {
    await page.locator('#importInput').setInputFiles({
      name: `invalid-${index}.json`,
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(payload), 'utf8'),
    });
    await page.getByText('バックアップ形式が正しくありません。現在のデータは変更していません').waitFor({ state: 'visible', timeout: 5000 });
    const preserved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), STORAGE_KEY);
    assert.deepEqual(preserved.items, saved.items, 'invalid backup must not mutate existing data');
  }
  console.log('ACTION_OS_INVALID_BACKUP_PRESERVES_DATA_OK');

  const downloadPromise = page.waitForEvent('download');
  await page.locator('#exportBtn').click();
  const download = await downloadPromise;
  const path = await download.path();
  assert.ok(path, 'JSON export should produce a downloadable file');

  await page.reload({ waitUntil: 'domcontentloaded' });
  const persisted = await page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  }, STORAGE_KEY);
  assert.equal(persisted?.items?.length, 1, 'saved data should survive reload');

  // Backup is only useful if recovery works after a destructive action.
  await page.locator('[data-view="settings"]').click();
  page.on('dialog', async dialog => dialog.accept());
  await page.locator('#clearAllBtn').click();
  await page.waitForFunction((key) => {
    const raw = localStorage.getItem(key);
    if (!raw) return true;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed.items) && parsed.items.length === 0;
    } catch {
      return false;
    }
  }, STORAGE_KEY);

  await page.locator('#importInput').setInputFiles(path);
  await page.waitForFunction((key) => {
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed.items) && parsed.items.length === 1;
    } catch {
      return false;
    }
  }, STORAGE_KEY);

  await page.locator('[data-view="library"]').click();
  const restoredLibraryText = await page.locator('#libraryList').innerText();
  assert.doesNotMatch(restoredLibraryText, /保存した分析はありません|データがありません/, 'import should restore library data');

  await page.locator('[data-view="test"]').click();
  await page.locator('#runTestsBtn').click();
  const summary = page.locator('#testSummary');
  await summary.waitFor({ state: 'visible' });
  const summaryText = await summary.innerText();
  assert.ok(summaryText.trim().length > 0, 'in-app self-test should produce a summary');
  assert.doesNotMatch(summaryText, /FAIL|失敗/i, 'in-app self-test should not report failure');

  console.log('Action OS browser E2E passed: mobile navigation, analyze, save, library, invalid backup rejection without data loss, export, reload persistence, clear-all, backup restore, and in-app self-test.');
} finally {
  await browser.close();
}
