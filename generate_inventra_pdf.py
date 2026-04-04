import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable, KeepTogether
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.platypus import BaseDocTemplate, Frame, PageTemplate
from reportlab.lib.colors import HexColor

# ── Constants ──────────────────────────────────────────────────────────────
OUT_DIR = r"C:\Users\isaia\.copilot\session-state\45fc58c7-dbdb-4aa7-bb3d-afb880667dad\files"
OUT_PATH = os.path.join(OUT_DIR, "Inventra_Backend_Documentation.pdf")
os.makedirs(OUT_DIR, exist_ok=True)

BRAND_BLUE   = HexColor("#1155CC")
BRAND_DARK   = HexColor("#1155CC")
ACCENT_GOLD  = HexColor("#F5A623")
LIGHT_BLUE   = HexColor("#EEF3FF")
LIGHT_GRAY   = HexColor("#F4F4F4")
MID_GRAY     = HexColor("#D0D0D0")
DARK_GRAY    = HexColor("#333333")
WHITE        = colors.white

W, H = A4

# ── Styles ─────────────────────────────────────────────────────────────────
styles = getSampleStyleSheet()

def make_style(name, **kw):
    return ParagraphStyle(name, **kw)

cover_title = make_style("CoverTitle",
    fontSize=42, textColor=WHITE, alignment=TA_CENTER,
    spaceAfter=8, fontName="Helvetica-Bold")
cover_sub = make_style("CoverSub",
    fontSize=16, textColor=HexColor("#CCDDFF"), alignment=TA_CENTER,
    spaceAfter=6, fontName="Helvetica")
cover_detail = make_style("CoverDetail",
    fontSize=11, textColor=HexColor("#AABBEE"), alignment=TA_CENTER,
    spaceAfter=4, fontName="Helvetica")

h1 = make_style("H1",
    fontSize=22, textColor=BRAND_BLUE, spaceBefore=18, spaceAfter=8,
    fontName="Helvetica-Bold", borderPad=4)
h2 = make_style("H2",
    fontSize=15, textColor=BRAND_DARK, spaceBefore=14, spaceAfter=6,
    fontName="Helvetica-Bold")
h3 = make_style("H3",
    fontSize=12, textColor=DARK_GRAY, spaceBefore=10, spaceAfter=4,
    fontName="Helvetica-Bold")

body = make_style("Body",
    fontSize=9.5, textColor=DARK_GRAY, spaceAfter=5,
    fontName="Helvetica", leading=14, alignment=TA_JUSTIFY)
body_left = make_style("BodyLeft",
    fontSize=9.5, textColor=DARK_GRAY, spaceAfter=5,
    fontName="Helvetica", leading=14, alignment=TA_LEFT)
bullet = make_style("Bullet",
    fontSize=9.5, textColor=DARK_GRAY, spaceAfter=3,
    fontName="Helvetica", leading=13, leftIndent=14,
    bulletIndent=4)
code_style = make_style("Code",
    fontSize=8.5, textColor=HexColor("#1A1A2E"), spaceAfter=4,
    fontName="Courier", leading=12, leftIndent=12, backColor=LIGHT_GRAY,
    borderPad=6)
toc_style = make_style("TOC",
    fontSize=10, textColor=BRAND_DARK, spaceAfter=5,
    fontName="Helvetica", leading=16)
toc_h = make_style("TOCH",
    fontSize=11, textColor=BRAND_BLUE, spaceAfter=4,
    fontName="Helvetica-Bold", leading=16)
caption = make_style("Caption",
    fontSize=8, textColor=HexColor("#666666"), spaceAfter=3,
    fontName="Helvetica-Oblique", alignment=TA_CENTER)
tag_style = make_style("Tag",
    fontSize=8.5, textColor=WHITE, spaceAfter=2,
    fontName="Helvetica-Bold", alignment=TA_CENTER)
note_style = make_style("Note",
    fontSize=9, textColor=HexColor("#444444"), spaceAfter=4,
    fontName="Helvetica-Oblique", leftIndent=10, leading=13)

def P(text, style=body): return Paragraph(text, style)
def SP(n=6): return Spacer(1, n)
def HR(color=MID_GRAY, thickness=0.5): return HRFlowable(width="100%", thickness=thickness, color=color, spaceAfter=4)
def PB(): return PageBreak()

# ── Table helpers ───────────────────────────────────────────────────────────
def hdr_table(data, col_widths, title=None):
    """Styled table with blue header row."""
    ts = TableStyle([
        ("BACKGROUND", (0,0), (-1,0), BRAND_BLUE),
        ("TEXTCOLOR",  (0,0), (-1,0), WHITE),
        ("FONTNAME",   (0,0), (-1,0), "Helvetica-Bold"),
        ("FONTSIZE",   (0,0), (-1,0), 9),
        ("ALIGN",      (0,0), (-1,-1), "LEFT"),
        ("VALIGN",     (0,0), (-1,-1), "TOP"),
        ("FONTNAME",   (0,1), (-1,-1), "Helvetica"),
        ("FONTSIZE",   (0,1), (-1,-1), 8.5),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [WHITE, LIGHT_GRAY]),
        ("GRID",       (0,0), (-1,-1), 0.4, MID_GRAY),
        ("TOPPADDING", (0,0), (-1,-1), 5),
        ("BOTTOMPADDING",(0,0),(-1,-1), 5),
        ("LEFTPADDING",(0,0), (-1,-1), 7),
        ("RIGHTPADDING",(0,0),(-1,-1), 7),
    ])
    t = Table(data, colWidths=col_widths, repeatRows=1)
    t.setStyle(ts)
    items = []
    if title:
        items.append(P(title, h3))
    items.append(t)
    items.append(SP(6))
    return items

def code_block(text):
    """Monospace code block with light background."""
    lines = text.strip().split("\n")
    items = []
    for line in lines:
        safe = line.replace("&","&amp;").replace("<","&lt;").replace(">","&gt;")
        items.append(Paragraph(safe, code_style))
    return items

def section_rule():
    return [HR(BRAND_BLUE, 1.2), SP(4)]

def info_box(text, bg=LIGHT_BLUE):
    data = [[Paragraph(text, note_style)]]
    ts = TableStyle([
        ("BACKGROUND",(0,0),(-1,-1), bg),
        ("BOX",(0,0),(-1,-1), 1, BRAND_BLUE),
        ("TOPPADDING",(0,0),(-1,-1),7),
        ("BOTTOMPADDING",(0,0),(-1,-1),7),
        ("LEFTPADDING",(0,0),(-1,-1),10),
        ("RIGHTPADDING",(0,0),(-1,-1),10),
    ])
    t = Table(data, colWidths=[W - 3*cm])
    t.setStyle(ts)
    return [t, SP(6)]

# ── Page templates ──────────────────────────────────────────────────────────
def cover_page_bg(canvas, doc):
    canvas.saveState()
    # Full dark blue background
    canvas.setFillColor(BRAND_DARK)
    canvas.rect(0, 0, W, H, fill=1, stroke=0)
    # Top accent bar
    canvas.setFillColor(BRAND_BLUE)
    canvas.rect(0, H - 2.5*cm, W, 2.5*cm, fill=1, stroke=0)
    # Bottom accent bar
    canvas.setFillColor(BRAND_BLUE)
    canvas.rect(0, 0, W, 1.8*cm, fill=1, stroke=0)
    # Bottom text
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(HexColor("#AABBEE"))
    canvas.drawCentredString(W/2, 0.7*cm, "Confidential — Wonderfall Systems © 2025")
    canvas.restoreState()

def doc_page_bg(canvas, doc):
    canvas.saveState()
    # Header bar
    canvas.setFillColor(BRAND_BLUE)
    canvas.rect(0, H - 1.5*cm, W, 1.5*cm, fill=1, stroke=0)
    canvas.setFont("Helvetica-Bold", 9)
    canvas.setFillColor(WHITE)
    canvas.drawString(1.5*cm, H - 0.95*cm, "INVENTRA — Technical & Backend Documentation")
    canvas.drawRightString(W - 1.5*cm, H - 0.95*cm, "Wonderfall Systems")
    # Footer
    canvas.setFillColor(LIGHT_GRAY)
    canvas.rect(0, 0, W, 1.2*cm, fill=1, stroke=0)
    canvas.setStrokeColor(MID_GRAY)
    canvas.setLineWidth(0.5)
    canvas.line(0, 1.2*cm, W, 1.2*cm)
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(HexColor("#666666"))
    canvas.drawCentredString(W/2, 0.45*cm, f"Page {doc.page}")
    canvas.drawString(1.5*cm, 0.45*cm, "Inventra v1.0.0")
    canvas.drawRightString(W - 1.5*cm, 0.45*cm, "Confidential")
    canvas.restoreState()

