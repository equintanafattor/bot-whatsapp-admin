import { useState } from "react";
import { TableSkeleton } from "../../components/ui/table-skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getTenants, deleteTenant, createTenantUser } from "../../api/tenants";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "../../components/ui/sheet";
import { toast } from "sonner";
import { EmptyState } from "../../components/ui/empty-state";
import { Building2 } from "lucide-react";
import { getTenantHealth } from "../../api/tenants";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../../components/ui/tooltip";
import {
  MessageSquare,
  BarChart2,
  Trophy,
  Activity,
  Wrench,
  Bot,
  Pencil,
  UserPlus,
  Trash2,
} from "lucide-react";

function HealthIndicator({ tenantId }: { tenantId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["health", tenantId],
    queryFn: () => getTenantHealth(tenantId),
    refetchInterval: 60_000, // refresca cada minuto
  });

  if (isLoading) return <span className="text-gray-400 text-xs">...</span>;

  return (
    <div className="flex items-center gap-1">
      <div
        className={`w-2 h-2 rounded-full ${data?.status === "healthy" ? "bg-green-500" : "bg-red-500"}`}
      />
      <span className="text-xs text-gray-500">
        {data?.status === "healthy" ? "OK" : `${data?.errorsLast24h} errores`}
      </span>
    </div>
  );
}

export default function TenantsListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [userDialog, setUserDialog] = useState<{
    open: boolean;
    tenantId: string;
  }>({
    open: false,
    tenantId: "",
  });
  const [userForm, setUserForm] = useState({ email: "", password: "" });
  const [userError, setUserError] = useState("");

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ["tenants"],
    queryFn: getTenants,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTenant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      toast.success("Tenant eliminado correctamente.");
    },
    onError: () => {
      toast.error("Error al eliminar el tenant.");
    },
  });

  const createUserMutation = useMutation({
    mutationFn: ({
      email,
      password,
      tenantId,
    }: {
      email: string;
      password: string;
      tenantId: string;
    }) => createTenantUser(email, password, tenantId),
    onSuccess: () => {
      setUserDialog({ open: false, tenantId: "" });
      setUserForm({ email: "", password: "" });
      setUserError("");
      toast.success("Usuario creado correctamente.");
    },
    onError: () => {
      setUserError(
        "Error al crear el usuario. Verificá que el email no esté en uso.",
      );
    },
  });

  const handleDelete = (tenantId: string) => {
    if (
      confirm(
        `¿Eliminar el tenant "${tenantId}"? Esta acción no se puede deshacer.`,
      )
    ) {
      deleteMutation.mutate(tenantId);
    }
  };

  const handleOpenUserDialog = (tenantId: string) => {
    setUserForm({ email: "", password: "" });
    setUserError("");
    setUserDialog({ open: true, tenantId });
  };

  const handleCreateUser = () => {
    if (!userForm.email || !userForm.password) {
      setUserError("Email y contraseña son obligatorios.");
      return;
    }
    createUserMutation.mutate({
      email: userForm.email,
      password: userForm.password,
      tenantId: userDialog.tenantId,
    });
  };

  const iconButton = (
    icon: React.ReactNode,
    label: string,
    onClick: () => void,
    variant: "outline" | "destructive" = "outline",
  ) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant={variant} size="icon-sm" onClick={onClick}>
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tenants</h1>
          <p className="text-gray-500 mt-1">Todos los negocios registrados</p>
        </div>
        <Button onClick={() => navigate("/tenants/new")}>+ Nuevo tenant</Button>
      </div>
      {isLoading ? (
        <TableSkeleton rows={5} columns={5} />
      ) : tenants.length === 0 ? (
        <EmptyState
          icon={<Building2 size={24} />}
          title="No hay tenants registrados"
          description="Creá tu primer negocio para empezar a usar el bot."
        />
      ) : (
        <div className="bg-white rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Negocio</TableHead>
                <TableHead>Webhook</TableHead>
                <TableHead>Creado</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((tenant) => (
                <TableRow key={tenant.tenantId}>
                  <TableCell className="font-mono text-sm">
                    {tenant.tenantId}
                  </TableCell>
                  <TableCell className="font-medium">
                    {tenant.businessName}
                  </TableCell>
                  <TableCell>
                    {tenant.webhookUrl ? (
                      <Badge variant="secondary">Configurado</Badge>
                    ) : (
                      <Badge variant="outline">Sin webhook</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-gray-500 text-sm">
                    {new Date(tenant.createdAtUtc).toLocaleDateString("es-AR")}
                  </TableCell>
                  <TableCell>
                    <HealthIndicator tenantId={tenant.tenantId} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {iconButton(
                        <MessageSquare size={15} />,
                        "Conversaciones",
                        () =>
                          navigate(`/tenants/${tenant.tenantId}/conversations`),
                      )}
                      {iconButton(<Trophy size={15} />, "Leads", () =>
                        navigate(`/tenants/${tenant.tenantId}/leads`),
                      )}
                      {iconButton(<Activity size={15} />, "Actividad", () =>
                        navigate(`/tenants/${tenant.tenantId}/activity`),
                      )}
                      {iconButton(<Wrench size={15} />, "Herramientas", () =>
                        navigate(`/tenants/${tenant.tenantId}/tools`),
                      )}
                      {iconButton(<Bot size={15} />, "Preview", () =>
                        navigate(`/tenants/${tenant.tenantId}/preview`),
                      )}
                      {iconButton(<BarChart2 size={15} />, "Métricas", () =>
                        navigate(`/tenants/${tenant.tenantId}/stats`),
                      )}
                      {iconButton(<Pencil size={15} />, "Editar", () =>
                        navigate(`/tenants/${tenant.tenantId}`),
                      )}
                      {iconButton(<UserPlus size={15} />, "Crear usuario", () =>
                        handleOpenUserDialog(tenant.tenantId),
                      )}
                      {iconButton(
                        <Trash2 size={15} />,
                        "Eliminar",
                        () => handleDelete(tenant.tenantId),
                        "destructive",
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Dialog para crear usuario tenant */}
      <Sheet
        open={userDialog.open}
        onOpenChange={(open) => setUserDialog({ ...userDialog, open })}
      >
        <SheetContent className="w-full sm:max-w-lg flex flex-col p-0">
          <SheetHeader className="px-6 pt-6 pb-4 border-b">
            <SheetTitle>Crear usuario para {userDialog.tenantId}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 px-6 py-4 flex-1 overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="user-email">Email</Label>
              <Input
                id="user-email"
                type="email"
                placeholder="cliente@negocio.com"
                value={userForm.email}
                onChange={(e) =>
                  setUserForm({ ...userForm, email: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-password">Contraseña</Label>
              <Input
                id="user-password"
                type="password"
                placeholder="••••••••"
                value={userForm.password}
                onChange={(e) =>
                  setUserForm({ ...userForm, password: e.target.value })
                }
              />
            </div>
            {userError && <p className="text-sm text-red-500">{userError}</p>}
          </div>
          <SheetFooter className="px-6 py-4 border-t">
            <Button
              variant="outline"
              onClick={() => setUserDialog({ ...userDialog, open: false })}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateUser}
              disabled={createUserMutation.isPending}
            >
              {createUserMutation.isPending ? "Creando..." : "Crear usuario"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
