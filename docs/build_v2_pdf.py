# -*- coding: utf-8 -*-
"""
Jays Shop — Version 2.0 Comprehensive Project Documentation
Builds a full business + technical reference PDF using reportlab Platypus.
"""
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
                                 PageBreak, HRFlowable, ListFlowable, ListItem, KeepTogether,
                                 Image, Flowable)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.graphics.shapes import Drawing, Rect, String, Line, Polygon
from reportlab.pdfgen import canvas as canvas_mod

NAVY = colors.HexColor("#14213D")
ROYAL = colors.HexColor("#134A8E")
RED = colors.HexColor("#C4141C")
ICE = colors.HexColor("#EAF1FB")
GREY = colors.HexColor("#5A6472")
LIGHT_GREY = colors.HexColor("#F4F6F9")
GOLD = colors.HexColor("#B8860B")
GREEN = colors.HexColor("#1E7A46")

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="CoverTitle", fontName="Helvetica-Bold", fontSize=28, leading=34,
                           textColor=colors.white, alignment=TA_CENTER))
styles.add(ParagraphStyle(name="CoverSub", fontName="Helvetica", fontSize=13, leading=19,
                           textColor=ICE, alignment=TA_CENTER, spaceBefore=10))
styles.add(ParagraphStyle(name="VBadge", fontName="Helvetica-Bold", fontSize=13, leading=16,
                           textColor=colors.white, alignment=TA_CENTER, backColor=RED))
styles.add(ParagraphStyle(name="H1", fontName="Helvetica-Bold", fontSize=17, leading=22,
                           textColor=NAVY, spaceBefore=4, spaceAfter=8))
styles.add(ParagraphStyle(name="H2", fontName="Helvetica-Bold", fontSize=12.5, leading=17,
                           textColor=ROYAL, spaceBefore=12, spaceAfter=5))
styles.add(ParagraphStyle(name="H3", fontName="Helvetica-Bold", fontSize=10.6, leading=14,
                           textColor=GREEN, spaceBefore=8, spaceAfter=3))
styles.add(ParagraphStyle(name="Body", fontName="Helvetica", fontSize=9.6, leading=14.2,
                           textColor=colors.HexColor("#22262B"), alignment=TA_JUSTIFY, spaceAfter=5))
styles.add(ParagraphStyle(name="BodyBold", parent=styles["Body"], fontName="Helvetica-Bold", textColor=NAVY))
styles.add(ParagraphStyle(name="BulletP", parent=styles["Body"], leftIndent=0, spaceAfter=3))
styles.add(ParagraphStyle(name="Mono", fontName="Courier", fontSize=8.2, leading=11.5,
                           textColor=NAVY, backColor=LIGHT_GREY))
styles.add(ParagraphStyle(name="Quote", fontName="Helvetica-Oblique", fontSize=11.5, leading=17,
                           textColor=ROYAL, alignment=TA_CENTER, spaceBefore=8, spaceAfter=8))
styles.add(ParagraphStyle(name="Caption", fontName="Helvetica-Oblique", fontSize=8.2, leading=11,
                           textColor=GREY, alignment=TA_CENTER))
styles.add(ParagraphStyle(name="TOCH1", fontName="Helvetica-Bold", fontSize=10.6, leading=16,
                           textColor=NAVY, spaceBefore=4))
styles.add(ParagraphStyle(name="TOCH2", fontName="Helvetica", fontSize=9.4, leading=13.5,
                           textColor=GREY, leftIndent=14))
styles.add(ParagraphStyle(name="TinyCell", fontName="Helvetica", fontSize=8.1, leading=11,
                           textColor=colors.HexColor("#22262B")))
styles.add(ParagraphStyle(name="TinyCellBold", parent=styles["TinyCell"], fontName="Helvetica-Bold", textColor=NAVY))

story = []
PAGE_W = LETTER[0] - 2 * 0.85 * inch
SECTION_NO = [0]

# ------------------------------------------------------------------ helpers
def rule(color=RED, thickness=1.6, spaceBefore=1, spaceAfter=9):
    story.append(Spacer(1, spaceBefore))
    story.append(HRFlowable(width="100%", thickness=thickness, color=color))
    story.append(Spacer(1, spaceAfter))

def h1(text):
    SECTION_NO[0] += 1
    full = "%d. %s" % (SECTION_NO[0], text)
    story.append(Spacer(1, 2))
    para = Paragraph(full, styles["H1"])
    para._bookmarkTitle = full
    story.append(para)
    story.append(HRFlowable(width="32%", thickness=2.2, color=RED, hAlign="LEFT"))
    story.append(Spacer(1, 7))

def h2(text):
    para = Paragraph(text, styles["H2"])
    para._bookmarkTitle = "  " + text
    para._isH2 = True
    story.append(para)

def h3(text):
    story.append(Paragraph(text, styles["H3"]))

def p(text):
    story.append(Paragraph(text, styles["Body"]))

def bullets(items):
    story.append(ListFlowable(
        [ListItem(Paragraph(i, styles["BulletP"]), bulletColor=RED, value="square") for i in items],
        bulletType="bullet", start="square", leftIndent=13, bulletFontSize=5.5, spaceBefore=1, spaceAfter=7))

def mono(text):
    story.append(Paragraph(text.replace("\n", "<br/>"), styles["Mono"]))
    story.append(Spacer(1, 6))

def data_table(headers, rows, col_widths=None, header_bg=NAVY, small=True):
    style_cell = styles["TinyCell"] if small else styles["BulletP"]
    style_head = styles["TinyCellBold"] if small else styles["BodyBold"]
    head_row = [Paragraph("<font color='white'><b>%s</b></font>" % hd, style_head) for hd in headers]
    data = [head_row]
    for r in rows:
        data.append([Paragraph(str(c), style_cell) for c in r])
    if col_widths is None:
        col_widths = [PAGE_W / len(headers)] * len(headers)
    t = Table(data, colWidths=col_widths, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), header_bg),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#D8E0EC")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT_GREY]),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(t)
    story.append(Spacer(1, 10))

def stat_row(stats):
    cell_big = ParagraphStyle(name="SBig", fontName="Helvetica-Bold", fontSize=18, leading=22,
                               textColor=NAVY, alignment=TA_CENTER)
    cell_small = ParagraphStyle(name="SSmall", fontName="Helvetica", fontSize=8, textColor=GREY,
                                 alignment=TA_CENTER, leading=10.5)
    row = []
    col_w = PAGE_W / len(stats)
    for big, small in stats:
        t = Table([[Paragraph(big, cell_big)], [Paragraph(small, cell_small)]],
                   colWidths=[col_w - 8], rowHeights=[26, 32])
        t.setStyle(TableStyle([
            ("ALIGN", (0, 0), (-1, -1), "CENTER"), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, 0), 10), ("BOTTOMPADDING", (0, 0), (-1, 0), 0),
            ("TOPPADDING", (0, 1), (-1, 1), 3), ("BOTTOMPADDING", (0, 1), (-1, 1), 9),
        ]))
        row.append(t)
    outer = Table([row], colWidths=[col_w] * len(stats))
    outer.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#D8E0EC")),
        ("INNERGRID", (0, 0), (-1, -1), 0.75, colors.HexColor("#D8E0EC")),
        ("BACKGROUND", (0, 0), (-1, -1), ICE),
    ]))
    story.append(outer)
    story.append(Spacer(1, 10))

