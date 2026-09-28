/* 集客整理帳 — 外部APIや自動投稿を使わない、小さなお店の投稿整理ツール */
'use strict';

const KEY = 'shukyaku-seiricho-v1';
const $ = id => document.getElementById(id);

const PLANS = {
  '飲食店': {
    '新規客': {
      action: '看板メニューを1品選び、写真と価格を添えて紹介する。',
      draft: 'はじめての方へ。今日は当店の［メニュー名］をご紹介します。\n\n［味や特徴を一言で］\n価格：［税込価格］\n営業時間：［営業時間］\n\n気になる方は、ぜひお立ち寄りください。',
      measure: '新規のお客さまから、そのメニューについて質問があったか。'
    },
    'リピート': {
      action: '常連さんに勧めたい今週の一品を紹介する。',
      draft: 'いつもありがとうございます。\n今週は［おすすめメニュー］をご用意しています。\n\n［季節感・前回との違いを一言］\nご提供期間：［期間］\n\nまたお会いできるのを楽しみにしています。',
      measure: '以前来てくださった方からの反応や再来店があったか。'
    },
    'SNS反応': {
      action: '人気メニュー2品を並べた写真で、選びやすい質問を1つ投稿する。',
      draft: '今日の気分はどちらですか？\n\nA：［メニューA］\nB：［メニューB］\n\nよかったらコメントで教えてください。\n※写真とメニュー名は実際のものに差し替えてください。',
      measure: 'コメント数よりも、実際に回答してくれた人の反応を見る。'
    },
    '予約・申込': {
      action: '予約方法と空き状況を、写真1枚に添えて伝える。',
      draft: 'お席のご案内です。\n\n［対象日・時間帯］のご予約について、［実際の空き状況］をご案内します。\nご予約方法：［電話・公式サイトなど］\n\nご不明点はお気軽にお問い合わせください。',
      measure: '投稿後に予約や問い合わせがあったか。空き状況は公開前に再確認する。'
    }
  },
  '美容院': {
    '新規客': {
      action: '初めての方向けに、メニュー1つと所要時間を紹介する。',
      draft: 'はじめてご利用の方へ。\n当店の［メニュー名］をご案内します。\n\n施術内容：［内容を一言］\n所要時間：［目安］\n料金：［税込料金］\nご予約：［方法］\n\n気になることがあれば事前にご相談ください。',
      measure: '初回の方から料金・所要時間についての問い合わせがあったか。'
    },
    'リピート': {
      action: '再来店のきっかけになる季節のメニューを1つ紹介する。',
      draft: 'いつもありがとうございます。\n今月は［季節のメニューやケア］をご案内しています。\n\n［内容・所要時間］\n［予約方法］\n\n次回のご予定を考える際の参考にしてください。',
      measure: '以前の利用者から予約や質問があったか。'
    },
    'SNS反応': {
      action: '普段のケアに関する、答えやすい二択の質問を投稿する。',
      draft: '日ごろのケアについて教えてください。\n\nA：［選択肢A］\nB：［選択肢B］\n\nよかったらコメントでお聞かせください。\n次回の投稿づくりの参考にします。',
      measure: '回答内容から、次に知りたいテーマが見つかったか。'
    },
    '予約・申込': {
      action: '予約前に気になる情報を、1投稿にまとめて伝える。',
      draft: 'ご予約を検討中の方へ。\n\n対象メニュー：［名前］\n所要時間：［目安］\n料金：［税込料金］\nご予約方法：［方法］\n\nご質問があれば、事前にお問い合わせください。',
      measure: 'この投稿のあとに予約や事前相談があったか。'
    }
  },
  '小売': {
    '新規客': {
      action: '初めての方にも伝わる定番商品を1つ、使用場面と一緒に紹介する。',
      draft: 'はじめての方にも手に取っていただきたい一品。\n\n商品：［商品名］\n使いどころ：［具体的な場面］\n価格：［税込価格］\n取扱い：［店頭・通販など］\n\n気になることがあればお気軽にどうぞ。',
      measure: '商品名を指定した問い合わせや、初めての購入があったか。'
    },
    'リピート': {
      action: '以前購入した方にも役立つ、定番品の使い方を紹介する。',
      draft: 'いつもありがとうございます。\n今日は［定番商品］の［使い方・楽しみ方］をご紹介します。\n\n［具体的な一工夫］\n現在の取扱い：［在庫・販売方法］\n\nご来店の際はぜひご覧ください。',
      measure: '再購入や使い方についての質問があったか。'
    },
    'SNS反応': {
      action: '商品2つの写真を並べ、好みを聞く投稿を1本出す。',
      draft: 'どちらを選びますか？\n\nA：［商品A］\nB：［商品B］\n\nそれぞれの特徴：［短い説明］\nコメントで教えていただけるとうれしいです。',
      measure: 'どの特徴についてのコメントが多かったか。'
    },
    '予約・申込': {
      action: '問い合わせ・取り置き方法を、商品1つと一緒に案内する。',
      draft: '［商品名］についてのご案内です。\n\n価格：［税込価格］\n在庫：［確認時点の状況］\nお問い合わせ・お取り置き：［実際の方法］\n\nご希望の方はお問い合わせください。',
      measure: 'この商品への問い合わせや取り置き依頼があったか。'
    }
  },
  'その他': {
    '新規客': {
      action: '初めての方向けに、サービス1つと利用の流れを紹介する。',
      draft: 'はじめてご利用になる方へ。\n\nサービス：［名称］\nできること：［具体的な内容］\n所要時間：［目安］\n料金：［税込料金］\n利用方法：［申し込み・問い合わせ方法］\n\nご質問はお気軽にどうぞ。',
      measure: '初回利用やサービス内容についての問い合わせがあったか。'
    },
    'リピート': {
      action: '以前利用した方に役立つ情報を、具体例1つで紹介する。',
      draft: 'いつもご利用ありがとうございます。\n今日は［サービスの活用例・新しいご案内］をお伝えします。\n\n［具体的な内容］\nご利用方法：［案内］\n\n次回ご利用の参考になれば幸いです。',
      measure: '過去の利用者から再利用の相談があったか。'
    },
    'SNS反応': {
      action: 'お客さまが答えやすい質問を1つ出し、知りたいことを聞く。',
      draft: '次にどんな情報を知りたいですか？\n\nA：［テーマA］\nB：［テーマB］\n\nよろしければコメントでお聞かせください。\n今後のご案内の参考にします。',
      measure: 'コメントから具体的な質問や知りたいテーマが見つかったか。'
    },
    '予約・申込': {
      action: 'サービス内容・所要時間・申込方法を1つの投稿にまとめる。',
      draft: '［サービス名］のご案内です。\n\n内容：［具体的な内容］\n所要時間：［目安］\n料金：［税込料金］\n申込方法：［方法］\n\n事前のご質問も受け付けています。',
      measure: '投稿後の問い合わせや申込があったか。'
    }
  }
};