# ── Document setup ──────────────────────────────────────────────────────────
doc = BaseDocTemplate(
    OUT_PATH,
    pagesize=A4,
    leftMargin=1.5*cm, rightMargin=1.5*cm,
    topMargin=2.2*cm, bottomMargin=2*cm,
    title="Inventra Backend Documentation",
    author="Wonderfall Systems",
)

cover_frame = Frame(0, 0, W, H, leftPadding=2*cm, rightPadding=2*cm,
                    topPadding=0, bottomPadding=0, id="cover")
main_frame = Frame(1.5*cm, 1.5*cm, W - 3*cm, H - 3.7*cm,
                   leftPadding=0, rightPadding=0,
                   topPadding=0, bottomPadding=0, id="main")

cover_template = PageTemplate(id="Cover", frames=[cover_frame],
                               onPage=cover_page_bg)
main_template  = PageTemplate(id="Main",  frames=[main_frame],
                               onPage=doc_page_bg)
doc.addPageTemplates([cover_template, main_template])

# ── Story ───────────────────────────────────────────────────────────────────
story = []

# ═══════════════════════════ COVER PAGE ═══════════════════════════
story.append(SP(5*cm))

# Logo placeholder box
logo_data = [[Paragraph("INVENTRA", make_style("LogoBox",
    fontSize=48, textColor=WHITE, alignment=TA_CENTER, fontName="Helvetica-Bold"))]]
logo_ts = TableStyle([
    ("BACKGROUND",(0,0),(0,0), BRAND_BLUE),
    ("BOX",(0,0),(0,0), 3, ACCENT_GOLD),
    ("TOPPADDING",(0,0),(0,0),18),
    ("BOTTOMPADDING",(0,0),(0,0),18),
    ("LEFTPADDING",(0,0),(0,0),30),
    ("RIGHTPADDING",(0,0),(0,0),30),
    ("ALIGN",(0,0),(0,0),"CENTER"),
])
logo_tbl = Table(logo_data, colWidths=[8*cm])
logo_tbl.setStyle(logo_ts)

logo_wrap = Table([[logo_tbl]], colWidths=[W - 4*cm])
logo_wrap.setStyle(TableStyle([("ALIGN",(0,0),(0,0),"CENTER"),("VALIGN",(0,0),(0,0),"MIDDLE")]))
story.append(logo_wrap)
story.append(SP(1.2*cm))

story.append(P('"No more paper book, your stock is safe here"', cover_sub))
story.append(SP(0.6*cm))
story.append(HR(ACCENT_GOLD, 2))
story.append(SP(0.5*cm))

story.append(P("Technical &amp; Backend Documentation", make_style("CoverDocType",
    fontSize=18, textColor=WHITE, alignment=TA_CENTER, fontName="Helvetica-Bold", spaceAfter=6)))
story.append(SP(1.5*cm))

meta = [
    ["Developer / Owner", "Wonderfall Systems"],
    ["Platform", "React Native (Expo) — Android &amp; iOS"],
    ["Version", "1.0.0"],
    ["Firebase Project", "wonderfall-be388"],
    ["EAS Project ID", "a3a734b6-9f27-4308-b090-5f7524398726"],
    ["Document Date", "2025"],
]
meta_data = [[Paragraph(k, make_style("MetaKey",fontSize=9,textColor=HexColor("#AABBEE"),fontName="Helvetica-Bold")),
              Paragraph(v, make_style("MetaVal",fontSize=9,textColor=WHITE,fontName="Helvetica"))]
             for k,v in meta]
meta_tbl = Table(meta_data, colWidths=[5*cm, 9*cm])
meta_tbl.setStyle(TableStyle([
    ("ALIGN",(0,0),(-1,-1),"LEFT"),
    ("VALIGN",(0,0),(-1,-1),"MIDDLE"),
    ("TOPPADDING",(0,0),(-1,-1),5),
    ("BOTTOMPADDING",(0,0),(-1,-1),5),
    ("LINEBELOW",(0,0),(-1,-1),0.3,HexColor("#3366AA")),
]))
meta_wrap = Table([[meta_tbl]], colWidths=[W - 4*cm])
meta_wrap.setStyle(TableStyle([("ALIGN",(0,0),(0,0),"CENTER")]))
story.append(meta_wrap)

# Switch to main template
from reportlab.platypus import NextPageTemplate
story.append(NextPageTemplate("Main"))
story.append(PB())

# ═══════════════════════════ TABLE OF CONTENTS ═══════════════════════════
story.append(P("Table of Contents", h1))
story += section_rule()
story.append(SP(8))

toc_entries = [
    ("1", "Project Overview", "3"),
    ("2", "Purpose &amp; Target Market", "3"),
    ("3", "Technology Stack", "4"),
    ("4", "Authentication Flow", "5"),
    ("5", "Firebase Data Models", "7"),
    ("",  "5.1  Users Collection", "7"),
    ("",  "5.2  Products Collection", "7"),
    ("",  "5.3  Sales Collection", "8"),
    ("",  "5.4  Notifications Collection", "9"),
    ("6", "Screens &amp; Features", "10"),
    ("",  "6.1  Home Dashboard", "10"),
    ("",  "6.2  Inventory Screen", "10"),
    ("",  "6.3  Sell / POS Screen", "11"),
    ("",  "6.4  Finance Screen", "11"),
    ("",  "6.5  More / Profile Hub", "11"),
    ("",  "6.6  Add Product Flow", "12"),
    ("",  "6.7  Cart Screen", "12"),
    ("",  "6.8  Checkout Screen", "12"),
    ("",  "6.9  Product Details &amp; Edit", "13"),
    ("",  "6.10 Profile Screen", "13"),
    ("",  "6.11 Notifications Screen", "13"),
    ("",  "6.12 Quick Sell Screen", "14"),
    ("",  "6.13 Total Summary Screen", "14"),
    ("",  "6.14 Settings Screen", "14"),
    ("",  "6.15 Sales Detail Screen", "14"),
    ("7", "Notification System", "15"),
    ("8", "Navigation Structure", "16"),
    ("9", "State Management", "17"),
    ("10","Responsive Design &amp; Device Support", "17"),
    ("11","Firebase Backend Operations", "18"),
    ("12","Recommended REST API Design", "19"),
    ("13","Security Notes", "21"),
]

for num, title, pg in toc_entries:
    if num:
        row_style = toc_h
        prefix = f"<b>{num}.</b>  {title}"
    else:
        row_style = toc_style
        prefix = f"   {title}"

    dots_data = [[
        Paragraph(prefix, row_style),
        Paragraph(f"<b>{pg}</b>", make_style("TOCP",fontSize=10,textColor=BRAND_BLUE,fontName="Helvetica-Bold",alignment=TA_CENTER))
    ]]
    dots_tbl = Table(dots_data, colWidths=[W - 3*cm - 1.5*cm, 1.5*cm])
    dots_tbl.setStyle(TableStyle([
        ("ALIGN",(0,0),(0,0),"LEFT"),
        ("ALIGN",(1,0),(1,0),"RIGHT"),
        ("VALIGN",(0,0),(-1,-1),"MIDDLE"),
        ("LINEBELOW",(0,0),(0,0),0.3,MID_GRAY) if not num else ("LINEBELOW",(0,0),(0,0),0.5,BRAND_BLUE),
        ("TOPPADDING",(0,0),(-1,-1),3),
        ("BOTTOMPADDING",(0,0),(-1,-1),3),
    ]))
    story.append(dots_tbl)

story.append(PB())

# ═══════════════════════════ SECTION 1 — PROJECT OVERVIEW ═══════════════
story.append(P("1. Project Overview", h1))
story += section_rule()
story.append(SP(4))