# ---- simple flow / architecture diagram builder (boxes with arrows) --------
class DiagramFlow(Flowable):
    """Horizontal row(s) of labeled boxes connected by arrows. rows: list of list-of-labels."""
    def __init__(self, rows, width=PAGE_W, box_h=34, gap_y=26, colors_map=None):
        Flowable.__init__(self)
        self.rows = rows
        self.width = width
        self.box_h = box_h
        self.gap_y = gap_y
        self.colors_map = colors_map or {}
        self.height = len(rows) * (box_h + gap_y)

    def draw(self):
        c = self.canv
        n_rows = len(self.rows)
        y = self.height - self.box_h
        for r_idx, labels in enumerate(self.rows):
            n = len(labels)
            box_w = self.width / n - 10
            x = 0
            for i, label in enumerate(labels):
                fill = self.colors_map.get(label, ROYAL)
                c.setFillColor(fill)
                c.roundRect(x, y, box_w, self.box_h, 5, fill=1, stroke=0)
                c.setFillColor(colors.white)
                c.setFont("Helvetica-Bold", 7.6)
                # wrap label into up to 2 lines
                words = label.split(" ")
                line1, line2 = label, ""
                if len(label) > 20:
                    mid = len(words) // 2
                    line1 = " ".join(words[:mid]) if mid else label
                    line2 = " ".join(words[mid:])
                if line2:
                    c.drawCentredString(x + box_w / 2, y + self.box_h / 2 + 5, line1)
                    c.drawCentredString(x + box_w / 2, y + self.box_h / 2 - 6, line2)
                else:
                    c.drawCentredString(x + box_w / 2, y + self.box_h / 2 - 3, line1)
                if i < n - 1:
                    ax0 = x + box_w + 1
                    ax1 = x + box_w + 9
                    ay = y + self.box_h / 2
                    c.setStrokeColor(GREY)
                    c.setLineWidth(1.2)
                    c.line(ax0, ay, ax1, ay)
                    c.setFillColor(GREY)
                    c.drawString(ax1 - 3, ay - 2, "\u25B8")
                x += box_w + 10
            y -= (self.box_h + self.gap_y)

def diagram(rows, colors_map=None, caption=None):
    story.append(Spacer(1, 4))
    story.append(DiagramFlow(rows, colors_map=colors_map))
    story.append(Spacer(1, 3))
    if caption:
        story.append(Paragraph(caption, styles["Caption"]))
    story.append(Spacer(1, 10))

def entity_box_grid(entities, cols=3, box_h=30):
    """entities: list of (name, subtitle)"""
    rows = []
    row = []
    for i, (name, sub) in enumerate(entities):
        row.append((name, sub))
        if len(row) == cols:
            rows.append(row)
            row = []
    if row:
        rows.append(row)
    col_w = PAGE_W / cols
    for r in rows:
        cells = []
        for name, sub in r:
            t = Table([[Paragraph("<b>%s</b>" % name, ParagraphStyle(name="EN", fontName="Helvetica-Bold",
                        fontSize=8.6, textColor=colors.white, alignment=TA_CENTER))],
                       [Paragraph(sub, ParagraphStyle(name="ES", fontName="Helvetica", fontSize=6.8,
                        textColor=ICE, alignment=TA_CENTER, leading=9))]],
                       colWidths=[col_w - 8], rowHeights=[16, 22])
            t.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), ROYAL),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("TOPPADDING", (0, 0), (-1, -1), 2), ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
                ("BOX", (0, 0), (-1, -1), 0.6, NAVY),
            ]))
            cells.append(t)
        while len(cells) < cols:
            cells.append(Spacer(1, 1))
        outer = Table([cells], colWidths=[col_w] * cols)
        outer.setStyle(TableStyle([("TOPPADDING", (0, 0), (-1, -1), 3), ("BOTTOMPADDING", (0, 0), (-1, -1), 3)]))
        story.append(outer)
    story.append(Spacer(1, 8))

def page_break():
    story.append(PageBreak())

COLOR_MAP = {
    "Fan / Customer": RED, "Customer": RED, "Fan": RED,
    "Retail Associate": GREEN, "Staff": GREEN,
    "Supervisor / Manager": GOLD, "Manager": GOLD,
    "Owner / Executive": NAVY, "Admin": NAVY,
    "System": ROYAL, "Database": colors.HexColor("#374151"),
}

# ================================================================== COVER
story.append(Spacer(1, 1.5 * inch))
story.append(Paragraph("JAYS SHOP", ParagraphStyle(name="Brand", fontName="Helvetica-Bold", fontSize=15,
                        textColor=colors.HexColor("#8FB3E8"), alignment=TA_CENTER, spaceAfter=4)))
story.append(Paragraph("Digital Retail &amp; In-Stadium Fulfillment Platform", styles["CoverSub"]))
story.append(Spacer(1, 22))
badge = Table([[Paragraph("VERSION 2.0", styles["VBadge"])]], colWidths=[1.6 * inch], rowHeights=[0.34 * inch])
badge.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), RED), ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                            ("VALIGN", (0, 0), (-1, -1), "MIDDLE")]))
badge_wrap = Table([[badge]], colWidths=[PAGE_W])
badge_wrap.setStyle(TableStyle([("ALIGN", (0, 0), (-1, -1), "CENTER")]))
story.append(badge_wrap)
story.append(Spacer(1, 18))
story.append(Paragraph("COMPREHENSIVE PROJECT<br/>DOCUMENTATION", styles["CoverTitle"]))
story.append(Spacer(1, 14))
story.append(HRFlowable(width="20%", thickness=2, color=RED, hAlign="CENTER"))
story.append(Spacer(1, 14))
story.append(Paragraph("A Complete Business &amp; Technical Reference for Executives, Management,<br/>"
                        "Developers, Designers &amp; Future Stakeholders", styles["CoverSub"]))
story.append(Spacer(1, 200))
story.append(Paragraph("Prepared for Store Operations, Engineering, Retail Management &amp; Executive Leadership",
                        ParagraphStyle(name="foot", fontName="Helvetica", fontSize=9, textColor=colors.HexColor("#8FB3E8"),
                                       alignment=TA_CENTER)))
page_break()

# ================================================================== TOC
story.append(Paragraph("Table of Contents", styles["H1"]))
story.append(HRFlowable(width="32%", thickness=2.2, color=RED, hAlign="LEFT"))
story.append(Spacer(1, 10))
toc = TableOfContents()
toc.levelStyles = [styles["TOCH1"], styles["TOCH2"]]
story.append(toc)
page_break()

# ================================================================== 1. EXEC SUMMARY
h1("Executive Summary")
p("""Jays Shop is a full-stack digital retail and in-stadium fulfillment platform built for a
Toronto Blue Jays fan shop operation. It unifies a mobile-first product browsing &amp; reservation
experience, a real-time multi-location inventory ledger, a proprietary Digital Hold reservation
system, point-of-sale integration, and a
complete staff/management back office into a single connected system. Version 2.0 reflects the
platform's evolution from an initial hold-and-pickup concept into a mature retail operations
platform spanning product merchandising, player-driven cross-selling, sales &amp; clearance
management, game-day operational rules, and management-grade reporting.""")
stat_row([
    ("36", "Documented functional areas &amp; screens"),
    ("4", "Role-based permission tiers"),
    ("20+", "Admin operational &amp; reporting API endpoints"),
    ("100%", "Shared inventory ledger across web, hold &amp; POS"),
])
p("""This Version 2.0 documentation is the authoritative reference for how the platform is built,
how it behaves, and why it was designed this way — intended for executives evaluating business
value, engineers extending the system, designers maintaining UI consistency, and operators running
day-to-day retail activity.""")

# ================================================================== 2. VISION
h1("Project Vision and Objectives")
p("""The platform's vision is to remove the historic trade-off between digital browsing convenience
and in-person pickup certainty. Fans should be able to discover, evaluate, and reserve merchandise
from anywhere, then complete a fast, trustworthy pickup at the stadium — without needing an account,
without guessing at stock, and without waiting in an undifferentiated line.""")
h2("Core Objectives")
bullets([
    "Provide a mobile-first, frictionless storefront for browsing and reserving Blue Jays merchandise.",
    "Guarantee reservation accuracy through a single, real-time, size- and location-level inventory ledger.",
    "Give staff guided, policy-enforced tools for fulfilling holds, managing stock, and resolving customer questions.",
    "Give management continuous, actionable visibility into sales, holds, conversion, and inventory health.",
    "Build a foundation that scales cleanly across additional stadium sections, product lines, and future venues.",
])

