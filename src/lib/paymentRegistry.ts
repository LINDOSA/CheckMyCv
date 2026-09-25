import fs from 'fs/promises';
import path from 'path';

export interface PaymentRecord {
  sessionId: string;
  customerEmail: string;
  profileId: string;
  candidateName: string;
  paymentStatus: 'paid' | 'unpaid' | 'pending';
  amountCents: number;
  currency: string;
  invoiceNumber: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, string>;
}

export interface IPaymentRegistry {
  recordPayment(record: PaymentRecord): Promise<void>;
  getPaymentBySessionId(sessionId: string): Promise<PaymentRecord | null>;
  getPaymentsByEmail(email: string): Promise<PaymentRecord[]>;
  isSessionVerified(sessionId: string): Promise<boolean>;
  isEmailVerified(email: string): Promise<boolean>;
}

export class FilePaymentRegistry implements IPaymentRegistry {
  private filePath: string;
  private cache: Map<string, PaymentRecord> = new Map();
  private isLoaded: boolean = false;
  private mutex: Promise<void> = Promise.resolve();

  constructor(customPath?: string) {
    this.filePath =
      customPath ||
      process.env.PAYMENT_REGISTRY_PATH ||
      path.resolve(process.cwd(), 'data/payments.json');
  }

  private async load(): Promise<void> {
    if (this.isLoaded) return;
    try {
      const data = await fs.readFile(this.filePath, 'utf-8');
      const records: PaymentRecord[] = JSON.parse(data);
      this.cache.clear();
      if (Array.isArray(records)) {
        for (const rec of records) {
          if (rec && rec.sessionId) {
            this.cache.set(rec.sessionId, rec);
          }
        }
      }
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        this.cache.clear();
      } else {
        console.warn(`[PaymentRegistry] Warning reading registry from ${this.filePath}:`, err.message);
      }
    }
    this.isLoaded = true;
  }

  private async persist(): Promise<void> {
    const dir = path.dirname(this.filePath);
    await fs.mkdir(dir, { recursive: true });

    const records = Array.from(this.cache.values());
    const tempFile = `${this.filePath}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`;
    const content = JSON.stringify(records, null, 2);

    await fs.writeFile(tempFile, content, 'utf-8');

    // Windows atomic rename retry loop for EPERM / EBUSY
    let retries = 5;
    let delay = 20;
    while (retries > 0) {
      try {
        await fs.rename(tempFile, this.filePath);
        break;
      } catch (renameErr: any) {
        retries--;
        if (retries === 0) {
          try {
            await fs.unlink(tempFile);
          } catch {}
          throw renameErr;
        }
        await new Promise((res) => setTimeout(res, delay));
        delay *= 2;
      }
    }
  }

  public async recordPayment(record: PaymentRecord): Promise<void> {
    if (!record || !record.sessionId) {
      throw new Error('PaymentRecord must have a valid sessionId.');
    }

    await this.runExclusive(async () => {
      await this.load();
      const existing = this.cache.get(record.sessionId);
      const normalizedEmail = (record.customerEmail || '').trim().toLowerCase();
      const now = new Date().toISOString();

      const normalizedRecord: PaymentRecord = {
        ...record,
        sessionId: record.sessionId.trim(),
        customerEmail: normalizedEmail,
        createdAt: existing?.createdAt || record.createdAt || now,
        updatedAt: now,
        metadata: {
          ...(existing?.metadata || {}),
          ...(record.metadata || {}),
        },
      };

      this.cache.set(record.sessionId.trim(), normalizedRecord);
      await this.persist();
    });
  }

  public async getPaymentBySessionId(sessionId: string): Promise<PaymentRecord | null> {
    if (!sessionId) return null;
    await this.load();
    return this.cache.get(sessionId.trim()) || null;
  }

  public async getPaymentsByEmail(email: string): Promise<PaymentRecord[]> {
    if (!email) return [];
    await this.load();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return [];

    return Array.from(this.cache.values()).filter(
      (r) => (r.customerEmail || '').trim().toLowerCase() === cleanEmail
    );
  }

  public async isSessionVerified(sessionId: string): Promise<boolean> {
    if (!sessionId) return false;
    const record = await this.getPaymentBySessionId(sessionId);
    return Boolean(record && record.paymentStatus === 'paid');
  }

  public async isEmailVerified(email: string): Promise<boolean> {
    if (!email) return false;
    const records = await this.getPaymentsByEmail(email);
    return records.some((r) => r.paymentStatus === 'paid');
  }

  public async getAllPayments(): Promise<PaymentRecord[]> {
    await this.load();
    return Array.from(this.cache.values());
  }

  public async clear(): Promise<void> {
    await this.runExclusive(async () => {
      this.cache.clear();
      this.isLoaded = true;
      try {
        await fs.unlink(this.filePath);
      } catch (err: any) {
        if (err.code !== 'ENOENT') {
          throw err;
        }
      }
    });
  }

  public async reload(): Promise<void> {
    this.isLoaded = false;
    await this.load();
  }

  private runExclusive<T>(fn: () => Promise<T>): Promise<T> {
    const next = this.mutex.then(() => fn());
    this.mutex = next.then(
      () => {},
      () => {}
    );
    return next;
  }
}

/**
 * Pick the storage backend.
 *
 * Postgres is used whenever DATABASE_URL is set, which is what serverless hosts
 * such as Vercel need: their filesystem is disposable, so a file-backed record
 * of who paid does not survive. The file registry remains the local-dev default.
 */
function createPaymentRegistry(): IPaymentRegistry {
  if (process.env.DATABASE_URL) {
    // Required lazily so local development never needs the "pg" package.
    const { PostgresPaymentRegistry } = require('./postgresPaymentRegistry');
    return new PostgresPaymentRegistry();
  }
  return new FilePaymentRegistry();
}

export const paymentRegistry = createPaymentRegistry() as FilePaymentRegistry;