overview_data = [
    ["Field", "Value"],
    ["App Name", "Inventra"],
    ["Tagline", '"No more paper book, your stock is safe here"'],
    ["Developer / Owner", "Wonderfall Systems"],
    ["Platform", "React Native (Expo) — Android &amp; iOS"],
    ["Version", "1.0.0"],
    ["App Scheme", "inventra"],
    ["Bundle ID (iOS)", "INVENTRA2.W"],
    ["Package (Android)", "INVENTRA2.W"],
    ["EAS Project ID", "a3a734b6-9f27-4308-b090-5f7524398726"],
    ["Firebase Project", "wonderfall-be388"],
    ["Target Market", "Small Nigerian businesses (retail shops, service businesses)"],
    ["Currency", "Nigerian Naira (₦)"],
    ["Default Country Code", "+234 (Nigeria)"],
]
story += hdr_table(
    [[Paragraph(c, make_style("TH",fontSize=9,textColor=WHITE,fontName="Helvetica-Bold")) if i==0
      else Paragraph(c, make_style("TH",fontSize=9,textColor=WHITE,fontName="Helvetica-Bold"))
      for i,c in enumerate(row)] if ri==0
     else [Paragraph(str(c), body_left) for c in row]
     for ri, row in enumerate(overview_data)],
    [5.5*cm, W - 3*cm - 5.5*cm],
    "Table 1.1 — Project Metadata"
)

# ═══════════════════════════ SECTION 2 — PURPOSE ═══════════════════════════
story.append(P("2. Purpose &amp; Target Market", h1))
story += section_rule()
story.append(P(
    "Inventra is a mobile inventory management system designed specifically for small Nigerian businesses, "
    "primarily retail shops and service businesses. The app addresses a common pain point in Nigeria's "
    "informal economy: most small business owners manage stock with paper notebooks, which are error-prone, "
    "easily lost, and do not provide real-time insights.", body))
story.append(SP(6))
story.append(P("Core capabilities:", h3))
caps = [
    ("📦", "Product Inventory Management", "Add, edit, delete products with images, categories, pricing, and expiry dates."),
    ("💳", "Sales Recording &amp; POS", "Point-of-sale interface with cart, checkout, and payment method tracking."),
    ("📊", "Financial Analytics", "Revenue, profit, and expense summaries with line charts and period filtering."),
    ("🔔", "Intelligent Notifications", "Automated alerts for low stock, expiry, high sellers, daily/weekly summaries."),
    ("📒", "Debtor / Credit Tracking", "Record credit sales with customer name, phone, and amount owed."),
    ("👤", "Business Profile", "Multi-business-type support (Retail / Service) with configurable settings."),
]
cap_data = [["Icon", "Feature", "Description"]] + [[ic, ft, desc] for ic, ft, desc in caps]
story += hdr_table(
    [[Paragraph(c, make_style("TH",fontSize=9,textColor=WHITE,fontName="Helvetica-Bold")) for c in row] if ri==0
     else [Paragraph(str(c), body_left) for c in row]
     for ri, row in enumerate(cap_data)],
    [1.2*cm, 4.5*cm, W - 3*cm - 5.7*cm],
    "Table 2.1 — Core Capabilities"
)
story.append(P("Target Business Types:", h3))
for btype, desc in [
    ("<b>Retail Shop</b>", "Supermarkets, provision stores, boutiques, pharmacies — any business selling physical goods."),
    ("<b>Service Business</b>", "Salons, barbers, tailors, mechanics — businesses that sell services and track consumables."),
]:
    story.append(P(f"• {btype}: {desc}", bullet))

story.append(PB())

# ═══════════════════════════ SECTION 3 — TECH STACK ════════════════════════
story.append(P("3. Technology Stack", h1))
story += section_rule()

story.append(P("3.1 Frontend Libraries", h2))
fe_data = [
    ["Library / Tool", "Version", "Purpose"],
    ["React Native", "0.81.5", "Cross-platform mobile framework"],
    ["Expo", "~54.0.32", "Build toolchain, OTA updates, EAS"],
    ["expo-router", "v6", "File-based navigation routing"],
    ["TypeScript", "Latest", "Static type safety"],
    ["Zustand", "Latest", "Global state management"],
    ["React Navigation", "Latest", "Bottom tabs, stack navigator"],
    ["react-native-chart-kit", "Latest", "Line charts for Finance screen"],
    ["expo-print", "Latest", "HTML → PDF generation"],
    ["expo-sharing", "Latest", "Share generated PDFs"],
    ["expo-image-picker", "Latest", "Camera &amp; gallery product photos"],
    ["react-native-image-picker", "Latest", "Alternative image picker"],
    ["expo-secure-store", "Latest", "Secure JWT/token storage"],
    ["AsyncStorage", "Latest", "Local key-value persistence"],
    ["expo-camera", "Latest", "Barcode / SKU scanning"],
    ["expo-linear-gradient", "Latest", "UI gradient backgrounds"],
    ["Poppins (Google Fonts)", "—", "Primary typeface (Regular, Medium, SemiBold, Bold, Light)"],
]
story += hdr_table(
    [[Paragraph(c, make_style("TH",fontSize=9,textColor=WHITE,fontName="Helvetica-Bold")) for c in row] if ri==0
     else [Paragraph(str(c), body_left) for c in row]
     for ri, row in enumerate(fe_data)],
    [5.5*cm, 2.5*cm, W - 3*cm - 8*cm],
    "Table 3.1 — Frontend Dependencies"
)

story.append(SP(6))
story.append(P("3.2 Backend (Firebase)", h2))
story.append(P(
    "Inventra currently uses a client-side Firebase SDK architecture — there is no custom server. "
    "All data operations are performed directly against Firebase services from the React Native client.", body))
be_data = [
    ["Firebase Service", "Usage"],
    ["Firebase Authentication", "Phone OTP login via PhoneAuthProvider + FirebaseRecaptchaVerifierModal"],
    ["Cloud Firestore", "Primary NoSQL database for all app data (products, sales, users, notifications)"],
    ["Firebase Storage", "Product images (products/{uid}/{filename}) &amp; profile pictures (profile_pictures/{uid})"],
]
story += hdr_table(
    [[Paragraph(c, make_style("TH",fontSize=9,textColor=WHITE,fontName="Helvetica-Bold")) for c in row] if ri==0
     else [Paragraph(str(c), body_left) for c in row]
     for ri, row in enumerate(be_data)],
    [5*cm, W - 3*cm - 5*cm],
    "Table 3.2 — Firebase Backend Services"
)

story.append(PB())

# ═══════════════════════════ SECTION 4 — AUTH FLOW ════════════════════════
story.append(P("4. Authentication Flow", h1))
story += section_rule()
story.append(P(
    "Inventra uses Firebase Phone Authentication (SMS OTP) as the sole login method. "
    "The flow is designed for the Nigerian market, defaulting to +234 country code. "
    "Below is a step-by-step description of the complete authentication journey.", body))
story.append(SP(6))

# Step boxes
auth_steps = [
    ("Step 1", "Splash / Onboarding", "Onboarding1.tsx",
     "Displays app branding on a blue (#1155CC) background for 5 seconds, then automatically "
     "navigates to WelcomeScreen. Shows: App name 'Inventra', subtitle 'Inventory Management System', "
     "and Wonderfall Systems branding."),
    ("Step 2", "Phone Number Entry", "WelcomeScreen.tsx",
     "User enters their phone number. The app defaults to +234 (Nigeria). "
     "Input formatting strips spaces, dashes, and brackets, then prepends +234 if no country code is present. "
     "Validation regex: /^\\+[1-9]\\d{6,14}$/. "
     "FirebaseRecaptchaVerifierModal handles invisible reCAPTCHA. "
     "On success, navigates to VerificationScreen with phoneNumber and verificationId as route params. "
     "Errors handled: too-many-requests, invalid-phone-number, quota-exceeded, app-not-authorized."),
    ("Step 3", "OTP Verification", "VerificationScreen.tsx",
     "Displays 6 individual digit input boxes with auto-focus and auto-advance behaviour. "
     "A 45-second countdown timer prevents immediate resend. "
     "Calls PhoneAuthProvider.credential(verificationId, code) then signInWithCredential(auth, credential). "
     "On success, navigates to /(Main)/Home. "
     "Errors handled: invalid-verification-code, code-expired, session-expired, too-many-requests."),
    ("Step 4", "Business Type Selection", "BusinessSelectionScreen.tsx",
     "Shown only on first login (checks hasCompletedOnboarding in AsyncStorage). "
     "User selects: Retail Shop (id: 'retail') or Service Business (id: 'service'). "
     "Saves businessType and hasCompletedOnboarding='true' to AsyncStorage. "
     "Navigates to /(Main)/Home."),
]

