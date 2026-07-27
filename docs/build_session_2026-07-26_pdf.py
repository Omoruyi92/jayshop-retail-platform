# -*- coding: utf-8 -*-
"""
Jays Shop — 2026-07-26 Feature Summary
Concise session documentation PDF using reportlab Platypus, styled to match
the existing docs/build_v2_pdf.py visual conventions (colors, fonts, layout).
"""
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
                                 PageBreak, HRFlowable, ListFlowable, ListItem)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY

NAVY = colors.HexColor("#14213D")
ROYAL = colors.HexColor("#134A8E")
RED = colors.HexColor("#C4141C")
ICE = colors.HexColor("#EAF1FB")
GREY = colors.HexColor("#5A6472")
LIGHT_GREY = colors.HexColor("#F4F6F9")
GREEN = colors.HexColor("#1E7A46")

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="CoverTitle", fontName="Helvetica-Bold", fontSize=26, leading=32,
                           textColor=colors.white, alignment=TA_CENTER))
styles.add(ParagraphStyle(name="CoverSub", fontName="Helvetica", fontSize=12.5, leading=18,
                           textColor=ICE, alignment=TA_CENTER, spaceBefore=10))
styles.add(ParagraphStyle(name="DateBadge", fontName="Helvetica-Bold", fontSize=12.5, leading=16,
                           textColor=colors.white, alignment=TA_CENTER))
styles.add(ParagraphStyle(name="H1", fontName="Helvetica-Bold", fontSize=16, leading=21,
                           textColor=NAVY, spaceBefore=2, spaceAfter=6))
styles.add(ParagraphStyle(name="FeatureNo", fontName="Helvetica-Bold", fontSize=9.5, leading=13,
                           textColor=colors.white, alignment=TA_CENTER))
styles.add(ParagraphStyle(name="H2", fontName="Helvetica-Bold", fontSize=10.8, leading=15,
                           textColor=ROYAL, spaceBefore=8, spaceAfter=4))
styles.add(ParagraphStyle(name="Body", fontName="Helvetica", fontSize=9.7, leading=14.3,
                           textColor=colors.HexColor("#22262B"), alignment=TA_JUSTIFY, spaceAfter=5))
styles.add(ParagraphStyle(name="BulletP", parent=styles["Body"], leftIndent=0, spaceAfter=3, alignment=TA_LEFT))
styles.add(ParagraphStyle(name="StatusPass", fontName="Helvetica-Bold", fontSize=8.6, leading=12,
                           textColor=GREEN))
styles.add(ParagraphStyle(name="FilesMono", fontName="Courier", fontSize=7.6, leading=11,
                           textColor=GREY))
styles.add(ParagraphStyle(name="TOCItem", fontName="Helvetica", fontSize=9.6, leading=16,
                           textColor=colors.HexColor("#22262B")))
styles.add(ParagraphStyle(name="TOCNo", fontName="Helvetica-Bold", fontSize=9.6, leading=16,
                           textColor=RED))
styles.add(ParagraphStyle(name="Caption", fontName="Helvetica-Oblique", fontSize=8, leading=11,
                           textColor=GREY, alignment=TA_CENTER))

story = []
PAGE_W = LETTER[0] - 2 * 0.85 * inch


def rule(color=RED, thickness=1.6, spaceBefore=1, spaceAfter=9):
    story.append(Spacer(1, spaceBefore))
    story.append(HRFlowable(width="100%", thickness=thickness, color=color))
    story.append(Spacer(1, spaceAfter))


def feature_header(number, title):
    badge = Table([[Paragraph(str(number), styles["FeatureNo"])]], colWidths=[0.32 * inch], rowHeights=[0.32 * inch])
    badge.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), RED),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    title_cell = Paragraph(title, styles["H1"])
    header = Table([[badge, title_cell]], colWidths=[0.42 * inch, PAGE_W - 0.42 * inch])
    header.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (1, 0), (1, 0), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    story.append(header)
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#D8E0EC")))
    story.append(Spacer(1, 8))


def h2(text):
    story.append(Paragraph(text, styles["H2"]))


def p(text):
    story.append(Paragraph(text, styles["Body"]))


def bullets(items):
    story.append(ListFlowable(
        [ListItem(Paragraph(i, styles["BulletP"]), bulletColor=RED, value="square") for i in items],
        bulletType="bullet", start="square", leftIndent=13, bulletFontSize=5.5, spaceBefore=1, spaceAfter=6))


def status_line(text):
    story.append(Paragraph("&#9679; STATUS: " + text, styles["StatusPass"]))
    story.append(Spacer(1, 4))


def files_block(paths):
    text = "<br/>".join(paths)
    story.append(Paragraph(text, styles["FilesMono"]))


