import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/auth-context";
import { Button } from "../ui/button";
import { Sheet, SheetContent } from "../ui/sheet";
import { Breadcrumbs } from "./Breadcrumbs";
import {
  LayoutDashboard,
  Building2,
  Users,
  KeyRound,
  MessageSquare,
  BarChart2,
  Activity,
  Wrench,
  Bot,
  Trophy,
  LogOut,
  Menu,
  Smartphone,
} from "lucide-react";

export default function AppLayout() {
  const { user, signOut, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = () => {
    signOut();
    navigate("/login");
  };

  const navLink = (
    to: string,
    label: string,
    icon: React.ReactNode,
    end = false,
  ) => (
    <NavLink
      to={to}
      end={end}
      onClick={() => setMobileOpen(false)}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          isActive
            ? "bg-gray-100 text-gray-900"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        }`
      }
    >
      {icon}
      {label}
    </NavLink>
  );

  const sidebarContent = (
    <>
      <div className="p-6 border-b">
        <h1 className="text-lg font-bold text-gray-900">Bot WhatsApp</h1>
        <p className="text-xs text-gray-500 mt-1">{user?.email}</p>
        <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 capitalize">
          {user?.role}
        </span>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {isSuperAdmin && (
          <>
            {navLink("/dashboard", "Dashboard", <LayoutDashboard size={16} />)}
            {navLink("/", "Tenants", <Building2 size={16} />, true)}
            {navLink("/users", "Usuarios", <Users size={16} />)}
            {navLink(
              "/change-password",
              "Cambiar contraseña",
              <KeyRound size={16} />,
            )}
          </>
        )}

        {!isSuperAdmin && user?.tenantId && (
          <>
            {navLink(
              `/tenants/${user.tenantId}`,
              "Mi configuración",
              <Building2 size={16} />,
            )}
            {navLink(
              `/tenants/${user.tenantId}/stats`,
              "Métricas",
              <BarChart2 size={16} />,
            )}
            {navLink(
              `/tenants/${user.tenantId}/conversations`,
              "Conversaciones",
              <MessageSquare size={16} />,
            )}
            {navLink(
              `/tenants/${user.tenantId}/leads`,
              "Leads",
              <Trophy size={16} />,
            )}
            {navLink(
              `/tenants/${user.tenantId}/activity`,
              "Actividad",
              <Activity size={16} />,
            )}
            {navLink(
              `/tenants/${user.tenantId}/tools`,
              "Herramientas",
              <Wrench size={16} />,
            )}
            {navLink(
              `/tenants/${user.tenantId}/whatsapp-profile`,
              "Perfil de WhatsApp",
              <Smartphone size={16} />,
            )}
            {navLink(
              `/tenants/${user.tenantId}/preview`,
              "Preview bot",
              <Bot size={16} />,
            )}
            {navLink(
              "/change-password",
              "Cambiar contraseña",
              <KeyRound size={16} />,
            )}
          </>
        )}
      </nav>

      <div className="p-4 border-t">
        <Button
          variant="outline"
          className="w-full flex items-center gap-2"
          onClick={handleSignOut}
        >
          <LogOut size={16} />
          Cerrar sesión
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex w-64 bg-white border-r flex-col">
        {sidebarContent}
      </aside>

      {/* Sidebar mobile (Sheet) */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="w-64 p-0 flex flex-col"
          showCloseButton={false}
        >
          {sidebarContent}
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {/* Topbar mobile con hamburguesa */}
        <div className="md:hidden flex items-center gap-3 p-4 border-b bg-white sticky top-0 z-10">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={20} />
          </Button>
          <span className="font-semibold text-gray-900">Bot WhatsApp</span>
        </div>

        <div className="px-4 md:px-8 pt-6">
          <Breadcrumbs />
        </div>
        <Outlet />
      </main>
    </div>
  );
}
