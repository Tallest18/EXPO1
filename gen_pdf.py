from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, HRFlowable
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
import os

OUTPUT = r"C:\Users\isaia\.copilot\session-state\45fc58c7-dbdb-4aa7-bb3d-afb880667dad\files\Inventra_Backend_Documentation.pdf"
os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)

doc = SimpleDocTemplate(OUTPUT, pagesize=A4,
    rightMargin=2*cm, leftMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm)

W, H = A4
styles = getSampleStyleSheet()

BLUE = colors.HexColor("#1155CC")
DARK_BLUE = colors.HexColor("#2046AE")
LIGHT_BLUE = colors.HexColor("#EBF0FF")
GRAY = colors.HexColor("#6B7280")
LIGHT_GRAY = colors.HexColor("#F3F4F6")
GREEN = colors.HexColor("#10B981")
RED = colors.HexColor("#EF4444")
WHITE = colors.white
BLACK = colors.black

cover_title = ParagraphStyle('CoverTitle', fontSize=48, textColor=WHITE, alignment=TA_CENTER, fontName='Helvetica-Bold', spaceAfter=10, leading=56)
cover_sub = ParagraphStyle('CoverSub', fontSize=20, textColor=WHITE, alignment=TA_CENTER, fontName='Helvetica', spaceAfter=6)
cover_tag = ParagraphStyle('CoverTag', fontSize=14, textColor=colors.HexColor("#C7D8FF"), alignment=TA_CENTER, fontName='Helvetica-Oblique', spaceAfter=4)

h1 = ParagraphStyle('H1', fontSize=22, textColor=BLUE, fontName='Helvetica-Bold', spaceBefore=18, spaceAfter=8, borderPad=4)
h2 = ParagraphStyle('H2', fontSize=16, textColor=DARK_BLUE, fontName='Helvetica-Bold', spaceBefore=14, spaceAfter=6)
h3 = ParagraphStyle('H3', fontSize=13, textColor=BLACK, fontName='Helvetica-Bold', spaceBefore=10, spaceAfter=4)
body = ParagraphStyle('Body', fontSize=10, textColor=BLACK, fontName='Helvetica', spaceAfter=5, leading=15, alignment=TA_JUSTIFY)
bullet = ParagraphStyle('Bullet', fontSize=10, textColor=BLACK, fontName='Helvetica', spaceAfter=3, leading=14, leftIndent=18, bulletIndent=6)
code_style = ParagraphStyle('Code', fontSize=9, textColor=colors.HexColor("#1e293b"), fontName='Courier', spaceAfter=4, leading=13, leftIndent=10, backColor=LIGHT_GRAY)
toc_style = ParagraphStyle('TOC', fontSize=11, textColor=BLACK, fontName='Helvetica', spaceAfter=4, leading=16)
toc_num = ParagraphStyle('TOCNum', fontSize=11, textColor=BLUE, fontName='Helvetica-Bold', spaceAfter=4)

def hr(): return HRFlowable(width="100%", thickness=1, color=LIGHT_BLUE, spaceAfter=8, spaceBefore=4)
def sp(n=10): return Spacer(1, n)

def section_header(text):
    return [
        sp(4),
        Table([[Paragraph(text, ParagraphStyle('SH', fontSize=18, textColor=WHITE, fontName='Helvetica-Bold', spaceAfter=0, leading=22))]],
              colWidths=[W - 4*cm],
              style=[('BACKGROUND', (0,0), (-1,-1), BLUE),
                     ('TOPPADDING', (0,0), (-1,-1), 8),
                     ('BOTTOMPADDING', (0,0), (-1,-1), 8),
                     ('LEFTPADDING', (0,0), (-1,-1), 12),
                     ('RIGHTPADDING', (0,0), (-1,-1), 12),
                     ('ROUNDEDCORNERS', [4,4,4,4]),]),
        sp(10),
    ]

def sub_header(text):
    return [
        Table([[Paragraph(text, ParagraphStyle('SUB', fontSize=13, textColor=WHITE, fontName='Helvetica-Bold', spaceAfter=0, leading=18))]],
              colWidths=[W - 4*cm],
              style=[('BACKGROUND', (0,0), (-1,-1), DARK_BLUE),
                     ('TOPPADDING', (0,0), (-1,-1), 5),
                     ('BOTTOMPADDING', (0,0), (-1,-1), 5),
                     ('LEFTPADDING', (0,0), (-1,-1), 10),
                     ('RIGHTPADDING', (0,0), (-1,-1), 10),]),
        sp(6),
    ]

def info_box(text, bg=LIGHT_BLUE):
    return [
        Table([[Paragraph(text, ParagraphStyle('IB', fontSize=10, fontName='Helvetica', leading=14, spaceAfter=0))]],
              colWidths=[W - 4*cm],
              style=[('BACKGROUND', (0,0), (-1,-1), bg),
                     ('TOPPADDING', (0,0), (-1,-1), 6),
                     ('BOTTOMPADDING', (0,0), (-1,-1), 6),
                     ('LEFTPADDING', (0,0), (-1,-1), 10),
                     ('RIGHTPADDING', (0,0), (-1,-1), 10),
                     ('BOX', (0,0), (-1,-1), 0.5, BLUE),]),
        sp(6),
    ]

def field_table(rows, col1w=5*cm):
    data = [[Paragraph(f'<b>{k}</b>', ParagraphStyle('FTK', fontSize=9, fontName='Helvetica-Bold', leading=13)),
             Paragraph(v, ParagraphStyle('FTV', fontSize=9, fontName='Courier', leading=13, textColor=colors.HexColor("#1e293b")))]
            for k,v in rows]
    t = Table(data, colWidths=[col1w, W - 4*cm - col1w - 0.2*cm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), LIGHT_GRAY),
        ('BACKGROUND', (0,0), (0,-1), colors.HexColor("#E0E7FF")),
        ('ROWBACKGROUNDS', (0,0), (-1,-1), [LIGHT_GRAY, WHITE]),
        ('GRID', (0,0), (-1,-1), 0.4, colors.HexColor("#D1D5DB")),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    return [t, sp(8)]

def api_table(rows):
    header = [Paragraph('<b>Method</b>', ParagraphStyle('AT', fontSize=9, fontName='Helvetica-Bold', textColor=WHITE, leading=12)),
              Paragraph('<b>Endpoint</b>', ParagraphStyle('AT', fontSize=9, fontName='Helvetica-Bold', textColor=WHITE, leading=12)),
              Paragraph('<b>Description</b>', ParagraphStyle('AT', fontSize=9, fontName='Helvetica-Bold', textColor=WHITE, leading=12))]
    data = [header]
    for method, ep, desc in rows:
        mc = GREEN if method == 'GET' else (BLUE if method in ('POST','PUT') else RED)
        data.append([
            Paragraph(f'<font color="#{mc.hexval()[1:]}"><b>{method}</b></font>', ParagraphStyle('M', fontSize=9, fontName='Helvetica-Bold', leading=12)),
            Paragraph(f'<font name="Courier" size="8">{ep}</font>', ParagraphStyle('EP', fontSize=9, fontName='Courier', leading=12)),
            Paragraph(desc, ParagraphStyle('D', fontSize=9, fontName='Helvetica', leading=12)),
        ])
    t = Table(data, colWidths=[1.5*cm, 6.5*cm, W - 4*cm - 8.2*cm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), BLUE),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [LIGHT_GRAY, WHITE]),
        ('GRID', (0,0), (-1,-1), 0.4, colors.HexColor("#D1D5DB")),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    return [t, sp(8)]

def firestore_table(rows):
    header = [Paragraph('<b>Collection</b>', ParagraphStyle('FH', fontSize=9, fontName='Helvetica-Bold', textColor=WHITE, leading=12)),
              Paragraph('<b>Filter</b>', ParagraphStyle('FH', fontSize=9, fontName='Helvetica-Bold', textColor=WHITE, leading=12)),
              Paragraph('<b>Used In</b>', ParagraphStyle('FH', fontSize=9, fontName='Helvetica-Bold', textColor=WHITE, leading=12))]
    data = [header]
    for col, filt, used in rows:
        data.append([
            Paragraph(f'<font name="Courier" size="8">{col}</font>', ParagraphStyle('FC', fontSize=9, fontName='Courier', leading=12)),
            Paragraph(filt, ParagraphStyle('FF', fontSize=9, fontName='Helvetica', leading=12)),
            Paragraph(used, ParagraphStyle('FU', fontSize=9, fontName='Helvetica', leading=12)),
        ])
    t = Table(data, colWidths=[4*cm, 5*cm, W - 4*cm - 9.2*cm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), DARK_BLUE),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [LIGHT_GRAY, WHITE]),
        ('GRID', (0,0), (-1,-1), 0.4, colors.HexColor("#D1D5DB")),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    return [t, sp(8)]

