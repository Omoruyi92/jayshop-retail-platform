# -*- coding: utf-8 -*-
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

styles = getSampleStyleSheet()

styles.add(ParagraphStyle(name="CoverTitle", fontName="Helvetica-Bold", fontSize=30, leading=36,
                           textColor=colors.white, alignment=TA_CENTER))
styles.add(ParagraphStyle(name="CoverSub", fontName="Helvetica", fontSize=14, leading=20,
                           textColor=ICE, alignment=TA_CENTER, spaceBefore=10))
styles.add(ParagraphStyle(name="H1", fontName="Helvetica-Bold", fontSize=19, leading=24,
                           textColor=NAVY, spaceBefore=6, spaceAfter=10,
                           borderColor=RED, borderWidth=0))
styles.add(ParagraphStyle(name="H2", fontName="Helvetica-Bold", fontSize=13.5, leading=18,
                           textColor=ROYAL, spaceBefore=14, spaceAfter=6))
styles.add(ParagraphStyle(name="Body", fontName="Helvetica", fontSize=10.3, leading=15.2,
                           textColor=colors.HexColor("#22262B"), alignment=TA_JUSTIFY, spaceAfter=6))
styles.add(ParagraphStyle(name="BodyBold", parent=styles["Body"], fontName="Helvetica-Bold",
                           textColor=NAVY))
styles.add(ParagraphStyle(name="BulletP", parent=styles["Body"], leftIndent=0, spaceAfter=4))
styles.add(ParagraphStyle(name="Quote", fontName="Helvetica-Oblique", fontSize=12, leading=18,
                           textColor=ROYAL, alignment=TA_CENTER, spaceBefore=8, spaceAfter=8))
styles.add(ParagraphStyle(name="Caption", fontName="Helvetica-Oblique", fontSize=8.5, leading=11,
                           textColor=GREY, alignment=TA_CENTER))
styles.add(ParagraphStyle(name="TOCItem", fontName="Helvetica", fontSize=11, leading=20,
                           textColor=NAVY))

story = []
PAGE_W = LETTER[0] - 2 * 0.9 * inch

def rule(color=RED, thickness=2, spaceBefore=2, spaceAfter=10):
    story.append(Spacer(1, spaceBefore))
    story.append(HRFlowable(width="100%", thickness=thickness, color=color))
    story.append(Spacer(1, spaceAfter))

def h1(text):
    story.append(Spacer(1, 4))
    story.append(Paragraph(text, styles["H1"]))
    story.append(HRFlowable(width="35%", thickness=2.4, color=RED, hAlign="LEFT"))
    story.append(Spacer(1, 8))

def h2(text):
    story.append(Paragraph(text, styles["H2"]))

def p(text):
    story.append(Paragraph(text, styles["Body"]))

def bullets(items):
    story.append(ListFlowable(
        [ListItem(Paragraph(i, styles["BulletP"]), bulletColor=RED, value="square") for i in items],
        bulletType="bullet", start="square", leftIndent=14, bulletFontSize=6, spaceBefore=2, spaceAfter=8))

def stat_row(stats):
    """stats: list of (big, small) tuples -> a row of callout boxes"""
    cell_style_big = ParagraphStyle(name="Big", fontName="Helvetica-Bold", fontSize=20,
                                     leading=24, textColor=NAVY, alignment=TA_CENTER)
    cell_style_small = ParagraphStyle(name="Small", fontName="Helvetica", fontSize=8.7,
                                       textColor=GREY, alignment=TA_CENTER, leading=11.5)
    cells = []
    for big, small in stats:
        cells.append([Paragraph(big, cell_style_big), Paragraph(small, cell_style_small)])
    # transpose into a single-row table of stacked mini-tables
    row = []
    col_w = PAGE_W / len(stats)
    for c in cells:
        t = Table([[c[0]], [c[1]]], colWidths=[col_w - 8], rowHeights=[30, 34])
        t.setStyle(TableStyle([
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, 0), 12),
            ("BOTTOMPADDING", (0, 0), (-1, 0), 0),
            ("TOPPADDING", (0, 1), (-1, 1), 4),
            ("BOTTOMPADDING", (0, 1), (-1, 1), 10),
        ]))
        row.append(t)
    outer = Table([row], colWidths=[col_w] * len(stats))
    outer.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#D8E0EC")),
        ("INNERGRID", (0, 0), (-1, -1), 0.75, colors.HexColor("#D8E0EC")),
        ("BACKGROUND", (0, 0), (-1, -1), ICE),
    ]))
    story.append(outer)
    story.append(Spacer(1, 12))

