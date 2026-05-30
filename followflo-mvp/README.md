# FollowFlo MVP

**会議アクションアイテム完了保証エンジン**

## 概要

FollowFlo MVP は、Slack を通じてアクションアイテムの完了を自動追跡し、完了率をレポートするシステムです。

## 技術仕様

- **ランタイム**: Node.js 18+
- **言語**: TypeScript
- **フレームワーク**: Slack Bolt
- **データベース**: PostgreSQL
- **デプロイ**: Docker 対応予定

## インストール

```bash
npm install
```

## 環境設定

`.env.example` をコピーして `.env` を作成し、必要な値を設定します：

```bash
cp .env.example .env
```

## 開発開始

```bash
npm run dev
```

## 機能一覧（MVP Phase 1）

- ✅ `/followflo create` コマンドでアクションアイテム登録
- ✅ Slack メッセージの「完了」シグナル検出
- ✅ 完了証拠の自動記録
- ✅ 個人・チームの完了率集計
- ✅ Slack ダッシュボード表示

## ディレクトリ構造

```
followflo-mvp/
├── src/
│   ├── index.ts          # メイン入口
│   ├── database.ts       # DB接続・初期化
│   ├── commands.ts       # Slackコマンド
│   └── listeners.ts      # イベントリスナー
├── config/
│   └── schema.sql        # DB スキーマ
├── tests/                # テストファイル
├── package.json
├── tsconfig.json
└── README.md
```

## 開発スケジュール

### Week 1
- Slack Bot 基本機能
- DB スキーマ・接続
- コマンド実装

### Week 2
- イベントリスナー完成
- ダッシュボード機能
- テスト・デバッグ

## ライセンス

NURANEX株式会社 © 2026