# ─────────────────────────────────────────────
# BUILD DOCUMENT
# ─────────────────────────────────────────────
story = []

# ═══ COVER PAGE ═══
story += [sp(60)]
cover_bg_table = Table(
    [[Paragraph("INVENTRA", cover_title)],
     [Paragraph("Inventory Management System", cover_sub)],
     [sp(6)],
     [Paragraph('"No more paper book, your stock is safe here"', cover_tag)],
     [sp(20)],
     [Paragraph("Comprehensive Backend & Architecture Documentation", ParagraphStyle('CS', fontSize=13, textColor=colors.HexColor("#A5C0FF"), alignment=TA_CENTER, fontName='Helvetica'))],
     [sp(4)],
     [Paragraph("Version 1.0.0  |  Wonderfall Systems  |  React Native + Firebase", ParagraphStyle('CV', fontSize=11, textColor=colors.HexColor("#8AABFF"), alignment=TA_CENTER, fontName='Helvetica'))],
     ],
    colWidths=[W - 4*cm],
    style=[('BACKGROUND', (0,0), (-1,-1), BLUE),
           ('TOPPADDING', (0,0), (-1,-1), 12),
           ('BOTTOMPADDING', (0,0), (-1,-1), 12),
           ('LEFTPADDING', (0,0), (-1,-1), 20),
           ('RIGHTPADDING', (0,0), (-1,-1), 20),
           ('BOX', (0,0), (-1,-1), 2, DARK_BLUE),
           ])
story.append(cover_bg_table)
story.append(PageBreak())

# ═══ TABLE OF CONTENTS ═══
story += section_header("Table of Contents")
toc_entries = [
    ("1.", "Project Overview & Tech Stack"),
    ("2.", "Authentication Flow"),
    ("3.", "Firestore Data Models"),
    ("4.", "Application Screens & Features"),
    ("5.", "Notification System"),
    ("6.", "Firebase Storage"),
    ("7.", "Navigation Structure"),
    ("8.", "State Management"),
    ("9.", "Firestore Operations Reference"),
    ("10.", "Recommended Backend API Design"),
    ("11.", "Security Considerations"),
    ("12.", "Responsive Design & Device Support"),
]
toc_data = [[Paragraph(n, toc_num), Paragraph(t, toc_style)] for n, t in toc_entries]
toc_t = Table(toc_data, colWidths=[1.2*cm, W - 4*cm - 1.4*cm])
toc_t.setStyle(TableStyle([
    ('ROWBACKGROUNDS', (0,0), (-1,-1), [LIGHT_BLUE, WHITE]),
    ('TOPPADDING', (0,0), (-1,-1), 7),
    ('BOTTOMPADDING', (0,0), (-1,-1), 7),
    ('LEFTPADDING', (0,0), (-1,-1), 8),
    ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ('GRID', (0,0), (-1,-1), 0.3, colors.HexColor("#D1D5DB")),
]))
story.append(toc_t)
story.append(PageBreak())

# ═══ SECTION 1: PROJECT OVERVIEW ═══
story += section_header("1. Project Overview & Tech Stack")
story += [Paragraph("1.1 About Inventra", h2)]
story += info_box(
    "<b>Inventra</b> is a mobile-first inventory management system built for small Nigerian businesses. "
    "It targets retail shop owners and service business operators, enabling them to digitise their stock management, "
    "track sales, view financial analytics, manage customer debts, and receive intelligent real-time alerts — "
    "all from their smartphone. The app replaces traditional paper-based stock books."
)
story += [Paragraph("Key Project Facts", h3)]
story += field_table([
    ("App Name", "Inventra"),
    ("Tagline", "No more paper book, your stock is safe here"),
    ("Developer", "Wonderfall Systems"),
    ("Platform", "React Native (Expo) — Android & iOS"),
    ("Version", "1.0.0"),
    ("App Scheme", "inventra://"),
    ("Bundle ID (iOS)", "INVENTRA2.W"),
    ("Package (Android)", "INVENTRA2.W"),
    ("EAS Project ID", "a3a734b6-9f27-4308-b090-5f7524398726"),
    ("Firebase Project ID", "wonderfall-be388"),
    ("Primary Currency", "Nigerian Naira (₦)"),
    ("Default Country Code", "+234 (Nigeria)"),
    ("Primary Color", "#1155CC (Blue)"),
    ("Font Family", "Poppins (Regular, Medium, SemiBold, Bold, Light)"),
])

story += [Paragraph("1.2 Tech Stack", h2)]

story += [Paragraph("Frontend Framework", h3)]
story += field_table([
    ("Runtime", "React Native 0.81.5"),
    ("Framework", "Expo ~54.0.32"),
    ("Language", "TypeScript"),
    ("Navigation", "expo-router v6 (file-based routing) + React Navigation v7"),
    ("State Mgmt", "Zustand v5 (global) + useState (local)"),
    ("Fonts", "@expo-google-fonts/poppins"),
    ("Charts", "react-native-chart-kit (LineChart for Finance screen)"),
    ("PDF Export", "expo-print + expo-sharing"),
    ("Images", "expo-image-picker + react-native-image-picker"),
    ("Secure Storage", "expo-secure-store"),
    ("Local Storage", "@react-native-async-storage/async-storage"),
    ("Camera", "expo-camera (barcode scanning)"),
    ("Gradients", "expo-linear-gradient"),
    ("Vector Icons", "@expo/vector-icons (Ionicons, Feather, MaterialIcons)"),
])

story += [Paragraph("Backend Services (Firebase)", h3)]
story += field_table([
    ("Authentication", "Firebase Authentication — Phone OTP (PhoneAuthProvider + reCAPTCHA)"),
    ("Database", "Cloud Firestore (NoSQL, real-time)"),
    ("File Storage", "Firebase Storage (images)"),
    ("Auth Persistence", "Platform-aware: browserLocalPersistence (web), default (native)"),
])

story.append(PageBreak())

# ═══ SECTION 2: AUTHENTICATION FLOW ═══
story += section_header("2. Authentication Flow")
story += info_box(
    "Inventra uses <b>Firebase Phone Authentication</b> exclusively — no email/password. "
    "Users authenticate via a one-time password (OTP) sent via SMS. "
    "On first login, users are prompted to select their business type before entering the main app. "
    "Authentication state is persisted across app restarts."
)

story += [Paragraph("2.1 Auth Flow Overview", h2)]
story += [Paragraph("The complete authentication flow follows these steps:", body)]
steps = [
    ("Step 1", "App Launch → Splash Screen (Onboarding1)", "Displays Inventra branding for 5 seconds then auto-redirects to WelcomeScreen. Background is #1155CC blue."),
    ("Step 2", "WelcomeScreen — Phone Number Entry", "User enters their phone number. The app defaults to Nigerian numbers (+234). A Firebase reCAPTCHA verifier is initialized. On submit, Firebase sends an OTP via SMS."),
    ("Step 3", "VerificationScreen — OTP Confirmation", "User enters the 6-digit OTP received by SMS into individual digit boxes. On success, the user is signed into Firebase Auth and redirected to the main app."),
    ("Step 4", "BusinessSelectionScreen — First-Time Setup", "On first login, user selects their business type (Retail Shop or Service Business). This is saved to AsyncStorage. User is then sent to the Home screen."),
]
steps_data = [[Paragraph(f'<b>{s}</b>', ParagraphStyle('SN', fontSize=10, fontName='Helvetica-Bold', textColor=WHITE, leading=14)),
               Paragraph(f'<b>{t}</b>', ParagraphStyle('ST', fontSize=10, fontName='Helvetica-Bold', leading=14)),
               Paragraph(d, ParagraphStyle('SD', fontSize=9, fontName='Helvetica', leading=13))]
              for s, t, d in steps]
steps_t = Table(steps_data, colWidths=[2*cm, 5*cm, W - 4*cm - 7.2*cm])
steps_t.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (0,-1), BLUE),
    ('ROWBACKGROUNDS', (0,0), (-1,-1), [LIGHT_BLUE, WHITE, LIGHT_BLUE, WHITE]),
    ('BACKGROUND', (0,0), (0,-1), BLUE),
    ('GRID', (0,0), (-1,-1), 0.4, colors.HexColor("#D1D5DB")),
    ('TOPPADDING', (0,0), (-1,-1), 7),
    ('BOTTOMPADDING', (0,0), (-1,-1), 7),
    ('LEFTPADDING', (0,0), (-1,-1), 7),
    ('RIGHTPADDING', (0,0), (-1,-1), 7),
    ('VALIGN', (0,0), (-1,-1), 'TOP'),
]))
story += [steps_t, sp(10)]