function readState() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (!saved || !Array.isArray(saved.history)) return { current: null, history: [] };
    const history = saved.history.filter(item => item && typeof item.id === 'string' && typeof item.action === 'string' && typeof item.draft === 'string' && ['used', 'passed'].includes(item.status)).slice(0, 20);
    const c = saved.current;
    const current = c && typeof c.id === 'string' && typeof c.industry === 'string' && PLANS[c.industry] && typeof c.goal === 'string' && PLANS[c.industry][c.goal] && typeof c.draft === 'string' ? c : null;
    return { current, history };
  } catch {
    return { current: null, history: [] };
  }
}
let state = readState();

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
function labelGoal(goal) {
  return ({ '新規客': '初めてのお客さま', 'リピート': '再来店・再利用', 'SNS反応': '投稿への反応', '予約・申込': '予約・お問い合わせ' })[goal] || goal;
}
function formatDate(date) {
  try {
    return new Intl.DateTimeFormat('ja-JP', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date));
  } catch {
    return '';
  }
}
function renderDecision() {
  const c = state.current;
  const tag = $('result-state');
  const status = c && c.status;
  tag.textContent = status === 'used' ? '使うと決めました' : status === 'passed' ? '今回は見送りました' : 'まだ判断していません';
  tag.className = 'decision-tag' + (status === 'used' ? ' is-used' : status === 'passed' ? ' is-passed' : '');
}
function renderCurrent(scroll) {
  const c = state.current;
  $('result').hidden = !c;
  if (!c) return;
  $('result-heading').textContent = c.storeName ? c.storeName + 'の今日のメモ' : '今日のメモ';
  $('action-text').textContent = c.action;
  $('draft-text').value = c.draft;
  $('measure-text').textContent = c.measure;
  $('user-note').value = c.note || '';
  $('copy-feedback').textContent = '';
  $('industry').value = c.industry;
  $('goal').value = c.goal;
  $('store-name').value = c.storeName || '';
  renderDecision();
  if (scroll) $('result').scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
}
function make(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function renderHistory() {
  const list = $('history-list');
  list.replaceChildren();
  $('clear-history').hidden = state.history.length === 0 && !state.current;
  if (!state.history.length) {
    list.append(make('p', 'empty-state', 'まだ記録はありません。最初のメモを作ってみましょう。'));
    return;
  }
  for (const item of state.history.slice(0, 20)) {
    const article = make('article', 'history-item');
    article.append(make('span', 'history-date', formatDate(item.at)));
    const body = make('div', 'history-main');
    body.append(make('strong', '', item.action), make('small', '', item.industry + ' / ' + labelGoal(item.goal) + (item.storeName ? ' / ' + item.storeName : '')));
    if (item.note) body.append(make('p', '', 'メモ：' + item.note));
    const reopen = make('button', 'clear-button', 'このメモを開く ↗');
    reopen.type = 'button';
    reopen.addEventListener('click', () => {
      state.current = { ...item };
      persist();
      renderCurrent(true);
    });
    body.append(reopen);
    article.append(body, make('span', 'history-status' + (item.status === 'passed' ? ' passed' : ''), item.status === 'used' ? '採用' : '見送り'));
    list.append(article);
  }
}
$('note-form').addEventListener('submit', event => {
  event.preventDefault();
  const industry = $('industry').value;
  const goal = $('goal').value;
  const source = PLANS[industry] && PLANS[industry][goal];
  if (!source) return;
  const storeName = $('store-name').value.trim().slice(0, 60);
  state.current = {
    id: 'note-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
    at: new Date().toISOString(),
    industry, goal, storeName,
    action: source.action,
    draft: source.draft,
    measure: source.measure,
    note: '',
    status: 'pending'
  };
  persist();
  renderCurrent(true);
  renderHistory();
});
$('draft-text').addEventListener('input', () => {
  if (!state.current) return;
  state.current.draft = $('draft-text').value;
  persist();
});
$('user-note').addEventListener('input', () => {
  if (!state.current) return;
  state.current.note = $('user-note').value;
  persist();
});
$('copy-draft').addEventListener('click', async () => {
  const field = $('draft-text');
  const copy = field.value;
  if (!copy.trim()) { $('copy-feedback').textContent = 'コピーする文章がありません。'; return; }
  try {
    if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error('clipboard unavailable');
    await navigator.clipboard.writeText(copy);
    $('copy-feedback').textContent = 'コピーしました。投稿はご自身で行ってください。';
  } catch {
    field.focus();
    field.select();
    $('copy-feedback').textContent = '本文を選択しました。手動でコピーしてください。';
  }
});
function decide(status) {
  if (!state.current) return;
  state.current.draft = $('draft-text').value;
  state.current.note = $('user-note').value;
  state.current.status = status;
  state.current.at = new Date().toISOString();
  state.history = [ { ...state.current }, ...state.history.filter(item => item.id !== state.current.id) ].slice(0, 20);
  persist();
  renderDecision();
  renderHistory();
}
$('use-draft').addEventListener('click', () => decide('used'));
$('pass-draft').addEventListener('click', () => decide('passed'));
$('clear-history').addEventListener('click', () => {
  if (!window.confirm('この端末にある今日のメモと判断履歴をすべて消しますか？')) return;
  state = { current: null, history: [] };
  try { localStorage.removeItem(KEY); } catch {}
  $('note-form').reset();
  $('result').hidden = true;
  renderHistory();
});
renderCurrent(false);
renderHistory();
