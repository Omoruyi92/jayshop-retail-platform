# -*- coding: utf-8 -*-
"""
Jays Shop — Platform User Manual (Task B)
Builds a step-by-step admin/staff user manual PDF with real screenshots
captured from the live production admin panel via Puppeteer.
Ground truth: docs/PLATFORM-CONTENT-SOURCE.md
"""
import os
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
                                 PageBreak, HRFlowable, ListFlowable, ListItem, KeepTogether,
                                 Image as RLImage)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.pdfgen import canvas as canvas_mod
from PIL import Image as PILImage

SHOTS = "/Users/idehenomoruyi/projects/jays-shop/docs/deliverables/screenshots"
OUT_PATH = "/Users/idehenomoruyi/projects/jays-shop/docs/deliverables/Platform-User-Manual.pdf"

NAVY = colors.HexColor("#14213D")
ROYAL = colors.HexColor("#134A8E")
RED = colors.HexColor("#C4141C")
ICE = colors.HexColor("#EAF1FB")
GREY = colors.HexColor("#5A6472")
LIGHT_GREY = colors.HexColor("#F4F6F9")
GOLD = colors.HexColor("#B8860B")
GREEN = colors.HexColor("#1E7A46")

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="CoverTitle", fontName="Helvetica-Bold", fontSize=27, leading=33,
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
styles.add(ParagraphStyle(name="StepP", parent=styles["Body"], leftIndent=0, spaceAfter=4))
styles.add(ParagraphStyle(name="Mono", fontName="Courier", fontSize=8.2, leading=11.5,
                           textColor=NAVY, backColor=LIGHT_GREY))
styles.add(ParagraphStyle(name="Quote", fontName="Helvetica-Oblique", fontSize=11.5, leading=17,
                           textColor=ROYAL, alignment=TA_CENTER, spaceBefore=8, spaceAfter=8))
styles.add(ParagraphStyle(name="Caption", fontName="Helvetica-Oblique", fontSize=8.4, leading=11,
                           textColor=GREY, alignment=TA_CENTER, spaceBefore=3, spaceAfter=10))
styles.add(ParagraphStyle(name="TOCH1", fontName="Helvetica-Bold", fontSize=10.6, leading=16,
                           textColor=NAVY, spaceBefore=4))
styles.add(ParagraphStyle(name="TOCH2", fontName="Helvetica", fontSize=9.4, leading=13.5,
                           textColor=GREY, leftIndent=14))
styles.add(ParagraphStyle(name="TinyCell", fontName="Helvetica", fontSize=8.1, leading=11,
                           textColor=colors.HexColor("#22262B")))
styles.add(ParagraphStyle(name="TinyCellBold", parent=styles["TinyCell"], fontName="Helvetica-Bold", textColor=NAVY))
styles.add(ParagraphStyle(name="Callout", fontName="Helvetica", fontSize=9.2, leading=13.4,
                           textColor=NAVY, backColor=ICE, borderPadding=8, spaceBefore=4, spaceAfter=8))
styles.add(ParagraphStyle(name="Warn", fontName="Helvetica", fontSize=9.2, leading=13.4,
                           textColor=colors.HexColor("#7A2E0E"), backColor=colors.HexColor("#FDEDE4"),
                           borderPadding=8, spaceBefore=4, spaceAfter=8))

story = []
PAGE_W = LETTER[0] - 2 * 0.85 * inch
SECTION_NO = [0]

# ------------------------------------------------------------------ helpers
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

def callout(text, warn=False):
    story.append(Paragraph(text, styles["Warn"] if warn else styles["Callout"]))

def bullets(items):
    story.append(ListFlowable(
        [ListItem(Paragraph(i, styles["BulletP"]), bulletColor=RED, value="square") for i in items],
        bulletType="bullet", start="square", leftIndent=13, bulletFontSize=5.5, spaceBefore=1, spaceAfter=7))

def steps(items):
    story.append(ListFlowable(
        [ListItem(Paragraph(i, styles["StepP"]), bulletColor=ROYAL) for i in items],
        bulletType="1", start=1, leftIndent=16, spaceBefore=1, spaceAfter=9))

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

def page_break():
    story.append(PageBreak())

SCREENSHOT_COUNT = [0]