story += [Paragraph("2.2 Phone Number Validation", h2)]
story += [Paragraph("The WelcomeScreen applies the following phone number processing:", body)]
story += [
    Paragraph("• <b>Strip:</b> All spaces, dashes, brackets removed from input", bullet),
    Paragraph("• <b>Prefix:</b> If number doesn't start with '+', leading '0' is removed and '+234' is prepended (Nigerian default)", bullet),
    Paragraph("• <b>Validate:</b> Regex <font name='Courier'>/^\\+[1-9]\\d{6,14}$/</font> must match", bullet),
    Paragraph("• <b>Max length:</b> 17 characters in the input field", bullet),
    sp(6),
]

story += [Paragraph("2.3 OTP Verification Details", h2)]
story += field_table([
    ("Code Length", "6 digits"),
    ("Resend Timer", "45 seconds countdown before resend is allowed"),
    ("Input Behavior", "Auto-focus next box on digit entry; auto-focus prev on backspace"),
    ("Credential Type", "PhoneAuthProvider.credential(verificationId, code)"),
    ("Sign-in Method", "signInWithCredential(auth, credential)"),
    ("On Success Route", "/(Main)/Home"),
])

story += [Paragraph("2.4 Error Codes Handled", h2)]
errors = [
    ("auth/too-many-requests", "Too many attempts. Please try again later."),
    ("auth/invalid-phone-number", "Invalid phone number. Please check and try again."),
    ("auth/quota-exceeded", "SMS quota exceeded. Please try again later."),
    ("auth/app-not-authorized", "App not authorized to use Firebase Authentication."),
    ("auth/web-storage-unsupported", "Web storage is not supported or disabled."),
    ("auth/invalid-verification-code", "Invalid verification code. Please check and try again."),
    ("auth/code-expired", "Verification code has expired. Please request a new one."),
    ("auth/session-expired", "Session expired. Please go back and try again."),
]
err_data = [[Paragraph(f'<font name="Courier" size="8">{code}</font>', ParagraphStyle('EC', fontSize=9, fontName='Courier', leading=12)),
             Paragraph(msg, ParagraphStyle('EM', fontSize=9, fontName='Helvetica', leading=12))]
            for code, msg in errors]
err_t = Table([[Paragraph('<b>Error Code</b>', ParagraphStyle('EH', fontSize=9, fontName='Helvetica-Bold', textColor=WHITE, leading=12)),
               Paragraph('<b>User-Facing Message</b>', ParagraphStyle('EH', fontSize=9, fontName='Helvetica-Bold', textColor=WHITE, leading=12))]] + err_data,
             colWidths=[6*cm, W - 4*cm - 6.2*cm])
err_t.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), BLUE),
    ('ROWBACKGROUNDS', (0,1), (-1,-1), [LIGHT_GRAY, WHITE]),
    ('GRID', (0,0), (-1,-1), 0.4, colors.HexColor("#D1D5DB")),
    ('TOPPADDING', (0,0), (-1,-1), 5),
    ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ('LEFTPADDING', (0,0), (-1,-1), 6),
    ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
]))
story += [err_t, sp(8)]

story += [Paragraph("2.5 Auth State Guard (_layout.tsx)", h2)]
story += [Paragraph("The root layout implements a navigation guard that runs on every app load:", body)]
story += [
    Paragraph("• If <b>authenticated</b> and not in Main/Routes → redirect to <font name='Courier'>/(Main)/Home</font>", bullet),
    Paragraph("• If <b>not authenticated</b> and in Main/Routes (protected) → redirect to <font name='Courier'>/Onboarding1</font>", bullet),
    Paragraph("• If <b>not authenticated</b> and no segments → redirect to <font name='Courier'>/Onboarding1</font>", bullet),
    Paragraph("• If <b>authenticated</b> and no segments → redirect to <font name='Courier'>/(Main)/Home</font>", bullet),
    Paragraph("• The guard waits for both font loading and auth state resolution before navigating (prevents flashes)", bullet),
    sp(6),
]

story += [Paragraph("2.6 Business Selection", h2)]
business_options = [
    ("retail", "Retail Shop", "For supermarkets, provision stores, boutiques, pharmacies, and other product sellers."),
    ("service", "Service Business", "For salons, barbers, tailors, mechanics, and similar service providers."),
]
bo_data = [[Paragraph('<b>ID</b>', ParagraphStyle('BH', fontSize=9, fontName='Helvetica-Bold', textColor=WHITE)),
            Paragraph('<b>Title</b>', ParagraphStyle('BH', fontSize=9, fontName='Helvetica-Bold', textColor=WHITE)),
            Paragraph('<b>Description</b>', ParagraphStyle('BH', fontSize=9, fontName='Helvetica-Bold', textColor=WHITE))]]
for bid, bt, bd in business_options:
    bo_data.append([
        Paragraph(f'<font name="Courier">{bid}</font>', ParagraphStyle('BI', fontSize=9, fontName='Courier', leading=12)),
        Paragraph(f'<b>{bt}</b>', ParagraphStyle('BTI', fontSize=9, fontName='Helvetica-Bold', leading=12)),
        Paragraph(bd, ParagraphStyle('BD', fontSize=9, fontName='Helvetica', leading=12)),
    ])
bo_t = Table(bo_data, colWidths=[2*cm, 3.5*cm, W - 4*cm - 5.7*cm])
bo_t.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), DARK_BLUE),
    ('ROWBACKGROUNDS', (0,1), (-1,-1), [LIGHT_BLUE, WHITE]),
    ('GRID', (0,0), (-1,-1), 0.4, colors.HexColor("#D1D5DB")),
    ('TOPPADDING', (0,0), (-1,-1), 6),
    ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ('LEFTPADDING', (0,0), (-1,-1), 6),
    ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ('VALIGN', (0,0), (-1,-1), 'TOP'),
]))
story += [bo_t, sp(8)]
story += info_box("On finish, the app writes <font name='Courier'>businessType</font> and <font name='Courier'>hasCompletedOnboarding=true</font> to AsyncStorage, then navigates to <font name='Courier'>/(Main)/Home</font>.")
story.append(PageBreak())

# ═══ SECTION 3: FIRESTORE DATA MODELS ═══
story += section_header("3. Firestore Data Models")
story += info_box(
    "Inventra uses Cloud Firestore as its primary database. All collections use Firebase Auth UIDs as the primary "
    "user isolation key. Every query that retrieves user data filters by <font name='Courier'>userId == auth.currentUser.uid</font>."
)

story += [Paragraph("3.1 Collection: users", h2)]
story += [Paragraph("Stores business owner profile information. Document ID = Firebase Auth UID.", body)]
users_fields = [
    ("name", "string", "Business owner / display name"),
    ("businessName", "string", "Business name"),
    ("phone", "string", "Phone number (e.g. +2348012345678)"),
    ("phoneNumber", "string", "Alternative phone field"),
    ("businessType", "string", '"retail" or "service"'),
    ("profileImage", "string", "URL to Firebase Storage image"),
    ("displayName", "string", "Alternative name field"),
]
users_data = [[Paragraph('<b>Field</b>', ParagraphStyle('UH', fontSize=9, fontName='Helvetica-Bold', textColor=WHITE)),
               Paragraph('<b>Type</b>', ParagraphStyle('UH', fontSize=9, fontName='Helvetica-Bold', textColor=WHITE)),
               Paragraph('<b>Description</b>', ParagraphStyle('UH', fontSize=9, fontName='Helvetica-Bold', textColor=WHITE))]]
for f, t, d in users_fields:
    users_data.append([
        Paragraph(f'<font name="Courier">{f}</font>', ParagraphStyle('UF', fontSize=9, fontName='Courier', leading=12)),
        Paragraph(f'<font name="Courier">{t}</font>', ParagraphStyle('UT', fontSize=9, fontName='Courier', leading=12, textColor=DARK_BLUE)),
        Paragraph(d, ParagraphStyle('UD', fontSize=9, fontName='Helvetica', leading=12)),
    ])
ut = Table(users_data, colWidths=[3.5*cm, 2.5*cm, W - 4*cm - 6.2*cm])
ut.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), BLUE),
    ('ROWBACKGROUNDS', (0,1), (-1,-1), [LIGHT_GRAY, WHITE]),
    ('GRID', (0,0), (-1,-1), 0.4, colors.HexColor("#D1D5DB")),
    ('TOPPADDING', (0,0), (-1,-1), 5),
    ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ('LEFTPADDING', (0,0), (-1,-1), 6),
    ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
]))
story += [ut, sp(10)]