def page_break():
    story.append(PageBreak())


# ================================================================== COVER
story.append(Spacer(1, 1.5 * inch))
story.append(Paragraph("JAYS SHOP", ParagraphStyle(name="Brand", fontName="Helvetica-Bold", fontSize=15,
                        textColor=colors.HexColor("#8FB3E8"), alignment=TA_CENTER, spaceAfter=4)))
story.append(Paragraph("Digital Retail &amp; In-Stadium Fulfillment Platform", styles["CoverSub"]))
story.append(Spacer(1, 22))
badge = Table([[Paragraph("SESSION 2026-07-26", styles["DateBadge"])]], colWidths=[2.1 * inch], rowHeights=[0.34 * inch])
badge.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), RED), ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                            ("VALIGN", (0, 0), (-1, -1), "MIDDLE")]))
badge_wrap = Table([[badge]], colWidths=[PAGE_W])
badge_wrap.setStyle(TableStyle([("ALIGN", (0, 0), (-1, -1), "CENTER")]))
story.append(badge_wrap)
story.append(Spacer(1, 18))
story.append(Paragraph("FEATURE SUMMARY", styles["CoverTitle"]))
story.append(Spacer(1, 14))
story.append(HRFlowable(width="20%", thickness=2, color=RED, hAlign="CENTER"))
story.append(Spacer(1, 14))
story.append(Paragraph(
    "A concise record of the shipped features and fixes completed in the July 26, 2026 "
    "development session — covering PDP size-chart UX, footer/nav navigation cleanup, "
    "an admin notification bug fix, and the new City Connect / Championship Gear "
    "product-tagging and merchandising system.",
    styles["CoverSub"]))
story.append(Spacer(1, 230))
story.append(Paragraph("Prepared as an internal engineering changelog for this development session",
                        ParagraphStyle(name="foot", fontName="Helvetica", fontSize=9, textColor=colors.HexColor("#8FB3E8"),
                                       alignment=TA_CENTER)))
page_break()

# ================================================================== TOC
story.append(Paragraph("What's Inside", styles["H1"]))
rule(spaceAfter=12)
toc_items = [
    "PDP Size Chart Dropdown",
    "Size Chart Dropdown Responsive Fix",
    "Size Chart Nav-to-Footer Move",
    "Admin → Customer Notification Sync Fix",
    "City Connect / Championship Gear Product Tagging",
    "City Connect / Championship Gear Catalog Identifier",
    "Nav Bar Centering Fix",
]
toc_rows = [[Paragraph(str(i + 1), styles["TOCNo"]), Paragraph(t, styles["TOCItem"])] for i, t in enumerate(toc_items)]
toc_table = Table(toc_rows, colWidths=[0.35 * inch, PAGE_W - 0.35 * inch])
toc_table.setStyle(TableStyle([
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("TOPPADDING", (0, 0), (-1, -1), 4),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ("LINEBELOW", (0, 0), (-1, -2), 0.4, colors.HexColor("#E4E9F0")),
]))
story.append(toc_table)
story.append(Spacer(1, 16))
p("All seven items below were designed, implemented, committed, and verified against the "
  "live codebase on 2026-07-26. Each entry lists the user-facing value, the technical "
  "mechanism, the touched files, and confirmed status.")
page_break()

# ================================================================== 1. PDP Size Chart Dropdown
feature_header(1, "PDP Size Chart Dropdown")
p("Adds a &ldquo;Size Chart&rdquo; trigger directly next to &ldquo;Select Size&rdquo; on the Product "
   "Detail Page. Clicking it opens an inline, category-aware dropdown showing the correct sizing "
   "table (men's/unisex, women's, kids/youth, or hat sizing) for that exact product &mdash; so shoppers "
   "no longer have to leave the page and lose their place to check sizing on the separate full "
   "size-chart page.")
h2("Technical Implementation")
bullets([
    "New shared data module <b>sizeChartData.ts</b> extracts all size tables (mens/womens/kids/hats) "
    "out of the existing full <code>/size-chart</code> page so both surfaces stay in sync from one source of truth.",
    "<b>resolveSizeChartKinds()</b> inspects a product's <code>category</code>, <code>productType</code>, "
    "<code>hatStyle</code>, and <code>ageGroup</code> fields to pick the right chart(s) automatically.",
    "New <b>PdpSizeChart.tsx</b> client component renders the trigger + dropdown panel and is wired into "
    "<b>ProductDetails.tsx</b> next to the size selector, with a link out to the full size-chart page.",
])
status_line("Shipped — commit 581b1b2, verified in current codebase")
h2("Files")
files_block([
    "src/components/shop/PdpSizeChart.tsx",
    "src/lib/sizeChartData.ts",
    "src/components/shop/ProductDetails.tsx",
])
page_break()

