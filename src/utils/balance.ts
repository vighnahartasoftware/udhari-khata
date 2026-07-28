import type { Customer, Transaction } from '@/types/domain';
import { isSameDay, parseISO } from 'date-fns';

export interface CustomerTotals {
  totalCredit: number;
  totalPayment: number;
  balance: number;
}

export interface ShopTotals {
  todayCredit: number;
  todayPayment: number;
  totalBalance: number;
  activeCustomerCount: number;
}

/**
 * Rounds monetary amounts to 2 decimal places to prevent floating-point inaccuracies.
 */
export function roundMoney(amount: number): number {
  return Math.round((Number(amount) || 0) * 100) / 100;
}

/**
 * Calculates current ledger balance for a customer ignoring soft-deleted entries.
 * Formula: Opening Balance + Total Credit - Total Payment
 */
export function calculateCustomerBalance(
  customer: Customer,
  transactions: Transaction[]
): number {
  const activeTxns = transactions.filter(
    (t) => t.customerId === customer.id && t.deletedAt === null
  );

  const totalCredit = activeTxns
    .filter((t) => t.type === 'credit')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalPayment = activeTxns
    .filter((t) => t.type === 'payment')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  return roundMoney(Number(customer.openingBalance || 0) + totalCredit - totalPayment);
}

/**
 * Returns breakdown of credits, payments and current net balance for a customer.
 */
export function calculateCustomerTotals(
  customer: Customer,
  transactions: Transaction[]
): CustomerTotals {
  const activeTxns = transactions.filter(
    (t) => t.customerId === customer.id && t.deletedAt === null
  );

  const totalCredit = roundMoney(
    activeTxns
      .filter((t) => t.type === 'credit')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0)
  );

  const totalPayment = roundMoney(
    activeTxns
      .filter((t) => t.type === 'payment')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0)
  );

  const balance = roundMoney(
    Number(customer.openingBalance || 0) + totalCredit - totalPayment
  );

  return { totalCredit, totalPayment, balance };
}

/**
 * Calculates total shop metrics: today's total credit, today's total payment, and total outstanding balance across active customers.
 */
export function calculateShopTotals(
  customers: Customer[],
  transactions: Transaction[]
): ShopTotals {
  const today = new Date();
  const activeCustomers = customers.filter((c) => c.isActive);
  const activeCustomerIds = new Set(activeCustomers.map((c) => c.id));

  const validTransactions = transactions.filter(
    (t) => activeCustomerIds.has(t.customerId) && t.deletedAt === null
  );

  let todayCredit = 0;
  let todayPayment = 0;

  for (const t of validTransactions) {
    try {
      const tDate = parseISO(t.transactionDate);
      if (isSameDay(tDate, today)) {
        if (t.type === 'credit') {
          todayCredit += Number(t.amount || 0);
        } else if (t.type === 'payment') {
          todayPayment += Number(t.amount || 0);
        }
      }
    } catch {
      // Ignore invalid date format
    }
  }

  let totalBalance = 0;
  for (const c of activeCustomers) {
    totalBalance += calculateCustomerBalance(c, validTransactions);
  }

  return {
    todayCredit: roundMoney(todayCredit),
    todayPayment: roundMoney(todayPayment),
    totalBalance: roundMoney(totalBalance),
    activeCustomerCount: activeCustomers.length,
  };
}
