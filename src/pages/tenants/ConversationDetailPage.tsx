import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getConversationDetail,
  replyToConversation,
  pauseConversation,
  resumeConversation,
} from "../../api/tenants";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { toast } from "sonner";

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

export default function ConversationDetailPage() {
  const { tenantId, conversationId } = useParams<{
    tenantId: string;
    conversationId: string;
  }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [replyText, setReplyText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const { data: conversation, isLoading } = useQuery({
    queryKey: ["conversation", tenantId, conversationId],
    queryFn: () => getConversationDetail(tenantId!, conversationId!),
    enabled: !!tenantId && !!conversationId,
    // Polling cada 5 segundos si la conversación está derivada a humano
    refetchInterval: (query) =>
      query.state.data?.state === "handed_to_human" ||
      query.state.data?.state === "bot_paused"
        ? 5000
        : false,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages]);

  const replyMutation = useMutation({
    mutationFn: (message: string) =>
      replyToConversation(tenantId!, conversationId!, message),
    onSuccess: () => {
      setReplyText("");
      queryClient.invalidateQueries({
        queryKey: ["conversation", tenantId, conversationId],
      });
      toast.success("Mensaje enviado.");
    },
    onError: () => toast.error("Error al enviar el mensaje."),
  });

  const pauseMutation = useMutation({
    mutationFn: () => pauseConversation(tenantId!, conversationId!),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["conversation", tenantId, conversationId],
      });
      toast.success("Bot pausado. Atendés vos esta conversación.");
    },
    onError: () => toast.error("Error al pausar el bot."),
  });

  const resumeMutation = useMutation({
    mutationFn: () => resumeConversation(tenantId!, conversationId!),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["conversation", tenantId, conversationId],
      });
      toast.success("Bot reactivado en esta conversación.");
    },
    onError: () => toast.error("Error al reactivar el bot."),
  });

  const handleSend = () => {
    if (!replyText.trim() || replyMutation.isPending) return;
    replyMutation.mutate(replyText.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const stateInfo = conversation
    ? (STATE_LABELS[conversation.state] ?? {
        label: conversation.state,
        variant: "outline" as const,
      })
    : null;

  const isHandedToHuman = conversation?.state === "handed_to_human";
  const isPaused = conversation?.state === "bot_paused";
  const isCompleted = conversation?.state === "completed";
  // El humano puede escribir cuando el bot no está respondiendo (handoff o pausa)
  const canReply = isHandedToHuman || isPaused;

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Conversación</h1>
          <p className="text-muted-foreground mt-1 font-mono text-sm">
            {conversation?.phoneNumber.replace("whatsapp:", "")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {stateInfo && (
            <Badge variant={stateInfo.variant}>{stateInfo.label}</Badge>
          )}
          {conversation &&
            !isCompleted &&
            (isPaused || isHandedToHuman ? (
              <Button
                variant="outline"
                onClick={() => resumeMutation.mutate()}
                disabled={resumeMutation.isPending}
              >
                {resumeMutation.isPending ? "Reactivando..." : "Reactivar bot"}
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => pauseMutation.mutate()}
                disabled={pauseMutation.isPending}
              >
                {pauseMutation.isPending ? "Pausando..." : "Pausar bot"}
              </Button>
            ))}
          <Button variant="outline" onClick={() => navigate(-1)}>
            Volver
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Cargando...</p>
      ) : !conversation || conversation.messages.length === 0 ? (
        <p className="text-muted-foreground">
          No hay mensajes en esta conversación.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {/* Mensajes */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
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
                        ? "bg-card border text-foreground rounded-tl-none"
                        : "bg-gray-900 text-white rounded-tr-none"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    <p className="text-xs mt-1 opacity-60">
                      {new Date(msg.createdAtUtc).toLocaleTimeString("es-AR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input de respuesta — solo si está derivada a humano */}
          {canReply && (
            <div className="border-t pt-4">
              <p className="text-xs text-muted-foreground mb-2">
                📱 Respondé como si fueras el negocio — el mensaje le llegará
                por WhatsApp
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="Escribí tu respuesta..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={replyMutation.isPending}
                />
                <Button
                  onClick={handleSend}
                  disabled={!replyText.trim() || replyMutation.isPending}
                >
                  {replyMutation.isPending ? "Enviando..." : "Enviar"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {conversation && (
        <p className="text-xs text-muted-foreground mt-6 text-center">
          Iniciada el{" "}
          {new Date(conversation.createdAtUtc).toLocaleString("es-AR")}
        </p>
      )}
    </div>
  );
}
