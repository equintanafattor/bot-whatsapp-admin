import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { deleteContact, exportContact } from "../../api/privacy";
import { getApiErrorMessage } from "../../api/client";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";

function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function PrivacyPage() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [phone, setPhone] = useState(searchParams.get("phone") ?? "");
  const digits = phone.replace(/\D/g, "");

  const exportMutation = useMutation({
    mutationFn: () => exportContact(tenantId!, phone),
    onSuccess: (data) => {
      downloadJson(data, `datos-${digits}.json`);
      toast.success("Datos exportados.");
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudieron exportar los datos.")),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteContact(tenantId!, phone),
    onSuccess: (result) => {
      toast.success(result.message);
      queryClient.invalidateQueries();
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudieron borrar los datos.")),
  });

  const confirmDelete = () => {
    const ok = confirm(
      `¿Borrar todas las conversaciones, mensajes y datos guardados del número ${phone}?\n\n` +
        "No se puede deshacer. Los leads que ya se enviaron a tu planilla o sistema (webhook) " +
        "no se borran desde acá: eliminalos también ahí.",
    );
    if (ok) deleteMutation.mutate();
  };

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Datos personales</h1>
        <p className="text-muted-foreground mt-1">
          Si un cliente pide ver o borrar sus datos (Ley 25.326), buscalo por su número de WhatsApp.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pedido de un cliente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="phone">Número de WhatsApp</Label>
            <Input
              id="phone"
              placeholder="+54 9 11 1234-5678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Con código de país y de área, como aparece en las conversaciones.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={digits.length < 6 || exportMutation.isPending}
              onClick={() => exportMutation.mutate()}
            >
              {exportMutation.isPending ? "Exportando..." : "Descargar sus datos"}
            </Button>
            <Button
              variant="outline"
              className="text-red-600"
              disabled={digits.length < 6 || deleteMutation.isPending}
              onClick={confirmDelete}
            >
              {deleteMutation.isPending ? "Borrando..." : "Borrar sus datos"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Se borran sus conversaciones, mensajes, lo que el bot recordaba de esa persona y su número
            en los envíos masivos. Plazos de la ley: 10 días corridos para un pedido de acceso y
            5 días hábiles para uno de supresión.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
