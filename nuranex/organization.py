"""
NURANEX株式会社 組織図・部署定義
"""

from dataclasses import dataclass
from typing import List, Optional

@dataclass
class Executive:
    """経営陣"""
    name: str
    position: str
    title_en: str
    role: str

@dataclass
class Department:
    """部署定義"""
    id: str
    name: str
    color: str
    responsibilities: List[str]

# ===== 経営陣 =====
CHAIRMAN_CEO = Executive(
    name="江成義夫",
    position="代表",
    title_en="Chairman / CEO",
    role="企業戦略・方向性決定"
)

COO = Executive(
    name="Claude Code",
    position="COO",
    title_en="AI Chief Operating Officer",
    role="日々の運営・意思決定支援・テクノロジー戦略"
)

SECRETARY = {
    "name": "秘書室",
    "responsibilities": ["スケジュール管理", "議事録作成"]
}

# ===== 部署定義 =====
DEPARTMENTS = [
    Department(
        id="marketing",
        name="マーケティング部",
        color="#004E8C",
        responsibilities=[
            "市場調査・競合分析",
            "プロモーション戦略"
        ]
    ),
    Department(
        id="sales",
        name="セールス部",
        color="#005C32",
        responsibilities=[
            "収益計画・販売戦略",
            "価格設定"
        ]
    ),
    Department(
        id="development",
        name="開発部",
        color="#4A1A8C",
        responsibilities=[
            "技術実装・開発期間",
            "スタック選定"
        ]
    ),
    Department(
        id="qa",
        name="品質保証部（QA）",
        color="#8B4500",
        responsibilities=[
            "リスク管理・品質基準",
            "テスト計画"
        ]
    ),
    Department(
        id="finance",
        name="財務部",
        color="#005A40",
        responsibilities=[
            "収支管理・ROI計算",
            "資金計画"
        ]
    ),
    Department(
        id="legal_compliance",
        name="法務・コンプライアンス部",
        color="#7A1020",
        responsibilities=[
            "契約・著作権管理",
            "利用規約確認"
        ]
    ),
    Department(
        id="pr",
        name="広報・PR部",
        color="#1A3A70",
        responsibilities=[
            "SNS・YouTube運営",
            "ブランド戦略"
        ]
    )
]

# ===== NURANEX五原則 =====
PRINCIPLES = [
    {"name": "誠実", "color": "#0090E0"},
    {"name": "改善", "color": "#007A48"},
    {"name": "挑戦", "color": "#C88000"},
    {"name": "品質", "color": "#0057B8"},
    {"name": "自動化", "color": "#C04800"}
]

PRINCIPLE_GUIDELINE = "判断に迷ったら：誠実か / 品質は十分か / 改善できないか / 挑戦する価値はあるか / 自動化できないか"

# ===== 組織図構造 =====
ORGANIZATION_STRUCTURE = {
    "ceo": CHAIRMAN_CEO,
    "coo": COO,
    "secretary": SECRETARY,
    "departments": DEPARTMENTS,
    "principles": PRINCIPLES,
    "principle_guideline": PRINCIPLE_GUIDELINE
}

def get_department_by_id(dept_id: str) -> Optional[Department]:
    """IDで部署を取得"""
    for dept in DEPARTMENTS:
        if dept.id == dept_id:
            return dept
    return None

def print_org_chart():
    """組織図をテキスト表示"""
    print("=" * 60)
    print("NURANEX株式会社 組織図")
    print("=" * 60)
    print(f"\n【経営陣】")
    print(f"  {CHAIRMAN_CEO.position}（{CHAIRMAN_CEO.title_en}）: {CHAIRMAN_CEO.name}")
    print(f"  COO（{COO.title_en}）: {COO.name}")
    print(f"  {SECRETARY['name']}")

    print(f"\n【部署】（全7部署）")
    for i, dept in enumerate(DEPARTMENTS, 1):
        print(f"  {i}. {dept.name}")
        for resp in dept.responsibilities:
            print(f"     - {resp}")

    print(f"\n【NURANEX五原則】")
    for principle in PRINCIPLES:
        print(f"  - {principle['name']}")

    print("\n" + "=" * 60)

if __name__ == "__main__":
    print_org_chart()
