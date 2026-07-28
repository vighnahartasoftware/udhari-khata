import { db } from '@/db/dexie';
import type { Transaction } from '@/types/domain';
import type { TransactionRepository } from './repository.interface';
import { syncEngine } from './sync.service';

export class LocalTransactionRepository implements TransactionRepository {
  async getAll(): Promise<Transaction[]> {
    return db.transactions.filter((t) => t.deletedAt === null).toArray();
  }

  async getById(id: string): Promise<Transaction | null> {
    const tx = await db.transactions.get(id);
    if (!tx || tx.deletedAt !== null) return null;
    return tx;
  }

  async getByCustomerId(customerId: string): Promise<Transaction[]> {
    return db.transactions
      .where('customerId')
      .equals(customerId)
      .filter((t) => t.deletedAt === null)
      .reverse()
      .sortBy('transactionDate');
  }

  async create(data: Omit<Transaction, 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    const now = new Date().toISOString();
    const transaction: Transaction = {
      ...data,
      createdAt: now,
      updatedAt: now,
      syncStatus: 'pending',
    };

    await db.transactions.add(transaction);
    await syncEngine.enqueueOperation(
      'transaction',
      transaction.id,
      'INSERT',
      transaction as unknown as Record<string, unknown>
    );

    return transaction;
  }

  async update(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    const existing = await db.transactions.get(id);
    if (!existing || existing.deletedAt !== null) {
      throw new Error(`Transaction with ID ${id} not found`);
    }

    const updated: Transaction = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
      version: (existing.version || 1) + 1,
      syncStatus: 'pending',
    };

    await db.transactions.put(updated);
    await syncEngine.enqueueOperation(
      'transaction',
      updated.id,
      'UPDATE',
      updated as unknown as Record<string, unknown>
    );

    return updated;
  }

  async deleteSoft(id: string): Promise<void> {
    const existing = await db.transactions.get(id);
    if (existing) {
      const deleted: Transaction = {
        ...existing,
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncStatus: 'pending',
      };
      await db.transactions.put(deleted);
      await syncEngine.enqueueOperation(
        'transaction',
        deleted.id,
        'DELETE',
        deleted as unknown as Record<string, unknown>
      );
    }
  }
}

export const localTransactionRepository = new LocalTransactionRepository();
