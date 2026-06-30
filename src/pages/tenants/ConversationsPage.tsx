import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getTenantConversations, getTenant } from "../../api/tenants";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { MessageSquare } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

const STATE_LABELS: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  active: { label: "Activa", variant: "default" },
  completed: { label: "Completada", variant: "secondary" },
  handed_to_human: { label: "Derivada a humano", variant: "destructive" },
  bot_paused: { label: "Bot pausado", variant: "outline" },
};

export default function ConversationsPage() {
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
    queryKey: ["conversations", tenantId, page],
    queryFn: () => getTenantConversations(tenantId!, page, pageSize),
    enabled: !!tenantId,
  });

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Conversaciones — {tenant?.businessName ?? tenantId}
          </h1>
          <p className="text-muted-foreground mt-1">
            {data ? `${data.total} conversaciones en total` : ""}
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Volver
        </Button>
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} columns={5} />
      ) : !data || data.conversations.length === 0 ? (
        <EmptyState
          icon={<MessageSquare size={24} />}
          title="No hay conversaciones aún."
        />
      ) : (
        <>
          <div className="bg-card rounded-lg border mb-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Último mensaje</TableHead>
                  <TableHead>Última actividad</TableHead>
                  <TableHead>Creada</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.conversations.map((conv) => {
                  const stateInfo = STATE_LABELS[conv.state] ?? {
                    label: conv.state,
                    variant: "outline" as const,
                  };
                  return (
                    <TableRow
                      key={conv.id}
                      className="cursor-pointer hover:bg-muted"
                      onClick={() =>
                        navigate(
                          `/tenants/${tenantId}/conversations/${conv.id}`,
                        )
                      }
                    >
                      <TableCell className="font-mono text-sm">
                        {conv.phoneNumber.replace("whatsapp:", "")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={stateInfo.variant}>
                          {stateInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                        {conv.lastMessage ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(conv.updatedAtUtc).toLocaleString("es-AR")}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(conv.createdAtUtc).toLocaleDateString(
                          "es-AR",
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
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
