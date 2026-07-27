"""
Generates the Jays Shop daily development summary PDF for July 27, 2026.
"""
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, Frame, PageTemplate, BaseDocTemplate, NextPageTemplate
)
from reportlab.pdfgen import canvas
from reportlab.pdfbase.pdfmetrics import stringWidth

OUTPUT_PATH = "/Users/idehenomoruyi/projects/jays-shop/docs/deliverables/daily-summary-2026-07-27.pdf"

NAVY = colors.HexColor("#134A8E")
ICE = colors.HexColor("#F0F4FA")
STEEL = colors.HexColor("#5B6B7A")
DARK = colors.HexColor("#1A1E23")
GREY = colors.HexColor("#8A94A0")
GREEN = colors.HexColor("#1E7A3D")
AMBER = colors.HexColor("#B5761A")

PAGE_W, PAGE_H = LETTER

FOOTER_TEXT = "Jays Shop — Daily Dev Summary — July 27, 2026"


def draw_footer(c: canvas.Canvas, doc):
    c.saveState()
    c.setStrokeColor(colors.HexColor("#D9DEE4"))
    c.setLineWidth(0.6)
    c.line(2.2*cm, 1.55*cm, PAGE_W - 2.2*cm, 1.55*cm)
    c.setFont("Helvetica", 8)
    c.setFillColor(GREY)
    c.drawString(2.2*cm, 1.15*cm, FOOTER_TEXT)
    page_num_text = f"Page {doc.page}"
    c.drawRightString(PAGE_W - 2.2*cm, 1.15*cm, page_num_text)
    c.restoreState()


styles = getSampleStyleSheet()

title_style = ParagraphStyle(
    "TitleMain", parent=styles["Title"], fontName="Helvetica-Bold",
    fontSize=22, leading=27, textColor=NAVY, spaceAfter=6, alignment=TA_LEFT,
)
subtitle_style = ParagraphStyle(
    "Subtitle", parent=styles["Normal"], fontName="Helvetica",
    fontSize=11, leading=15, textColor=STEEL, spaceAfter=2,
)
url_style = ParagraphStyle(
    "UrlStyle", parent=styles["Normal"], fontName="Helvetica-Oblique",
    fontSize=10, leading=14, textColor=NAVY, spaceAfter=0,
)
section_heading_style = ParagraphStyle(
    "SectionHeading", parent=styles["Heading2"], fontName="Helvetica-Bold",
    fontSize=13.5, leading=17, textColor=colors.white, spaceBefore=0, spaceAfter=0,
    leftIndent=0,
)
label_style = ParagraphStyle(
    "LabelStyle", parent=styles["Normal"], fontName="Helvetica-Bold",
    fontSize=9.5, leading=13, textColor=NAVY, spaceBefore=8, spaceAfter=2,
)
body_style = ParagraphStyle(
    "BodyStyle", parent=styles["Normal"], fontName="Helvetica",
    fontSize=10, leading=14.5, textColor=DARK, spaceAfter=0,
)
files_style = ParagraphStyle(
    "FilesStyle", parent=styles["Normal"], fontName="Helvetica-Oblique",
    fontSize=9.5, leading=13, textColor=STEEL, spaceAfter=0,
)
commit_style = ParagraphStyle(
    "CommitStyle", parent=styles["Normal"], fontName="Courier",
    fontSize=9, leading=12, textColor=STEEL,
)
overview_heading_style = ParagraphStyle(
    "OverviewHeading", parent=styles["Heading2"], fontName="Helvetica-Bold",
    fontSize=13, leading=16, textColor=NAVY, spaceBefore=4, spaceAfter=8,
)
hold_item_title_style = ParagraphStyle(
    "HoldItemTitle", parent=styles["Normal"], fontName="Helvetica-Bold",
    fontSize=10.5, leading=14, textColor=DARK, spaceAfter=2,
)
hold_item_body_style = ParagraphStyle(
    "HoldItemBody", parent=styles["Normal"], fontName="Helvetica",
    fontSize=10, leading=14, textColor=STEEL,
)

