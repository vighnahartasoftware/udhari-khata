import { db } from '@/db/dexie';
import { supabase } from '@/lib/supabase';
import { env } from '@/lib/env';
import type { SyncQueueItem } from '@/types/domain';

export class SyncEngine {
  private isProcessing = false;
  private maxRetries = 5;

  /**
   * Enqueues a local operation for cloud sync.
   * In local mode, sync engine stores item locally without attempting cloud push.
   */
  async enqueueOperation(
    entityType: 'customer' | 'transaction',
    entityId: string,
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    payload: Record<string, unknown>
  ): Promise<SyncQueueItem> {
    const itemData = {
      entityType,
      entityId,
      operation,
      payload,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      retryCount: 0,
      lastError: null,
    };

    const id = await db.syncQueue.add(itemData as SyncQueueItem);
    const item: SyncQueueItem = { ...itemData, id };

    // Trigger processing if online and in Supabase mode
    if (env.VITE_DATA_MODE === 'supabase' && typeof navigator !== 'undefined' && navigator.onLine) {
      void this.processQueue();
    }

    return item;
  }

  /**
   * Processes all pending items in syncQueue with exponential backoff.
   */
  async processQueue(): Promise<{ processed: number; failed: number }> {
    if (env.VITE_DATA_MODE === 'local') {
      return { processed: 0, failed: 0 };
    }

    if (this.isProcessing) return { processed: 0, failed: 0 };
    if (typeof navigator !== 'undefined' && !navigator.onLine) return { processed: 0, failed: 0 };

    this.isProcessing = true;
    let processed = 0;
    let failed = 0;

    try {
      const items = await db.syncQueue.orderBy('id').toArray();

      for (const item of items) {
        if (!item.id) continue;

        try {
          await this.syncItemToCloud(item);
          await db.syncQueue.delete(item.id);
          processed++;
        } catch (err: unknown) {
          failed++;
          const errorMessage = err instanceof Error ? err.message : 'Unknown sync error';
          const newRetryCount = item.retryCount + 1;

          if (newRetryCount >= this.maxRetries) {
            await db.syncQueue.update(item.id, {
              retryCount: newRetryCount,
              lastError: `Max retries reached: ${errorMessage}`,
            });
          } else {
            await db.syncQueue.update(item.id, {
              retryCount: newRetryCount,
              lastError: errorMessage,
            });
          }
        }
      }
    } finally {
      this.isProcessing = false;
    }

    return { processed, failed };
  }

  private async syncItemToCloud(item: SyncQueueItem): Promise<void> {
    const table = item.entityType === 'customer' ? 'customers' : 'transactions';

    if (item.operation === 'INSERT' || item.operation === 'UPDATE') {
      const { error } = await supabase.from(table).upsert(item.payload as never);
      if (error) throw new Error(error.message);
    } else if (item.operation === 'DELETE') {
      const { error } = await supabase.from(table).delete().eq('id', item.entityId);
      if (error) throw new Error(error.message);
    }
  }

  async getPendingCount(): Promise<number> {
    return db.syncQueue.count();
  }
}

export const syncEngine = new SyncEngine();
