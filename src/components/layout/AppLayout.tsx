import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/auth-context";
import { Button } from "../ui/button";

export default function AppLayout() {
  const { user, signOut, isSuperAdmin } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    signOut();
    navigate("/login");
  };

  const navLink = (to: string, label: string, end = false) => (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          isActive
            ? "bg-gray-100 text-gray-900"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        }`
      }
    >
      {label}
    </NavLink>
  );

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-lg font-bold text-gray-900">Bot WhatsApp</h1>
          <p className="text-xs text-gray-500 mt-1">{user?.email}</p>
          <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 capitalize">
            {user?.role}
          </span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {isSuperAdmin && (
            <>
              {navLink("/dashboard", "Dashboard")}
              {navLink("/", "Tenants", true)}
              {navLink("/users", "Usuarios")}
              {navLink("/change-password", "Cambiar contraseña")}
              {navLink(`/tenants/${user?.tenantId}/activity`, 'Actividad')}
            </>
          )}

          {!isSuperAdmin && user?.tenantId && (
            <>
              {navLink(`/tenants/${user.tenantId}`, "Mi configuración")}
              {navLink(`/tenants/${user.tenantId}/stats`, "Métricas")}
              {navLink(
                `/tenants/${user.tenantId}/conversations`,
                "Conversaciones",
              )}
              {navLink("/change-password", "Cambiar contraseña")}
            </>
          )}
        </nav>

        <div className="p-4 border-t">
          <Button variant="outline" className="w-full" onClick={handleSignOut}>
            Cerrar sesión
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
