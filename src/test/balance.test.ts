import { describe, it, expect } from 'vitest';
import { calculateCustomerBalance, calculateCustomerTotals } from '@/utils/balance';
import type { Customer, Transaction } from '@/types/domain';

describe('Balance Calculation Domain Logic', () => {
  const mockCustomer: Customer = {
    id: 'cust-1',
    name: 'रमेश पाटील',
    mobile: '9876543210',
    alternateName: null,
    address: null,
    openingBalance: 1000,
    notes: null,
    isActive: true,
    createdBy: 'user-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
    syncStatus: 'synced',
  };

  const mockTransactions: Transaction[] = [
    {
      id: 'txn-1',
      customerId: 'cust-1',
      type: 'credit',
      amount: 500,
      paymentMode: null,
      description: 'दूध ५ लीटर',
      transactionDate: new Date().toISOString(),
      createdBy: 'user-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      syncStatus: 'synced',
      deletedAt: null,
    },
    {
      id: 'txn-2',
      customerId: 'cust-1',
      type: 'payment',
      amount: 300,
      paymentMode: 'cash',
      description: 'रोख जमा',
      transactionDate: new Date().toISOString(),
      createdBy: 'user-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      syncStatus: 'synced',
      deletedAt: null,
    },
    {
      id: 'txn-3',
      customerId: 'cust-1',
      type: 'credit',
      amount: 1000,
      paymentMode: null,
      description: 'डीलीट केलेली नोंद',
      transactionDate: new Date().toISOString(),
      createdBy: 'user-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      syncStatus: 'synced',
      deletedAt: new Date().toISOString(), // Soft deleted, must be ignored!
    },
  ];

  it('calculates balance correctly using opening_balance + credit - payment', () => {
    // 1000 opening + 500 credit - 300 payment = 1200
    const balance = calculateCustomerBalance(mockCustomer, mockTransactions);
    expect(balance).toBe(1200);
  });

  it('ignores soft-deleted transactions in totals breakdown', () => {
    const totals = calculateCustomerTotals(mockCustomer, mockTransactions);
    expect(totals.totalCredit).toBe(500);
    expect(totals.totalPayment).toBe(300);
    expect(totals.balance).toBe(1200);
  });
});
