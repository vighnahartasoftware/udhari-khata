import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { Loader2 } from 'lucide-react';

const LoginPage = lazy(() =>
  import('@/features/auth/components/LoginPage').then((m) => ({ default: m.LoginPage }))
);
const DashboardPage = lazy(() =>
  import('@/features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);
const CustomerListPage = lazy(() =>
  import('@/features/customers/CustomerListPage').then((m) => ({ default: m.CustomerListPage }))
);
const CustomerDetailPage = lazy(() =>
  import('@/features/customers/CustomerDetailPage').then((m) => ({ default: m.CustomerDetailPage }))
);
const NewTransactionPage = lazy(() =>
  import('@/features/transactions/NewTransactionPage').then((m) => ({ default: m.NewTransactionPage }))
);
const ReportsPage = lazy(() =>
  import('@/features/reports/ReportsPage').then((m) => ({ default: m.ReportsPage }))
);
const SettingsPage = lazy(() =>
  import('@/features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage }))
);

const PageFallback = () => (
  <div className="flex items-center justify-center min-h-[60vh] text-slate-400">
    <Loader2 className="w-7 h-7 text-sky-500 animate-spin" />
  </div>
);

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <Suspense fallback={<PageFallback />}>
        <LoginPage />
      </Suspense>
    ),
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            path: '/',
            element: (
              <Suspense fallback={<PageFallback />}>
                <DashboardPage />
              </Suspense>
            ),
          },
          {
            path: '/customers',
            element: (
              <Suspense fallback={<PageFallback />}>
                <CustomerListPage />
              </Suspense>
            ),
          },
          {
            path: '/customers/:customerId',
            element: (
              <Suspense fallback={<PageFallback />}>
                <CustomerDetailPage />
              </Suspense>
            ),
          },
          {
            path: '/transactions/new',
            element: (
              <Suspense fallback={<PageFallback />}>
                <NewTransactionPage />
              </Suspense>
            ),
          },
          {
            path: '/reports',
            element: (
              <Suspense fallback={<PageFallback />}>
                <ReportsPage />
              </Suspense>
            ),
          },
          {
            path: '/settings',
            element: (
              <Suspense fallback={<PageFallback />}>
                <SettingsPage />
              </Suspense>
            ),
          },
        ],
      },
    ],
  },
]);