items = [
    {
        "num": "1",
        "title": "We Care Dropdown Fix",
        "commit": "6e22eec",
        "problem": (
            "The 'We Care' dropdown trigger button (hamburger menu icon) was clipped/overflowing "
            "past the viewport on real iPhone 12 devices. The header's right-hand icon group needed "
            "~212px but only had ~177&ndash;200px available."
        ),
        "fix": (
            "Shrunk icon button sizes (36px &rarr; 32px), gaps, language pill padding, and hamburger "
            "icon size (32px &rarr; 28px) below the <b>sm</b> Tailwind breakpoint only. Desktop "
            "(&ge;640px) is pixel-identical to before. This freed ~24px, giving 8px margin on all 4 "
            "iPhone 12 variants."
        ),
        "files": ["Header.tsx", "HeaderActions.tsx", "NotificationBell.tsx"],
    },
    {
        "num": "2",
        "title": "Full Cross-Device Responsive Audit &amp; Fix",
        "commit": "e230b9d",
        "problem": (
            "After the iPhone 12 fix, residual clipping existed at 320px/360px widths (iPhone SE, "
            "Galaxy S8). Also a 640&ndash;767px dead zone where We Care was unreachable (hamburger gone "
            "at <b>sm</b> but desktop popover only appearing at <b>md</b>)."
        ),
        "fix": (
            "Added a new <b>xs: 375px</b> Tailwind breakpoint tier so icons/gaps shrink further below "
            "375px. Changed We Care trigger from <b>hidden md:block</b> to <b>hidden sm:block</b> to "
            "close the dead zone. Verified across 13 viewport widths (320&ndash;1440px) with zero clipping."
        ),
        "files": ["Header.tsx", "HeaderActions.tsx", "NotificationBell.tsx", "tailwind.config.ts"],
    },
    {
        "num": "3",
        "title": "Convert to Hold Feature",
        "commit": "c2df7cc",
        "problem": (
            "When clicking 'Convert to Hold' in the cart, the user was navigated to the product page "
            "but the Hold/Reserve modal did not auto-open and the selected size was not carried over."
        ),
        "fix": (
            "The cart already sent <b>?convertToHold=1&amp;size=XL</b> query params, but "
            "<b>HoldButton.tsx</b> never read them. Added a mount-effect that reads the params, "
            "validates size against available sizes, pre-sets selectedSize and quantity state, "
            "auto-opens the modal, then cleans the URL."
        ),
        "files": ["HoldButton.tsx", "cart/page.tsx"],
    },
    {
        "num": "4",
        "title": "Mobile PDP Edge-to-Edge Product Gallery",
        "commit": "e0b1701",
        "problem": (
            "Product images on mobile had excessive padding, rounded card borders, and side gutters, "
            "making products appear small on mobile screens."
        ),
        "fix": (
            "Removed rounded-card padding/border/margin on mobile using the <b>lg:</b> prefix "
            "(preserving desktop). Applied <b>-mx-4 lg:mx-0</b> to cancel parent container padding. "
            "Changed inner padding from <b>p-4</b> to <b>p-0 lg:p-4</b>. Updated Next.js Image "
            "<b>sizes</b> breakpoint to match."
        ),
        "files": ["ProductImageGallery.tsx", "shop/[slug]/page.tsx"],
    },
    {
        "num": "5",
        "title": "Dot Pagination Removal &mdash; Mobile &amp; Desktop",
        "commit": "ab551a6, 9a5c564",
        "problem": (
            "3-dot pagination indicators overlaid on the product image, obstructing the product view "
            "on both mobile and desktop."
        ),
        "fix": (
            "Changed dot container from visible to <b>hidden</b> at all viewport widths. JSX preserved "
            "for future re-enablement. Thumbnail strip below remains the active image indicator."
        ),
        "files": ["ProductImageGallery.tsx"],
    },
    {
        "num": "6",
        "title": "Navigation Links Bold Styling",
        "commit": "d4771ce",
        "problem": (
            "SHOP, SHOP BY STYLE, and SHOP BY PLAYER navigation links were not visually distinct from "
            "other nav items."
        ),
        "fix": (
            "Added a <b>primary</b> flag to these 3 links in <b>SubNavBar.tsx</b>. Primary items get "
            "<b>font-bold</b> + <b>text-jays-navy (#134A8E)</b> + <b>bg-jays-ice (#F0F4FA)</b> pill "
            "background. Other items remain <b>font-semibold</b> + <b>text-jays-steel</b>."
        ),
        "files": ["SubNavBar.tsx"],
    },
]

on_hold = [
    {
        "title": "Footer Canadian Flag Repositioning",
        "body": "Intentionally stopped by user.",
    },
    {
        "title": "Stale Notification DB Cleanup",
        "body": "Paused &mdash; customer-facing bug already fixed.",
    },
]


