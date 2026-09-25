# Technical Analysis: Frontend Paywall & Preview Architecture, Vulnerabilities, and Hardening Specification

**Document Version**: 1.0.0  
**Author**: Explorer 3 (Milestone 1 — Secure Backend Paywall Enforcement & Registry)  
**Date**: 2026-09-17  
**Scope**: Frontend Paywall Components, Preview DOM Security, Client Storage Forgery, and Server-Verified Export Enforcement.

---

## 1. Executive Summary

ScoreMyCV aims to monetize an automated CV rewrite and ATS optimization pass for $9.00 USD. However, a forensic inspection of the frontend codebase reveals three critical vulnerabilities that allow candidates to extract 100% of the rewritten, optimized CV without paying:
1. **Client Storage Forgery (`ratemycv_paid`)**: The application determines access solely based on a plaintext string (`localStorage.getItem('ratemycv_paid') === 'true'`). A single console command (`localStorage.setItem('ratemycv_paid', 'true')`) unlocks the entire application permanently.
2. **DOM Text Leakage Behind CSS Blur**: In `StandardCvPaperView.tsx`, the complete unredacted text of the rewritten CV (Summary, all XYZ accomplishment bullets, education, skills, and references) is rendered into the client DOM tree. The paywall is implemented merely as a CSS filter (`filter blur-[5px]`). Any visitor can extract the entire text via browser Developer Tools (`document.querySelector(...).innerText`) or by removing the blur CSS class.
3. **Client-Side Asset Generation Bypassing Server Endpoints**: When `isPaid` evaluates to true, `.docx` files are generated locally in the browser memory using the `docx` npm library, and `.pdf` files are generated locally using `html2canvas` and `jsPDF`. The server-side export route `/api/export/docx` is never invoked during normal operations, and `/api/export/pdf` does not exist.

This document presents a deep inspection of all frontend components and defines the exact technical specification for hardening the frontend against all paywall bypass vectors.

---

## 2. Component Inventory & Deep Inspection

### 2.1 `src/lib/paymentAccess.ts`
- **Purpose**: Centralized payment state accessor and mutator for the frontend.
- **Implementation**:
  ```typescript
  // src/lib/paymentAccess.ts:6-21
  export function isUserPaid(): boolean {
    if (typeof window === 'undefined') return false;
    return (
      sessionStorage.getItem('ratemycv_paid') === 'true' ||
      localStorage.getItem('ratemycv_paid') === 'true'
    );
  }

  export function markUserPaid(sessionId?: string): void {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem('ratemycv_paid', 'true');
    localStorage.setItem('ratemycv_paid', 'true');
    if (sessionId) {
      sessionStorage.setItem('ratemycv_session_id', sessionId);
    }
  }
  ```
- **Critical Flaws**:
  - `isUserPaid()` performs zero validation against the backend server or Stripe.
  - It does not check if `ratemycv_session_id` exists or matches a paid transaction in the backend registry.
  - `markUserPaid()` accepts an optional `sessionId?: string`, allowing caller code to set `ratemycv_paid = 'true'` without any session ID.

