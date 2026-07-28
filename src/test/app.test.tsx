import { render, screen, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from '@/store/authStore';
import { PWAUpdatePrompt } from '@/components/feedback/PWAUpdatePrompt';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { LoginPage } from '@/features/auth/components/LoginPage';
import { AppProviders } from '@/app/providers';
import { MemoryRouter } from 'react-router-dom';

describe('Application Core Foundation', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
    vi.restoreAllMocks();
  });

  it('renders login page when unauthenticated', async () => {
    await act(async () => {
      render(
        <AppProviders>
          <MemoryRouter initialEntries={['/login']}>
            <LoginPage />
          </MemoryRouter>
        </AppProviders>
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/उधारी खाता/i)).toBeInTheDocument();
      expect(screen.getByText(/६-अंकी सिक्युरिटी पिन टाका/i)).toBeInTheDocument();
    });
  });

  it('renders dashboard page when authenticated', async () => {
    useAuthStore.setState({
      user: {
        id: 'user-1',
        displayName: 'माऊली डेअरी',
        role: 'owner',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      isAuthenticated: true,
      isLoading: false,
    });

    await act(async () => {
      render(
        <AppProviders>
          <MemoryRouter initialEntries={['/']}>
            <DashboardPage />
          </MemoryRouter>
        </AppProviders>
      );
    });

    expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
    expect(screen.getByText(/दूध विक्री व खाते सारांश/i)).toBeInTheDocument();
  });

  it('loads PWA update prompt safely', () => {
    const { container } = render(<PWAUpdatePrompt />);
    expect(container).toBeInTheDocument();
  });
});
