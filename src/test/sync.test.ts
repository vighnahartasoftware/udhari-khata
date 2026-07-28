import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/db/dexie';
import { syncEngine } from '@/services/sync.service';

describe('Sync Engine & Offline Queue', () => {
  beforeEach(async () => {
    await db.syncQueue.clear();
  });

  it('enqueues customer mutation when offline', async () => {
    const item = await syncEngine.enqueueOperation(
      'customer',
      'cust-999',
      'INSERT',
      { name: 'गजानन' }
    );

    expect(item.id).toBeDefined();
    expect(item.entityType).toBe('customer');

    const count = await syncEngine.getPendingCount();
    expect(count).toBe(1);
  });
});
