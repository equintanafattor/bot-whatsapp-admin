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

export default function TenantFormPage() {
  // const { tenantId } = useParams<{ tenantId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isSuperAdmin } = useAuth();

  // const isNew = tenantId === "new";

  const { tenantId } = useParams<{ tenantId: string }>();
  console.log("tenantId:", tenantId);
  const isNew = tenantId === "new";
  console.log("isNew:", isNew);

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
  });

  useEffect(() => {
    if (tenant) {
      setForm({
        tenantId: tenant.tenantId,
        businessName: tenant.businessName,
        systemPrompt: tenant.systemPrompt,
        webhookUrl: tenant.webhookUrl || "",
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      ...form,
      webhookUrl: form.webhookUrl || undefined,
    });
  };

  if (!isNew && isLoading)
    return <p className="p-8 text-gray-500">Cargando...</p>;

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
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
                <p className="text-xs text-gray-500">
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
              <Input
                id="webhookUrl"
                type="url"
                placeholder="https://..."
                value={form.webhookUrl}
                onChange={(e) =>
                  setForm({ ...form, webhookUrl: e.target.value })
                }
              />
              <p className="text-xs text-gray-500">
                URL donde se enviarán los leads generados por el bot.
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
