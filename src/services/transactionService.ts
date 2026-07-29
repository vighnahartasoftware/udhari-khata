import { cloudTransactionRepository } from './transaction.cloud.repository';
import { localTransactionRepository } from './transaction.local.repository';
import { db } from '@/db/dexie';
import type { Transaction } from '@/types/domain';

export async function getTransactions(): Promise<Transaction[]> {
  try {
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      const cloudData = await cloudTransactionRepository.getAll();
      for (const t of cloudData) {
        await db.transactions.put(t);
      }
      return cloudData;
    }
  } catch (err) {
    console.warn('Failed to fetch transactions from cloud, using local cache:', err);
  }

  return localTransactionRepository.getAll();
}

export async function getCustomerTransactions(customerId: string): Promise<Transaction[]> {
  try {
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      const cloudData = await cloudTransactionRepository.getByCustomerId(customerId);
      for (const t of cloudData) {
        await db.transactions.put(t);
      }
      return cloudData;
    }
  } catch (err) {
    console.warn('Failed to fetch customer transactions from cloud, using local cache:', err);
  }

  return localTransactionRepository.getByCustomerId(customerId);
}

export async function addCreditTransaction(data: Omit<Transaction, 'createdAt' | 'updatedAt' | 'type'>): Promise<Transaction> {
  const isOnline = typeof navigator !== 'undefined' && navigator.onLine;

  const payload: Omit<Transaction, 'createdAt' | 'updatedAt'> = {
    ...data,
    type: 'credit',
  };

  if (isOnline) {
    const created = await cloudTransactionRepository.create(payload);
    await db.transactions.put(created);
    return created;
  } else {
    return localTransactionRepository.create(payload);
  }
}

export async function addPaymentTransaction(data: Omit<Transaction, 'createdAt' | 'updatedAt' | 'type'>): Promise<Transaction> {
  const isOnline = typeof navigator !== 'undefined' && navigator.onLine;

  const payload: Omit<Transaction, 'createdAt' | 'updatedAt'> = {
    ...data,
    type: 'payment',
  };

  if (isOnline) {
    const created = await cloudTransactionRepository.create(payload);
    await db.transactions.put(created);
    return created;
  } else {
    return localTransactionRepository.create(payload);
  }
}

export async function updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction> {
  const isOnline = typeof navigator !== 'undefined' && navigator.onLine;

  if (isOnline) {
    const updated = await cloudTransactionRepository.update(id, updates);
    await db.transactions.put(updated);
    return updated;
  } else {
    return localTransactionRepository.update(id, updates);
  }
}

export async function deleteTransaction(id: string): Promise<void> {
  const isOnline = typeof navigator !== 'undefined' && navigator.onLine;

  if (isOnline) {
    await cloudTransactionRepository.deleteSoft(id);
    await db.transactions.delete(id);
  } else {
    await localTransactionRepository.deleteSoft(id);
  }
}
