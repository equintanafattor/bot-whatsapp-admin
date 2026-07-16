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
  customerName?: string;
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
  customerName?: string;
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

export interface DashboardStats {
  totalTenants: number;
  totalConversations: number;
  activeConversations: number;
  totalLeads: number;
  last24h: {
    leads: number;
    messages: number;
    tenantsWithErrors: number;
  };
}

export const getDashboard = async (): Promise<DashboardStats> => {
  const { data } = await apiClient.get<DashboardStats>("/dashboard");
  return data;
};

export const resetUserPassword = async (
  email: string,
  newPassword: string,
): Promise<void> => {
  await apiClient.post(`/users/${encodeURIComponent(email)}/reset-password`, {
    newPassword,
  });
};

export const testWebhook = async (
  webhookUrl: string,
): Promise<{ success: boolean; status: number }> => {
  const { data } = await apiClient.post<{ success: boolean; status: number }>(
    "/tenants/test-webhook",
    { webhookUrl },
  );
  return data;
};

export interface ActivityEvent {
  type: "message" | "lead" | "handoff" | "error";
  description: string;
  createdAtUtc: string;
}

export const getTenantActivity = async (
  tenantId: string,
  hours = 24,
): Promise<ActivityEvent[]> => {
  const { data } = await apiClient.get<ActivityEvent[]>(
    `/tenants/${tenantId}/activity?hours=${hours}`,
  );
  return data;
};

export interface LeadRecord {
  id: string;
  phoneNumber: string;
  context: {
    customerName?: string;
    selectedService?: string;
    notes?: string;
    extra?: Record<string, unknown>;
  };
  createdAtUtc: string;
  completedAtUtc: string;
}

export interface LeadsResponse {
  leads: LeadRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export const getTenantLeads = async (
  tenantId: string,
  page = 1,
  pageSize = 20,
): Promise<LeadsResponse> => {
  const { data } = await apiClient.get<LeadsResponse>(
    `/tenants/${tenantId}/leads?page=${page}&pageSize=${pageSize}`,
  );
  return data;
};

export interface PreviewResponse {
  reply: string;
  state: string;
  sessionId: string;
}

export const previewBot = async (
  tenantId: string,
  message: string,
  sessionId: string,
): Promise<PreviewResponse> => {
  const { data } = await apiClient.post<PreviewResponse>(
    `/tenants/${tenantId}/preview`,
    { message, sessionId },
  );
  return data;
};

export const replyToConversation = async (
  tenantId: string,
  conversationId: string,
  message: string,
): Promise<void> => {
  await apiClient.post(
    `/tenants/${tenantId}/conversations/${conversationId}/reply`,
    { message },
  );
};

export const pauseConversation = async (
  tenantId: string,
  conversationId: string,
): Promise<void> => {
  await apiClient.post(
    `/tenants/${tenantId}/conversations/${conversationId}/pause`,
  );
};

export const resumeConversation = async (
  tenantId: string,
  conversationId: string,
): Promise<void> => {
  await apiClient.post(
    `/tenants/${tenantId}/conversations/${conversationId}/resume`,
  );
};

export interface TenantTool {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  inputSchema: string;
  webhookUrl: string;
  isActive: boolean;
  createdAtUtc: string;
}

export interface UpsertToolRequest {
  name: string;
  description: string;
  inputSchema: string;
  webhookUrl: string;
}

export const getTenantTools = async (
  tenantId: string,
): Promise<TenantTool[]> => {
  const { data } = await apiClient.get<TenantTool[]>(
    `/tenants/${tenantId}/tools`,
  );
  return data;
};

export const createTenantTool = async (
  tenantId: string,
  request: UpsertToolRequest,
): Promise<void> => {
  await apiClient.post(`/tenants/${tenantId}/tools`, request);
};

export const deleteTenantTool = async (
  tenantId: string,
  toolId: string,
): Promise<void> => {
  await apiClient.delete(`/tenants/${tenantId}/tools/${toolId}`);
};

export interface WhatsAppProfile {
  about: string | null;
  description: string | null;
  address: string | null;
  email: string | null;
  website: string | null;
  vertical: string | null;
  logoUrl: string | null;
}

export interface WhatsAppProfileResponse {
  configured: boolean;
  profile?: WhatsAppProfile;
}

export const getWhatsAppProfile = async (
  tenantId: string,
): Promise<WhatsAppProfileResponse> => {
  const { data } = await apiClient.get<WhatsAppProfileResponse>(
    `/tenants/${tenantId}/whatsapp-profile`,
  );
  return data;
};

export const updateWhatsAppProfile = async (
  tenantId: string,
  profile: WhatsAppProfile,
): Promise<void> => {
  await apiClient.put(`/tenants/${tenantId}/whatsapp-profile`, profile);
};

export const uploadWhatsAppLogo = async (
  tenantId: string,
  file: File,
): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await apiClient.post<{ url: string }>(
    `/tenants/${tenantId}/whatsapp-profile/logo`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return data.url;
};

// ── Content Templates ──────────────────────────────────────────────────────────

import type { ContentTemplate, CreateContentTemplateRequest } from "../types";

export const getContentTemplates = async (
  tenantId: string,
): Promise<ContentTemplate[]> => {
  const { data } = await apiClient.get<ContentTemplate[]>(
    `/tenants/${tenantId}/templates`,
  );
  return data;
};

export const createContentTemplate = async (
  tenantId: string,
  request: CreateContentTemplateRequest,
): Promise<ContentTemplate> => {
  const { data } = await apiClient.post<ContentTemplate>(
    `/tenants/${tenantId}/templates`,
    request,
  );
  return data;
};

export const deleteContentTemplate = async (
  tenantId: string,
  contentSid: string,
): Promise<void> => {
  await apiClient.delete(`/tenants/${tenantId}/templates/${contentSid}`);
};

// ── Broadcasts ─────────────────────────────────────────────────────────────────

import type { SendBroadcastRequest, BroadcastsResponse } from "../types";

export const sendBroadcast = async (
  tenantId: string,
  request: SendBroadcastRequest,
): Promise<{
  broadcastId: string;
  totalRecipients: number;
  message: string;
}> => {
  const { data } = await apiClient.post(
    `/tenants/${tenantId}/broadcasts`,
    request,
  );
  return data;
};

export const getBroadcasts = async (
  tenantId: string,
  page = 1,
  pageSize = 20,
): Promise<BroadcastsResponse> => {
  const { data } = await apiClient.get<BroadcastsResponse>(
    `/tenants/${tenantId}/broadcasts?page=${page}&pageSize=${pageSize}`,
  );
  return data;
};

import type { BroadcastPreviewResponse, VariableField } from "../types";

export const getBroadcastPreview = async (
  tenantId: string,
  request: {
    contentSid: string;
    productFilter?: string;
    variableMapping?: Record<string, string>;
  },
): Promise<BroadcastPreviewResponse> => {
  const { data } = await apiClient.post<BroadcastPreviewResponse>(
    `/tenants/${tenantId}/broadcasts/preview`,
    request,
  );
  return data;
};

export const getBroadcast = async (
  tenantId: string,
  broadcastId: string,
): Promise<import("../types").BroadcastMessage> => {
  const { data } = await apiClient.get(
    `/tenants/${tenantId}/broadcasts/${broadcastId}`,
  );
  return data;
};

export const getVariableFields = async (
  tenantId: string,
): Promise<VariableField[]> => {
  const { data } = await apiClient.get<VariableField[]>(
    `/tenants/${tenantId}/broadcasts/variable-fields`,
  );
  return data;
};
