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
  await page.waitForFunction(() => document.querySelector('#export-feedback').textContent.includes('復元できません'));
  assert.match(await page.locator('#export-feedback').textContent(), /復元できません/);
  assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('shukyaku-seiricho-v1'))), before);

  // Cancelled replacement must not modify current data.
  page.once('dialog', dialog => dialog.dismiss());
  await page.locator('#import-file').setInputFiles({
    name: 'backup.json', mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(data))
  });
  await page.waitForFunction(() => document.querySelector('#export-feedback').textContent.includes('中止しました'));
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
  // CSV is intentionally one-way and must not treat user text as formulas.
  await page.locator('#draft-text').fill('=1+1');
  await page.locator('#use-draft').click();
  const csvDownloading = page.waitForEvent('download');
  await page.locator('#export-csv').click();
  const csvFile = await csvDownloading;
  assert.match(csvFile.suggestedFilename(), /^shukyaku-seiricho-history-\d{4}-\d{2}-\d{2}\.csv$/);
  const csvText = await readFile(await csvFile.path(), 'utf8');
  assert.match(csvText, /^\uFEFF"日時","業種"/, 'CSV must be Japanese Excel-compatible');
  assert.match(csvText, /架空カフェE2E/, 'CSV must contain stored history');
  assert.match(csvText, /"'=1\+1"/, 'CSV must neutralize spreadsheet formula injection');

  // Simulated denied localStorage writes must never silently look like persisted data.
  await page.evaluate(() => {
    window.__originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = () => { throw new Error('storage denied for test'); };
  });
  await page.locator('#user-note').fill('保存失敗テスト');
  assert.equal(await page.locator('#storage-warning').isVisible(), true, 'failed writes must be visible');
  await page.evaluate(() => { Storage.prototype.setItem = window.__originalSetItem; });
  await page.locator('#user-note').fill('復帰後の保存');
  assert.equal(await page.locator('#storage-warning').isHidden(), true, 'successful writes clear warning');
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('shukyaku-seiricho-v1')).current.note), '復帰後の保存');

  assert.deepEqual(errors, [], 'no runtime errors');

  console.log('Public 集客整理帳 export E2E passed: empty state, edited data, JSON file, persistence, mobile viewport.');
} finally {
  await browser.close();
}
