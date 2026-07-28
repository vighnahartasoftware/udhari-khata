import { supabase } from '@/lib/supabase';
import { db } from '@/db/dexie';
import { env } from '@/lib/env';
import type { UserProfile } from '@/types/domain';
import { DEMO_OWNER_PROFILE, DEMO_STAFF_PROFILE, runLocalSeedIfNeeded } from '@/db/seed';

export const APP_SECURITY_PIN = '423203';

export interface IAuthAdapter {
  login(email: string, password: string): Promise<UserProfile>;
  signUp(email: string, password: string, displayName: string): Promise<UserProfile>;
  loginWithPin(pin: string): Promise<UserProfile>;
  logout(): Promise<void>;
  restoreSession(): Promise<UserProfile | null>;
}

export class LocalAuthAdapter implements IAuthAdapter {
  async loginWithPin(pin: string): Promise<UserProfile> {
    await runLocalSeedIfNeeded();

    if (pin.trim() !== APP_SECURITY_PIN) {
      throw new Error('गलत PIN कोड! कृपया योग्य ६-अंकी पिन प्रविष्ट करा. (Invalid PIN)');
    }

    const profile: UserProfile = {
      id: DEMO_OWNER_PROFILE.id,
      displayName: 'दर्शन अहिरे (मालक)',
      role: 'owner',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.appSettings.put({
      key: 'activeSessionProfile',
      value: profile,
      updatedAt: new Date().toISOString(),
    });

    return profile;
  }

  async login(email: string, password: string): Promise<UserProfile> {
    await runLocalSeedIfNeeded();

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (cleanEmail === DEMO_OWNER_PROFILE.email && cleanPassword === DEMO_OWNER_PROFILE.password) {
      const profile: UserProfile = {
        id: DEMO_OWNER_PROFILE.id,
        displayName: 'दर्शन अहिरे (मालक)',
        role: 'owner',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await db.appSettings.put({
        key: 'activeSessionProfile',
        value: profile,
        updatedAt: new Date().toISOString(),
      });

      return profile;
    }

    if (cleanEmail === DEMO_STAFF_PROFILE.email && cleanPassword === DEMO_STAFF_PROFILE.password) {
      const profile: UserProfile = {
        id: DEMO_STAFF_PROFILE.id,
        displayName: DEMO_STAFF_PROFILE.displayName,
        role: 'staff',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await db.appSettings.put({
        key: 'activeSessionProfile',
        value: profile,
        updatedAt: new Date().toISOString(),
      });

      return profile;
    }

    throw new Error('अवैध डेअरी ईमेल किंवा पासवर्ड (Invalid email or password)');
  }

  async signUp(email: string, _password: string, displayName: string): Promise<UserProfile> {
    const profile: UserProfile = {
      id: 'user-' + Date.now(),
      displayName: displayName.trim() || email.split('@')[0],
      role: 'owner',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.appSettings.put({
      key: 'activeSessionProfile',
      value: profile,
      updatedAt: new Date().toISOString(),
    });

    return profile;
  }

  async logout(): Promise<void> {
    await db.appSettings.delete('activeSessionProfile');
  }

  async restoreSession(): Promise<UserProfile | null> {
    await runLocalSeedIfNeeded();
    const setting = await db.appSettings.get('activeSessionProfile');
    if (!setting || !setting.value) return null;
    return setting.value as UserProfile;
  }
}

export class SupabaseAuthAdapter implements IAuthAdapter {
  async loginWithPin(pin: string): Promise<UserProfile> {
    if (pin.trim() !== APP_SECURITY_PIN) {
      throw new Error('गलत PIN कोड! कृपया योग्य ६-अंकी पिन प्रविष्ट करा. (Invalid PIN)');
    }

    const profile: UserProfile = {
      id: 'owner-darshan-ahire-001',
      displayName: 'दर्शन अहिरे (मालक)',
      role: 'owner',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.appSettings.put({
      key: 'activeSessionProfile',
      value: profile,
      updatedAt: new Date().toISOString(),
    });

    return profile;
  }

  async login(email: string, password: string): Promise<UserProfile> {
    if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) {
      throw new Error(
        'Supabase URL & Anon Key missing in .env. Please check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
      );
    }

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    });

    if (authError) {
      throw new Error(authError.message);
    }

    if (!authData.user) {
      throw new Error('User not found after sign in.');
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle();

    const userProfile: UserProfile = {
      id: authData.user.id,
      displayName:
        profileData?.display_name ||
        (authData.user.user_metadata?.display_name as string) ||
        authData.user.email?.split('@')[0] ||
        'User',
      role: (profileData?.role as 'owner' | 'staff') || 'owner',
      isActive: profileData?.is_active ?? true,
      createdAt: profileData?.created_at || new Date().toISOString(),
      updatedAt: profileData?.updated_at || new Date().toISOString(),
    };

    // Store profile locally for IndexedDB session sync
    await db.appSettings.put({
      key: 'activeSessionProfile',
      value: userProfile,
      updatedAt: new Date().toISOString(),
    });

    return userProfile;
  }

  async signUp(email: string, password: string, displayName: string): Promise<UserProfile> {
    if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) {
      throw new Error(
        'Supabase URL & Anon Key missing in .env. Please check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
      );
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password: password.trim(),
      options: {
        data: {
          display_name: displayName.trim(),
        },
      },
    });

    if (authError) {
      throw new Error(authError.message);
    }

    if (!authData.user) {
      throw new Error('Sign up failed. Please try again.');
    }

    const now = new Date().toISOString();
    const userProfile: UserProfile = {
      id: authData.user.id,
      displayName: displayName.trim() || email.split('@')[0],
      role: 'owner',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    // Create profile in Supabase profiles table
    await supabase.from('profiles').upsert({
      id: authData.user.id,
      display_name: userProfile.displayName,
      role: 'owner',
      is_active: true,
      updated_at: now,
    } as never);

    await db.appSettings.put({
      key: 'activeSessionProfile',
      value: userProfile,
      updatedAt: now,
    });

    return userProfile;
  }

  async logout(): Promise<void> {
    await db.appSettings.delete('activeSessionProfile');
    await supabase.auth.signOut();
  }

  async restoreSession(): Promise<UserProfile | null> {
    const setting = await db.appSettings.get('activeSessionProfile');
    if (setting && setting.value) {
      return setting.value as UserProfile;
    }

    if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) {
      return null;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session || !session.user) {
      return null;
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle();

    return {
      id: session.user.id,
      displayName:
        profileData?.display_name ||
        (session.user.user_metadata?.display_name as string) ||
        session.user.email?.split('@')[0] ||
        'User',
      role: (profileData?.role as 'owner' | 'staff') || 'owner',
      isActive: profileData?.is_active ?? true,
      createdAt: profileData?.created_at || new Date().toISOString(),
      updatedAt: profileData?.updated_at || new Date().toISOString(),
    };
  }
}

export function getAuthAdapter(): IAuthAdapter {
  if (env.VITE_DATA_MODE === 'supabase') {
    return new SupabaseAuthAdapter();
  }
  return new LocalAuthAdapter();
}