# ================================================================== 3. PROBLEM & SOLUTION
h1("Business Problem and Solution Overview")
h2("The Business Problem")
bullets([
    "Walk-in-only stadium retail forces fans into an undifferentiated queue with no visibility into stock.",
    "Game-day demand surges strain staff and create inconsistent pickup experiences across counters and sections.",
    "Manual inventory processes make it difficult for management to know true stock health across locations.",
])
h2("The Platform Solution")
bullets([
    "A <b>Digital Hold</b> system lets fans reserve a specific product, size, and quantity against a live inventory count, producing an instant reservation code and expiration window.",
    "A unified <b>SizeInventory</b> ledger, shared by the storefront, the hold engine, and point-of-sale transactions, ensures one accurate source of truth at all times.",
    "Two dedicated pickup channels — a standard Gate 5 counter and an express Stadium Queue (Section 123) — route fans appropriately, with the express channel automatically enabled only on active game days.",
    "A role-based admin back office (STAFF / MANAGER / OWNER, plus VIEWER) gives every level of the organization exactly the tools and visibility they need.",
])

# ================================================================== 4. BUSINESS VALUE
h1("Business Value and Strategic Impact")
role_rows = [
    ("Customers / Fans", "Confidence that a reserved item will be available; flexible pickup options; no account required; instant self-service order lookup by phone."),
    ("Retail Associates", "A single guided queue for fulfilling holds; automatic policy enforcement; clear urgency indicators for expiring holds."),
    ("Supervisors / Managers", "Real-time oversight of active holds and inventory; ability to manage exceptions confidently; complete audit trail for every action."),
    ("Executives / Management", "Consolidated conversion, revenue, and inventory reporting; a scalable platform that grows with the retail program."),
]
data_table(["Stakeholder", "Value Delivered"], role_rows, col_widths=[1.6*inch, PAGE_W-1.6*inch])
p("""Strategically, the platform strengthens retail as a genuine extension of the game-day
experience — a touchpoint where the same standard of excellence fans expect from Rogers Centre
itself is reflected in how effortlessly they can find, reserve, and collect merchandise.""")

# ================================================================== 5. CUSTOMER JOURNEY
h1("Customer Experience Journey")
diagram([["Discover", "Evaluate", "Reserve (Hold)", "Confirm", "Pick Up", "Re-engage"]],
        colors_map={k: RED for k in ["Discover", "Evaluate", "Reserve (Hold)", "Confirm", "Pick Up", "Re-engage"]},
        caption="Figure 5.1 — End-to-end customer experience journey")
bullets([
    "<b>Discover:</b> Mobile-first catalog with category, brand, and audience filtering, plus a dedicated Popular Players hub linking fans to player-specific gear.",
    "<b>Evaluate:</b> Product detail pages show real-time size availability, related products, target-audience labeling, and customer reviews.",
    "<b>Reserve:</b> The Digital Hold flow reserves a specific size and quantity against live stock, returning a reservation code and countdown.",
    "<b>Confirm:</b> A confirmation page with QR code and clear pickup instructions removes any ambiguity about the next step.",
    "<b>Pick Up:</b> Fans choose Gate 5 (standard) or the Stadium Queue (Section 123, game days only) based on their location and timing.",
    "<b>Re-engage:</b> Favorites, phone-based order lookup, and review submission keep the relationship active beyond a single visit.",
])

# ================================================================== 6. OPERATIONAL WORKFLOW
h1("Operational Workflow Optimization")
p("""Every operational workflow in the platform is designed to keep customer service, inventory,
fulfillment, and pickup continuously synchronized, so an action in one area is immediately and
correctly reflected everywhere else.""")
bullets([
    "<b>Customer service:</b> phone-number lookup resolves any fan's active/past holds instantly, with no account or escalation needed.",
    "<b>Inventory:</b> every hold, sale, return, and transfer writes to the same append-only ledger (<i>InventoryTransaction</i>), eliminating drift between channels.",
    "<b>Fulfillment:</b> a single Holds queue with urgency indicators and partial-fulfillment support minimizes staff decision time per transaction.",
    "<b>Pickup:</b> printable receipts and clear channel routing keep the physical handoff fast and consistent regardless of which staff member is on duty.",
])

# ================================================================== 7. FUNCTIONAL REQUIREMENTS
h1("Functional Requirements")
fr_rows = [
    ("FR-1", "Product catalog browsing with category/subcategory/brand/audience filters and search"),
    ("FR-2", "Product detail view with real-time size-level availability"),
    ("FR-3", "Digital Hold creation with phone-based customer identification (no account required)"),
    ("FR-4", "Hold precheck endpoint to preview eligibility and effective hold duration before commit"),
    ("FR-5", "Self-service hold status lookup, pickup, and release via reservation code"),
    ("FR-6", "Customer hold history lookup by phone number (\u201cMy Holds\u201d)"),
    ("FR-7", "Popular Players directory with linked shoppable gear (PlayerProduct mapping)"),
    ("FR-8", "Product likes (heart) and client-side Favorites wishlist"),
    ("FR-9", "Customer product reviews (rating + comment) with admin moderation"),
    ("FR-10", "Site feedback submission with admin inbox and delete capability"),
    ("FR-11", "Admin product CRUD with multi-image upload and size-inventory management"),
    ("FR-12", "Admin hold queue with resolve (full/partial pickup, release) actions"),
    ("FR-13", "Admin hold-settings configuration (standard/extended hold hours, 48-hour toggle)"),
    ("FR-14", "Admin game-day calendar management (date, start time, opponent, note)"),
    ("FR-15", "Admin inventory transfer between locations with full transaction logging"),
    ("FR-16", "Admin brand and player management (CRUD)"),
    ("FR-17", "Admin analytics overview and sales/hold reporting dashboards with export"),
    ("FR-18", "Admin user management with role assignment (OWNER only)"),
    ("FR-19", "Audit log of all sensitive admin and system actions"),
    ("FR-20", "POS transaction webhook ingestion with idempotency and API-key auth"),
    ("FR-21", "Automated hold expiry via scheduled cron job"),
    ("FR-22", "Slack notifications for new holds and expirations, with interactive resolution"),
]
data_table(["ID", "Requirement"], fr_rows, col_widths=[0.6*inch, PAGE_W-0.6*inch])

# ================================================================== 8. NON-FUNCTIONAL REQUIREMENTS
h1("Non-Functional Requirements")
nfr_rows = [
    ("Reliability", "Inventory transactions are wrapped in database transactions to prevent overselling or double-counting."),
    ("Availability", "Hold expiry and inventory sync run automatically (cron + inline auto-expire) so data never goes stale between visits."),
    ("Security", "Role-based access control (VIEWER &lt; STAFF &lt; MANAGER &lt; OWNER) enforced on every admin route; bcrypt password hashing; JWT sessions with 8-hour expiry."),
    ("Auditability", "Every sensitive state change (holds, inventory, products, admins, settings) is recorded to an immutable AuditLog with before/after snapshots."),
    ("Performance", "Admin analytics responses are cached briefly (in-memory, ~30s) to absorb dashboard polling load without stressing the database."),
    ("Scalability", "Multi-tenant-aware schema (tenantId on core models) and a multi-location inventory model support expansion to new venues or storefronts."),
    ("Usability", "Mobile-first responsive design across public storefront and admin dashboard; no customer account/password required."),
    ("Maintainability", "Consistent Next.js App Router conventions, typed Prisma schema, and centralized constants/taxonomy files reduce change risk."),
    ("Rate Limiting", "Admin API paths are protected by a sliding-window rate limiter (default 100 requests/min) to guard against abuse."),
    ("Data Integrity", "Idempotent POS event ingestion (externalId uniqueness) prevents duplicate transaction application."),
]
data_table(["Quality Attribute", "Requirement Detail"], nfr_rows, col_widths=[1.3*inch, PAGE_W-1.3*inch])

