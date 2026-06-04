import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getTenantActivity, getTenant } from "../../api/tenants";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";

const EVENT_CONFIG = {
  message: {
    label: "Mensaje",
    color: "bg-blue-500",
    variant: "secondary" as const,
  },
  lead: { label: "Lead", color: "bg-green-500", variant: "default" as const },
  handoff: {
    label: "Derivación",
    color: "bg-yellow-500",
    variant: "outline" as const,
  },
  error: {
    label: "Error",
    color: "bg-red-500",
    variant: "destructive" as const,
  },
};

const HOURS_OPTIONS = [
  { label: "Últimas 6h", value: 6 },
  { label: "Últimas 24h", value: 24 },
  { label: "Últimos 7d", value: 168 },
];

export default function ActivityPage() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const navigate = useNavigate();
  const [hours, setHours] = useState(24);

  const { data: tenant } = useQuery({
    queryKey: ["tenant", tenantId],
    queryFn: () => getTenant(tenantId!),
    enabled: !!tenantId,
  });

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["activity", tenantId, hours],
    queryFn: () => getTenantActivity(tenantId!, hours),
    enabled: !!tenantId,
    refetchInterval: 30_000,
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Actividad — {tenant?.businessName ?? tenantId}
          </h1>
          <p className="text-gray-500 mt-1">{events.length} eventos</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {HOURS_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                variant={hours === opt.value ? "default" : "outline"}
                size="sm"
                onClick={() => setHours(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
          <Button variant="outline" onClick={() => navigate(-1)}>
            Volver
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : events.length === 0 ? (
        <p className="text-gray-500">No hay actividad en este período.</p>
      ) : (
        <div className="space-y-2">
          {events.map((event, index) => {
            const config = EVENT_CONFIG[event.type] ?? EVENT_CONFIG.message;
            return (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-white rounded-lg border"
              >
                <div
                  className={`w-2 h-2 rounded-full mt-2 shrink-0 ${config.color}`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">
                    {event.description}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(event.createdAtUtc).toLocaleString("es-AR")}
                  </p>
                </div>
                <Badge variant={config.variant} className="shrink-0">
                  {config.label}
                </Badge>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
