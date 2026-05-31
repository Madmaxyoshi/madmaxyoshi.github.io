# FollowFlo MVP - セットアップガイド

## 📋 前提条件
- Node.js 18+
- PostgreSQL 12+
- Slack Workspace (管理者権限)

## 🚀 クイックスタート

### 1. 環境変数設定
```bash
cp .env.example .env
# .env を編集して、Slack トークンと DB 接続情報を設定
```

### 2. 依存関係インストール
```bash
npm install
```

### 3. ビルド
```bash
npm run build
```

### 4. データベース初期化
```bash
# PostgreSQL が起動している状態で：
npm start
# 自動的にスキーマが初期化されます
```

## 🔧 Slack App トークン取得手順

1. https://api.slack.com/apps にアクセス
2. "Create New App" → "From scratch"
3. App name: `FollowFlo` → Workspace 選択
4. **OAuth & Permissions** で以下スコープ追加：
   - `chat:write`
   - `chat:write.public`
   - `commands`
   - `reactions:read`
   - `users:read`
   - `app_mentions:read`
5. **Install to Workspace** でトークン取得
6. **Socket Mode** → Enable → App Token 生成

## ✅ テスト実行
```bash
npm test
# 9/9 tests passing が表示されます
```

## 📊 機能チェックリスト
- [x] Slack メッセージ監視（✅、完了 キーワード）
- [x] リアクション監視（☑️ 絵文字）
- [x] 4段階 AI 検証エンジン
- [x] 自動エスカレーション（30分ごと）
- [x] ダッシュボード表示
- [x] 完全なテストカバレッジ

## 🎯 本番環境チェック
- ✅ TypeScript: ゼロエラー
- ✅ テスト: 9/9 成功
- ✅ ビルド: 成功
- ✅ データベース初期化: 自動実行

---
**Status**: 本番対応完了 ✅  
**Last Updated**: 2026-05-31