def role_table(rows):
    data = [[Paragraph("<b>Stakeholder</b>", styles["BodyBold"]), Paragraph("<b>Value Delivered</b>", styles["BodyBold"])]] + \
           [[Paragraph(r[0], styles["BulletP"]), Paragraph(r[1], styles["BulletP"])] for r in rows]
    t = Table(data, colWidths=[1.5 * inch, PAGE_W - 1.5 * inch])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#D8E0EC")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT_GREY]),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(t)
    story.append(Spacer(1, 12))

# ---------------------------------------------------------------- COVER PAGE
cover_bg = Table([[""]], colWidths=[PAGE_W], rowHeights=[9.2 * inch])
cover_bg.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), NAVY)]))

story.append(Spacer(1, 2.4 * inch))
story.append(Paragraph("JAYS SHOP", ParagraphStyle(name="Brand", fontName="Helvetica-Bold", fontSize=16,
                                                     textColor=colors.HexColor("#8FB3E8"), alignment=TA_CENTER,
                                                     spaceAfter=6)))
story.append(Paragraph("Digital Retail &amp; In-Stadium Fulfillment Platform", styles["CoverSub"]))
story.append(Spacer(1, 30))
story.append(Paragraph("BUSINESS VALUE &amp;<br/>OPERATIONAL IMPACT", styles["CoverTitle"]))
story.append(Spacer(1, 16))
story.append(HRFlowable(width="22%", thickness=2, color=RED, hAlign="CENTER"))
story.append(Spacer(1, 16))
story.append(Paragraph("A Strategic Business Case for Executive &amp; Operational Leadership",
                        styles["CoverSub"]))
story.append(Spacer(1, 220))
story.append(Paragraph("Prepared for Store Operations, Retail Management &amp; Executive Leadership",
                        ParagraphStyle(name="foot", fontName="Helvetica", fontSize=9.5, textColor=colors.HexColor("#8FB3E8"),
                                       alignment=TA_CENTER)))
story.append(PageBreak())

# ---------------------------------------------------------------- 1. EXEC SUMMARY
h1("1. Executive Summary")
p("""The Jays Shop digital retail platform represents a strategic modernization of the traditional
stadium retail experience — transforming a single point-of-sale operation into a connected,
omnichannel commerce and fulfillment system purpose-built for the pace and scale of live game-day
retail. By pairing a fully digital shopping experience with a real-time, location-aware inventory
engine and a proprietary <b>Digital Hold</b> reservation system, the platform allows fans to discover,
reserve, and collect merchandise with a level of speed, certainty, and convenience that a
traditional walk-in retail counter cannot match.""")
p("""More than an e-commerce storefront, the platform functions as an operational nerve center: it
unifies product data, physical inventory across multiple stadium locations, point-of-sale
transactions, staff workflows, and business intelligence into a single source of truth. The result
is a retail operation that is faster for fans, easier for staff, and significantly more visible and
actionable for management — on ordinary business days and, most importantly, on high-volume game
days when speed and accuracy matter the most.""")
stat_row([
    ("3–48 hrs", "Configurable hold windows matched to demand"),
    ("2", "Dedicated pickup channels (Gate 5 &amp; Stadium Queue)"),
    ("100%", "Real-time inventory visibility across locations"),
    ("24/7", "Self-service hold lookup for fans"),
])
p("""This document presents the business rationale for the platform: the value it creates for fans,
staff, and management; the operational efficiencies it unlocks; and the strategic opportunities it
opens for the organization as the retail program continues to grow.""")

# ---------------------------------------------------------------- 2. VISION
h1("2. Vision &amp; Purpose of the Platform")
p("""The platform was conceived around a simple but powerful idea: <b>a fan should never have to
choose between browsing convenience and pickup certainty.</b> Historically, in-stadium retail forces
a trade-off — fans either browse leisurely online with no guarantee an item will be available when
they arrive, or they queue physically at a counter with no visibility into stock. Jays Shop removes
that trade-off by combining a modern digital storefront with a reservation-backed inventory system,
so that browsing and reserving happen digitally, while pickup remains a fast, in-person, high-trust
moment at the stadium.""")
p("""The platform's purpose extends beyond a single transaction. It is designed as a durable piece of
retail infrastructure: a foundation that supports everyday retail operations, scales cleanly for
game-day surges, and produces the operational data leadership needs to continuously improve
merchandising, staffing, and customer experience decisions.""")

