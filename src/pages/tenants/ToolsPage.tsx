import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTenantTools,
  createTenantTool,
  deleteTenantTool,
  getTenant,
} from "../../api/tenants";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent } from "../../components/ui/card";
import { Dialog } from "../../components/ui/dialog";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "../../components/ui/sheet";

const DEFAULT_SCHEMA = JSON.stringify(
  {
    type: "object",
    properties: {
      parametro: {
        type: "string",
        description: "Descripción del parámetro",
      },
    },
    required: ["parametro"],
  },
  null,
  2,
);

export default function ToolsPage() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    inputSchema: DEFAULT_SCHEMA,
    webhookUrl: "",
  });

  const { data: tenant } = useQuery({
    queryKey: ["tenant", tenantId],
    queryFn: () => getTenant(tenantId!),
    enabled: !!tenantId,
  });

  const { data: tools = [], isLoading } = useQuery({
    queryKey: ["tools", tenantId],
    queryFn: () => getTenantTools(tenantId!),
    enabled: !!tenantId,
  });

  const createMutation = useMutation({
    mutationFn: () => createTenantTool(tenantId!, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tools", tenantId] });
      setShowForm(false);
      setForm({
        name: "",
        description: "",
        inputSchema: DEFAULT_SCHEMA,
        webhookUrl: "",
      });
      toast.success("Herramienta creada correctamente.");
    },
    onError: () => toast.error("Error al crear la herramienta."),
  });

  const deleteMutation = useMutation({
    mutationFn: (toolId: string) => deleteTenantTool(tenantId!, toolId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tools", tenantId] });
      toast.success("Herramienta eliminada.");
    },
    onError: () => toast.error("Error al eliminar la herramienta."),
  });

  const handleCreate = () => {
    if (!form.name || !form.description || !form.webhookUrl) {
      toast.error("Nombre, descripción y webhook URL son obligatorios.");
      return;
    }
    try {
      JSON.parse(form.inputSchema);
    } catch {
      toast.error("El Input Schema no es un JSON válido.");
      return;
    }
    createMutation.mutate();
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Herramientas — {tenant?.businessName ?? tenantId}
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Herramientas que el bot puede invocar para consultar datos externos
            en tiempo real
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowForm(true)}>+ Nueva herramienta</Button>
          <Button variant="outline" onClick={() => navigate(-1)}>
            Volver
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : tools.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg mb-2">No hay herramientas configuradas</p>
          <p className="text-sm">
            Las herramientas permiten al bot consultar datos externos como
            turnos disponibles, stock, precios, etc.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tools.map((tool) => (
            <Card key={tool.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-sm font-mono bg-gray-100 px-2 py-0.5 rounded">
                        {tool.name}
                      </code>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {tool.description}
                    </p>
                    <p className="text-xs text-gray-400 truncate max-w-md">
                      {tool.webhookUrl}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (confirm(`¿Eliminar la herramienta "${tool.name}"?`)) {
                        deleteMutation.mutate(tool.id);
                      }
                    }}
                  >
                    Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog para crear herramienta */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <Sheet open={showForm} onOpenChange={setShowForm}>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto flex flex-col p-0">
            <SheetHeader className="px-6 pt-6 pb-4 border-b">
              <SheetTitle>Nueva herramienta</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 px-6 py-4 flex-1 overflow-y-auto">
              <div className="space-y-2">
                <Label htmlFor="tool-name">Nombre (snake_case)</Label>
                <Input
                  id="tool-name"
                  placeholder="consultar_turnos_disponibles"
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value.toLowerCase().replace(/\s/g, "_"),
                    })
                  }
                />
                <p className="text-xs text-gray-500">
                  Solo letras minúsculas, números y guiones bajos.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tool-desc">Descripción</Label>
                <Input
                  id="tool-desc"
                  placeholder="Consulta los turnos disponibles para una fecha dada"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
                <p className="text-xs text-gray-500">
                  Claude usa esta descripción para decidir cuándo invocar la
                  herramienta.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tool-schema">Input Schema (JSON)</Label>
                <textarea
                  id="tool-schema"
                  className="w-full h-36 px-3 py-2 border rounded-md text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                  value={form.inputSchema}
                  onChange={(e) =>
                    setForm({ ...form, inputSchema: e.target.value })
                  }
                />
                <p className="text-xs text-gray-500">
                  JSON Schema de los parámetros que acepta la herramienta.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tool-webhook">Webhook URL</Label>
                <Input
                  id="tool-webhook"
                  type="url"
                  placeholder="https://n8n.tudominio.com/webhook/consultar-turnos"
                  value={form.webhookUrl}
                  onChange={(e) =>
                    setForm({ ...form, webhookUrl: e.target.value })
                  }
                />
                <p className="text-xs text-gray-500">
                  URL que recibe los parámetros y devuelve el resultado.
                </p>
              </div>
            </div>
            <SheetFooter className="px-6 py-4 border-t">
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleCreate}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Creando..." : "Crear herramienta"}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </Dialog>
    </div>
  );
}
