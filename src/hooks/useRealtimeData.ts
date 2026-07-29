import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/dexie';
import { calculateShopTotals, calculateCustomerBalance } from '@/utils/balance';
import type { Customer } from '@/types/domain';
import { syncLatestCloudData } from '@/services/realtime.service';

export function useRealtimeData() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const handleDataUpdate = () => {
      setTick((prev) => prev + 1);
    };

    window.addEventListener('udhari-data-updated', handleDataUpdate);
    return () => {
      window.removeEventListener('udhari-data-updated', handleDataUpdate);
    };
  }, []);

  const customers = useLiveQuery(
    () => db.customers.filter((c) => Boolean(c.isActive)).toArray(),
    [tick]
  ) || [];

  const transactions = useLiveQuery(
    () => db.transactions.filter((t) => t.deletedAt === null).toArray(),
    [tick]
  ) || [];

  const pendingSyncCount = useLiveQuery(
    () => db.syncQueue.count(),
    [tick]
  ) || 0;

  const totals = calculateShopTotals(customers, transactions);

  const refreshData = () => {
    void syncLatestCloudData();
  };

  return {
    customers,
    transactions,
    totals,
    pendingSyncCount,
    refreshData,
    calculateBalance: (customer: Customer) => calculateCustomerBalance(customer, transactions),
  };
}
