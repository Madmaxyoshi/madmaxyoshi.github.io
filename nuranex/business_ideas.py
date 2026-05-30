"""
NURANEX株式会社 10のビジネスアイデア
調査実施: 2026年5月30日
"""

from dataclasses import dataclass
from typing import List

@dataclass
class BusinessIdea:
    """ビジネスアイデア定義"""
    number: str
    name: str
    category: str
    tagline: str
    problem: str
    why_missing: str
    market_size: str
    business_model: str
    coo_comment: str
    source: str
    color: str
    priority: int  # 1=最優先、2=次点、3=中長期


# ===== 10のビジネスアイデア =====
IDEAS = [
    BusinessIdea(
        number="01",
        name="DAWHub",
        category="音楽・クリエイター分野",
        tagline="DAWプロジェクト専用バージョン管理SaaS",
        problem="音楽プロデューサーが複数人でDAWプロジェクトを管理する際、GitやDropboxは大容量バイナリファイルに非対応。変更履歴・ロールバックが実質不可能。「v2_final_FINAL.als」命名地獄が続く。",
        why_missing="GitはバイナリファイルNG。Spliceは Ableton専用。クロスDAW対応のバージョン管理ツールはゼロ。",
        market_size="音楽制作ソフト市場：2025年約77億ドル、CAGR 17%超（Technavio）\n独立系アーティスト数：世界620万人以上（2024年、前年比38%増）",
        business_model="個人：$9.99/月（50GB）｜プロ：$29.99/月（無制限）｜スタジオ：$99/月〜",
        coo_comment="DAWHubは音楽制作者の長年の課題を解決する。Spliceが部分的に試みているが、クロスDAW対応の空白は明確。技術的難度は中だが、参入できれば強固な堀になる。",
        source="出典：Hacker News, GearSpace, Market Research Future",
        color="#0057B8",
        priority=1
    ),
    BusinessIdea(
        number="02",
        name="StackMix",
        category="音楽・クリエイター分野",
        tagline="音楽制作タイムスタンプ付きフィードバックツール（音楽版Frame.io）",
        problem="音楽制作中のフィードバックが「2:34あたりのキックが弱い」とDiscordでテキスト送信するだけ。音声トラックのタイムスタンプ指定でコメントを残せるGoogleドキュメント的なDAW版が存在しない。",
        why_missing="Notetracksは完成品へのコメントのみ。DAW外部への共有フィードバック機能が未実装。映像版（Frame.io）は$13.5億で買収済み。音楽版は空白。",
        market_size="Frame.io：2021年にAdobeが13億5,000万ドルで買収（音楽版の市場価値の実証）\n世界のプロデューサー数：推定6,000万人以上（2024年）",
        business_model="フリーミアム（月3プロジェクト無料）｜プロ：$12/月｜スタジオ：$49/月",
        coo_comment="Frame.ioの成功事例が「音楽版も成立する」ことの最大の証明。実装が比較的シンプルで参入リスクが低く、早期参入優位が取りやすい最有力候補の一つ。",
        source="出典：InfluenceFlow, Technavio PRNewswire",
        color="#0057B8",
        priority=1
    ),
    BusinessIdea(
        number="03",
        name="ClearPass",
        category="音楽・クリエイター分野",
        tagline="サンプル著作権クリアランス一気通貫プラットフォーム",
        problem="サンプル使用時の「権利者特定→交渉→契約締結」が完全手動。既存ツールは著作権の検出のみで、クリアランス実行まで一気通貫できるサービスが存在しない。",
        why_missing="著作権DBが分散（ASCAP・BMI・SESAC・各国PRO）で統合APIなし。未請求ロイヤリティは年間25億ドル。大手レーベルは専任弁護士チームがあり自動化に無関心。",
        market_size="クリエイターの74%が音楽ライセンスを正しく理解していない（Epidemic Sound 2024）\nインディーアーティストのシンク配置が2024年に35%増加",
        business_model="クリアランス成立ごとに手数料15〜20%｜プロデューサー向け：$19/月｜APIライセンス：$500/月〜",
        coo_comment="著作権問題は音楽業界の構造的課題。権利者との提携が必要で参入難度は高いが、成立した場合の市場価値は非常に大きい。",
        source="出典：Royalty Exchange, thatpitch.com",
        color="#0057B8",
        priority=3
    ),
    BusinessIdea(
        number="04",
        name="SoloOS",
        category="ビジネス・業務効率化分野",
        tagline="ソロプレナー専用 統合バックオフィスツール",
        problem="複数収益源（受託・アフィリエイト・デジタル商品・講師業）を持つ個人事業主が、QuickBooks等の「法人向け単一事業モデル」ツールに苦しんでいる。平均3〜4ツールを組み合わせて運用が現状。",
        why_missing="QuickBooksは中小法人へのアップセルを志向。ソロプレナー向け統合OSは「最重要の空白市場」（IdeaProof 2026年版）。",
        market_size="グローバル会計ソフト市場：2025年約209億ドル→2032年422億ドル（CAGR 10.5%）\nSMBソフトウェア市場：2026年約800億ドル（Global Growth Insights）",
        business_model="個人：$29〜$79/月（収益源数・請求書数でスケール課金）｜税理士連携アドオン",
        coo_comment="副業・ソロプレナー人口の急増で需要は明確。既存ツールの「法人前提設計」への不満は継続的に表面化している。",
        source="出典：Fortune Business Insights, Medium/StartupInsider",
        color="#007A48",
        priority=2
    ),
    BusinessIdea(
        number="05",
        name="FollowFlo",
        category="ビジネス・業務効率化分野",
        tagline="会議アクションアイテム 完了保証エンジン",
        problem="会議で決まったアクションアイテムの約80%は追跡されず放置される。Otter.aiなどのAI議事録ツールは普及したが「誰がいつまでに実行したか」を追跡し自動リマインドするサービスがない。",
        why_missing="既存ツールは「情報キャプチャ」に集中。AsanaやNotionはタスクの手動入力が前提。会議→タスク→完了確認→エスカレーションを自律的に回すエンジンは存在しない。",
        market_size="ビジネスパーソンは週の約35%を会議に費やす（MeetingToll 2025）\nグローバルビジネスソフト市場：2025年6,600億ドル→2031年1.28兆ドル（Mordor Intelligence）",
        business_model="$15/ユーザー/月｜Slack・Teams・Zoom連携｜エンタープライズ：$50/ユーザー/月",
        coo_comment="「会議の無駄」は全世界共通の問題。議事録AIは飽和しているが「完了保証」は真の空白地帯。習慣化しやすく解約率が低い構造が魅力。",
        source="出典：MeetingToll, TechTarget, Product Hunt",
        color="#007A48",
        priority=1
    ),
    BusinessIdea(
        number="06",
        name="VendorBridge",
        category="ビジネス・業務効率化分野",
        tagline="中小企業向け 軽量ベンダー管理SaaS",
        problem="中小企業（10〜200名）の仕入先・外注先との契約・支払い・パフォーマンス管理が課題。大手VMS（SAP・Oracle）は高額で機能過多。スプレッドシート管理では契約更新漏れ・支払い遅延が頻発。",
        why_missing="大手SaaSはエンタープライズ案件の高ACVを狙い、SMBを軽視。SMB向け専用ベンダー管理ツールは現在ほぼ空白地帯。",
        market_size="グローバルVMS市場：2025年102.9億ドル→2034年324.1億ドル（CAGR 13.60%）\nSMBセグメントが最速成長中（CAGR 11.71%）（Technavio）",
        business_model="$49〜$199/月（従業員規模・ベンダー登録数で段階課金）｜製造業・建設業・飲食業特化テンプレート",
        coo_comment="SMBのベンダー管理は「Excelで何とかしている」状態が大半。軽量・低価格で即導入できるツールへの需要は確実に存在する。",
        source="出典：Strategic Revenue Insights, Mordor Intelligence",
        color="#007A48",
        priority=2
    ),
    BusinessIdea(
        number="07",
        name="EchoMentor",
        category="教育・学習分野",
        tagline="文脈記憶型 AIスピーキングコーチ",
        problem="語学学習の最大ボトルネックはスピーキング練習の機会不足。DuolingoやBabbelは語彙・文法訓練に特化。現在のAI会話アプリは「セッションリセット型」で前回の会話を踏まえたフィードバックができない。",
        why_missing="DuolingoはUXとサブスク維持に注力し、深い会話継続性は後回し。ChatGPTは汎用で語学特化の長期誤りパターンDBを持たない。",
        market_size="世界の語学学習アプリ市場：2025年78億ドル→2033年289億ドル（CAGR 17.6%）（SkyQuestT）\nAIスピーキング特化市場：2025年20億ドル→2033年100億ドル（PracticeMe.app）",
        business_model="Freemium（月5会話無料）｜Pro：$12/月（無制限・週次コーチングレポート）｜教育機関B2B",
        coo_comment="語学学習市場は巨大で成長中。「文脈記憶」という差別化は技術的に実現可能で、Duolingoが意図的に手を抜いている領域を突いている。",
        source="出典：SkyQuestT, MMR Statistics, PracticeMe.app",
        color="#6A3DB8",
        priority=2
    ),
    BusinessIdea(
        number="08",
        name="RubricAI",
        category="教育・学習分野",
        tagline="記述式・小論文対応 教師専用AI採点エンジン",
        problem="教師の最大の時間浪費は記述式の採点と個別フィードバック作成。120人分のエッセイ採点に60時間の手作業が発生。選択式・穴埋めには自動採点があるが、小論文・自由記述の採点はほぼ未解決。",
        why_missing="記述式採点には「ルーブリックの解釈」「学年・教科コンテキスト」「教師ごとの評価哲学」への適応が必要。Turnitin・Gradescopeはコピペ検出・数式採点に強いが人文系には非対応。",
        market_size="AI採点ツール市場：2025年時点で4.72億ドル（RapidInnovation）\nグローバルEdTech市場：2025年1,891億ドル→2034年5,887億ドル（Fortune Business Insights）",
        business_model="$15/教師/月（クラス数・生徒数上限なし）｜学校区向けエンタープライズ｜Google Classroom・Canvas連携API",
        coo_comment="教師の採点負担は世界共通の問題。規制対応コストが参入障壁となり、乗り越えた企業が市場を独占できる構造。",
        source="出典：GradeWithAI, Frontiers in Education, EdSurge",
        color="#6A3DB8",
        priority=2
    ),
    BusinessIdea(
        number="09",
        name="TonaRi（となり）",
        category="日常生活・個人向け（日本特化）",
        tagline="近隣トラブル匿名仲裁プラットフォーム",
        problem="日本の近隣騒音・生活トラブルで取れる行動は管理会社への電話か警察相談のみ。匿名性・証拠能力・ワンストップ解決のどれも満たすサービスがない。騒音計アプリは証拠として認められないケースが多い。",
        why_missing="「騒音計」「法的解決支援」「匿名コミュニティ」を組み合わせた製品が日本に存在しない。日本のプライバシー文化が匿名デジタル仲裁への需要を生んでいる。",
        market_size="国民生活センターへの相談件数：2024年度91万件超（前年比2万件増）\n分譲マンション戸数：約700万戸超（国土交通省推計）",
        business_model="個人：月額480円（証拠PDF・AI仲裁文書）｜管理組合B2B：月額5,000〜30,000円/棟｜自治体連携API",
        coo_comment="日本特化の社会課題に根ざした製品。匿名性・証拠能力・行政連携という三位一体のソリューションは国内に存在しない。",
        source="出典：国民生活センター, 法テラス, ソーチョー",
        color="#E53935",
        priority=2
    ),
    BusinessIdea(
        number="10",
        name="Kioku（記憶）",
        category="日常生活・個人向け",
        tagline="倫理設計型・故人との対話型デジタル追悼アプリ",
        problem="AI故人再現は「完全再現型（依存リスク）」と「静的メモリアル（インタラクティブ性なし）」の二極のみ。故人の記憶を整理しながら段階的に悲嘆を乗り越えるための「倫理設計型の中間ソリューション」が存在しない。",
        why_missing="完全再現型AIは倫理的批判で主流化できず。グリーフカウンセリング理論に基づく倫理設計型プロダクトは世界的に存在しない。日本は高齢化率世界最高水準で需要が構造的に増加。",
        market_size="グリーフカウンセリング市場：2025年36.7億ドル→2030年58.3億ドル（GlobeNewswire）\nHBR（2025年4月）：AIコンパニオン・セラピーが生成AIの使用事例No.1",
        business_model="個人：月額980円｜家族プラン：月額1,480円（10名まで）｜葬儀社向けホワイトラベルB2B",
        coo_comment="グリーフケアの倫理設計型というポジションは世界でも稀有。日本の高齢化社会と相性が良く、葬儀社B2B展開も現実的。",
        source="出典：GlobeNewswire, Hospice News, Tandfonline",
        color="#00838F",
        priority=3
    ),
]

# ===== 優先度マトリクス =====
PRIORITY_MATRIX = {
    "top": ["StackMix", "FollowFlo"],
    "secondary": ["DAWHub", "SoloOS", "EchoMentor", "RubricAI", "TonaRi", "VendorBridge"],
    "future": ["ClearPass", "Kioku"]
}

def get_idea_by_number(number: str):
    """番号でアイデアを取得"""
    for idea in IDEAS:
        if idea.number == number:
            return idea
    return None

def get_ideas_by_priority(priority: int):
    """優先度でアイデアをフィルタ"""
    return [idea for idea in IDEAS if idea.priority == priority]

def print_all_ideas():
    """全アイデアを表示"""
    print("=" * 80)
    print("NURANEX 10のビジネスアイデア")
    print("=" * 80)
    for idea in IDEAS:
        print(f"\n【{idea.number}】{idea.name}")
        print(f"  カテゴリ: {idea.category}")
        print(f"  概要: {idea.tagline}")
        print(f"  優先度: {'★' * idea.priority}")

if __name__ == "__main__":
    print_all_ideas()
