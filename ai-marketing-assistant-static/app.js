const ROLES=[
 {name:'戦略',text:'目標から今日やる1つを決める'},
 {name:'調査',text:'顧客の悩みと競合との差を整理'},
 {name:'SEO',text:'検索・質問される言葉を整理'},
 {name:'コンテンツ',text:'投稿の骨子と表現を作る'},
 {name:'SNS',text:'短く伝わる投稿案にする'},
 {name:'分析',text:'承認理由と反応から改善する'}
];
const DEFAULT_STATE={
 profile:{industry:'飲食店',storeName:'サンプル店舗',goal:'新規客'},
 agents:ROLES.map((r,i)=>({...r,status:i===0?'done':'waiting'})),
 priority:'近隣客向けに「今日来る理由」を1投稿にまとめる',
 content:[
  {id:1,status:'review',channel:'Instagram / TikTok',title:'今日のおすすめ投稿',body:'今日のおすすめを1つだけ、写真と短い理由で紹介します。価格・営業時間など事実情報は店舗側で確認してから公開してください。',reason:''},
  {id:2,status:'review',channel:'X',title:'短文案',body:'今日は「初めての方が選びやすい1つ」を紹介。迷ったらスタッフに気軽に聞けることも添えます。',reason:''}
 ],
 learnings:[]
};
let state=loadState();
let currentStatus='review';

function loadState(){try{return JSON.parse(localStorage.getItem('ai-marketing-assistant-state'))||structuredClone(DEFAULT_STATE)}catch{return structuredClone(DEFAULT_STATE)}}
function save(){localStorage.setItem('ai-marketing-assistant-state',JSON.stringify(state))}
function sampleFor(industry,goal,name){
 const store=name||`サンプル${industry}`;
 const actionMap={
  新規客:`${store}を初めて知る人向けに、入口・人気商品・来店しやすさのどれか1つを投稿する`,
  リピート:`以前来た人が思い出せるよう、今週だけのおすすめや季節の変化を1つ投稿する`,
  SNS反応:`保存や返信がしやすい「A/Bどっち？」形式の投稿を1本出す`,
  来店予約:`予約前の不安を1つ選び、所要時間・予約方法・おすすめ対象を短く説明する`
 };
 const postMap={
  飲食店:`「今日はこれ」で選びやすく。写真1枚＋おすすめ理由＋営業時間だけに絞る。`,
  美容院:`仕上がりだけでなく「どんな人に向くか」を一言入れ、予約前の不安を減らす。`,
  小売:`商品名より先に「誰のどんな場面に役立つか」を1文で伝える。`,
  その他:`サービス名だけでなく「どんな悩みの人向けか」を最初の1文で伝える。`
 };
 return {action:actionMap[goal],post:postMap[industry],improve:`次回は「見られた数」ではなく、${goal==='SNS反応'?'保存・返信':goal==='来店予約'?'予約につながった反応':'来店につながる反応'}を1つだけ記録する。`};
}
function renderRoleGrid(){document.getElementById('agent-role-grid').innerHTML=ROLES.map((r,i)=>`<article class="agent-role"><small>0${i+1}</small><b>${r.name}</b><p>${r.text}</p></article>`).join('')}
function showView(name){document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));document.getElementById(`view-${name}`).classList.add('active');window.scrollTo({top:0,behavior:'smooth'});renderAll()}
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));

