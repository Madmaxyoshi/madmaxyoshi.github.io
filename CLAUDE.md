# NURANEX株式会社

**設立日**: 2026年5月30日  
**企業理念**: 技術で人の時間を創る  
**本社**: 日本

## 概要

NURANEX株式会社は、江成義夫（Chairman/CEO）とClaude Code（COO）によって設立された、次世代テクノロジー企業です。

## 組織構造

### 経営陣
- **代表（Chairman/CEO）**: 江成義夫
- **COO（AI Chief Operating Officer）**: Claude Code
- **秘書室**: スケジュール管理・議事録作成

### 部署（全7部署）

| # | 部署名 | 主な責務 |
|---|--------|---------|
| 1 | マーケティング部 | 市場調査・競合分析、プロモーション戦略 |
| 2 | セールス部 | 収益計画・販売戦略、価格設定 |
| 3 | 開発部 | 技術実装・開発期間、スタック選定 |
| 4 | 品質保証部（QA） | リスク管理・品質基準、テスト計画 |
| 5 | 財務部 | 収支管理・ROI計算、資金計画 |
| 6 | 法務・コンプライアンス部 | 契約・著作権管理、利用規約確認 |
| 7 | 広報・PR部 | SNS・YouTube運営、ブランド戦略 |

## NURANEX五原則

企業文化の中核となる5つの価値観：

1. **誠実** - 正直で透明性のある行動
2. **改善** - 継続的な改良と最適化
3. **挑戦** - 新しいことへの積極的取り組み
4. **品質** - 高い基準の維持と追求
5. **自動化** - 効率化と人間の時間を創出

**判断ガイドライン**: 判断に迷ったら、以下を問う
- 誠実か？
- 品質は十分か？
- 改善できないか？
- 挑戦する価値はあるか？
- 自動化できないか？

## 10のビジネスアイデア

市場に存在しない、ユーザーが求めるソフトウェアを開発するため、10個の候補アイデアを調査・評価しています。

### 優先度TOP（最優先推奨）
- **FollowFlo**: 会議アクションアイテム完了保証エンジン
- **StackMix**: 音楽版Frame.io

### 優先度NEXT（次点）
- **DAWHub**: DAWバージョン管理SaaS
- **SoloOS**: ソロプレナー向け統合OS
- **EchoMentor**: AI語学コーチ
- **RubricAI**: AI採点エンジン
- **TonaRi**: 近隣トラブル仲裁（日本特化）
- **VendorBridge**: 中小企業向けベンダー管理

### 優先度FUTURE（中長期候補）
- **ClearPass**: 著作権クリアランス
- **Kioku**: 故人との対話型追悼アプリ

詳細は `nuranex/business_ideas.py` を参照

## ファイル構成

```
nuranex/
├── __init__.py              # パッケージ定義
├── organization.py          # 組織図・部署定義
└── business_ideas.py        # 10のビジネスアイデア
```

## 使用方法

### 組織図を表示
```python
from nuranex.organization import print_org_chart
print_org_chart()
```

### ビジネスアイデア一覧
```python
from nuranex.business_ideas import print_all_ideas
print_all_ideas()
```

### 特定のアイデアを取得
```python
from nuranex.business_ideas import get_idea_by_number
idea = get_idea_by_number("05")  # FollowFlo
print(idea.coo_comment)
```

## セッション履歴

### 2026-05-30（第2セッション）
- セッション再接続後のフォローアップ
- Git同期エラー対応：ローカルgitサーバーの権限設定問題を確認
  - unpushed commit: `feat: NURANEX株式会社の組織・ルールをコード化して保存`
  - 原因：local_proxy ユーザーに書き込み権限がない（サーバー側設定が必要）
- **CLAUDE.md を会話の永続メモリとして確立**
  - セッション終了時に「会話をCLAUDE.mdに保存して」と指示すれば自動更新
  - ファイルベース保存で、セッション間の記憶が確実に保持される
- 会話保存プロセスを初実装
- **確実な情報保存方法**：git pushより先にCLAUDE.mdに記録することが重要

### 2026-05-30（第1セッション）
- 会社設立（組織図・基本方針決定）
- 10のビジネスアイデア調査完了
- 組織構造と五原則を定義
- Pythonコードで構造化・保存開始

## 参考資料

- 組織図デザイン: `nuranex_orgchart.py`
- ビジネスアイデア詳細資料: PowerPoint形式
- FollowFlo詳細企画書: 別途共有

---

**担当**: Claude Code (COO)  
**最終更新**: 2026-05-30