# ================================================================== 2. Responsive Fix
feature_header(2, "Size Chart Dropdown Responsive Fix")
p("A same-day follow-up fix to Feature 1: the initial dropdown used a fixed-position panel that "
   "clipped or ran off-screen on mobile devices and shorter desktop viewports. The panel now adapts "
   "to the device and available space so the chart is always fully visible and readable.")
h2("Technical Implementation")
bullets([
    "Below the <code>sm</code> breakpoint the panel renders as a <b>fixed bottom-sheet</b> (full-width, "
    "rounded top corners, backdrop overlay) &mdash; always viewport-safe regardless of trigger position.",
    "On tablet/desktop it renders as a <b>right-anchored panel</b> next to the trigger instead of a "
    "fixed left offset.",
    "A <code>useLayoutEffect</code> collision-detection routine measures space above/below the trigger, "
    "flips the panel <b>above</b> the trigger when there isn't enough room below, and clamps its "
    "<b>max-height</b> to the available space with an internal scrollable content area.",
])
status_line("Shipped — commit 4aec47e, verified in current codebase")
h2("Files")
files_block(["src/components/shop/PdpSizeChart.tsx"])
page_break()

# ================================================================== 3. Nav-to-Footer Move
feature_header(3, "Size Chart Nav-to-Footer Move")
p("The global &ldquo;Size Chart&rdquo; link previously lived in the main site navigation bar on every "
   "page. Since Feature 1 now surfaces sizing directly on product pages where it's actually needed, "
   "the standalone nav link was moved into the footer to reduce nav-bar clutter while keeping the full "
   "size-chart page easily reachable from anywhere on the site.")
h2("Technical Implementation")
bullets([
    "Removed the <b>Size Chart</b> entry from the <code>links</code> array in <b>SubNavBar.tsx</b>.",
    "Added a matching <b>Size Chart</b> link (with icon) to the footer's secondary navigation column "
    "in <b>Footer.tsx</b>, alongside Discounts, Product Concerns, and Our Heritage.",
])
status_line("Shipped — commit 86477e2, verified in current codebase")
h2("Files")
files_block([
    "src/components/layout/SubNavBar.tsx",
    "src/components/layout/Footer.tsx",
])
page_break()

# ================================================================== 4. Notification Sync Fix
feature_header(4, "Admin → Customer Notification Sync Fix")
p("Fixed a data-integrity bug: when an admin un-flagged a product's &ldquo;New Arrival&rdquo; status, "
   "the customer-facing notification bell kept showing a stale &ldquo;New Arrival!&rdquo; alert for a "
   "product that was no longer new. This eroded trust in the notification feed and could point "
   "customers at outdated product framing.")
h2("Technical Implementation")
bullets([
    "Root cause: the admin product update route only handled the <b>flag-on</b> transition (creating a "
    "<code>CustomerNotification</code> row) and never handled the <b>flag-off</b> case.",
    "Fix adds an <code>else if</code> branch in the PATCH handler: when <code>isNewArrival</code> "
    "transitions from <code>true</code> to <code>false</code>, all matching notification rows for that "
    "product are deleted via <code>customerNotification.deleteMany()</code>.",
    "Same cleanup was extended to product <b>archive</b> and <b>delete</b> flows so no stale "
    "notification can ever outlive its product.",
])
status_line("Shipped — commit a5a0da3, verified in current codebase (route.ts lines 148-164)")
h2("Files")
files_block(["src/app/api/admin/products/[id]/route.ts"])
page_break()

# ================================================================== 5. Product Tagging
feature_header(5, "City Connect / Championship Gear Product Tagging")
p("Introduces two new admin-manageable product tags &mdash; &ldquo;City Connect&rdquo; and "
   "&ldquo;Championship Gear&rdquo; &mdash; so specific products can be curated into their own themed "
   "collections. The About page's two existing promotional buttons (&ldquo;Shop City Connect&rdquo; / "
   "&ldquo;Shop Championship Gear&rdquo;) now link to live, filtered shop views that show only "
   "correctly-tagged products and update automatically as tags change.")
