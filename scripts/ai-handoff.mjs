#!/usr/bin/env node
// Git metadata only: never read application files, environment values, or conversation history.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const run = (cwd, ...args) => execFileSync('git', ['-C', cwd, ...args], {
  encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']
}).trim();
const root = run(process.cwd(), 'rev-parse', '--show-toplevel');
const branch = run(root, 'branch', '--show-current') || '(detached)';
const head = run(root, 'log', '-1', '--format=%h %s');
const changedCommands = [
  ['diff', '--name-only', '-z'],
  ['diff', '--cached', '--name-only', '-z'],
  ['ls-files', '--others', '--exclude-standard', '-z'],
];
const changed = new Set();
for (const args of changedCommands) {
  const out = execFileSync('git', ['-C', root, ...args], {encoding:'utf8'});
  for (const name of out.split('\0')) {
    if (name && !/(^|\/)(\.env(?:\.|$)|.*secret.*|.*credential.*|.*password.*|.*\.key$)/i.test(name)) {
      changed.add(name.replaceAll('\n', ' '));
    }
  }
}
const shown = [...changed].sort().slice(0, 30);
const fileLines = shown.length ? shown.map(x => '- ' + JSON.stringify(x)).join('\n') : '- 変更ファイルなし';
const memo = [
  '# AI開発 引き継ぎメモ（ローカル専用）',
  '',
  '> このファイルは自動共有されません。送信前に機密情報がないか確認してください。',
  '',
  '## Gitで確認できた状態',
  '- ブランチ: ' + branch,
  '- 直近コミット: ' + head,
  '- 変更ファイル一覧（最大30件、内容は読みません）:',
  fileLines,
  '',
  '## 手動で補足する項目',
  '- 現在の目的: [記入]',
  '- 完了した作業: [記入]',
  '- 次に一つやること: [記入]',
  '- テスト結果/残る不具合: [記入]',
  '- 相手のAIに渡してよい内容だけ記入すること。',
  '',
  '## 次のAIへの指示',
  'まず README.md、AGENTS.md、docs/AI_DEV_WORKFLOW.md を読み、',
  '既存アプリの動作と公開設定を維持して最小限の変更を提案してください。',
  '実行前後に node scripts/static-audit.mjs で確認してください。',
  ''
].join('\n');
const gitPath = run(root, 'rev-parse', '--git-path', 'AI_HANDOFF.md');
const destination = resolve(root, gitPath);
mkdirSync(dirname(destination), {recursive:true});
writeFileSync(destination, memo, {encoding:'utf8', mode:0o600});
console.log('引き継ぎメモを作成: ' + destination);
