import { db } from '@/db/dexie';
import { supabase } from '@/lib/supabase';
import type { Customer, Transaction } from '@/types/domain';

const MIGRATION_DONE_KEY = 'udhari_khata_supabase_migration_v1_done';

export interface MigrationResult {
  migratedCustomers: number;
  migratedTransactions: number;
  alreadyMigrated: boolean;
  error?: string;
}

export async function runOneTimeLegacyDataMigration(): Promise<MigrationResult> {
  try {
    if (typeof window === 'undefined') {
      return { migratedCustomers: 0, migratedTransactions: 0, alreadyMigrated: true };
    }

    const isDone = globalThis.localStorage.getItem(MIGRATION_DONE_KEY);
    if (isDone === 'true') {
      return { migratedCustomers: 0, migratedTransactions: 0, alreadyMigrated: true };
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return { migratedCustomers: 0, migratedTransactions: 0, alreadyMigrated: false };
    }

    // 1. Read existing local customers and transactions from Dexie / localStorage
    const localCustomers: Customer[] = await db.customers.toArray();
    const localTransactions: Transaction[] = await db.transactions.toArray();

    if (localCustomers.length === 0 && localTransactions.length === 0) {
      globalThis.localStorage.setItem(MIGRATION_DONE_KEY, 'true');
      return { migratedCustomers: 0, migratedTransactions: 0, alreadyMigrated: true };
    }

    console.log(`🚀 Starting legacy data migration: ${localCustomers.length} customers, ${localTransactions.length} transactions`);

    let customersMigrated = 0;
    let transactionsMigrated = 0;

    // 2. Migrate Customers first
    for (const c of localCustomers) {
      if (!c.id || !c.name) continue;

      // Check if already exists in Supabase
      const { data: existing } = await supabase
        .from('customers')
        .select('id')
        .eq('id', c.id)
        .maybeSingle();

      if (!existing) {
        const { error: insErr } = await supabase.from('customers').insert({
          id: c.id,
          name: c.name,
          mobile: c.mobile || '',
          alternate_name: c.alternateName || null,
          address: c.address || null,
          opening_balance: c.openingBalance || 0,
          notes: c.notes || null,
          is_active: c.isActive ?? true,
          gender: c.gender || null,
          photo_url: c.photoUrl || null,
          recorded_by: c.recordedBy || null,
          created_by: c.createdBy || '00000000-0000-4000-a000-000000000001',
          created_at: c.createdAt || new Date().toISOString(),
          updated_at: c.updatedAt || new Date().toISOString(),
          version: c.version || 1,
        });

        if (!insErr) {
          customersMigrated++;
          await db.customers.update(c.id, { syncStatus: 'synced' });
        }
      } else {
        await db.customers.update(c.id, { syncStatus: 'synced' });
      }
    }

    // 3. Migrate Transactions
    for (const t of localTransactions) {
      if (!t.id || !t.customerId) continue;

      const { data: existingTxn } = await supabase
        .from('transactions')
        .select('id')
        .eq('id', t.id)
        .maybeSingle();

      if (!existingTxn) {
        const { error: insTxnErr } = await supabase.from('transactions').insert({
          id: t.id,
          customer_id: t.customerId,
          type: t.type,
          amount: t.amount,
          payment_mode: t.paymentMode || null,
          description: t.description || null,
          recorded_by: t.recordedBy || null,
          transaction_date: t.transactionDate || new Date().toISOString(),
          created_by: t.createdBy || '00000000-0000-4000-a000-000000000001',
          created_at: t.createdAt || new Date().toISOString(),
          updated_at: t.updatedAt || new Date().toISOString(),
          version: t.version || 1,
          deleted_at: t.deletedAt || null,
        });

        if (!insTxnErr) {
          transactionsMigrated++;
          await db.transactions.update(t.id, { syncStatus: 'synced' });
        }
      } else {
        await db.transactions.update(t.id, { syncStatus: 'synced' });
      }
    }

    // Mark migration as completed in localStorage
    globalThis.localStorage.setItem(MIGRATION_DONE_KEY, 'true');
    console.log(`✅ One-time migration completed! (${customersMigrated} customers, ${transactionsMigrated} transactions uploaded)`);

    return {
      migratedCustomers: customersMigrated,
      migratedTransactions: transactionsMigrated,
      alreadyMigrated: false,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Migration failed';
    console.error('❌ Legacy data migration error:', errorMsg);
    return {
      migratedCustomers: 0,
      migratedTransactions: 0,
      alreadyMigrated: false,
      error: errorMsg,
    };
  }
}
