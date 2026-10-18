# GitHubで開発を続ける手順（無料枠優先）

このリポジトリは、静的サイト「集客整理帳」を壊さず改善するための実行環境です。AIトークンの無制限利用や、他社AI間での会話の完全自動移行は保証しません。

## 1. ブラウザだけで編集する（最優先）

1. GitHubのこのリポジトリを開く。
2. `Code` → `Codespaces` → `Create codespace` を選ぶ（使える場合）。
3. `node scripts/static-audit.mjs` を実行して基準を確認。
4. `python3 -m http.server 4173` でプレビューし、Portsから開く。
5. Gitで作業用ブランチを作って変更し、コミットとPRでレビューする。直接 `main` に反映しない。

Codespacesは**無制限無料ではない**。個人アカウントの無料計算時間/保存容量には上限がある。プレビューや利用終了後はCodespaceを停止して使用量を確認する。不要な有料枠は契約しない。

## 2. AIを使って実装する（規約と無料枠を確認）

- GitHub Copilot Free / 利用資格が認められる場合のStudent: Codespacesのエディタなどでコードの相談と補助ができる。プランと使用回数の上限を確認。
- オープンソースの [Aider](https://github.com/Aider-AI/aider) と [Ollama](https://github.com/ollama/ollama): 十分な性能の手元のPCでローカルモデルを動かす選択肢。モデルのダウンロードとPCメモリが必要で、Codespacesの無料枠内で動くとは限らない。
- 特定のAIサービスには年齢・契約・支払い条件がある。利用資格に合わないサービスの登録や制限回避はしない。
- APIキーをREADME、Issue、PR、ソース、Actionsのログに載せない。必要な場合でもGitHub Secretsなどで適切に保護する。

公式: [Codespaces](https://docs.github.com/en/codespaces/about-codespaces/what-are-codespaces) / [Copilot](https://docs.github.com/en/copilot/get-started/plans) / [AiderとOllama](https://aider.chat/docs/llms/ollama.html)

## 3. 別のAIに途中から引き継ぐ

各AIの会話履歴・認証・内部状態は他社へ自動転送されない。引き継げるのは**リポジトリのコードと、本人が承認した作業メモ**。

```sh
node scripts/ai-handoff.mjs
cat .git/AI_HANDOFF.md
```

出力は `.git/AI_HANDOFF.md` に置かれ、通常のGitコミットの対象外となる。未公開情報を記入する前に、共有先AIへ送ってよいか確認する。作業目的・未完了箇所・テスト結果は本人が追記する。

次のAIへの依頼例:
> `README.md` と `AGENTS.md` を読んでください。以下は承認済みの引き継ぎメモです。変更範囲を提案し、まず静的監査を実行し、アプリの公開状態を勝手に変更しないでください。

## 4. 作るだけで終わらない

1. Issueに「誰のどの課題を解決するか」「完成条件」「検証指標」を書く。
2. 作業用ブランチで一つだけ改善し、既存テストを実行する。
3. PRで変更点とテスト結果を残す。
4. 公開/営業の可否は確認して決める。実際の利用数・受注件数・売上は推測で記録しない。

**最優先KPI:** 新機能の数ではなく、実際に使った人・具体的な反応・受注/売上。公開作業は承認後に行う。
