# 公開GitHubから実際に採用した4つの開発支援機能

このリポジトリで改善するのは `site/` の静的Webアプリ「集客整理帳」です。既存のページ・配信・決済設定は変更しません。

## 1. Gitleaks — 秘密情報をGitHubに含めない

- 元の公開プロジェクト: https://github.com/gitleaks/gitleaks
- 採用するAction: https://github.com/gitleaks/gitleaks-action
- 導入場所: `.github/workflows/oss-secret-scan.yml`
- PRごとにGit履歴のトークンや秘密情報らしき文字列を検査。レポートの自動アップロードとPRへのコメントは無効。
- 秘密情報流出を完全に防ぐものではない。誤って公開した場合は秘密情報を無効化・再発行する。
- 個人アカウントの公開リポジトリ向け。別の組織アカウントに移す場合はActionのライセンス条件を再確認。

## 2. Lighthouse CI — サイト品質を可視化する

- 公開プロジェクト: https://github.com/GoogleChrome/lighthouse-ci
- 導入場所: `.github/workflows/oss-lighthouse.yml`、`.lighthouserc.json`
- `site/` のHTMLをローカルサーバーで検査し、速度・アクセシビリティ・SEO・Best Practicesのスコアを確認する。
- 最初は `warn` のみ（スコアの低さだけではPRを失敗させない）。ブラウザ起動失敗等はCIエラーになる。
- レポートは GitHub Actions artifact に7日間保存。第三者のLighthouse保存サーバーには送らない。
- 起動タイミング: `site/` または設定の変更を含むPR、手動実行のみ。

## 3. CodeQL — JavaScriptの脆弱性分析

- 公開プロジェクト: https://github.com/github/codeql-action
- 導入場所: `.github/workflows/oss-codeql.yml`
- JavaScript/TypeScriptコードを分析する。PRで関係ファイルが変わったとき・手動実行時のみ。
- GitHubが提供する分析機構を利用。検査が通っても安全を保証するものではない。

## 4. Ollama + Aider — 手元PCのAIコーディング

- https://github.com/ollama/ollama (MIT)
- https://github.com/Aider-AI/aider (Apache-2.0)
- 導入場所: `scripts/local-ai.mjs` （PCでの実行補助）
- PCに両方を公式の案内に沿って個別インストールする。Node.jsも必要。
- `ollama pull qwen2.5-coder:7b` を実行してモデルをダウンロードする。モデルの利用条件・PCメモリ・容量を確認。
- Ollamaのローカルサービスを起動し、`node scripts/local-ai.mjs check` で検査。
- 準備ができたPCで `node scripts/local-ai.mjs start` を実行。Aiderに `--no-auto-commits` と `--no-analytics` を渡し、Gitに勝手にコミットしない。
- APIキーを設定せず、ローカル `127.0.0.1:11434` に接続する前提。モデルのダウンロードにはインターネット接続が必要。
- AndroidスマホだけではこのPC用構成をそのまま利用できない。GitHub Actions上ではOllama/Aiderを起動しない。
- AI生成コードは誤りうるため、採用・確認・公開の判断を人間が行う。

## 運用と優先順位

1. 既存の機能テストを通す。
2. Gitleaks / CodeQLで秘密情報・危険箇所がないか確認。
3. Lighthouseで使い勝手を測定し、目立つ問題から1つ修正。
4. 実際に利用した人・具体的な改善要望・受注などを確認する。

**GitHub上で公開されるのは構成・ソースコードのみ**。有料APIの契約、ローカルPCへのインストール、販売や外部公開の変更は自動実行しない。GitHub Actionsの無料枠や設定はプラン・リポジトリの公開状態で変わるため、使用量を確認する。
