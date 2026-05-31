# FlowFllo MVP

**会議アクションアイテム完了保証エンジン**

## 概要

FlowFllo MVP は、Slack/Teams/Zoom/Notion/Asana を通じてアクションアイテムの完了を**自動検出・検証・追跡**し、完了率をリアルタイムレポートするシステムです。

## 技術仕様

- **ランタイム**: Node.js 18+
- **言語**: TypeScript
- **フレームワーク**: Slack Bolt with Socket Mode
- **データベース**: PostgreSQL with JSONB
- **認証**: Slack Socket Mode
- **API**: RESTful with type safety

## コア機能（4段階検証エンジン）

### Stage 1: 自動キーワード検出
- 完了シグナル: `✅`, `完了`, `done`, `finished`, `終了`, `complete`
- リアクション: `white_check_mark`, `heavy_check_mark`
- リアルタイムメッセージリスナー

### Stage 2: コンテキスト検証
- タスク名マッチング (メッセージ内に含まれるか)
- ユーザー割り当て確認 (メッセージ送信者 = 割当者か)
- 信頼度スコア計算 (0-1)

### Stage 3: 証拠チェーン記録
- SHA256 ハッシング
- タイムスタンプ自動記録
- ユーザーID・メッセージテキスト保存
- JSONB メタデータ保存

### Stage 4: 人間による確認フラグ
- 信頼度 < 0.8 の場合は要確認フラグ
- マネージャーダッシュボードで確認
- 手動承認・却下機能

## 自動エスカレーション（3段階）

| ステージ | 期限状態 | アクション | 通知先 |
|---------|---------|----------|------|
| Stage 1 | T-1日 | ⏰ リマインド通知 | 割当者 |
| Stage 2 | T+24h | ⚠️ マネージャー通知 | 作成者 |
| Stage 3 | T+3日 | 📊 エグゼクティブレポート | C-level |

## インストール

```bash
# 依存パッケージ
npm install

# 環境設定
cp .env.example .env

# 開発開始
npm run dev
```

## Slack コマンド

```
/followflo create "タスク名" @ユーザー deadline:YYYY-MM-DD
→ アクションアイテムを作成

/followflo list
→ 未完了タスク一覧を表示

/followflo status
→ あなたの完了率を表示

/followflo dashboard
→ チーム・個人・遅延の詳細ダッシュボード

/followflo help
→ ヘルプを表示
```

## 完了シグナル検出の仕組み

### メッセージベース
```
✅ プレゼンテーション完了しました！
完了：レポート作成タスク終了
I've finished the API implementation. Done!
```

### リアクション
メッセージに ✅ (white_check_mark) または ✔️ (heavy_check_mark) を付与

### 自動マッピング
- メッセージ送信者が割当者か確認
- 最新の pending タスクと照合
- 完了証拠として自動記録

## データベーススキーマ

### action_items テーブル
- `id`: UUID (主キー)
- `task_name`: varchar(255)
- `assigned_to`: varchar(100) - Slack user ID
- `deadline`: timestamp
- `created_by`: varchar(100) - 作成者 Slack user ID
- `slack_channel_id`: varchar(100)
- `status`: pending/completed/overdue
- `escalation_level`: 0-3
- `ai_verification_stage`: 0-4

### completion_proofs テーブル
- `id`: UUID
- `action_item_id`: UUID (外キー)
- `source`: slack/teams/zoom/notion/asana
- `completed_by`: varchar(100)
- `proof_text`: text
- `metadata`: JSONB (hash, confidence, verification_stage)

### completion_metrics テーブル
- `user_id`: varchar(100)
- `period_date`: date
- `total_tasks`: int
- `completed_tasks`: int
- `completion_rate`: decimal(5,2)
- `average_completion_time_hours`: decimal(10,2)

## エラーハンドリング

すべてのコマンド・リスナーは以下を実装：
- try-catch による例外キャッチ
- 詳細なエラーログ出力
- ユーザーへの日本語エラーメッセージ
- データベース接続エラーの個別処理
- Slack API エラーのグレースフルハンドリング

## 設定ファイル

### .env 設定項目

```
# Slack Bot Tokens
SLACK_BOT_TOKEN=xoxb-...
SLACK_SIGNING_SECRET=...
SLACK_APP_TOKEN=xapp-...

# Database
DATABASE_URL=postgresql://user:pass@host/db

# Server
PORT=3000
NODE_ENV=development

# Escalation
SLACK_CLEVEL_CHANNEL=C01234ABCD
```

## ディレクトリ構造

```
followflo-mvp/
├── src/
│   ├── index.ts                 # Appメイン・スケジューラ
│   ├── commands.ts              # /followflo コマンド
│   ├── listeners.ts             # メッセージ・リアクション検出
│   ├── dashboard.ts             # ダッシュボードUI
│   ├── escalation.ts            # 自動エスカレーション (3段階)
│   ├── ai-verification.ts       # 4段階検証エンジン
│   ├── metrics.ts               # 統計・集計
│   ├── database.ts              # DB接続・スキーマ初期化
│   ├── types.ts                 # TypeScript インターフェース
│   └── __tests__/
│       └── ai-verification.test.ts
├── config/
│   └── schema.sql               # PostgreSQL スキーマ
├── .env.example                 # 環境変数テンプレート
├── package.json
├── tsconfig.json
├── QUICKSTART.md                # 5分セットアップガイド
├── PPT_REVISION_PLAN.md        # PowerPoint改訂計画
└── README.md
```

## 開発フロー（Day 2実装）

### 2.5時間達成
✅ エスカレーション機能 (escalation.ts)  
✅ AI検証エンジン (ai-verification.ts)  
✅ データベーススキーマ更新  
✅ コマンドエラーハンドリング強化  

### 残り実装
- 包括的なE2Eテスト
- PowerPoint プレゼンテーション
- MP4デモビデオ

## テスト実行

```bash
npm test                    # 全テスト実行
npm test -- --coverage      # カバレッジレポート
```

## ビジネスモデル

- **価格**: $15/ユーザー/月
- **対象**: 50人以上のチーム
- **初期設定**: 4時間サービス
- **デプロイ**: 専用 Slack Workspace への接続

## 競争優位性

1. **会議のアクションアイテムに特化**: 他ツールは議事録AIに注力
2. **完了保証の仕組み**: 単なる検出ではなく、証拠チェーン + 自動エスカレーション
3. **マルチチャネル対応**: Slack/Teams/Zoom/Notion/Asana を統一的に追跡
4. **階層的レポーティング**: 個人・チーム・マネージャー・エグゼクティブ別

## ライセンス

NURANEX株式会社 © 2026 All rights reserved