document.getElementById('demo-form').addEventListener('submit',e=>{e.preventDefault();const industry=document.getElementById('industry').value;const goal=document.getElementById('goal').value;const storeName=document.getElementById('storeName').value.trim();const s=sampleFor(industry,goal,storeName);state.profile={industry,goal,storeName:storeName||`サンプル${industry}`};state.priority=s.action;state.agents=ROLES.map((r,i)=>({...r,status:i===0?'done':'waiting'}));state.content=[{id:Date.now(),status:'review',channel:'Instagram / TikTok',title:'無料デモ投稿案',body:s.post,reason:''},{id:Date.now()+1,status:'review',channel:'X',title:'改善確認用の短文案',body:`${s.action}。公開前に価格・営業時間・予約条件など事実情報を確認してください。`,reason:''}];save();renderDemoResult(s);runAgents();renderAll()});
function renderDemoResult(s){const el=document.getElementById('demo-result');el.classList.remove('hidden');el.innerHTML=`<div class="eyebrow light">サンプル結果</div><h3>${state.profile.storeName}向け</h3><div class="result-grid"><div class="result-item"><small>今日やる1つ</small><p>${s.action}</p></div><div class="result-item"><small>SNS投稿案1つ</small><p>${s.post}</p></div><div class="result-item"><small>改善ポイント1つ</small><p>${s.improve}</p></div></div><p class="muted">この結果はサンプルです。自動投稿・決済・外部送信は行いません。</p><button class="btn primary" onclick="showView('agents')">6担当の流れを見る</button>`}
function runAgents(){let i=0;state.agents=ROLES.map(r=>({...r,status:'waiting'}));save();const timer=setInterval(()=>{state.agents=state.agents.map((r,idx)=>({...r,status:idx<i?'done':idx===i?'running':'waiting'}));if(i>=ROLES.length){state.agents=state.agents.map(r=>({...r,status:'done'}));clearInterval(timer)}i++;save();renderAgents();renderDashboard()},450)}
document.getElementById('run-agents').addEventListener('click',runAgents);
function renderAgents(){document.getElementById('agents-list').innerHTML=state.agents.map((r,i)=>`<div class="agent-row"><div class="agent-num">0${i+1}</div><div><b>${r.name}</b><div class="muted">${r.text}</div></div><span class="status ${r.status}">${r.status==='done'?'完了':r.status==='running'?'処理中':'待機'}</span></div>`).join('')}
function renderDashboard(){const done=state.agents.filter(a=>a.status==='done').length,review=state.content.filter(c=>c.status==='review').length,approved=state.content.filter(c=>c.status==='approved').length;document.getElementById('dashboard-stats').innerHTML=statsHtml([['AI担当の完了',`${done} / 6`],['承認待ち',`${review}件`],['承認済み',`${approved}件`],['保存場所','この端末']]);document.getElementById('priority-action').innerHTML=`<p><b>${state.priority}</b></p><p class="muted">完了条件：投稿案を1つ確認し、使う/使わないを判断する。</p><button class="btn primary" onclick="showView('content')">投稿案を確認</button>`}
function statsHtml(items){return items.map(([l,v])=>`<div class="stat"><small>${l}</small><b>${v}</b></div>`).join('')}
document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>{currentStatus=b.dataset.status;document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x===b));renderContent()}));
function renderContent(){const items=state.content.filter(c=>c.status===currentStatus);document.getElementById('content-list').innerHTML=items.length?items.map(c=>`<article class="content-card"><small>${c.channel}</small><h3>${c.title}</h3><textarea id="body-${c.id}" ${c.status!=='review'?'disabled':''}>${escapeHtml(c.body)}</textarea>${c.status==='review'?`<input class="decision-reason" id="reason-${c.id}" placeholder="承認/却下理由（任意）"><div class="content-actions"><button class="btn approve" onclick="decide(${c.id},'approved')">承認する</button><button class="btn reject" onclick="decide(${c.id},'rejected')">却下する</button><button class="btn" onclick="copyContent(${c.id})">コピー</button></div>`:`<p class="muted">判断理由：${escapeHtml(c.reason||'記入なし')}</p>`}</article>`).join(''):'<div class="card">該当する投稿案はありません。</div>'}
function escapeHtml(s){return String(s).replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]))}
window.decide=function(id,status){const c=state.content.find(x=>x.id===id);if(!c)return;c.body=document.getElementById(`body-${id}`).value;c.reason=document.getElementById(`reason-${id}`).value;c.status=status;state.learnings.unshift({text:`${status==='approved'?'承認':'却下'}：${c.reason||c.title}`,date:new Date().toLocaleDateString('ja-JP')});save();renderAll()}
window.copyContent=async function(id){const c=state.content.find(x=>x.id===id);await navigator.clipboard.writeText(document.getElementById(`body-${id}`).value);alert('コピーしました。自動投稿はされません。')}
function renderAnalytics(){const approved=state.content.filter(c=>c.status==='approved').length,rejected=state.content.filter(c=>c.status==='rejected').length,decided=approved+rejected,rate=decided?Math.round(approved/decided*100):0;document.getElementById('analytics-stats').innerHTML=statsHtml([['表示数（デモ）',approved*180],['クリック（デモ）',approved*12],['反応（デモ）',approved*3],['承認率',`${rate}%`]]);document.getElementById('decision-summary').innerHTML=`<p>生成された投稿案：<b>${state.content.length}件</b></p><p>承認済み：<b>${approved}件</b></p><p>承認待ち：<b>${state.content.filter(c=>c.status==='review').length}件</b></p>`;document.getElementById('learning-list').innerHTML=state.learnings.length?state.learnings.slice(0,5).map(l=>`<div class="learning"><b>${escapeHtml(l.date)}</b><div>${escapeHtml(l.text)}</div></div>`).join(''):'<p class="muted">まだ判断履歴はありません。</p>'}
function renderAll(){renderDashboard();renderAgents();renderContent();renderAnalytics()}
renderRoleGrid();renderAll();
