import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getDashboard, getUsage } from "../../api/tenants";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";

const numberFormat = new Intl.NumberFormat("es-AR");
const usdFormat = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "USD",
});

function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min`;
  return `${Math.floor(seconds / 3600)} h`;
}

function UsageTable() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-usage"],
    queryFn: () => getUsage(),
    refetchInterval: 5 * 60_000,
  });

  if (isLoading) return <p className="text-muted-foreground">Cargando consumo...</p>;
  if (!data) return null;

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="text-base">
          Consumo de IA — {data.month}
          <span className="ml-2 font-normal text-muted-foreground">
            (costo estimado total: {usdFormat.format(data.totalEstimatedCostUsd)})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Negocio</TableHead>
              <TableHead className="text-right">Respuestas del bot</TableHead>
              <TableHead className="text-right">Límite mensual</TableHead>
              <TableHead className="text-right">Llamadas a IA</TableHead>
              <TableHead className="text-right">Tokens (entrada / salida)</TableHead>
              <TableHead className="text-right">Costo estimado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.tenants.map((t) => (
              <TableRow key={t.tenantId}>
                <TableCell className="font-medium">{t.businessName}</TableCell>
                <TableCell className="text-right">
                  {numberFormat.format(t.botReplies)}
                </TableCell>
                <TableCell className="text-right">
                  {t.monthlyMessageLimit
                    ? numberFormat.format(t.monthlyMessageLimit)
                    : "Sin límite"}
                </TableCell>
                <TableCell className="text-right">
                  {numberFormat.format(t.llmRequests)}
                </TableCell>
                <TableCell className="text-right">
                  {numberFormat.format(t.inputTokens)} / {numberFormat.format(t.outputTokens)}
                  {t.inputTokens > 0 && (
                    <span className="block text-xs text-muted-foreground">
                      {Math.round((t.cacheReadTokens / t.inputTokens) * 100)}% desde caché
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {usdFormat.format(t.estimatedCostUsd)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p className="text-xs text-muted-foreground mt-3">
          El consumo de IA se registra desde esta versión; los meses anteriores no tienen datos.
        </p>
      </CardContent>
    </Card>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  alert = false,
}: {
  title: string;
  value: number | string;
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
          className={`text-3xl font-bold ${alert && value !== 0 && value !== "0s" ? "text-red-500" : "text-foreground"}`}
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

            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Cola de mensajes
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              <StatCard
                title="En cola"
                value={data.queue.pending}
                subtitle="mensajes esperando respuesta"
              />
              <StatCard
                title="Espera más larga"
                value={formatDuration(data.queue.oldestPendingSeconds)}
                subtitle="si supera 1 minuto, algo anda mal"
                alert={data.queue.oldestPendingSeconds > 60}
              />
              <StatCard
                title="Mensajes fallidos"
                value={data.queue.failedLast24h}
                subtitle="sin respuesta del bot en 24h"
                alert
              />
            </div>

            <UsageTable />

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