story += [Paragraph("3.2 Collection: products", h2)]
story += [Paragraph("Stores inventory products. Document ID = Auto-generated Firestore ID.", body)]
products_fields = [
    ("userId", "string", "Firebase Auth UID of the owner — used for all queries"),
    ("name", "string", "Product name (required)"),
    ("category", "string", "One of: Foodstuffs, Soft Drinks, Beverages, Noodles & Pasta, Snacks & Biscuits"),
    ("barcode", "string", "SKU or barcode string"),
    ("image", "object|null", "{ uri: string (Storage URL), type?, fileName?, fileSize? } — nullable"),
    ("quantityType", "string", '"Single Items" or "Cartons"'),
    ("unitsInStock", "number", "Current units in stock. Decremented on each sale."),
    ("costPrice", "number", "Cost price per unit in Naira (₦)"),
    ("sellingPrice", "number", "Selling price per unit in Naira (₦)"),
    ("lowStockThreshold", "number", "Alert threshold — notification fired when stock falls to or below this"),
    ("expiryDate", "string", "ISO date string. Used for expiry alerts."),
    ("supplier.name", "string", "Supplier contact name"),
    ("supplier.phone", "string", "Supplier phone number"),
    ("dateAdded", "string", "ISO date string — when product was added"),
    ("createdAt", "Timestamp", "Firestore server timestamp"),
    ("unitsPerCarton", "number", "[Cartons only] Units per carton"),
    ("numberOfCartons", "number", "[Cartons only] Number of cartons"),
    ("costPricePerCarton", "number", "[Cartons only] Cost per carton"),
    ("sellingPricePerCarton", "number", "[Cartons only] Selling price per carton"),
    ("sellingPricePerUnit", "number", "[Cartons only] Derived per-unit selling price"),
]
prod_data = [[Paragraph('<b>Field</b>', ParagraphStyle('PH', fontSize=9, fontName='Helvetica-Bold', textColor=WHITE)),
              Paragraph('<b>Type</b>', ParagraphStyle('PH', fontSize=9, fontName='Helvetica-Bold', textColor=WHITE)),
              Paragraph('<b>Description</b>', ParagraphStyle('PH', fontSize=9, fontName='Helvetica-Bold', textColor=WHITE))]]
for f, t, d in products_fields:
    prod_data.append([
        Paragraph(f'<font name="Courier" size="8">{f}</font>', ParagraphStyle('PF', fontSize=8, fontName='Courier', leading=11)),
        Paragraph(f'<font name="Courier" size="8">{t}</font>', ParagraphStyle('PT', fontSize=8, fontName='Courier', leading=11, textColor=DARK_BLUE)),
        Paragraph(d, ParagraphStyle('PD', fontSize=9, fontName='Helvetica', leading=12)),
    ])
pt = Table(prod_data, colWidths=[4.2*cm, 2.5*cm, W - 4*cm - 6.9*cm])
pt.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), BLUE),
    ('ROWBACKGROUNDS', (0,1), (-1,-1), [LIGHT_GRAY, WHITE]),
    ('GRID', (0,0), (-1,-1), 0.4, colors.HexColor("#D1D5DB")),
    ('TOPPADDING', (0,0), (-1,-1), 4),
    ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ('LEFTPADDING', (0,0), (-1,-1), 5),
    ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ('VALIGN', (0,0), (-1,-1), 'TOP'),
]))
story += [pt, sp(10)]
story.append(PageBreak())

story += [Paragraph("3.3 Collection: sales", h2)]
story += [Paragraph("Records every completed sale transaction. Document ID = Auto-generated Firestore ID.", body)]
sales_fields = [
    ("userId", "string", "Firebase Auth UID of the seller"),
    ("items", "array", "Array of sold item objects (see sub-fields below)"),
    ("items[].productId", "string", "Reference to the products collection document"),
    ("items[].productName", "string", "Product name at time of sale (denormalized)"),
    ("items[].quantity", "number", "Quantity sold"),
    ("items[].unitPrice", "number", "Selling price per unit at time of sale"),
    ("items[].costPrice", "number", "Cost price per unit at time of sale"),
    ("items[].totalPrice", "number", "unitPrice × quantity"),
    ("items[].profit", "number", "(unitPrice - costPrice) × quantity"),
    ("totalAmount", "number", "Sum of all items' totalPrice values"),
    ("paymentMethod", "string", '"Cash" | "Transfer" | "POS" | "Credit (Debtor)"'),
    ("timestamp", "Timestamp", "Firestore server timestamp (serverTimestamp())"),
    ("date", "string", "ISO date string (client-generated)"),
    ("debtorDetails", "object", "[Credit only] { customerName, phoneNumber, amountOwed: number, notes }"),
]
sales_data = [[Paragraph('<b>Field</b>', ParagraphStyle('SH2', fontSize=9, fontName='Helvetica-Bold', textColor=WHITE)),
               Paragraph('<b>Type</b>', ParagraphStyle('SH2', fontSize=9, fontName='Helvetica-Bold', textColor=WHITE)),
               Paragraph('<b>Description</b>', ParagraphStyle('SH2', fontSize=9, fontName='Helvetica-Bold', textColor=WHITE))]]
for f, t, d in sales_fields:
    sales_data.append([
        Paragraph(f'<font name="Courier" size="8">{f}</font>', ParagraphStyle('SF', fontSize=8, fontName='Courier', leading=11)),
        Paragraph(f'<font name="Courier" size="8">{t}</font>', ParagraphStyle('ST2', fontSize=8, fontName='Courier', leading=11, textColor=DARK_BLUE)),
        Paragraph(d, ParagraphStyle('SD2', fontSize=9, fontName='Helvetica', leading=12)),
    ])
st2 = Table(sales_data, colWidths=[4.5*cm, 2.5*cm, W - 4*cm - 7.2*cm])
st2.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), BLUE),
    ('ROWBACKGROUNDS', (0,1), (-1,-1), [LIGHT_GRAY, WHITE]),
    ('GRID', (0,0), (-1,-1), 0.4, colors.HexColor("#D1D5DB")),
    ('TOPPADDING', (0,0), (-1,-1), 4),
    ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ('LEFTPADDING', (0,0), (-1,-1), 5),
    ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ('VALIGN', (0,0), (-1,-1), 'TOP'),
]))
story += [st2, sp(8)]
story += info_box("⚠️  <b>Legacy data structure:</b> Older sale records may use flat fields (name, quantity, amount, profit, productId) instead of the items[] array. The Finance and Home screens handle both structures.")

story += [Paragraph("3.4 Collection: notifications", h2)]
story += [Paragraph("Stores all in-app notifications for each user. Document ID = Auto-generated Firestore ID.", body)]
notif_fields = [
    ("userId", "string", "Firebase Auth UID of the notification recipient"),
    ("type", "string", "Notification type — see full list below"),
    ("title", "string", "Notification title shown in the UI"),
    ("message", "string", "Detailed notification message"),
    ("time", "string", 'Human-readable relative time string (e.g., "2hr ago", "Just now")'),
    ("isRead", "boolean", "Whether the user has read this notification (default: false)"),
    ("productId", "string|null", "Reference to products collection if applicable, else null"),
    ("dateAdded", "number", "Unix timestamp in milliseconds (Date.now())"),
    ("createdAt", "Timestamp", "Firestore server timestamp"),
]
notif_types = [
    ("low_stock", "Product stock is at or below lowStockThreshold"),
    ("out_of_stock", "Product stock reached 0"),
    ("high_selling", "Product sold 20+ units in a single day"),
    ("zero_sales", "No sales recorded for today"),
    ("daily_summary", "End-of-day summary with profit total"),
    ("weekly_summary", "Weekly performance summary"),
    ("expense", "Expense recorded"),
    ("expiry", "Product expiring within 3 days"),
    ("backup", "Data backup reminder"),
    ("app_update", "New app version available"),
    ("product_added", "New product added to inventory"),
    ("sale", "Sale transaction completed"),
]
notif_data = [[Paragraph('<b>Field</b>', ParagraphStyle('NH', fontSize=9, fontName='Helvetica-Bold', textColor=WHITE)),
               Paragraph('<b>Type</b>', ParagraphStyle('NH', fontSize=9, fontName='Helvetica-Bold', textColor=WHITE)),
               Paragraph('<b>Description</b>', ParagraphStyle('NH', fontSize=9, fontName='Helvetica-Bold', textColor=WHITE))]]
