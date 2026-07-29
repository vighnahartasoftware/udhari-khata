import { cloudCustomerRepository } from './customer.cloud.repository';
import { localCustomerRepository } from './customer.local.repository';
import { db } from '@/db/dexie';
import type { Customer } from '@/types/domain';

export async function getCustomers(): Promise<Customer[]> {
  try {
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      const cloudData = await cloudCustomerRepository.getAll();
      // Cache fresh data locally
      for (const c of cloudData) {
        await db.customers.put(c);
      }
      return cloudData;
    }
  } catch (err) {
    console.warn('Failed to fetch customers directly from cloud, falling back to local cache:', err);
  }

  return localCustomerRepository.getAll();
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  try {
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      const customer = await cloudCustomerRepository.getById(id);
      if (customer) {
        await db.customers.put(customer);
        return customer;
      }
    }
  } catch (err) {
    console.warn('Failed to fetch customer by ID from cloud, using local cache:', err);
  }

  return localCustomerRepository.getById(id);
}

export async function createCustomer(data: Omit<Customer, 'createdAt' | 'updatedAt'>): Promise<Customer> {
  const isOnline = typeof navigator !== 'undefined' && navigator.onLine;

  if (isOnline) {
    // 1. Direct write to Supabase (Single Source of Truth)
    const created = await cloudCustomerRepository.create(data);
    // 2. Cache in IndexedDB as synced
    await db.customers.put(created);
    return created;
  } else {
    // Save locally for offline sync
    return localCustomerRepository.create(data);
  }
}

export async function updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
  const isOnline = typeof navigator !== 'undefined' && navigator.onLine;

  if (isOnline) {
    const updated = await cloudCustomerRepository.update(id, updates);
    await db.customers.put(updated);
    return updated;
  } else {
    return localCustomerRepository.update(id, updates);
  }
}

export async function deleteCustomer(id: string): Promise<void> {
  const isOnline = typeof navigator !== 'undefined' && navigator.onLine;

  if (isOnline) {
    await cloudCustomerRepository.delete(id);
    await db.customers.delete(id);
  } else {
    await localCustomerRepository.delete(id);
  }
}
