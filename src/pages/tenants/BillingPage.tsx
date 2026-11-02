import { useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  cancelSubscription,
  createCheckout,
  getPlans,
  getTenantBilling,
  setTenantPlan,
  syncSubscription,
  type BillingMode,
  type SubscriptionStatus,
  type TenantBilling,
} from "../../api/billing";
import { getApiErrorMessage } from "../../api/client";
import { useAuth } from "../../lib/auth-context";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";

const statusLabel: Record<SubscriptionStatus, string> = {
  none: "Sin suscripción",
  pending: "Esperando el pago",
  active: "Al día",
  paused: "Pausada",
  cancelled: "Cancelada",
};

const arsFormat = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });

function formatDate(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString("es-AR") : "—";
}

function UsageCard({ billing }: { billing: TenantBilling }) {
  const { botRepliesThisMonth: used, monthlyReplyLimit: limit } = billing.usage;
  const percent = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const barColor = percent >= 100 ? "bg-red-500" : percent >= 80 ? "bg-amber-500" : "bg-blue-500";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Consumo de este mes</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold text-foreground">
          {used.toLocaleString("es-AR")}
          <span className="text-base font-normal text-muted-foreground">
            {limit ? ` / ${limit.toLocaleString("es-AR")} respuestas` : " respuestas (sin límite)"}
          </span>
        </p>
        {limit && (
          <>
            <div className="mt-3 h-2 w-full rounded bg-muted">
              <div className={`h-2 rounded ${barColor}`} style={{ width: `${percent}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {percent >= 100
                ? "Se alcanzó el límite: el bot no responde hasta el mes que viene o hasta cambiar de plan."
                : `${percent}% usado. El contador se reinicia el 1° de cada mes.`}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function SubscriptionCard({ billing }: { billing: TenantBilling }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Plan y pago</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p>
          <span className="text-muted-foreground">Plan: </span>
          <span className="font-medium">{billing.plan?.name ?? "Sin plan asignado"}</span>
        </p>
        <p>
          <span className="text-muted-foreground">Cobro: </span>
          {billing.billingMode === "mercadopago" ? "Mercado Pago (débito mensual)" : "Manual"}
        </p>
        {billing.billingMode === "mercadopago" && (
          <>
            <p>
              <span className="text-muted-foreground">Estado: </span>
              {statusLabel[billing.status]}
            </p>
            {billing.amount && (
              <p>
                <span className="text-muted-foreground">Monto mensual: </span>
                {arsFormat.format(billing.amount)}
              </p>
            )}
            <p>
              <span className="text-muted-foreground">Próximo cobro: </span>
              {formatDate(billing.currentPeriodEndUtc)}
            </p>
          </>
        )}
        {!billing.serviceActive && (
          <p className="rounded bg-red-50 dark:bg-red-950/40 p-2 text-red-700 dark:text-red-300">
            El bot está pausado: {billing.inactiveReason}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function AdminBillingControls({ tenantId, billing }: { tenantId: string; billing: TenantBilling }) {
  const queryClient = useQueryClient();
  const { data: plans } = useQuery({ queryKey: ["plans"], queryFn: getPlans });
  const [planId, setPlanId] = useState<string>(billing.plan?.id ?? "");
  const [mode, setMode] = useState<BillingMode>(billing.billingMode);
  const [payerEmail, setPayerEmail] = useState(billing.payerEmail ?? "");

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["billing", tenantId] });
  const onError = (fallback: string) => (error: unknown) =>
    toast.error(getApiErrorMessage(error, fallback));

  const planMutation = useMutation({
    mutationFn: () => setTenantPlan(tenantId, planId || null, mode),
    onSuccess: (r) => { toast.success(r.message); refresh(); },
    onError: onError("No se pudo guardar el plan."),
  });
  const checkoutMutation = useMutation({
    mutationFn: () => createCheckout(tenantId, payerEmail),
    onSuccess: (r) => { toast.success(r.message); refresh(); },
    onError: onError("No se pudo generar el link de pago."),
  });
  const cancelMutation = useMutation({
    mutationFn: () => cancelSubscription(tenantId),
    onSuccess: (r) => { toast.success(r.message); refresh(); },
    onError: onError("No se pudo cancelar la suscripción."),
  });
  const syncMutation = useMutation({
    mutationFn: () => syncSubscription(tenantId),
    onSuccess: () => { toast.success("Estado actualizado desde Mercado Pago."); refresh(); },
    onError: onError("No se pudo consultar Mercado Pago."),
  });

  const selectedPlan = plans?.find((p) => p.id === planId);
  const hasActiveSubscription = billing.status === "active" && !!billing.providerSubscriptionId;

  const copyLink = async () => {
    if (!billing.checkoutUrl) return;
    await navigator.clipboard.writeText(billing.checkoutUrl);
    toast.success("Link copiado.");
  };

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Administrar cobro (superadmin)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3 items-end">
          <div className="space-y-1">
            <Label htmlFor="plan">Plan</Label>
            <select
              id="plan"
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
            >
              <option value="">Sin plan (sin límites)</option>
              {plans
                ?.filter((p) => p.isActive || p.id === billing.plan?.id)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.monthlyReplies.toLocaleString("es-AR")} respuestas
                    {p.priceArs ? ` — ${arsFormat.format(p.priceArs)}` : ""}
                  </option>
                ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="mode">Cobro</Label>
            <select
              id="mode"
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              value={mode}
              onChange={(e) => setMode(e.target.value as BillingMode)}
            >
              <option value="manual">Manual (sin corte automático)</option>
              <option value="mercadopago">Mercado Pago (corta si no paga)</option>
            </select>
          </div>
          <Button onClick={() => planMutation.mutate()} disabled={planMutation.isPending}>
            {planMutation.isPending ? "Guardando..." : "Guardar plan"}
          </Button>
        </div>
        {hasActiveSubscription && selectedPlan && selectedPlan.id !== billing.plan?.id && (
          <p className="text-xs text-muted-foreground">
            Tiene una suscripción activa: al guardar se actualiza el monto en Mercado Pago
            desde el próximo cobro.
          </p>
        )}

        {billing.billingMode === "mercadopago" && (
          <div className="space-y-3 border-t pt-4">
            <div className="grid gap-4 md:grid-cols-3 items-end">
              <div className="space-y-1 md:col-span-2">
                <Label htmlFor="payerEmail">Email de Mercado Pago del cliente</Label>
                <Input
                  id="payerEmail"
                  type="email"
                  placeholder="cliente@ejemplo.com"
                  value={payerEmail}
                  onChange={(e) => setPayerEmail(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Tiene que ser el email de la cuenta de Mercado Pago con la que va a pagar.
                </p>
              </div>
              <Button
                onClick={() => checkoutMutation.mutate()}
                disabled={checkoutMutation.isPending || hasActiveSubscription}
              >
                {checkoutMutation.isPending ? "Generando..." : "Generar link de pago"}
              </Button>
            </div>

            {billing.checkoutUrl && billing.status === "pending" && (
              <div className="rounded border p-3 text-sm space-y-2">
                <p className="text-muted-foreground">
                  Mandale este link al cliente para que active el débito mensual:
                </p>
                <div className="flex gap-2">
                  <Input readOnly value={billing.checkoutUrl} />
                  <Button variant="outline" onClick={copyLink}>Copiar</Button>
                </div>
              </div>
            )}

            {billing.providerSubscriptionId && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending}>
                  Actualizar estado
                </Button>
                {billing.status !== "cancelled" && (
                  <Button
                    variant="outline"
                    className="text-red-600"
                    disabled={cancelMutation.isPending}
                    onClick={() => {
                      if (confirm("¿Cancelar la suscripción en Mercado Pago? El bot sigue hasta el fin del período pagado.")) {
                        cancelMutation.mutate();
                      }
                    }}
                  >
                    Cancelar suscripción
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function BillingPage() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const { isSuperAdmin } = useAuth();

  const { data: billing, isLoading } = useQuery({
    queryKey: ["billing", tenantId],
    queryFn: () => getTenantBilling(tenantId!),
    enabled: !!tenantId,
  });

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Plan y facturación</h1>
        <p className="text-muted-foreground mt-1">
          Las respuestas del bot que se envían a tus clientes son las que cuentan para el plan.
        </p>
      </div>

      {isLoading || !billing ? (
        <p className="text-muted-foreground">Cargando...</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <UsageCard billing={billing} />
          <SubscriptionCard billing={billing} />
          {isSuperAdmin && (
            <AdminBillingControls
              key={`${billing.plan?.id}-${billing.billingMode}-${billing.status}`}
              tenantId={tenantId!}
              billing={billing}
            />
          )}
        </div>
      )}
    </div>
  );
}
