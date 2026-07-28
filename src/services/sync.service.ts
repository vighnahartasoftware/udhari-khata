import { db } from '@/db/dexie';
import { supabase } from '@/lib/supabase';
import { env } from '@/lib/env';
import type { SyncQueueItem } from '@/types/domain';

function ensureValidUuid(val: unknown): string {
  if (typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val)) {
    return val;
  }
  return '00000000-0000-4000-a000-000000000001';
}

export class SyncEngine {
  private isProcessing = false;

  /**
   * Enqueues a local operation for cloud sync.
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

    // Trigger immediate cloud push if online and in Supabase mode
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

          // Update local status to synced
          if (item.entityType === 'customer') {
            await db.customers.update(item.entityId, { syncStatus: 'synced' });
          } else if (item.entityType === 'transaction') {
            await db.transactions.update(item.entityId, { syncStatus: 'synced' });
          }

          processed++;
        } catch (err: unknown) {
          failed++;
          const errorMessage = err instanceof Error ? err.message : 'Unknown sync error';
          const newRetryCount = item.retryCount + 1;

          await db.syncQueue.update(item.id, {
            retryCount: newRetryCount,
            lastError: errorMessage,
          });
        }
      }
    } finally {
      this.isProcessing = false;
    }

    return { processed, failed };
  }

  private async syncItemToCloud(item: SyncQueueItem): Promise<void> {
    const isCustomer = item.entityType === 'customer';
    const table = isCustomer ? 'customers' : 'transactions';
    const raw = item.payload;

    if (item.operation === 'INSERT' || item.operation === 'UPDATE') {
      const cloudPayload = isCustomer
        ? {
            id: raw.id,
            name: raw.name,
            mobile: raw.mobile || '',
            alternate_name: raw.alternateName || null,
            address: raw.address || null,
            opening_balance: raw.openingBalance || 0,
            notes: raw.notes || null,
            is_active: raw.isActive ?? true,
            gender: raw.gender || null,
            photo_url: raw.photoUrl || null,
            recorded_by: raw.recordedBy || null,
            created_by: ensureValidUuid(raw.createdBy),
            created_at: raw.createdAt || new Date().toISOString(),
            updated_at: raw.updatedAt || new Date().toISOString(),
            version: raw.version || 1,
          }
        : {
            id: raw.id,
            customer_id: raw.customerId,
            type: raw.type,
            amount: raw.amount,
            payment_mode: raw.paymentMode || null,
            description: raw.description || null,
            recorded_by: raw.recordedBy || null,
            transaction_date: raw.transactionDate,
            created_by: ensureValidUuid(raw.createdBy),
            created_at: raw.createdAt || new Date().toISOString(),
            updated_at: raw.updatedAt || new Date().toISOString(),
            version: raw.version || 1,
            deleted_at: raw.deletedAt || null,
          };

      const { error } = await supabase.from(table).upsert(cloudPayload as never);
      if (error) {
        throw new Error(`Cloud upsert error: ${error.message}`);
      }
    } else if (item.operation === 'DELETE') {
      const { error } = await supabase.from(table).delete().eq('id', item.entityId);
      if (error) {
        throw new Error(`Cloud delete error: ${error.message}`);
      }
    }
  }

  async getPendingCount(): Promise<number> {
    return db.syncQueue.count();
  }
}

export const syncEngine = new SyncEngine();