### 2.2 `src/components/StandardCvPaperView.tsx`
- **Purpose**: Renders the black-and-white ATS standard resume paper, toolbar actions, and the paywall lock overlay.
- **Key Sections**:
  - **Toolbar Actions (`lines 256-443`)**:
    - When `!isPaid`: Shows amber "Locked Preview ($9)" badge, "Unlock & Download ($9)" button, and locked download buttons for Word (.docx), PDF, Copy Text, and Edit References.
    - When `isPaid`: Renders green "Unlocked & Certified" badge, "Download Word (.docx)", "Download PDF", "Print", "Copy Text", "Invoice & Email", and "Edit References".
  - **Document Generation Handlers**:
    - `handleDownloadDocx` (`lines 79-95`):
      ```typescript
      const handleDownloadDocx = async () => {
        if (!isPaid) {
          onOpenPaywall?.();
          return;
        }
        setIsGeneratingDocx(true);
        try {
          const blob = await generateDocxBlob(editableCv);
          const filename = `${editableCv.name.replace(/\s+/g, '_')}_ATS_Resume.docx`;
          downloadBlobAsFile(blob, filename);
        } catch (err) {
          console.error('Failed to generate docx client-side, trying API fallback...', err);
          window.open(`/api/export/docx?profile=${editableCv.id}`, '_blank');
        } finally {
          setIsGeneratingDocx(false);
        }
      };
      ```
      *Observation*: Generates the `.docx` file **entirely on the client** via `generateDocxBlob(editableCv)`. The backend `/api/export/docx` is only contacted on client failure, and the fallback doesn't even provide a `session_id` query parameter!
    - `handleDownloadPdf` (`lines 98-148`):
      ```typescript
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');
      const canvas = await html2canvas(paperRef.current, { scale: 2, ... });
      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      // Renders canvas snapshot into PDF image
      pdf.save(`${editableCv.name.replace(/\s+/g, '_')}_ATS_Resume.pdf`);
      ```
      *Observation*: Generates the `.pdf` file **entirely on the client** by snapshotting the HTML element. Furthermore, this produces a raster image PDF, which is an ATS rejection risk because applicant tracking systems cannot parse text from image scans without OCR!
    - `handleCopyText` (`lines 180-218`):
      Reads directly from `editableCv` in client memory and writes all unredacted bullet points to `navigator.clipboard`.
  - **The Resume Paper DOM Structure (`lines 583-878`)**:
    - Candidate Header (Name, Title, Email, Phone, Location) is rendered at lines 596-640 without any blur or restriction.
    - Body Sections (Summary, Experience, Education, Skills, Additional Info, References) are rendered inside lines 643-878:
      ```tsx
      <div className="relative">
        <div
          className={
            !isPaid
              ? 'filter blur-[5px] select-none pointer-events-none opacity-40 transition-all duration-300'
              : ''
          }
        >
          {/* Complete cleartext of Professional Summary */}
          {/* Complete cleartext of all Experience entries & XYZ bullet points */}
          {/* Complete cleartext of Education */}
          {/* Complete cleartext of Core Skills Grid */}
          {/* Complete cleartext of Additional Info */}
          {/* Complete cleartext of Professional References */}
        </div>
        {!isPaid && (
          <div className="absolute inset-0 z-20 flex flex-col items-center ...">
            {/* Paywall Overlay UI Card */}
          </div>
        )}
      </div>
      ```
      *Observation*: The entire rewritten CV content is fully rendered in the DOM tree in plaintext, obscured only by `filter blur-[5px]`.

### 2.3 `src/components/PaywallModal.tsx`
- **Purpose**: Modal presented to users when clicking any locked action or paywall trigger.
- **Implementation**:
  - Accepts user email input (`Receipt Email`).
  - Saves email into `sessionStorage.setItem('ratemycv_customer_email', cleanEmail)`.
  - Sends POST request to `/api/stripe/checkout` with `{ email, profileId, candidateName }`.
  - Redirects browser to Stripe Checkout URL `data.url`.
- **Integrity Assessment**:
  - `PaywallModal` itself does NOT call `markUserPaid()`.
  - However, entering an email must NEVER be allowed to trigger an unlock or bypass check.
  - In `ScoreDisplay.tsx:546-548`, the `onClose` callback triggers `setIsPaid(isUserPaid())`. If a user set `localStorage.setItem('ratemycv_paid', 'true')` while viewing the modal, closing the modal unlocks the view.

### 2.4 Other Preview & Export Callers
- **`src/components/FullRewriteModal.tsx`**:
  - Renders `StandardCvPaperView` inside a scrollable modal container.
  - Passes `isPaid` boolean directly to `StandardCvPaperView`.
- **`src/components/ScoreDisplay.tsx`**:
  - Reads initial payment state via `useState(() => initialPaid ?? isUserPaid())`.
  - Listens to `window.addEventListener('storage', checkPaid)`.
  - Displays post-score prompt with "Select CV Revamp Package ($9)" when `!isPaid`, or "View Unlocked ATS Rewrite" when `isPaid`.
- **`src/app/page.tsx`**:
  - `PaymentNotification`: When URL contains `?payment=success&session_id=...`, it calls `fetch('/api/stripe/verify?session_id=...')`.
  - If `data.verified` is true, calls `markUserPaid(sessionId)`.
  - Also triggers automatic email dispatch via `/api/email/send-cv`.
- **`src/app/insights/page.tsx`**:
  - Initializes `isPaid` from `isUserPaid()`.
  - Provides "Preview ATS Rewrite" and "CV Revamp Package ($9)" buttons opening `FullRewriteModal` and `PaywallModal`.

---

## 3. Vulnerability Analysis & Proof-of-Concept Scenarios

