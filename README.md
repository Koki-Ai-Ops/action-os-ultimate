# 競合コンパス（独立版）

公式Webサイトのタイトル・説明文・見出しを取得し、比較・メモ・変更履歴を保存する日本語の競合調査ツール。AIによる架空分析はありません。

この専用ブランチには連携経由で配置した圧縮ソース `source.tar.br` と展開スクリプトがあります。ローカルでは `node unpack.cjs && tar xf source.tar && npm test && npm start` として起動します。ユーザー向けの通常ZIPはチャット内の添付ファイルを利用してください。

Render無料Webサービス: Build `node unpack.cjs && tar xf source.tar && npm install --omit=dev && npm test`、Start `npm start`、Health `/api/health`。調査データはユーザーのブラウザ内にのみ保存されます。ログイン・自動監視・課金はありません。
