# In-Depth Security Analysis: Backend Paywall Enforcement, Vulnerability Audit & Export Hardening

**Document**: `analysis.md`  
**Author**: Explorer 2 (Milestone 1: Secure Backend Paywall Enforcement & Registry)  
**Target Repository**: ScoreMyCV (`RATEMYCV`)  
**Scope**: `src/app/api/export/docx/route.ts`, `src/app/api/export/pdf/route.ts`, `src/app/api/email/send-cv/route.ts`, PDF generation architecture, paywall bypass audit, and HTTP 402 specifications.  
**Date**: 2026-09-17  

---

## 1. Executive Summary

ScoreMyCV aims to offer a commercial $9 ATS CV Revamp Package. However, a forensic inspection of the codebase reveals multiple critical security vulnerabilities, including:
1. **Unconditional client bypass tokens** (`unlocked_session`, `demo_*`, `test_simulated_*`) active in production without environment gating.
2. **Length fallback vulnerability** (`sessionId.length > 5`) that grants free access to any 6-character string whenever Stripe secret keys are unconfigured.
3. **Severe data privacy leak** on `GET /api/email/send-cv`, which exposes all previously dispatched candidate CVs, customer emails, invoices, and full email HTML bodies to any unauthenticated caller.
4. **Client-side paywall bypasses**, including forgeable `localStorage` flags (`ratemycv_paid`), pure CSS blur concealing unredacted DOM text, and client-side document generators (`docx` and `html2canvas` + `jsPDF`) that construct files in the browser without server authorization.
5. **Absence of server-side native text PDF generation**: `/api/export/pdf` is completely missing, while the client generates rasterized canvas JPEG screenshots inside PDFs that are unparseable by Applicant Tracking Systems (ATS).

This report details these vulnerabilities with line citations, provides the architectural design for a native text ATS PDF generator (`src/lib/pdfGenerator.ts`), formulates the exact hardening plan for all export and email endpoints, and defines standard HTTP 402 status codes, headers, and error payloads.

---

## 2. Deep Code Inspection of Existing Endpoints

### 2.1 Inspection of `src/app/api/export/docx/route.ts`

`src/app/api/export/docx/route.ts` is responsible for generating and streaming Word (.docx) documents.

#### Key Implementation Analysis:
- **Lines 10–32 (`isPaymentAuthorized`)**:
  ```typescript
  async function isPaymentAuthorized(sessionId: string | null): Promise<boolean> {
    if (!sessionId) return false;

    const allowTestBypass = process.env.ENABLE_PAYMENT_TEST_BYPASS === 'true';
    if (
      allowTestBypass &&
      (sessionId.startsWith('test_simulated_') || sessionId.startsWith('demo_'))
    ) {
      return true;
    }

    const stripe = getStripe();
    if (!stripe || !isStripeConfigured()) {
      return false;
    }

    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      return session.payment_status === 'paid';
    } catch {
      return false;
    }
  }
  ```
- **Observations & Flaws**:
  1. **Isolated Payment Verification**: The function `isPaymentAuthorized` is isolated and duplicate logic. It does NOT query a persistent payment registry (`PaymentRegistry`). If Stripe API is temporarily unavailable or rate-limited, legitimate paying customers are denied downloads.
  2. **No Ownership or Metadata Validation**: Even if a `session_id` is paid, the endpoint never verifies that the session belongs to the candidate or requested profile. An attacker possessing any valid session ID can generate arbitrary Word documents or submit arbitrary `cvText` via POST.
  3. **Inadequate Response Headers on 402**:
     ```typescript
     return NextResponse.json(
       {
         success: false,
         error: 'Payment required. Please complete the $9 CV Revamp Package checkout to export your Word document.',
       },
       { status: 402 }
     );
     ```
     Lacks standard paywall headers (`WWW-Authenticate`, `X-Paywall-Required`, `Cache-Control: no-store`), leaving caching behavior undefined.

---

### 2.2 Inspection of `src/app/api/email/send-cv/route.ts`

`src/app/api/email/send-cv/route.ts` handles emailing revamped CVs and invoices to candidates. It exhibits severe security deficiencies.

