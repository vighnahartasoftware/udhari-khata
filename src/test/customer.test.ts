import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/db/dexie';
import { localCustomerRepository } from '@/services/customer.local.repository';

describe('Customer Local Repository Operations', () => {
  beforeEach(async () => {
    await db.customers.clear();
    await db.syncQueue.clear();
  });

  it('creates a new customer locally and enqueues sync item', async () => {
    const customer = await localCustomerRepository.create({
      id: 'cust-100',
      name: 'ज्ञानेश्वर शिंदे',
      mobile: '9123456789',
      alternateName: 'माऊली',
      address: 'डेअरी रोड',
      openingBalance: 200,
      notes: null,
      isActive: true,
      createdBy: 'user-1',
      version: 1,
      syncStatus: 'pending',
    });

    expect(customer.name).toBe('ज्ञानेश्वर शिंदे');
    expect(customer.syncStatus).toBe('pending');

    const inDb = await db.customers.get('cust-100');
    expect(inDb).toBeDefined();

    const pendingQueue = await db.syncQueue.toArray();
    expect(pendingQueue.length).toBe(1);
    expect(pendingQueue[0].entityId).toBe('cust-100');
  });

  it('searches customer by name, alternate name or mobile with space tolerance', async () => {
    await localCustomerRepository.create({
      id: 'cust-101',
      name: 'संजय चव्हाण',
      mobile: '9988776655',
      alternateName: 'संंजू दादा',
      address: null,
      openingBalance: 0,
      notes: null,
      isActive: true,
      createdBy: 'user-1',
      version: 1,
      syncStatus: 'pending',
    });

    const searchByName = await localCustomerRepository.searchByNameOrMobile('  संजय  ');
    expect(searchByName.length).toBe(1);

    const searchByMobile = await localCustomerRepository.searchByNameOrMobile('998877');
    expect(searchByMobile.length).toBe(1);

    const searchByAlt = await localCustomerRepository.searchByNameOrMobile('संंजू');
    expect(searchByAlt.length).toBe(1);
  });
});
