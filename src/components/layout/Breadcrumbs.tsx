import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui/breadcrumb";

const SEGMENT_LABELS: Record<string, string> = {
  tenants: "Tenants",
  users: "Usuarios",
  dashboard: "Dashboard",
  conversations: "Conversaciones",
  leads: "Leads",
  activity: "Actividad",
  tools: "Herramientas",
  preview: "Preview",
  stats: "Métricas",
  new: "Nuevo",
  "change-password": "Cambiar contraseña",
};

export function Breadcrumbs() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();

  const segments = location.pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;

  // Construir los crumbs acumulando el path
  const crumbs = segments.map((segment, index) => {
    const path = "/" + segments.slice(0, index + 1).join("/");
    const isTenantId = segment === params.tenantId;
    const isConversationId = segment === params.conversationId;

    let label = SEGMENT_LABELS[segment] ?? segment;
    if (isTenantId) label = params.tenantId!;
    if (isConversationId) label = "Conversación";

    return { path, label, isLast: index === segments.length - 1 };
  });

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        {crumbs.map((crumb, index) => (
          <div key={crumb.path} className="flex items-center gap-1.5">
            {index > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {crumb.isLast ? (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink
                  className="cursor-pointer"
                  onClick={() => navigate(crumb.path)}
                >
                  {crumb.label}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