page_break()
# ================================================================== 9. SYSTEM ARCHITECTURE
h1("Complete System Architecture")
p("""Jays Shop is built as a single Next.js 14 App Router application, serving both the public
storefront and the admin dashboard from one codebase, backed by a PostgreSQL database via Prisma
ORM. Public and admin surfaces are fully separated at the routing level via route groups, while
sharing the same data layer, taxonomy constants, and audit/notification infrastructure.""")
diagram([
    ["Storefront (Public)", "Admin Dashboard", "POS Terminals"],
    ["Next.js API Routes", "NextAuth / RBAC", "Cron (Vercel)"],
    ["Prisma ORM", "Slack Notifications", "PostgreSQL"],
], colors_map={
    "Storefront (Public)": RED, "Admin Dashboard": GOLD, "POS Terminals": GREEN,
    "Next.js API Routes": ROYAL, "NextAuth / RBAC": ROYAL, "Cron (Vercel)": ROYAL,
    "Prisma ORM": NAVY, "Slack Notifications": NAVY, "PostgreSQL": colors.HexColor("#374151"),
}, caption="Figure 9.1 — High-level system architecture layers")
h2("Architectural Principles")
bullets([
    "<b>Single source of truth:</b> one PostgreSQL database and Prisma schema back every channel — web, hold engine, and POS.",
    "<b>Server-rendered + API-driven:</b> Next.js App Router server components handle SEO-friendly pages; client components handle interactivity (cart, favorites, hold flows).",
    "<b>Route-group isolation:</b> `(public)` and `(admin)` route groups keep customer and staff experiences cleanly separated while sharing one deployment.",
    "<b>Middleware-enforced security:</b> all `/admin` pages and `/api/admin/*` routes pass through NextAuth-aware middleware before reaching business logic.",
    "<b>Transactional integrity:</b> hold creation/resolution and inventory transfers execute inside Prisma database transactions to guarantee consistency.",
    "<b>Event/audit trail:</b> every state-changing action is captured to the AuditLog model, independent of which channel initiated it.",
])

# ================================================================== 10. TECH STACK
h1("Technology Stack")
stack_rows = [
    ("Framework", "Next.js 14.2 (App Router), React 18, TypeScript 5"),
    ("Database / ORM", "PostgreSQL, Prisma 5.22 (@prisma/client)"),
    ("Authentication", "NextAuth 4.24 — Credentials provider, JWT sessions (8-hour expiry)"),
    ("Styling / UI", "Tailwind CSS 3.4, Radix UI primitives, lucide-react icons, sonner toasts, vaul drawers"),
    ("Charts", "recharts (admin analytics &amp; reporting dashboards)"),
    ("Media", "Local /public/uploads file storage, Supabase JS client, next-pwa (Cloudinary image caching)"),
    ("Security", "bcryptjs password hashing, nanoid ID generation"),
    ("AI Assistant", "OpenAI 4.x — powers the \u201cBirdie\u201d chat assistant (/api/chat)"),
    ("QR / Receipts", "qrcode.react for hold confirmation QR codes"),
    ("Dev Tooling", "tsx (scripts/seed runner), ESLint (eslint-config-next), tsc --noEmit typecheck"),
    ("Deployment", "Vercel — daily cron (0 0 * * *) triggers hold expiry; prisma generate on build &amp; postinstall"),
]
data_table(["Layer", "Technology"], stack_rows, col_widths=[1.5*inch, PAGE_W-1.5*inch])

# ================================================================== 11. DATABASE DESIGN / ERD
h1("Database Design and Entity Relationships")
p("""The schema is organized around three functional clusters: <b>commerce</b> (Product, Brand,
Player/PlayerProduct, ProductReview, ProductLike), <b>inventory &amp; fulfillment</b> (SizeInventory,
StoreLocation, Hold, HoldHistory, SalesHistory, InventoryTransaction), and <b>platform/operations</b>
(Tenant, Admin, AuditLog, GameDay, HoldSettings, SlackSettings, PosApiKey, PosEvent, SiteFeedback).""")
entity_box_grid([
    ("Tenant", "Multi-tenant root"),
    ("Product", "Catalog item"),
    ("Brand", "Brand metadata"),
    ("Player", "Player profile"),
    ("PlayerProduct", "Player \u2194 Product join"),
    ("Customer", "Phone-identified fan"),
    ("Hold", "Reservation record"),
    ("SizeInventory", "Per-size, per-location stock"),
    ("StoreLocation", "Physical/queue location"),
    ("InventoryTransaction", "Append-only stock ledger"),
    ("HoldHistory", "Resolved-hold snapshot"),
    ("SalesHistory", "Completed-sale record"),
    ("Admin", "Staff account"),
    ("AuditLog", "Immutable action log"),
    ("GameDay", "Scheduled home game"),
    ("HoldSettings", "Hold-duration config"),
    ("SlackSettings", "Notification config"),
    ("PosApiKey", "POS credential"),
    ("PosEvent", "POS transaction log"),
    ("ProductReview", "Customer review"),
    ("ProductLike", "Session-based heart/like"),
    ("SiteFeedback", "Public feedback message"),
], cols=3)
h2("Key Relationships")
bullets([
    "<b>Product 1\u2013N SizeInventory</b> — each product's stock is tracked per size, per StoreLocation.",
    "<b>Product 1\u2013N Hold</b>, <b>Customer 1\u2013N Hold</b> — a hold links a specific product/size reservation to a phone-identified customer.",
    "<b>Hold 1\u20131 HoldHistory</b>, optional <b>1\u20131 SalesHistory</b> — resolution always snapshots history; a sale record is created only when items are picked up.",
    "<b>Player N\u2013N Product</b> via <b>PlayerProduct</b> — each mapping carries a display label (e.g. \u201cHome Jersey\u201d) and sort order for the player detail page.",
    "<b>StoreLocation 1\u2013N InventoryTransaction</b> (from/to) — every stock movement references its source and destination location.",
    "<b>Admin 1\u2013N AuditLog</b> — every admin-initiated action is traceable back to the acting user.",
    "<b>PosApiKey 1\u2013N PosEvent</b> — every POS transaction is tied to the credential that submitted it, enabling per-terminal auditing.",
])

# ================================================================== 12. APPLICATION MODULES
h1("Application Modules")
mod_rows = [
    ("Storefront", "Catalog browsing, product detail, brands, players, cart, account, informational pages"),
    ("Digital Hold Engine", "Hold creation, precheck, resolution, expiry, history/sales archival"),
    ("Inventory Management", "Size/location stock tracking, transfers, restocks, transaction ledger"),
    ("Point-of-Sale Integration", "API-key authenticated webhook ingestion, idempotent transaction application"),
    ("Player &amp; Brand Merchandising", "Player profiles, linked shoppable gear, brand directory"),
    ("Engagement", "Product likes, client-side favorites, customer reviews, site feedback"),
    ("Admin Operations", "Product/inventory CRUD, hold queue management, game-day calendar"),
    ("Reporting &amp; Analytics", "Operational overview dashboard, sales/conversion reports, likes analytics, exports"),
    ("Identity &amp; Access", "NextAuth admin login, role-based authorization, admin user management"),
    ("Notifications", "Slack new-hold and expiry alerts, interactive Slack resolution"),
    ("Governance", "Audit logging across all sensitive actions, orphaned-media audit tooling"),
]
data_table(["Module", "Responsibility"], mod_rows, col_widths=[1.8*inch, PAGE_W-1.8*inch])

# ================================================================== 13. SCREEN-BY-SCREEN
h1("Screen-by-Screen Documentation")
p("""Each screen below is documented with its purpose, primary objective, user actions, inputs and
outputs, and how it connects to the rest of the platform.""")

def screen_block(name, purpose, objective, actions, io, nav, value):
    h2(name)
    data_table(
        ["Attribute", "Detail"],
        [
            ("Purpose", purpose),
            ("Primary Objective", objective),
            ("User Actions", actions),
            ("Inputs / Outputs", io),
            ("Navigates To", nav),
            ("Business Value", value),
        ],
        col_widths=[1.15*inch, PAGE_W-1.15*inch], small=True)

screen_block("Landing Page (/)",
    "First impression and orientation hub for fans arriving at the site.",
    "Surface featured merchandise and any upcoming/active home game.",
    "Browse featured products; view Upcoming Match card when a home game is scheduled.",
    "In: none. Out: navigation to Shop, Players, Brands.",
    "/shop, /players, /brands",
    "Drives initial engagement and highlights game-day relevance without cluttering the page when no game is scheduled.")

