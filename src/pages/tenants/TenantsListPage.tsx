import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getTenants, deleteTenant, createTenantUser } from '../../api/tenants';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../../components/ui/dialog';

export default function TenantsListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [userDialog, setUserDialog] = useState<{ open: boolean; tenantId: string }>({
    open: false,
    tenantId: ''
  });
  const [userForm, setUserForm] = useState({ email: '', password: '' });
  const [userError, setUserError] = useState('');

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: getTenants,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTenant,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenants'] }),
  });

  const createUserMutation = useMutation({
    mutationFn: ({ email, password, tenantId }: { email: string; password: string; tenantId: string }) =>
      createTenantUser(email, password, tenantId),
    onSuccess: () => {
      setUserDialog({ open: false, tenantId: '' });
      setUserForm({ email: '', password: '' });
      setUserError('');
    },
    onError: () => {
      setUserError('Error al crear el usuario. Verificá que el email no esté en uso.');
    }
  });

  const handleDelete = (tenantId: string) => {
    if (confirm(`¿Eliminar el tenant "${tenantId}"? Esta acción no se puede deshacer.`)) {
      deleteMutation.mutate(tenantId);
    }
  };

  const handleOpenUserDialog = (tenantId: string) => {
    setUserForm({ email: '', password: '' });
    setUserError('');
    setUserDialog({ open: true, tenantId });
  };

  const handleCreateUser = () => {
    if (!userForm.email || !userForm.password) {
      setUserError('Email y contraseña son obligatorios.');
      return;
    }
    createUserMutation.mutate({
      email: userForm.email,
      password: userForm.password,
      tenantId: userDialog.tenantId
    });
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tenants</h1>
          <p className="text-gray-500 mt-1">Todos los negocios registrados</p>
        </div>
        <Button onClick={() => navigate('/tenants/new')}>
          + Nuevo tenant
        </Button>
      </div>

      {isLoading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : tenants.length === 0 ? (
        <p className="text-gray-500">No hay tenants registrados aún.</p>
      ) : (
        <div className="bg-white rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Negocio</TableHead>
                <TableHead>Webhook</TableHead>
                <TableHead>Creado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((tenant) => (
                <TableRow key={tenant.tenantId}>
                  <TableCell className="font-mono text-sm">{tenant.tenantId}</TableCell>
                  <TableCell className="font-medium">{tenant.businessName}</TableCell>
                  <TableCell>
                    {tenant.webhookUrl ? (
                      <Badge variant="secondary">Configurado</Badge>
                    ) : (
                      <Badge variant="outline">Sin webhook</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-gray-500 text-sm">
                    {new Date(tenant.createdAtUtc).toLocaleDateString('es-AR')}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/tenants/${tenant.tenantId}/conversations`)}
                    >
                      Conversaciones
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/tenants/${tenant.tenantId}/stats`)}
                    >
                      Métricas
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/tenants/${tenant.tenantId}`)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenUserDialog(tenant.tenantId)}
                    >
                      + Usuario
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(tenant.tenantId)}
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

      {/* Dialog para crear usuario tenant */}
      <Dialog open={userDialog.open} onOpenChange={(open) => setUserDialog({ ...userDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear usuario para {userDialog.tenantId}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="user-email">Email</Label>
              <Input
                id="user-email"
                type="email"
                placeholder="cliente@negocio.com"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-password">Contraseña</Label>
              <Input
                id="user-password"
                type="password"
                placeholder="••••••••"
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
              />
            </div>
            {userError && <p className="text-sm text-red-500">{userError}</p>}
          </div>
          <DialogFooter>
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
              {createUserMutation.isPending ? 'Creando...' : 'Crear usuario'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}