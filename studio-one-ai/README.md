# 🎹 Studio One 7 AI辞書

> Studio One 7 の操作の疑問を、AIが辞書のように即答するDAWアシスタント。
> 手順・ショートカット・メニューの場所が3秒でわかる。

**NURANEX株式会社** | 売上の柱（2026年6月期 目標：20万円）

---

## これは何？

音楽制作者が Studio One 7（PreSonus社のDAW）の操作に困ったとき、
「あれ、どうやるんだっけ？」を**チャットで質問するだけで即解決**できるWebアプリ。

- ✅ 操作手順を番号付きで簡潔に回答
- ✅ ショートカットキー（Win/Mac）を自動で添える
- ✅ メニューの場所を「メニュー ＞ 項目」形式で明示
- ✅ 不確かな情報は推測せず「確認が必要」と正直に答える（誤情報を出さない）

---

## アーキテクチャ

```
ブラウザ（public/index.html チャットUI）
    │  POST /api/ask
    ▼
Express サーバー（src/server.ts）
    │  APIキーはサーバー側のみ保持（クライアントに露出させない）
    ▼
Claude API（src/system-prompt.ts = Studio One 7専門の頭脳）
```

| ファイル | 役割 |
|---------|------|
| `src/system-prompt.ts` | 製品の頭脳。AIをStudio One 7専門辞書にするプロンプト |
| `src/server.ts` | Claude APIへの安全なプロキシ＋静的配信 |
| `public/index.html` | チャットUI（自己完結・1ファイル） |

---

## ローカル起動

```bash
cd studio-one-ai
npm install
cp .env.example .env        # ANTHROPIC_API_KEY を記入
npm run build
npm start                   # http://localhost:3200
```

---

## 本番デプロイ（Railway）

1. Railway で New Project → Deploy from GitHub repo
2. ルートディレクトリを `studio-one-ai` に指定
3. 環境変数 `ANTHROPIC_API_KEY` を設定
4. デプロイ（`railway.json` が自動で使われる）
5. 公開URLが発行される → そのURLを販売

---

## 販売モデル（案）

| プラン | 価格 | 内容 |
|--------|------|------|
| 月額 | $29/月 | 無制限質問 |
| 年額 | $290/年 | 2ヶ月分お得 |

- 販売チャネル：Gumroad（アクセス権を販売）
- 目標：60〜70契約で月20万円

---

## コスト管理

- モデル：`claude-haiku-4-5`（高速・低コスト）
- 会話履歴は直近20メッセージに制限
- max_tokens: 1024

---

## 必要なCEOアクション

| # | アクション | 理由 |
|---|----------|------|
| 1 | Anthropic APIキー発行 | AIの頭脳（課金はCEOアカウント） |
| 2 | Railwayデプロイ | 本番公開 |
| 3 | Gumroadで販売ページ作成 | 集金 |

---

**担当**: Claude Code (COO) | NURANEX株式会社
