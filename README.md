# 音楽和訳掲載サイト（名称：俺の和訳）
英語で作詞された音楽を10年以上聴き続けた「俺」が手掛ける音楽和訳掲載サイトです。<br>
メールアドレスでサインアップするとどこにも載っていない和訳の記事を見ることができます。<br>
詳しくは[こちら](https://across-the-language.uw.r.appspot.com/)をクリックしてください。
## 使用方法
ヘッダーから新規登録していただくとログインができるようになります。<br>
サインアウトすると限定記事が見えなくなります。
## 使用技術
- プログラミング言語 : HTML, CSS, JavaScript (ES6)<br>
- フレームワーク : Node.js (22.20.0)<br>
- インフラストラクチャ― : Google Cloud Platform (App Engine, Cloud SQL - MySQL)

## ローカル開発の環境変数設定
`.env.example` を参考に `.env` を作成してください。

重要:
- `SESSION_SECRET` はセッション暗号化に使用します（本番では十分に長くランダムな値を設定）。
- DB 環境変数（`DB_USER`, `DB_PASSWORD`, `DB_NAME`）も適切に設定してください。

起動例（PowerShell）:
```
cp .env.example .env
npm.cmd install
npm.cmd start
```
## 構成図
![俺の和訳 - 構成図](https://user-images.githubusercontent.com/117279567/222990391-103c73ca-c202-45cf-adaa-d936a7ce4613.jpg)
## データベース設計
### articlesとusersの２つのテーブルがあります。
articlesは、記事のデータを保存しています。<br>
![俺の和訳 - データベース設計 - articles](https://user-images.githubusercontent.com/117279567/223346098-ead26595-b13b-44bb-9e0d-ce6e8facde71.jpg)<br>
usersは、ユーザーのデータを保存しています。<br>
![俺の和訳 - データベース設計 - users](https://user-images.githubusercontent.com/117279567/223346122-4baf984a-53e4-45a5-bc2c-8029708e2ff4.jpg)