### 3.1 Vulnerability 1: Client Storage Forgery (`ratemycv_paid`)
- **Vulnerability Class**: Insecure Client-Side Authorization / Broken Access Control (CWE-602).
- **Attack Vector**:
  1. Unauthenticated candidate uploads/pastes a CV and receives their score.
  2. Candidate opens browser DevTools console (F12) and executes:
     ```javascript
     localStorage.setItem('ratemycv_paid', 'true');
     sessionStorage.setItem('ratemycv_paid', 'true');
     window.dispatchEvent(new Event('storage'));
     ```
  3. All components across the page immediately set `isPaid = true`.
  4. The CSS blur is removed, the lock overlay disappears, and the candidate gets full access to the rewritten CV.
  5. The candidate clicks "Download Word (.docx)". Because the download is generated client-side in `StandardCvPaperView.tsx`, the browser generates and downloads the complete `.docx` file without making a single request to the backend or Stripe.

### 3.2 Vulnerability 2: Cleartext DOM Text Leakage Behind CSS Blur
- **Vulnerability Class**: Information Disclosure via DOM / Sensitive Data Exposure (CWE-200 / CWE-319).
- **Attack Vector**:
  1. Candidate arrives at the locked preview modal (`StandardCvPaperView.tsx`).
  2. Without even modifying `localStorage` or JavaScript state, the candidate opens DevTools (F12).
  3. **Method A (CSS override)**: In the DevTools Elements pane, candidate selects the blurred div and disables `filter: blur(5px)` or pastes into console:
     ```javascript
     document.querySelectorAll('.filter').forEach(el => el.style.filter = 'none');
     ```
     The full rewritten text becomes immediately visible and sharp.
  4. **Method B (Instant DOM extraction)**: In the console, the candidate executes:
     ```javascript
     console.log(document.querySelector('#ats-printable-resume-paper').innerText);
     ```
     The entire rewritten executive CV (Summary, XYZ bullet points, Skills, References) is dumped to the console as formatted plaintext, ready to be pasted into Word or LinkedIn.
  5. **Method C (React State inspection)**: Using React Developer Tools, candidate inspects the `StandardCvPaperView` or `FullRewriteModal` component and views the full `editableCv` data object.

### 3.3 Vulnerability 3: Client-Side Document Export Generation
- **Vulnerability Class**: Bypass of Server-Side Enforcement (CWE-602 / CWE-306).
- **Attack Vector**:
  - The project master plan (`PROJECT.md`) and original requirements (`ORIGINAL_REQUEST.md`) require `/api/export/docx` and `/api/export/pdf` to return `402 Payment Required` if the session is not verified by Stripe.
  - However, in the existing implementation, the client **never calls the export endpoints**:
    - `StandardCvPaperView.tsx:86` calls `generateDocxBlob(editableCv)` from `src/lib/docxGenerator.ts`.
    - `StandardCvPaperView.tsx:107` calls `html2canvas` and `jsPDF`.
  - Because generation happens in the browser's JavaScript execution context, backend payment checks on `/api/export/*` are completely bypassed.
  - Furthermore, `/api/export/pdf` does not even exist in the codebase, meaning all PDF downloads rely on `html2canvas` image rendering, violating ATS text compatibility standards.

### 3.4 Vulnerability 4: Email Endpoint Authentication Bypasses
- **Vulnerability Class**: Hardcoded Authentication Bypass / Sensitive Data Exposure (CWE-287 / CWE-200).
- **Findings in `src/app/api/email/send-cv/route.ts`**:
  - Lines 11-17 allow arbitrary unverified deliveries if `sessionId.startsWith('test_simulated_')`, `sessionId.startsWith('demo_')`, or `sessionId === 'unlocked_session'`.
  - Line 19 allows delivery for ANY string longer than 5 characters (`sessionId.length > 5`) when Stripe is not configured.
  - Lines 92-110 expose a `GET` endpoint that returns all sent emails and invoices in `emailOutbox` to unauthenticated callers.

---

## 4. Technical Specification for Frontend Hardening

