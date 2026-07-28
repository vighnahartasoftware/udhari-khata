import { supabase } from '@/lib/supabase';
import { db } from '@/db/dexie';
import { queryClient } from '@/lib/query-client';
import { useToastStore } from '@/components/feedback/ToastStore';
import type { Customer, Transaction, Gender } from '@/types/domain';

export function initializeRealtimeSubscriptions(): () => void {
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

  // Also trigger initial cloud fetch immediately
  void syncLatestCloudData();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export async function syncLatestCloudData() {
  try {
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
    }

    const { data: cloudTransactions } = await supabase.from('transactions').select('*');
    if (cloudTransactions) {
      for (const raw of cloudTransactions) {
        if (raw.deleted_at) {
          await db.transactions.delete(String(raw.id));
          continue;
        }
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
    }

    await queryClient.invalidateQueries();
  } catch {
    // Offline or network error fallback
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
    useToastStore.getState().addToast({
      type: 'info',
      message: 'ग्राहक खाते काढून टाकले गेले (Deleted)',
    });
    return;
  }

  if (!payload.new || !payload.new.id) return;

  const raw = payload.new;
  const targetId = String(raw.id);

  if (!raw.is_active) {
    await db.customers.delete(targetId);
    await queryClient.invalidateQueries();
    return;
  }

  const existingLocal = await db.customers.get(targetId);
  if (existingLocal && existingLocal.syncStatus === 'pending') {
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

  useToastStore.getState().addToast({
    type: 'info',
    message: `नवीन ग्राहक '${updatedCustomer.name}' ऑटो-सिंक झाला!`,
  });
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
    return;
  }

  if (!payload.new || !payload.new.id) return;

  const raw = payload.new;
  const targetId = String(raw.id);

  if (raw.deleted_at) {
    await db.transactions.delete(targetId);
    await queryClient.invalidateQueries();
    return;
  }

  const existingLocal = await db.transactions.get(targetId);
  if (existingLocal && existingLocal.syncStatus === 'pending') {
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

  const typeLabel = updatedTransaction.type === 'credit' ? 'उधारी (Credit)' : 'पेमेंट (Payment)';
  useToastStore.getState().addToast({
    type: 'info',
    message: `नवीन ${typeLabel} नोंद ₹${updatedTransaction.amount} ऑटो-सिंक झाली!`,
  });
}
