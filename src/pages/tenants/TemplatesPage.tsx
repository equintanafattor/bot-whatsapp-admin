import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getContentTemplates,
  createContentTemplate,
  deleteContentTemplate,
  getTenant,
} from "../../api/tenants";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { toast } from "sonner";
import {
  Trash2,
  Plus,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

const STATUS_MAP: Record<
  string,
  { label: string; icon: typeof Clock; className: string }
> = {
  approved: {
    label: "Aprobado",
    icon: CheckCircle,
    className: "text-green-600",
  },
  rejected: { label: "Rechazado", icon: XCircle, className: "text-red-600" },
  pending: { label: "Pendiente", icon: Clock, className: "text-yellow-600" },
  paused: { label: "Pausado", icon: AlertCircle, className: "text-gray-500" },
};

export default function TemplatesPage() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [friendlyName, setFriendlyName] = useState("");
  const [language, setLanguage] = useState("es");
  const [category, setCategory] = useState("utility");
  const [bodyText, setBodyText] = useState("");

  const { data: tenant } = useQuery({
    queryKey: ["tenant", tenantId],
    queryFn: () => getTenant(tenantId!),
    enabled: !!tenantId,
  });

  const { data: templates, isLoading } = useQuery({
    queryKey: ["templates", tenantId],
    queryFn: () => getContentTemplates(tenantId!),
    enabled: !!tenantId && tenant?.messagingProvider !== 1,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createContentTemplate(tenantId!, {
        friendlyName,
        language,
        category,
        body: { text: bodyText },
      }),
    onSuccess: () => {
      toast.success("Template creado y enviado a aprobación de Meta.");
      queryClient.invalidateQueries({ queryKey: ["templates", tenantId] });
      setShowForm(false);
      setFriendlyName("");
      setBodyText("");
    },
    onError: () => toast.error("Error al crear el template."),
  });

  const deleteMutation = useMutation({
    mutationFn: (sid: string) => deleteContentTemplate(tenantId!, sid),
    onSuccess: () => {
      toast.success("Template eliminado.");
      queryClient.invalidateQueries({ queryKey: ["templates", tenantId] });
    },
    onError: () => toast.error("Error al eliminar el template."),
  });

  if (tenant && tenant.messagingProvider === 1) {
    return (
      <div className="p-8 max-w-2xl">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Templates de WhatsApp
        </h1>
        <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900/50 rounded-lg p-6 mt-4">
          <p className="text-yellow-800 dark:text-yellow-300 font-medium mb-1">
            No disponible
          </p>
          <p className="text-yellow-700 dark:text-yellow-400 text-sm">
            Los templates de Meta solo están disponibles para tenants que usan
            Twilio como proveedor de mensajería.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Templates de WhatsApp
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Gestioná los templates aprobados por Meta para mensajes masivos
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Volver
          </Button>
          <Button
            className="bg-[#1D9E75] hover:bg-[#178963] text-white"
            onClick={() => setShowForm(!showForm)}
          >
            <Plus size={16} className="mr-1" /> Nuevo template
          </Button>
        </div>
      </div>

      {showForm && (
        <div className="bg-card rounded-xl border p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Crear template
          </h2>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="friendlyName">Nombre</Label>
              <Input
                id="friendlyName"
                value={friendlyName}
                onChange={(e) => setFriendlyName(e.target.value)}
                placeholder="ej: recordatorio_recompra_pañales"
              />
              <p className="text-xs text-muted-foreground">
                Solo letras minúsculas, números y guiones bajos.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="language">Idioma</Label>
                <select
                  id="language"
                  className="w-full h-9 px-3 border border-input bg-background text-foreground rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <option value="es">Español</option>
                  <option value="es_AR">Español (Argentina)</option>
                  <option value="en">English</option>
                  <option value="pt_BR">Português (Brasil)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="category">Categoría</Label>
                <select
                  id="category"
                  className="w-full h-9 px-3 border border-input bg-background text-foreground rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="utility">
                    Utility (confirmaciones, recordatorios)
                  </option>
                  <option value="marketing">Marketing (promos, ofertas)</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bodyText">Texto del mensaje</Label>
              <textarea
                id="bodyText"
                className="w-full min-h-[100px] px-3 py-2 border border-input bg-background text-foreground rounded-md text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                placeholder={
                  "Hola {{1}}, te recordamos que tu pedido de {{2}} puede necesitar reposición. ¿Querés hacer un nuevo pedido?"
                }
              />
              <p className="text-xs text-muted-foreground">
                Usá {"{{1}}"}, {"{{2}}"}, etc. para variables dinámicas (nombre,
                producto, etc.)
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button
                className="bg-[#1D9E75] hover:bg-[#178963] text-white"
                onClick={() => createMutation.mutate()}
                disabled={
                  createMutation.isPending || !friendlyName || !bodyText
                }
              >
                {createMutation.isPending
                  ? "Creando..."
                  : "Crear y enviar a aprobación"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-muted-foreground">Cargando templates...</p>
      ) : !templates?.length ? (
        <div className="bg-card rounded-xl border p-8 text-center">
          <FileText size={40} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            No hay templates creados todavía.
          </p>
          <p className="text-muted-foreground text-sm mt-1">
            Creá uno para poder enviar mensajes masivos.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((t) => {
            const status =
              STATUS_MAP[t.approvalStatus ?? "pending"] ?? STATUS_MAP.pending;
            const StatusIcon = status.icon;
            return (
              <div
                key={t.sid}
                className="bg-card rounded-xl border p-4 flex items-center justify-between"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground truncate">
                    {t.friendlyName}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                    <span
                      className={`flex items-center gap-1 ${status.className}`}
                    >
                      <StatusIcon size={14} /> {status.label}
                    </span>
                    <span>{t.language}</span>
                    <span>{t.category}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (confirm(`¿Eliminar template "${t.friendlyName}"?`))
                      deleteMutation.mutate(t.sid);
                  }}
                >
                  <Trash2 size={16} className="text-red-500" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
