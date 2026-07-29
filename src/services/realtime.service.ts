import { supabase } from '@/lib/supabase';
import { db } from '@/db/dexie';
import { queryClient } from '@/lib/query-client';
import type { Customer, Transaction, Gender } from '@/types/domain';

export function initializeRealtimeSubscriptions(): () => void {
  // Subscribe to public postgres_changes for real-time multi-device sync
  const channel = supabase
    .channel('public:udhari_khata_realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'customers' },
      (payload) => {
        void handleCustomerRealtimeEvent(payload);
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'transactions' },
      (payload) => {
        void handleTransactionRealtimeEvent(payload);
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        void syncLatestCloudData();
      }
    });

  // Fetch initial cloud state immediately
  void syncLatestCloudData();

  // Active 4-second background poll to guarantee 100% sync even if socket disconnects briefly
  const pollInterval = setInterval(() => {
    void syncLatestCloudData();
  }, 4000);

  return () => {
    clearInterval(pollInterval);
    void supabase.removeChannel(channel);
  };
}

export async function syncLatestCloudData() {
  try {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;

    const { data: cloudCustomers } = await supabase.from('customers').select('*');
    if (cloudCustomers) {
      const activeCloudIds = new Set<string>();
      for (const raw of cloudCustomers) {
        if (!raw.is_active) {
          await db.customers.delete(String(raw.id));
          continue;
        }
        activeCloudIds.add(String(raw.id));
        const c: Customer = {
          id: String(raw.id),
          name: String(raw.name),
          mobile: String(raw.mobile || ''),
          alternateName: raw.alternate_name ? String(raw.alternate_name) : null,
          address: raw.address ? String(raw.address) : null,
          gender: (raw.gender as Gender) || null,
          photoUrl: raw.photo_url ? String(raw.photo_url) : null,
          recordedBy: raw.recorded_by ? String(raw.recorded_by) : null,
          openingBalance: Number(raw.opening_balance || 0),
          notes: raw.notes ? String(raw.notes) : null,
          isActive: Boolean(raw.is_active),
          createdBy: String(raw.created_by),
          createdAt: String(raw.created_at),
          updatedAt: String(raw.updated_at),
          version: Number(raw.version || 1),
          syncStatus: 'synced',
        };
        await db.customers.put(c);
      }

      // Purge local cache rows no longer in cloud
      const allLocal = await db.customers.toArray();
      for (const local of allLocal) {
        if (local.syncStatus === 'synced' && !activeCloudIds.has(local.id)) {
          await db.customers.delete(local.id);
        }
      }
    }

    const { data: cloudTransactions } = await supabase.from('transactions').select('*');
    if (cloudTransactions) {
      const activeTxnIds = new Set<string>();
      for (const raw of cloudTransactions) {
        if (raw.deleted_at) {
          await db.transactions.delete(String(raw.id));
          continue;
        }
        activeTxnIds.add(String(raw.id));
        const t: Transaction = {
          id: String(raw.id),
          customerId: String(raw.customer_id),
          type: raw.type as 'credit' | 'payment',
          amount: Number(raw.amount || 0),
          paymentMode: (raw.payment_mode as 'cash' | 'upi' | 'bank_transfer' | 'other' | null) || null,
          description: raw.description ? String(raw.description) : null,
          recordedBy: raw.recorded_by ? String(raw.recorded_by) : null,
          transactionDate: String(raw.transaction_date),
          createdBy: String(raw.created_by),
          createdAt: String(raw.created_at),
          updatedAt: String(raw.updated_at),
          version: Number(raw.version || 1),
          syncStatus: 'synced',
          deletedAt: raw.deleted_at ? String(raw.deleted_at) : null,
        };
        await db.transactions.put(t);
      }

      const allLocalTxns = await db.transactions.toArray();
      for (const localTxn of allLocalTxns) {
        if (localTxn.syncStatus === 'synced' && !activeTxnIds.has(localTxn.id)) {
          await db.transactions.delete(localTxn.id);
        }
      }
    }

    await queryClient.invalidateQueries();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new globalThis.Event('udhari-data-updated'));
    }
  } catch {
    // Network offline fallback
  }
}

