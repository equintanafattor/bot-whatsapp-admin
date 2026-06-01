import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './lib/auth-context';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/auth/LoginPage';
import TenantsListPage from './pages/tenants/TenantsListPage';
import TenantFormPage from './pages/tenants/TenantFormPage';
import TenantStatsPage from './pages/tenants/TenantStatsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function HomeRedirect() {
  const { isSuperAdmin, user } = useAuth();
  if (isSuperAdmin) return <TenantsListPage />;
  if (user?.tenantId) return <Navigate to={`/tenants/${user.tenantId}/stats`} replace />;
  return <p className="p-8 text-gray-500">Sin acceso.</p>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <AppLayout />
                </PrivateRoute>
              }
            >
              <Route index element={<HomeRedirect />} />
              <Route path="tenants/new" element={<TenantFormPage />} />
              <Route path="tenants/:tenantId" element={<TenantFormPage />} />
              <Route path="tenants/:tenantId/stats" element={<TenantStatsPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}