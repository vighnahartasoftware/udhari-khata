import { supabase } from '@/lib/supabase';
import type { Customer } from '@/types/domain';
import type { Database } from '@/types/supabase';
import type { CustomerRepository } from './repository.interface';

type CustomerUpdatePayload = Database['public']['Tables']['customers']['Update'];

export class CloudCustomerRepository implements CustomerRepository {
  async getAll(): Promise<Customer[]> {
    const { data, error } = await supabase.from('customers').select('*').eq('is_active', true);
    if (error) throw error;
    return (data || []).map((r) => this.mapToDomain(r as Record<string, unknown>));
  }

  async getById(id: string): Promise<Customer | null> {
    const { data, error } = await supabase.from('customers').select('*').eq('id', id).single();
    if (error) return null;
    return data ? this.mapToDomain(data as Record<string, unknown>) : null;
  }

  async searchByNameOrMobile(query: string): Promise<Customer[]> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('is_active', true)
      .or(`name.ilike.%${query}%,mobile.ilike.%${query}%`);
    if (error) throw error;
    return (data || []).map((r) => this.mapToDomain(r as Record<string, unknown>));
  }

  async create(data: Omit<Customer, 'createdAt' | 'updatedAt'>): Promise<Customer> {
    const payload: Record<string, unknown> = {
      id: data.id,
      name: data.name,
      mobile: data.mobile || '',
      alternate_name: data.alternateName || null,
      address: data.address || null,
      opening_balance: data.openingBalance || 0,
      notes: data.notes || null,
      is_active: data.isActive ?? true,
      gender: data.gender || null,
      photo_url: data.photoUrl || null,
      recorded_by: data.recordedBy || null,
      version: data.version || 1,
    };

    if (data.createdBy && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.createdBy)) {
      payload.created_by = data.createdBy;
    }

    const { data: created, error } = await supabase
      .from('customers')
      .insert(payload as never)
      .select()
      .single();

    if (error) {
      if (payload.created_by) {
        delete payload.created_by;
        const { data: createdFallback, error: fallbackErr } = await supabase
          .from('customers')
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

  async update(id: string, updates: Partial<Customer>): Promise<Customer> {
    const updateData: CustomerUpdatePayload = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.mobile !== undefined) updateData.mobile = updates.mobile;
    if (updates.alternateName !== undefined) updateData.alternate_name = updates.alternateName;
    if (updates.address !== undefined) updateData.address = updates.address;
    if (updates.openingBalance !== undefined) updateData.opening_balance = updates.openingBalance;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
    if (updates.gender !== undefined) updateData.gender = updates.gender;
    if (updates.photoUrl !== undefined) updateData.photo_url = updates.photoUrl;
    if (updates.recordedBy !== undefined) updateData.recorded_by = updates.recordedBy;
    if (updates.version !== undefined) updateData.version = updates.version;

    const { data: updated, error } = await supabase
      .from('customers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.mapToDomain(updated as Record<string, unknown>);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) throw error;
  }

  private mapToDomain(row: Record<string, unknown>): Customer {
    return {
      id: String(row.id),
      name: String(row.name),
      mobile: String(row.mobile || ''),
      alternateName: row.alternate_name ? String(row.alternate_name) : null,
      address: row.address ? String(row.address) : null,
      gender: (row.gender as 'male' | 'female') || null,
      photoUrl: row.photo_url ? String(row.photo_url) : null,
      recordedBy: row.recorded_by ? String(row.recorded_by) : null,
      openingBalance: Number(row.opening_balance || 0),
      notes: row.notes ? String(row.notes) : null,
      isActive: Boolean(row.is_active),
      createdBy: String(row.created_by || ''),
      createdAt: String(row.created_at || new Date().toISOString()),
      updatedAt: String(row.updated_at || new Date().toISOString()),
      version: Number(row.version || 1),
      syncStatus: 'synced',
    };
  }
}

export const cloudCustomerRepository = new CloudCustomerRepository();
