# -*- coding: utf-8 -*-
"""
Builds docs/out/Jays-Shop-R2-Executive-Summary-2026-07-27.pdf

Condensed (max 2-page) executive summary of the Cloudflare R2 storage migration on
Jays Shop, for a Management / external-stakeholder audience. Formal third person,
business outcome first, no debugging narrative, no commit SHAs in the body.

Reuses the color palette, ParagraphStyles, and table/note-box helpers from
build_r2_management_report_pdf.py so this shares the same visual family. This is a
separate, new script; the original generator and its output PDF are untouched.

HARD RULE: this script and the PDF it produces must never contain a secret value (access
key, secret key, password, token, connection string) — only variable names and types.
"""
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
                                 HRFlowable)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY

NAVY = colors.HexColor("#14213D")
ROYAL = colors.HexColor("#134A8E")
RED = colors.HexColor("#C4141C")
GREY = colors.HexColor("#5A6472")
LIGHT_GREY = colors.HexColor("#F4F6F9")
GREEN = colors.HexColor("#1A7F37")
GREEN_BG = colors.HexColor("#E9F7EE")
RED_BG = colors.HexColor("#FDEDEE")

styles = getSampleStyleSheet()

styles.add(ParagraphStyle(name="DocTitle", fontName="Helvetica-Bold", fontSize=16.5, leading=20,
                           textColor=NAVY, alignment=TA_LEFT, spaceBefore=0, spaceAfter=2))
styles.add(ParagraphStyle(name="TitleMeta", fontName="Helvetica", fontSize=9, leading=12.5,
                           textColor=GREY, alignment=TA_LEFT, spaceAfter=0))
styles.add(ParagraphStyle(name="H2", fontName="Helvetica-Bold", fontSize=10.8, leading=14,
                           textColor=ROYAL, spaceBefore=8, spaceAfter=4))
styles.add(ParagraphStyle(name="Body", fontName="Helvetica", fontSize=9.5, leading=13.2,
                           textColor=colors.HexColor("#22262B"), alignment=TA_JUSTIFY, spaceAfter=4))
styles.add(ParagraphStyle(name="BodyBold", parent=styles["Body"], fontName="Helvetica-Bold",
                           textColor=NAVY))
styles.add(ParagraphStyle(name="TableCell", parent=styles["Body"], alignment=TA_LEFT, spaceAfter=0))
styles.add(ParagraphStyle(name="TableHead", parent=styles["Body"], fontName="Helvetica-Bold",
                           textColor=colors.white, alignment=TA_LEFT, spaceAfter=0))
styles.add(ParagraphStyle(name="StatusBody", parent=styles["Body"], fontName="Helvetica-Bold",
                           fontSize=10.3, leading=14, textColor=colors.HexColor("#0F5132"),
                           alignment=TA_LEFT, spaceAfter=0))
styles.add(ParagraphStyle(name="ActionBody", parent=styles["Body"], fontName="Helvetica-Bold",
                           fontSize=10.6, leading=14.5, textColor=colors.HexColor("#7A1620"),
                           alignment=TA_LEFT, spaceAfter=0))
styles.add(ParagraphStyle(name="StatusOk", parent=styles["Body"], fontName="Helvetica-Bold",
                           textColor=GREEN, alignment=TA_CENTER, spaceAfter=0))
styles.add(ParagraphStyle(name="StatusOkCell", parent=styles["TableCell"], fontName="Helvetica-Bold",
                           textColor=GREEN, alignment=TA_CENTER))
styles.add(ParagraphStyle(name="Caption", fontName="Helvetica-Oblique", fontSize=7.6, leading=10,
                           textColor=GREY, alignment=TA_LEFT))

story = []
PAGE_W = LETTER[0] - 2 * 0.7 * inch


def h2(text):
    story.append(Paragraph(text, styles["H2"]))


def p(text):
    story.append(Paragraph(text, styles["Body"]))


def note_box(title, text, bg, border, body_style, title_style="StatusBody"):
    inner = Table(
        [[Paragraph(f"<b>{title}</b>", styles[title_style])],
         [Paragraph(text, styles[body_style])]],
        colWidths=[PAGE_W - 16],
    )
    inner.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("BOX", (0, 0), (-1, -1), 0.75, border),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(inner)
    story.append(Spacer(1, 8))


def simple_table(header, rows, col_widths, cell_styles=None):
    data = [[Paragraph(c, styles["TableHead"]) for c in header]]
    for r in rows:
        row_cells = []
        for i, c in enumerate(r):
            style_name = (cell_styles or {}).get(i, "TableCell")
            row_cells.append(Paragraph(str(c), styles[style_name]))
        data.append(row_cells)
    t = Table(data, colWidths=col_widths, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), ROYAL),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#D8E0EC")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT_GREY]),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
    ]))
    story.append(t)
    story.append(Spacer(1, 9))


# ================================================================== TITLE BLOCK
story.append(Paragraph("Cloud Storage Migration &mdash; Executive Summary", styles["DocTitle"]))
story.append(HRFlowable(width="100%", thickness=1.6, color=RED, spaceAfter=6))
title_meta = Table(
    [[Paragraph("<b>Project:</b> Jays Shop Retail Platform", styles["TitleMeta"]),
      Paragraph("<b>Date:</b> 27 July 2026", styles["TitleMeta"]),
      Paragraph("<b>Prepared for:</b> Management", styles["TitleMeta"])]],
    colWidths=[PAGE_W * 0.42, PAGE_W * 0.24, PAGE_W * 0.34],
)
title_meta.setStyle(TableStyle([
    ("LEFTPADDING", (0, 0), (-1, -1), 0),
    ("TOPPADDING", (0, 0), (-1, -1), 0),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
]))
story.append(title_meta)

