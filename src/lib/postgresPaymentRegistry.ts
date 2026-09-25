import type { IPaymentRegistry, PaymentRecord } from './paymentRegistry';

/**
 * Postgres-backed payment registry.
 *
 * The file-backed registry cannot be used on Vercel or any other serverless
 * host: each invocation gets a fresh, disposable filesystem, so a written
 * payment record disappears and a paying customer silently loses access.
 *
 * This implementation is selected automatically when DATABASE_URL is set.
 * It works with any standard Postgres connection string (Supabase, Neon,
 * Railway, RDS). On Supabase use the connection *pooler* URL (port 6543),
 * because serverless functions open and drop connections constantly.
 */

const TABLE = 'scoremycv_payments';

type PgPool = any;

let poolPromise: Promise<PgPool> | null = null;
let schemaReady = false;

function shouldUseSsl(connectionString: string): boolean {
  if (/sslmode=disable/i.test(connectionString)) return false;
  if (/@(localhost|127\.0\.0\.1)[:/]/i.test(connectionString)) return false;
  return true;
}

async function getPool(): Promise<PgPool> {
  if (poolPromise) return poolPromise;

  poolPromise = (async () => {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is not set.');
    }

    let pg: any;
    try {
      pg = await import('pg');
    } catch {
      throw new Error(
        'The "pg" package is required for the Postgres payment registry. Run: npm install pg'
      );
    }

    const Pool = pg.Pool || pg.default?.Pool;
    return new Pool({
      connectionString,
      // Serverless functions are short-lived; a small pool avoids exhausting
      // the database's connection limit across many concurrent invocations.
      max: Number(process.env.DATABASE_POOL_MAX) || 3,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 10_000,
      ssl: shouldUseSsl(connectionString) ? { rejectUnauthorized: false } : undefined,
    });
  })();

  return poolPromise;
}

async function query(text: string, values: unknown[] = []): Promise<any> {
  const pool = await getPool();
  await ensureSchema(pool);
  return pool.query(text, values);
}

async function ensureSchema(pool: PgPool): Promise<void> {
  if (schemaReady) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${TABLE} (
      session_id      TEXT PRIMARY KEY,
      customer_email  TEXT        NOT NULL DEFAULT '',
      profile_id      TEXT        NOT NULL DEFAULT '',
      candidate_name  TEXT        NOT NULL DEFAULT '',
      payment_status  TEXT        NOT NULL,
      amount_cents    INTEGER     NOT NULL DEFAULT 0,
      currency        TEXT        NOT NULL DEFAULT 'ZAR',
      invoice_number  TEXT        NOT NULL DEFAULT '',
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
      metadata        JSONB       NOT NULL DEFAULT '{}'::jsonb
    )
  `);

  await pool.query(
    `CREATE INDEX IF NOT EXISTS ${TABLE}_customer_email_idx ON ${TABLE} (customer_email)`
  );

  schemaReady = true;
}

function toRecord(row: any): PaymentRecord {
  return {
    sessionId: row.session_id,
    customerEmail: row.customer_email || '',
    profileId: row.profile_id || '',
    candidateName: row.candidate_name || '',
    paymentStatus: row.payment_status,
    amountCents: Number(row.amount_cents) || 0,
    currency: row.currency || 'ZAR',
    invoiceNumber: row.invoice_number || '',
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    metadata: row.metadata || {},
  };
}

export class PostgresPaymentRegistry implements IPaymentRegistry {
  public async recordPayment(record: PaymentRecord): Promise<void> {
    if (!record || !record.sessionId) {
      throw new Error('PaymentRecord must have a valid sessionId.');
    }

    const sessionId = record.sessionId.trim();
    const customerEmail = (record.customerEmail || '').trim().toLowerCase();
    const now = new Date().toISOString();

    // Repeated webhook deliveries are normal: upsert so the record stays single
    // and consistent, keeping the original created_at and merging metadata.
    await query(
      `
      INSERT INTO ${TABLE} (
        session_id, customer_email, profile_id, candidate_name, payment_status,
        amount_cents, currency, invoice_number, created_at, updated_at, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb)
      ON CONFLICT (session_id) DO UPDATE SET
        customer_email = EXCLUDED.customer_email,
        profile_id     = EXCLUDED.profile_id,
        candidate_name = EXCLUDED.candidate_name,
        payment_status = EXCLUDED.payment_status,
        amount_cents   = EXCLUDED.amount_cents,
        currency       = EXCLUDED.currency,
        invoice_number = EXCLUDED.invoice_number,
        updated_at     = EXCLUDED.updated_at,
        metadata       = ${TABLE}.metadata || EXCLUDED.metadata
      `,
      [
        sessionId,
        customerEmail,
        record.profileId || '',
        record.candidateName || '',
        record.paymentStatus,
        record.amountCents || 0,
        record.currency || 'ZAR',
        record.invoiceNumber || '',
        record.createdAt || now,
        now,
        JSON.stringify(record.metadata || {}),
      ]
    );
  }

  public async getPaymentBySessionId(sessionId: string): Promise<PaymentRecord | null> {
    if (!sessionId || !sessionId.trim()) return null;
    const res = await query(`SELECT * FROM ${TABLE} WHERE session_id = $1`, [sessionId.trim()]);
    return res.rows.length ? toRecord(res.rows[0]) : null;
  }

  public async getPaymentsByEmail(email: string): Promise<PaymentRecord[]> {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) return [];
    const res = await query(
      `SELECT * FROM ${TABLE} WHERE customer_email = $1 ORDER BY created_at DESC`,
      [cleanEmail]
    );
    return res.rows.map(toRecord);
  }

  public async isSessionVerified(sessionId: string): Promise<boolean> {
    const record = await this.getPaymentBySessionId(sessionId);
    return Boolean(record && record.paymentStatus === 'paid');
  }

  public async isEmailVerified(email: string): Promise<boolean> {
    const records = await this.getPaymentsByEmail(email);
    return records.some((r) => r.paymentStatus === 'paid');
  }

  public async getAllPayments(): Promise<PaymentRecord[]> {
    const res = await query(`SELECT * FROM ${TABLE} ORDER BY created_at DESC`);
    return res.rows.map(toRecord);
  }

  /** Test-suite helper. Refuses to run against a live database. */
  public async clear(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Refusing to clear the payment registry in production.');
    }
    await query(`DELETE FROM ${TABLE}`);
  }

  public async reload(): Promise<void> {
    // Every read hits Postgres directly, so there is no cache to invalidate.
  }
}
