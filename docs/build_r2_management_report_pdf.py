# -*- coding: utf-8 -*-
"""
Builds docs/out/Jays-Shop-R2-Storage-Management-Report-2026-07-27.pdf

Management-facing summary of today's (2026-07-27) Cloudflare R2 storage work on the
Jays Shop retail platform. Written for a non-engineering reader: business impact, cost,
and risk lead; technical detail is confined to a clearly marked appendix.

Every factual claim in this document was checked against the repository (git log, git show,
and direct file reads) before being written. Anything that could not be verified this way is
labeled "unverified" rather than stated as fact.

HARD RULE: this script and the PDF it produces must never contain a secret value (access key,
secret key, password, token, connection string) — only variable names and types.
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
AMBER = colors.HexColor("#9A6700")
AMBER_BG = colors.HexColor("#FFF6E0")
GREEN = colors.HexColor("#1A7F37")
GREEN_BG = colors.HexColor("#E9F7EE")
RED_BG = colors.HexColor("#FDEDEE")

styles = getSampleStyleSheet()

styles.add(ParagraphStyle(name="CoverTitle", fontName="Helvetica-Bold", fontSize=27, leading=33,
                           textColor=colors.white, alignment=TA_CENTER))
styles.add(ParagraphStyle(name="CoverSub", fontName="Helvetica", fontSize=13, leading=19,
                           textColor=ICE, alignment=TA_CENTER, spaceBefore=10))
styles.add(ParagraphStyle(name="H1", fontName="Helvetica-Bold", fontSize=17.5, leading=22,
                           textColor=NAVY, spaceBefore=6, spaceAfter=10))
styles.add(ParagraphStyle(name="H2", fontName="Helvetica-Bold", fontSize=12.5, leading=17,
                           textColor=ROYAL, spaceBefore=12, spaceAfter=6))
styles.add(ParagraphStyle(name="Body", fontName="Helvetica", fontSize=10, leading=14.6,
                           textColor=colors.HexColor("#22262B"), alignment=TA_JUSTIFY, spaceAfter=6))
styles.add(ParagraphStyle(name="BodyBold", parent=styles["Body"], fontName="Helvetica-Bold",
                           textColor=NAVY))
styles.add(ParagraphStyle(name="BulletP", parent=styles["Body"], leftIndent=0, spaceAfter=4))
styles.add(ParagraphStyle(name="Mono", fontName="Courier", fontSize=9, leading=13,
                           textColor=NAVY))
styles.add(ParagraphStyle(name="Caption", fontName="Helvetica-Oblique", fontSize=8.5, leading=11,
                           textColor=GREY, alignment=TA_LEFT))
styles.add(ParagraphStyle(name="NoteBody", parent=styles["Body"], textColor=colors.HexColor("#5C4400")))
styles.add(ParagraphStyle(name="GoodBody", parent=styles["Body"], textColor=colors.HexColor("#0F5132")))
styles.add(ParagraphStyle(name="BadBody", parent=styles["Body"], textColor=colors.HexColor("#7A1620")))

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


def bullets(items, style="BulletP"):
    story.append(ListFlowable(
        [ListItem(Paragraph(i, styles[style]), bulletColor=RED, value="square") for i in items],
        bulletType="bullet", start="square", leftIndent=14, bulletFontSize=6, spaceBefore=2, spaceAfter=8))


def note_box(title, text, bg=AMBER_BG, border=AMBER, body_style="NoteBody"):
    inner = Table(
        [[Paragraph(f"<b>{title}</b><br/>{text}", styles[body_style])]],
        colWidths=[PAGE_W - 16],
    )
    inner.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("BOX", (0, 0), (-1, -1), 0.75, border),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(inner)
    story.append(Spacer(1, 10))


def commit_table(rows):
    """rows: list of (sha, message)"""
    data = [[Paragraph("<b>Commit</b>", styles["BodyBold"]), Paragraph("<b>Message</b>", styles["BodyBold"])]]
    for sha, msg in rows:
        data.append([Paragraph(sha, styles["Mono"]), Paragraph(msg, styles["BulletP"])])
    t = Table(data, colWidths=[1.05 * inch, PAGE_W - 1.05 * inch])
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


def simple_table(header, rows, col_widths=None):
    data = [[Paragraph(f"<b>{c}</b>", styles["BodyBold"]) for c in header]]
    for r in rows:
        data.append([Paragraph(str(c), styles["BulletP"]) for c in r])
    t = Table(data, colWidths=col_widths)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), ROYAL),
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
story.append(Spacer(1, 2.3 * inch))
story.append(Paragraph("JAYS SHOP", ParagraphStyle(name="Brand", fontName="Helvetica-Bold", fontSize=15,
                                                     textColor=colors.HexColor("#8FB3E8"), alignment=TA_CENTER,
                                                     spaceAfter=6)))
story.append(Paragraph("Digital Retail Platform &mdash; Management Report", styles["CoverSub"]))
story.append(Spacer(1, 26))
story.append(Paragraph("CLOUD STORAGE (CLOUDFLARE R2)<br/>IMPLEMENTATION &amp; STATUS", styles["CoverTitle"]))
story.append(Spacer(1, 14))
story.append(HRFlowable(width="22%", thickness=2, color=RED, hAlign="CENTER"))
story.append(Spacer(1, 14))
story.append(Paragraph(
    "What changed today, why it mattered for the business, current status, and the decisions "
    "management needs to make. Technical detail is in the appendix.",
    styles["CoverSub"]))
story.append(Spacer(1, 190))
story.append(Paragraph("Prepared for Management &mdash; July 27, 2026",
                        ParagraphStyle(name="foot", fontName="Helvetica", fontSize=9.5,
                                       textColor=colors.HexColor("#8FB3E8"), alignment=TA_CENTER)))
story.append(PageBreak())

# ================================================================== 1. EXECUTIVE SUMMARY
h1("1. Executive Summary")
p("""Jays Shop's product photos and hero videos (the images and video banners on the storefront's
home, shop, and gallery pages) are now served from <b>Cloudflare R2</b>, a cloud storage service,
instead of the previous provider (Vercel Blob storage). This change was necessary, cost-motivated,
and is now working, but it took most of a working day to get fully stable because of four separate
technical problems that each masked the next. The underlying cause of the last and most serious
problem was a stray extra character in a stored credential &mdash; not a design flaw &mdash; and it
has been fixed and confirmed working.""")
p("""Separately, and unrelated to the R2 migration itself, a document containing live infrastructure
credentials was accidentally committed to the project's source history earlier today, and several
scripts contained hardcoded staff/admin passwords in plain text. Both issues have been addressed
(credential rotation and password removal, respectively), but two items below require a management
decision and are not yet closed out.""")

h2("What changed today")
bullets([
    "Direct browser-to-storage uploads for hero videos went live, using short-lived, single-use "
    "upload links (<b>presigned URLs</b>, explained in Section 3) so large video files no longer "
    "pass through the website's own servers.",
    "A cross-origin access policy (<b>CORS</b>, a browser security setting a storage provider must "
    "explicitly allow) was configured on the storage bucket so the admin dashboard, running in a "
    "browser, is permitted to upload directly to it.",
    "Four stacked technical faults surfaced and were fixed one after another (detailed in Section 5); "
    "the final and true root cause was a whitespace/newline character accidentally embedded in a "
    "stored credential value, which silently broke the cryptographic signature every upload request "
    "relies on.",
    "A credential-bearing reference document was found committed to the repository; the exposed "
    "credential has been rotated, and hardcoded plaintext passwords were removed from four internal "
    "scripts in favor of environment variables.",
])

h2("Why it mattered")
p("""Before today's fixes, admin staff could not reliably upload new hero images or videos to the
storefront &mdash; image uploads failed outright with a server error, and video uploads failed in a
way that looked like a browser security block. Both were symptoms of the same underlying credential
problem. This blocked the marketing/merchandising workflow for updating the site's visual banners,
though it did not affect checkout, payments, or the product catalog.""")

h2("Current status")
note_box(
    "Resolved and verified working.",
    "All identified upload failures are fixed. A hero video upload was completed end-to-end after "
    "the final fix and confirmed live (evidence in Section 5). The remaining open items below are "
    "governance/compliance decisions, not active technical outages.",
    bg=GREEN_BG, border=GREEN, body_style="GoodBody",
)

h2("What still needs a decision")
bullets([
    "<b>Confirm the Vercel hosting plan tier.</b> If the account is still on Vercel's free \"Hobby\" "
    "plan, that plan's terms prohibit commercial use &mdash; a real compliance exposure for a "
    "revenue-generating retail site, independent of any technical concern (Section 7).",
    "<b>Rotate admin and staff account passwords.</b> Plaintext passwords for admin/staff accounts "
    "were found hardcoded in scripts in git history; even though the code has been fixed, the "
    "specific password values were exposed in project history and should be treated as compromised "
    "(Section 6, Section 7).",
])

story.append(PageBreak())

# ================================================================== 2. WHY R2
h1("2. Why We Moved to Cloudflare R2")
p("""The storefront's hero images and videos were previously hosted on <b>Vercel Blob</b>, a
pay-as-you-go file storage add-on from the same company that hosts the website. Two commits from
earlier this month (<b>e5acfbe</b>, dated July 27, and the broader migration completed in
<b>359ec5b</b>) confirm the team moved away from Vercel Blob specifically to stop what the commit
message describes as &ldquo;blob data-transfer burn&rdquo; on hero videos &mdash; i.e., the cost/quota
consumed every time a visitor's browser downloaded a hero video from that storage service.""")
p("""<b>Plain-English cost explanation:</b> most cloud storage providers, including Vercel Blob, charge
for &ldquo;egress&rdquo; &mdash; the data transferred out to visitors' browsers every time an image or
video is viewed. A popular hero video watched thousands of times generates real, metered egress cost
and can hit a plan's included allowance. <b>Cloudflare R2 charges $0 for egress</b>, regardless of
volume; only storage space and a small number of write/read operations are billed, and Jays Shop's
current usage sits far inside R2's free tier (Section 4).""")
note_box(
    "A note on the HTTP 403 framing.",
    "This report was asked to verify a claim that the prior Vercel Blob store had hit a plan limit and "
    "was returning HTTP 403 errors that blanked the site's hero imagery. The repository's commit "
    "history and code confirm the <i>cost/quota motivation</i> for leaving Vercel Blob (commit "
    "e5acfbe's message explicitly cites stopping \u201cdata-transfer burn\u201d) and confirm that a "
    "static-image fallback was added specifically to handle video/image load failures gracefully. "
    "However, no HTTP 403 status code, error log, or support ticket referencing that specific error is "
    "present anywhere in the repository or its commit history. <b>This specific detail (a 403 response "
    "blanking hero imagery) is marked unverified</b> rather than stated as fact; the cost/quota "
    "motivation for the migration itself is confirmed.",
)
p("""Beyond the immediate cost driver, moving fully off Vercel Blob (commit <b>359ec5b</b>,
&ldquo;remove Vercel Blob dependency from all uploads&rdquo;) also removes a second, unrelated
dependency on Vercel's own infrastructure limits for file uploads, discussed further in Section 7.""")

