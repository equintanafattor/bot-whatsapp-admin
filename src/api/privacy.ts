import { apiClient } from "./client";

export interface ContactDeletionResult {
  message: string;
  conversations: number;
  queuedMessages: number;
  broadcastRecipients: number;
}

export const exportContact = async (tenantId: string, phone: string): Promise<unknown> => {
  const { data } = await apiClient.get(`/tenants/${tenantId}/contacts/export`, {
    params: { phone },
  });
  return data;
};

export const deleteContact = async (
  tenantId: string,
  phone: string,
): Promise<ContactDeletionResult> => {
  const { data } = await apiClient.delete<ContactDeletionResult>(
    `/tenants/${tenantId}/contacts`,
    { params: { phone } },
  );
  return data;
};
