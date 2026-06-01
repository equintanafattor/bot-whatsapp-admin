import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getTenants, deleteTenant } from '../../api/tenants';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../components/ui/table';

export default function TenantsListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: getTenants,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTenant,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenants'] }),
  });

  const handleDelete = (tenantId: string) => {
    if (confirm(`¿Eliminar el tenant "${tenantId}"? Esta acción no se puede deshacer.`)) {
      deleteMutation.mutate(tenantId);
    }
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
    </div>
  );
}