async function handleCustomerRealtimeEvent(payload: {
  eventType: string;
  new?: Record<string, unknown>;
  old?: Record<string, unknown>;
}) {
  if (payload.eventType === 'DELETE' && payload.old && payload.old.id) {
    const deletedId = String(payload.old.id);
    await db.customers.delete(deletedId);
    await queryClient.invalidateQueries();
    if (typeof window !== 'undefined') window.dispatchEvent(new globalThis.Event('udhari-data-updated'));
    return;
  }

  if (!payload.new || !payload.new.id) return;

  const raw = payload.new;
  const targetId = String(raw.id);

  if (!raw.is_active) {
    await db.customers.delete(targetId);
    await queryClient.invalidateQueries();
    if (typeof window !== 'undefined') window.dispatchEvent(new globalThis.Event('udhari-data-updated'));
    return;
  }

  const updatedCustomer: Customer = {
    id: targetId,
    name: String(raw.name),
    mobile: String(raw.mobile || ''),
    alternateName: raw.alternate_name ? String(raw.alternate_name) : null,
    address: raw.address ? String(raw.address) : null,
    gender: (raw.gender as Gender) || null,
    photoUrl: raw.photo_url ? String(raw.photo_url) : null,
    recordedBy: raw.recorded_by ? String(raw.recorded_by) : null,
    openingBalance: Number(raw.opening_balance || 0),
    notes: raw.notes ? String(raw.notes) : null,
    isActive: Boolean(raw.is_active),
    createdBy: String(raw.created_by),
    createdAt: String(raw.created_at),
    updatedAt: String(raw.updated_at),
    version: Number(raw.version || 1),
    syncStatus: 'synced',
  };

  await db.customers.put(updatedCustomer);
  await queryClient.invalidateQueries();
  if (typeof window !== 'undefined') window.dispatchEvent(new globalThis.Event('udhari-data-updated'));
}

async function handleTransactionRealtimeEvent(payload: {
  eventType: string;
  new?: Record<string, unknown>;
  old?: Record<string, unknown>;
}) {
  if (payload.eventType === 'DELETE' && payload.old && payload.old.id) {
    const deletedId = String(payload.old.id);
    await db.transactions.delete(deletedId);
    await queryClient.invalidateQueries();
    if (typeof window !== 'undefined') window.dispatchEvent(new globalThis.Event('udhari-data-updated'));
    return;
  }

  if (!payload.new || !payload.new.id) return;

  const raw = payload.new;
  const targetId = String(raw.id);

  if (raw.deleted_at) {
    await db.transactions.delete(targetId);
    await queryClient.invalidateQueries();
    if (typeof window !== 'undefined') window.dispatchEvent(new globalThis.Event('udhari-data-updated'));
    return;
  }

  const updatedTransaction: Transaction = {
    id: targetId,
    customerId: String(raw.customer_id),
    type: raw.type as 'credit' | 'payment',
    amount: Number(raw.amount || 0),
    paymentMode: (raw.payment_mode as 'cash' | 'upi' | 'bank_transfer' | 'other' | null) || null,
    description: raw.description ? String(raw.description) : null,
    recordedBy: raw.recorded_by ? String(raw.recorded_by) : null,
    transactionDate: String(raw.transaction_date),
    createdBy: String(raw.created_by),
    createdAt: String(raw.created_at),
    updatedAt: String(raw.updated_at),
    version: Number(raw.version || 1),
    syncStatus: 'synced',
    deletedAt: raw.deleted_at ? String(raw.deleted_at) : null,
  };

  await db.transactions.put(updatedTransaction);
  await queryClient.invalidateQueries();
  if (typeof window !== 'undefined') window.dispatchEvent(new globalThis.Event('udhari-data-updated'));
}