#### Key Implementation Analysis:
- **Lines 9–29 (`isPaymentAuthorized`)**:
  ```typescript
  async function isPaymentAuthorized(sessionId: string | null): Promise<boolean> {
    if (!sessionId) return false;
    if (
      sessionId.startsWith('test_simulated_') ||
      sessionId.startsWith('demo_') ||
      sessionId === 'unlocked_session'
    ) {
      return true;
    }
    if (!isStripeConfigured()) {
      return sessionId.length > 5;
    }
    const stripe = getStripe();
    if (!stripe) return false;
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      return session.payment_status === 'paid';
    } catch {
      return false;
    }
  }
  ```
- **Observations & Flaws**:
  1. **Hardcoded Bypass String `unlocked_session`**: Passing `sessionId: "unlocked_session"` immediately returns `true`, completely bypassing payment checks in ALL environments (development, staging, and production).
  2. **Unconditional `demo_` and `test_simulated_` prefix match**: Unlike `export/docx`, there is NO check for `ENABLE_PAYMENT_TEST_BYPASS === 'true'`. Any string starting with `demo_` (e.g. `demo_free`) immediately authorizes document delivery.
  3. **Length > 5 Fallback**: If Stripe secret keys are not configured or missing, `sessionId.length > 5` evaluates to `true`. An attacker sending `"123456"` or `"qwerty"` receives full service.
  4. **Arbitrary Dispatch & Document Attachment**:
     In lines 57–69, the endpoint accepts arbitrary `cvText` and `email`. An attacker exploiting the bypass tokens can trigger the server to email documents to any arbitrary email address at zero cost.

- **Lines 92–110 (`GET` Handler Data Leak)**:
  ```typescript
  export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (email) {
      const matching = emailOutbox.filter((e) => e.recipientEmail.toLowerCase() === email.toLowerCase());
      return NextResponse.json({
        success: true,
        count: matching.length,
        emails: matching,
      });
    }

    return NextResponse.json({
      success: true,
      totalSent: emailOutbox.length,
      latest: emailOutbox[emailOutbox.length - 1] || null,
    });
  }
  ```
- **Observations & Severe Threat**:
  1. **Unauthenticated Public Outbox Dump**: An unauthenticated GET request to `/api/email/send-cv` dumps the entire `emailOutbox` or the `latest` sent message, including candidate names, email addresses, invoice numbers, dollar amounts, and full HTML bodies with entire CV contents.
  2. **Targeted Candidate PII Scraping**: Anyone can query `/api/email/send-cv?email=victim@example.com` to inspect if another user has revamped their CV and retrieve their documents.

---

## 3. Comprehensive Payment Bypass & Vulnerability Catalog

The following table summarizes all identified vulnerabilities across the application:

| Vulnerability ID | Component / File | Severity | Mechanism | Impact |
|---|---|---|---|---|
| **VULN-01** | `src/app/api/email/send-cv/route.ts:14` | **CRITICAL** | Hardcoded string literal `sessionId === 'unlocked_session'` | Total payment bypass: free delivery of revamped CV and invoice. |
| **VULN-02** | `src/app/api/email/send-cv/route.ts:12-13` | **CRITICAL** | `sessionId.startsWith('test_simulated_')` and `sessionId.startsWith('demo_')` without env gate | Unconditional payment bypass in all deployment environments. |
| **VULN-03** | `src/app/api/email/send-cv/route.ts:19` | **CRITICAL** | `if (!isStripeConfigured()) return sessionId.length > 5;` | Any 6+ character token bypasses paywall if Stripe keys not present. |
| **VULN-04** | `src/app/api/email/send-cv/route.ts:92-110` | **HIGH** | Unauthenticated `GET` handler returning `emailOutbox` and `latest` | PII leak: candidate names, emails, invoices, and CV text exposed publicly. |
| **VULN-05** | `src/lib/paymentAccess.ts:6-12` | **HIGH** | Client-side `isUserPaid()` reads unverified `sessionStorage` / `localStorage` | Client-side paywall UI unlocked via simple console command: `localStorage.setItem('ratemycv_paid', 'true')`. |
| **VULN-06** | `src/components/StandardCvPaperView.tsx:646-650` | **HIGH** | DOM CSS blur (`filter blur-[5px]`) on full CV text | Complete rewritten CV text rendered directly in client DOM. Readable via browser DevTools or DOM script without paying. |
| **VULN-07** | `src/components/StandardCvPaperView.tsx:79-149` | **HIGH** | Client-side Word and PDF generators (`generateDocxBlob`, `html2canvas` + `jsPDF`) | Allows client to generate document files without contacting backend paywall. |
| **VULN-08** | `/api/export/pdf` | **MEDIUM** | Missing server endpoint; client generates non-ATS image raster PDF | No server-verified PDF export; ATS parsers cannot read client screenshot PDFs. |

