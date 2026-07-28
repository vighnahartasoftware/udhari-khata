import { create } from 'zustand';
import { getAuthAdapter } from '@/services/auth.adapter';
import type { UserProfile } from '@/types/domain';

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  setUser: (user: UserProfile | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => Promise<void>;
  isOwner: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  initialize: async () => {
    try {
      set({ isLoading: true, error: null });
      const adapter = getAuthAdapter();
      const userProfile = await adapter.restoreSession();

      if (!userProfile) {
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }

      set({
        user: userProfile,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'सत्र लोड करताना त्रुटी (Session load error)';
      set({ user: null, isAuthenticated: false, isLoading: false, error: msg });
    }
  },

  setUser: (user) => set({ user, isAuthenticated: user !== null, isLoading: false }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  logout: async () => {
    try {
      set({ isLoading: true });
      const adapter = getAuthAdapter();
      await adapter.logout();
    } catch (err: unknown) {
      console.error('Logout error:', err);
    } finally {
      set({ user: null, isAuthenticated: false, isLoading: false, error: null });
    }
  },

  isOwner: () => get().user?.role === 'owner',
}));