for f, t, d in notif_fields:
    notif_data.append([
        Paragraph(f'<font name="Courier" size="8">{f}</font>', ParagraphStyle('NF', fontSize=8, fontName='Courier', leading=11)),
        Paragraph(f'<font name="Courier" size="8">{t}</font>', ParagraphStyle('NT', fontSize=8, fontName='Courier', leading=11, textColor=DARK_BLUE)),
        Paragraph(d, ParagraphStyle('ND', fontSize=9, fontName='Helvetica', leading=12)),
    ])
nt = Table(notif_data, colWidths=[3*cm, 2*cm, W - 4*cm - 5.2*cm])
nt.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), BLUE),
    ('ROWBACKGROUNDS', (0,1), (-1,-1), [LIGHT_GRAY, WHITE]),
    ('GRID', (0,0), (-1,-1), 0.4, colors.HexColor("#D1D5DB")),
    ('TOPPADDING', (0,0), (-1,-1), 4),
    ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ('LEFTPADDING', (0,0), (-1,-1), 5),
    ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
]))
story += [nt, sp(8)]
story += [Paragraph("Notification Types Reference:", h3)]
nt2_data = [[Paragraph('<b>Type Value</b>', ParagraphStyle('NT2H', fontSize=9, fontName='Helvetica-Bold', textColor=WHITE)),
             Paragraph('<b>Trigger Condition</b>', ParagraphStyle('NT2H', fontSize=9, fontName='Helvetica-Bold', textColor=WHITE))]]
for t, d in notif_types:
    nt2_data.append([
        Paragraph(f'<font name="Courier" size="8">{t}</font>', ParagraphStyle('NT2F', fontSize=8, fontName='Courier', leading=11)),
        Paragraph(d, ParagraphStyle('NT2D', fontSize=9, fontName='Helvetica', leading=12)),
    ])
nt2 = Table(nt2_data, colWidths=[4.5*cm, W - 4*cm - 4.7*cm])
nt2.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), DARK_BLUE),
    ('ROWBACKGROUNDS', (0,1), (-1,-1), [LIGHT_GRAY, WHITE]),
    ('GRID', (0,0), (-1,-1), 0.4, colors.HexColor("#D1D5DB")),
    ('TOPPADDING', (0,0), (-1,-1), 4),
    ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ('LEFTPADDING', (0,0), (-1,-1), 5),
    ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
]))
story += [nt2, sp(8)]
story.append(PageBreak())

# ═══ SECTION 4: SCREENS & FEATURES ═══
story += section_header("4. Application Screens & Features")

screens = [
    ("Home", "(Main)", "Dashboard overview with real-time stats",
     ["User name + profile photo (from Firestore users doc)",
      "Today's total sales (₦) — summed from sales collection",
      "Total profit (₦) — calculated from (sellingPrice - costPrice) × quantity",
      "Number of transactions",
      "Total stock left (sum of all product unitsInStock)",
      "Notification badge with recent alerts",
      "Recent sales summary list (sorted newest first)",
      '"Add Product" button opens AddProductFlow modal',
      'Notification bell navigates to NotificationsScreen',
      'Sales item tap navigates to SalesDetailScreen',
      '"View All" navigates to TotalSummaryScreen'],
     "products (userId filter) + sales (userId filter) + users/{uid} + notifications (ordered by dateAdded)"),
    ("Inventory", "(Main)", "View and manage all products",
     ["Search bar — filters products by name in real-time",
      "Filter tabs: All | In Stock | Out of Stock | Expiring (within 30 days)",
      "Filter count badges on each tab",
      "Product cards: image, name, category, stock level, price",
      "Tap product → ProductDetails screen",
      "Floating Add button → AddProductFlow modal"],
     "products (userId filter, sorted by dateAdded desc)"),
    ("Sell", "(Main)", "Point-of-sale + sales history",
     ['Tab: "All" — product grid for adding to cart (2 cols phone, 3 cols tablet)',
      'Tab: "History" — all past sales records',
      "Search products by name",
      "Add to cart with quantity controls",
      "View Cart button → Cart screen",
      "Quick Sell shortcut → QuickSellScreen"],
     "products (userId filter) + sales (userId filter)"),
    ("Finance", "(Main)", "Financial analytics and reporting",
     ["Period selector: Today / Week / Month",
      "Summary cards: Total Revenue, Total Profit, Total Expenses",
      "Daily stats: today's revenue, profit, sales count, order count",
      "Weekly line chart: Revenue vs Profit (Mon–Sun)",
      "Monthly report summary",
      "Top performing products (by quantity sold + revenue)",
      "Slow-moving stock (products by days in stock)",
      "Stock recommendations (warning/info/success)",
      "Seasonal insights",
      "PDF Report Export via expo-print + expo-sharing"],
     "sales (userId filter, all-time for aggregation)"),
    ("More", "(Main)", "Profile and settings hub",
     ["Displays user name + phone from Firestore",
      "Business Options: Business Info, Change Profile Photo → Profile",
      "App Settings: Notifications, Help Center, Privacy Policy, Settings",
      "Sign Out button → signOut(auth) → redirects to Onboarding1"],
     "users/{uid}"),
]

for screen_name, group, purpose, features, data_source in screens:
    story += sub_header(f"{screen_name} Screen ({group}/{screen_name}.tsx)")
    story += [Paragraph(f"<b>Purpose:</b> {purpose}", body)]
    story += [Paragraph(f"<b>Data Sources:</b> <font name='Courier'>{data_source}</font>", body)]
    story += [Paragraph("<b>Features:</b>", body)]
    for f in features:
        story += [Paragraph(f"  • {f}", bullet)]
    story += [sp(6)]

story.append(PageBreak())
story += sub_header("Add Product Flow (Routes/AddProductFlow.tsx)")
story += [Paragraph("<b>Type:</b> Full-screen modal overlay (controlled by 'visible' prop)", body)]
story += [Paragraph("<b>Steps:</b>", body)]
add_steps = [
    ("1", "Initial Choice", "User chooses between 'Add New Product' (fresh form) or 'Search Existing' (find product in Firestore to re-add/copy)"),
    ("2", "Basic Info", "Product Name (required), SKU/Barcode, Category (dropdown), Product Image (camera or gallery via react-native-image-picker)"),
    ("3", "Inventory Details", "Quantity Type ('Single Items' or 'Cartons'). Single: count, cost price, selling price, low stock threshold, expiry date (day/month/year). Cartons: units per carton, number of cartons, cost/selling price per carton and per unit."),
    ("4", "Supplier Info", "Supplier name and phone number"),
    ("5", "Save", "Upload image to Firebase Storage at products/{uid}/{filename}, get download URL, addDoc to products collection, trigger notifications (notifyProductAdded, checkExpiringProducts, checkLowStock)"),
]
add_data = [[Paragraph(f'<b>Step {s}</b>', ParagraphStyle('AS', fontSize=9, fontName='Helvetica-Bold', textColor=WHITE, leading=12)),
             Paragraph(t, ParagraphStyle('AT2', fontSize=9, fontName='Helvetica-Bold', leading=12)),
             Paragraph(d, ParagraphStyle('AD', fontSize=9, fontName='Helvetica', leading=12))]
            for s, t, d in add_steps]
add_t = Table(add_data, colWidths=[1.5*cm, 3.5*cm, W - 4*cm - 5.2*cm])
add_t.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (0,-1), BLUE),
    ('ROWBACKGROUNDS', (0,0), (-1,-1), [LIGHT_BLUE, WHITE, LIGHT_BLUE, WHITE, LIGHT_BLUE]),
    ('GRID', (0,0), (-1,-1), 0.4, colors.HexColor("#D1D5DB")),
    ('TOPPADDING', (0,0), (-1,-1), 7),
    ('BOTTOMPADDING', (0,0), (-1,-1), 7),
    ('LEFTPADDING', (0,0), (-1,-1), 7),
    ('RIGHTPADDING', (0,0), (-1,-1), 7),
    ('VALIGN', (0,0), (-1,-1), 'TOP'),
]))
story += [add_t, sp(8)]

story += sub_header("Checkout Screen (Routes/Checkout.tsx)")
story += [Paragraph("<b>Payment Methods:</b> Cash | Transfer | POS | Credit (Debtor)", body)]
story += [Paragraph("<b>Checkout Process:</b>", body)]
story += [
    Paragraph("1. Validate payment method and cart contents", bullet),
    Paragraph("2. If 'Credit (Debtor)': validate customerName (required), phoneNumber (required), amountOwed (required, > 0)", bullet),
    Paragraph("3. Build saleData object with items array, totalAmount, paymentMethod, timestamp, date, and optional debtorDetails", bullet),
    Paragraph("4. addDoc(collection(db, 'sales'), saleData) — creates the sale record", bullet),
    Paragraph("5. For each cart item: updateDoc(doc(db,'products',id), { unitsInStock: increment(-quantity) })", bullet),
    Paragraph("6. Show success alert and navigate back to Sell screen", bullet),
    sp(6),
]

