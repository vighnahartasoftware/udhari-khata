import { describe, it, expect, beforeEach } from 'vitest';
import { LocalAuthAdapter, APP_SECURITY_PIN } from '@/services/auth.adapter';
import { runLocalSeedIfNeeded } from '@/db/seed';
import { db } from '@/db/dexie';

describe('Local Auth Adapter & Permissions', () => {
  let adapter: LocalAuthAdapter;

  beforeEach(async () => {
    adapter = new LocalAuthAdapter();
    await db.appSettings.clear();
  });

  it('authenticates with PIN 423203 successfully', async () => {
    const profile = await adapter.loginWithPin(APP_SECURITY_PIN);
    expect(profile.role).toBe('owner');
    expect(profile.displayName).toContain('बापू शिंदे');
  });

  it('rejects invalid PIN', async () => {
    await expect(adapter.loginWithPin('000000')).rejects.toThrow();
  });

  it('authenticates demo owner credentials successfully', async () => {
    const profile = await adapter.login('admin@udhari.local', 'Admin@123');
    expect(profile.role).toBe('owner');
  });

  it('authenticates demo staff credentials successfully', async () => {
    const profile = await adapter.login('brother@udhari.local', 'Brother@123');
    expect(profile.role).toBe('staff');
  });

  it('rejects invalid credentials', async () => {
    await expect(adapter.login('wrong@email.com', 'WrongPass')).rejects.toThrow();
  });

  it('restores session from IndexedDB after login', async () => {
    await adapter.loginWithPin(APP_SECURITY_PIN);
    const session = await adapter.restoreSession();
    expect(session).not.toBeNull();
    expect(session?.role).toBe('owner');
  });

  it('clears session on logout', async () => {
    await adapter.loginWithPin(APP_SECURITY_PIN);
    await adapter.logout();
    const session = await adapter.restoreSession();
    expect(session).toBeNull();
  });

  it('seeds Marathi demo customers on initial run', async () => {
    const seeded = await runLocalSeedIfNeeded(true);
    expect(seeded).toBe(true);

    const customers = await db.customers.toArray();
    expect(customers.length).toBeGreaterThanOrEqual(5);

    const darshan = customers.find((c) => c.name === 'दर्शन पाटील');
    expect(darshan).toBeDefined();
    expect(darshan?.mobile).toBe('9822012345');
  });
});