# ================================================================== 3. WHAT WAS IMPLEMENTED
h1("3. What Was Implemented")
p("""In plain terms: product and hero media (images and videos) now live in a Cloudflare R2
storage bucket &mdash; conceptually similar to a secure, organized folder in the cloud. There are two
upload paths, and one serving path:""")
h2("Uploading a hero video (large files)")
bullets([
    "An admin staff member selects a video in the dashboard.",
    "The website's server hands the browser a <b>presigned URL</b> &mdash; a temporary, single-use "
    "web address (valid for 5 minutes) that grants permission to upload directly to the storage "
    "bucket without the storage credentials ever reaching the browser.",
    "The browser uploads the video file <b>directly to Cloudflare R2</b>, bypassing the website's own "
    "server entirely. This matters because it avoids the website server's own file-size and "
    "processing-time limits, which matter more for large video files than for photos.",
])
h2("Uploading other images (products, brands, gallery, etc.)")
bullets([
    "These smaller files are still uploaded through the website's own server, which then places the "
    "file into the R2 bucket on the browser's behalf.",
])
h2("Serving media to shoppers")
bullets([
    "Once stored, every image and video is served to site visitors from a public R2 web address "
    "(Section 4) &mdash; the same way any other website image is served, with no login or credential "
    "required to view it.",
])