screen_block("Shop Catalog (/shop)",
    "Primary product discovery and filtering surface.",
    "Let fans find the right product quickly via category, subcategory, brand, and audience filters.",
    "Filter by category/brand/audience; search; view Sales &amp; Clearance and Blank Jersey collections; optional player-bundle view via productIds query.",
    "In: filter/search query params. Out: product grid, navigation to PDP.",
    "/shop/[slug]",
    "Central conversion surface; consistent target-audience labeling and clearance subcategories reduce browsing friction.")

screen_block("Product Detail Page (/shop/[slug])",
    "Deep-dive product page supporting the purchase/reserve decision.",
    "Give fans everything needed to decide with confidence and start a hold.",
    "View images, price, size availability, target audience/color, reviews; like/favorite; start a Digital Hold.",
    "In: slug param. Out: hold creation request, review submission.",
    "/holds/[reservationId] (after hold), related PDPs",
    "Highest-intent screen; real-time availability and reviews increase reservation conversion.")

screen_block("Popular Players (/players, /players/[slug])",
    "Player-driven merchandising hub linking fans to associated shoppable gear.",
    "Cross-sell jerseys and gear through fan affinity for specific players.",
    "Browse/search players by name or position; view player bio, stats, and linked gear; jump to PDP or a filtered shop bundle.",
    "In: search/position filters, slug. Out: navigation to /shop/[slug] or /shop?productIds=.",
    "/shop, /shop/[slug]",
    "Differentiated merchandising angle that increases basket relevance for fans of specific players.")

screen_block("Digital Hold Confirmation (/holds/[reservationId])",
    "Post-reservation confirmation and status screen.",
    "Give the fan a clear, shareable record of their reservation.",
    "View reservation code, countdown, QR code, pickup instructions; self-service pickup/release.",
    "In: reservationId. Out: PATCH action (pickup/release).",
    "/my-holds",
    "Removes uncertainty after reservation; QR code speeds up in-person pickup verification.")

screen_block("My Holds (/my-holds)",
    "Self-service lookup of a customer's hold history.",
    "Let a returning fan check all active/past holds without an account.",
    "Enter phone number; view list of holds and statuses.",
    "In: phone number. Out: list of Hold records.",
    "/holds/[reservationId]",
    "Removes dependency on staff for basic status questions, reducing service load.")

screen_block("Admin Dashboard (/admin)",
    "Landing screen for staff after login; operational at-a-glance view.",
    "Orient staff toward the highest-priority tasks for the day.",
    "Review key metrics; navigate to Holds, Inventory, Reports.",
    "In: session/role. Out: navigation.",
    "/admin/holds, /admin/products, /admin/analytics",
    "Reduces time-to-first-action for staff starting a shift.")

screen_block("Admin Holds Queue (/admin/holds)",
    "Operational queue for fulfilling and resolving active reservations.",
    "Let staff resolve holds accurately and quickly, including partial fulfillment.",
    "View active holds with urgency indicators; resolve as picked-up, partial, or released.",
    "In: holdId, action, fulfilledQty. Out: updated Hold/HoldHistory/SalesHistory records.",
    "(print)/admin/holds/[id]/print",
    "Directly reduces staff cognitive load and pickup handling time on busy game days.")

screen_block("Admin Products (/admin/products)",
    "Product catalog and inventory management.",
    "Maintain accurate product data, imagery, taxonomy, and stock.",
    "Create/edit/archive products; upload images; manage size inventory; assign category flags (Sale, Clearance, Blank Jersey, etc.).",
    "In: product form data, images. Out: Product/SizeInventory records.",
    "/admin/inventory/history",
    "Keeps the storefront's product data and stock accurate at the source.")

screen_block("Admin Game Days (/admin/game-days)",
    "Scheduling interface for upcoming home games.",
    "Keep the single source of truth for game-day-dependent business rules and landing-page display in sync.",
    "Add/delete game days with date, start time, opponent, note.",
    "In: date, startTime, opponent, note. Out: GameDay record.",
    "Reflected automatically on landing page and hold-eligibility logic.",
    "Ensures Section 123 hold eligibility and landing-page matchup display are always correct and current.")

screen_block("Admin Analytics &amp; Reports (/admin/analytics, /admin/reports)",
    "Management-facing operational and business intelligence dashboards.",
    "Give supervisors and executives continuous visibility into inventory health and sales performance.",
    "View inventory breakdowns, conversion/no-show rates, top products, weekly revenue; export data.",
    "In: date range/period filter. Out: aggregated metrics, CSV export.",
    "N/A (terminal reporting screen)",
    "Converts operational data into planning and staffing insight without manual reconciliation.")

page_break()
print("PART sections 9-13 ready:", len(story), "flowables")

# ================================================================== 14. ROLES & PERMISSIONS
h1("User Roles and Permissions")
p("""Access control is enforced via a strict role hierarchy: <b>VIEWER &lt; STAFF &lt; MANAGER &lt;
OWNER</b>. Every gated admin action declares a minimum required role in a central permission map
(<i>actionMinRole</i>), and a single <i>requireRole()</i> check is applied consistently at the top of
every protected API route.""")
perm_rows = [
    ("inventory:read", "STAFF"), ("inventory:write", "MANAGER"),
    ("holds:read", "STAFF"), ("holds:resolve", "MANAGER"),
    ("transfers:create", "MANAGER"), ("pos-keys:manage", "OWNER"),
    ("game-days:manage", "MANAGER"), ("hold-settings:manage", "MANAGER"),
    ("analytics:read", "STAFF"), ("players:read", "STAFF"),
    ("players:write", "MANAGER"), ("brands:read", "STAFF"),
    ("brands:write", "MANAGER"), ("feedback:read", "STAFF"),
    ("feedback:write", "MANAGER"), ("admin:manage", "OWNER"),
    ("tenant:manage", "OWNER"),
]
data_table(["Action", "Minimum Role"], perm_rows, col_widths=[2.2*inch, PAGE_W-2.2*inch])
h2("Role Summary")
bullets([
    "<b>VIEWER</b> — read-only access baseline; no write permissions granted by default.",
    "<b>STAFF</b> — day-to-day floor operations: view inventory, holds, analytics, players, brands, feedback.",
    "<b>MANAGER</b> — adds write access: resolve holds, edit inventory/products, manage game days, hold settings, players, and brands.",
    "<b>OWNER</b> — full control: admin user management, POS API key issuance, tenant management, and every MANAGER/STAFF capability.",
])

# ================================================================== 15. CUSTOMER WORKFLOW
h1("Customer Workflow")
diagram([["Browse Catalog", "Select Product", "Choose Size/Qty", "Submit Hold", "Get Confirmation", "Pick Up"]],
        colors_map={k: RED for k in ["Browse Catalog", "Select Product", "Choose Size/Qty", "Submit Hold", "Get Confirmation", "Pick Up"]},
        caption="Figure 15.1 — Customer digital-hold workflow")
p("""A fan browses `/shop` or `/players`, opens a product detail page, selects a size/quantity, and
submits a phone number to place a hold via `POST /api/holds`. The system validates real-time
availability, computes the effective hold window (standard vs. extended vs. game-day-adjusted), and
returns a reservation code with an expiration timestamp. The fan can look up status anytime via
reservation code or phone number, and self-service pickup/release the hold from the confirmation
page before staff involvement is even required.""")

# ================================================================== 16. STAFF WORKFLOW
h1("Staff Workflow")
diagram([["Login", "Review Holds Queue", "Resolve Pickup/Release", "Update Inventory", "Escalate if Needed"]],
        colors_map={k: GREEN for k in ["Login", "Review Holds Queue", "Resolve Pickup/Release", "Update Inventory", "Escalate if Needed"]},
        caption="Figure 16.1 — Retail associate operational workflow")
p("""Staff authenticate via the NextAuth-protected `/admin/login`, then work primarily from the
`/admin/holds` queue — resolving holds as full pickups, partial pickups, or releases with a single
action. Inventory adjustments, restocks, and transfers are performed from `/admin/products` and
`/admin/inventory/history`, with every change automatically written to the InventoryTransaction
ledger. Staff with only STAFF-level role can read all operational data but must escalate write
actions requiring MANAGER approval (e.g., inventory edits, hold-settings changes).""")

