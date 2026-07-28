export type UserRole = 'owner' | 'staff' | 'admin';

export type TransactionType = 'credit' | 'payment';

export type PaymentMode = 'cash' | 'upi' | 'bank_transfer' | 'other';

export type SyncStatus = 'synced' | 'pending' | 'failed';

export type EntityType = 'customer' | 'transaction' | 'profile' | 'system';

export type SyncOperation = 'INSERT' | 'UPDATE' | 'DELETE';

export type Gender = 'male' | 'female';

export type PerformerName = 'vivek' | 'nikhil';

export interface UserProfile {
  id: string; // UUID
  displayName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface Customer {
  id: string; // UUID
  name: string;
  mobile: string;
  alternateName: string | null;
  address: string | null;
  gender?: Gender | null;
  photoUrl?: string | null;
  recordedBy?: string | null;
  openingBalance: number;
  notes: string | null;
  isActive: boolean;
  createdBy: string; // UUID
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  version: number;
  syncStatus: SyncStatus;
}

export interface Transaction {
  id: string; // UUID
  customerId: string; // UUID
  type: TransactionType;
  amount: number;
  paymentMode: PaymentMode | null;
  description: string | null;
  recordedBy?: string | null;
  transactionDate: string; // ISO date string
  createdBy: string; // UUID
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  version: number;
  syncStatus: SyncStatus;
  deletedAt: string | null; // ISO date string
}

export interface ActivityLog {
  id: string; // UUID
  entityType: EntityType;
  entityId: string; // UUID
  action: 'create' | 'update' | 'delete' | 'sync';
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  performedBy: string; // UUID
  performedAt: string; // ISO date string
}

export interface SyncQueueItem {
  id?: number;
  entityType: 'customer' | 'transaction';
  entityId: string; // UUID
  operation: SyncOperation;
  payload: Record<string, unknown>;
  retryCount: number;
  lastError: string | null;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface AppSetting {
  key: string;
  value: unknown;
  updatedAt: string; // ISO date string
}
