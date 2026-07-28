import { db } from '@/db/dexie';
import type { Customer } from '@/types/domain';
import type { CustomerRepository } from './repository.interface';
import { syncEngine } from './sync.service';

export class LocalCustomerRepository implements CustomerRepository {
  async getAll(): Promise<Customer[]> {
    return db.customers.filter((c) => Boolean(c.isActive)).toArray();
  }

  async getById(id: string): Promise<Customer | null> {
    const customer = await db.customers.get(id);
    return customer ?? null;
  }

  async searchByNameOrMobile(query: string): Promise<Customer[]> {
    const lower = query.toLowerCase().trim();
    const all = await db.customers.toArray();
    if (!lower) return all.filter((c) => c.isActive);

    return all.filter((c) => {
      if (!c.isActive) return false;
      const matchName = c.name.toLowerCase().includes(lower);
      const matchAlt = c.alternateName ? c.alternateName.toLowerCase().includes(lower) : false;
      const matchMobile = c.mobile ? c.mobile.includes(lower) : false;
      return matchName || matchAlt || matchMobile;
    });
  }

  async create(data: Omit<Customer, 'createdAt' | 'updatedAt'>): Promise<Customer> {
    const now = new Date().toISOString();
    const customer: Customer = {
      ...data,
      createdAt: now,
      updatedAt: now,
      syncStatus: 'pending',
    };

    await db.customers.add(customer);
    await syncEngine.enqueueOperation(
      'customer',
      customer.id,
      'INSERT',
      customer as unknown as Record<string, unknown>
    );

    return customer;
  }

  async update(id: string, updates: Partial<Customer>): Promise<Customer> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error(`Customer with ID ${id} not found`);
    }

    const updated: Customer = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
      version: (existing.version || 1) + 1,
      syncStatus: 'pending',
    };

    await db.customers.put(updated);
    await syncEngine.enqueueOperation(
      'customer',
      updated.id,
      'UPDATE',
      updated as unknown as Record<string, unknown>
    );

    return updated;
  }

  async delete(id: string): Promise<void> {
    const existing = await this.getById(id);
    if (existing) {
      await this.update(id, { isActive: false });
    }
  }
}

export const localCustomerRepository = new LocalCustomerRepository();
