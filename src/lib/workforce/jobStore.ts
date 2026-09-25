/**
 * CheckMyCV Workforce Engine: Job State Store & Event Hub
 * Thread-safe job store managing active jobs, streaming SSE listeners,
 * and retrieval of completed deliverables.
 */

import { JobContext, WorkforceEvent } from './types';

type Listener = (event: WorkforceEvent) => void;

class JobStoreManager {
  private jobs: Map<string, JobContext> = new Map();
  private listeners: Map<string, Set<Listener>> = new Map();

  public saveJob(ctx: JobContext): void {
    this.jobs.set(ctx.job_id, ctx);
  }

  public getJob(jobId: string): JobContext | undefined {
    return this.jobs.get(jobId);
  }

  public subscribe(jobId: string, listener: Listener): () => void {
    if (!this.listeners.has(jobId)) {
      this.listeners.set(jobId, new Set());
    }
    this.listeners.get(jobId)!.add(listener);

    return () => {
      const set = this.listeners.get(jobId);
      if (set) {
        set.delete(listener);
        if (set.size === 0) {
          this.listeners.delete(jobId);
        }
      }
    };
  }

  public broadcast(event: WorkforceEvent): void {
    const set = this.listeners.get(event.job_id);
    if (set && set.size > 0) {
      set.forEach((listener) => {
        try {
          listener(event);
        } catch (err) {
          console.error('[JobStore] Error invoking listener:', err);
        }
      });
    }
  }
}

// Global singleton instance across Next.js API route calls
const globalForJobStore = global as unknown as { jobStoreInstance?: JobStoreManager };
export const jobStore = globalForJobStore.jobStoreInstance || new JobStoreManager();
if (process.env.NODE_ENV !== 'production') {
  globalForJobStore.jobStoreInstance = jobStore;
}
