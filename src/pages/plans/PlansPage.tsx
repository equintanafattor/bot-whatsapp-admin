import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getPlans, savePlan, type Plan, type PlanInput } from "../../api/billing";
import { getApiErrorMessage } from "../../api/client";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";

function toInput(plan: Plan): PlanInput {
  const { id: _id, ...rest } = plan;
  void _id;
  return rest;
}

function PlanEditor({ plan }: { plan: Plan }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<PlanInput>(() => toInput(plan));

  const mutation = useMutation({
    mutationFn: () => savePlan(plan.id, form),
    onSuccess: () => {
      toast.success(`Plan "${form.name}" guardado.`);
      queryClient.invalidateQueries({ queryKey: ["plans"] });
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "No se pudo guardar el plan.")),
  });

  const numberField = (
    key: "priceUsd" | "priceArs" | "monthlyReplies" | "maxUsers" | "sortOrder",
    label: string,
    hint?: string,
  ) => (
    <div className="space-y-1">
      <Label htmlFor={`${plan.id}-${key}`}>{label}</Label>
      <Input
        id={`${plan.id}-${key}`}
        type="number"
        min={0}
        value={form[key] ?? ""}
        placeholder={hint}
        onChange={(e) =>
          setForm({
            ...form,
            [key]: e.target.value === "" ? null : Number(e.target.value),
          })
        }
      />
    </div>
  );

  const checkbox = (
    key: "toolsEnabled" | "broadcastsEnabled" | "isActive",
    label: string,
  ) => (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
      />
      {label}
    </label>
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span>
            {plan.name}{" "}
            <span className="text-xs font-normal text-muted-foreground">({plan.id})</span>
          </span>
          {!plan.priceArs && (
            <span className="text-xs font-normal text-amber-600">
              Falta el precio en pesos
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor={`${plan.id}-name`}>Nombre</Label>
          <Input
            id={`${plan.id}-name`}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {numberField("priceArs", "Precio mensual (ARS)", "Sin configurar")}
          {numberField("priceUsd", "Precio referencia (USD)")}
          {numberField("monthlyReplies", "Respuestas del bot por mes")}
          {numberField("maxUsers", "Usuarios del panel", "Sin límite")}
        </div>
        <div className="flex flex-wrap gap-4">
          {checkbox("toolsEnabled", "Herramientas (n8n)")}
          {checkbox("broadcastsEnabled", "Envíos masivos")}
          {checkbox("isActive", "Disponible para asignar")}
        </div>
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          {mutation.isPending ? "Guardando..." : "Guardar"}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function PlansPage() {
  const { data: plans, isLoading } = useQuery({ queryKey: ["plans"], queryFn: getPlans });

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Planes</h1>
        <p className="text-muted-foreground mt-1">
          Precios y límites de cada plan. Cambiar el precio no modifica las
          suscripciones ya activas; se aplica a los links que generes después.
        </p>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Cargando...</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {plans?.map((plan) => (
            <PlanEditor key={`${plan.id}-${plan.priceArs}-${plan.monthlyReplies}`} plan={plan} />
          ))}
        </div>
      )}
    </div>
  );
}
