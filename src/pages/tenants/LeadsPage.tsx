import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getTenantLeads, getTenant } from "../../api/tenants";
import { Button } from "../../components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";

export default function LeadsPage() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data: tenant } = useQuery({
    queryKey: ["tenant", tenantId],
    queryFn: () => getTenant(tenantId!),
    enabled: !!tenantId,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["leads", tenantId, page],
    queryFn: () => getTenantLeads(tenantId!, page, pageSize),
    enabled: !!tenantId,
  });

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Leads — {tenant?.businessName ?? tenantId}
          </h1>
          <p className="text-gray-500 mt-1">
            {data ? `${data.total} leads generados en total` : ""}
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Volver
        </Button>
      </div>

      {isLoading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : !data || data.leads.length === 0 ? (
        <p className="text-gray-500">No hay leads generados aún.</p>
      ) : (
        <>
          <div className="bg-white rounded-lg border mb-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Datos extra</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-mono text-sm">
                      {lead.phoneNumber.replace("whatsapp:", "")}
                    </TableCell>
                    <TableCell>{lead.context.customerName ?? "—"}</TableCell>
                    <TableCell>{lead.context.selectedService ?? "—"}</TableCell>
                    <TableCell className="text-sm text-gray-500 max-w-xs truncate">
                      {lead.context.extra &&
                      Object.keys(lead.context.extra).length > 0
                        ? Object.entries(lead.context.extra)
                            .map(
                              ([k, v]) =>
                                `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`,
                            )
                            .join(" | ")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {new Date(lead.completedAtUtc).toLocaleString("es-AR")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Página {page} de {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page === totalPages}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