# ---------------------------------------------------------------- 3. CUSTOMER JOURNEY
h1("3. Enhancing the Customer Shopping Journey")
p("""The platform is designed around the natural arc of a fan's shopping journey — from the first
moment of product discovery through to a satisfying, low-friction pickup experience at the stadium.""")
bullets([
    "<b>Discovery:</b> A modern, mobile-first catalog with rich filtering (category, brand, audience, size, price) and a dedicated Popular Players hub connects fans directly to the gear tied to their favorite players.",
    "<b>Consideration:</b> Product detail pages surface everything a fan needs to decide with confidence — real-time availability by location, size guidance, related products, and authentic customer reviews.",
    "<b>Reservation:</b> Instead of an anonymous checkout, the platform's Digital Hold feature lets a fan reserve a specific item, size, and quantity against live inventory — with a clear expiration window and a shareable digital receipt.",
    "<b>Confirmation:</b> Each hold produces an instant confirmation with a reservation code, countdown timer, and clear pickup instructions — eliminating the uncertainty of \u201cwill it still be there when I arrive?\u201d",
    "<b>Pickup:</b> Fans choose the channel that matches their moment — a standard Gate 5 pickup window for planned visits, or an expedited Stadium Queue lane on game days for fans already in the building.",
    "<b>Ongoing engagement:</b> Favorites, order history, and a phone-based lookup (no account required) keep the relationship going beyond a single visit, lowering the barrier to repeat purchases.",
])

# ---------------------------------------------------------------- 4. OMNICHANNEL
h1("4. Supporting a Seamless Omnichannel Retail Experience")
p("""Jays Shop closes the gap between digital and physical retail. A single inventory ledger — tracked
down to the individual size and stadium location — underlies every channel: the online storefront,
the in-person point-of-sale terminal, and the staff-facing hold and fulfillment tools. This means a
sale rung in at the counter and a hold reserved from a fan's phone draw from, and update, the exact
same stock in real time.""")
p("""This unified model eliminates the classic omnichannel failure point — the disconnect between what
a website says is available and what is physically on the shelf. Every reservation, sale, return, and
transfer is captured as a single, auditable transaction, so the organization always has one
trustworthy answer to \u201cwhat do we have, and where?\u201d""")

# ---------------------------------------------------------------- 5. OPERATIONS
h1("5. Streamlining Store Operations &amp; Workflow Efficiency")
p("""For store operations, the platform converts a series of manual, judgment-based tasks into guided,
system-supported workflows:""")
bullets([
    "<b>Guided fulfillment:</b> Staff work from a live Holds queue that shows exactly what is reserved, by whom, for how long, and with built-in urgency indicators for holds nearing expiration.",
    "<b>Partial fulfillment support:</b> When a fan wants only part of a reserved quantity, the system automatically splits the transaction — updating inventory precisely and keeping the remainder reserved.",
    "<b>Automatic policy enforcement:</b> Business rules (hold duration limits, per-customer hold caps, section-specific eligibility) are enforced by the system itself, removing the need for staff to memorize or manually apply policy.",
    "<b>Point-of-sale synchronization:</b> In-person sales and returns flow directly into the same inventory ledger used by the website, keeping every channel continuously reconciled without manual counts.",
    "<b>Audit-ready operations:</b> Every inventory movement and hold decision is automatically logged, giving supervisors a complete, timestamped operational record without additional paperwork.",
])

# ---------------------------------------------------------------- 6. INVENTORY VISIBILITY
h1("6. Strengthening Inventory Visibility &amp; Product Availability")
p("""Inventory is tracked at the most granular level that matters for retail decision-making: product,
size, and physical location. This gives the organization a live, continuously accurate picture of
availability rather than a periodic snapshot.""")
bullets([
    "Real-time visibility into stock by size and by stadium location (e.g., main store vs. stadium pickup point).",
    "Automatic reservation of stock the moment a hold is placed, preventing overselling of the last available unit.",
    "Health indicators that flag low-stock and out-of-stock conditions by location before they become missed sales.",
    "A complete historical ledger of every inventory movement — transfers, adjustments, sales, returns, and hold activity — supporting accurate replenishment and loss-prevention decisions.",
])

