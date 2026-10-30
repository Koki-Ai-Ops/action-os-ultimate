'use strict';
const STORAGE_KEY = 'daily_workbench_v1';
const $$ = (id) => document.getElementById(id);
const MAX_DAYS = 120;
const learning = [
 {title:'GitのブランチとPR',detail:'10分読む・15分で変更差分を確認・5分で要約する。',href:'https://docs.github.com/ja/pull-requests'},
 {title:'TypeScriptの基本',detail:'関数の引数・戻り値・型を理解し、短いコードを読む。',href:'https://www.typescriptlang.org/docs/handbook/intro.html'},
 {title:'Web APIとHTTP',detail:'GET/POST、200/401/429などを架空の例で理解する。',href:'https://developer.mozilla.org/ja/docs/Web/HTTP'},
 {title:'ブラウザのデータ保存',detail:'localStorageの利点と端末変更での消失リスクを理解する。',href:'https://developer.mozilla.org/ja/docs/Web/API/Window/localStorage'},
 {title:'データベースとRLS',detail:'所有者ごとにデータを分離する設計を学ぶ。',href:'https://supabase.com/docs/guides/database/postgres/row-level-security'},
 {title:'自動テストと障害対応',detail:'CI成功と本番実機テストの違いを確認する。',href:'https://docs.github.com/ja/actions'}
];
const initial = () => ({version:1,days:{},links:{os:'',pr:''}});
let state = initial();
let timerEnd = 0, timerRemain = 25*60, timerInterval = null;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const nowTokyo = () => new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
let currentDate = nowTokyo();
function validUrl(raw) {
 if (raw === '') return '';
 if (typeof raw !== 'string' || raw.length > 500) throw Error('長すぎるリンクです。');
 let url;
 try {url = new URL(raw);} catch {throw Error('URLの形式を確認してください。');}
 if (url.protocol !== 'https:' || url.username || url.password || !url.hostname || url.href.length > 500) throw Error('https://で始まる通常のURLだけ登録できます。');
 return url.href;
}
function validTask(s) {return typeof s === 'string' && s.length <= 160;}
function validDay(d){
 if(!d || typeof d !== 'object' || Array.isArray(d))return false;
 return Array.isArray(d.tasks) && d.tasks.length === 3 && d.tasks.every(validTask)
 && Array.isArray(d.done) && d.done.length === 3 && d.done.every(v=>typeof v==='boolean')
 && typeof d.note === 'string' && d.note.length <= 1500 && typeof d.studyDone === 'boolean';
}
function validate(data){
 if(!data || typeof data!=='object' || Array.isArray(data) || data.version!==1 || !data.days || typeof data.days!=='object' || Array.isArray(data.days) || !data.links || typeof data.links!=='object' || Array.isArray(data.links))throw Error('バックアップ形式が違います。');
 const days=Object.entries(data.days);
 if(days.length>MAX_DAYS || days.some(([key,d])=>!DATE_RE.test(key)||!validDay(d)))throw Error('日付・タスクの構造が不正です。');
 return {version:1,days:Object.fromEntries(days.map(([date,d])=>[date,{tasks:[...d.tasks],done:[...d.done],note:d.note,studyDone:d.studyDone}])),links:{os:validUrl(data.links.os||''),pr:validUrl(data.links.pr||'')}};
}
function load(){
 try {
  const raw=localStorage.getItem(STORAGE_KEY);
  if(raw)state=validate(JSON.parse(raw));
 }catch{
  state=initial();
  message('保存済みデータを読み込めませんでした。元のデータは消去していません。','error');
 }
}
function day(){
 if(!state.days[currentDate])state.days[currentDate]={tasks:['','',''],done:[false,false,false],note:'',studyDone:false};
 return state.days[currentDate];
}
function prune(){
 const keys=Object.keys(state.days).sort();
 if(keys.length>MAX_DAYS)for(const key of keys.slice(0,keys.length-MAX_DAYS))delete state.days[key];
}
function save(){
 prune();
 try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));$$('storage-warning').hidden=true;return true;}
 catch{$$('storage-warning').hidden=false;return false;}
}
function message(text,type='info'){
 const el=$$('app-message');el.textContent=text;el.dataset.type=type;
}
function ensureDay(){
 const latest=nowTokyo();
 if(latest!==currentDate){currentDate=latest;render();}
}
function render(){
 const d=day();
 const date=new Date(currentDate+'T12:00:00+09:00');
 $$('today-date').textContent=new Intl.DateTimeFormat('ja-JP',{dateStyle:'full',timeZone:'Asia/Tokyo'}).format(date);
 d.tasks.forEach((t,i)=>{$$('task-'+i).value=t;$$('task-'+i+'-check').checked=d.done[i];});
 $$('day-note').value=d.note;$$('study-done').checked=d.studyDone;
 const count=d.tasks.filter(x=>x.trim()).length+1;
 const done=d.tasks.filter((x,i)=>x.trim()&&d.done[i]).length+Number(d.studyDone);
 $$('progress-count').textContent=done+' / '+count;
 $$('progress-fill').style.width=Math.round(done/count*100)+'%';
 const index=Math.floor(date.getTime()/86400000)%learning.length;
 const l=learning[index];
 $$('learning-title').textContent=l.title;$$('learning-detail').textContent=l.detail;$$('learning-link').href=l.href;
 $$('os-url').value=state.links.os;
 $$('pr-url').value=state.links.pr;
 const os=$$('open-os'),pr=$$('open-pr');
 os.href=state.links.os || 'https://drive.google.com/drive/u/0/my-drive';
 os.textContent=state.links.os?'登録したGoogle経営OSを開く':'Google Driveを開く（未登録）';
 pr.href=state.links.pr || 'https://github.com/pulls';
 pr.textContent=state.links.pr?'登録したGitHubのページを開く':'自分のPR一覧を開く（未登録）';
}
function updateDay(i,value,kind){
 ensureDay();
 const d=day();
 if(kind==='task'){d.tasks[i]=value;if(!value.trim())d.done[i]=false;}
 if(kind==='check')d.done[i]=Boolean(value)&&Boolean(d.tasks[i].trim());
 if(kind==='note')d.note=value;
 if(kind==='study')d.studyDone=Boolean(value);
 save();renderProgressOnly();
}
function renderProgressOnly(){
 const d=day();d.done.forEach((v,i)=>{$$('task-'+i+'-check').checked=v;});
 const total=d.tasks.filter(x=>x.trim()).length+1;
 const completed=d.tasks.filter((x,i)=>x.trim()&&d.done[i]).length+Number(d.studyDone);
 $$('progress-count').textContent=completed+' / '+total;
 $$('progress-fill').style.width=Math.round(completed/total*100)+'%';
}
function saveShortcut(kind){
 const input=$$(kind==='os'?'os-url':'pr-url');
 try{state.links[kind]=validUrl(input.value.trim());const ok=save();render();if(ok)message('ショートカットをこの端末に登録しました。');}
 catch(e){message(e.message,'error');input.focus();}
}
function exportData(){
 const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});
 const link=document.createElement('a');
 const url=URL.createObjectURL(blob);
 link.href=url;link.download='daily-workbench-backup-'+currentDate+'.json';document.body.append(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
 message('JSONファイルを保存しました。安全な場所に保管してください。');
}
async function importFile(event){
 const file=event.target.files?.[0];event.target.value='';if(!file)return;
 try{
  if(file.size>280000)throw Error('ファイルが大きすぎます。');
  const parsed=validate(JSON.parse(await file.text()));
  if(!confirm('現在この端末にある記録を、バックアップの内容で上書きします。元データは保存済みですか？')){message('復元を中止しました。');return;}
  // Commit first, before updating in-memory state.
  localStorage.setItem(STORAGE_KEY,JSON.stringify(parsed));
  state=parsed;$$('storage-warning').hidden=true;render();message('記録を復元しました。');
 }catch(e){message('復元できませんでした：'+e.message,'error');}
}
function clearData(){
 if(!confirm('この端末の全記録とショートカットを削除します。バックアップは取りましたか？'))return;
 const reset=initial();
 try{localStorage.setItem(STORAGE_KEY,JSON.stringify(reset));state=reset;$$('storage-warning').hidden=true;render();message('この端末の記録を消去しました。');}
 catch{$$('storage-warning').hidden=false;message('消去できませんでした。','error');}
}
function timerDisplay(seconds){
 const min=Math.floor(seconds/60).toString().padStart(2,'0');
 const sec=Math.max(0,Math.ceil(seconds%60)).toString().padStart(2,'0');
 $$('timer-display').textContent=min+':'+sec;
}
function stopTimer(){
 if(timerInterval!==null){clearInterval(timerInterval);timerInterval=null;}
 timerRemain=Math.max(0,Math.ceil((timerEnd-Date.now())/1000));
 if(!timerRemain){$$('timer-message').textContent='25分終了です。集中できたことを記録しましょう。';}
 $$('timer-toggle').textContent=timerRemain?'再開':'もう一度';
 timerDisplay(timerRemain);
}
function tick(){
 timerRemain=Math.max(0,Math.ceil((timerEnd-Date.now())/1000));
 timerDisplay(timerRemain);
 if(!timerRemain)stopTimer();
}
function toggleTimer(){
 if(timerInterval!==null){stopTimer();return;}
 if(timerRemain===0)timerRemain=25*60;
 timerEnd=Date.now()+timerRemain*1000;
 timerInterval=setInterval(tick,250);
 $$('timer-toggle').textContent='一時停止';
 $$('timer-message').textContent='まず1つだけに集中しましょう。';
 tick();
}
function resetTimer(){
 if(timerInterval!==null){clearInterval(timerInterval);timerInterval=null;}
 timerRemain=25*60;timerDisplay(timerRemain);
 $$('timer-toggle').textContent='スタート';$$('timer-message').textContent='通知の許可や登録なしで使えます。';
}
load();render();
for(let i=0;i<3;i++){
 $$('task-'+i).addEventListener('input',e=>updateDay(i,e.target.value,'task'));
 $$('task-'+i+'-check').addEventListener('change',e=>updateDay(i,e.target.checked,'check'));
}
$$('day-note').addEventListener('input',e=>updateDay(null,e.target.value,'note'));
$$('study-done').addEventListener('change',e=>updateDay(null,e.target.checked,'study'));
$$('save-os').addEventListener('click',()=>saveShortcut('os'));
$$('save-pr').addEventListener('click',()=>saveShortcut('pr'));
$$('export-data').addEventListener('click',exportData);
$$('import-file').addEventListener('change',importFile);
$$('clear-data').addEventListener('click',clearData);
$$('timer-toggle').addEventListener('click',toggleTimer);
$$('timer-reset').addEventListener('click',resetTimer);
document.addEventListener('visibilitychange',()=>{if(!document.hidden){ensureDay();if(timerInterval!==null)tick();}});
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
