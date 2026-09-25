/**
 * Centralized Payment Access Control
 * Enforces strict payment gating for CV revamp viewing and downloads.
 * Binds payment access directly to a valid session ID.
 */

export function getStoredSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  return (
    sessionStorage.getItem('ratemycv_session_id') ||
    localStorage.getItem('ratemycv_session_id') ||
    null
  );
}

export function isUserPaid(): boolean {
  if (typeof window === 'undefined') return false;
  const hasPaidFlag =
    sessionStorage.getItem('ratemycv_paid') === 'true' ||
    localStorage.getItem('ratemycv_paid') === 'true';
  const sessionId = getStoredSessionId();

  // Strict binding: Must have both the paid flag AND an associated session ID
  return Boolean(hasPaidFlag && sessionId && sessionId.trim().length > 0);
}

export function markUserPaid(sessionId: string): void {
  if (typeof window === 'undefined') return;
  const cleanSessionId = sessionId ? sessionId.trim() : '';
  if (!cleanSessionId) {
    console.warn('[paymentAccess] Refusing to mark paid without valid session ID');
    return;
  }

  sessionStorage.setItem('ratemycv_paid', 'true');
  localStorage.setItem('ratemycv_paid', 'true');
  sessionStorage.setItem('ratemycv_session_id', cleanSessionId);
  localStorage.setItem('ratemycv_session_id', cleanSessionId);
}

export function clearUserPaid(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem('ratemycv_paid');
  localStorage.removeItem('ratemycv_paid');
  sessionStorage.removeItem('ratemycv_session_id');
  localStorage.removeItem('ratemycv_session_id');
}

/**
 * Detects which payment provider issued a session ID.
 * Stripe Checkout session IDs always begin with "cs_".
 * Everything else is treated as a Paystack reference.
 */
function detectProvider(sessionId: string): 'stripe' | 'paystack' {
  return sessionId.startsWith('cs_') ? 'stripe' : 'paystack';
}

/**
 * Builds the server verification URL for the given session ID,
 * automatically routing to the correct provider endpoint.
 */
function buildVerifyUrl(sessionId: string): string {
  const provider = detectProvider(sessionId);
  if (provider === 'stripe') {
    return `/api/stripe/verify?session_id=${encodeURIComponent(sessionId)}`;
  }
  return `/api/paystack/verify?reference=${encodeURIComponent(sessionId)}`;
}

/**
 * Asynchronously checks and synchronizes payment status with the server.
 * Automatically routes to /api/stripe/verify for Stripe session IDs (cs_*)
 * and to /api/paystack/verify for Paystack references.
 */
export async function verifyAndSyncPaymentStatus(customSessionId?: string): Promise<boolean> {
  const sessionId = customSessionId || getStoredSessionId();
  if (!sessionId) {
    clearUserPaid();
    return false;
  }

  try {
    const res = await fetch(buildVerifyUrl(sessionId), {
      method: 'GET',
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (!res.ok) {
      clearUserPaid();
      return false;
    }
    const data = await res.json();
    if (data && data.verified === true) {
      markUserPaid(sessionId);
      return true;
    }
    clearUserPaid();
    return false;
  } catch (err) {
    console.error('[paymentAccess] Error verifying session status:', err);
    return false;
  }
}
