# 音楽和訳掲載サイト（名称：俺の和訳）

英語で作詞された音楽を10年以上聴き続けた「俺」が手掛ける音楽和訳掲載サイトです。<br>
メールアドレスでサインアップするとどこにも載っていない和訳の記事を見ることができます。<br>
~~詳しくは[こちら](https://across-the-language.uw.r.appspot.com/)をクリックしてください。~~ （2025年現在は封鎖中）

参考画像: 俺の和訳 - トップページ
<img width="1905" height="1162" alt="俺の和訳_トップページ" src="https://github.com/user-attachments/assets/9a61cc4b-dc6a-499d-9022-e9f66410eb9c" />

## 使用方法
ヘッダーから新規登録していただくとログインができるようになります。<br>
サインアウトすると限定記事が見えなくなります。

## 使用技術
- プログラミング言語 : HTML, CSS, JavaScript (ES6)<br>
- フレームワーク : Node.js (22.20.0)<br>
- インフラストラクチャ― : Google Cloud Platform (App Engine, Cloud SQL - MySQL)

## 構成図
![俺の和訳 - 構成図](https://user-images.githubusercontent.com/117279567/222990391-103c73ca-c202-45cf-adaa-d936a7ce4613.jpg)

## データベース設計

### articlesとusersの２つのテーブルがあります。
articlesは、記事のデータを保存しています。<br>
![俺の和訳 - データベース設計 - articles](https://user-images.githubusercontent.com/117279567/223346098-ead26595-b13b-44bb-9e0d-ce6e8facde71.jpg)<br>
usersは、ユーザーのデータを保存しています。<br>
![俺の和訳 - データベース設計 - users](https://user-images.githubusercontent.com/117279567/223346122-4baf984a-53e4-45a5-bc2c-8029708e2ff4.jpg)
