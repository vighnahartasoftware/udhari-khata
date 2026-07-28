import type { Customer, Transaction } from '@/types/domain';

export interface CustomerRepository {
  getAll(): Promise<Customer[]>;
  getById(id: string): Promise<Customer | null>;
  searchByNameOrMobile(query: string): Promise<Customer[]>;
  create(customer: Omit<Customer, 'createdAt' | 'updatedAt'>): Promise<Customer>;
  update(id: string, updates: Partial<Customer>): Promise<Customer>;
  delete(id: string): Promise<void>;
}

export interface TransactionRepository {
  getAll(): Promise<Transaction[]>;
  getById(id: string): Promise<Transaction | null>;
  getByCustomerId(customerId: string): Promise<Transaction[]>;
  create(transaction: Omit<Transaction, 'createdAt' | 'updatedAt'>): Promise<Transaction>;
  update(id: string, updates: Partial<Transaction>): Promise<Transaction>;
  deleteSoft(id: string): Promise<void>;
}