# ================================================================== 17. ADMIN WORKFLOW
h1("Admin Workflow")
diagram([["Configure Game Days", "Set Hold Policies", "Manage Catalog/Brands/Players", "Review Reports", "Manage Admin Users"]],
        colors_map={k: GOLD for k in ["Configure Game Days", "Set Hold Policies", "Manage Catalog/Brands/Players", "Review Reports", "Manage Admin Users"]},
        caption="Figure 17.1 — Manager/Owner administrative workflow")
p("""MANAGER and OWNER roles configure the operational rules that STAFF work within: game-day
scheduling (`/admin/game-days`), hold-duration policy (`/admin/hold-settings`), and full catalog,
brand, and player management. OWNER additionally manages admin accounts and roles
(`/admin/admins`), issues POS API keys (`/admin/pos-keys`), and reviews the full audit trail
(`/admin/audit-log`) for governance and compliance oversight.""")

# ================================================================== 18. INVENTORY MANAGEMENT
h1("Inventory Management Process")
p("""Inventory is tracked at the most granular level relevant to retail decisions: <b>product \u00d7
size \u00d7 location</b> (the `SizeInventory` model), with `Product` maintaining aggregate mirror
totals (`quantity`, `heldQuantity`, `pickedQuantity`) for fast catalog display.""")
bullets([
    "<b>Restock:</b> `POST /api/admin/products/[id]/restock` increases available quantity at a location and logs an `InventoryTransaction` (type <i>adjustment</i>).",
    "<b>Transfer:</b> `POST /api/admin/inventory/transfer` moves stock between two `StoreLocation` rows, logging <i>transfer</i> transactions referencing both source and destination.",
    "<b>Hold reservation:</b> placing a hold increments `heldQuantity` at the fulfilling location (type <i>hold-reserve</i>); releasing or expiring decrements it (type <i>hold-release</i>).",
    "<b>POS sale/return:</b> POS webhook events increment `pickedQuantity`/adjust `quantity` directly (types <i>sale</i>/<i>return</i>), keeping in-person transactions reconciled with the same ledger.",
    "<b>Status rollup:</b> product `status` (AVAILABLE/SOLD/ARCHIVED) is automatically recalculated from aggregate size-inventory availability after every change.",
])

# ================================================================== 19. DIGITAL HOLD LIFECYCLE
h1("Digital Hold Lifecycle")
diagram([["ACTIVE", "PICKED_UP"], ["ACTIVE", "RELEASED"], ["ACTIVE", "EXPIRED"]],
        colors_map={"ACTIVE": RED, "PICKED_UP": GREEN, "RELEASED": GOLD, "EXPIRED": colors.HexColor("#374151")},
        caption="Figure 19.1 — Hold status transitions")
h2("Creation")
bullets([
    "Upserts the `Customer` by phone number; enforces a maximum of <b>3 active holds</b> per customer.",
    "Determines pickup channel: standard (Gate 5) vs. stadium (Section 123 queue) — stadium pickup requires an active game day, or the request is rejected (`SECTION_123_GAME_DAY_ONLY`).",
    "Computes the effective hold window via `getEffectiveHoldHours()`: stadium holds always use the standard window; standard holds use the extended 48-hour window only when enabled and it is not a game day.",
    "Runs inside a database transaction: re-validates live availability, increments `heldQuantity`, logs an `InventoryTransaction`, creates the `Hold` row, syncs product aggregates, and writes an `AuditLog` entry (`hold.created`).",
])
h2("Resolution")
bullets([
    "`resolveHold()` accepts a target status (`PICKED_UP`/`RELEASED`/`EXPIRED`) and an optional partial fulfillment quantity.",
    "Partial pickups mark the original hold `PICKED_UP` for the fulfilled portion and spin off a new `ACTIVE` hold for the remainder, inheriting the original expiration.",
    "A `HoldHistory` snapshot is always written; a `SalesHistory` row is written only when items are actually picked up.",
])
h2("Expiry")
bullets([
    "`expireAllOverdueHolds()` runs via the daily Vercel cron job (`/api/cron/expire-holds`, Bearer `CRON_SECRET` auth) and sends Slack expiry notifications.",
    "`autoExpireOverdueHolds()` runs inline on read endpoints (hold lookup, admin analytics) so no client ever sees a stale ACTIVE hold, even between scheduled cron runs.",
])

# ================================================================== 20. GAME DAY OPERATIONS
h1("Game Day Operations")
p("""The `GameDay` model (`date`, `startTime`, `opponent`, `note`) is the single source of truth for
all game-day-dependent behavior across the platform — eliminating any risk of mismatch between what
staff schedule and what fans see.""")
bullets([
    "<b>Admin scheduling:</b> `/admin/game-days` lets MANAGER+ create/delete entries, validated for correct date and `HH:mm` time format, with duplicate-date protection and full audit logging.",
    "<b>Hold eligibility:</b> `isGameDay()` performs a UTC-normalized exact-date lookup used by the hold engine to gate Section 123 stadium-queue eligibility and to select standard vs. extended hold windows.",
    "<b>Landing page display:</b> `GET /api/game-days/next` returns the earliest upcoming home game; `UpcomingMatchCard` renders the Blue Jays vs. opponent matchup (with logos), formatted date and start time — all in UTC to prevent off-by-one-day timezone bugs — and renders nothing at all when no game is scheduled, avoiding empty banners.",
])

# ================================================================== 21. PRODUCT MANAGEMENT
h1("Product Management")
p("""Products are the platform's core commerce entity, supporting rich taxonomy, multi-image
merchandising, and per-size/location inventory. Admin product management covers the full lifecycle
from creation through archival.""")
bullets([
    "<b>Creation/editing:</b> `/admin/products` supports multi-image upload, category/subcategory/brand/color assignment, and toggling of merchandising flags (`isFeatured`, `isClearance`, `isSport`, `isBlankJersey`, `isNewArrival`, `isWorldSeries`, `isAuthenticated`, `isChampion`, `isBestSeller`, `isLicensed`).",
    "<b>Archival:</b> products are soft-archived (`status: ARCHIVED`) rather than hard-deleted, preserving historical hold/sale references.",
    "<b>Sizing:</b> size lists are derived automatically from subcategory/age-group/category via `getDefaultSizes()`, with sizeless categories (accessories, mugs, bobbleheads) bypassing size selection entirely.",
    "<b>Player linkage:</b> products can be mapped to one or more `Player` records via `PlayerProduct`, powering the Popular Players shoppable-gear experience.",
])

# ================================================================== 22. SALES & CLEARANCE MANAGEMENT
h1("Sales &amp; Clearance Management")
p("""Sales &amp; Clearance is implemented as a unified catalog (`isClearance` flag) with
subcategory-based organization, avoiding duplicate product entries while still enabling focused
browsing by audience.""")
bullets([
    "Subcategories: <b>Men, Women, Kids, Accessories</b> — assigned by admins at the point a product is marked Sale/Clearance.",
    "Fans can filter the unified Sales &amp; Clearance catalog by subcategory without the catalog needing separate duplicate listings per audience.",
    "The product detail page automatically surfaces a <b>Target Audience</b> label (Men/Women/Kids) for clearance/sale items, inherited directly from the product's category/subcategory — no duplicate data entry required, and hidden entirely when not applicable.",
    "Filtering is fully responsive, using the same client-side filter pattern as the main shop catalog, consistent across desktop and mobile.",
])

page_break()
print("PART sections 14-22 ready:", len(story), "flowables")