# ---------------------------------------------------------------- 7. BENEFITS BY ROLE
h1("7. Benefits Across Customers, Staff, Supervisors &amp; Management")
role_table([
    ("Customers / Fans", "A fast, transparent path from discovery to pickup; confidence that a reserved item will be waiting; flexible pickup options that match their game-day plans; no account creation required."),
    ("Retail Associates", "A single, guided screen for fulfilling holds; automatic policy enforcement removes guesswork; clear visibility into what is reserved, expiring, or ready for pickup."),
    ("Supervisors", "Real-time oversight of active holds and queue volume; ability to manage exceptions (partial pickups, releases) confidently; a complete audit trail for every decision made on the floor."),
    ("Management / Executives", "Consolidated reporting on conversion, revenue, and customer behavior; inventory intelligence to guide purchasing and staffing; a scalable platform that supports growth without re-architecture."),
])

# ---------------------------------------------------------------- 8. HOLD EFFICIENCY
h1("8. Operational Efficiencies Through Digital Hold Management")
p("""The Digital Hold system is the platform's signature innovation, and its business impact is best
understood through the concrete efficiencies it introduces to day-to-day operations:""")
bullets([
    "<b>Demand-aware hold durations:</b> Standard pickup windows are automatically shortened on high-traffic game days and extended on quieter days — balancing convenience against inventory turnover without manual intervention.",
    "<b>Dedicated express lane:</b> A stadium-side pickup channel is automatically enabled only on active game days, giving in-stadium fans a fast lane precisely when foot traffic is highest, and quietly disabling it when it isn't needed.",
    "<b>Self-limiting demand:</b> A per-customer active hold cap prevents inventory from being tied up disproportionately by a small number of shoppers, protecting availability for the broader fan base.",
    "<b>Automatic lifecycle management:</b> Expired holds are automatically released back into sellable inventory on a recurring schedule, with no manual cleanup required from staff.",
    "<b>Proactive communication:</b> New holds and expirations can trigger real-time staff notifications, keeping the team ahead of fulfillment demand rather than reacting to it.",
])

# ---------------------------------------------------------------- 9. WORKFLOW OPTIMIZATION
h1("9. Workflow Optimization Across the Retail Value Chain")
p("""The platform's workflows are designed to reinforce one another across the full retail value
chain — customer service, inventory, fulfillment, and pickup — so that an action taken in one area
automatically keeps every other area correct and current.""")
bullets([
    "<b>Customer service:</b> A simple phone-number lookup gives any staff member instant access to a customer's active and past holds — no account, password, or escalation required to resolve a fan's question.",
    "<b>Inventory management:</b> Every hold, sale, return, and transfer writes to the same ledger, so inventory counts never drift out of sync between channels or locations.",
    "<b>Fulfillment:</b> Staff work from a single queue view with built-in urgency signals, partial-fulfillment support, and one-click resolution — reducing the time and judgment required per transaction.",
    "<b>In-store pickup:</b> A printable receipt/ticket and clear channel routing (Gate 5 vs. Stadium Queue) keep the physical handoff simple, fast, and consistent regardless of which staff member is on duty.",
])

# ---------------------------------------------------------------- 10. REPORTING & INSIGHTS
h1("10. Opportunities for Reporting, Planning &amp; Business Insight")
p("""Because every transaction — digital and in-person — flows through a single system, the platform
produces a rich, continuously updated data set that management can use to inform decisions well
beyond day-to-day operations:""")
bullets([
    "<b>Performance reporting:</b> Built-in dashboards summarize holds placed, pickup conversion, no-show rates, and revenue across configurable time periods, surfacing top-performing products at a glance.",
    "<b>Inventory planning:</b> Historical hold and sales patterns by product, size, and location support smarter purchasing and replenishment decisions ahead of future games and seasons.",
    "<b>Staffing insight:</b> Visibility into hold and queue volume by day and by game (versus non-game) days supports data-driven staffing allocation for the busiest fulfillment windows.",
    "<b>Customer sentiment:</b> Aggregated product reviews and engagement data (likes/favorites) provide a direct signal on which products and player-branded gear resonate most with fans.",
    "<b>Governance:</b> A complete, exportable audit trail of every system action supports compliance, loss-prevention review, and operational accountability at any level of the organization.",
])