---

## 4. PDF Generation Analysis & Architectural Strategy

### 4.1 Dependency Audit & Feasibility
In `package.json`:
- `jspdf`: `^4.2.1` is installed.
- `pdf-parse`: `^1.1.1` is installed.
- `docx`: `^9.7.1` is installed.

#### Why Client-Side `html2canvas` + `jsPDF` Fails ATS & Security:
1. **Raster Image vs. Native Text**: `html2canvas` rasterizes the browser DOM into a JPEG canvas, which is then stamped onto a PDF page. There is ZERO selectable or extractable text. Modern ATS systems (Workday, Taleo, Greenhouse, Lever) reject image PDFs because their text extraction engines find 0 characters.
2. **Client-Side Execution Bypasses Backend Paywall**: The generation occurs in the user's browser, so backend payment verification cannot gate the file creation.

#### Server-Side Native Text PDF Generator (`src/lib/pdfGenerator.ts`):
`jspdf` (v4.2.1) supports execution in Node.js runtime (`runtime = 'nodejs'`). It provides a direct API for vector text and primitive drawing:
- `doc.setFont('Helvetica', 'normal' | 'bold')`
- `doc.setFontSize(sizeInPt)`
- `doc.text(text, x, y)`
- `doc.splitTextToSize(text, maxWidth)`
- `doc.line(x1, y1, x2, y2)`
- `doc.addPage()`
- `doc.output('arraybuffer')` -> `Buffer.from(...)`

### 4.2 ATS-Compliant Layout Specifications for `pdfGenerator.ts`:
To comply with Milestone 1 and Milestone 3 ATS formatting standards:
1. **Geometry**: Standard A4 (`595.28 pt x 841.89 pt`). Margins: `40 pt` left, right, top, bottom. Content width: `515.28 pt`.
2. **Single-Column Linear Hierarchy**:
   - Header: Candidate Name (Bold, 18pt), Title (12pt), Contact Line (9pt: email • phone • location).
   - Section Dividers: 11pt Bold with horizontal line (`doc.line(40, y, 555, y)`).
   - Summary: Clean wrapped paragraph (10pt, line-height 14pt).
   - Experience: Job Title & Company (10.5pt Bold), Dates (9.5pt right-aligned or inline), Bullet points indented with standard bullet (`• `) and wrapped to 495pt.
   - Education: Degree & Institution (10pt Bold), Year (9.5pt).
   - Core Skills: Linear categorized listing (`Category: Skill 1, Skill 2, Skill 3`). No multi-column tables.
   - References: Clean single-column contact listing.
3. **Dynamic Pagination**:
   - Maintain active cursor `currentY`.
   - Before writing any block, check if `currentY + blockHeight > 800`.
   - If exceeded, trigger `doc.addPage()`, reset `currentY = 40`.
4. **ATS Verification**:
   - The output PDF produces valid PDF text streams (`BT ... Tj ... ET`).
   - When parsed with `pdf-parse`, all words, headers, and bullet points are cleanly extracted in linear order.

---

## 5. Implementation & Hardening Plan

### 5.1 Hardening `src/app/api/export/docx/route.ts`

1. **Remove Local Bypass Functions**:
   Delete local `isPaymentAuthorized`.
2. **Import Central Server Payment Verifier**:
   ```typescript
   import { verifyServerPayment } from '@/lib/serverPaymentVerification';
   ```