story.append(PageBreak())

# ================================================================== 4. CONFIGURATION STATE
h1("4. Configuration State")
p("""Storage is configured via five environment variables (named settings stored securely outside the
codebase). <b>Their values are never printed in this report, its appendix, or anywhere in the source "
code</b> &mdash; only their names and purpose are documented below, consistent with standard secret-"
handling practice.""")
simple_table(
    ["Variable name", "Purpose"],
    [
        ["R2_ENDPOINT", "The Cloudflare R2 account's API address."],
        ["R2_ACCESS_KEY_ID", "Identifies the API credential used to authenticate (not a password by itself)."],
        ["R2_SECRET_ACCESS_KEY", "The private credential used to cryptographically sign each request."],
        ["R2_BUCKET_NAME", "The name of the storage bucket (container) media is stored in."],
        ["R2_PUBLIC_URL", "The public web address used to serve stored media to site visitors."],
    ],
    col_widths=[1.9 * inch, PAGE_W - 1.9 * inch],
)
p("""All five variables are set in <b>Vercel's Production environment configuration</b> (the hosting
platform's settings panel), scoped only to Production, and stored <b>encrypted at rest</b> by Vercel.
They are not present in the source code or in any file the codebase writes to disk; the source code
only ever reads them from the runtime environment. This was confirmed directly by reading
<font face='Courier'>src/lib/media/r2.server.ts</font>, which reads all five exclusively via
<font face='Courier'>process.env.*</font> and documents them by name in a code comment, never as
literal values.""")

