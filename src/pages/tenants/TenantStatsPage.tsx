import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getTenantStats, getTenant } from '../../api/tenants';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

function StatCard({ title, value, subtitle }: { title: string; value: number; subtitle?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

export default function TenantStatsPage() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const navigate = useNavigate();

  const { data: tenant } = useQuery({
    queryKey: ['tenant', tenantId],
    queryFn: () => getTenant(tenantId!),
    enabled: !!tenantId,
  });

  const { data: stats, isLoading } = useQuery({
    queryKey: ['tenant-stats', tenantId],
    queryFn: () => getTenantStats(tenantId!),
    enabled: !!tenantId,
    refetchInterval: 30_000, // refresca cada 30 segundos
  });

  if (isLoading) return <p className="p-8 text-gray-500">Cargando métricas...</p>;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Métricas — {tenant?.businessName ?? tenantId}
          </h1>
          <p className="text-gray-500 mt-1 font-mono text-sm">{tenantId}</p>
        </div>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Volver
        </Button>
      </div>

      {stats && (
        <>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Total histórico
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard title="Conversaciones totales" value={stats.totalConversations} />
            <StatCard title="Activas" value={stats.activeConversations} />
            <StatCard title="Leads generados" value={stats.leadsGenerated} />
            <StatCard title="Derivadas a humano" value={stats.handedToHuman} />
          </div>

          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Últimos 7 días
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              title="Mensajes"
              value={stats.last7Days.messages}
              subtitle="mensajes intercambiados"
            />
            <StatCard
              title="Leads"
              value={stats.last7Days.leads}
              subtitle="leads generados"
            />
          </div>
        </>
      )}
    </div>
  );
}