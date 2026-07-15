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
}