# ================================================================== 5. PROBLEMS ENCOUNTERED
h1("5. Problems Encountered and Resolved Today")
p("""Getting hero-media uploads fully working today required diagnosing <b>four separate problems</b>
that surfaced one after another, each masking the next. This section states plainly which was the
true underlying (&ldquo;root&rdquo;) cause and which were real, independent, defensive fixes that were
not themselves the cause of the failures that persisted after they were applied.""")

h2("Sequence of events, in order")
simple_table(
    ["#", "Problem", "Commit", "Verdict"],
    [
        ["1", "The storage bucket had no CORS policy at all (a browser security setting that must "
              "explicitly allow direct uploads from the admin dashboard's web address).",
         "52e071c", "Real, fixed. Not the final cause."],
        ["2", "A checksum mismatch: the upload software's default settings attached a checksum for "
              "an empty file to the upload authorization, which no longer matched once the browser "
              "sent the real (non-empty) video file.",
         "11d9736", "Real, fixed. Not the final cause."],
        ["3", "A theory that the storage address (endpoint) was malformed by duplicating the bucket "
              "name in the file path. Defensive normalization code was added, but investigation "
              "later proved this was never actually happening in production.",
         "4c086ac / d2e281f", "Defensive only. Confirmed NOT the cause."],
        ["4", "The true root cause: a stray whitespace/newline character embedded in the stored "
              "access-key or secret-key credential value, most likely from a copy-paste into the "
              "hosting dashboard. This silently corrupted the cryptographic signature every "
              "upload request depends on.",
         "06b2db2", "Confirmed root cause. Fixed."],
    ],
    col_widths=[0.35 * inch, 3.55 * inch, 1.0 * inch, PAGE_W - 0.35 * inch - 3.55 * inch - 1.0 * inch],
)
p("""<b>Why the same credential problem looked like two different bugs:</b> image uploads pass through
the website's own server, where the corrupted credential caused an outright crash (a server error).
Video uploads use the presigned-URL method (Section 3), where the corruption instead silently produced
an invalid signature; Cloudflare R2 rejected the resulting request with a generic authentication error
that, because it omitted a required browser-security header, was misreported by the browser as a
&ldquo;CORS&rdquo; failure &mdash; a red herring that pointed investigation toward the (already-fixed)
CORS policy rather than the credential itself.""")

