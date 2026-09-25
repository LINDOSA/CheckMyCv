import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'path';
import fs from 'fs/promises';
import { FilePaymentRegistry, PaymentRecord } from '@/lib/paymentRegistry';

const TEST_DB_PATH = path.resolve(process.cwd(), 'data/test-payments-registry.json');

describe('FilePaymentRegistry Unit Tests', () => {
  let registry: FilePaymentRegistry;

  beforeEach(async () => {
    try {
      await fs.unlink(TEST_DB_PATH);
    } catch {}
    registry = new FilePaymentRegistry(TEST_DB_PATH);
  });

  afterEach(async () => {
    try {
      await fs.unlink(TEST_DB_PATH);
    } catch {}
  });

  it('records and retrieves a payment record by session ID', async () => {
    const record: PaymentRecord = {
      sessionId: 'cs_test_session_100',
      customerEmail: 'alex.morgan@example.com',
      profileId: 'it_cloud',
      candidateName: 'Alex Morgan',
      paymentStatus: 'paid',
      amountCents: 900,
      currency: 'usd',
      invoiceNumber: 'INV-100-TEST',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: { package: 'revamp' },
    };

    await registry.recordPayment(record);

    const retrieved = await registry.getPaymentBySessionId('cs_test_session_100');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.sessionId).toBe('cs_test_session_100');
    expect(retrieved?.customerEmail).toBe('alex.morgan@example.com');
    expect(retrieved?.paymentStatus).toBe('paid');
    expect(retrieved?.amountCents).toBe(900);
  });

  it('normalizes email casing and trims whitespace on retrieval', async () => {
    const record: PaymentRecord = {
      sessionId: 'cs_test_session_case',
      customerEmail: '  CANDIDATE.JANE@Example.COM  ',
      profileId: 'executive',
      candidateName: 'Jane Doe',
      paymentStatus: 'paid',
      amountCents: 900,
      currency: 'usd',
      invoiceNumber: 'INV-JANE-001',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await registry.recordPayment(record);

    const matching = await registry.getPaymentsByEmail('candidate.jane@example.com');
    expect(matching.length).toBe(1);
    expect(matching[0].sessionId).toBe('cs_test_session_case');

    const matchingUpperCase = await registry.getPaymentsByEmail('   CANDIDATE.JANE@EXAMPLE.COM ');
    expect(matchingUpperCase.length).toBe(1);

    const isVerified = await registry.isEmailVerified('candidate.jane@example.com');
    expect(isVerified).toBe(true);
  });

  it('correctly evaluates isSessionVerified for paid vs unpaid vs pending', async () => {
    await registry.recordPayment({
      sessionId: 'cs_paid_1',
      customerEmail: 'paid@example.com',
      profileId: 'it_cloud',
      candidateName: 'Paid User',
      paymentStatus: 'paid',
      amountCents: 900,
      currency: 'usd',
      invoiceNumber: 'INV-PAID-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await registry.recordPayment({
      sessionId: 'cs_unpaid_1',
      customerEmail: 'unpaid@example.com',
      profileId: 'it_cloud',
      candidateName: 'Unpaid User',
      paymentStatus: 'unpaid',
      amountCents: 900,
      currency: 'usd',
      invoiceNumber: 'INV-UNPAID-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await registry.recordPayment({
      sessionId: 'cs_pending_1',
      customerEmail: 'pending@example.com',
      profileId: 'it_cloud',
      candidateName: 'Pending User',
      paymentStatus: 'pending',
      amountCents: 900,
      currency: 'usd',
      invoiceNumber: 'INV-PENDING-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    expect(await registry.isSessionVerified('cs_paid_1')).toBe(true);
    expect(await registry.isSessionVerified('cs_unpaid_1')).toBe(false);
    expect(await registry.isSessionVerified('cs_pending_1')).toBe(false);
    expect(await registry.isSessionVerified('cs_nonexistent')).toBe(false);
    expect(await registry.isSessionVerified('')).toBe(false);
  });

  it('updates existing record idempotently without duplicating entries', async () => {
    const originalTime = new Date('2026-01-01T00:00:00Z').toISOString();
    await registry.recordPayment({
      sessionId: 'cs_idempotent_test',
      customerEmail: 'same@example.com',
      profileId: 'it_cloud',
      candidateName: 'Initial Candidate',
      paymentStatus: 'pending',
      amountCents: 900,
      currency: 'usd',
      invoiceNumber: 'INV-IDEMP-01',
      createdAt: originalTime,
      updatedAt: originalTime,
      metadata: { initialKey: 'initialVal' },
    });

    // Update to paid
    await registry.recordPayment({
      sessionId: 'cs_idempotent_test',
      customerEmail: 'same@example.com',
      profileId: 'it_cloud',
      candidateName: 'Updated Candidate',
      paymentStatus: 'paid',
      amountCents: 900,
      currency: 'usd',
      invoiceNumber: 'INV-IDEMP-01',
      createdAt: new Date().toISOString(), // Should preserve original createdAt
      updatedAt: new Date().toISOString(),
      metadata: { newKey: 'newVal' },
    });

    const all = await registry.getAllPayments();
    expect(all.length).toBe(1);

    const updated = await registry.getPaymentBySessionId('cs_idempotent_test');
    expect(updated?.paymentStatus).toBe('paid');
    expect(updated?.createdAt).toBe(originalTime);
    expect(updated?.metadata?.initialKey).toBe('initialVal');
    expect(updated?.metadata?.newKey).toBe('newVal');
  });

  it('handles concurrent writes safely under mutex queue without file corruption', async () => {
    const writes = Array.from({ length: 10 }, (_, i) =>
      registry.recordPayment({
        sessionId: `cs_concurrent_${i}`,
        customerEmail: `user_${i}@example.com`,
        profileId: 'it_cloud',
        candidateName: `Candidate ${i}`,
        paymentStatus: 'paid',
        amountCents: 900,
        currency: 'usd',
        invoiceNumber: `INV-CONCUR-${i}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    );

    await Promise.all(writes);

    const all = await registry.getAllPayments();
    expect(all.length).toBe(10);

    for (let i = 0; i < 10; i++) {
      const verified = await registry.isSessionVerified(`cs_concurrent_${i}`);
      expect(verified).toBe(true);
    }
  });

  it('persists data to disk and reloads correctly across fresh registry instances', async () => {
    await registry.recordPayment({
      sessionId: 'cs_persistent_check',
      customerEmail: 'persist@example.com',
      profileId: 'executive',
      candidateName: 'Persist Candidate',
      paymentStatus: 'paid',
      amountCents: 900,
      currency: 'usd',
      invoiceNumber: 'INV-PERSIST-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Create a new instance pointing to the same file
    const freshRegistry = new FilePaymentRegistry(TEST_DB_PATH);
    const retrieved = await freshRegistry.getPaymentBySessionId('cs_persistent_check');

    expect(retrieved).not.toBeNull();
    expect(retrieved?.customerEmail).toBe('persist@example.com');
    expect(await freshRegistry.isSessionVerified('cs_persistent_check')).toBe(true);
  });
});
