import { supabase } from '@/lib/supabase';
import { db } from '@/db/dexie';
import { queryClient } from '@/lib/query-client';
import { useToastStore } from '@/components/feedback/ToastStore';
import type { Customer, Transaction } from '@/types/domain';

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
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

async function handleCustomerRealtimeEvent(payload: {
  eventType: string;
  new?: Record<string, unknown>;
  old?: Record<string, unknown>;
}) {
  if (!payload.new || !payload.new.id) return;

  const raw = payload.new;
  const existingLocal = await db.customers.get(String(raw.id));

  // Deduplication & Conflict Check: If local updated_at is newer than cloud event, preserve local until synced
  if (existingLocal && existingLocal.syncStatus === 'pending') {
    return;
  }

  const updatedCustomer: Customer = {
    id: String(raw.id),
    name: String(raw.name),
    mobile: String(raw.mobile || ''),
    alternateName: raw.alternate_name ? String(raw.alternate_name) : null,
    address: raw.address ? String(raw.address) : null,
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
    message: `ग्राहक '${updatedCustomer.name}' मधील नवीन नोंद अपडेट झाली. (Customer updated)`,
  });
}

async function handleTransactionRealtimeEvent(payload: {
  eventType: string;
  new?: Record<string, unknown>;
  old?: Record<string, unknown>;
}) {
  if (!payload.new || !payload.new.id) return;

  const raw = payload.new;
  const existingLocal = await db.transactions.get(String(raw.id));

  // Deduplication check
  if (existingLocal && existingLocal.syncStatus === 'pending') {
    return;
  }

  const updatedTransaction: Transaction = {
    id: String(raw.id),
    customerId: String(raw.customer_id),
    type: raw.type as 'credit' | 'payment',
    amount: Number(raw.amount || 0),
    paymentMode: (raw.payment_mode as 'cash' | 'upi' | 'bank_transfer' | 'other' | null) || null,
    description: raw.description ? String(raw.description) : null,
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
    message: `नवीन ${typeLabel} नोंद: ₹${updatedTransaction.amount} जोडली गेली.`,
  });
}
