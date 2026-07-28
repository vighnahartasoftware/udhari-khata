import type { Customer, Transaction, ActivityLog, SyncQueueItem, AppSetting } from '@/types/domain';

export const DATABASE_NAME = 'UdhariKhataDB';
export const CURRENT_SCHEMA_VERSION = 1;

/**
 * Dexie schema index definition strings for version 1
 */
export const V1_SCHEMA = {
  customers: 'id, name, mobile, updatedAt, syncStatus, isActive, [name+mobile]',
  transactions: 'id, customerId, transactionDate, createdBy, updatedAt, syncStatus, type',
  activityLogs: 'id, entityType, entityId, performedAt, performedBy',
  syncQueue: 'id, createdAt, updatedAt, entityType, [entityType+entityId]',
  appSettings: 'key, updatedAt',
};

export type TableSchemas = {
  customers: Customer;
  transactions: Transaction;
  activityLogs: ActivityLog;
  syncQueue: SyncQueueItem;
  appSettings: AppSetting;
};
