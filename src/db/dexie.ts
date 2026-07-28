import Dexie, { type Table } from 'dexie';
import type { Customer, Transaction, ActivityLog, SyncQueueItem, UserProfile } from '@/types/domain';

export interface AppSetting {
  key: string;
  value: unknown;
  updatedAt: string;
}

export class UdhariKhataDatabase extends Dexie {
  profiles!: Table<UserProfile, string>;
  customers!: Table<Customer, string>;
  transactions!: Table<Transaction, string>;
  activityLogs!: Table<ActivityLog, string>;
  syncQueue!: Table<SyncQueueItem, number>;
  appSettings!: Table<AppSetting, string>;

  constructor() {
    super('UdhariKhataDB');

    this.version(1).stores({
      profiles: 'id, role, isActive',
      customers: 'id, name, mobile, createdBy, syncStatus, isActive',
      transactions: 'id, customerId, type, createdBy, syncStatus',
      activityLogs: '++id, entityType, entityId, performedBy',
      syncQueue: '++id, entityType, entityId',
      appSettings: 'key',
    });

    this.version(2).stores({
      profiles: 'id, role, isActive',
      customers: 'id, name, mobile, createdBy, syncStatus, isActive',
      transactions: 'id, customerId, type, createdBy, syncStatus',
      activityLogs: '++id, entityType, entityId, performedBy',
      syncQueue: '++id, entityType, entityId',
      appSettings: 'key',
    });
  }
}

export const db = new UdhariKhataDatabase();