for step_tag, step_name, filename, description in auth_steps:
    step_header_data = [[
        Paragraph(step_tag, make_style("StepTag",fontSize=10,textColor=WHITE,fontName="Helvetica-Bold",alignment=TA_CENTER)),
        Paragraph(f"<b>{step_name}</b>  <font color='#888888' size='8'>{filename}</font>",
                  make_style("StepTitle",fontSize=11,textColor=BRAND_DARK,fontName="Helvetica-Bold")),
    ]]
    step_body_data = [[
        Paragraph("", body),
        Paragraph(description, make_style("StepBody",fontSize=9,textColor=DARK_GRAY,fontName="Helvetica",leading=14)),
    ]]
    combined = step_header_data + step_body_data
    step_tbl = Table(combined, colWidths=[1.5*cm, W - 3*cm - 1.5*cm])
    step_tbl.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(0,0), BRAND_BLUE),
        ("BACKGROUND",(1,0),(1,0), LIGHT_BLUE),
        ("BACKGROUND",(0,1),(0,1), LIGHT_BLUE),
        ("BACKGROUND",(1,1),(1,1), WHITE),
        ("BOX",(0,0),(-1,-1),1, BRAND_BLUE),
        ("LINEAFTER",(0,0),(0,-1),1, BRAND_BLUE),
        ("TOPPADDING",(0,0),(-1,-1),8),
        ("BOTTOMPADDING",(0,0),(-1,-1),8),
        ("LEFTPADDING",(0,0),(-1,-1),8),
        ("RIGHTPADDING",(0,0),(-1,-1),8),
        ("VALIGN",(0,0),(-1,-1),"TOP"),
        ("SPAN",(0,0),(0,0)),
    ]))
    story.append(KeepTogether([step_tbl, SP(8)]))

story.append(SP(4))
story.append(P("4.1 Auth State Management (app/_layout.tsx)", h2))
story.append(P(
    "The root layout uses <b>onAuthStateChanged(auth, callback)</b> to continuously monitor authentication state. "
    "Route groups are divided into protected (<b>(Main)</b> and <b>(Routes)</b>) and public "
    "(<b>(Auth)</b> and <b>(Anboarding)</b>). If a user is authenticated they are redirected to <b>/(Main)/Home</b>; "
    "if not, they are redirected to <b>/Onboarding1</b>.", body))

story.append(PB())

# ═══════════════════════════ SECTION 5 — DATA MODELS ══════════════════════
story.append(P("5. Firebase Data Models (Firestore)", h1))
story += section_rule()
story.append(P(
    "All data is stored in Cloud Firestore. Each user's data is isolated by their Firebase Auth UID "
    "stored as the userId field on every document. Below are the four primary collections.", body))
story.append(SP(6))

# 5.1 users
story.append(P("5.1 Collection: users", h2))
story.append(P("<b>Document ID:</b> Firebase Auth UID", body_left))
users_fields = [
    ["Field", "Type", "Description"],
    ["name", "string", "Display name / business owner name"],
    ["businessName", "string", "Business trading name"],
    ["phone", "string", "Phone number (e.g. +2348012345678)"],
    ["phoneNumber", "string", "Alternative phone field (legacy)"],
    ["businessType", "string", '"retail" | "service"'],
    ["profileImage", "string", "Firebase Storage download URL for profile photo"],
    ["displayName", "string", "Alternative display name field (legacy)"],
]
story += hdr_table(
    [[Paragraph(c, make_style("TH",fontSize=9,textColor=WHITE,fontName="Helvetica-Bold")) for c in row] if ri==0
     else [Paragraph(str(c), body_left) for c in row]
     for ri, row in enumerate(users_fields)],
    [3.5*cm, 2.8*cm, W - 3*cm - 6.3*cm],
    "Table 5.1 — users document fields"
)

# 5.2 products
story.append(P("5.2 Collection: products", h2))
story.append(P("<b>Document ID:</b> Auto-generated Firestore ID", body_left))
prod_fields = [
    ["Field", "Type", "Description"],
    ["userId", "string", "Firebase Auth UID of the owning user"],
    ["name", "string", "Product name"],
    ["category", "string", "Foodstuffs | Soft Drinks | Beverages | Noodles &amp; Pasta | Snacks &amp; Biscuits"],
    ["barcode", "string", "SKU / barcode string"],
    ["image", "object|null", "{uri, type?, fileName?, fileSize?} — Firebase Storage URL, or null"],
    ["quantityType", "string", '"Single Items" | "Cartons"'],
    ["unitsInStock", "number", "Current units in stock"],
    ["costPrice", "number", "Cost price per unit (₦)"],
    ["sellingPrice", "number", "Selling price per unit (₦)"],
    ["lowStockThreshold", "number", "Alert threshold — triggers low_stock notification"],
    ["expiryDate", "string", "ISO date string (YYYY-MM-DD)"],
    ["supplier.name", "string", "Supplier contact name"],
    ["supplier.phone", "string", "Supplier phone number"],
    ["dateAdded", "string", "ISO date string when product was added"],
    ["createdAt", "Timestamp", "Firestore server timestamp"],
    ["unitsPerCarton", "number", "(Cartons mode only) Units per carton"],
    ["numberOfCartons", "number", "(Cartons mode only) Number of cartons in stock"],
    ["costPricePerCarton", "number", "(Cartons mode only) Cost price per carton (₦)"],
    ["sellingPricePerCarton", "number", "(Cartons mode only) Selling price per carton (₦)"],
    ["sellingPricePerUnit", "number", "(Cartons mode only) Derived selling price per unit (₦)"],
]
story += hdr_table(
    [[Paragraph(c, make_style("TH",fontSize=9,textColor=WHITE,fontName="Helvetica-Bold")) for c in row] if ri==0
     else [Paragraph(str(c), body_left) for c in row]
     for ri, row in enumerate(prod_fields)],
    [3.8*cm, 2.5*cm, W - 3*cm - 6.3*cm],
    "Table 5.2 — products document fields"
)

story.append(PB())

# 5.3 sales
story.append(P("5.3 Collection: sales", h2))
story.append(P("<b>Document ID:</b> Auto-generated Firestore ID", body_left))
sales_fields = [
    ["Field", "Type", "Description"],
    ["userId", "string", "Firebase Auth UID of seller"],
    ["items", "array", "Array of SaleItem objects (see structure below)"],
    ["items[].productId", "string", "Reference to products collection document"],
    ["items[].productName", "string", "Product name at time of sale"],
    ["items[].quantity", "number", "Quantity sold"],
    ["items[].unitPrice", "number", "Selling price per unit at time of sale (₦)"],
    ["items[].costPrice", "number", "Cost price per unit at time of sale (₦)"],
    ["items[].totalPrice", "number", "unitPrice × quantity (₦)"],
    ["items[].profit", "number", "(unitPrice − costPrice) × quantity (₦)"],
    ["totalAmount", "number", "Sum of all item totalPrices (₦)"],
    ["paymentMethod", "string", '"Cash" | "Transfer" | "POS" | "Credit (Debtor)"'],
    ["timestamp", "Timestamp", "Firestore server timestamp"],
    ["date", "string", "ISO date string"],
    ["debtorDetails.customerName", "string", "(Credit only) Customer name"],
    ["debtorDetails.phoneNumber", "string", "(Credit only) Customer phone number"],
    ["debtorDetails.amountOwed", "number", "(Credit only) Amount owed (₦)"],
    ["debtorDetails.notes", "string", "(Credit only) Optional notes"],
]
story += hdr_table(
    [[Paragraph(c, make_style("TH",fontSize=9,textColor=WHITE,fontName="Helvetica-Bold")) for c in row] if ri==0
     else [Paragraph(str(c), body_left) for c in row]
     for ri, row in enumerate(sales_fields)],
    [4.5*cm, 2.2*cm, W - 3*cm - 6.7*cm],
    "Table 5.3 — sales document fields"
)

