import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const BASE=process.env.TARGET_URL || 'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},acceptDownloads:true});
const errors=[];
page.on('pageerror',e=>errors.push(String(e)));
try{
 await page.goto(BASE+'/daily/',{waitUntil:'domcontentloaded'});
 await page.evaluate(()=>localStorage.removeItem('daily_workbench_v1'));
 await page.reload({waitUntil:'domcontentloaded'});
 await page.locator('#hero-title').waitFor({state:'visible'});
 assert.equal(await page.locator('#progress-count').innerText(),'0 / 1');

 await page.locator('#task-0').fill('本日のテストタスク');
 await page.locator('#task-0-check').check();
 await page.locator('#day-note').fill('個人データは送信しないテスト');
 await page.locator('#study-done').check();
 assert.equal(await page.locator('#progress-count').innerText(),'2 / 2');
 await page.reload({waitUntil:'domcontentloaded'});
 assert.equal(await page.locator('#task-0').inputValue(),'本日のテストタスク');
 assert.equal(await page.locator('#task-0-check').isChecked(),true);
 assert.equal(await page.locator('#day-note').inputValue(),'個人データは送信しないテスト');
 assert.equal(await page.locator('#study-done').isChecked(),true);

 await page.locator('#os-url').fill('javascript:alert(1)');
 await page.locator('#save-os').click();
 assert.match(await page.locator('#app-message').innerText(),/https/);
 assert.equal(await page.locator('#open-os').getAttribute('href'),'https://drive.google.com/drive/u/0/my-drive');
 await page.locator('#os-url').fill('https://docs.google.com/spreadsheets/d/example-test/edit');
 await page.locator('#save-os').click();
 assert.equal(await page.locator('#open-os').getAttribute('href'),'https://docs.google.com/spreadsheets/d/example-test/edit');
 await page.locator('#pr-url').fill('https://github.com/pulls');
 await page.locator('#save-pr').click();

 await page.evaluate(()=>{window.originalSetItem=Storage.prototype.setItem; Storage.prototype.setItem=()=>{throw Error('storage denied');};});
 await page.locator('#day-note').fill('書き込みを拒否した場合');
 assert.equal(await page.locator('#storage-warning').isVisible(),true);
 await page.evaluate(()=>{Storage.prototype.setItem=window.originalSetItem;});
 await page.locator('#day-note').fill('保存を再開した');
 assert.equal(await page.locator('#storage-warning').isHidden(),true);

 const event=page.waitForEvent('download');
 await page.locator('#export-data').click();
 const dl=await event;
 const path=await dl.path();
 assert(path,'backup must be downloadable');
 const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('daily_workbench_v1')));
 assert.equal(before.days[Object.keys(before.days)[0]].note,'保存を再開した');
 await page.locator('#import-file').setInputFiles({name:'wrong.json',mimeType:'application/json',buffer:Buffer.from('{"version":1,"days":{"2026-10-30":{"tasks":"oops"}},"links":{}}')});
 await page.waitForFunction(() => document.getElementById('app-message').textContent.includes('復元できません'));
 const afterInvalid=await page.evaluate(()=>JSON.parse(localStorage.getItem('daily_workbench_v1')));
 assert.deepEqual(afterInvalid,before);

 page.once('dialog',d=>d.dismiss());
 await page.locator('#clear-data').click();
 assert.equal(await page.locator('#task-0').inputValue(),'本日のテストタスク');
 page.once('dialog',d=>d.accept());
 await page.locator('#clear-data').click();
 assert.equal(await page.locator('#task-0').inputValue(),'');
 page.once('dialog',d=>d.accept());
 await page.locator('#import-file').setInputFiles(path);
 await page.waitForFunction(()=>document.getElementById('task-0').value==='本日のテストタスク');
 assert.equal(await page.locator('#day-note').inputValue(),'保存を再開した');

 await page.locator('#timer-toggle').click();
 assert.equal(await page.locator('#timer-toggle').innerText(),'一時停止');
 await page.locator('#timer-toggle').click();
 assert.equal(await page.locator('#timer-toggle').innerText(),'再開');
 await page.locator('#timer-reset').click();
 assert.equal(await page.locator('#timer-display').innerText(),'25:00');

 const links=page.locator('.tool a[target="_blank"]');
 assert.equal(await links.count(),7);
 for(let i=0;i<await links.count();i++){
  assert.equal(await links.nth(i).getAttribute('rel'),'noopener noreferrer');
 }
 const diagram=await page.request.get(BASE+'/daily/google-os-flow.excalidraw');
 assert(diagram.ok());
 const scene=JSON.parse(await diagram.text());
 assert.equal(scene.type,'excalidraw');
 assert(scene.elements.length>=9);
 const manifest=await page.request.get(BASE+'/daily/manifest.webmanifest');
 assert(manifest.ok());

 const scrollWidth=await page.evaluate(()=>document.documentElement.scrollWidth);
 assert(scrollWidth<=391,'mobile horizontal overflow: '+scrollWidth);
 assert.deepEqual(errors,[],'no JavaScript runtime errors');
 console.log('DAILY_WORKBENCH_E2E_PASS: tasks, study, persistence, storage failures, URLs, export, import validation, cancel, timer, links, mobile.');
} finally {await browser.close();}