# ================================================================== 23. BRAND & CATEGORY MANAGEMENT
h1("Brand and Category Management")
p("""Category taxonomy is centralized in a single constants module so every screen — storefront,
admin, and reporting — reads from one authoritative list, preventing category drift between areas
of the application.""")
cat_rows = [
    ("men / women / kids", "Audience categories", "Full subcategory sets (Jerseys, Tees, Hoodies, Hats, etc.)"),
    ("accessories", "Non-apparel merchandise", "Bags, drinkware, collectibles"),
    ("featured", "Curated cross-category spotlight", "Flag-driven (isFeatured)"),
    ("new-arrivals", "Recently added merchandise", "Flag-driven (isNewArrival)"),
    ("sales-clearance", "Unified discount catalog", "Men / Women / Kids / Accessories subcategories"),
    ("sports", "General sport-branded merchandise", "Flag-driven (isSport)"),
    ("authentication", "Authenticated/licensed memorabilia", "Flag-driven (isAuthenticated)"),
    ("blank-jersey", "Player-name/number-free jerseys", "Men / Women / Kids, filterable by Brand"),
]
data_table(["Category", "Purpose", "Structure"], cat_rows, col_widths=[1.3*inch, 1.9*inch, PAGE_W-3.2*inch])
p("""Brands are managed as first-class records (`Brand` model) via `/admin/brands`, each with a
name, logo, and optional description, and every product references a brand for filtering on brand
pages and within category views (including the new Blank Jersey category's brand-based filtering).""")

# ================================================================== 24. REPORTING & ANALYTICS
h1("Reporting and Analytics")
rep_rows = [
    ("Operational Overview", "/admin/analytics", "Active holds, low-stock alerts, today's pickups, at-a-glance KPIs"),
    ("Sales Reports", "/admin/reports", "Revenue trends, top-selling products, weekly/period comparisons"),
    ("Hold Conversion", "/admin/reports", "Pickup vs. release vs. expiry rates, no-show tracking"),
    ("Inventory Health", "/admin/inventory/history", "Stock levels by location, transaction history, transfer trail"),
    ("Engagement Analytics", "/admin/analytics", "Product likes/favorites trends, review volume"),
    ("Audit Trail", "/admin/audit-log", "Full chronological record of every sensitive action, filterable by actor/action"),
]
data_table(["Report", "Location", "Content"], rep_rows, col_widths=[1.5*inch, 1.3*inch, PAGE_W-2.8*inch])
p("""Reports support CSV export for offline analysis and are backed by short-lived in-memory
caching to keep dashboards responsive under repeated polling without adding database load.""")

# ================================================================== 25. SECURITY & ACCESS CONTROL
h1("Security and Access Control")
bullets([
    "<b>Authentication:</b> NextAuth Credentials provider with bcrypt-hashed passwords; JWT sessions expire after 8 hours.",
    "<b>Authorization:</b> centralized `requireRole()` helper checks the caller's role against the `actionMinRole` map before any protected route executes its logic.",
    "<b>API-key auth (POS):</b> POS webhook endpoints authenticate via dedicated `PosApiKey` records, independent of admin sessions, scoped to transaction ingestion only.",
    "<b>Rate limiting:</b> a sliding-window limiter protects admin API paths (default 100 requests/minute) against abuse or runaway automation.",
    "<b>Cron protection:</b> the hold-expiry cron endpoint requires a Bearer `CRON_SECRET` header, preventing unauthorized manual triggering.",
    "<b>Auditability:</b> every sensitive create/update/delete records an `AuditLog` entry capturing actor, action, entity, and before/after state.",
    "<b>Data isolation:</b> `tenantId` on core models establishes tenant boundaries in preparation for multi-tenant/multi-store expansion.",
])

# ================================================================== 26. PERFORMANCE & SCALABILITY
h1("Performance and Scalability Considerations")
bullets([
    "Database transactions scope hold creation/resolution and inventory transfers tightly to minimize lock contention under concurrent load.",
    "In-memory caching (~30s) on analytics endpoints absorbs dashboard polling without repeated heavy aggregation queries.",
    "Indexed lookups (e.g., `isBlankJersey`, `isClearance`, `isFeatured` flags; phone number on `Customer`) keep catalog and hold-lookup queries fast as data volume grows.",
    "The tenant-aware schema and multi-location `StoreLocation` model allow the platform to scale horizontally to additional venues without a schema rewrite.",
    "Next.js server components and route-level static/dynamic rendering choices (`force-dynamic` on API routes) balance freshness needs against build-time performance.",
])

# ================================================================== 27. API & DATA FLOW ARCHITECTURE
h1("API and Data Flow Architecture")
diagram([
    ["Client (Web/Admin)", "Next.js API Route", "Auth/Role Check"],
    ["Business Logic", "Prisma Transaction", "PostgreSQL"],
    ["Audit Log Write", "Slack Notify (if applicable)", "JSON Response"],
], colors_map={
    "Client (Web/Admin)": RED, "Next.js API Route": ROYAL, "Auth/Role Check": GOLD,
    "Business Logic": ROYAL, "Prisma Transaction": NAVY, "PostgreSQL": colors.HexColor("#374151"),
    "Audit Log Write": GREEN, "Slack Notify (if applicable)": GREEN, "JSON Response": RED,
}, caption="Figure 27.1 — Typical request/data-flow path through a protected admin API route")
p("""Public routes (catalog, product detail, players, holds creation/lookup, feedback, reviews)
require no authentication and are optimized for fast anonymous access. Admin routes uniformly
pass through session validation, role authorization, business logic (often wrapped in a Prisma
transaction), audit logging, and — where relevant — a Slack notification side-effect, before
returning a JSON response.""")

# ================================================================== 28. BUSINESS RULES & VALIDATION
h1("Business Rules and Validation Logic")
bullets([
    "A customer may hold a maximum of <b>3 active reservations</b> at any time.",
    "Section 123 (stadium queue) pickup is only offered/honored on an active <b>game day</b>; otherwise the request is rejected with a clear message.",
    "The extended 48-hour hold window applies only to standard (non-stadium) holds, only when enabled in `HoldSettings`, and never on a game day.",
    "Inventory can never go negative — hold creation and POS sales re-validate live availability inside the same transaction that commits the change.",
    "Products are never hard-deleted while referenced by historical holds/sales — archival (`status`) preserves referential integrity.",
    "POS events are ingested idempotently by `externalId`, preventing duplicate transaction application on retry/replay.",
    "Target-audience and Blank Jersey subcategory labeling is always derived from `category`/`subcategory`, never a separate duplicated field, guaranteeing consistency.",
])

# ================================================================== 29. UI/UX DESIGN PRINCIPLES
h1("UI/UX Design Principles")
bullets([
    "<b>Mobile-first:</b> every public and admin surface is designed for small-screen usage first, then progressively enhanced for tablet/desktop.",
    "<b>Brand-consistent palette:</b> Jays Navy, Royal, Red, and Ice tones are reused across badges, buttons, and highlights rather than introducing new colors per feature.",
    "<b>Minimal noise:</b> redundant labels and low-value copy (e.g., generic \u201cIn Stock\u201d text, verbose field labels) are removed in favor of direct, glanceable information.",
    "<b>Consistent card language:</b> hover elevation, scale, and shadow transitions are shared across product cards, player cards, and related-item cards.",
    "<b>Progressive disclosure:</b> compact layouts (e.g., the condensed Upcoming Match card) show only what's essential, expanding detail only where users need it.",
    "<b>Accessibility of key actions:</b> primary actions (Feedback button, Hold CTA) are positioned prominently with high-contrast, brand-appropriate coloring.",
])

# ================================================================== 30. ERROR HANDLING STRATEGY
h1("Error Handling Strategy")
bullets([
    "API routes return structured JSON error payloads with descriptive codes (e.g., `SECTION_123_GAME_DAY_ONLY`) rather than opaque failures, enabling precise client-side messaging.",
    "Hold creation/resolution failures roll back the entire Prisma transaction, guaranteeing inventory and hold state never diverge on partial failure.",
    "Public-facing forms (hold creation, feedback, reviews) validate input both client-side (immediate feedback) and server-side (authoritative enforcement).",
    "Admin routes return standardized 401/403 responses for authentication/authorization failures, distinct from 4xx validation errors.",
    "Cron and webhook endpoints log failures for operational visibility without exposing internal error detail to external callers.",
])

