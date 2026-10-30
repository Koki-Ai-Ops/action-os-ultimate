# 公開GitHubから採用した3つの品質管理機能

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

## 中止した実験（2026-10-30）

Ollama + Aider のPC専用起動スクリプトは、実利用と必要性を確認できなかったため `main` から削除しました。ローカルのAI生成ツールを試すこと自体は可能ですが、GitHubの運用品質管理とは切り分けます。

## 運用と優先順位

1. 既存の機能テストを通す。
2. Gitleaks / CodeQLで秘密情報・危険箇所がないか確認。
3. Lighthouseで使い勝手を測定し、目立つ問題から1つ修正。
4. 実際に利用した人・具体的な改善要望・受注などを確認する。

**GitHub上で公開されるのは構成・ソースコードのみ**。有料APIの契約、ローカルPCへのインストール、販売や外部公開の変更は自動実行しない。GitHub Actionsの無料枠や設定はプラン・リポジトリの公開状態で変わるため、使用量を確認する。
