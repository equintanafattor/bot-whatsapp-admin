import { apiClient } from "./client";
import type { AuthResponse } from "../types";

export const forgotPassword = async (email: string): Promise<string> => {
  const { data } = await apiClient.post<{ message: string }>("/auth/forgot-password", { email });
  return data.message;
};

export const resetPassword = async (token: string, password: string): Promise<AuthResponse> => {
  const { data } = await apiClient.post<AuthResponse>("/auth/reset-password", { token, password });
  return data;
};

export interface InviteInfo {
  email: string;
  businessName: string | null;
}

export const getInvite = async (token: string): Promise<InviteInfo> => {
  const { data } = await apiClient.get<InviteInfo>("/auth/invite", { params: { token } });
  return data;
};

export const acceptInvite = async (token: string, password: string): Promise<AuthResponse> => {
  const { data } = await apiClient.post<AuthResponse>("/auth/accept-invite", { token, password });
  return data;
};

export interface TeamMember {
  id: string;
  email: string;
  invitationPending: boolean;
  createdAtUtc: string;
}

export interface Team {
  users: TeamMember[];
  maxUsers: number | null;
}

export const getTeam = async (tenantId: string): Promise<Team> => {
  const { data } = await apiClient.get<Team>(`/tenants/${tenantId}/users`);
  return data;
};

export const inviteUser = async (tenantId: string, email: string): Promise<string> => {
  const { data } = await apiClient.post<{ message: string }>(`/tenants/${tenantId}/users/invite`, { email });
  return data.message;
};

export const removeUser = async (tenantId: string, userId: string): Promise<string> => {
  const { data } = await apiClient.delete<{ message: string }>(`/tenants/${tenantId}/users/${userId}`);
  return data.message;
};
