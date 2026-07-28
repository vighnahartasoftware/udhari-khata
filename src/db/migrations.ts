import type { Dexie } from 'dexie';
import { V1_SCHEMA } from './schema';

/**
 * Applies migrations and schema versions to the Dexie database instance.
 */
export function registerMigrations(db: Dexie): void {
  // Version 1 definition
  db.version(1).stores(V1_SCHEMA);

  // Future migrations structure example:
  // db.version(2).stores({ ... }).upgrade(async (tx) => { ... });
}