3. **Enforce Payment on both GET and POST**:
   - Extract `sessionId = searchParams.get('session_id') || req.headers.get('x-session-id')` (for GET) or `body.sessionId || searchParams.get('session_id') || req.headers.get('x-session-id')` (for POST).
   - Extract candidate email if provided.
   - Run verification:
     ```typescript
     const verification = await verifyServerPayment(sessionId, {
       customerEmail: email || undefined,
       profileId: profileId || undefined,
     });
     if (!verification.authorized) {
       return createPaymentRequiredResponse(verification.reason);
     }
     ```
4. **Generate ATS Single-Column DOCX**:
   - Construct Word document via `createDocxFromStandardCV(cvData)`.
   - Convert via `await Packer.toBuffer(doc)`.
5. **Secure Response Headers**:
   - `Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document`
   - `Content-Disposition: attachment; filename="${filename}"`
   - `Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate`
   - `Pragma: no-cache`
   - `Expires: 0`
   - `X-Payment-Verified: true`

---

### 5.2 Implementing `src/app/api/export/pdf/route.ts`

1. **Create `src/lib/pdfGenerator.ts`**:
   - Implement `generatePdfBuffer(cvData: StandardCVDocument): Promise<Buffer>`.
   - Enforce single-column ATS linear layout, Helvetica typography, automatic page-splitting, and native text operators.
2. **Create `src/app/api/export/pdf/route.ts`**:
   - Route configuration:
     ```typescript
     export const runtime = 'nodejs';
     export const dynamic = 'force-dynamic';
     ```
   - Implement `GET` and `POST` handlers matching `export/docx`.
   - Extract `sessionId` and options.
   - Verify payment via `verifyServerPayment(sessionId, ...)`.
   - If unauthorized: return standard HTTP 402 response.
   - If authorized:
     - Generate PDF buffer: `const buffer = await generatePdfBuffer(cvData)`.
     - Return `NextResponse` with:
       - `Content-Type: application/pdf`
       - `Content-Disposition: attachment; filename="${filename}"`
       - `Cache-Control: no-store, no-cache, must-revalidate`
       - `X-Payment-Verified: true`

---

### 5.3 Hardening `src/app/api/email/send-cv/route.ts`

1. **Eliminate All Bypass Logic**:
   - Completely remove `unlocked_session`, `demo_`, `test_simulated_`, and `sessionId.length > 5`.
   - Call `verifyServerPayment(sessionToCheck, { customerEmail: email, profileId })`.
   - Return standard HTTP 402 if unverified.
2. **Close the Unauthenticated GET Data Leak**:
   - Either:
     - **Option A (Preferred)**: Reject GET entirely with `405 Method Not Allowed`, or
     - **Option B (Restricted Status Lookup)**: Require `session_id` and matching `email` query parameters. Verify payment with `verifyServerPayment`. Only return delivery status for that specific verified session. Under no condition return the full `emailOutbox` array or general `latest` item.
3. **Dispatch Email**:
   - Attach verified DOCX document.
   - Attach official tax invoice.
   - Return clean response without internal memory outbox dumps.

---

### 5.4 Frontend Paywall & DOM Hardening Recommendations

To ensure defense-in-depth across client and server:
1. **DOM Redaction in `StandardCvPaperView.tsx`**:
   - When `!isPaid`, do NOT render the real rewritten experience bullets or summary in the HTML.
   - Replace real text with redacted placeholders (e.g. `"[Locked achievement bullet — Unlock $9 Executive Revamp to view full metric polish]"`).
   - This prevents text scraping via browser inspection tools.
2. **Server-Gated Downloads**:
   - Remove client-side blob generators from the UI.
   - When user clicks "Download Word (.docx)" or "Download PDF", initiate download from `/api/export/docx?session_id=...` and `/api/export/pdf?session_id=...`.
3. **Local Storage Hardening in `paymentAccess.ts`**:
   - `isUserPaid()` should not trust arbitrary localStorage flags without a corresponding valid `ratemycv_session_id`.
   - Periodic or on-mount verification call to `/api/stripe/verify?session_id=...`.

