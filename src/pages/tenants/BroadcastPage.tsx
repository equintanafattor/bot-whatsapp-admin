import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getContentTemplates,
  getBroadcasts,
  sendBroadcast,
  getTenant,
} from "../../api/tenants";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { toast } from "sonner";
import {
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Megaphone,
} from "lucide-react";

const STATUS_MAP: Record<
  string,
  { label: string; icon: typeof Clock; className: string }
> = {
  completed: {
    label: "Completado",
    icon: CheckCircle,
    className: "text-green-600",
  },
  failed: { label: "Fallido", icon: XCircle, className: "text-red-600" },
  sending: { label: "Enviando...", icon: Loader2, className: "text-blue-600" },
  pending: { label: "Pendiente", icon: Clock, className: "text-yellow-600" },
};

export default function BroadcastPage() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [productFilter, setProductFilter] = useState("");

  const { data: tenant } = useQuery({
    queryKey: ["tenant", tenantId],
    queryFn: () => getTenant(tenantId!),
    enabled: !!tenantId,
  });

  const { data: templates } = useQuery({
    queryKey: ["templates", tenantId],
    queryFn: () => getContentTemplates(tenantId!),
    enabled: !!tenantId && tenant?.messagingProvider !== 1,
  });

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ["broadcasts", tenantId],
    queryFn: () => getBroadcasts(tenantId!),
    enabled: !!tenantId,
    refetchInterval: 10000, // polling cada 10s para ver progreso
  });

  const sendMutation = useMutation({
    mutationFn: () => {
      const tpl = templates?.find((t) => t.sid === selectedTemplate);
      return sendBroadcast(tenantId!, {
        contentSid: selectedTemplate,
        templateName: tpl?.friendlyName ?? selectedTemplate,
        productFilter: productFilter || undefined,
      });
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["broadcasts", tenantId] });
      setSelectedTemplate("");
      setProductFilter("");
    },
    onError: () => toast.error("Error al iniciar el envío masivo."),
  });

  const approvedTemplates =
    templates?.filter((t) => t.approvalStatus === "approved") ?? [];

  if (tenant && tenant.messagingProvider === 1) {
    return (
      <div className="p-8 max-w-2xl">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Envío masivo
        </h1>
        <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900/50 rounded-lg p-6 mt-4">
          <p className="text-yellow-800 dark:text-yellow-300 font-medium mb-1">
            No disponible
          </p>
          <p className="text-yellow-700 dark:text-yellow-400 text-sm">
            El envío masivo solo está disponible para tenants que usan Twilio.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Envío masivo</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Enviá templates aprobados a tus leads
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Volver
        </Button>
      </div>

      {/* Formulario de envío */}
      <div className="bg-card rounded-xl border p-6 mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Nuevo envío
        </h2>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="template">Template aprobado</Label>
            {approvedTemplates.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay templates aprobados.{" "}
                <button
                  className="text-[#1D9E75] underline"
                  onClick={() => navigate(`/tenants/${tenantId}/templates`)}
                >
                  Crear uno
                </button>
              </p>
            ) : (
              <select
                id="template"
                className="w-full h-9 px-3 border border-input bg-background text-foreground rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
              >
                <option value="">Seleccionar template...</option>
                {approvedTemplates.map((t) => (
                  <option key={t.sid} value={t.sid}>
                    {t.friendlyName} ({t.category})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="productFilter">
              Filtrar por producto (opcional)
            </Label>
            <Input
              id="productFilter"
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              placeholder="ej: pañales, zaleas, elastizado..."
            />
            <p className="text-xs text-muted-foreground">
              Dejalo vacío para enviar a todos los leads. Si escribís un
              producto, solo se envía a quienes compraron ese producto.
            </p>
          </div>

          <Button
            className="bg-[#1D9E75] hover:bg-[#178963] text-white"
            onClick={() => {
              if (!selectedTemplate) {
                toast.error("Seleccioná un template.");
                return;
              }
              if (
                !confirm(
                  "¿Confirmar envío masivo? Se enviará a todos los leads que coincidan.",
                )
              )
                return;
              sendMutation.mutate();
            }}
            disabled={sendMutation.isPending || !selectedTemplate}
          >
            <Send size={16} className="mr-1" />
            {sendMutation.isPending ? "Enviando..." : "Enviar"}
          </Button>
        </div>
      </div>

      {/* Historial */}
      <h2 className="text-lg font-semibold text-foreground mb-3">
        Historial de envíos
      </h2>
      {historyLoading ? (
        <p className="text-muted-foreground">Cargando historial...</p>
      ) : !history?.broadcasts?.length ? (
        <div className="bg-card rounded-xl border p-8 text-center">
          <Megaphone size={40} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            No hay envíos masivos todavía.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.broadcasts.map((b) => {
            const status = STATUS_MAP[b.status] ?? STATUS_MAP.pending;
            const StatusIcon = status.icon;
            return (
              <div key={b.id} className="bg-card rounded-xl border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">
                      {b.templateName}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span
                        className={`flex items-center gap-1 ${status.className}`}
                      >
                        <StatusIcon
                          size={14}
                          className={
                            b.status === "sending" ? "animate-spin" : ""
                          }
                        />
                        {status.label}
                      </span>
                      {b.audienceFilter && (
                        <span>Filtro: {b.audienceFilter}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-foreground">
                      {b.sentCount}/{b.totalRecipients} enviados
                    </p>
                    {b.failedCount > 0 && (
                      <p className="text-red-500">{b.failedCount} fallidos</p>
                    )}
                    <p className="text-muted-foreground text-xs mt-1">
                      {new Date(b.createdAtUtc).toLocaleString("es-AR")}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
