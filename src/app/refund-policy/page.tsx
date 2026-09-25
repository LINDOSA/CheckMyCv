import type { Metadata } from 'next';
import Link from 'next/link';
import { Nav } from '@/components/landing/Nav';
import { Footer } from '@/components/landing/Footer';

export const metadata: Metadata = {
  title: 'Refund Policy | CheckMyCV',
  description:
    'Understand the CheckMyCV refund policy for our digital CV scoring and export service. Learn when refunds apply and how to request one.',
  robots: { index: true, follow: true },
};

const EFFECTIVE_DATE = '25 September 2026';

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-white text-[#0f172a] flex flex-col">
      <Nav />

      <main className="wrap flex-1 py-16">
        {/* Page header */}
        <div className="max-w-[760px] mx-auto">
          <p className="sec-tag mb-3">Legal</p>
          <h1 className="text-[2.2rem] font-extrabold tracking-tight leading-tight mb-3">
            Refund Policy
          </h1>
          <p className="text-[#5b6b83] text-sm mb-10">
            Effective date: <strong>{EFFECTIVE_DATE}</strong> &nbsp;·&nbsp; Last updated:{' '}
            <strong>{EFFECTIVE_DATE}</strong>
          </p>

          <div className="prose-policy">
            {/* 1. Overview */}
            <Section number="1" title="Overview">
              <p>
                CheckMyCV (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) provides a
                digital CV scoring, quality audit, and document export service. Because our product
                delivers <strong>instant digital goods</strong> (scored reports, ATS-optimised
                DOCX/PDF exports, and email dispatch), our refund policy is specific about when
                refunds apply.
              </p>
              <p>
                By completing a payment you confirm that you have read and agree to this Refund
                Policy.
              </p>
            </Section>

            {/* 2. What You Pay For */}
            <Section number="2" title="What You Pay For">
              <p>
                A single one-time payment unlocks the following for your submitted CV profile:
              </p>
              <ul>
                <li>Your professional CV quality &amp; ATS audit report (0–100 score with line-by-line feedback)</li>
                <li>ATS-compliant Word document (DOCX) export</li>
                <li>ATS-compliant native-text PDF export</li>
                <li>CV delivery to your registered email address</li>
                <li>Cross-device access restoration via your email address</li>
              </ul>
              <p>
                Access is tied to your payment reference and email address and is restored
                automatically on any device.
              </p>
            </Section>

            {/* 3. No-Refund Rule */}
            <Section number="3" title="No-Refund Rule for Delivered Digital Goods">
              <p>
                Because CheckMyCV delivers <strong>instant, intangible digital content</strong>, we
                operate under a{' '}
                <strong>no-refund policy once the digital goods have been successfully accessed
                or delivered</strong>. Specifically, no refund will be issued if:
              </p>
              <ul>
                <li>Your CV score/audit report has been generated and displayed to you.</li>
                <li>Your DOCX or PDF export has been successfully downloaded or emailed.</li>
                <li>
                  You accessed your paid CV export on any device using your verified email address.
                </li>
                <li>You disagree with the feedback, score, or recommendations provided.</li>
                <li>You made a mistake in the CV content you uploaded.</li>
                <li>You changed your mind after payment.</li>
              </ul>
              <div className="note-box">
                <strong>Legal note:</strong> This is consistent with the Consumer Protection Act
                (CPA), Act 68 of 2008 (South Africa) and the Electronic Communications and
                Transactions Act (ECTA), Act 25 of 2002, which allow suppliers to restrict refunds
                on digital content that has been accessed with the consumer&rsquo;s consent.
              </div>
            </Section>

            {/* 4. Eligible Refunds */}
            <Section number="4" title="Eligible Refund Circumstances">
              <p>We will issue a <strong>full refund</strong> in the following cases:</p>
              <div className="refund-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Situation</th>
                      <th>Outcome</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        Payment was processed but <strong>no digital content was delivered</strong>{' '}
                        (export failed, email not received, access not granted)
                      </td>
                      <td><span className="badge ok">✓ Full Refund</span></td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Duplicate charge</strong> — you were charged more than once for the
                        same CV profile
                      </td>
                      <td><span className="badge ok">✓ Full Refund</span></td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Technical failure</strong> on our side preventing access for more
                        than 48 hours after payment
                      </td>
                      <td><span className="badge ok">✓ Full Refund</span></td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Unauthorised transaction</strong> — your card/account was used
                        without your consent (subject to investigation)
                      </td>
                      <td><span className="badge warn">✓ After Verification</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>We reserve the right to investigate all refund requests before processing.</p>
            </Section>

            {/* 5. How to Request */}
            <Section number="5" title="How to Request a Refund">
              <p>
                If you believe you qualify for a refund, contact us within{' '}
                <strong>7 calendar days</strong> of your payment date:
              </p>
              <div className="contact-box">
                <p>
                  📧 <strong>Email:</strong>{' '}
                  <a href="mailto:support@checkmycv.co.za">support@checkmycv.co.za</a>
                </p>
                <p>
                  📋 <strong>Subject line:</strong>{' '}
                  <code>Refund Request – [Your Payment Reference]</code>
                </p>
              </div>
              <p>Please include:</p>
              <ul>
                <li>Your full name</li>
                <li>The email address used at checkout</li>
                <li>Your Paystack payment reference number</li>
                <li>A brief description of the issue</li>
              </ul>
              <p>
                We will respond within <strong>3 business days</strong> and, where approved,
                process the refund within <strong>5–10 business days</strong> depending on your
                bank or card issuer.
              </p>
            </Section>

            {/* 6. Refund Method */}
            <Section number="6" title="Refund Method">
              <p>
                Approved refunds will be returned via the{' '}
                <strong>original payment method</strong> used at checkout (Paystack — card, EFT,
                or mobile money). We do not issue cash refunds or refunds via alternative payment
                methods.
              </p>
            </Section>

            {/* 7. Chargebacks */}
            <Section number="7" title="Chargebacks">
              <p>
                If you initiate a chargeback with your bank without first contacting us, we reserve
                the right to:
              </p>
              <ul>
                <li>Dispute the chargeback with supporting evidence of service delivery.</li>
                <li>
                  Permanently revoke access to any exports or reports associated with the disputed
                  payment.
                </li>
              </ul>
              <p>
                We encourage you to contact us first — disputes are almost always resolved faster
                directly with us than through your bank.
              </p>
            </Section>

            {/* 8. Service Availability */}
            <Section number="8" title="Service Availability">
              <p>
                We strive for 99%+ uptime but do not guarantee uninterrupted access. In the event
                of planned or unplanned downtime, access will be restored as soon as possible.
                Temporary unavailability does not constitute grounds for a refund unless the outage
                exceeds <strong>48 hours</strong> and prevents you from accessing content you have
                already paid for.
              </p>
            </Section>

            {/* 9. Changes */}
            <Section number="9" title="Changes to This Policy">
              <p>
                We may update this Refund Policy from time to time. The &ldquo;Last Updated&rdquo;
                date at the top of this page will reflect any changes. Continued use of CheckMyCV
                after changes are posted constitutes acceptance of the updated policy.
              </p>
            </Section>

            {/* 10. Contact */}
            <Section number="10" title="Contact Us">
              <p>For any questions about this policy, please reach out:</p>
              <div className="contact-box">
                <p>
                  🏢 <strong>CheckMyCV</strong>
                </p>
                <p>
                  📧{' '}
                  <a href="mailto:support@checkmycv.co.za">support@checkmycv.co.za</a>
                </p>
                <p>
                  🌐{' '}
                  <a href="https://www.checkmycv.co.za" target="_blank" rel="noopener noreferrer">
                    www.checkmycv.co.za
                  </a>
                </p>
              </div>
            </Section>

            <p className="text-[#94a3b8] text-xs mt-12 pt-8 border-t border-[#e6eaf2]">
              This Refund Policy was last reviewed on {EFFECTIVE_DATE} and is governed by the laws
              of the Republic of South Africa.
            </p>
          </div>
        </div>
      </main>

      <Footer />

      {/* Scoped styles */}
      <style>{`
        .prose-policy {
          color: #334155;
          font-size: 0.97rem;
          line-height: 1.75;
        }
        .prose-policy p {
          margin: 0 0 14px;
        }
        .prose-policy ul {
          margin: 0 0 14px 1.25rem;
          list-style: disc;
        }
        .prose-policy ul li {
          margin-bottom: 6px;
        }
        .prose-policy strong {
          color: #0f172a;
          font-weight: 600;
        }
        .prose-policy a {
          color: #2563eb;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .prose-policy a:hover {
          color: #1d4ed8;
        }
        .prose-policy code {
          background: #eff4ff;
          color: #2563eb;
          padding: 2px 7px;
          border-radius: 5px;
          font-size: 0.88em;
        }

        /* Section */
        .policy-section {
          margin-bottom: 40px;
          padding-bottom: 40px;
          border-bottom: 1px solid #e6eaf2;
        }
        .policy-section:last-of-type {
          border-bottom: none;
        }
        .policy-section-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 16px;
        }
        .policy-section-num {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          background: #eff4ff;
          color: #2563eb;
          font-weight: 800;
          font-size: 0.85rem;
          display: grid;
          place-items: center;
          flex: none;
        }
        .policy-section-title {
          font-size: 1.12rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }

        /* Note box */
        .note-box {
          background: #eff4ff;
          border-left: 3px solid #2563eb;
          border-radius: 0 10px 10px 0;
          padding: 14px 18px;
          font-size: 0.91rem;
          color: #334155;
          margin: 16px 0;
        }

        /* Contact box */
        .contact-box {
          background: #f8fafc;
          border: 1px solid #e6eaf2;
          border-radius: 12px;
          padding: 18px 20px;
          margin: 16px 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .contact-box p {
          margin: 0;
        }

        /* Table */
        .refund-table-wrap {
          overflow-x: auto;
          margin: 16px 0;
          border-radius: 12px;
          border: 1px solid #e6eaf2;
        }
        .refund-table-wrap table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.92rem;
        }
        .refund-table-wrap th {
          background: #f8fafc;
          text-align: left;
          padding: 12px 16px;
          font-weight: 700;
          color: #0f172a;
          border-bottom: 1px solid #e6eaf2;
        }
        .refund-table-wrap td {
          padding: 14px 16px;
          vertical-align: top;
          border-bottom: 1px solid #f1f5f9;
        }
        .refund-table-wrap tr:last-child td {
          border-bottom: none;
        }
        .refund-table-wrap .badge {
          width: auto;
          height: auto;
          border-radius: 99px;
          padding: 4px 12px;
          font-size: 0.8rem;
          font-weight: 700;
          white-space: nowrap;
          display: inline-block;
        }
        .refund-table-wrap .badge.ok {
          background: #dcfce7;
          color: #16a34a;
        }
        .refund-table-wrap .badge.warn {
          background: #fef3c7;
          color: #d97706;
        }
      `}</style>
    </div>
  );
}

/* ─── Sub-component ──────────────────────────────────────────── */
function Section({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="policy-section">
      <div className="policy-section-header">
        <span className="policy-section-num">{number}</span>
        <h2 className="policy-section-title">{title}</h2>
      </div>
      {children}
    </div>
  );
}