def screenshot(filename, caption, max_h_inch=3.55, width_frac=1.0):
    """Embed a real captured screenshot with a caption, scaled to fit."""
    path = os.path.join(SHOTS, filename)
    if not os.path.exists(path):
        callout("[Screenshot not available: %s]" % filename, warn=True)
        return
    SCREENSHOT_COUNT[0] += 1
    with PILImage.open(path) as im:
        iw, ih = im.size
    target_w = PAGE_W * width_frac
    target_h = target_w * ih / iw
    max_h = max_h_inch * inch
    if target_h > max_h:
        target_h = max_h
        target_w = target_h * iw / ih
    img = RLImage(path, width=target_w, height=target_h)
    img.hAlign = "CENTER"
    frame = Table([[img]], colWidths=[PAGE_W])
    frame.setStyle(TableStyle([
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#C7D2E0")),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(KeepTogether([frame, Paragraph(
        "Figure %d — %s" % (SCREENSHOT_COUNT[0], caption), styles["Caption"])]))
    story.append(Spacer(1, 6))

# ================================================================== COVER
story.append(Spacer(1, 1.3 * inch))
story.append(Paragraph("JAYS SHOP", ParagraphStyle(name="Brand", fontName="Helvetica-Bold", fontSize=15,
                        textColor=colors.HexColor("#8FB3E8"), alignment=TA_CENTER, spaceAfter=4)))
story.append(Paragraph("Digital Retail &amp; In-Stadium Fulfillment Platform", styles["CoverSub"]))
story.append(Spacer(1, 20))
badge = Table([[Paragraph("USER MANUAL", styles["VBadge"])]], colWidths=[1.9 * inch], rowHeights=[0.34 * inch])
badge.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), RED), ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                            ("VALIGN", (0, 0), (-1, -1), "MIDDLE")]))
badge_wrap = Table([[badge]], colWidths=[PAGE_W])
badge_wrap.setStyle(TableStyle([("ALIGN", (0, 0), (-1, -1), "CENTER")]))
story.append(badge_wrap)
story.append(Spacer(1, 18))
story.append(Paragraph("PLATFORM USER MANUAL", styles["CoverTitle"]))
story.append(Spacer(1, 8))
story.append(Paragraph("A Step-by-Step Guide for Administrators &amp; Staff", styles["CoverSub"]))
story.append(Spacer(1, 14))
story.append(HRFlowable(width="20%", thickness=2, color=RED, hAlign="CENTER"))
story.append(Spacer(1, 14))
story.append(Paragraph("Product &amp; Inventory Management &middot; Holds &amp; Reservations &middot; Promotions<br/>"
                        "Reports &amp; Analytics &middot; Settings &middot; Troubleshooting &amp; Best Practices",
                        styles["CoverSub"]))
story.append(Spacer(1, 150))
story.append(Paragraph("Screenshots in this manual were captured live from the production admin panel<br/>"
                        "at jayshop-retail-platform.vercel.app",
                        ParagraphStyle(name="foot2", fontName="Helvetica-Oblique", fontSize=8.6,
                                       textColor=colors.HexColor("#8FB3E8"), alignment=TA_CENTER)))