# ================================================================== 31. FUTURE ENHANCEMENTS
h1("Future Enhancements and Version Roadmap")
bullets([
    "Native account/loyalty layer building on the existing phone-identified customer model.",
    "Expanded Player feature: player-specific promotions, stats-driven merchandising, and social sharing.",
    "Additional stadium sections/queues beyond Gate 5 and Section 123 as operational needs grow.",
    "Deeper analytics: predictive low-stock alerts and demand forecasting tied to the game-day calendar.",
    "Multi-venue/multi-tenant activation using the existing `tenantId` foundation already present in the schema.",
    "Expanded notification channels (SMS/email) alongside the existing Slack integration.",
])

# ================================================================== 32. TESTING STRATEGY
h1("Testing Strategy")
bullets([
    "<b>Type safety:</b> `tsc --noEmit` run as a required gate before merging any change, backed by Prisma's generated types across the entire data layer.",
    "<b>Linting:</b> ESLint (`eslint-config-next`) enforces consistent code style and catches common React/Next.js pitfalls.",
    "<b>Manual verification:</b> feature changes are verified against real admin/storefront flows (create/edit/archive, hold create/resolve/expire) before release.",
    "<b>Data integrity checks:</b> transactional hold and inventory logic is manually validated against edge cases (partial pickup, concurrent holds, game-day boundary conditions).",
    "<b>Recommended next step:</b> introduce automated integration tests around the hold lifecycle and inventory ledger, given their correctness-critical nature.",
])

# ================================================================== 33. DEPLOYMENT ARCHITECTURE
h1("Deployment Architecture")
diagram([["Git Push", "Vercel Build (prisma generate)", "Production Deploy", "Daily Cron Trigger"]],
        colors_map={k: NAVY for k in ["Git Push", "Vercel Build (prisma generate)", "Production Deploy", "Daily Cron Trigger"]},
        caption="Figure 33.1 — Deployment pipeline")
bullets([
    "Hosted on <b>Vercel</b>, with `prisma generate` wired into both the build and postinstall scripts to guarantee the client is always current in serverless environments.",
    "All API routes are explicitly marked `force-dynamic` to prevent Prisma client initialization from occurring during static build analysis.",
    "A daily Vercel Cron job (`0 0 * * *`, aligned to Hobby-plan limits) triggers the hold-expiry job in production.",
    "Environment-based configuration (`CRON_SECRET`, database URL, NextAuth secret, Slack webhook, POS keys) keeps sensitive credentials out of source control.",
])

# ================================================================== 34. MAINTENANCE & SUPPORT PLAN
h1("Maintenance and Support Plan")
bullets([
    "The `AuditLog` provides first-line diagnostic capability for any operational question (\u201cwho changed what, and when\u201d) without needing direct database access.",
    "Centralized constants (`constants.ts`) and permission maps (`authorize.ts`) mean taxonomy or role changes are made in one place and propagate consistently.",
    "Soft-archival conventions (products, players) protect historical data integrity, simplifying support investigations into past holds/sales.",
    "Scheduled game-day data entry is the only recurring manual maintenance task tied to core business rules; all downstream behavior (Section 123 eligibility, hold windows, landing-page display) updates automatically.",
])

# ================================================================== 35. RISKS & MITIGATION
h1("Project Risks and Mitigation Strategies")
risk_rows = [
    ("Overselling across channels", "Shared SizeInventory ledger + transactional writes across web, hold, and POS eliminate channel drift."),
    ("Stale/expired holds blocking inventory", "Dual expiry mechanism: daily cron plus inline auto-expire on every read path."),
    ("Timezone-driven date mismatches", "Game-day date/time handled and displayed consistently in UTC across admin entry and landing-page rendering."),
    ("Unauthorized admin actions", "Centralized role-based authorization enforced uniformly on every protected route."),
    ("Duplicate POS transaction application", "Idempotent ingestion keyed on POS `externalId`."),
    ("Feature creep diluting taxonomy consistency", "All category/flag definitions centralized in one constants module referenced everywhere."),
]
data_table(["Risk", "Mitigation"], risk_rows, col_widths=[2.1*inch, PAGE_W-2.1*inch])

# ================================================================== 36. CONCLUSION
h1("Conclusion and Long-Term Vision")
p("""Version 2.0 of Jays Shop represents a mature, tightly integrated retail operations platform:
one inventory ledger spanning web, hold, and point-of-sale channels; one taxonomy governing every
category and merchandising flag; one role-based permission model protecting every admin action; and
one audit trail giving full operational transparency. The platform's architecture — centralized
constants, transactional business logic, and a consistent API/UI pattern language — means new
retail capabilities (additional pickup sections, new merchandising categories, deeper player
integrations, expanded reporting) can be layered on without destabilizing what already works.""")
story.append(Paragraph("\u201cA connected retail platform where every browse, reservation, and pickup "
                        "reflects the same standard of excellence fans expect on game day.\u201d", styles["Quote"]))
p("""This document should be treated as a living reference: as the platform evolves toward Version
3.0 and beyond, each new capability should be added to the relevant section here, keeping this a
single, trustworthy source of truth for how Jays Shop works and why it was built this way.""")

print("ALL SECTIONS READY:", len(story), "flowables")

# ================================================================== DOC BUILD (TOC + bookmarks + footer)
class NumberedCanvas(canvas_mod.Canvas):
    def draw_footer(self, page_num):
        self.setFont("Helvetica", 7.6)
        self.setFillColor(GREY)
        self.drawString(0.85 * inch, 0.55 * inch, "Jays Shop \u2014 Version 2.0 Project Documentation")
        self.drawRightString(LETTER[0] - 0.85 * inch, 0.55 * inch, "Page %d" % page_num)
        self.setStrokeColor(colors.HexColor("#D8E0EC"))
        self.setLineWidth(0.5)
        self.line(0.85 * inch, 0.72 * inch, LETTER[0] - 0.85 * inch, 0.72 * inch)

class DocTemplateTOC(SimpleDocTemplate):
    def afterFlowable(self, flowable):
        if isinstance(flowable, Paragraph):
            style_name = flowable.style.name
            title = getattr(flowable, "_bookmarkTitle", None)
            if title and style_name == "H1":
                key = "h1-%s" % id(flowable)
                self.canv.bookmarkPage(key)
                self.canv.addOutlineEntry(title, key, level=0, closed=False)
                self.notify("TOCEntry", (0, title, self.page, key))
            elif title and getattr(flowable, "_isH2", False):
                key = "h2-%s" % id(flowable)
                self.canv.bookmarkPage(key)
                self.canv.addOutlineEntry(title.strip(), key, level=1, closed=True)
                self.notify("TOCEntry", (1, title, self.page, key))

def on_page(canvas_obj, doc):
    canvas_obj.saveState()
    canvas_obj.setFont("Helvetica", 7.6)
    canvas_obj.setFillColor(GREY)
    canvas_obj.drawString(0.85 * inch, 0.55 * inch, "Jays Shop \u2014 Version 2.0 Project Documentation")
    canvas_obj.drawRightString(LETTER[0] - 0.85 * inch, 0.55 * inch, "Page %d" % doc.page)
    canvas_obj.setStrokeColor(colors.HexColor("#D8E0EC"))
    canvas_obj.setLineWidth(0.5)
    canvas_obj.line(0.85 * inch, 0.72 * inch, LETTER[0] - 0.85 * inch, 0.72 * inch)
    canvas_obj.restoreState()

def on_cover(canvas_obj, doc):
    canvas_obj.saveState()
    canvas_obj.setFillColor(NAVY)
    canvas_obj.rect(0, 0, LETTER[0], LETTER[1], fill=1, stroke=0)
    canvas_obj.restoreState()

doc = DocTemplateTOC(
    "/Users/idehenomoruyi/projects/jays-shop/docs/out/Jays-Shop-V2-Project-Documentation.pdf",
    pagesize=LETTER,
    topMargin=0.75 * inch, bottomMargin=0.85 * inch,
    leftMargin=0.85 * inch, rightMargin=0.85 * inch,
    title="Jays Shop - Version 2.0 Project Documentation",
    author="Jays Shop Engineering & Product",
)

def first_page(c, d):
    if d.page == 1:
        on_cover(c, d)
    else:
        on_page(c, d)

doc.multiBuild(story, onFirstPage=first_page, onLaterPages=on_page)
print("PDF built.")