story.append(PageBreak())

# ═══ SECTION 5: NOTIFICATION SYSTEM ═══
story += section_header("5. Notification System")
story += info_box(
    "The notification system is implemented entirely on the client side via <b>notificationHelpers.ts</b>. "
    "All notification functions write directly to the Firestore <font name='Courier'>notifications</font> collection. "
    "These helpers are called at key moments: product add, sale complete, stock changes, and app-level checks."
)

notif_funcs = [
    ("createNotification(userId, type, title, message, productId?)",
     "Core helper. Creates a document in the notifications collection with: userId, type, title, message, time (getTimeAgo), isRead=false, productId, dateAdded (Date.now()), createdAt (Timestamp.now())."),
    ("checkLowStock(userId, productId, productName, unitsInStock, lowStockThreshold)",
     "If unitsInStock === 0 → fires 'out_of_stock' notification. Else if unitsInStock <= lowStockThreshold → fires 'low_stock' notification. Called after AddProductFlow and sales operations."),
    ("notifyProductAdded(userId, productId, productName)",
     "Fires 'product_added' notification when a new product is added to inventory via AddProductFlow."),
    ("checkHighSelling(userId, productId, productName)",
     "Queries all sales for the product for today. If total units sold today >= 20 → fires 'high_selling' notification. Called after QuickSell and sales completions."),
    ("checkExpiringProducts(userId)",
     "Queries all user products. For each product with expiryDate within the next 3 days → fires 'expiry' notification with days-remaining count. Called after adding products."),
    ("generateDailySummary(userId)",
     "Queries all sales for today. If transactions > 0 → fires 'daily_summary' with profit total. If no sales → fires 'zero_sales' notification."),
    ("notifySaleCompleted(userId, totalAmount, itemCount)",
     "Fires 'sale' notification after a successful checkout, showing item count and total amount."),
]

for func_sig, desc in notif_funcs:
    story += [
        Table([[Paragraph(f'<font name="Courier" size="8">{func_sig}</font>',
                          ParagraphStyle('FS', fontSize=8, fontName='Courier', leading=12))]],
              colWidths=[W - 4*cm],
              style=[('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F0F4FF")),
                     ('BOX', (0,0), (-1,-1), 0.5, BLUE),
                     ('TOPPADDING', (0,0), (-1,-1), 6),
                     ('BOTTOMPADDING', (0,0), (-1,-1), 6),
                     ('LEFTPADDING', (0,0), (-1,-1), 8),]),
        Paragraph(desc, ParagraphStyle('FD', fontSize=9, fontName='Helvetica', leading=13, leftIndent=8)),
        sp(8),
    ]

story.append(PageBreak())

# ═══ SECTION 6: FIREBASE STORAGE ═══
story += section_header("6. Firebase Storage")
storage_paths = [
    ("profile_pictures/{userId}", "Profile photos uploaded from the Profile screen"),
    ("products/{userId}/{filename}", "Product images uploaded during AddProductFlow or EditProduct"),
]
sp_data = [[Paragraph('<b>Storage Path</b>', ParagraphStyle('SPH', fontSize=9, fontName='Helvetica-Bold', textColor=WHITE)),
            Paragraph('<b>Description</b>', ParagraphStyle('SPH', fontSize=9, fontName='Helvetica-Bold', textColor=WHITE))]]
for path, desc in storage_paths:
    sp_data.append([
        Paragraph(f'<font name="Courier">{path}</font>', ParagraphStyle('SPF', fontSize=9, fontName='Courier', leading=12)),
        Paragraph(desc, ParagraphStyle('SPD', fontSize=9, fontName='Helvetica', leading=12)),
    ])
spt = Table(sp_data, colWidths=[6*cm, W - 4*cm - 6.2*cm])
spt.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), BLUE),
    ('ROWBACKGROUNDS', (0,1), (-1,-1), [LIGHT_GRAY, WHITE]),
    ('GRID', (0,0), (-1,-1), 0.4, colors.HexColor("#D1D5DB")),
    ('TOPPADDING', (0,0), (-1,-1), 6),
    ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ('LEFTPADDING', (0,0), (-1,-1), 6),
    ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
]))
story += [spt, sp(8)]
story += [Paragraph("Upload Process:", h3)]
story += [
    Paragraph("1. <b>Fetch:</b> Get the local file URI as a Blob via <font name='Courier'>fetch(uri).blob()</font>", bullet),
    Paragraph("2. <b>Create Ref:</b> <font name='Courier'>ref(storage, 'path/to/file')</font>", bullet),
    Paragraph("3. <b>Upload:</b> <font name='Courier'>uploadBytes(fileRef, blob)</font>", bullet),
    Paragraph("4. <b>Get URL:</b> <font name='Courier'>getDownloadURL(fileRef)</font> — returns a public HTTPS URL", bullet),
    Paragraph("5. <b>Save URL:</b> The returned URL is stored in Firestore (product.image.uri or users.profileImage)", bullet),
    sp(6),
]

# ═══ SECTION 7: NAVIGATION STRUCTURE ═══
story += section_header("7. Navigation Structure")
story += info_box("Inventra uses <b>expo-router v6</b> (file-based routing). The folder/file structure directly defines the navigation hierarchy.")
nav_items = [
    ("app/index.tsx", "Entry point — redirects immediately to (Anboarding)/Onboarding1"),
    ("app/_layout.tsx", "Root Stack layout. Handles auth guard, font loading, splash screen control."),
    ("app/(Anboarding)/Onboarding1.tsx", "Branded splash screen. Shows for 5 seconds then navigates to WelcomeScreen."),
    ("app/(Auth)/_layout.tsx", "Auth stack: WelcomeScreen → VerificationScreen → BusinessSelectionScreen"),
    ("app/(Auth)/WelcomeScreen.tsx", "Phone number input and OTP send"),
    ("app/(Auth)/VerificationScreen.tsx", "6-digit OTP verification"),
    ("app/(Auth)/BusinessSelectionScreen.tsx", "First-time business type selection"),
    ("app/(Main)/_layout.tsx", "Bottom Tab Navigator (protected). 5 tabs: Home, Inventory, Sell, Finance, More"),
    ("app/(Main)/Home.tsx", "Dashboard tab"),
    ("app/(Main)/Inventory.tsx", "Product list tab"),
    ("app/(Main)/Sell.tsx", "POS + sales history tab"),
    ("app/(Main)/Finance.tsx", "Analytics + reports tab"),
    ("app/(Main)/More.tsx", "Profile hub tab"),
    ("app/(Routes)/_layout.tsx", "Stack navigator for detail/modal screens (protected)"),
    ("app/(Routes)/AddProductFlow.tsx", "Add product multi-step modal"),
    ("app/(Routes)/Cart.tsx", "Cart review screen"),
    ("app/(Routes)/Checkout.tsx", "Payment processing screen"),
    ("app/(Routes)/EditProduct.tsx", "Edit existing product"),
    ("app/(Routes)/ProductDetails.tsx", "View/delete product"),
    ("app/(Routes)/QuickSellScreen.tsx", "Fast point-of-sale"),
    ("app/(Routes)/Profile.tsx", "Business profile editor"),
    ("app/(Routes)/NotificationsScreen.tsx", "All notifications list"),
    ("app/(Routes)/NotificationDetails.tsx", "Single notification detail"),
    ("app/(Routes)/SalesDetailScreen.tsx", "Single sale detail + delete"),
    ("app/(Routes)/TotalSummaryScreen.tsx", "All sales aggregated list"),
    ("app/(Routes)/SettingsScreen.tsx", "App settings (theme, etc.)"),
    ("app/(Routes)/MessagesScreen.tsx", "Placeholder messaging UI"),
    ("app/(Routes)/HelpCenterScreen.tsx", "Help and support"),
    ("app/(Routes)/PrivacyPolicy.tsx", "In-app privacy policy"),
    ("app/(Routes)/AccountScreen.tsx", "Account management (placeholder)"),
]
nav_data = [[Paragraph('<b>File</b>', ParagraphStyle('NH2', fontSize=9, fontName='Helvetica-Bold', textColor=WHITE)),
             Paragraph('<b>Description</b>', ParagraphStyle('NH2', fontSize=9, fontName='Helvetica-Bold', textColor=WHITE))]]
for path, desc in nav_items:
    nav_data.append([
        Paragraph(f'<font name="Courier" size="7">{path}</font>', ParagraphStyle('NF2', fontSize=7, fontName='Courier', leading=10)),
        Paragraph(desc, ParagraphStyle('ND2', fontSize=9, fontName='Helvetica', leading=11)),
    ])
