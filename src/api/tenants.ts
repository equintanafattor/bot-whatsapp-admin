import { apiClient } from "./client";
import type {
  AuthResponse,
  TenantConfiguration,
  TenantStats,
  UpsertTenantRequest,
} from "../types";

// ── Auth ───────────────────────────────────────────────────────────────────────

export const login = async (
  email: string,
  password: string,
): Promise<AuthResponse> => {
  const { data } = await apiClient.post<AuthResponse>("/auth/login", {
    email,
    password,
  });
  return data;
};

// ── Tenants ────────────────────────────────────────────────────────────────────

export const getTenants = async (): Promise<TenantConfiguration[]> => {
  const { data } = await apiClient.get<TenantConfiguration[]>("/tenants");
  return data;
};

export const getTenant = async (
  tenantId: string,
): Promise<TenantConfiguration> => {
  const { data } = await apiClient.get<TenantConfiguration>(
    `/tenants/${tenantId}`,
  );
  return data;
};

export const upsertTenant = async (
  request: UpsertTenantRequest,
): Promise<void> => {
  await apiClient.post("/tenants", request);
};

export const deleteTenant = async (tenantId: string): Promise<void> => {
  await apiClient.delete(`/tenants/${tenantId}`);
};

export const getTenantStats = async (
  tenantId: string,
): Promise<TenantStats> => {
  const { data } = await apiClient.get<TenantStats>(
    `/tenants/${tenantId}/stats`,
  );
  return data;
};

// ── Users ──────────────────────────────────────────────────────────────────────

export interface UserRecord {
  id: string;
  email: string;
  role: string;
  tenantId?: string;
  createdAtUtc: string;
}

export const getUsers = async (): Promise<UserRecord[]> => {
  const { data } = await apiClient.get<UserRecord[]>("/users");
  return data;
};

export const createTenantUser = async (
  email: string,
  password: string,
  tenantId: string,
): Promise<void> => {
  await apiClient.post("/users", { email, password, tenantId });
};

export const deleteUser = async (email: string): Promise<void> => {
  await apiClient.delete(`/users/${encodeURIComponent(email)}`);
};

export interface ConversationRecord {
  id: string;
  phoneNumber: string;
  state: string;
  createdAtUtc: string;
  updatedAtUtc: string;
  lastMessage?: string;
}

export interface ConversationsResponse {
  conversations: ConversationRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export const getTenantConversations = async (
  tenantId: string,
  page = 1,
  pageSize = 20,
): Promise<ConversationsResponse> => {
  const { data } = await apiClient.get<ConversationsResponse>(
    `/tenants/${tenantId}/conversations?page=${page}&pageSize=${pageSize}`,
  );
  return data;
};

export const changePassword = async (
  currentPassword: string,
  newPassword: string,
): Promise<void> => {
  await apiClient.post("/profile/change-password", {
    currentPassword,
    newPassword,
  });
};

export interface MessageRecord {
  id: string;
  direction: "inbound" | "outbound";
  text: string;
  createdAtUtc: string;
}

export interface ConversationDetail {
  id: string;
  phoneNumber: string;
  state: string;
  createdAtUtc: string;
  updatedAtUtc: string;
  messages: MessageRecord[];
}

export const getConversationDetail = async (
  tenantId: string,
  conversationId: string,
): Promise<ConversationDetail> => {
  const { data } = await apiClient.get<ConversationDetail>(
    `/tenants/${tenantId}/conversations/${conversationId}`,
  );
  return data;
};

export interface HealthEvent {
  type: string;
  message: string;
  createdAtUtc: string;
}

export interface TenantHealth {
  tenantId: string;
  status: "healthy" | "degraded";
  errorsLast24h: number;
  recentErrors: HealthEvent[];
}

export const getTenantHealth = async (
  tenantId: string,
): Promise<TenantHealth> => {
  const { data } = await apiClient.get<TenantHealth>(
    `/tenants/${tenantId}/health`,
  );
  return data;
};
