import { apiClient } from './client';
import type { AuthResponse, TenantConfiguration, TenantStats, UpsertTenantRequest } from '../types';

// ── Auth ───────────────────────────────────────────────────────────────────────

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', { email, password });
  return data;
};

// ── Tenants ────────────────────────────────────────────────────────────────────

export const getTenants = async (): Promise<TenantConfiguration[]> => {
  const { data } = await apiClient.get<TenantConfiguration[]>('/tenants');
  return data;
};

export const getTenant = async (tenantId: string): Promise<TenantConfiguration> => {
  const { data } = await apiClient.get<TenantConfiguration>(`/tenants/${tenantId}`);
  return data;
};

export const upsertTenant = async (request: UpsertTenantRequest): Promise<void> => {
  await apiClient.post('/tenants', request);
};

export const deleteTenant = async (tenantId: string): Promise<void> => {
  await apiClient.delete(`/tenants/${tenantId}`);
};

export const getTenantStats = async (tenantId: string): Promise<TenantStats> => {
  const { data } = await apiClient.get<TenantStats>(`/tenants/${tenantId}/stats`);
  return data;
};