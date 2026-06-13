import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUsers, deleteUser, resetUserPassword } from "../../api/tenants";
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
} from '../../components/ui/sheet';
import { toast } from "sonner";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { Users } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export default function UsersPage() {
  const queryClient = useQueryClient();

  const [resetDialog, setResetDialog] = useState<{
    open: boolean;
    email: string;
  }>({
    open: false,
    email: "",
  });
  const [newPassword, setNewPassword] = useState("");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Usuario eliminado correctamente.");
    },
    onError: () => toast.error("Error al eliminar el usuario."),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      resetUserPassword(email, password),
    onSuccess: () => {
      setResetDialog({ open: false, email: "" });
      setNewPassword("");
      toast.success("Contraseña reseteada correctamente.");
    },
    onError: () => toast.error("Error al resetear la contraseña."),
  });

  const handleDelete = (email: string) => {
    if (
      confirm(
        `¿Eliminar el usuario "${email}"? Esta acción no se puede deshacer.`,
      )
    ) {
      deleteMutation.mutate(email);
    }
  };

  const handleResetPassword = () => {
    if (newPassword.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    resetPasswordMutation.mutate({
      email: resetDialog.email,
      password: newPassword,
    });
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
        <p className="text-gray-500 mt-1">
          Todos los usuarios registrados en el sistema
        </p>
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} columns={5} />
      ) : users.length === 0 ? (
        <EmptyState
          icon={<Users size={24} />}
          title="No hay usuarios registrados"
        />
      ) : (
        <div className="bg-white rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Creado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        user.role === "superadmin" ? "default" : "secondary"
                      }
                    >
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm text-gray-500">
                    {user.tenantId ?? "—"}
                  </TableCell>
                  <TableCell className="text-gray-500 text-sm">
                    {new Date(user.createdAtUtc).toLocaleDateString("es-AR")}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setNewPassword("");
                        setResetDialog({ open: true, email: user.email });
                      }}
                    >
                      Resetear contraseña
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(user.email)}
                      disabled={user.role === "superadmin"}
                    >
                      Eliminar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Sheet open={resetDialog.open} onOpenChange={(open) => setResetDialog({ ...resetDialog, open })}>
        <SheetContent className="w-full sm:max-w-lg flex flex-col p-0">
          <SheetHeader className="px-6 pt-6 pb-4 border-b">
            <SheetTitle>Resetear contraseña de {resetDialog.email}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 px-6 py-4 flex-1 overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nueva contraseña</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
          </div>
          <SheetFooter className="px-6 py-4 border-t">
            <Button variant="outline" onClick={() => setResetDialog({ ...resetDialog, open: false })}>
              Cancelar
            </Button>
            <Button onClick={handleResetPassword} disabled={resetPasswordMutation.isPending}>
              {resetPasswordMutation.isPending ? 'Reseteando...' : 'Resetear'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