# ---------------------------------------------------------------- 11. SCALABILITY
h1("11. Long-Term Scalability &amp; Future Expansion Opportunities")
p("""The platform's architecture — a multi-location inventory model, a role-based staff permission
system, and a point-of-sale integration layer — was built to grow with the organization rather than
be replaced by it. Opportunities for future expansion include:""")
bullets([
    "Extending the location model to additional stadium sections, satellite stores, or future venues without redesigning the underlying inventory system.",
    "Expanding the Popular Players merchandising model to broader promotional campaigns, team milestones, and limited-edition drops.",
    "Deepening business intelligence with predictive demand planning informed by game schedule, opponent, and historical hold conversion data.",
    "Extending point-of-sale integration to additional terminals, concessions-adjacent retail points, or partner venues while preserving one unified inventory source of truth.",
    "Enhancing fan engagement through expanded notification channels and loyalty-style recognition building on the existing favorites and reservation history data.",
])

# ---------------------------------------------------------------- 12. STRATEGIC VALUE
h1("12. Strategic Value &amp; Alignment with the Fan Experience")
p("""Ultimately, the platform's strategic value lies in how directly it supports the organization's
broader mission: delivering an exceptional, memorable fan experience around every home game. Retail
is one of the few touchpoints where a fan's satisfaction is decided in minutes, not hours — and a
smooth, confident shopping and pickup experience reinforces the same standard of excellence fans
expect from the ballpark experience itself.""")
p("""By reducing friction for fans, reducing manual burden for staff, and increasing visibility for
management, the platform strengthens the retail operation as a genuine extension of the game-day
experience — not a separate, disconnected transaction.""")

# ---------------------------------------------------------------- 13. CONCLUSION
h1("13. Conclusion: Innovation &amp; Operational Thinking Behind the Solution")
p("""The Jays Shop platform reflects a deliberate, business-first approach to retail technology. Rather
than simply digitizing a product catalog, the solution was engineered around the specific operational
realities of stadium retail: variable game-day demand, multiple physical pickup points, the need for
absolute inventory accuracy, and a fan base that values speed and certainty above all else.""")
p("""Its Digital Hold system — with demand-aware durations, section-specific eligibility rules, and
automatic lifecycle management — is a genuine piece of retail business logic, not a generic
e-commerce feature. Combined with unified inventory, integrated point-of-sale, role-based staff
tooling, and management-facing reporting, the platform stands as a forward-looking, well-reasoned
foundation for the organization's retail operations — one built to serve fans exceptionally well
today, and to scale confidently as the program grows.""")
story.append(Spacer(1, 18))
story.append(Paragraph("\u201cA smoother path from discovery to pickup, for every fan, on every game day.\u201d",
                        styles["Quote"]))

doc = SimpleDocTemplate(
    "/Users/idehenomoruyi/projects/jays-shop/docs/out/Jays-Shop-Business-Value-Report.pdf",
    pagesize=LETTER, topMargin=0.75 * inch, bottomMargin=0.75 * inch,
    leftMargin=0.9 * inch, rightMargin=0.9 * inch, title="Jays Shop — Business Value & Operational Impact")

def on_page(canvas, doc_):
    canvas.saveState()
    if doc_.page == 1:
        canvas.setFillColor(NAVY)
        canvas.rect(0, 0, LETTER[0], LETTER[1], fill=1, stroke=0)
    else:
        canvas.setFillColor(GREY)
        canvas.setFont("Helvetica", 8)
        canvas.drawString(0.9 * inch, 0.5 * inch, "Jays Shop — Business Value & Operational Impact")
        canvas.drawRightString(LETTER[0] - 0.9 * inch, 0.5 * inch, f"Page {doc_.page - 1}")
        canvas.setStrokeColor(colors.HexColor("#D8E0EC"))
        canvas.line(0.9 * inch, 0.62 * inch, LETTER[0] - 0.9 * inch, 0.62 * inch)
    canvas.restoreState()

doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
print("PDF built.")
