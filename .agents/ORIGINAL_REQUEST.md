# Original User Request

## Initial Request — 2026-09-17T11:53:21Z

<USER_REQUEST>
Build and harden the backend services for ScoreMyCV to strictly enforce Stripe paywalls against unauthorized client bypasses, and implement an automated CV Quality Checker that programmatically verifies that generated/rewritten CVs meet professional ATS standards.

Working directory: c:/Users/user/Documents/AI WONDER LAND/Anti Gravity Projects/RATEMYCV
Integrity mode: development

## Requirements

### R1. Secure Backend Paywall Enforcement
- All document generation and export endpoints (/api/export/docx, /api/export/pdf, and email dispatch) must strictly require server-verified payment confirmation from Stripe before releasing complete documents.
- Entering an email address, client session ID forgery, or test mode tokens must never unlock paid assets in live environments.
- Provide a persistent backend payment status registry (e.g. database/cache/Stripe webhook) so verified purchases remain accessible to the paying candidate across devices.

### R2. Automated CV Quality & Professional Standards Engine
- Create a backend audit engine that validates rewritten CVs against enterprise ATS and recruiter benchmarks:
  1. Impact Density: Bullet points must follow the XYZ formula (Action Verb + Quantifiable Metric + Business Outcome) with minimum 40% metric saturation.
  2. Contact Integrity: Full candidate name, phone number, professional email, and location.
  3. Section Architecture: Standard ATS hierarchy (Summary, Skills Grid, Experience, Education, References).
  4. Formatting Guardrails: Strict single-column structure without graphics, text boxes, or unparseable tables.
  5. Truthful & Contextual References: Candidate references preserved without hallucinated names or phone numbers.
- Return structured diagnostic scoring (0–100) with line-by-line quality feedback and recommended revisions.

### R3. Safe Checkout & Verification Infrastructure
- Seamless Stripe Checkout session creation, customer email matching, webhook event verification (checkout.session.completed), and server-side receipt generation.

## Acceptance Criteria

### Payment Security & Paywall Integrity
- [ ] Submitting an email address in the Paywall modal does not unlock the CV preview, set paid status in storage, or grant download access.
- [ ] GET and POST requests to /api/export/docx without a verified paid Stripe session ID return 402 Payment Required.
- [ ] Client storage tokens (ratemycv_paid) cannot be granted or forged without a successful server-side Stripe verification.

### CV Quality & Standards Verification
- [ ] The backend verification pipeline scores rewritten CVs and flags any bullet points lacking measurable metrics.
- [ ] Generated Word (.docx) and PDF documents pass structural validation for single-column ATS compatibility.
- [ ] References section properly preserves candidate references and adheres to professional privacy standards.
- [ ] Automated tests verify that low-quality or malformed CVs are identified and flagged with specific actionable fixes.
</USER_REQUEST>
