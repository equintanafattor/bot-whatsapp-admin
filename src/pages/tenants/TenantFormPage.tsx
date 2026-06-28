import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTenant, upsertTenant } from "../../api/tenants";
import { useAuth } from "../../lib/auth-context";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { toast } from "sonner";
import { testWebhook } from "../../api/tenants";

export default function TenantFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isSuperAdmin } = useAuth();
  const { tenantId } = useParams<{ tenantId: string }>();
  const isNew = !tenantId || tenantId === "new";

  const { data: tenant, isLoading } = useQuery({
    queryKey: ["tenant", tenantId],
    queryFn: () => getTenant(tenantId!),
    enabled: !isNew && !!tenantId,
  });
  const [form, setForm] = useState({
    tenantId: "",
    businessName: "",
    systemPrompt: "",
    webhookUrl: "",
    monthlyMessageLimit: "",
    whatsAppSenderSid: "",
  });

  useEffect(() => {
    if (tenant) {
      setForm({
        tenantId: tenant.tenantId,
        businessName: tenant.businessName,
        systemPrompt: tenant.systemPrompt,
        webhookUrl: tenant.webhookUrl || "",
        monthlyMessageLimit: tenant.monthlyMessageLimit?.toString() ?? "",
        whatsAppSenderSid: tenant.whatsAppSenderSid || "",
      });
    }
  }, [tenant]);

  const mutation = useMutation({
    mutationFn: upsertTenant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      toast.success("Tenant guardado correctamente.");
      navigate("/");
    },
    onError: () => {
      toast.error("Error al guardar. Verificá los datos e intentá de nuevo.");
    },
  });

  const testWebhookMutation = useMutation({
    mutationFn: () => testWebhook(form.webhookUrl),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(`Webhook respondió correctamente (${data.status})`);
      } else {
        toast.error(`Webhook falló con status ${data.status}`);
      }
    },
    onError: () => toast.error("No se pudo conectar al webhook."),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      ...form,
      webhookUrl: form.webhookUrl || undefined,
      whatsAppSenderSid: form.whatsAppSenderSid || undefined,
      monthlyMessageLimit: form.monthlyMessageLimit
        ? parseInt(form.monthlyMessageLimit)
        : undefined,
    });
  };

  if (!isNew && isLoading)
    return <p className="p-8 text-muted-foreground">Cargando...</p>;

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          {isNew ? "Nuevo tenant" : `Editar: ${tenant?.businessName}`}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuración del negocio</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSuperAdmin && (
              <div className="space-y-2">
                <Label htmlFor="tenantId">ID del tenant</Label>
                <Input
                  id="tenantId"
                  placeholder="peluqueria-valentina"
                  value={form.tenantId}
                  onChange={(e) =>
                    setForm({ ...form, tenantId: e.target.value })
                  }
                  disabled={!isNew}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Solo letras minúsculas, números y guiones. No se puede cambiar
                  después.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="businessName">Nombre del negocio</Label>
              <Input
                id="businessName"
                placeholder="Peluquería Valentina"
                value={form.businessName}
                onChange={(e) =>
                  setForm({ ...form, businessName: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="systemPrompt">System prompt</Label>
              <textarea
                id="systemPrompt"
                className="w-full min-h-48 px-3 py-2 border rounded-md text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Describí cómo debe comportarse el bot para este negocio..."
                value={form.systemPrompt}
                onChange={(e) =>
                  setForm({ ...form, systemPrompt: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="webhookUrl">Webhook URL (opcional)</Label>
              <div className="flex gap-2">
                <Input
                  id="webhookUrl"
                  type="url"
                  placeholder="https://..."
                  value={form.webhookUrl}
                  onChange={(e) =>
                    setForm({ ...form, webhookUrl: e.target.value })
                  }
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={!form.webhookUrl || testWebhookMutation.isPending}
                  onClick={() => testWebhookMutation.mutate()}
                >
                  {testWebhookMutation.isPending ? "Probando..." : "Probar"}
                </Button>
              </div>

              {isSuperAdmin && (
                <div className="space-y-2">
                  <Label htmlFor="whatsAppSenderSid">
                    WhatsApp Sender SID (opcional)
                  </Label>
                  <Input
                    id="whatsAppSenderSid"
                    placeholder="XE..."
                    value={form.whatsAppSenderSid}
                    onChange={(e) =>
                      setForm({ ...form, whatsAppSenderSid: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    SID del WhatsApp Sender en Twilio (empieza con XE).
                    Necesario para editar el perfil de WhatsApp.
                  </p>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                URL donde se enviarán los leads generados por el bot.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthlyMessageLimit">
                Límite mensual de mensajes (opcional)
              </Label>
              <Input
                id="monthlyMessageLimit"
                type="number"
                placeholder="Sin límite"
                value={form.monthlyMessageLimit}
                onChange={(e) =>
                  setForm({ ...form, monthlyMessageLimit: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                Si se supera este límite el bot deja de responder hasta el
                próximo mes.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Guardando..." : "Guardar"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