story += info_box(
    "ℹ️  Legacy fields: Older sale records may contain top-level fields such as name, image, amount, profit, "
    "customerName, customerPhone, and notes from a previous single-product sale schema. "
    "These should be handled gracefully during reads.")

# 5.4 notifications
story.append(P("5.4 Collection: notifications", h2))
story.append(P("<b>Document ID:</b> Auto-generated Firestore ID", body_left))
notif_fields = [
    ["Field", "Type", "Description"],
    ["userId", "string", "Firebase Auth UID of the recipient"],
    ["type", "string", "low_stock | out_of_stock | high_selling | zero_sales | daily_summary | weekly_summary | expense | expiry | backup | app_update | product_added | sale"],
    ["title", "string", "Notification title"],
    ["message", "string", "Notification body message"],
    ["time", "string", 'Human-readable relative time (e.g. "2hr ago")'],
    ["isRead", "boolean", "Whether the notification has been read"],
    ["productId", "string|null", "Reference to products document if applicable"],
    ["dateAdded", "number", "Unix timestamp in milliseconds"],
    ["createdAt", "Timestamp", "Firestore server timestamp"],
]
story += hdr_table(
    [[Paragraph(c, make_style("TH",fontSize=9,textColor=WHITE,fontName="Helvetica-Bold")) for c in row] if ri==0
     else [Paragraph(str(c), body_left) for c in row]
     for ri, row in enumerate(notif_fields)],
    [3.5*cm, 2.8*cm, W - 3*cm - 6.3*cm],
    "Table 5.4 — notifications document fields"
)

story.append(PB())

# ═══════════════════════════ SECTION 6 — SCREENS ══════════════════════════
story.append(P("6. Screens &amp; Features", h1))
story += section_rule()

def screen_entry(number, name, filename, purpose, features_list, data_list=None):
    items = []
    items.append(P(f"6.{number} {name}", h2))
    items.append(P(f"<b>File:</b> <font name='Courier' size='9'>{filename}</font>", body_left))
    items.append(P(f"<b>Purpose:</b> {purpose}", body))
    if data_list:
        items.append(P("<b>Data Sources:</b>", body_left))
        for d in data_list:
            items.append(P(f"• {d}", bullet))
    items.append(P("<b>Features:</b>", body_left))
    for f in features_list:
        items.append(P(f"• {f}", bullet))
    items.append(SP(4))
    return items

story += screen_entry("1", "Home Dashboard", "app/(Main)/Home.tsx",
    "Central dashboard providing an at-a-glance overview of daily business performance.",
    [
        "Displays user name and profile photo fetched from Firestore users doc",
        "Today's total sales (₦), total profit (₦), and transaction count",
        "Total stock left (sum of all product unitsInStock)",
        "Notification badges and notification list",
        "Recent sales summary list (sorted newest first)",
        "Quick-access 'Add Product' button — opens AddProductFlow modal",
        "Navigation: Notification bell → NotificationsScreen, sales item → SalesDetailScreen, 'View All' → TotalSummaryScreen",
    ],
    [
        "users/{uid} — getDoc for user profile",
        "products (realtime) — filtered by userId",
        "sales (realtime) — filtered by userId",
        "notifications (realtime) — filtered by userId, ordered by dateAdded desc",
    ]
)

story += screen_entry("2", "Inventory Screen", "app/(Main)/Inventory.tsx",
    "Browse and manage the full product catalogue with filtering and search.",
    [
        "Real-time product list (Firestore onSnapshot)",
        "Search bar filtering by product name",
        "Filter tabs: All | In Stock | Out of Stock | Expiring (within 30 days)",
        "Filter counts displayed on each tab badge",
        "Product cards: image, name, category, stock level, selling price",
        "Tap product card → ProductDetails screen",
    ]
)

story += screen_entry("3", "Sell / POS Screen", "app/(Main)/Sell.tsx",
    "Point-of-sale interface for recording sales with cart management.",
    [
        "Two tabs: All (product grid) and History (past sales)",
        "Product search by name",
        "Add-to-cart with increment/decrement quantity controls",
        "Cart button navigates to Cart screen",
        "Checkout button navigates to Checkout screen",
        "Quick Sell shortcut navigates to QuickSellScreen",
        "Responsive grid: 2 columns on phone, 3 columns on tablet",
    ]
)

story += screen_entry("4", "Finance Screen", "app/(Main)/Finance.tsx",
    "Financial analytics with period-based summaries, charts, and PDF export.",
    [
        "Period selector: Today / Week / Month",
        "Summary cards: Total Revenue, Total Profit, Total Expenses",
        "Daily summary: revenue, profit, sales count, order count",
        "Weekly line chart — Revenue vs. Profit per day (Mon–Sun) using react-native-chart-kit",
        "Monthly report summary",
        "Top performing products (by quantity sold &amp; revenue)",
        "Slow-moving stock analysis (products by days in stock)",
        "Stock recommendations (warnings / info / success)",
        "Seasonal business insights",
        "PDF Report Export — generates HTML-based PDF via expo-print + expo-sharing",
    ]
)

story += screen_entry("5", "More / Profile Hub", "app/(Main)/More.tsx",
    "Settings and profile management hub.",
    [
        "Displays user name and phone number from Firestore",
        "Business Options: Business Information, Change Profile Photo → Profile screen",
        "App Settings: Notifications, Help Center, Privacy Policy, Settings",
        "Sign Out — calls signOut(auth) then navigates to Onboarding1",
    ]
)

story.append(PB())

story += screen_entry("6", "Add Product Flow", "app/(Routes)/AddProductFlow.tsx",
    "Full-featured multi-step modal for adding new products to inventory.",
    [
        "Step 0 — Choice: 'Add New Product' or 'Search Existing'",
        "Step 1 — Basic Info: Product Name (required), SKU/Barcode, Category (dropdown), Product Image (camera/gallery)",
        "Step 2 — Inventory: Quantity type (Single Items or Cartons), stock counts, cost/selling prices, low stock threshold, expiry date",
        "Step 3 — Supplier: Supplier name and phone number",
        "On save: uploads image to Firebase Storage at products/{uid}/{filename}, creates Firestore products document",
        "Post-save triggers: notifyProductAdded(), checkExpiringProducts(), checkLowStock()",
    ]
)

story += screen_entry("7", "Cart Screen", "app/(Routes)/Cart.tsx",
    "Shopping cart review screen before proceeding to checkout.",
    [
        "Receives cartData param (JSON-stringified CartItem array)",
        "Fetches fresh product details for each cart item via getDoc(doc(db, 'products', productId))",
        "Displays item list with quantities and subtotals",
        "Shows order total",
        "Proceed to Checkout button",
    ]
)

story += screen_entry("8", "Checkout Screen", "app/(Routes)/Checkout.tsx",
    "Payment processing and sale finalisation screen.",
    [
        "Payment methods: Cash | Transfer | POS | Credit (Debtor)",
        "Credit (Debtor) mode reveals: Customer Name (required), Phone Number (required), Amount Owed (required, > 0), Notes (optional)",
        "On complete: creates sales document in Firestore",
        "Decrements unitsInStock for each sold product using Firestore increment(-quantity)",
        "If Credit: debtorDetails sub-object saved within sale document",
        "Shows success alert then navigates back to Sell screen",
    ]
)

story += screen_entry("9", "Product Details &amp; Edit", "app/(Routes)/ProductDetails.tsx / EditProduct.tsx",
    "View, edit, and delete individual products.",
    [
        "ProductDetails: fetches product via getDoc(doc(db, 'products', productId))",
        "Stock status badge: In Stock / Low Stock / Out of Stock",
        "Edit button navigates to EditProduct screen",
        "Delete product with modal confirmation dialog → deleteDoc()",
        "EditProduct: same form fields as AddProductFlow, pre-populated with existing data",
        "On save: updateDoc() with changed fields; new images re-uploaded to Firebase Storage",
    ]
)

