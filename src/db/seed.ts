import { db } from './dexie';
import type { Customer, Transaction, ActivityLog } from '@/types/domain';
import { env } from '@/lib/env';

export const SEED_VERSION = 'v1.0';

export const DEMO_OWNER_PROFILE = {
  id: '00000000-0000-4000-a000-000000000001',
  email: 'admin@udhari.local',
  password: 'Admin@123',
  displayName: 'अ‍ॅडमिन मालक (Demo Owner)',
  role: 'owner' as const,
  isActive: true,
};

export const DEMO_STAFF_PROFILE = {
  id: '00000000-0000-4000-a000-000000000002',
  email: 'brother@udhari.local',
  password: 'Brother@123',
  displayName: 'भाऊ स्टाफ (Demo Staff)',
  role: 'staff' as const,
  isActive: true,
};

export async function clearDemoData(): Promise<void> {
  await db.customers.clear();
  await db.transactions.clear();
  await db.activityLogs.clear();
  await db.syncQueue.clear();
  await db.appSettings.delete('localSeedVersion');
}

export async function runLocalSeedIfNeeded(forceReset = false): Promise<boolean> {
  if (env.VITE_DATA_MODE === 'supabase' && !forceReset) {
    const existingVersion = await db.appSettings.get('localSeedVersion');
    if (existingVersion) {
      await db.customers.where('id').startsWith('cust-').delete();
      await db.transactions.where('id').startsWith('txn-').delete();
      await db.appSettings.delete('localSeedVersion');
    }
    return false;
  }

  if (!forceReset) {
    const existingVersion = await db.appSettings.get('localSeedVersion');
    if (existingVersion) {
      return false; // Already seeded
    }
  }

  if (forceReset) {
    await clearDemoData();
  }

  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  const demoCustomers: Customer[] = [
    {
      id: 'cust-001',
      name: 'दर्शन पाटील',
      mobile: '9822012345',
      alternateName: 'पाटील काका',
      address: 'मुख्य चौक, पुणे',
      openingBalance: 500,
      notes: 'दररोज २L म्हशीचे दूध',
      isActive: true,
      createdBy: DEMO_OWNER_PROFILE.id,
      createdAt: twoDaysAgo.toISOString(),
      updatedAt: now.toISOString(),
      version: 1,
      syncStatus: 'synced',
    },
    {
      id: 'cust-002',
      name: 'रमेश शिंदे',
      mobile: '9822023456',
      alternateName: 'शिंदे साहेब',
      address: 'नेहरू नगर',
      openingBalance: 0,
      notes: 'दररोज १.५L गाईचे दूध',
      isActive: true,
      createdBy: DEMO_STAFF_PROFILE.id,
      createdAt: twoDaysAgo.toISOString(),
      updatedAt: now.toISOString(),
      version: 1,
      syncStatus: 'synced',
    },
    {
      id: 'cust-003',
      name: 'सचिन जाधव',
      mobile: '9822034567',
      alternateName: 'जाधव भाऊ',
      address: 'स्टेशन रोड',
      openingBalance: 1200,
      notes: 'केवळ जुनी उधारी बाकी',
      isActive: true,
      createdBy: DEMO_OWNER_PROFILE.id,
      createdAt: twoDaysAgo.toISOString(),
      updatedAt: now.toISOString(),
      version: 1,
      syncStatus: 'synced',
    },
    {
      id: 'cust-004',
      name: 'अमोल कदम',
      mobile: '9822045678',
      alternateName: null,
      address: 'शिवाजी नगर',
      openingBalance: 0,
      notes: 'नवीन ग्राहक (No transactions)',
      isActive: true,
      createdBy: DEMO_STAFF_PROFILE.id,
      createdAt: yesterday.toISOString(),
      updatedAt: now.toISOString(),
      version: 1,
      syncStatus: 'synced',
    },
    {
      id: 'cust-005',
      name: 'सुरेश पवार',
      mobile: '9822056789',
      alternateName: 'पवार मामा',
      address: 'डेअरी कॉलनी',
      openingBalance: 300,
      notes: 'दररोज १L दूध + लोणी',
      isActive: true,
      createdBy: DEMO_OWNER_PROFILE.id,
      createdAt: twoDaysAgo.toISOString(),
      updatedAt: now.toISOString(),
      version: 1,
      syncStatus: 'synced',
    },
  ];

  const demoTransactions: Transaction[] = [
    {
      id: 'txn-001',
      customerId: 'cust-001',
      type: 'credit',
      amount: 250,
      paymentMode: null,
      description: '२L दूध + २००g पनीर',
      transactionDate: twoDaysAgo.toISOString(),
      createdBy: DEMO_OWNER_PROFILE.id,
      createdAt: twoDaysAgo.toISOString(),
      updatedAt: twoDaysAgo.toISOString(),
      version: 1,
      syncStatus: 'synced',
      deletedAt: null,
    },
    {
      id: 'txn-002',
      customerId: 'cust-001',
      type: 'payment',
      amount: 300,
      paymentMode: 'upi',
      description: 'PhonePay UPI जमा',
      transactionDate: yesterday.toISOString(),
      createdBy: DEMO_STAFF_PROFILE.id,
      createdAt: yesterday.toISOString(),
      updatedAt: yesterday.toISOString(),
      version: 1,
      syncStatus: 'synced',
      deletedAt: null,
    },
    {
      id: 'txn-003',
      customerId: 'cust-002',
      type: 'credit',
      amount: 400,
      paymentMode: null,
      description: 'दूध ५ दिवस सलग',
      transactionDate: twoDaysAgo.toISOString(),
      createdBy: DEMO_STAFF_PROFILE.id,
      createdAt: twoDaysAgo.toISOString(),
      updatedAt: twoDaysAgo.toISOString(),
      version: 1,
      syncStatus: 'synced',
      deletedAt: null,
    },
    {
      id: 'txn-004',
      customerId: 'cust-002',
      type: 'payment',
      amount: 400,
      paymentMode: 'cash',
      description: 'रोख जमा (माफ केले)',
      transactionDate: yesterday.toISOString(),
      createdBy: DEMO_OWNER_PROFILE.id,
      createdAt: yesterday.toISOString(),
      updatedAt: yesterday.toISOString(),
      version: 1,
      syncStatus: 'synced',
      deletedAt: null,
    },
    {
      id: 'txn-005',
      customerId: 'cust-005',
      type: 'credit',
      amount: 180,
      paymentMode: null,
      description: '३ दिवस १L गाईचे दूध',
      transactionDate: now.toISOString(),
      createdBy: DEMO_STAFF_PROFILE.id,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      version: 1,
      syncStatus: 'synced',
      deletedAt: null,
    },
  ];

  const demoActivityLogs: ActivityLog[] = [
    {
      id: 'act-001',
      entityType: 'customer',
      entityId: 'cust-001',
      action: 'create',
      oldValue: null,
      newValue: { name: 'दर्शन पाटील' },
      performedBy: DEMO_OWNER_PROFILE.id,
      performedAt: twoDaysAgo.toISOString(),
    },
    {
      id: 'act-002',
      entityType: 'transaction',
      entityId: 'txn-002',
      action: 'create',
      oldValue: null,
      newValue: { amount: 300, type: 'payment' },
      performedBy: DEMO_STAFF_PROFILE.id,
      performedAt: yesterday.toISOString(),
    },
  ];

  await db.customers.bulkPut(demoCustomers);
  await db.transactions.bulkPut(demoTransactions);
  await db.activityLogs.bulkPut(demoActivityLogs);

  await db.appSettings.put({
    key: 'localSeedVersion',
    value: SEED_VERSION,
    updatedAt: now.toISOString(),
  });

  return true;
}
