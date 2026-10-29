import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const base = process.env.TARGET_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
const errors = [];
page.on('pageerror', (error) => errors.push(String(error)));
try {
  await page.goto(base + '/site/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.removeItem('shukyaku-seiricho-v1'));
  await page.reload({ waitUntil: 'domcontentloaded' });

  assert.equal(await page.locator('#export-history').isHidden(), true, 'no export without data');
  await page.locator('#store-name').fill('架空カフェE2E');
  await page.locator('#note-form button[type=submit]').click();
  await page.locator('#draft-text').fill('架空の限定メニューを紹介します。');
  await page.locator('#user-note').fill('テスト用メモ');
  await page.locator('#use-draft').click();

  const before = await page.evaluate(() => JSON.parse(localStorage.getItem('shukyaku-seiricho-v1')));
  assert.equal(before.history.length, 1);
  assert.equal(await page.locator('#export-history').isVisible(), true);

  const downloading = page.waitForEvent('download');
  await page.locator('#export-history').click();
  const download = await downloading;
  assert.match(download.suggestedFilename(), /^shukyaku-seiricho-backup-\d{4}-\d{2}-\d{2}\.json$/);
  const downloadedPath = await download.path();
  assert.ok(downloadedPath);
  const data = JSON.parse(await readFile(downloadedPath, 'utf8'));
  assert.equal(data.format, 'shukyaku-seiricho-backup');
  assert.equal(data.version, 1);
  assert.ok(!Number.isNaN(Date.parse(data.exportedAt)));
  assert.deepEqual(data.history, before.history, 'export must preserve edited history exactly');
  assert.deepEqual(data.current, before.current, 'export must preserve current note');
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem('shukyaku-seiricho-v1')));
  assert.deepEqual(after, before, 'export must never alter data');

  // Reject a syntactically valid but unsafe backup without mutating user data.
  const malformed = { ...data, history: [{ ...data.history[0], status: 'unexpected' }] };
  await page.locator('#import-file').setInputFiles({
    name: 'malformed.json', mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(malformed))
  });
  assert.match(await page.locator('#export-feedback').textContent(), /復元できません/);
  assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('shukyaku-seiricho-v1'))), before);

  // Cancelled replacement must not modify current data.
  page.once('dialog', dialog => dialog.dismiss());
  await page.locator('#import-file').setInputFiles({
    name: 'backup.json', mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(data))
  });
  assert.match(await page.locator('#export-feedback').textContent(), /中止しました/);
  assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('shukyaku-seiricho-v1'))), before);

  // Recover deleted browser-local data from the downloaded JSON.
  await page.evaluate(() => localStorage.removeItem('shukyaku-seiricho-v1'));
  await page.reload({ waitUntil: 'domcontentloaded' });
  assert.equal(await page.locator('#history-list article').count(), 0);
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#import-file').setInputFiles({
    name: 'backup.json', mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(data))
  });
  await page.waitForFunction(() => {
    const saved = JSON.parse(localStorage.getItem('shukyaku-seiricho-v1') || '{}');
    return saved.history && saved.history.length === 1;
  });
  assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('shukyaku-seiricho-v1'))), before);
  assert.equal(await page.locator('#history-list article').count(), 1);

  await page.reload({ waitUntil: 'domcontentloaded' });
  assert.equal(await page.locator('#history-list article').count(), 1, 'history survives reload');
  assert.deepEqual(errors, [], 'no runtime errors');

  console.log('Public 集客整理帳 export E2E passed: empty state, edited data, JSON file, persistence, mobile viewport.');
} finally {
  await browser.close();
}