story += screen_entry("10", "Profile Screen", "app/(Routes)/Profile.tsx",
    "Business profile editor for name, photo, and business type.",
    [
        "Fetch and display business name, phone, business type, profile image",
        "Edit business name inline",
        "Upload / change profile photo → Firebase Storage at profile_pictures/{uid}",
        "Save changes via updateDoc(doc(db, 'users', uid), {...})",
        "Creates user document if it does not exist via setDoc",
    ]
)

story.append(PB())

story += screen_entry("11", "Notifications Screen", "app/(Routes)/NotificationsScreen.tsx",
    "Real-time notification feed grouped by time period.",
    [
        "Real-time Firestore listener on notifications collection ordered by dateAdded desc",
        "Grouped by: Today / Yesterday / This Week / Older",
        "Icon mapping by type: low_stock/out_of_stock → package, high_selling → trending-up, expiry → calendar, daily/weekly_summary → bar-chart-2, sale → shopping-bag",
        "Tap notification → NotificationDetails screen",
    ]
)

story += screen_entry("12", "Quick Sell Screen", "app/(Routes)/QuickSellScreen.tsx",
    "Streamlined fast-sale interface for common transactions.",
    [
        "Search products by name",
        "Inline add-to-cart",
        "Process immediate sale (no separate cart/checkout screens)",
        "Decrements product stock on completion",
        "Creates sale document in sales collection",
        "Post-sale triggers: checkHighSelling(), checkLowStock(), notifySaleCompleted()",
    ]
)

story += screen_entry("13", "Total Summary Screen", "app/(Routes)/TotalSummaryScreen.tsx",
    "Aggregated view of all sales transactions.",
    [
        "Real-time from sales collection (filtered by userId, ordered by date desc)",
        "Totals: sales amount, profit, transaction count",
        "Full sales list: product image, name, quantity, amount, profit, date",
    ]
)

story += screen_entry("14", "Settings Screen", "app/(Routes)/SettingsScreen.tsx",
    "Application-level preferences and theme configuration.",
    [
        "Shows current user name and account info",
        "Dark mode toggle (persisted via Zustand themeStore)",
        "Theme colour selection",
        "Navigation to sub-settings screens",
    ]
)

story += screen_entry("15", "Sales Detail Screen", "app/(Routes)/SalesDetailScreen.tsx",
    "Full details view for a single sale transaction.",
    [
        "Receives sale param (JSON-stringified)",
        "Fetches fresh data via getDoc(doc(db, 'sales', saleId))",
        "Displays complete sale details including items, payment method, debtor info if applicable",
        "Delete sale via deleteDoc(doc(db, 'sales', saleId))",
    ]
)

story.append(PB())

# ═══════════════════════════ SECTION 7 — NOTIFICATIONS ════════════════════
story.append(P("7. Notification System", h1))
story += section_rule()
story.append(P(
    "The notification system is implemented in <font name='Courier' size='9'>app/notificationHelpers.ts</font>. "
    "All helpers create documents in the Firestore notifications collection. "
    "Notifications are triggered automatically during key app events (product add, sale completion, etc.).", body))
story.append(SP(6))

notif_helpers = [
    ("createNotification()", "userId, type, title, message, productId?",
     "Base helper — creates a notification document in Firestore with the given fields. All other helpers call this."),
    ("checkLowStock()", "userId, productId, productName, unitsInStock, lowStockThreshold",
     "Creates 'out_of_stock' notification if unitsInStock === 0. Creates 'low_stock' notification if unitsInStock ≤ lowStockThreshold."),
    ("notifyProductAdded()", "userId, productId, productName",
     "Creates a 'product_added' notification when a new product is successfully saved."),
    ("checkHighSelling()", "userId, productId, productName",
     "Queries today's sales for the given product. If 20 or more units were sold today → creates 'high_selling' notification."),
    ("checkExpiringProducts()", "userId",
     "Queries all products for the user. For each product expiring within 3 days → creates 'expiry' notification."),
    ("generateDailySummary()", "userId",
     "Queries today's sales. If sales > 0 → 'daily_summary' notification with profit total. If no sales → 'zero_sales' notification."),
    ("notifySaleCompleted()", "userId, totalAmount, itemCount",
     "Creates a 'sale' notification after a checkout is finalised, summarising the sale total and item count."),
]

nh_data = [["Function", "Parameters", "Description"]] + notif_helpers
story += hdr_table(
    [[Paragraph(c, make_style("TH",fontSize=9,textColor=WHITE,fontName="Helvetica-Bold")) for c in row] if ri==0
     else [Paragraph(str(c), make_style("CodeSmall",fontSize=8,fontName="Courier" if i==0 else "Helvetica",textColor=DARK_GRAY)) for i,c in enumerate(row)]
     for ri, row in enumerate(nh_data)],
    [4.2*cm, 4.5*cm, W - 3*cm - 8.7*cm],
    "Table 7.1 — Notification Helper Functions"
)

notif_types_data = [
    ["Type", "Icon / Category", "Trigger"],
    ["low_stock", "Package icon", "Product stock falls at or below lowStockThreshold"],
    ["out_of_stock", "Package icon", "Product stock reaches 0"],
    ["high_selling", "Trending-up icon", "Product sells 20+ units in a single day"],
    ["expiry", "Calendar icon", "Product expiry date is within 3 days"],
    ["daily_summary", "Bar-chart icon", "End-of-day summary (generated by generateDailySummary)"],
    ["weekly_summary", "Bar-chart icon", "End-of-week summary"],
    ["zero_sales", "Bar-chart icon", "No sales recorded for the day"],
    ["product_added", "Package icon", "New product added to inventory"],
    ["sale", "Shopping-bag icon", "Sale completed at checkout"],
    ["expense", "—", "Expense event (reserved for future use)"],
    ["backup", "—", "Backup event (reserved for future use)"],
    ["app_update", "—", "App update notification (reserved for future use)"],
]
story += hdr_table(
    [[Paragraph(c, make_style("TH",fontSize=9,textColor=WHITE,fontName="Helvetica-Bold")) for c in row] if ri==0
     else [Paragraph(str(c), body_left) for c in row]
     for ri, row in enumerate(notif_types_data)],
    [3.5*cm, 3.5*cm, W - 3*cm - 7*cm],
    "Table 7.2 — Notification Types"
)

story.append(PB())

# ═══════════════════════════ SECTION 8 — NAVIGATION ═══════════════════════
story.append(P("8. Navigation Structure", h1))
story += section_rule()
story.append(P(
    "Inventra uses <b>expo-router v6</b> (file-based routing). The directory structure under "
    "<font name='Courier' size='9'>app/</font> directly maps to navigation routes. "
    "Route groups (wrapped in parentheses) are used for both layout organisation and access control.", body))
story.append(SP(6))

nav_tree = """app/
├── index.tsx                      → Redirects to (Anboarding)/Onboarding1
├── _layout.tsx                    → Root layout — auth guard + font loading
│
├── (Anboarding)/                  ── PUBLIC ──────────────────────
│   └── Onboarding1.tsx            → 5s splash → WelcomeScreen
│
├── (Auth)/                        ── PUBLIC ──────────────────────
│   ├── WelcomeScreen.tsx          → Phone number input (OTP request)
│   ├── VerificationScreen.tsx     → 6-digit OTP entry
│   └── BusinessSelectionScreen.tsx→ First-login business type picker
│
├── (Main)/                        ── PROTECTED (Bottom Tab Nav) ──
│   ├── Home.tsx                   → Dashboard
│   ├── Inventory.tsx              → Product list & search
│   ├── Sell.tsx                   → POS + Sales history
│   ├── Finance.tsx                → Analytics + PDF export
│   └── More.tsx                   → Profile & settings hub
│
└── (Routes)/                      ── PROTECTED (Stack Nav) ────────
    ├── AddProductFlow.tsx          → Add product modal (multi-step)
    ├── Cart.tsx                    → Cart review
    ├── Checkout.tsx                → Payment processing
    ├── EditProduct.tsx             → Edit existing product
    ├── ProductDetails.tsx          → View/delete product
    ├── QuickSellScreen.tsx         → Fast POS
    ├── Profile.tsx                 → Business profile editor
    ├── NotificationsScreen.tsx     → Notification feed
    ├── NotificationDetails.tsx     → Single notification detail
    ├── SalesDetailScreen.tsx       → Single sale detail
    ├── TotalSummaryScreen.tsx      → All sales list
    ├── SettingsScreen.tsx          → App settings
    ├── MessagesScreen.tsx          → Placeholder messaging
    ├── HelpCenterScreen.tsx        → Help & FAQ
    ├── PrivacyPolicy.tsx           → Privacy policy display
    └── AccountScreen.tsx           → Account management (placeholder)"""

