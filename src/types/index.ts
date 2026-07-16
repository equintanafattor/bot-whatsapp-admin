export interface User {
  email: string;
  role: "superadmin" | "tenant";
  tenantId?: string;
}

export interface AuthResponse {
  token: string;
  role: "superadmin" | "tenant";
  tenantId?: string;
  email: string;
}

export interface TenantConfiguration {
  tenantId: string;
  businessName: string;
  systemPrompt: string;
  webhookUrl?: string;
  monthlyMessageLimit?: number;
  createdAtUtc: string;
  updatedAtUtc: string;
  whatsAppSenderSid?: string | null;
  messagingProvider?: number;
  messagingApiKey?: string | null;
  responseToolSchema?: string | null;
}

export interface TenantStats {
  tenantId: string;
  totalConversations: number;
  activeConversations: number;
  leadsGenerated: number;
  handedToHuman: number;
  last7Days: {
    messages: number;
    leads: number;
  };
}

export interface UpsertTenantRequest {
  tenantId: string;
  businessName: string;
  systemPrompt: string;
  webhookUrl?: string;
  monthlyMessageLimit?: number;
  whatsAppSenderSid?: string;
  messagingProvider?: number;
  messagingApiKey?: string;
  responseToolSchema?: string;
}

// ── Content Templates ──────────────────────────────────────────────────────────

export interface ContentTemplate {
  sid: string;
  friendlyName: string;
  language: string;
  category: string;
  approvalStatus: string | null;
  dateCreated: string;
  types: Record<string, unknown> | null;
}

export interface CreateContentTemplateRequest {
  friendlyName: string;
  language: string;
  category: string;
  body: {
    text: string;
    actions?: {
      type: string;
      title: string;
      url?: string;
      phoneNumber?: string;
    }[];
  };
}

// ── Broadcasts ─────────────────────────────────────────────────────────────────

export interface BroadcastMessage {
  id: string;
  tenantId: string;
  contentSid: string;
  templateName: string;
  audienceFilter: string | null;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  status: "pending" | "sending" | "completed" | "failed";
  createdAtUtc: string;
  completedAtUtc: string | null;
}

export interface SendBroadcastRequest {
  contentSid: string;
  templateName: string;
  productFilter?: string;
}

export interface BroadcastsResponse {
  broadcasts: BroadcastMessage[];
  total: number;
  page: number;
  pageSize: number;
}