# ================================================================== 1. STATUS LINE
note_box(
    "Status: Complete and live.",
    "The migration to Cloudflare R2 storage has been completed and is operating in "
    "production. Media uploads have been verified as working, and the associated "
    "security remediation is complete. One recommended action remains outstanding, "
    "detailed at the end of this summary.",
    bg=GREEN_BG, border=GREEN, body_style="Body", title_style="StatusBody",
)

# ================================================================== 2. BUSINESS OUTCOME
h2("Business outcome")
p("""Service reliability for the storefront's product and promotional media has been
restored: the previous storage provider had reached its plan limit and begun rejecting
requests, which caused promotional imagery to fail to display on the site. Media are now
served from a provider with no data-transfer (egress) fees, whereas the previous provider
billed for every gigabyte delivered to site visitors &mdash; reducing ongoing storage cost
as traffic grows. A related data-exposure risk, described below, has also been identified
and substantially remediated.""")

# ================================================================== 3. CURRENT STATE
h2("Current state")
simple_table(
    ["Item", "Detail"],
    [
        ["Storage provider", "Cloudflare R2 (cloud media storage)"],
        ["Bucket", "One production storage container, configured through secure "
                   "platform settings"],
        ["Upload method", "Administrators upload promotional videos directly from "
                          "their browser to storage using a temporary, single-use "
                          "upload link; files no longer route through the "
                          "application's own server"],
        ["Verification performed", "A promotional video (6.4 MB) was uploaded and "
                                   "confirmed retrievable by site visitors"],
    ],
    col_widths=[1.7 * inch, PAGE_W - 1.7 * inch],
)

# ================================================================== 4. ISSUES IDENTIFIED AND RESOLVED
h2("Issues identified and resolved")
simple_table(
    ["Issue", "Plain-English description", "Status"],
    [
        ["Upload permission gap", "The storage container did not yet permit direct "
                                  "browser uploads from the admin dashboard.",
         "Resolved"],
        ["Upload validation error", "An automatic file-integrity check was being "
                                    "applied incorrectly, causing valid uploads to be "
                                    "rejected.",
         "Resolved"],
        ["Storage address duplication", "A configuration value briefly caused the "
                                        "storage location to be referenced "
                                        "incorrectly. Later confirmed not to be the "
                                        "underlying cause.",
         "Resolved"],
        ["<b>Root cause</b> &mdash; hidden character in a stored credential",
         "An invisible extra character in a stored access credential was silently "
         "invalidating every upload request. Correcting the stored value resolved "
         "uploads fully.",
         "Resolved"],
    ],
    col_widths=[1.75 * inch, PAGE_W - 1.75 * inch - 0.85 * inch, 0.85 * inch],
    cell_styles={2: "StatusOkCell"},
)

# ================================================================== 5. SECURITY
h2("Security")
p("""A document containing a live storage credential was inadvertently committed to the
project's records. The exposed credential has been rotated and the prior value confirmed
invalid. The codebase has separately been cleaned of hardcoded account passwords, and a
full scan of the current codebase confirms no credentials remain present. Copies of the
retired values remain in historical version-control records, which cannot be altered
retroactively; rotating the affected account's password is the remaining step required to
fully close this exposure.""")

# ================================================================== 6. RECOMMENDATION
h2("Recommendation")
note_box(
    "Rotate the password for the admin@jays.shop account.",
    "Owner: Site Administrator. This is the sole outstanding action; all other "
    "remediation and migration work described above is complete.",
    bg=RED_BG, border=RED, body_style="Body", title_style="ActionBody",
)

story.append(Spacer(1, 3))
story.append(HRFlowable(width="100%", thickness=0.6, color=colors.HexColor("#D8E0EC")))
story.append(Spacer(1, 5))
story.append(Paragraph(
    "This document contains no credentials, API keys, passwords, tokens, or connection "
    "strings. Condensed executive version of the full R2 storage management report "
    "(available in docs/out/), which contains full commit references for technical "
    "audit purposes.",
    styles["Caption"]))

doc = SimpleDocTemplate(
    "/Users/idehenomoruyi/projects/jays-shop/docs/out/Jays-Shop-R2-Executive-Summary-2026-07-27.pdf",
    pagesize=LETTER, topMargin=0.7 * inch, bottomMargin=0.6 * inch,
    leftMargin=0.7 * inch, rightMargin=0.7 * inch,
    title="Jays Shop — Cloudflare R2 Storage Migration — Executive Summary")


def on_page(canvas, doc_):
    canvas.saveState()
    canvas.setFillColor(GREY)
    canvas.setFont("Helvetica", 7.5)
    canvas.drawString(0.7 * inch, 0.35 * inch, "Jays Shop Retail Platform — Cloud Storage Migration Summary")
    canvas.drawRightString(LETTER[0] - 0.7 * inch, 0.35 * inch, f"Page {doc_.page}")
    canvas.restoreState()


doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
print("PDF built.")
