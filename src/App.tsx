import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./lib/auth-context";
import AppLayout from "./components/layout/AppLayout";
import LoginPage from "./pages/auth/LoginPage";
import TenantsListPage from "./pages/tenants/TenantsListPage";
import TenantFormPage from "./pages/tenants/TenantFormPage";
import TenantStatsPage from "./pages/tenants/TenantStatsPage";
import ConversationsPage from "./pages/tenants/ConversationsPage";
import ConversationDetailPage from "./pages/tenants/ConversationDetailPage";
import UsersPage from "./pages/users/UsersPage";
import ChangePasswordPage from "./pages/profile/ChangePasswordPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import ActivityPage from "./pages/tenants/ActivityPage";
import LeadsPage from "./pages/tenants/LeadsPage";
import BotPreviewPage from "./pages/tenants/BotPreviewPage";
import ToolsPage from "./pages/tenants/ToolsPage";
import { Toaster } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";

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
  if (user?.tenantId)
    return <Navigate to={`/tenants/${user.tenantId}/stats`} replace />;
  return <p className="p-8 text-gray-500">Sin acceso.</p>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
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
                <Route path="/users" element={<UsersPage />} />
                <Route
                  path="/change-password"
                  element={<ChangePasswordPage />}
                />
                <Route path="/tenants/new" element={<TenantFormPage />} />
                <Route path="/tenants/:tenantId" element={<TenantFormPage />} />
                <Route
                  path="/tenants/:tenantId/stats"
                  element={<TenantStatsPage />}
                />
                <Route
                  path="/tenants/:tenantId/conversations"
                  element={<ConversationsPage />}
                />
                <Route
                  path="/tenants/:tenantId/conversations/:conversationId"
                  element={<ConversationDetailPage />}
                />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route
                  path="/tenants/:tenantId/activity"
                  element={<ActivityPage />}
                />
                <Route
                  path="/tenants/:tenantId/leads"
                  element={<LeadsPage />}
                />
                <Route
                  path="/tenants/:tenantId/preview"
                  element={<BotPreviewPage />}
                />
                <Route
                  path="/tenants/:tenantId/tools"
                  element={<ToolsPage />}
                />
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