nav_t = Table(nav_data, colWidths=[6.5*cm, W - 4*cm - 6.7*cm])
nav_t.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), BLUE),
    ('ROWBACKGROUNDS', (0,1), (-1,-1), [LIGHT_GRAY, WHITE]),
    ('GRID', (0,0), (-1,-1), 0.4, colors.HexColor("#D1D5DB")),
    ('TOPPADDING', (0,0), (-1,-1), 4),
    ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ('LEFTPADDING', (0,0), (-1,-1), 5),
    ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ('VALIGN', (0,0), (-1,-1), 'TOP'),
]))
story += [nav_t, sp(8)]
story.append(PageBreak())

# ═══ SECTION 8: STATE MANAGEMENT ═══
story += section_header("8. State Management")
story += [Paragraph("Inventra uses a hybrid state management approach:", body)]
state_items = [
    ("Zustand (Global)", "themeStore: isDarkMode (bool), themeColor (string), toggleTheme(), setThemeColor(color). taskStore: tasks array, addTask() — currently a placeholder/unused store."),
    ("React useState (Local)", "All screen-level data is managed with useState: products, sales, notifications, loading states, form data, cart items, selected filters, etc."),
    ("AsyncStorage (Persistent Local)", "Keys: 'businessType' (retail/service), 'hasCompletedOnboarding' (true/false). Written once during BusinessSelectionScreen setup."),
    ("Firebase Auth State", "onAuthStateChanged listener in the root _layout.tsx manages the isAuthenticated boolean. Firebase SDK persists auth tokens automatically."),
    ("URL Params (Route State)", "Cart data and sale data are passed between screens as JSON-stringified route parameters (cartData, sale, productId)."),
]
for category, desc in state_items:
    story += [
        Paragraph(f"<b>{category}</b>", h3),
        Paragraph(desc, body),
        sp(4),
    ]

story.append(PageBreak())

# ═══ SECTION 9: FIRESTORE OPERATIONS REFERENCE ═══
story += section_header("9. Firestore Operations Reference")
story += [Paragraph("9.1 Read Operations", h2)]
story += firestore_table([
    ("users/{uid}", "getDoc by UID", "Home, More, Profile, Settings"),
    ("products", "where userId == uid", "Home, Inventory, Sell, Finance, QuickSell"),
    ("products", "where userId == uid (real-time)", "Home (onSnapshot), Inventory (onSnapshot), Sell (onSnapshot)"),
    ("sales", "where userId == uid", "Home, Sell, Finance, TotalSummary"),
    ("sales", "where userId == uid (real-time)", "Home (onSnapshot), TotalSummary (onSnapshot)"),
    ("notifications", "orderBy dateAdded desc (real-time)", "Home (onSnapshot), NotificationsScreen"),
    ("products/{id}", "getDoc by ID", "Cart, ProductDetails"),
    ("sales/{id}", "getDoc by ID", "SalesDetailScreen"),
])

story += [Paragraph("9.2 Write Operations", h2)]
write_rows = [
    ("Collection", "Operation", "Trigger"),
    ("products", "addDoc", "AddProductFlow — save new product"),
    ("products/{id}", "updateDoc", "EditProduct — update product fields"),
    ("products/{id}", "updateDoc (increment)", "Checkout — decrement unitsInStock by quantity sold"),
    ("products/{id}", "deleteDoc", "ProductDetails — delete product"),
    ("sales", "addDoc", "Checkout — create sale record"),
    ("sales", "addDoc", "QuickSellScreen — create quick sale"),
    ("sales/{id}", "deleteDoc", "SalesDetailScreen — delete sale"),
    ("users/{uid}", "setDoc", "Profile — create user doc if not exists"),
    ("users/{uid}", "updateDoc", "Profile — update name, profileImage, etc."),
    ("notifications", "addDoc", "All notificationHelpers functions"),
]
write_data = [[Paragraph(f'<b>{h}</b>', ParagraphStyle('WH', fontSize=9, fontName='Helvetica-Bold', textColor=WHITE)) for h in write_rows[0]]]
for col, op, trig in write_rows[1:]:
    write_data.append([
        Paragraph(f'<font name="Courier" size="8">{col}</font>', ParagraphStyle('WC', fontSize=8, fontName='Courier', leading=11)),
        Paragraph(f'<font name="Courier" size="8">{op}</font>', ParagraphStyle('WO', fontSize=8, fontName='Courier', leading=11, textColor=GREEN)),
        Paragraph(trig, ParagraphStyle('WT', fontSize=9, fontName='Helvetica', leading=12)),
    ])
wt = Table(write_data, colWidths=[4.5*cm, 3*cm, W - 4*cm - 7.7*cm])
wt.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), BLUE),
    ('ROWBACKGROUNDS', (0,1), (-1,-1), [LIGHT_GRAY, WHITE]),
    ('GRID', (0,0), (-1,-1), 0.4, colors.HexColor("#D1D5DB")),
    ('TOPPADDING', (0,0), (-1,-1), 4),
    ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ('LEFTPADDING', (0,0), (-1,-1), 5),
    ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
]))
story += [wt, sp(8)]
story.append(PageBreak())

# ═══ SECTION 10: RECOMMENDED BACKEND API DESIGN ═══
story += section_header("10. Recommended Backend API Design")
story += info_box(
    "This section provides a recommended REST API design for a backend developer building a custom server to replace or supplement Firebase. "
    "All endpoints should require a Bearer JWT token in the Authorization header (except auth endpoints). "
    "Currency is Nigerian Naira (₦). Base URL suggestion: <font name='Courier'>https://api.inventra.app/v1</font>"
)

story += [Paragraph("10.1 Authentication Endpoints", h2)]
story += api_table([
    ("POST", "/auth/send-otp", "Send OTP SMS to phone number. Body: { phoneNumber: string }"),
    ("POST", "/auth/verify-otp", "Verify OTP and return JWT access + refresh tokens. Body: { phoneNumber, code, verificationId }"),
    ("POST", "/auth/refresh-token", "Refresh JWT access token. Body: { refreshToken: string }"),
    ("POST", "/auth/logout", "Invalidate refresh token. Requires auth."),
])

story += [Paragraph("10.2 User Endpoints", h2)]
story += api_table([
    ("GET", "/users/me", "Get current user's profile. Returns: { id, name, businessName, phone, businessType, profileImageUrl }"),
    ("PUT", "/users/me", "Update profile. Body: { name?, businessName?, businessType? }"),
    ("POST", "/users/me/profile-image", "Upload profile image (multipart/form-data). Returns: { profileImageUrl }"),
    ("POST", "/users/me/business-type", "Set business type on first login. Body: { businessType: 'retail' | 'service' }"),
])

story += [Paragraph("10.3 Products Endpoints", h2)]
story += api_table([
    ("GET", "/products", "List all user's products. Query: ?filter=all|inStock|outOfStock|expiring&search=&page=&limit="),
    ("POST", "/products", "Create product. Body: full product object (see data model). Returns: created product with id."),
    ("GET", "/products/:id", "Get single product by ID."),
    ("PUT", "/products/:id", "Update product fields. Body: partial product object."),
    ("DELETE", "/products/:id", "Delete product."),
    ("POST", "/products/:id/image", "Upload product image (multipart/form-data). Returns: { imageUrl }"),
])

story += [Paragraph("10.4 Sales Endpoints", h2)]
story += api_table([
    ("GET", "/sales", "List user's sales. Query: ?period=today|week|month|all&page=&limit=&orderBy=date"),
    ("POST", "/sales", "Create new sale. Atomically decrements product stock. Body: { items[], paymentMethod, debtorDetails? }"),
    ("GET", "/sales/:id", "Get single sale by ID."),
    ("DELETE", "/sales/:id", "Delete sale record (does NOT restore stock)."),
    ("GET", "/sales/summary", "Aggregated: totalAmount, totalProfit, transactionCount for a period. Query: ?period="),
])

story += [Paragraph("10.5 Finance Endpoints", h2)]
story += api_table([
    ("GET", "/finance/summary", "Returns: { totalRevenue, totalProfit, totalExpenses, period }. Query: ?period=today|week|month"),
    ("GET", "/finance/daily-summary", "Today's stats: { revenue, profit, salesCount, orderCount, date }"),
    ("GET", "/finance/chart-data", "Weekly chart data: { labels, revenueData[], profitData[] }. Query: ?period=week|month"),
    ("GET", "/finance/top-products", "Top selling products: [{ name, quantity, revenue, profit, imageUrl }]. Query: ?limit=10"),
    ("GET", "/finance/slow-moving", "Slow moving stock: [{ name, daysInStock, quantity, imageUrl }]"),
    ("GET", "/finance/report", "Full report data for PDF generation. Query: ?period="),
])