---

## 6. HTTP 402 Response Specification

All protected endpoints (`/api/export/docx`, `/api/export/pdf`, `/api/email/send-cv`) must return a consistent, standard HTTP 402 response when a request is unverified.

### 6.1 Status Code
`402 Payment Required`

### 6.2 HTTP Response Headers
```http
HTTP/1.1 402 Payment Required
Content-Type: application/json; charset=utf-8
Cache-Control: no-store, no-cache, must-revalidate, max-age=0
Pragma: no-cache
Expires: 0
WWW-Authenticate: Stripe realm="ScoreMyCV Paywall", charset="UTF-8"
X-Paywall-Required: true
X-Required-Amount: 900
X-Required-Currency: usd
```

### 6.3 Standardized JSON Error Payload
```json
{
  "success": false,
  "error": "Payment required. A verified $9 CV Revamp Package purchase is required to export or dispatch documents.",
  "code": "PAYMENT_REQUIRED",
  "status": 402,
  "checkoutUrl": "/api/stripe/checkout",
  "details": {
    "reason": "Missing, unverified, or unpaid Stripe session ID.",
    "package": "Executive ATS CV Revamp",
    "priceCents": 900,
    "priceFormatted": "$9.00 USD",
    "currency": "usd"
  }
}
```

### 6.4 Rejection Matrix
| Condition | Trigger | Status | Error Reason |
|---|---|---|---|
| No session ID provided | `sessionId == null` | `402` | `"Missing session ID or unverified payment."` |
| Unknown / Forged session ID | `sessionId = "sess_fake_123"` | `402` | `"Session not found in payment registry or Stripe."` |
| Unpaid Stripe session | `payment_status = "unpaid"` | `402` | `"Stripe checkout session has not been completed."` |
| Forged bypass token | `sessionId = "unlocked_session"` | `402` | `"Invalid session token."` |
| Fallback length trick | `sessionId = "123456"` | `402` | `"Invalid session token."` |
| Test prefix in production | `sessionId = "test_simulated_..."` | `402` | `"Test mode bypass is disabled in live environment."` |

---

## 7. Verification & Automated Testing Plan

To ensure zero regressions and forensic certainty, the following automated test cases must be implemented:

1. **Test Suite: Payment Bypass Resistance (`tests/e2e/paywall-bypass.test.ts`)**:
   - Attempt `GET /api/export/docx` without `session_id` -> expect `402`.
   - Attempt `POST /api/export/docx` with `{ sessionId: "unlocked_session" }` -> expect `402`.
   - Attempt `GET /api/export/docx?session_id=demo_12345` -> expect `402`.
   - Attempt `GET /api/export/docx?session_id=123456` -> expect `402`.
   - Attempt `GET /api/export/pdf` without `session_id` -> expect `402`.
   - Attempt `POST /api/export/pdf` with forged `sessionId` -> expect `402`.
   - Attempt `POST /api/email/send-cv` with `{ sessionId: "unlocked_session" }` -> expect `402`.
   - Attempt `POST /api/email/send-cv` with `{ sessionId: "demo_test" }` -> expect `402`.
   - Verify all 402 responses contain `X-Paywall-Required: true` header.

2. **Test Suite: Data Leak Prevention (`tests/e2e/data-leak.test.ts`)**:
   - Send `GET /api/email/send-cv` without authorization -> expect `405` or `402`.
   - Ensure response body contains 0 candidate records, 0 email addresses, and 0 invoice objects.

3. **Test Suite: Verified Export Integrity (`tests/e2e/verified-export.test.ts`)**:
   - Pre-populate mock paid record in `PaymentRegistry`.
   - Request `GET /api/export/docx?session_id=cs_test_valid_paid` -> expect `200`, valid docx binary buffer.
   - Request `GET /api/export/pdf?session_id=cs_test_valid_paid` -> expect `200`, valid PDF binary buffer.
   - Parse returned PDF buffer with `pdf-parse` -> verify candidate name, section headers, and bullet points are extracted as clean text (confirming native text ATS compatibility).