def section_header_flowable(number, title):
    """Build a full-width colored bar Table acting as a section header."""
    badge = Table(
        [[Paragraph(f"<b>{number}</b>", ParagraphStyle(
            "BadgeNum", parent=styles["Normal"], fontName="Helvetica-Bold",
            fontSize=13, leading=16, textColor=NAVY, alignment=TA_CENTER,
        ))]],
        colWidths=[0.9*cm], rowHeights=[0.9*cm],
    )
    badge.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.white),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("BOX", (0, 0), (-1, -1), 0, colors.white),
    ]))
    heading_para = Paragraph(title, section_heading_style)
    tbl = Table(
        [[badge, heading_para]],
        colWidths=[1.3*cm, 15.2*cm],
    )
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), NAVY),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (0, 0), 6),
        ("LEFTPADDING", (1, 0), (1, 0), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return tbl


def build_story():
    story = []

    # ---- Title block ----
    story.append(Paragraph("Jays Shop &mdash; Development Summary", title_style))
    story.append(Paragraph("July 27, 2026", ParagraphStyle(
        "DateLine", parent=styles["Normal"], fontName="Helvetica-Bold",
        fontSize=14, leading=18, textColor=STEEL, spaceAfter=8,
    )))
    story.append(Paragraph(
        'Production URL: <link href="https://jayshop-retail-platform.vercel.app" color="#134A8E">'
        'https://jayshop-retail-platform.vercel.app</link>',
        url_style,
    ))
    story.append(Spacer(1, 4))
    story.append(HRFlowable(width="100%", thickness=1.2, color=NAVY, spaceBefore=8, spaceAfter=14))

    # ---- Overview strip ----
    def stat_cell(number, label, color):
        num_style = ParagraphStyle(
            f"Big_{label}", parent=styles["Normal"], fontName="Helvetica-Bold",
            fontSize=22, leading=26, textColor=color, alignment=TA_CENTER, spaceAfter=2,
        )
        lbl_style = ParagraphStyle(
            f"Lbl_{label}", parent=styles["Normal"], fontName="Helvetica",
            fontSize=8.5, leading=11, textColor=STEEL, alignment=TA_CENTER,
        )
        inner = Table(
            [[Paragraph(f"<b>{number}</b>", num_style)], [Paragraph(label, lbl_style)]],
            colWidths=[5.5*cm],
        )
        inner.setStyle(TableStyle([
            ("TOPPADDING", (0, 0), (-1, -1), 1),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
        ]))
        return inner

    overview_data = [[
        stat_cell("6", "Items Completed", NAVY),
        stat_cell("7", "Commits Shipped", NAVY),
        stat_cell("2", "Items On Hold", AMBER),
    ]]
    overview_tbl = Table(overview_data, colWidths=[5.5*cm, 5.5*cm, 5.5*cm])
    overview_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), ICE),
        ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#D9E2F3")),
        ("INNERGRID", (0, 0), (-1, -1), 0.75, colors.HexColor("#D9E2F3")),
        ("TOPPADDING", (0, 0), (-1, -1), 12),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story.append(overview_tbl)
    story.append(Spacer(1, 20))

    # ---- Completed items ----
    for item in items:
        story.append(section_header_flowable(item["num"], item["title"]))
        story.append(Spacer(1, 6))
        story.append(Paragraph(f"Commit: {item['commit']}", commit_style))
        story.append(Paragraph("PROBLEM", label_style))
        story.append(Paragraph(item["problem"], body_style))
        story.append(Paragraph("FIX", label_style))
        story.append(Paragraph(item["fix"], body_style))
        story.append(Paragraph("FILES CHANGED", label_style))
        files_line = " &middot; ".join(f"<font name='Courier'>{f}</font>" for f in item["files"])
        story.append(Paragraph(files_line, files_style))
        story.append(Spacer(1, 16))

    # ---- On hold section ----
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#D9DEE4"), spaceBefore=4, spaceAfter=14))
    story.append(Paragraph("Items On Hold &mdash; Not Completed", overview_heading_style))

    hold_table = Table(
        [[Paragraph(f"<b>&#9679; {h['title']}</b><br/>{h['body']}", ParagraphStyle(
            "HoldCombined", parent=styles["Normal"], fontName="Helvetica",
            fontSize=10, leading=14, textColor=DARK,
        ))] for h in on_hold],
        colWidths=[16.5*cm],
    )
    hold_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FBF6EC")),
        ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#E8D9B5")),
        ("LINEBELOW", (0, 0), (-1, 0), 0.75, colors.HexColor("#E8D9B5")),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(hold_table)

    return story


def main():
    doc = SimpleDocTemplate(
        OUTPUT_PATH,
        pagesize=LETTER,
        topMargin=2.2*cm,
        bottomMargin=2.3*cm,
        leftMargin=2.2*cm,
        rightMargin=2.2*cm,
        title="Jays Shop - Development Summary - July 27, 2026",
        author="Jays Shop Engineering",
    )
    story = build_story()
    doc.build(story, onFirstPage=draw_footer, onLaterPages=draw_footer)
    print(f"PDF written to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
