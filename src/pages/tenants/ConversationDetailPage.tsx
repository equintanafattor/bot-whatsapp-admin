import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getConversationDetail, getTenant } from "../../api/tenants";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";

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
};

export default function ConversationDetailPage() {
  const { tenantId, conversationId } = useParams<{
    tenantId: string;
    conversationId: string;
  }>();
  const navigate = useNavigate();

  const { data: tenant } = useQuery({
    queryKey: ["tenant", tenantId],
    queryFn: () => getTenant(tenantId!),
    enabled: !!tenantId,
  });

  const { data: conversation, isLoading } = useQuery({
    queryKey: ["conversation", tenantId, conversationId],
    queryFn: () => getConversationDetail(tenantId!, conversationId!),
    enabled: !!tenantId && !!conversationId,
  });

  const stateInfo = conversation
    ? (STATE_LABELS[conversation.state] ?? {
        label: conversation.state,
        variant: "outline" as const,
      })
    : null;

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Conversación</h1>
          <p className="text-gray-500 mt-1 font-mono text-sm">
            {conversation?.phoneNumber.replace("whatsapp:", "")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {stateInfo && (
            <Badge variant={stateInfo.variant}>{stateInfo.label}</Badge>
          )}
          <Button variant="outline" onClick={() => navigate(-1)}>
            Volver
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : !conversation || conversation.messages.length === 0 ? (
        <p className="text-gray-500">No hay mensajes en esta conversación.</p>
      ) : (
        <div className="space-y-3">
          {conversation.messages.map((msg) => {
            const isInbound = msg.direction === "inbound";
            return (
              <div
                key={msg.id}
                className={`flex ${isInbound ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl text-sm ${
                    isInbound
                      ? "bg-white border text-gray-900 rounded-tl-none"
                      : "bg-gray-900 text-white rounded-tr-none"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <p
                    className={`text-xs mt-1 ${isInbound ? "text-gray-400" : "text-gray-400"}`}
                  >
                    {new Date(msg.createdAtUtc).toLocaleTimeString("es-AR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {conversation && (
        <p className="text-xs text-gray-400 mt-6 text-center">
          Iniciada el{" "}
          {new Date(conversation.createdAtUtc).toLocaleString("es-AR")}
        </p>
      )}
    </div>
  );
}