story.append(Spacer(1, 8))
story.append(Paragraph("Prepared for Store Operations &amp; Staff Onboarding",
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

# ================================================================== 0. ABOUT
h1("About This Manual")
p("""This manual is the step-by-step operating guide for Jays Shop administrators and staff. It
walks through every major admin screen using real screenshots captured directly from the live
production system, and explains not just <i>where</i> to click but <i>why</i> the platform behaves
the way it does — including business rules (hold durations, hold limits, game-day overrides) and
the exact permissions each staff role has.""")
callout("""<b>Who this is for:</b> Store Owners, Managers, and Staff who use the Jays Shop admin
dashboard at <b>jayshop-retail-platform.vercel.app/admin</b> to manage products, inventory,
holds, promotions, and reporting.""")
p("""Every business rule, role permission, and workflow described here is grounded in the
platform's verified content-source reference (<i>PLATFORM-CONTENT-SOURCE.md</i>) — the single
factual source of truth for this documentation package — so the numbers and behaviors quoted
(hold durations, hold limits, role tiers, location counts) match exactly what the running system
enforces.""")

# ================================================================== 1. NAVIGATION OVERVIEW
h1("Navigation Overview")
p("""The admin dashboard is organized into a fixed left sidebar with sections grouped by
function: <b>Overview</b>, <b>Catalog</b>, <b>Operations</b>, <b>POS</b>, <b>Insights</b>,
<b>Community</b>, <b>Media</b>, and <b>Admin</b>. Every admin account sees the same sidebar
structure, but individual links are hidden or grayed out depending on the signed-in user's role.""")
screenshot("02-admin-dashboard.png",
           "The admin Dashboard — the landing page every signed-in staff member sees first, showing live active holds.")
h2("Sidebar Sections")
data_table(["Section", "Contains"], [
    ("Overview", "Dashboard — the landing page for all roles"),
    ("Catalog", "Products, Categories, Brands, Gallery, Styles, Players, Promotions"),
    ("Operations", "Holds, Hold Settings, Inventory History, Game Days"),
    ("POS", "POS Keys, POS Events, POS Simulator"),
    ("Insights", "Analytics, Reports, History, Audit Log"),
    ("Community", "Reviews, Style Submissions, Feedback, Notifications"),
    ("Media", "Hero Media"),
    ("Admin", "Admins (user management), Settings"),
], col_widths=[1.5*inch, PAGE_W-1.5*inch])

h2("Role-Based Visibility")
p("""Jays Shop enforces four role tiers, ordered from least to most privileged:
<b>VIEWER &lt; STAFF &lt; MANAGER &lt; OWNER</b>. Each role can do everything the tier below it
can do, plus additional actions. This is enforced centrally in the app's middleware for both
page routes and API routes — not scattered per-page checks — so permission behavior is
consistent everywhere.""")
data_table(["Role", "Can Do"], [
    ("VIEWER", "Read-only: Dashboard, Products (view), Analytics, Reports (view), History (view), "
               "Reviews (view), Feedback (view), Notifications (view)"),
    ("STAFF", "Everything VIEWER can, plus: resolve/release Holds, view Inventory History and POS Events, "
              "moderate Style Submissions and Reviews/Feedback"),
    ("MANAGER", "Everything STAFF can, plus: Hold Settings, Game Days, Categories, Brands, Gallery, Players, "
                "Promotions, Hero Media, Inventory Transfer, Product create/edit/delete, CSV export"),
    ("OWNER", "Everything MANAGER can, plus: Admins (user management), Settings, Audit Log, POS Keys, "
              "POS Simulator"),
], col_widths=[1.0*inch, PAGE_W-1.0*inch])
callout("""<b>Note:</b> Customers are never an authenticated role — there is no customer login.
A customer's identity for holds is simply their name and phone number, matched against a unique
phone key. This is a deliberate low-friction design: no payment, no account required.""")

page_break()

# ================================================================== 2. PRODUCT MANAGEMENT
h1("Product Management")
p("""The <b>Products</b> page (<i>Catalog &rarr; Products</i>) is where staff with MANAGER role
or above create, edit, archive, and delete catalog items. VIEWER and STAFF roles can see this
page but only in read-only mode.""")
screenshot("03-admin-products.png",
           "The Products list — search, category/brand filters, and per-row Edit / Inventory / Archive / Delete actions.")

h2("Adding a New Product")
steps([
    "Navigate to <b>Catalog &rarr; Products</b> in the sidebar.",
    "Click <b>+ Add Product</b> in the top-right corner.",
    "Fill in the required fields: <b>Name</b> and <b>Price (CAD)</b>. Optional fields include SKU, "
    "Description, Material, Care Instructions, Sale Price, Main Category, Subcategory, and Brand.",
    "Upload up to 3 product images.",
    "Set merchandising flags as needed (Featured, New Arrival, Best Seller, Clearance, etc.) and confirm "
    "<b>Hold Enabled</b> is on if this item should support the Digital Hold reservation flow.",
    "Save the product, then use the <b>Inventory</b> action on that row to assign per-size, per-location "
    "stock quantities (see Section 3, Inventory Management).",
])

h2("Editing a Product")
p("""Click <b>Edit</b> on any product row to open the Edit Product modal shown below. All fields
are editable except <b>Total Quantity</b>, which is auto-calculated from the sum of all
location-level inventories and can only be changed via the Inventory action, not directly.""")
screenshot("25-product-edit-modal.png",
           "Edit Product modal — Name, description, SKU, material, care instructions, pricing, and category fields.",
           width_frac=0.92)

h2("Deleting a Product — Recently Fixed Behavior")
p("""Deleting a product used to be able to fail with a raw database error if the product had ever
been part of a resolved (picked up or released) hold, because historical <i>Hold</i> records were
linked to the product with a non-cascading foreign key. This was fixed and verified against the
database before release. The current, correct behavior is:""")
bullets([
    "If a product has <b>no active holds</b> reserving it, deletion proceeds normally — the system safely "
    "clears any resolved (historical) hold references first, in a single transaction, before removing the "
    "product row.",
    "If a product <b>currently has a genuinely active hold</b> reserving stock, deletion is blocked with a "
    "clear error message rather than a confusing database failure — release or resolve the hold first, then "
    "delete the product.",
    "This is safe because the permanent hold-history record (used for reporting) does not reference the "
    "product row directly — it stores a snapshot of the product name, brand, price, and image at the time of "
    "resolution, so historical reporting is unaffected by a later product deletion.",
])
callout("""<b>Historical note:</b> Prior to this fix, staff could occasionally see a generic
"Failed to delete" error when removing an older product that had once been picked up or released
via a hold. If you ever see this error today, it means the product still has a currently active
hold against it — check the Holds page first (see Section 4).""")

page_break()

# ================================================================== 3. INVENTORY MANAGEMENT
h1("Inventory Management")
p("""Stock is tracked per product, per size, <b>per physical location</b> — not as a single
store-wide number. This is what allows the platform to guarantee that a hold placed against
Section 110 can never accidentally draw down stock that physically lives at Section 123 or any
other location.""")
screenshot("09-admin-analytics.png",
           "Inventory Analytics — live health across all 12 store/pickup locations, with low-stock and out-of-stock call-outs.")

h2("The 12 Store Locations")
p("""There are 12 predefined physical locations in the system. Only two of the twelve are actual
hold-fulfillment endpoints — <b>SEC-110</b> (the main store, standard Gate 5 pickup) and
<b>SEC-123</b> (the express Stadium Queue pickup, game days only). The remaining ten are physical
stock locations reachable through inter-location transfers.""")
data_table(["Code", "Role"], [
    ("SEC-110", "Main Store — standard Gate 5 hold pickup (isMainStore)"),
    ("SEC-123", "Stadium Queue — express game-day-only pickup (isPickupQueue)"),
    ("GATE-1, SEC-114, SEC-133, SEC-136, SEC-146, SEC-213, SEC-235, SEC-515, SEC-525, SEC-530",
     "Additional physical stock locations, reachable via admin inventory transfer"),
], col_widths=[2.0*inch, PAGE_W-2.0*inch])

h2("Transferring Stock Between Locations")
p("""The <b>Inventory History</b> page (<i>Operations &rarr; Inventory History</i>) is a
read-only, append-only ledger of every stock movement — transfers, adjustments, sales, returns,
hold reservations, and hold releases — each with a timestamp, actor, and a from/to location. The
inter-location <b>Transfer</b> tool lives on this same page (MANAGER role required to actually
execute a transfer; STAFF can view the ledger).""")
screenshot("06-admin-inventory-history.png",
           "Inventory History ledger — every stock movement type (assign, hold reserve, sale, transfer) is permanently logged.")
steps([
    "Go to <b>Operations &rarr; Inventory History</b>.",
    "Use the filters (Product, Location, date range, Type) to narrow the ledger if needed.",
    "Open the <b>Transfer</b> tool to move stock from one location to another — every transfer is logged "
    "with a signed quantity delta, the acting admin, and an optional note.",
])

h2("Self-Healing Store-Locations Logic")
p("""Earlier in the platform's history, a partially-seeded production database could leave one or
more of the 12 store locations missing, which surfaced in the admin UI as a confusingly
greyed-out checkbox on the Main Store control (caused by the HTML <i>disabled</i> attribute
visually greying out the whole control instead of only preventing it from being unchecked).""")
p("""This was fixed with a <b>self-healing upsert</b>: every time the relevant inventory or
store-locations data is read, the system automatically ensures all 12 predefined locations exist
in the database — idempotently, and without ever deleting or duplicating existing data. In
practice, this means admins never need to manually "repair" missing locations; the system
repairs itself on the next relevant page load.""")
callout("""<b>What this means for you:</b> if you ever previously saw a location missing from a
product's inventory-assignment screen, simply reloading the Products or Inventory page is enough
— the missing location will be automatically restored with zero data loss.""")

page_break()

# ================================================================== 4. HOLD & RESERVATION WORKFLOW
h1("Hold and Reservation Workflow")
p("""The <b>Digital Hold</b> is the signature feature of Jays Shop: a customer reserves a
specific product, size, and quantity against live inventory — with no payment and no account —
then shows a QR code / reservation code in-store to pick it up. Staff manage the entire lifecycle
from the <b>Holds</b> page.""")
screenshot("04-admin-holds.png",
           "All Holds queue — Active and Picked Up holds with reservation code, customer, size, total, and one-click Pick Up / Release actions.")

h2("Full Lifecycle")
h3("1. Customer Places a Hold (storefront)")
p("""On any in-stock product page, the customer selects a size and clicks <b>Hold This Item —
Free</b>. No payment or account is required.""")
screenshot("30-storefront-product-detail.png",
           "Storefront product page — size selection and the free Hold CTA, with the platform's stated hold rules "
           "(48-hour hold, up to 3 items at once, in-store pickup only).",
           max_h_inch=3.0)
bullets([
    "A customer may have <b>at most 3 simultaneous ACTIVE holds</b> at once — a 4th attempt is rejected.",
    "<b>Standard holds</b> (Gate 5 / Section 110) get an <b>extended 48-hour</b> duration when the admin "
    "toggle <i>Enable 48 Hour Hold</i> is on and it is <b>not</b> currently a game day; otherwise they fall "
    "back to the <b>standard duration</b> (default 3&ndash;4 hours, admin-configurable).",
    "<b>Stadium holds</b> (Section 123 express queue) <b>always</b> use the standard/shorter duration, "
    "regardless of the 48-hour toggle — this is intentionally an express pickup path.",
    "A stadium hold can <b>only</b> be placed on an actual registered game day — the system checks this "
    "server-side and rejects the request otherwise, no matter what the customer's device claims.",
])

h3("2. Hold Settings (admin-configurable duration rules)")
p("""Managers configure the exact hold-duration rules from <b>Operations &rarr; Hold Settings</b>.""")
screenshot("05-admin-hold-settings.png",
           "Hold Settings — Standard Hold Hours, Extended Hold Hours, and the 48-hour toggle, with an explicit "
           "game-day override note.")
data_table(["Setting", "Default", "Behavior"], [
    ("Standard Hold Hours", "3 hours", "Used on game days, or whenever the 48-hour toggle is off"),
    ("Extended Hold Hours", "48 hours", "Used when the toggle is on AND today is not a registered game day"),
    ("Enable 48 Hour Hold", "On/Off toggle", "Master switch for offering the extended duration at all"),
], col_widths=[1.5*inch, 1.0*inch, PAGE_W-2.5*inch])
callout("""<b>Game-day override:</b> on any date registered in Game Days, the extended hold
duration is automatically disabled for the entire day and every new hold uses the standard,
shorter duration — regardless of the 48-hour toggle setting. This prevents long holds from
tying up inventory during high-demand game-day traffic.""")

h3("3. Game Days Calendar")
p("""The <b>Game Days</b> page drives two business rules at once: it disables the extended
48-hour duration on those dates, and it is the only condition under which a Section 123 Stadium
hold is allowed to be placed.""")
screenshot("07-admin-game-days.png",
           "Game Days calendar — add a home game date, first pitch time, and opponent; upcoming games list below.")
steps([
    "Go to <b>Operations &rarr; Game Days</b>.",
    "Enter the game <b>Date</b> and (optionally) <b>First Pitch</b> time, <b>Opponent</b>, and a <b>Note</b>.",
    "Click <b>Add Game Day</b>. The date immediately takes effect for both the hold-duration override and "
    "Stadium Queue eligibility.",
])

h3("4. In-Store Scan / Resolution")
p("""When a customer arrives with their reservation code or QR code, staff resolve the hold from
the <b>Holds</b> page. Three outcomes are supported, plus partial fulfillment:""")
data_table(["Outcome", "What Happens"], [
    ("Picked Up (full)", "The entire held quantity moves from reserved to sold. A permanent history "
                          "snapshot and a sales record are both written; this counts toward revenue reporting."),
    ("Partial pickup", "Only some of the held quantity is fulfilled now. The fulfilled part is sold; a "
                        "NEW active hold is automatically created for the remaining quantity, keeping the "
                        "customer's original expiry time — they don't lose their remaining reserved stock."),
    ("Release", "Staff or customer cancels the hold (or a no-show is manually released). The entire held "
                "quantity returns to available stock immediately; no sale is recorded."),
    ("Expired (automatic)", "Same effect as Release, but triggered automatically by the system once the "
                             "hold's expiry time passes — no staff action required."),
], col_widths=[1.3*inch, PAGE_W-1.3*inch])
steps([
    "Go to <b>Operations &rarr; Holds</b>.",
    "Find the customer's hold by reservation code or phone number using the filters at the top.",
    "Click <b>Pick Up</b> to fully fulfill the hold, or use the <b>Release</b> button to cancel it and "
    "return stock to available inventory.",
])

h3("5. Automatic Expiration")
p("""Expired holds are cleared two ways: <b>instantly</b>, any time a new hold is placed the system "
first releases any of that customer's overdue holds so stale reservations never block new ones; and as a
<b>daily scheduled backstop</b> that runs once a day to catch anything not touched by the instant check.
Either way, staff never need to manually expire a hold — it happens automatically.""")

h3("6. Full Audit Trail")
p("""Every hold-lifecycle event writes to three separate permanent records for full traceability:
the <b>Inventory Transaction</b> ledger (stock movement), the permanent <b>Hold History</b>
snapshot (survives even product deletion), and the general <b>Audit Log</b>. Fulfilled holds
additionally write a Sales History record used for revenue reporting.""")
screenshot("11-admin-history.png",
           "Hold History — a permanent, immutable snapshot of every completed hold, including holds whose original "
           "product may have since been deleted.")

page_break()

# ================================================================== 5. PROMOTIONS
h1("Promotions")
p("""Approved promotions scroll in the customer-facing header announcement banner on the
storefront. MANAGER role or above is required to create, edit, or approve promotions.""")
screenshot("08-admin-promotions.png",
           "Promotions list — message, link, priority, approval status, and active schedule window.")
steps([
    "Go to <b>Catalog &rarr; Promotions</b>.",
    "Click <b>+ Add Promotion</b> and enter the banner message text, an optional link, a priority "
    "(lower numbers surface first), and a schedule start/end date.",
    "Save, then approve the promotion so it becomes eligible to display — only <b>Approved</b> promotions "
    "actually appear in the storefront banner.",
    "Use <b>Edit</b>, <b>Archive</b>, or <b>Delete</b> on any existing row to manage the list.",
])
p("""On the storefront, the approved promotion appears as a scrolling banner at the very top of
the page, above the main navigation, as shown below.""")
screenshot("29-storefront-my-holds.png",
           "The storefront header showing an approved promotion banner in production ('Blue Jays Transformers Day...').",
           max_h_inch=1.7)

page_break()

# ================================================================== 6. REPORTS AND ANALYTICS
h1("Reports and Analytics")
p("""Two complementary pages give visibility into store performance: <b>Analytics</b> for live
inventory health, and <b>Reports</b> for hold/sales performance metrics over time.""")
h2("Analytics — Live Inventory Health")
p("""Available to VIEWER role and above, showing total inventory units, total products, active
locations, active holds, and a per-location health breakdown with low-stock and out-of-stock
call-outs.""")
screenshot("09-admin-analytics.png",
           "Inventory Analytics — total units, active holds, and a health card for each of the 12 locations.")

h2("Reports — Hold & Sales Performance")
p("""Available to VIEWER role and above (CSV export requires MANAGER role). Shows total holds,
picked-up conversion rate, no-show rate, revenue in the selected period, a weekly revenue chart,
and top-held / top-sold item rankings.""")
screenshot("10-admin-reports.png",
           "Reports — 7/30/90-day toggle, conversion and no-show metrics, weekly revenue chart, and CSV export.")
steps([
    "Go to <b>Insights &rarr; Reports</b>.",
    "Choose a reporting window: 7, 30, or 90 days.",
    "Review Total Holds, Picked Up conversion rate, No-Shows, and Revenue at the top.",
    "Use <b>Export CSV</b> (MANAGER role required) to download the underlying data for offline analysis.",
])

h2("Hold History — Resolved-Hold Browser")
p("""A permanent, filterable record of every completed hold (picked up, released, or expired),
independent of whether the original product still exists in the catalog.""")
screenshot("11-admin-history.png",
           "Hold History — filter by date range, status, phone, or product; every row is a permanent snapshot.")

h2("Audit Log — OWNER Only")
p("""A complete, append-only record of every sensitive administrative action across the entire
system — product edits, admin role changes, POS key revocations, hold resolutions, and more —
each with a timestamp, action name, affected entity, and acting admin. Only OWNER-role accounts
can view this page.""")
screenshot("16-admin-audit-log.png",
           "Audit Log — every administrative action across the platform, with expandable Before/After and Payload detail.")

page_break()

# ================================================================== 7. SETTINGS AND ACCOUNT MANAGEMENT
h1("Settings and Account Management")
p("""Two pages govern staff access: <b>Admins</b>, for managing who has access and at what role,
and <b>Settings</b>, for each signed-in admin to manage their own password. Both pages require
the OWNER role to access at all (though any authenticated admin can change their own password
from the Settings page once there).""")

h2("Managing Staff Accounts")
screenshot("15-admin-admins.png",
           "Admins page — every staff account with an editable Role dropdown and revoke/reset actions.")
steps([
    "Go to <b>Admin &rarr; Admins</b> (OWNER role required).",
    "Click <b>+ Add Admin</b> to invite a new staff account, or use the <b>Role</b> dropdown on an "
    "existing row to change a staff member's permission tier (VIEWER / STAFF / MANAGER / OWNER).",
    "Use the key icon to reset a staff member's password, or the trash icon to remove their account entirely.",
])

h2("Changing Your Own Password")
screenshot("14-admin-settings.png",
           "Settings — Change Password form with strength requirements and session-security notes.")
steps([
    "Go to <b>Admin &rarr; Settings</b>.",
    "Enter your <b>Current Password</b>, then a <b>New Password</b> (minimum 8 characters, with an "
    "uppercase letter, lowercase letter, number, and special character) and confirm it.",
    "Click <b>Update Password</b>.",
])
callout("""<b>Session note:</b> Admin sessions last up to 8 hours before requiring sign-in again.
After a password change, any other already-active sessions remain valid until they naturally
expire or you sign out — changing your password does not immediately force-close other sessions.""")

page_break()

# ================================================================== 8. COMMON WORKFLOWS
h1("Common Workflows")

h2("Workflow A — Onboarding a New Product End to End")
steps([
    "<b>Create the product:</b> Go to Products &rarr; + Add Product. Enter name, price, description, "
    "category/brand, and upload images.",
    "<b>Assign inventory:</b> On the new product's row, click <b>Inventory</b> and assign starting stock "
    "quantities to whichever of the 12 locations should carry it (at minimum, the Main Store / SEC-110 for "
    "standard hold pickup).",
    "<b>Confirm hold eligibility:</b> Make sure <b>Hold Enabled</b> is on if customers should be able to "
    "reserve this item (it is on by default).",
    "<b>Set merchandising flags:</b> Toggle Featured / New Arrival / Best Seller flags as appropriate so the "
    "item surfaces correctly on the storefront home and category pages.",
    "<b>Verify on the storefront:</b> Open the public Shop page and confirm the product appears, shows the "
    "correct price and stock, and that the Hold button works end to end.",
])

h2("Workflow B — Processing a Customer Hold Pickup")
steps([
    "Ask the customer for their <b>reservation code</b> or have them show their QR code.",
    "Go to <b>Operations &rarr; Holds</b> and search by reservation code or phone number.",
    "Confirm the item(s), size, and quantity match what the customer has with them.",
    "If the customer is taking everything they reserved, click <b>Pick Up</b> — this records the sale and "
    "writes a permanent history snapshot.",
    "If the customer only wants part of the hold, use the partial-pickup option — the fulfilled portion is "
    "sold and a new hold automatically covers the rest, on the same expiry as before.",
    "If the customer is not taking the item at all (cancellation), use <b>Release</b> instead — stock "
    "returns to available inventory immediately.",
])

h2("Workflow C — Running a Game-Day Promotion")
steps([
    "Confirm the date is registered on the <b>Game Days</b> calendar (Operations &rarr; Game Days) — this "
    "automatically disables extended 48-hour holds and enables Stadium Queue (Section 123) eligibility for "
    "that date.",
    "Create and approve a promotion banner (Catalog &rarr; Promotions) scheduled to start on or before the "
    "game date.",
    "Monitor the Holds queue and Analytics page throughout the game for real-time demand and stock health.",
])

page_break()

# ================================================================== 9. TROUBLESHOOTING
h1("Troubleshooting")
p("""The items below are real, fixed issues from the platform's engineering history, framed here
as helpful historical context — if you ever encounter similar symptoms, they should already be
resolved in the current version, but knowing the story helps you recognize what to check.""")

h2("\u201cFailed to delete\u201d when removing a product (RESOLVED)")
p("""<b>Symptom (historical):</b> deleting an older product that had once been part of a
completed hold could throw a generic database error instead of deleting cleanly.""")
p("""<b>Root cause:</b> a database-level relationship prevented deleting a product while any
historical hold record — even a long-resolved one — still referenced it.""")
p("""<b>Current behavior:</b> this is fixed. Deletion now succeeds normally for products whose
holds are all resolved, and only blocks deletion (with a clear, specific error message) when a
<i>genuinely active</i> hold is still reserving stock against that product. If you see a
deletion blocked today, check the Holds page — there is an active hold you need to resolve or
release first.""")

h2("A store location appears to be missing (RESOLVED)")
p("""<b>Symptom (historical):</b> the Main Store checkbox on a product's inventory-assignment "
screen could appear visually greyed out, or a location might seem to be missing from the list
entirely, on a partially-seeded database.""")
p("""<b>Current behavior:</b> the system self-heals — all 12 predefined store locations are
automatically restored (idempotently, with zero data loss) the next time the relevant page loads.
Simply refresh the Products or Inventory page if a location ever appears to be missing.""")

h2("Admin dropdown (notifications / favorites / cart) appears cut off (RESOLVED)")
p("""<b>Symptom (historical):</b> on narrow mobile screens, the notification, favorites, or cart
dropdown panel could render partially off-screen.""")
p("""<b>Current behavior:</b> dropdown panels now measure the real screen position and are
clamped with a safety margin so they can never overflow either edge of the screen, verified across
common mobile and tablet widths.""")

h2("General troubleshooting checklist")
bullets([
    "<b>Can't see a page or button you expect:</b> check your assigned role first (Settings/Admins page, or "
    "ask an OWNER) — many admin features are gated by role, not a bug.",
    "<b>A hold seems 'stuck' as active past its expiry:</b> refresh the page — expired holds are cleared "
    "automatically the moment any new hold-related action runs, and by a daily scheduled sweep as a backstop.",
    "<b>Inventory numbers look wrong at one location:</b> check the Inventory History ledger for that "
    "product — every stock movement is permanently logged with a timestamp and actor, making it possible to "
    "trace exactly what happened.",
    "<b>A customer says their hold disappeared:</b> look them up by phone number on the Hold History page — "
    "even resolved/expired holds remain permanently visible there.",
])

page_break()

# ================================================================== 10. BEST PRACTICES
h1("Best Practices")
bullets([
    "<b>Assign the least-privileged role that gets the job done.</b> Most day-to-day staff only need STAFF "
    "(resolve/release holds); reserve MANAGER and OWNER for people who actually need catalog, settings, or "
    "user-management access.",
    "<b>Always resolve holds through the Holds page</b>, not by deleting products — this keeps the audit "
    "trail, revenue reporting, and customer history accurate.",
    "<b>Register game days ahead of time</b> in the Game Days calendar so the correct hold-duration rules and "
    "Stadium Queue eligibility are automatically in effect on the day itself.",
    "<b>Review the Analytics low-stock / out-of-stock panels regularly</b>, especially before high-traffic "
    "game days, and use inter-location transfers proactively rather than reactively.",
    "<b>Use partial pickup instead of forcing an all-or-nothing resolution</b> when a customer only wants "
    "some of what they held — it preserves their remaining reservation and original expiry automatically.",
    "<b>Approve promotions only when they're ready to go live</b> — unapproved promotions never appear on "
    "the storefront banner, so there's no risk in drafting them ahead of time.",
    "<b>Change your password periodically</b> from the Settings page, and remember that existing sessions "
    "elsewhere remain active until they expire — sign out of shared devices explicitly when done.",
    "<b>When in doubt about an unexpected error, check Inventory History or the Audit Log first</b> — the "
    "platform's append-only ledgers usually make the root cause visible immediately, without needing to "
    "guess.",
])
story.append(Paragraph("\u201cA connected retail platform where every browse, reservation, and pickup "
                        "reflects the same standard of excellence fans expect on game day.\u201d", styles["Quote"]))

print("ALL SECTIONS READY:", len(story), "flowables;", SCREENSHOT_COUNT[0], "screenshots embedded")

# ================================================================== DOC BUILD (TOC + bookmarks + footer)
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
    canvas_obj.drawString(0.85 * inch, 0.55 * inch, "Jays Shop \u2014 Platform User Manual")
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
    OUT_PATH,
    pagesize=LETTER,
    topMargin=0.75 * inch, bottomMargin=0.85 * inch,
    leftMargin=0.85 * inch, rightMargin=0.85 * inch,
    title="Jays Shop - Platform User Manual",
    author="Jays Shop Operations",
)

def first_page(c, d):
    if d.page == 1:
        on_cover(c, d)
    else:
        on_page(c, d)

doc.multiBuild(story, onFirstPage=first_page, onLaterPages=on_page)
print("PDF WRITTEN:", OUT_PATH)