story += code_block(nav_tree)

story += info_box(
    "Note: The route group name '(Anboarding)' (intentional spelling) is the actual directory name in the codebase. "
    "Both (Anboarding) and (Auth) are public routes that do not require authentication.")

story.append(PB())

# ═══════════════════════════ SECTION 9 — STATE MANAGEMENT ═════════════════
story.append(P("9. State Management", h1))
story += section_rule()
story.append(P(
    "Inventra uses a combination of Zustand for global state, React local state for screen-level state, "
    "AsyncStorage for persisted preferences, and Firebase Auth for authentication state.", body))
story.append(SP(6))

sm_data = [
    ["Store / Mechanism", "Type", "Data / Keys", "Persistence"],
    ["themeStore", "Zustand", "isDarkMode (bool), themeColor (string), toggleTheme(), setThemeColor()", "In-memory (reset on app restart unless persisted)"],
    ["taskStore", "Zustand", "tasks array, addTask()", "Placeholder — not actively used in v1.0"],
    ["useState", "React local state", "All screen-level state (form inputs, loading flags, fetched data)", "None — resets on unmount"],
    ["AsyncStorage", "Key-value store", "businessType, hasCompletedOnboarding", "Persisted to device storage"],
    ["Firebase Auth", "Firebase SDK", "currentUser (uid, phone, etc.)", "Persisted via Firebase's local persistence"],
    ["Firestore onSnapshot", "Realtime listeners", "products, sales, notifications, user profile", "Realtime — no local caching by default"],
]
story += hdr_table(
    [[Paragraph(c, make_style("TH",fontSize=9,textColor=WHITE,fontName="Helvetica-Bold")) for c in row] if ri==0
     else [Paragraph(str(c), body_left) for c in row]
     for ri, row in enumerate(sm_data)],
    [3.5*cm, 2.5*cm, 5.5*cm, W - 3*cm - 11.5*cm],
    "Table 9.1 — State Management Summary"
)

# ═══════════════════════════ SECTION 10 — RESPONSIVE DESIGN ═══════════════
story.append(P("10. Responsive Design &amp; Device Support", h1))
story += section_rule()
story.append(P(
    "All screens use custom responsive scaling utilities to adapt layouts across phone sizes and tablets. "
    "The base reference size is <b>375px wide × 812px tall</b> (iPhone X dimensions).", body))
story.append(SP(6))

scale_data = [
    ["Function", "Formula / Logic", "Use Case"],
    ["scale(size)", "size × (deviceWidth / 375)", "Horizontal dimensions, icon sizes, padding"],
    ["verticalScale(size)", "size × (deviceHeight / 812)", "Vertical dimensions, heights, margins"],
    ["moderateScale(size, factor)", "size + (scale(size) − size) × factor", "Font sizes — balanced scaling"],
]
story += hdr_table(
    [[Paragraph(c, make_style("TH",fontSize=9,textColor=WHITE,fontName="Helvetica-Bold")) for c in row] if ri==0
     else [Paragraph(str(c), body_left) for c in row]
     for ri, row in enumerate(scale_data)],
    [3.8*cm, 5*cm, W - 3*cm - 8.8*cm],
    "Table 10.1 — Scaling Functions"
)

device_data = [
    ["Device Class", "Width Condition", "Behaviour"],
    ["Small Phone", "width &lt; 375px", "Reduced padding, smaller default font sizes"],
    ["Medium Phone", "375px ≤ width &lt; 414px", "Standard layout — reference size"],
    ["Large Phone / Phablet", "414px ≤ width &lt; 768px", "Slightly larger spacing"],
    ["Tablet", "width ≥ 768px", "3-column product grids (vs 2), larger fonts, more padding"],
]
story += hdr_table(
    [[Paragraph(c, make_style("TH",fontSize=9,textColor=WHITE,fontName="Helvetica-Bold")) for c in row] if ri==0
     else [Paragraph(str(c), body_left) for c in row]
     for ri, row in enumerate(device_data)],
    [4*cm, 4*cm, W - 3*cm - 8*cm],
    "Table 10.2 — Device Breakpoints"
)

story.append(P("Design Tokens:", h3))
design_tokens = [
    ["Token", "Value", "Usage"],
    ["Primary Blue", "#1155CC", "Buttons, headers, accents, brand colour"],
    ["Dark Blue", "#1155CC", "Background on auth screens"],
    ["Font Family", "Poppins", "Regular, Medium, SemiBold, Bold, Light variants"],
]
story += hdr_table(
    [[Paragraph(c, make_style("TH",fontSize=9,textColor=WHITE,fontName="Helvetica-Bold")) for c in row] if ri==0
     else [Paragraph(str(c), body_left) for c in row]
     for ri, row in enumerate(design_tokens)],
    [3.5*cm, 3*cm, W - 3*cm - 6.5*cm],
    "Table 10.3 — Design Tokens"
)

story.append(PB())

# ═══════════════════════════ SECTION 11 — FIRESTORE OPS ═══════════════════
story.append(P("11. Firebase Backend Operations", h1))
story += section_rule()
story.append(P("11.1 Read Operations", h2))
read_data = [
    ["Collection / Document", "Operation", "Filter / Sort", "Used In Screen(s)"],
    ["users/{uid}", "getDoc", "By Firebase UID", "Home, More, Profile, Settings"],
    ["products", "onSnapshot (realtime)", "where userId == uid", "Home, Inventory, Sell, Finance, QuickSell"],
    ["products/{id}", "getDoc", "By document ID", "Cart, Checkout, ProductDetails"],
    ["sales", "onSnapshot (realtime)", "where userId == uid", "Home, Sell, Finance, TotalSummary"],
    ["sales/{id}", "getDoc", "By document ID", "SalesDetail"],
    ["notifications", "onSnapshot (realtime)", "where userId == uid, orderBy dateAdded desc", "Home, Notifications"],
]
story += hdr_table(
    [[Paragraph(c, make_style("TH",fontSize=9,textColor=WHITE,fontName="Helvetica-Bold")) for c in row] if ri==0
     else [Paragraph(str(c), body_left) for c in row]
     for ri, row in enumerate(read_data)],
    [4*cm, 3*cm, 4.5*cm, W - 3*cm - 11.5*cm],
    "Table 11.1 — Firestore Read Operations"
)

story.append(P("11.2 Write Operations", h2))
write_data = [
    ["Collection / Document", "Operation", "Triggered From"],
    ["products", "addDoc", "AddProductFlow (on save)"],
    ["products/{id}", "updateDoc", "EditProduct (on save)"],
    ["products/{id}", "updateDoc (increment)", "Checkout / QuickSell (stock decrement)"],
    ["products/{id}", "deleteDoc", "ProductDetails (on confirm delete)"],
    ["sales", "addDoc", "Checkout, QuickSellScreen"],
    ["sales/{id}", "deleteDoc", "SalesDetailScreen"],
    ["users/{uid}", "setDoc (merge)", "Profile (first save — creates if absent)"],
    ["users/{uid}", "updateDoc", "Profile (subsequent saves)"],
    ["notifications", "addDoc", "notificationHelpers (all helpers)"],
]
story += hdr_table(
    [[Paragraph(c, make_style("TH",fontSize=9,textColor=WHITE,fontName="Helvetica-Bold")) for c in row] if ri==0
     else [Paragraph(str(c), body_left) for c in row]
     for ri, row in enumerate(write_data)],
    [5*cm, 3.2*cm, W - 3*cm - 8.2*cm],
    "Table 11.2 — Firestore Write Operations"
)