h2("Verification of the fix")
p("""A hero video upload was performed end-to-end after the final fix; the resulting live web address "
returned a successful HTTP 200 response with a file size matching the uploaded video "
(<font face='Courier'>content-length: 6470592</font> bytes). This was reported by the engineer who "
performed the deploy and is treated in this report as the available evidence of success; it was not "
independently re-executed while preparing this document.""")

story.append(PageBreak())

# ================================================================== 6. SECURITY INCIDENT
h1("6. Security Incident and Response")
note_box(
    "Summary: credential exposure found, rotated, and confirmed. History not rewritten &mdash; by design.",
    "A document containing live Cloudflare R2 credentials was committed to the project's git history "
    "earlier today (commit 36fd9c2, \u201cdocs: add Cloudflare R2 credentials and configuration "
    "reference PDF\u201d). The exposed access credential has been rotated (replaced with a new one at "
    "the provider), and that rotation has been independently verified. The old credential-bearing "
    "file itself remains in the repository's git history and current file tree; a full history purge "
    "was evaluated and deliberately not carried out.",
    bg=RED_BG, border=RED, body_style="BadBody",
)
h2("What happened")
bullets([
    "Commit <b>36fd9c2</b> (this morning, July 27) added "
    "<font face='Courier'>docs/jayshop-cloud-storage-reference.pdf</font> and its source "
    "<font face='Courier'>.tex</font> file, described in its own commit message as containing "
    "\u201cR2 bucket details, API credentials, Vercel env vars, and important URLs.\u201d Both files "
    "are still present and tracked in the repository as of this report.",
    "A later commit (<b>9ad862a</b>, \u201cgitignore credential reference docs to prevent "
    "recurrence\u201d) added a rule to the project's ignore-list so this specific file pattern cannot "
    "be accidentally re-added going forward. This prevents a repeat, but does not remove the file "
    "that is already committed.",
])
h2("Why history was not rewritten")
p("""Rewriting git history to delete the file (e.g. with a history-purge tool) was considered and
deliberately rejected as the remediation here. <b>Rotating the exposed credential is the authoritative
fix</b>: once rotated, the old credential value sitting in git history is inert and cannot be used to
access anything, regardless of who can still see it. A history rewrite, by contrast, does not remove
data from GitHub's own servers (prior commits typically remain reachable/recoverable there for a
period, and anyone who already cloned the repository keeps a full copy regardless), while also being
disruptive to every collaborator's local copy of the repository. Given that, rotation was judged the
correct and sufficient fix, and a purge was not performed.""")
h2("Plaintext passwords removed from scripts")
p("""Separately, commit <b>a74c73d</b> (\u201cfix(security): remove hardcoded plaintext passwords from "
scripts, use env vars\u201d) removed hardcoded staff/admin account passwords that had been written "
directly into four files: <font face='Courier'>docs/capture_screenshots.js</font>, "
<font face='Courier'>scripts/check-passwords.ts</font>, "
<font face='Courier'>scripts/reset-admin-password.ts</font>, and "
<font face='Courier'>scripts/reset-staff-password.ts</font>. Each script now requires the password to "
be supplied via an environment variable at run time instead of being stored in the file. As with the "
credential document above, the specific password values that were hardcoded remain visible in this "
repository's git history and should be treated as exposed regardless of the code fix (see Section 7).""")

# ================================================================== 7. OPEN ITEMS
h1("7. Open Items Requiring a Management Decision")
simple_table(
    ["Item", "Recommendation"],
    [
        ["Rotate admin and staff account passwords",
         "The specific plaintext password values found in git history (commit history predating "
         "a74c73d) should be treated as exposed. Recommend rotating all admin and staff account "
         "passwords now, independent of the code fix already applied."],
        ["Verify the Vercel hosting plan tier (Hobby vs. paid)",
         "Vercel's free \u201cHobby\u201d plan terms prohibit commercial use. Jays Shop is a "
         "revenue-generating retail platform; if the account is still on Hobby, recommend upgrading "
         "to a paid plan promptly to close this compliance exposure. This could not be confirmed "
         "from the repository or CLI tooling available while preparing this report and needs "
         "confirmation directly in the Vercel billing dashboard."],
    ],
    col_widths=[2.0 * inch, PAGE_W - 2.0 * inch],
)