To satisfy Milestone 1, the frontend must be architecturally hardened so that no client manipulation can reveal unpurchased assets or produce documents without server-side verification.

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT BROWSER                                    |
|                                                                                   |
|  [StandardCvPaperView]                                                            |
|    │                                                                              |
|    ├── if (!isVerifiedPaid):                                                      |
|    │     ├── DOM Omission Engine: Redacted/dummy bullet placeholders in DOM tree   |
|    │     └── Locked Action Buttons: Route to PaywallModal                         |
|    │                                                                              |
|    └── if (isVerifiedPaid):                                                       |
|          ├── Render Full Rewritten CV                                             |
|          ├── Download Word ──► GET /api/export/docx?session_id=<ID> ──┐           |
|          └── Download PDF  ──► GET /api/export/pdf?session_id=<ID> ───┤           |
+───────────────────────────────────────────────────────────────────────┼───────────+
                                                                        │
                                                                        ▼
                                                         +──────────────────────────+
                                                         |     BACKEND SERVICES     |
                                                         |                          |
                                                         |  Verify with Registry    |
                                                         |  If valid: Stream File   |
                                                         |  If invalid: Return 402  |
                                                         +──────────────────────────+
```

### 4.1 Eliminating DOM Text Leakage (DOM Omission & Redaction Engine)
When `isPaid` is false, the client MUST NOT insert the raw rewritten bullets or unpurchased text into the DOM tree.

#### Concrete Redaction Rules
1. **Candidate Header**:
   - Name, Title, and basic contact information remain visible (teaser).
2. **Professional Summary**:
   - First 1-2 sentences (~30 words) visible as a teaser.
   - Remaining text omitted from DOM and replaced by a structured redaction banner:
     `"[... Full executive summary locked. Unlock with the $9 CV Revamp Package ...]"`
3. **Professional Experience**:
   - **Role 1 (Latest Role)**:
     - Title, Company, and Dates visible.
     - **First bullet point only** rendered in full as proof of the high-impact XYZ rewrite.
     - All subsequent bullets for Role 1 omitted from the DOM and replaced with redacted placeholder skeleton bars or dummy text:
       `[• Quantified XYZ achievement bullet locked — 4 additional impact bullets hidden]`
   - **Roles 2+**:
     - Title, Company, and Dates visible.
     - **All bullets omitted from the DOM** and replaced with skeleton placeholder lines.
4. **Core Skills Grid**:
   - First category (e.g. 3-4 skills) visible.
   - Remaining skill categories replaced with locked/redacted badges.
5. **Education & Certifications**:
   - First qualification visible; secondary items truncated.
6. **Professional References**:
   - Names, titles, phone numbers, and emails **completely omitted from the DOM**.
   - Render: `"References and managerial contact details are certified and available upon unlocking the official ATS package."`
7. **Copy & Print Protections**:
   - `handleCopyText`: When `!isPaid`, clicking copy must NOT copy raw text; it opens the paywall modal. If invoked directly, only redacted placeholder text is copied.
   - Print CSS `@media print`: Hides resume paper when `!isPaid` or prints only the redacted preview.

### 4.2 Preventing `ratemycv_paid` Forgery (Server-Backed Client Access)
`src/lib/paymentAccess.ts` must be completely re-engineered:
1. **Remove Unverified Boolean**:
   - Do NOT trust `localStorage.getItem('ratemycv_paid') === 'true'`.
   - Instead, track:
     - `ratemycv_session_id`: The Stripe checkout session ID.
     - `ratemycv_payment_verified`: Cache of verified status timestamped with an expiry (e.g., 10 minutes).
2. **Asynchronous Verification Protocol**:
   ```typescript
   export interface ClientPaymentState {
     isPaid: boolean;
     sessionId: string | null;
     customerEmail: string | null;
     verifiedAt: number | null;
   }

   export async function checkPaymentStatus(sessionId?: string | null): Promise<boolean>;
   ```
   - Checks `sessionStorage.getItem('ratemycv_session_id')`.
   - Queries `GET /api/stripe/verify?session_id=${sessionId}`.
   - If the backend payment registry confirms `verified === true` and `paymentStatus === 'paid'`, the client sets internal state to paid.
   - If `sessionId` is missing or the backend returns `verified: false`, access is strictly false.
3. **Storage Manipulation Resilience**:
   - Even if an attacker manually modifies `sessionStorage` or `localStorage` to claim they are paid, when they click "Download Word (.docx)" or "Download PDF", the request is sent to the server with their `sessionId`.
   - Because the backend verifies the session against the persistent Payment Registry, the server responds with `402 Payment Required`, completely neutralizing any client storage spoofing.

### 4.3 Paywall Modal & Email Flow Guardrails
1. **No Instant Access on Email Entry**:
   - In `PaywallModal.tsx`, entering an email in the `Receipt Email` field and submitting the form only performs `POST /api/stripe/checkout`.
   - It MUST NEVER call `markUserPaid()` or set any paid flags.
   - Submitting an email or closing the modal must keep all CV content locked.
2. **Cross-Device Recovery Flow (Preview for M2)**:
   - Entering an email will only unlock access if the backend confirms that this email has an existing paid record in the Payment Registry. In M1, without checkout completion, the email alone confers zero access.

### 4.4 Directing All Document Exports Through Server-Verified Endpoints
1. **Eliminate Client-Side Binary Generation**:
   - In `StandardCvPaperView.tsx`, remove client-side `generateDocxBlob(editableCv)` from `handleDownloadDocx`.
   - Remove client-side `html2canvas` and `jsPDF` from `handleDownloadPdf`.
2. **Route Downloads to Backend Endpoints**:
   - **Word Document (.docx)**:
     ```typescript
     const handleDownloadDocx = async () => {
       const sessionId = getSessionId();
       if (!isPaid || !sessionId) {
         onOpenPaywall?.();
         return;
       }
       setIsGeneratingDocx(true);
       try {
         // Server endpoint verifies payment against Registry before streaming file
         const response = await fetch('/api/export/docx', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
             sessionId,
             profileId: editableCv.id,
             cvText: JSON.stringify(editableCv),
             candidateName: editableCv.name,
           }),
         });
         if (response.status === 402) {
           onOpenPaywall?.();
           throw new Error('Payment required to download Word document.');
         }
         if (!response.ok) throw new Error('Export failed.');
         const blob = await response.blob();
         downloadBlobAsFile(blob, `${editableCv.name.replace(/\s+/g, '_')}_ATS_Resume.docx`);
       } finally {
         setIsGeneratingDocx(false);
       }
     };
     ```
   - **PDF Document (.pdf)**:
     ```typescript
     const handleDownloadPdf = async () => {
       const sessionId = getSessionId();
       if (!isPaid || !sessionId) {
         onOpenPaywall?.();
         return;
       }
       setIsGeneratingPdf(true);
       try {
         // Calls new server endpoint /api/export/pdf
         const response = await fetch('/api/export/pdf', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
             sessionId,
             profileId: editableCv.id,
             cvText: JSON.stringify(editableCv),
             candidateName: editableCv.name,
           }),
         });
         if (response.status === 402) {
           onOpenPaywall?.();
           throw new Error('Payment required to download PDF document.');
         }
         if (!response.ok) throw new Error('Export failed.');
         const blob = await response.blob();
         downloadBlobAsFile(blob, `${editableCv.name.replace(/\s+/g, '_')}_ATS_Resume.pdf`);
       } finally {
         setIsGeneratingPdf(false);
       }
     };
     ```

---

## 5. Implementation Roadmap for Builders (Milestone 1)

| Step | Target File | Action Required | Responsible Agent |
|------|-------------|-----------------|-------------------|
| 1 | `src/lib/paymentAccess.ts` | Refactor to bind payment state to server-verified `sessionId` rather than an insecure `ratemycv_paid` boolean. | Builder |
| 2 | `src/components/StandardCvPaperView.tsx` | Replace CSS blur text leakage with actual DOM tree redaction/omission when `!isPaid`. | Builder |
| 3 | `src/components/StandardCvPaperView.tsx` | Route Word and PDF downloads through `/api/export/docx` and `/api/export/pdf` with `sessionId`. | Builder |
| 4 | `src/app/api/export/pdf/route.ts` | Create server-side native text ATS PDF export endpoint with strict 402 check. | Builder |
| 5 | `src/app/api/export/docx/route.ts` | Enforce strict registry-backed payment check; eliminate unauthenticated bypasses. | Builder |
| 6 | `src/app/api/email/send-cv/route.ts` | Remove bypass tokens (`demo_`, `unlocked_session`, `> 5 length`); remove unauthenticated GET leak. | Builder |
| 7 | `src/components/PaywallModal.tsx` | Verify email input does not grant paid status or bypass checks. | Builder |

---

## 6. Conclusion

The current frontend paywall design relies on client-side state flags and CSS visual styling, providing zero data security against candidate bypasses. By shifting to **DOM tree omission/redaction** for unpaid previews, **session-bound payment verification**, and **mandatory server-side export streaming**, the application will achieve 100% paywall enforcement compliance with zero leakage.
