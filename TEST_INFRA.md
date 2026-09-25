# E2E Test Infra: ScoreMyCV

## Test Philosophy
- **Opaque-Box & Requirement-Driven**: Tests are derived strictly from `ORIGINAL_REQUEST.md` (R1, R2, R3) and `PROJECT.md` acceptance criteria, treating implementation internals as black boxes.
- **Methodology**:
  - **Category-Partition**: Equivalence class partitioning across all input vectors (HTTP request headers, session tokens, email formats, CV content structures).
  - **Boundary Value Analysis (BVA)**: Probing 0%, 39%, 40%, 41%, 100% metric saturation; empty/null/whitespace strings; single vs multi-column flags; minimum phone number lengths.
  - **Pairwise Combinatorial Testing**: Systematically testing combinations of payment status (valid, forged, expired, missing) × export route (DOCX, PDF, email) × candidate profile state.
  - **Real-World Workload Testing (Tier 4)**: End-to-end user journeys including complete executive CVs, engineer CVs, paywall bypass evasion attempts, and corrupt/malformed ATS inputs.

## Feature Inventory & Test Coverage Matrix
| # | Feature | Source (Requirement) | Tier 1 (Coverage) | Tier 2 (Boundary) | Tier 3 (Pairwise) | Tier 4 (Scenario) |
|---|---------|----------------------|:-----------------:|:-----------------:|:-----------------:|:-----------------:|
| 1 | Secure DOCX Export Gating | R1, AC | ≥5 tests | ≥5 tests | ✓ | ✓ |
| 2 | Secure PDF Export Gating | R1, AC | ≥5 tests | ≥5 tests | ✓ | ✓ |
| 3 | Secure Email Dispatch Gating | R1, AC | ≥5 tests | ≥5 tests | ✓ | ✓ |
| 4 | Paywall Bypass Prevention & Token Forgery | R1, AC | ≥5 tests | ≥5 tests | ✓ | ✓ |
| 5 | Persistent Payment Registry Status | R1, R3 | ≥5 tests | ≥5 tests | ✓ | ✓ |
| 6 | Stripe Checkout Session Creation | R3, AC | ≥5 tests | ≥5 tests | ✓ | ✓ |
| 7 | Stripe Webhook Cryptographic Verification | R3, AC | ≥5 tests | ≥5 tests | ✓ | ✓ |
| 8 | XYZ Metric Saturation Engine (≥40%) | R2, AC | ≥5 tests | ≥5 tests | ✓ | ✓ |
| 9 | Contact Integrity & Professional Data Validation | R2, AC | ≥5 tests | ≥5 tests | ✓ | ✓ |
| 10 | ATS Section Architecture & Formatting Guardrails | R2, AC | ≥5 tests | ≥5 tests | ✓ | ✓ |

## Test Architecture
- **Test Runner**: Vitest (`npm test` / `npx vitest run`)
- **Execution Mode**: Node.js test environment with Next.js App Router Request/Response mocks.
- **Test File Layout**:
  - `tests/e2e/helpers/`: Mock servers, cryptographic test signature generators, CV fixtures, and request harnesses.
  - `tests/e2e/tier1-features/`: Unit & functional feature isolation tests (minimum 5 per feature, 50+ total).
  - `tests/e2e/tier2-boundaries/`: Edge cases, negative inputs, threshold boundaries, bypass attacks (50+ total).
  - `tests/e2e/tier3-combinations/`: Cross-feature combinatorial matrices (15+ total).
  - `tests/e2e/tier4-scenarios/`: High-fidelity real-world CV scenarios & adversarial workloads (10+ total).
- **Total Tests**: Target ≥125 tests, significantly surpassing the project minimum threshold (~11 * 10 + 5 = 115).

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | Full Tech Executive CV Submission & Audit | F8, F9, F10 | High |
| 2 | Malformed Junior Resume with 0% Metrics | F8, F9, F10 | Medium |
| 3 | Malicious Actor Attempting Client Token Forgery & Export | F1, F2, F3, F4, F5 | High |
| 4 | Checkout -> Webhook -> Cross-Device Restore -> PDF Export | F1, F2, F5, F6, F7 | High |
| 5 | Candidate References Preservation with Privacy Protection | F8, F10 | Medium |
| 6 | High-volume ATS Parser Layout Stress Test (Linear Single-Column) | F1, F2, F10 | High |

## Coverage Thresholds
- **Tier 1**: ≥5 per feature (Total ≥50)
- **Tier 2**: ≥5 per feature (Total ≥50)
- **Tier 3**: Pairwise coverage of major feature interactions (Total ≥15)
- **Tier 4**: ≥6 realistic application scenarios
- **Overall**: ≥125 tests with 100% pass rate.
