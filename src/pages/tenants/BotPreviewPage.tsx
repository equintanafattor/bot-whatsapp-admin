import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getTenant, previewBot } from "../../api/tenants";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";

interface ChatMessage {
  role: "user" | "bot";
  text: string;
}

const SESSION_ID = `preview-${Math.random().toString(36).slice(2)}`;

export default function BotPreviewPage() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState(SESSION_ID);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: tenant } = useQuery({
    queryKey: ["tenant", tenantId],
    queryFn: () => getTenant(tenantId!),
    enabled: !!tenantId,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const mutation = useMutation({
    mutationFn: ({ message, sid }: { message: string; sid: string }) =>
      previewBot(tenantId!, message, sid),
    onSuccess: (data) => {
      setMessages((prev) => [...prev, { role: "bot", text: data.reply }]);
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: "❌ Error al conectar con el bot.",
        },
      ]);
    },
  });

  const handleSend = () => {
    if (!input.trim() || mutation.isPending) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    mutation.mutate({ message: userMessage, sid: sessionId });
  };

  const handleReset = () => {
    setMessages([]);
    setSessionId(`preview-${Math.random().toString(36).slice(2)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Preview — {tenant?.businessName ?? tenantId}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Simulá una conversación con el bot sin usar WhatsApp
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            Reiniciar chat
          </Button>
          <Button variant="outline" onClick={() => navigate(-1)}>
            Volver
          </Button>
        </div>
      </div>

      {/* Chat window */}
      <div className="bg-muted rounded-lg border h-[500px] flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm mt-8">
              Escribí un mensaje para empezar la conversación
            </p>
          ) : (
            messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-gray-900 text-white rounded-tr-none"
                      : "bg-card border text-foreground rounded-tl-none"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))
          )}
          {mutation.isPending && (
            <div className="flex justify-start">
              <div className="bg-card border px-4 py-2 rounded-2xl rounded-tl-none text-sm text-muted-foreground">
                Escribiendo...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t bg-card rounded-b-lg flex gap-2">
          <Input
            placeholder="Escribí un mensaje..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={mutation.isPending}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || mutation.isPending}
          >
            Enviar
          </Button>
        </div>
      </div>
    </div>
  );
}