story.append(P("11.3 Firebase Storage Paths", h2))
storage_data = [
    ["Path", "Usage", "Triggered From"],
    ["profile_pictures/{userId}", "User profile photos", "Profile screen (photo upload)"],
    ["products/{userId}/{filename}", "Product images", "AddProductFlow, EditProduct"],
]
story += hdr_table(
    [[Paragraph(c, make_style("TH",fontSize=9,textColor=WHITE,fontName="Helvetica-Bold")) for c in row] if ri==0
     else [Paragraph(str(c), body_left) for c in row]
     for ri, row in enumerate(storage_data)],
    [5.5*cm, 4*cm, W - 3*cm - 9.5*cm],
    "Table 11.3 — Firebase Storage Paths"
)

story.append(PB())

# ═══════════════════════════ SECTION 12 — REST API DESIGN ═════════════════
story.append(P("12. Recommended REST API Design (Future Migration)", h1))
story += section_rule()
story.append(P(
    "The following REST API design is recommended for a future migration away from the client-side Firebase SDK "
    "to a dedicated backend server. This design follows RESTful conventions and would replace direct Firestore "
    "calls with authenticated HTTP endpoints. JWT-based authentication is assumed.", body))
story.append(SP(8))

api_groups = [
    ("12.1 Authentication", [
        ["Method", "Endpoint", "Description"],
        ["POST", "/auth/send-otp", "Send OTP to the provided phone number"],
        ["POST", "/auth/verify-otp", "Verify OTP code and return JWT access + refresh tokens"],
        ["POST", "/auth/refresh-token", "Refresh expired JWT access token using refresh token"],
    ]),
    ("12.2 Users", [
        ["Method", "Endpoint", "Description"],
        ["GET",  "/users/me", "Get authenticated user's profile"],
        ["PUT",  "/users/me", "Update profile (name, businessType, profileImage)"],
        ["POST", "/users/me/profile-image", "Multipart upload for profile picture"],
    ]),
    ("12.3 Products", [
        ["Method", "Endpoint", "Description"],
        ["GET",    "/products", "List all products. Query params: filter=inStock|outOfStock|expiring, search="],
        ["POST",   "/products", "Create a new product"],
        ["GET",    "/products/:id", "Get a single product by ID"],
        ["PUT",    "/products/:id", "Update a product"],
        ["DELETE", "/products/:id", "Delete a product"],
        ["POST",   "/products/:id/image", "Multipart upload for product image"],
    ]),
    ("12.4 Sales", [
        ["Method", "Endpoint", "Description"],
        ["GET",    "/sales", "List all sales. Query params: period=today|week|month, orderBy=date"],
        ["POST",   "/sales", "Create a new sale (atomically decrements stock for all items)"],
        ["GET",    "/sales/:id", "Get a single sale by ID"],
        ["DELETE", "/sales/:id", "Delete a sale record"],
    ]),
    ("12.5 Finance", [
        ["Method", "Endpoint", "Description"],
        ["GET", "/finance/summary", "Aggregated summary. Query: period=today|week|month"],
        ["GET", "/finance/top-products", "Top products by quantity/revenue. Query: period="],
        ["GET", "/finance/chart-data", "Daily chart data for line graph. Query: period="],
        ["GET", "/finance/report", "Generate PDF-ready report data. Query: period="],
    ]),
    ("12.6 Notifications", [
        ["Method", "Endpoint", "Description"],
        ["GET", "/notifications", "List all notifications ordered by dateAdded desc"],
        ["PUT", "/notifications/:id/read", "Mark a specific notification as read"],
        ["POST", "/notifications/mark-all-read", "Mark all notifications as read"],
    ]),
    ("12.7 Dashboard", [
        ["Method", "Endpoint", "Description"],
        ["GET", "/dashboard", "Aggregated home screen data: user, todaySales, profit, transactions, stockLeft, recentSales"],
    ]),
]

for section_title, rows in api_groups:
    story.append(P(section_title, h2))
    # Colour-code HTTP methods
    def method_para(m):
        colours = {"GET":"#27AE60","POST":"#2980B9","PUT":"#E67E22","DELETE":"#E74C3C","PATCH":"#8E44AD"}
        c = colours.get(m, "#333333")
        return Paragraph(f"<font color='{c}'><b>{m}</b></font>",
                         make_style("Method",fontSize=9,fontName="Helvetica-Bold",textColor=DARK_GRAY))
    styled_rows = [[Paragraph(c, make_style("TH",fontSize=9,textColor=WHITE,fontName="Helvetica-Bold")) for c in rows[0]]]
    for row in rows[1:]:
        styled_rows.append([method_para(row[0]),
                             Paragraph(row[1], make_style("EP",fontSize=8.5,fontName="Courier",textColor=DARK_GRAY)),
                             Paragraph(row[2], body_left)])
    story += hdr_table(styled_rows, [1.8*cm, 5.5*cm, W - 3*cm - 7.3*cm])

story.append(PB())

# ═══════════════════════════ SECTION 13 — SECURITY ════════════════════════
story.append(P("13. Security Notes", h1))
story += section_rule()
story.append(P(
    "Because Inventra currently uses the client-side Firebase SDK, all security is enforced through "
    "Firestore Security Rules and Firebase Auth. The following practices are in place or recommended:", body))
story.append(SP(6))

sec_points = [
    ("<b>Data Isolation:</b>", "Every Firestore query is filtered by userId == auth.currentUser.uid client-side. "
     "Firestore Security Rules MUST enforce this server-side to prevent unauthorised cross-user data access."),
    ("<b>Phone OTP Authentication:</b>", "Firebase Phone Auth with invisible reCAPTCHA provides bot-protection "
     "and SMS-based identity verification. No passwords are stored."),
    ("<b>JWT / Token Storage:</b>", "expo-secure-store is used for any locally persisted tokens, "
     "leveraging the platform keychain/keystore rather than plain AsyncStorage."),
    ("<b>Firestore Security Rules:</b>", "Rules should enforce: allow read, write only if request.auth != null "
     "and request.auth.uid == resource.data.userId for all collections."),
    ("<b>Firebase Storage Rules:</b>", "Storage rules should restrict read/write to authenticated users "
     "and enforce path-based ownership (e.g., /products/{userId}/** accessible only by {userId})."),
    ("<b>Image Uploads:</b>", "Product images and profile photos are uploaded to Firebase Storage with "
     "user-scoped paths. Download URLs are stored in Firestore (not the raw files)."),
    ("<b>Future API Migration:</b>", "When migrating to a REST API backend, all Firebase operations should be "
     "moved server-side, JWT tokens validated on every request, and rate limiting applied to auth endpoints."),
]

for title, desc in sec_points:
    row_data = [[Paragraph(title, h3), Paragraph(desc, body)]]
    sec_tbl = Table(row_data, colWidths=[3.8*cm, W - 3*cm - 3.8*cm])
    sec_tbl.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(0,0), LIGHT_BLUE),
        ("BOX",(0,0),(-1,-1),0.5, MID_GRAY),
        ("LINEAFTER",(0,0),(0,0),1, BRAND_BLUE),
        ("TOPPADDING",(0,0),(-1,-1),8),
        ("BOTTOMPADDING",(0,0),(-1,-1),8),
        ("LEFTPADDING",(0,0),(-1,-1),8),
        ("RIGHTPADDING",(0,0),(-1,-1),8),
        ("VALIGN",(0,0),(-1,-1),"TOP"),
    ]))
    story.append(KeepTogether([sec_tbl, SP(5)]))

story.append(SP(1*cm))
story.append(HR(BRAND_BLUE, 1.5))
story.append(SP(8))
story.append(P("End of Document", make_style("EndDoc",
    fontSize=11, textColor=HexColor("#888888"), alignment=TA_CENTER,
    fontName="Helvetica-Oblique")))
story.append(P("Inventra v1.0.0 — Wonderfall Systems © 2025 — Confidential",
    make_style("Footer2", fontSize=9, textColor=HexColor("#AAAAAA"), alignment=TA_CENTER, fontName="Helvetica")))

# ── Build ───────────────────────────────────────────────────────────────────
doc.build(story)
print(f"PDF successfully saved to: {OUT_PATH}")
