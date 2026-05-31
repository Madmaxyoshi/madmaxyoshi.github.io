#!/usr/bin/env python3
"""
FollowFlo MVP PowerPoint プレゼンテーション生成スクリプト
"""

from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor

def create_presentation():
    prs = Presentation()
    prs.slide_width = Inches(10)
    prs.slide_height = Inches(7.5)

    # Define color scheme
    BRAND_BLUE = RGBColor(33, 150, 243)  # Material Blue
    ACCENT_GREEN = RGBColor(76, 175, 80)  # Material Green
    DARK_GRAY = RGBColor(66, 66, 66)
    LIGHT_GRAY = RGBColor(240, 240, 240)

    # Slide 1: Title Slide
    slide1 = prs.slides.add_slide(prs.slide_layouts[6])  # Blank layout
    background = slide1.background
    fill = background.fill
    fill.solid()
    fill.fore_color.rgb = BRAND_BLUE

    title_box = slide1.shapes.add_textbox(Inches(0.5), Inches(2.5), Inches(9), Inches(2))
    title_frame = title_box.text_frame
    title_frame.word_wrap = True
    p = title_frame.paragraphs[0]
    p.text = "FollowFlo"
    p.font.size = Pt(72)
    p.font.bold = True
    p.font.color.rgb = RGBColor(255, 255, 255)
    p.alignment = PP_ALIGN.CENTER

    subtitle_box = slide1.shapes.add_textbox(Inches(0.5), Inches(4.5), Inches(9), Inches(2))
    subtitle_frame = subtitle_box.text_frame
    p = subtitle_frame.paragraphs[0]
    p.text = "会議アクションアイテム完了保証エンジン"
    p.font.size = Pt(32)
    p.font.color.rgb = RGBColor(200, 220, 255)
    p.alignment = PP_ALIGN.CENTER

    # Slide 2: 5 Differentiation Features
    slide2 = prs.slides.add_slide(prs.slide_layouts[1])
    title = slide2.shapes.title
    title.text = "FollowFlo ができる 5 つの事"
    title.text_frame.paragraphs[0].font.size = Pt(44)
    title.text_frame.paragraphs[0].font.bold = True
    title.text_frame.paragraphs[0].font.color.rgb = BRAND_BLUE

    subtitle = slide2.placeholders[1]
    subtitle.text = "真の差別化 ── AI議事録の「その先」へ"
    subtitle.text_frame.paragraphs[0].font.size = Pt(24)
    subtitle.text_frame.paragraphs[0].font.color.rgb = DARK_GRAY

    features = [
        ("1️⃣ マルチシグナル完了検出",
         "Slack / Teams / Zoom / Notion / Asana\n複数プラットフォームの完了を統一追跡"),
        ("2️⃣ 完了証拠の自動記録",
         "タイムスタンプ + ユーザーID + スクリーンショット\n改ざん防止の暗号検証"),
        ("3️⃣ AI検証エンジン（4段階）",
         "自動検出 → 文脈確認 → 検証 → 人間確認\n誤検知を完全排除"),
        ("4️⃣ 段階的エスカレーション",
         "T-1日リマインド → T+24h通知 → T+3日報告\n期限超過の自動段階対応"),
        ("5️⃣ 3階層レポート",
         "個人 / チーム / 経営陣\nステークホルダー別の最適ダッシュボード"),
    ]

    y_start = 1.2
    for i, (title_text, desc_text) in enumerate(features):
        y = y_start + (i * 1.0)

        box = slide2.shapes.add_shape(1, Inches(0.5), Inches(y), Inches(9), Inches(0.9))
        box.fill.solid()
        box.fill.fore_color.rgb = LIGHT_GRAY if i % 2 == 0 else RGBColor(255, 255, 255)
        box.line.color.rgb = BRAND_BLUE
        box.line.width = Pt(1)

        text_frame = box.text_frame
        text_frame.margin_bottom = Inches(0.05)
        text_frame.margin_left = Inches(0.1)
        text_frame.margin_right = Inches(0.1)
        text_frame.word_wrap = True

        p = text_frame.paragraphs[0]
        p.text = title_text
        p.font.size = Pt(14)
        p.font.bold = True
        p.font.color.rgb = BRAND_BLUE

        p2 = text_frame.add_paragraph()
        p2.text = desc_text
        p2.font.size = Pt(11)
        p2.font.color.rgb = DARK_GRAY
        p2.level = 0

    # Slide 3: Competitive Comparison
    slide3 = prs.slides.add_slide(prs.slide_layouts[1])
    title = slide3.shapes.title
    title.text = "競合比較 ── 市場での立ち位置"
    title.text_frame.paragraphs[0].font.size = Pt(40)
    title.text_frame.paragraphs[0].font.bold = True
    title.text_frame.paragraphs[0].font.color.rgb = BRAND_BLUE

    # Create comparison table
    rows, cols = 5, 8
    left = Inches(0.3)
    top = Inches(1.2)
    width = Inches(9.4)
    height = Inches(4.5)

    table_shape = slide3.shapes.add_table(rows, cols, left, top, width, height)
    table = table_shape.table

    # Set column widths
    table.columns[0].width = Inches(1.2)
    for i in range(1, 8):
        table.columns[i].width = Inches(1.17)

    # Header row
    headers = ["製品", "AI議事録", "アクション\n抽出", "自律\n追跡", "マルチ\nシグナル", "エスカ\nレーション", "証拠\nチェーン", "AI検証"]
    for col, header in enumerate(headers):
        cell = table.cell(0, col)
        cell.text = header
        cell.fill.solid()
        cell.fill.fore_color.rgb = BRAND_BLUE
        for paragraph in cell.text_frame.paragraphs:
            for run in paragraph.runs:
                run.font.bold = True
                run.font.size = Pt(10)
                run.font.color.rgb = RGBColor(255, 255, 255)

    # Data rows
    data = [
        ["Otter.ai", "✅", "△", "❌", "❌", "❌", "❌", "❌"],
        ["Fireflies.ai", "✅", "✅", "❌", "❌", "❌", "❌", "❌"],
        ["Fellow.ai", "✅", "✅", "△", "❌", "△", "❌", "❌"],
        ["FollowFlo 🚀", "❌", "✅", "✅", "✅", "✅", "✅", "✅"],
    ]

    for row_idx, row_data in enumerate(data):
        for col_idx, cell_text in enumerate(row_data):
            cell = table.cell(row_idx + 1, col_idx)
            cell.text = cell_text

            if row_idx == 3:  # FollowFlo row
                cell.fill.solid()
                cell.fill.fore_color.rgb = RGBColor(200, 230, 201)
            else:
                cell.fill.solid()
                cell.fill.fore_color.rgb = RGBColor(255, 255, 255)

            for paragraph in cell.text_frame.paragraphs:
                for run in paragraph.runs:
                    run.font.size = Pt(10)
                    if col_idx == 0:
                        run.font.bold = True
                    if row_idx == 3 and cell_text in ["✅"]:
                        run.font.color.rgb = ACCENT_GREEN
                paragraph.alignment = PP_ALIGN.CENTER

    # Note
    note_box = slide3.shapes.add_textbox(Inches(0.5), Inches(6.2), Inches(9), Inches(0.8))
    note_frame = note_box.text_frame
    p = note_frame.paragraphs[0]
    p.text = "※ FollowFlo は「完了追跡」に特化 → 既存AI議事録ツールと連携可能"
    p.font.size = Pt(12)
    p.font.italic = True
    p.font.color.rgb = DARK_GRAY

    # Slide 4: How It Works - 4-Stage Verification
    slide4 = prs.slides.add_slide(prs.slide_layouts[1])
    title = slide4.shapes.title
    title.text = "4段階検証エンジン"
    title.text_frame.paragraphs[0].font.size = Pt(40)
    title.text_frame.paragraphs[0].font.bold = True
    title.text_frame.paragraphs[0].font.color.rgb = BRAND_BLUE

    stages = [
        ("Stage 1: 自動検出", "完了シグナルを検知\n✅ 完了 done finished"),
        ("Stage 2: 文脈確認", "タスク名 & ユーザーマッチ\n信頼度スコア計算"),
        ("Stage 3: 証拠記録", "SHA256ハッシング\nタイムスタンプ自動保存"),
        ("Stage 4: 人間確認", "低信頼度フラグ\nマネージャー確認"),
    ]

    for i, (stage_title, stage_desc) in enumerate(stages):
        x = 0.5 + (i % 2) * 5
        y = 1.3 + (i // 2) * 2.5

        # Stage box
        box = slide4.shapes.add_shape(1, Inches(x), Inches(y), Inches(4.3), Inches(2))
        box.fill.solid()
        box.fill.fore_color.rgb = RGBColor(230, 240, 255)
        box.line.color.rgb = BRAND_BLUE
        box.line.width = Pt(2)

        text_frame = box.text_frame
        text_frame.margin_top = Inches(0.1)
        text_frame.margin_left = Inches(0.15)
        text_frame.margin_right = Inches(0.15)
        text_frame.word_wrap = True

        p = text_frame.paragraphs[0]
        p.text = stage_title
        p.font.size = Pt(13)
        p.font.bold = True
        p.font.color.rgb = BRAND_BLUE

        p2 = text_frame.add_paragraph()
        p2.text = stage_desc
        p2.font.size = Pt(11)
        p2.font.color.rgb = DARK_GRAY
        p2.space_before = Pt(8)

    # Slide 5: Escalation Workflow
    slide5 = prs.slides.add_slide(prs.slide_layouts[1])
    title = slide5.shapes.title
    title.text = "自動エスカレーション（3段階）"
    title.text_frame.paragraphs[0].font.size = Pt(40)
    title.text_frame.paragraphs[0].font.bold = True
    title.text_frame.paragraphs[0].font.color.rgb = BRAND_BLUE

    escalations = [
        ("⏰ Stage 1\nT-1日", "リマインド通知\n割当者へ"),
        ("⚠️ Stage 2\nT+24時間", "マネージャー通知\n作成者へ"),
        ("📊 Stage 3\nT+3日", "エグゼクティブ\nレポート"),
    ]

    for i, (timeline, action) in enumerate(escalations):
        x = 1.0 + (i * 2.8)
        y = 2

        # Timeline box
        box = slide5.shapes.add_shape(1, Inches(x), Inches(y), Inches(2.4), Inches(2.5))
        box.fill.solid()
        if i == 0:
            box.fill.fore_color.rgb = RGBColor(255, 235, 59)  # Yellow
        elif i == 1:
            box.fill.fore_color.rgb = RGBColor(255, 152, 0)   # Orange
        else:
            box.fill.fore_color.rgb = RGBColor(244, 67, 54)   # Red
        box.line.color.rgb = DARK_GRAY
        box.line.width = Pt(2)

        text_frame = box.text_frame
        text_frame.margin_top = Inches(0.15)
        text_frame.word_wrap = True

        p = text_frame.paragraphs[0]
        p.text = timeline
        p.font.size = Pt(14)
        p.font.bold = True
        p.font.color.rgb = RGBColor(255, 255, 255)
        p.alignment = PP_ALIGN.CENTER

        p2 = text_frame.add_paragraph()
        p2.text = action
        p2.font.size = Pt(12)
        p2.font.color.rgb = RGBColor(255, 255, 255)
        p2.alignment = PP_ALIGN.CENTER
        p2.space_before = Pt(10)

    # Slide 6: MVP Roadmap (Lightning Version)
    slide6 = prs.slides.add_slide(prs.slide_layouts[1])
    title = slide6.shapes.title
    title.text = "MVP ロードマップ（Lightning版）"
    title.text_frame.paragraphs[0].font.size = Pt(40)
    title.text_frame.paragraphs[0].font.bold = True
    title.text_frame.paragraphs[0].font.color.rgb = BRAND_BLUE

    phases = [
        ("Phase 1", "3〜4日", ["✅ Slack Bot", "✅ マルチシグナル", "✅ メトリクス", "✅ ダッシュボード"]),
        ("Phase 2", "2週間", ["✅ エラーハンドリング", "✅ オートエスカレーション", "✅ AI検証 初版", "✅ Teams連携"]),
        ("Phase 3", "1ヶ月", ["✅ Zoom/Notion/Asana", "✅ 証拠チェーン", "✅ 3階層レポート", "✅ セキュリティ"]),
    ]

    y_pos = 1.3
    for phase_name, duration, items in phases:
        # Phase header
        header_box = slide6.shapes.add_shape(1, Inches(0.5), Inches(y_pos), Inches(9), Inches(0.35))
        header_box.fill.solid()
        header_box.fill.fore_color.rgb = BRAND_BLUE
        header_box.line.width = Pt(0)

        text_frame = header_box.text_frame
        p = text_frame.paragraphs[0]
        p.text = f"{phase_name}  ━  {duration}"
        p.font.size = Pt(13)
        p.font.bold = True
        p.font.color.rgb = RGBColor(255, 255, 255)

        # Items
        y_pos += 0.45
        for item in items:
            item_box = slide6.shapes.add_textbox(Inches(1.0), Inches(y_pos), Inches(8.5), Inches(0.3))
            text_frame = item_box.text_frame
            p = text_frame.paragraphs[0]
            p.text = item
            p.font.size = Pt(11)
            p.font.color.rgb = DARK_GRAY
            y_pos += 0.3

        y_pos += 0.2

    # Note
    note_box = slide6.shapes.add_textbox(Inches(0.5), Inches(6.8), Inches(9), Inches(0.5))
    note_frame = note_box.text_frame
    p = note_frame.paragraphs[0]
    p.text = "最小チーム: フルスタック1名（MVP開発中）"
    p.font.size = Pt(12)
    p.font.italic = True
    p.font.color.rgb = ACCENT_GREEN

    # Slide 7: Business Model & GTM
    slide7 = prs.slides.add_slide(prs.slide_layouts[1])
    title = slide7.shapes.title
    title.text = "ビジネスモデル"
    title.text_frame.paragraphs[0].font.size = Pt(40)
    title.text_frame.paragraphs[0].font.bold = True
    title.text_frame.paragraphs[0].font.color.rgb = BRAND_BLUE

    biz_data = [
        ("価格", "$15/ユーザー/月", ACCENT_GREEN),
        ("対象", "50人以上のチーム", BRAND_BLUE),
        ("初期設定", "4時間サービス", RGBColor(255, 152, 0)),
        ("デプロイ", "専用 Slack Workspace", RGBColor(244, 67, 54)),
    ]

    y_pos = 1.5
    for label, value, color in biz_data:
        # Label box
        label_box = slide7.shapes.add_shape(1, Inches(1.5), Inches(y_pos), Inches(2), Inches(0.7))
        label_box.fill.solid()
        label_box.fill.fore_color.rgb = color
        label_box.line.width = Pt(0)

        text_frame = label_box.text_frame
        p = text_frame.paragraphs[0]
        p.text = label
        p.font.size = Pt(14)
        p.font.bold = True
        p.font.color.rgb = RGBColor(255, 255, 255)
        p.alignment = PP_ALIGN.CENTER

        # Value box
        value_box = slide7.shapes.add_textbox(Inches(3.8), Inches(y_pos), Inches(4.7), Inches(0.7))
        text_frame = value_box.text_frame
        text_frame.vertical_anchor = 1  # Middle
        p = text_frame.paragraphs[0]
        p.text = value
        p.font.size = Pt(14)
        p.font.bold = True
        p.font.color.rgb = DARK_GRAY

        y_pos += 1.0

    # Slide 8: Call to Action
    slide8 = prs.slides.add_slide(prs.slide_layouts[6])
    background = slide8.background
    fill = background.fill
    fill.solid()
    fill.fore_color.rgb = BRAND_BLUE

    cta_box = slide8.shapes.add_textbox(Inches(1), Inches(2), Inches(8), Inches(3.5))
    text_frame = cta_box.text_frame
    text_frame.word_wrap = True

    p = text_frame.paragraphs[0]
    p.text = "会議アクションアイテムの\n完了保証をお約束します"
    p.font.size = Pt(48)
    p.font.bold = True
    p.font.color.rgb = RGBColor(255, 255, 255)
    p.alignment = PP_ALIGN.CENTER

    p2 = text_frame.add_paragraph()
    p2.text = "FollowFlo MVP ── 2026年5月31日"
    p2.font.size = Pt(20)
    p2.font.color.rgb = RGBColor(200, 220, 255)
    p2.alignment = PP_ALIGN.CENTER
    p2.space_before = Pt(30)

    # Save presentation
    prs.save('FollowFlo_MVP_Presentation.pptx')
    print("✅ PowerPoint プレゼンテーション生成完了: FollowFlo_MVP_Presentation.pptx")

if __name__ == '__main__':
    create_presentation()
