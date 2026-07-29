import { supabase } from '@/lib/supabase';
import type { Transaction, TransactionType, PaymentMode } from '@/types/domain';
import type { Database } from '@/types/supabase';
import type { TransactionRepository } from './repository.interface';

type TransactionUpdatePayload = Database['public']['Tables']['transactions']['Update'];

export class CloudTransactionRepository implements TransactionRepository {
  async getAll(): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .is('deleted_at', null);
    if (error) throw error;
    return (data || []).map((r) => this.mapToDomain(r as Record<string, unknown>));
  }

  async getById(id: string): Promise<Transaction | null> {
    const { data, error } = await supabase.from('transactions').select('*').eq('id', id).single();
    if (error) return null;
    return data ? this.mapToDomain(data as Record<string, unknown>) : null;
  }

  async getByCustomerId(customerId: string): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('customer_id', customerId)
      .is('deleted_at', null)
      .order('transaction_date', { ascending: false });
    if (error) throw error;
    return (data || []).map((r) => this.mapToDomain(r as Record<string, unknown>));
  }

  async create(data: Omit<Transaction, 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    const payload: Record<string, unknown> = {
      id: data.id,
      customer_id: data.customerId,
      type: data.type,
      amount: data.amount,
      payment_mode: data.paymentMode || null,
      description: data.description || null,
      recorded_by: data.recordedBy || null,
      transaction_date: data.transactionDate,
      version: data.version || 1,
    };

    if (data.createdBy && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.createdBy)) {
      payload.created_by = data.createdBy;
    }

    const { data: created, error } = await supabase
      .from('transactions')
      .insert(payload as never)
      .select()
      .single();

    if (error) {
      if (payload.created_by) {
        delete payload.created_by;
        const { data: createdFallback, error: fallbackErr } = await supabase
          .from('transactions')
          .insert(payload as never)
          .select()
          .single();

        if (!fallbackErr && createdFallback) {
          return this.mapToDomain(createdFallback as Record<string, unknown>);
        }
      }
      throw error;
    }

    return this.mapToDomain(created as Record<string, unknown>);
  }

  async update(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    const updateData: TransactionUpdatePayload = {};
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.amount !== undefined) updateData.amount = updates.amount;
    if (updates.paymentMode !== undefined) updateData.payment_mode = updates.paymentMode;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.recordedBy !== undefined) updateData.recorded_by = updates.recordedBy;
    if (updates.transactionDate !== undefined) updateData.transaction_date = updates.transactionDate;
    if (updates.version !== undefined) updateData.version = updates.version;

    const { data: updated, error } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.mapToDomain(updated as Record<string, unknown>);
  }

  async deleteSoft(id: string): Promise<void> {
    const { error } = await supabase
      .from('transactions')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  }

  private mapToDomain(row: Record<string, unknown>): Transaction {
    return {
      id: String(row.id),
      customerId: String(row.customer_id),
      type: row.type as TransactionType,
      amount: Number(row.amount || 0),
      paymentMode: (row.payment_mode as PaymentMode | null) || null,
      description: row.description ? String(row.description) : null,
      recordedBy: row.recorded_by ? String(row.recorded_by) : null,
      transactionDate: String(row.transaction_date),
      createdBy: String(row.created_by || ''),
      createdAt: String(row.created_at || new Date().toISOString()),
      updatedAt: String(row.updated_at || new Date().toISOString()),
      version: Number(row.version || 1),
      syncStatus: 'synced',
      deletedAt: row.deleted_at ? String(row.deleted_at) : null,
    };
  }
}

export const cloudTransactionRepository = new CloudTransactionRepository();
