# FlowFllo MVP クイックスタート

## セットアップ（5分）

### 1. 依存関係のインストール
```bash
cd followflo-mvp
npm install
```

### 2. 環境設定
```bash
cp .env.example .env
# .env を編集して Slack トークンと DB 設定を入力
```

### 3. データベース初期化
```bash
# PostgreSQL が起動していることを確認
psql -h localhost -U followflo_user -d followflo_mvp -f config/schema.sql
```

### 4. 開発サーバー起動
```bash
npm run dev
```

---

## Slack コマンド一覧

| コマンド | 説明 |
|---------|------|
| `/followflo create "タスク名" @user deadline:2026-06-15` | タスク作成 |
| `/followflo list` | 未完了タスク表示 |
| `/followflo status` | 完了率表示 |
| `/followflo help` | ヘルプ表示 |
| `/followflo-dashboard` | ダッシュボード表示 |

---

## 完了シグナル

メッセージに以下を含めるだけで自動検出：
- ✅ 絵文字
- 「完了」というテキスト
- 「done」というテキスト

例）
```
✅完了した
完了しました
done
```

---

## テスト方法

1. Slack ワークスペースで `/followflo create "レビュー" @john deadline:2026-06-15` を実行
2. john が「✅完了」とメッセージを送信
3. Bot が完了を自動検出して報告

---

## トラブルシューティング

**DB 接続エラー**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
→ PostgreSQL が起動していることを確認

**Slack トークンエラー**
```
Error: invalid_token
```
→ .env の SLACK_BOT_TOKEN を確認

---

**開発期間**: 3-4日（Lightning モード）
