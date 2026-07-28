import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/db/dexie';
import type { Customer } from '@/types/domain';

describe('Dexie IndexedDB Initialization', () => {
  beforeEach(async () => {
    await db.customers.clear();
    await db.transactions.clear();
    await db.syncQueue.clear();
  });

  it('initialises database and executes table operations', async () => {
    expect(db.isOpen()).toBe(true);

    const newCustomer: Customer = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Suresh Milk Supplier',
      mobile: '9876543210',
      alternateName: null,
      address: 'Near Main Dairy, Sector 4',
      openingBalance: 1500,
      notes: 'Daily 5L milk supply',
      isActive: true,
      createdBy: '123e4567-e89b-12d3-a456-426614174001',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      syncStatus: 'pending',
    };

    await db.customers.add(newCustomer);
    const retrieved = await db.customers.get('123e4567-e89b-12d3-a456-426614174000');

    expect(retrieved).toBeDefined();
    expect(retrieved?.name).toBe('Suresh Milk Supplier');
    expect(retrieved?.openingBalance).toBe(1500);
  });
});