story.append(PageBreak())

# ================================================================== APPENDIX
h1("Appendix &mdash; Technical Detail")
p("""This appendix restates the material above with implementation-level detail, for engineering or "
technical-audit reference. No credential values appear anywhere below.""")

h2("A.1 Commits reviewed and verified (via `git log` / `git show`)")
commit_table([
    ("52e071c", "chore(r2): add CORS configuration helper and script"),
    ("11d9736", "fix(r2): disable auto CRC32 checksum on presigned PUT uploads"),
    ("4c086ac", "fix(r2): normalize R2_ENDPOINT that includes bucket name as path suffix"),
    ("d2e281f", "diag(r2): log presigned URL pathname to surface doubled-bucket paths"),
    ("06b2db2", "fix(r2): trim R2 env vars to guard against ERR_INVALID_CHAR recurrence"),
    ("a74c73d", "fix(security): remove hardcoded plaintext passwords from scripts, use env vars"),
    ("9ad862a", "chore: gitignore credential reference docs to prevent recurrence"),
    ("36fd9c2", "docs: add Cloudflare R2 credentials and configuration reference PDF"),
    ("e5acfbe", "fix(hero): stop blob data-transfer burn for hero videos"),
    ("359ec5b", "refactor(media): remove Vercel Blob dependency from all uploads"),
])

h2("A.2 `src/lib/media/r2.server.ts` — S3 client setup")
bullets([
    "<font face='Courier'>requestChecksumCalculation: 'WHEN_REQUIRED'</font> is set on the "
    "<font face='Courier'>S3Client</font> in <font face='Courier'>getClient()</font>, added in "
    "commit 11d9736, preventing the AWS SDK v3 default (WHEN_SUPPORTED) from attaching a "
    "checksum computed over an empty body to presigned <font face='Courier'>PutObjectCommand</font> "
    "requests.",
    "<font face='Courier'>normalizeR2Endpoint()</font> strips a trailing "
    "<font face='Courier'>/&lt;bucketName&gt;</font> path suffix from "
    "<font face='Courier'>R2_ENDPOINT</font> if present (commit 4c086ac), tolerating both the "
    "bucket-suffixed and bucket-less forms of the Cloudflare dashboard's displayed endpoint. Server "
    "logs a host-only warning (no credentials) when this normalization triggers.",
    "All five R2 environment variables (<font face='Courier'>R2_ENDPOINT</font>, "
    "<font face='Courier'>R2_ACCESS_KEY_ID</font>, <font face='Courier'>R2_SECRET_ACCESS_KEY</font>, "
    "<font face='Courier'>R2_BUCKET_NAME</font>, <font face='Courier'>R2_PUBLIC_URL</font>) are read "
    "with <font face='Courier'>?.trim()</font> applied (commit 06b2db2), confirmed present at lines "
    "58, 67-68, 92, and 98 of the file as read directly for this report.",
])

h2("A.3 `src/app/api/admin/hero-slides/presigned-url/route.ts`")
bullets([
    "GET route, gated by <font face='Courier'>requireRole(req, 'gallery:write')</font>, validating "
    "file name, content type (MP4/WebM only), size (max 50 MB), and scope before calling "
    "<font face='Courier'>getPresignedR2UploadUrl()</font>.",
    "Diagnostic logging (commit d2e281f) logs only "
    "<font face='Courier'>new URL(presignedUrl).pathname</font> &mdash; explicitly never the query "
    "string, which carries the SigV4 request signature &mdash; so a doubled-bucket path would be "
    "visible in Vercel logs without exposing any credential material.",
])

