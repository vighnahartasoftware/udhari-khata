import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/db/dexie';
import { localTransactionRepository } from '@/services/transaction.local.repository';

describe('Transaction Local Repository Operations', () => {
  beforeEach(async () => {
    await db.transactions.clear();
    await db.syncQueue.clear();
  });

  it('creates credit and payment transactions and enqueues sync queue items', async () => {
    const creditTxn = await localTransactionRepository.create({
      id: 'txn-100',
      customerId: 'cust-1',
      type: 'credit',
      amount: 450,
      paymentMode: null,
      description: 'दूध खरेदी',
      transactionDate: new Date().toISOString(),
      createdBy: 'user-1',
      version: 1,
      syncStatus: 'pending',
      deletedAt: null,
    });

    const paymentTxn = await localTransactionRepository.create({
      id: 'txn-101',
      customerId: 'cust-1',
      type: 'payment',
      amount: 200,
      paymentMode: 'upi',
      description: 'GPay Payment',
      transactionDate: new Date().toISOString(),
      createdBy: 'user-1',
      version: 1,
      syncStatus: 'pending',
      deletedAt: null,
    });

    expect(creditTxn.amount).toBe(450);
    expect(paymentTxn.paymentMode).toBe('upi');

    const customerTxns = await localTransactionRepository.getByCustomerId('cust-1');
    expect(customerTxns.length).toBe(2);

    const queue = await db.syncQueue.toArray();
    expect(queue.length).toBe(2);
  });

  it('soft deletes transaction by setting deletedAt timestamp', async () => {
    await localTransactionRepository.create({
      id: 'txn-102',
      customerId: 'cust-1',
      type: 'credit',
      amount: 150,
      paymentMode: null,
      description: 'ताक व लोणी',
      transactionDate: new Date().toISOString(),
      createdBy: 'user-1',
      version: 1,
      syncStatus: 'pending',
      deletedAt: null,
    });

    await localTransactionRepository.deleteSoft('txn-102');

    const retrieved = await localTransactionRepository.getById('txn-102');
    expect(retrieved).toBeNull(); // Soft deleted items are excluded from getById

    const rawInDb = await db.transactions.get('txn-102');
    expect(rawInDb?.deletedAt).not.toBeNull();
  });
});
