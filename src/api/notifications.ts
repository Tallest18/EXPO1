import { apiClient } from "./client";

export interface ApiNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  product?: number | null;
  product_name?: string | null;
  created_at?: string;
}

export async function listNotifications(): Promise<ApiNotification[]> {
  const response = await apiClient.get<ApiNotification[]>(
    "/products/notifications/",
  );
  return response.data;
}

export async function createNotification(payload: {
  type: string;
  title: string;
  message: string;
  product?: number | null;
}): Promise<ApiNotification> {
  const response = await apiClient.post<ApiNotification>(
    "/products/notifications/",
    payload,
  );
  return response.data;
}

export async function getNotification(
  id: string | number,
): Promise<ApiNotification> {
  const response = await apiClient.get<ApiNotification>(
    `/products/notifications/${id}/`,
  );
  return response.data;
}

export async function markNotificationRead(
  id: string | number,
): Promise<ApiNotification> {
  const response = await apiClient.patch<ApiNotification>(
    `/products/notifications/${id}/mark_read/`,
  );
  return response.data;
}

export async function markAllNotificationsRead(): Promise<{ status: string }> {
  const response = await apiClient.patch<{ status: string }>(
    "/products/notifications/mark_all_read/",
  );
  return response.data;
}

export async function deleteNotification(id: string | number): Promise<void> {
  await apiClient.delete(`/products/notifications/${id}/`);
}

export async function getUnreadNotificationsCount(): Promise<{
  unread_count: number;
}> {
  const response = await apiClient.get<{ unread_count: number }>(
    "/products/notifications/unread_count/",
  );
  return response.data;
}