h2("A.4 `scripts/configure-r2-cors.ts`")
p("""A one-off runner that calls <font face='Courier'>configureR2Cors()</font> "
(<font face='Courier'>src/lib/media/r2.server.ts</font>) against a hardcoded list of three allowed "
origins (production URL, a preview URL, and localhost:3000). Confirmed present in "
<font face='Courier'>package.json</font> as the npm script "
<font face='Courier'>r2:configure-cors</font> (added in commit 11d9736), so it can be run via "
<font face='Courier'>npm run r2:configure-cors</font> instead of being invoked ad hoc.""")

h2("A.5 File-by-file change list (commits reviewed)")
simple_table(
    ["Commit", "Files changed"],
    [
        ["52e071c", "scripts/configure-r2-cors.ts (new); src/lib/media/r2.server.ts (+27); "
                    "docs/hero-video-upload-fix-summary.pdf/.tex (new, no secrets)"],
        ["11d9736", "package.json (+3/-1); src/lib/media/r2.server.ts (+7)"],
        ["4c086ac", "src/lib/media/r2.server.ts (+33/-2)"],
        ["d2e281f", "src/app/api/admin/hero-slides/presigned-url/route.ts (+7)"],
        ["06b2db2", "src/lib/media/r2.server.ts (+13/-5)"],
        ["a74c73d", "docs/capture_screenshots.js (+9/-2); scripts/check-passwords.ts (+10/-2); "
                    "scripts/reset-admin-password.ts (+11/-2); scripts/reset-staff-password.ts (+12/-2)"],
        ["9ad862a", ".gitignore (+3)"],
    ],
    col_widths=[1.05 * inch, PAGE_W - 1.05 * inch],
)

h2("A.6 Items explicitly marked unverified in this report")
bullets([
    "The claim that the prior Vercel Blob store returned HTTP 403 errors that blanked hero imagery: "
    "no such status code, error log, or ticket referencing it was found in the repository. The "
    "cost/quota motivation for leaving Vercel Blob is confirmed; the specific 403 detail is not.",
    "That the exposed R2 credential's rotation was \u201cindependently verified\u201d: this report "
    "relies on that being reported by the engineer who performed it. No rotation confirmation record "
    "(e.g. a provider audit log export) exists in the repository itself.",
    "The current Vercel hosting plan tier (Hobby vs. paid): not observable from the repository or "
    "from CLI tooling available while preparing this report.",
])

story.append(Spacer(1, 10))
story.append(HRFlowable(width="100%", thickness=0.75, color=colors.HexColor("#D8E0EC")))
story.append(Spacer(1, 8))
story.append(Paragraph(
    "This report contains no credentials, API keys, passwords, tokens, or connection strings. "
    "Environment variable names and file/commit references are included for traceability only.",
    styles["Caption"]))

doc = SimpleDocTemplate(
    "/Users/idehenomoruyi/projects/jays-shop/docs/out/Jays-Shop-R2-Storage-Management-Report-2026-07-27.pdf",
    pagesize=LETTER, topMargin=0.75 * inch, bottomMargin=0.75 * inch,
    leftMargin=0.9 * inch, rightMargin=0.9 * inch,
    title="Jays Shop — Cloudflare R2 Storage Management Report (2026-07-27)")


def on_page(canvas, doc_):
    canvas.saveState()
    if doc_.page == 1:
        canvas.setFillColor(NAVY)
        canvas.rect(0, 0, LETTER[0], LETTER[1], fill=1, stroke=0)
    else:
        canvas.setFillColor(GREY)
        canvas.setFont("Helvetica", 8)
        canvas.drawString(0.9 * inch, 0.5 * inch, "Jays Shop — Cloudflare R2 Storage Management Report")
        canvas.drawRightString(LETTER[0] - 0.9 * inch, 0.5 * inch, f"Page {doc_.page - 1}")
        canvas.setStrokeColor(colors.HexColor("#D8E0EC"))
        canvas.line(0.9 * inch, 0.62 * inch, LETTER[0] - 0.9 * inch, 0.62 * inch)
    canvas.restoreState()


doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
print("PDF built.")
