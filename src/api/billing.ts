import { apiClient } from "./client";

export interface Plan {
  id: string;
  name: string;
  priceUsd: number;
  priceArs: number | null;
  monthlyReplies: number;
  maxUsers: number | null;
  toolsEnabled: boolean;
  broadcastsEnabled: boolean;
  isActive: boolean;
  sortOrder: number;
}

export type PlanInput = Omit<Plan, "id">;

export type BillingMode = "manual" | "mercadopago";
export type SubscriptionStatus =
  | "none"
  | "pending"
  | "active"
  | "paused"
  | "cancelled";

export interface TenantBilling {
  tenantId: string;
  plan: Pick<
    Plan,
    | "id"
    | "name"
    | "priceArs"
    | "priceUsd"
    | "monthlyReplies"
    | "maxUsers"
    | "toolsEnabled"
    | "broadcastsEnabled"
  > | null;
  billingMode: BillingMode;
  status: SubscriptionStatus;
  serviceActive: boolean;
  inactiveReason: string | null;
  currentPeriodEndUtc: string | null;
  amount: number | null;
  currency: string | null;
  usage: {
    botRepliesThisMonth: number;
    monthlyReplyLimit: number | null;
  };
  payerEmail: string | null;
  checkoutUrl: string | null;
  providerSubscriptionId: string | null;
}

export interface BillingActionResult {
  message: string;
  status: SubscriptionStatus;
  checkoutUrl: string | null;
}

export const getPlans = async (): Promise<Plan[]> => {
  const { data } = await apiClient.get<Plan[]>("/plans");
  return data;
};

export const savePlan = async (id: string, plan: PlanInput): Promise<Plan> => {
  const { data } = await apiClient.put<Plan>(`/plans/${id}`, plan);
  return data;
};

export const getTenantBilling = async (
  tenantId: string,
): Promise<TenantBilling> => {
  const { data } = await apiClient.get<TenantBilling>(
    `/tenants/${tenantId}/billing`,
  );
  return data;
};

export const setTenantPlan = async (
  tenantId: string,
  planId: string | null,
  billingMode: BillingMode,
): Promise<BillingActionResult> => {
  const { data } = await apiClient.put<BillingActionResult>(
    `/tenants/${tenantId}/billing/plan`,
    { planId, billingMode },
  );
  return data;
};

export const createCheckout = async (
  tenantId: string,
  payerEmail: string,
): Promise<BillingActionResult> => {
  const { data } = await apiClient.post<BillingActionResult>(
    `/tenants/${tenantId}/billing/checkout`,
    { payerEmail },
  );
  return data;
};

export const cancelSubscription = async (
  tenantId: string,
): Promise<BillingActionResult> => {
  const { data } = await apiClient.post<BillingActionResult>(
    `/tenants/${tenantId}/billing/cancel`,
  );
  return data;
};

export const syncSubscription = async (tenantId: string): Promise<void> => {
  await apiClient.post(`/tenants/${tenantId}/billing/sync`);
};