story += [Paragraph("10.6 Notifications Endpoints", h2)]
story += api_table([
    ("GET", "/notifications", "List user's notifications ordered by dateAdded desc. Query: ?page=&limit="),
    ("PUT", "/notifications/:id/read", "Mark single notification as read."),
    ("POST", "/notifications/mark-all-read", "Mark all notifications as read."),
    ("DELETE", "/notifications/:id", "Delete a notification."),
    ("POST", "/notifications/check-low-stock", "Manually trigger low stock check for all user products."),
    ("POST", "/notifications/daily-summary", "Trigger daily summary generation."),
])

story += [Paragraph("10.7 Dashboard Endpoint", h2)]
story += api_table([
    ("GET", "/dashboard", "Single aggregated endpoint for Home screen. Returns: { user, todaySales, profit, transactions, stockLeft, recentSales[], recentNotifications[] }"),
])

story += [Paragraph("10.8 Request/Response Conventions", h2)]
story += [
    Paragraph("• <b>Authentication:</b> All protected endpoints require <font name='Courier'>Authorization: Bearer {accessToken}</font> header", bullet),
    Paragraph("• <b>Content-Type:</b> <font name='Courier'>application/json</font> for all JSON endpoints; <font name='Courier'>multipart/form-data</font> for image uploads", bullet),
    Paragraph("• <b>Error Format:</b> <font name='Courier'>{ error: { code: string, message: string } }</font>", bullet),
    Paragraph("• <b>Pagination:</b> Use <font name='Courier'>{ data: [], total, page, limit, hasMore }</font> envelope", bullet),
    Paragraph("• <b>Timestamps:</b> All timestamps in ISO 8601 format", bullet),
    Paragraph("• <b>Currency:</b> All monetary values as numbers (no formatting, no currency symbol)", bullet),
    Paragraph("• <b>User Isolation:</b> All queries must be server-side filtered by the authenticated user's ID", bullet),
    sp(6),
]
story.append(PageBreak())

# ═══ SECTION 11: SECURITY CONSIDERATIONS ═══
story += section_header("11. Security Considerations")
story += [Paragraph("11.1 Current Security Model (Firebase)", h2)]
story += info_box("⚠️  Currently the app uses the Firebase client SDK directly. ALL database access happens from the device. Proper Firestore Security Rules MUST be configured to enforce data isolation server-side.")
story += [Paragraph("Required Firestore Security Rules:", h3)]
rules_text = (
    "rules_version = '2';\n"
    "service cloud.firestore {\n"
    "  match /databases/{database}/documents {\n"
    "    match /users/{userId} {\n"
    "      allow read, write: if request.auth != null && request.auth.uid == userId;\n"
    "    }\n"
    "    match /products/{productId} {\n"
    "      allow read, write: if request.auth != null\n"
    "        && request.auth.uid == resource.data.userId;\n"
    "      allow create: if request.auth != null\n"
    "        && request.auth.uid == request.resource.data.userId;\n"
    "    }\n"
    "    match /sales/{saleId} {\n"
    "      allow read, write: if request.auth != null\n"
    "        && request.auth.uid == resource.data.userId;\n"
    "      allow create: if request.auth != null\n"
    "        && request.auth.uid == request.resource.data.userId;\n"
    "    }\n"
    "    match /notifications/{notifId} {\n"
    "      allow read, write: if request.auth != null\n"
    "        && request.auth.uid == resource.data.userId;\n"
    "      allow create: if request.auth != null;\n"
    "    }\n"
    "  }\n"
    "}"
)
story += [
    Table([[Paragraph(rules_text.replace('\n', '<br/>'), ParagraphStyle('RU', fontSize=8, fontName='Courier', leading=13))]],
          colWidths=[W - 4*cm],
          style=[('BACKGROUND', (0,0), (-1,-1), LIGHT_GRAY),
                 ('BOX', (0,0), (-1,-1), 0.8, colors.HexColor("#6B7280")),
                 ('TOPPADDING', (0,0), (-1,-1), 10),
                 ('BOTTOMPADDING', (0,0), (-1,-1), 10),
                 ('LEFTPADDING', (0,0), (-1,-1), 12),]),
    sp(8),
]

story += [Paragraph("11.2 Recommendations for Custom Backend", h2)]
story += [
    Paragraph("• <b>JWT Tokens:</b> Use short-lived access tokens (15 min) + long-lived refresh tokens (30 days)", bullet),
    Paragraph("• <b>Phone OTP:</b> Rate-limit OTP requests per phone number (max 3/hour). Store OTPs hashed.", bullet),
    Paragraph("• <b>User Isolation:</b> All Firestore/DB queries MUST filter by authenticated userId — never trust client-provided userId", bullet),
    Paragraph("• <b>Image Upload:</b> Validate file type (JPEG/PNG only), enforce max file size (5MB recommended)", bullet),
    Paragraph("• <b>Stock Decrement:</b> Use database transactions to atomically check stock + decrement (prevent overselling)", bullet),
    Paragraph("• <b>Debt Tracking:</b> Debtor details in credit sales should be accessible via a dedicated debtors endpoint for business reporting", bullet),
    Paragraph("• <b>HTTPS Only:</b> All API communication must be over HTTPS. The Android build already sets usesCleartextTraffic=true — this should be disabled for production", bullet),
    sp(6),
]

story.append(PageBreak())

# ═══ SECTION 12: RESPONSIVE DESIGN ═══
story += section_header("12. Responsive Design & Device Support")
story += [Paragraph("All screens implement custom responsive scaling to support phones and tablets:", body)]
story += field_table([
    ("Small Device", "width < 375px — fonts scaled to 90%, tighter padding"),
    ("Normal Phone", "375px ≤ width < 414px — base sizing"),
    ("Tablet", "width ≥ 768px — fonts scaled to 120%, wider padding (32px), 3-column product grids"),
    ("Base Width", "375px (iPhone SE reference)"),
    ("Base Height", "812px (iPhone X reference)"),
], col1w=3*cm)
story += [Paragraph("Scaling Functions:", h3)]
funcs = [
    ("scale(size)", "Horizontal scaling: (width / 375) × size. Capped at 1.4×–1.5× on tablets."),
    ("verticalScale(size)", "Vertical scaling: (height / 812) × size. Capped at 1.4×–1.5× on tablets."),
    ("moderateScale(size, factor=0.5)", "Balanced scaling: size + (scale(size) - size) × factor. Used for font sizes."),
    ("getFontSize(base)", "Device-aware font: 0.9× on small, 1.0× on normal, 1.15×–1.2× on tablet."),
]
for fn, desc in funcs:
    story += [Paragraph(f"<font name='Courier'>• {fn}</font> — {desc}", ParagraphStyle('SF2', fontSize=9, fontName='Helvetica', leading=14, leftIndent=10, spaceAfter=4))]

story += [sp(10), Paragraph("Platform Differences:", h3)]
story += [
    Paragraph("• <b>iOS:</b> KeyboardAvoidingView uses <font name='Courier'>behavior='padding'</font>; Safe Area handling via expo-safe-area-context", bullet),
    Paragraph("• <b>Android:</b> Adaptive icon with blue background (#1155CC); ProGuard enabled in release builds; Google Play package INVENTRA2.W", bullet),
    Paragraph("• <b>Web:</b> Static output mode; browserLocalPersistence for Firebase Auth", bullet),
    sp(6),
]

# ═══ FINAL PAGE ═══
story.append(PageBreak())
story += [sp(80)]
story += [
    Table([[Paragraph("Document End", ParagraphStyle('DE', fontSize=24, textColor=WHITE, fontName='Helvetica-Bold', alignment=TA_CENTER)),
            ],
           [Paragraph("Inventra — Backend Architecture Documentation\nVersion 1.0.0 | Wonderfall Systems",
                      ParagraphStyle('DEsub', fontSize=12, textColor=colors.HexColor("#C7D8FF"), fontName='Helvetica', alignment=TA_CENTER, leading=18)),
            ]],
          colWidths=[W - 4*cm],
          style=[('BACKGROUND', (0,0), (-1,-1), BLUE),
                 ('TOPPADDING', (0,0), (-1,-1), 20),
                 ('BOTTOMPADDING', (0,0), (-1,-1), 20),
                 ('ALIGN', (0,0), (-1,-1), 'CENTER'),
                 ('BOX', (0,0), (-1,-1), 2, DARK_BLUE),
                 ]),
]

doc.build(story)
print(f"PDF generated successfully: {OUTPUT}")
