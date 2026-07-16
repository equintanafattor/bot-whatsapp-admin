import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getContentTemplates,
  getBroadcasts,
  getBroadcast,
  sendBroadcast,
  getBroadcastPreview,
  getVariableFields,
  getTenant,
} from "../../api/tenants";
import type { BroadcastPreviewResponse } from "../../types";
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
  Eye,
  Users,
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
  const [variableMapping, setVariableMapping] = useState<
    Record<string, string>
  >({});
  const [preview, setPreview] = useState<BroadcastPreviewResponse | null>(null);
  const [activeBroadcastId, setActiveBroadcastId] = useState<string | null>(
    null,
  );

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

  const { data: fields } = useQuery({
    queryKey: ["variable-fields", tenantId],
    queryFn: () => getVariableFields(tenantId!),
    enabled: !!tenantId,
  });

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ["broadcasts", tenantId],
    queryFn: () => getBroadcasts(tenantId!),
    enabled: !!tenantId,
    refetchInterval: 10000,
  });

  // Polling del broadcast activo
  const { data: activeBroadcast } = useQuery({
    queryKey: ["broadcast", tenantId, activeBroadcastId],
    queryFn: () => getBroadcast(tenantId!, activeBroadcastId!),
    enabled: !!activeBroadcastId,
    refetchInterval: 2000,
  });

  useEffect(() => {
    if (
      activeBroadcast &&
      (activeBroadcast.status === "completed" ||
        activeBroadcast.status === "failed")
    ) {
      setActiveBroadcastId(null);
      queryClient.invalidateQueries({ queryKey: ["broadcasts", tenantId] });
      toast.success(
        `Envío ${activeBroadcast.status === "completed" ? "completado" : "finalizado con errores"}: ${activeBroadcast.sentCount}/${activeBroadcast.totalRecipients} enviados.`,
      );
    }
  }, [activeBroadcast, queryClient, tenantId]);

  // Detectar variables en el template seleccionado
  const selectedTpl = templates?.find((t) => t.sid === selectedTemplate);
  const templateBody = preview?.templateBody ?? "";
  const varMatches = templateBody.match(/\{\{\d+\}\}/g) ?? [];
  const varNumbers = [
    ...new Set(varMatches.map((m) => m.replace(/[{}]/g, ""))),
  ].sort();

  const previewMutation = useMutation({
    mutationFn: () =>
      getBroadcastPreview(tenantId!, {
        contentSid: selectedTemplate,
        productFilter: productFilter || undefined,
        variableMapping:
          Object.keys(variableMapping).length > 0 ? variableMapping : undefined,
      }),
    onSuccess: (data) => setPreview(data),
    onError: () => toast.error("Error al generar la vista previa."),
  });

  const sendMutation = useMutation({
    mutationFn: () =>
      sendBroadcast(tenantId!, {
        contentSid: selectedTemplate,
        templateName: selectedTpl?.friendlyName ?? selectedTemplate,
        productFilter: productFilter || undefined,
        variableMapping:
          Object.keys(variableMapping).length > 0 ? variableMapping : undefined,
      }),
    onSuccess: (data) => {
      toast.success(data.message);
      setActiveBroadcastId(data.broadcastId);
      queryClient.invalidateQueries({ queryKey: ["broadcasts", tenantId] });
    },
    onError: () => toast.error("Error al iniciar el envío masivo."),
  });

  const approvedTemplates =
    templates?.filter((t) => t.approvalStatus === "approved") ?? [];

  // Cargar preview cuando se selecciona template
  useEffect(() => {
    if (selectedTemplate) {
      setPreview(null);
      setVariableMapping({});
      previewMutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTemplate]);

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

      {/* Broadcast activo - barra de progreso */}
      {activeBroadcast && activeBroadcast.status === "sending" && (
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-blue-800 dark:text-blue-300 font-medium flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" /> Enviando:{" "}
              {activeBroadcast.templateName}
            </p>
            <span className="text-blue-700 dark:text-blue-400 text-sm">
              {activeBroadcast.sentCount + activeBroadcast.failedCount}/
              {activeBroadcast.totalRecipients}
            </span>
          </div>
          <div className="w-full bg-blue-200 dark:bg-blue-900 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{
                width: `${((activeBroadcast.sentCount + activeBroadcast.failedCount) / activeBroadcast.totalRecipients) * 100}%`,
              }}
            />
          </div>
          <div className="flex gap-4 mt-2 text-xs">
            <span className="text-green-600">
              {activeBroadcast.sentCount} enviados
            </span>
            {activeBroadcast.failedCount > 0 && (
              <span className="text-red-500">
                {activeBroadcast.failedCount} fallidos
              </span>
            )}
          </div>
        </div>
      )}

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
              Dejalo vacío para enviar a todos los leads.
            </p>
          </div>

          {/* Mapeo de variables */}
          {varNumbers.length > 0 && fields && (
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium text-foreground">
                Mapear variables del template
              </p>
              {varNumbers.map((num) => (
                <div key={num} className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-16 shrink-0">{`{{${num}}}`}</span>
                  <select
                    className="flex-1 h-9 px-3 border border-input bg-background text-foreground rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    value={variableMapping[num] ?? ""}
                    onChange={(e) => {
                      const newMapping = { ...variableMapping };
                      if (e.target.value) newMapping[num] = e.target.value;
                      else delete newMapping[num];
                      setVariableMapping(newMapping);
                    }}
                  >
                    <option value="">Sin asignar (default: nombre)</option>
                    {fields.map((f) => (
                      <option key={f.key} value={f.key}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}

          {/* Vista previa */}
          {preview && (
            <div className="p-4 bg-muted/50 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <Eye size={14} /> Vista previa
                </p>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Users size={14} /> {preview.audienceCount} destinatarios
                </span>
              </div>
              <div className="bg-[#0B141A] rounded-lg p-4">
                <div className="bg-[#1D9E75] rounded-lg p-3 max-w-[85%]">
                  <p className="text-white text-sm whitespace-pre-wrap">
                    {preview.sampleMessage}
                  </p>
                </div>
              </div>
              {preview.sampleLead && (
                <p className="text-xs text-muted-foreground">
                  Ejemplo con datos de:{" "}
                  {preview.sampleLead.customerName ??
                    preview.sampleLead.phoneNumber}
                </p>
              )}
            </div>
          )}

          <div className="flex gap-2">
            {selectedTemplate && (
              <Button
                variant="outline"
                onClick={() => previewMutation.mutate()}
                disabled={previewMutation.isPending}
              >
                <Eye size={16} className="mr-1" />
                {previewMutation.isPending
                  ? "Cargando..."
                  : "Actualizar preview"}
              </Button>
            )}
            <Button
              className="bg-[#1D9E75] hover:bg-[#178963] text-white"
              onClick={() => {
                if (!selectedTemplate) {
                  toast.error("Seleccioná un template.");
                  return;
                }
                if (!preview) {
                  toast.error("Generá la vista previa primero.");
                  return;
                }
                if (preview.audienceCount === 0) {
                  toast.error("No hay destinatarios con ese filtro.");
                  return;
                }
                if (
                  !confirm(
                    `¿Confirmar envío a ${preview.audienceCount} destinatarios?`,
                  )
                )
                  return;
                sendMutation.mutate();
              }}
              disabled={
                sendMutation.isPending ||
                !selectedTemplate ||
                !!activeBroadcastId
              }
            >
              <Send size={16} className="mr-1" />
              {sendMutation.isPending ? "Enviando..." : "Enviar"}
            </Button>
          </div>
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
            const progress =
              b.totalRecipients > 0
                ? Math.round(
                    ((b.sentCount + b.failedCount) / b.totalRecipients) * 100,
                  )
                : 0;
            return (
              <div key={b.id} className="bg-card rounded-xl border p-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
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
                    {b.status === "sending" && (
                      <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                        <div
                          className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="text-right text-sm ml-4">
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
