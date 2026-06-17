import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getDashboard } from "../../api/tenants";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";

function StatCard({
  title,
  value,
  subtitle,
  alert = false,
}: {
  title: string;
  value: number;
  subtitle?: string;
  alert?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p
          className={`text-3xl font-bold ${alert && value > 0 ? "text-red-500" : "text-foreground"}`}
        >
          {value}
        </p>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
    refetchInterval: 60_000,
  });

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Resumen global de la plataforma</p>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Cargando...</p>
      ) : (
        data && (
          <>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Total histórico
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                title="Negocios"
                value={data.totalTenants}
                subtitle="tenants registrados"
              />
              <StatCard
                title="Conversaciones"
                value={data.totalConversations}
                subtitle="total histórico"
              />
              <StatCard
                title="Activas ahora"
                value={data.activeConversations}
                subtitle="conversaciones en curso"
              />
              <StatCard
                title="Leads generados"
                value={data.totalLeads}
                subtitle="total histórico"
              />
            </div>

            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Últimas 24 horas
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              <StatCard
                title="Leads"
                value={data.last24h.leads}
                subtitle="leads generados hoy"
              />
              <StatCard
                title="Mensajes"
                value={data.last24h.messages}
                subtitle="mensajes intercambiados"
              />
              <StatCard
                title="Negocios con errores"
                value={data.last24h.tenantsWithErrors}
                subtitle="con errores en las últimas 24h"
                alert
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => navigate("/")}
                className="text-sm text-blue-600 hover:underline"
              >
                Ver todos los tenants →
              </button>
            </div>
          </>
        )
      )}
    </div>
  );
}