h2("Technical Implementation")
bullets([
    "New <code>isCityConnect</code> / <code>isChampionshipGear</code> boolean fields added to the "
    "<b>Product</b> model in <code>prisma/schema.prisma</code> (default <code>false</code>), with a "
    "migration.",
    "New checkbox toggles in <b>EditProductModal.tsx</b> let admins flag a product either way; the "
    "admin products list/API (<code>route.ts</code>, <code>[id]/route.ts</code>) read/write both fields.",
    "<b>ShopPageClient.tsx</b> filters the catalog by these booleans when the URL category is "
    "<code>city-connect</code> or <code>championship-gear</code>.",
    "A self-healing Prisma extension in <b>lib/prisma.ts</b> auto-adds the two columns in production "
    "via <code>ALTER TABLE ... ADD COLUMN IF NOT EXISTS</code> if a deploy runs ahead of a full migration.",
])
status_line("Shipped — commits 7bbd7ec / 477b38e / 215e9b0, verified in current schema, API, and UI code")
h2("Files")
files_block([
    "prisma/schema.prisma",
    "src/components/admin/EditProductModal.tsx",
    "src/app/(admin)/admin/products/page.tsx",
    "src/app/api/admin/products/route.ts",
    "src/app/api/admin/products/[id]/route.ts",
    "src/app/(public)/about/page.tsx",
    "src/components/shop/ShopPageClient.tsx",
    "src/lib/prisma.ts",
])
page_break()

# ================================================================== 6. Catalog Identifier / Banners
feature_header(6, "City Connect / Championship Gear Catalog Identifier")
p("Adds distinct, on-brand banners to the filtered shop views at <code>/shop?category=city-connect</code> "
   "and <code>/shop?category=championship-gear</code>, so each themed collection is visually "
   "distinguished the moment a fan lands on it, reusing the same branding and logos already "
   "established on the About page.")
h2("Technical Implementation")
bullets([
    "Extended the existing <b>CategoryBanner.tsx</b> config map with two new entries &mdash; "
    "<code>'City Connect'</code> (navy-to-red gradient, CN Tower/transit theming, City Connect Fridays "
    "logo) and <code>'Championship Gear'</code> (navy/royal gradient, 1992 &amp; 1993 World Series "
    "rings logo).",
    "Each banner config carries its own eyebrow text, headline, subtitle copy, tag chips, and CTA "
    "label, matching the visual language of every other shop category banner.",
    "<code>bannerKey()</code> alias resolution maps the URL slugs <code>city-connect</code> / "
    "<code>championship-gear</code> to the correct banner config automatically.",
])
status_line("Shipped — commit cd6283e, verified in current CategoryBanner.tsx")
h2("Files")
files_block(["src/components/shop/CategoryBanner.tsx"])
page_break()

# ================================================================== 7. Nav Bar Centering Fix
feature_header(7, "Nav Bar Centering Fix")
p("Fixed a visual bug where the main sub-navigation bar (Home, Shop, Shop by Style, Players, Brands, "
   "Gallery, etc.) rendered left-aligned on desktop with a large, awkward empty gap on the right side "
   "of the screen, rather than sitting centered like the rest of the site's layout.")
h2("Technical Implementation")
bullets([
    "Root cause: a prior attempt used the Tailwind arbitrary class <code>justify-[safe_center]</code>, "
    "which Tailwind 3.4.1 cannot compile (it doesn't emit CSS for multi-keyword bracket values), so it "
    "silently produced no centering at all.",
    "Replaced with an overflow-safe wrapper pattern: the scrollable outer container uses "
    "<code>justify-start</code>, while the inner flex row of nav items uses <code>w-max mx-auto</code> "
    "to center itself when it fits, while still allowing horizontal scroll/overflow on narrow mobile "
    "viewports.",
])
status_line("Shipped — commit 0384896, verified in current SubNavBar.tsx (line 58)")
h2("Files")
files_block(["src/components/layout/SubNavBar.tsx"])

# ================================================================== BUILD
doc = SimpleDocTemplate(
    "/Users/idehenomoruyi/projects/jays-shop/docs/out/Jays-Shop-2026-07-26-Feature-Summary.pdf",
    pagesize=LETTER,
    leftMargin=0.85 * inch, rightMargin=0.85 * inch,
    topMargin=0.75 * inch, bottomMargin=0.75 * inch,
    title="Jays Shop — 2026-07-26 Feature Summary",
    author="Jays Shop Engineering",
)


def draw_cover_bg(canvas, doc_):
    canvas.saveState()
    if doc_.page == 1:
        canvas.setFillColor(NAVY)
        canvas.rect(0, 0, LETTER[0], LETTER[1], fill=1, stroke=0)
    else:
        canvas.setFillColor(colors.white)
        canvas.rect(0, 0, LETTER[0], LETTER[1], fill=1, stroke=0)
        canvas.setFont("Helvetica", 8)
        canvas.setFillColor(GREY)
        canvas.drawString(0.85 * inch, 0.5 * inch, "Jays Shop — Session Feature Summary (2026-07-26)")
        canvas.drawRightString(LETTER[0] - 0.85 * inch, 0.5 * inch, "Page %d" % doc_.page)
    canvas.restoreState()


doc.build(story, onFirstPage=draw_cover_bg, onLaterPages=draw_cover_bg)
print("PDF built successfully")
