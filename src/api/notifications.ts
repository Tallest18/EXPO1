import { apiClient } from "./client";
import {
    NOTIFICATION,
    NOTIFICATIONS,
    NOTIFICATIONS_MARK_ALL_READ,
    NOTIFICATIONS_UNREAD_COUNT,
} from "./endpoints";

export interface ApiNotification {
  id: number;
  type: string;
  title: string;
  description?: string;
  message?: string;
  status?: "New" | "Read" | "Archived" | string;
  is_read?: boolean;
  inventoryId?: number | string | null;
  inventory_name?: string | null;
  remainingStock?: number | string | null;
  product?: number | null;
  product_name?: string | null;
  created_at?: string;
}

export interface ApiNotificationsResponse {
  count: number;
  page_size: number;
  current_page: number;
  total_pages: number;
  results: ApiNotification[];
}

const normalizeApiPath = (path: string) => path.replace(/^\/api(?=\/)/, "");

export async function listNotifications(params?: {
  page?: number;
  page_size?: number;
}): Promise<ApiNotificationsResponse> {
  const response = await apiClient.get<ApiNotificationsResponse>(
    normalizeApiPath(NOTIFICATIONS),
    { params },
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
    normalizeApiPath(NOTIFICATIONS),
    payload,
  );
  return response.data;
}

export async function getNotification(
  id: string | number,
): Promise<ApiNotification> {
  const response = await apiClient.get<ApiNotification>(
    normalizeApiPath(NOTIFICATION(id)),
  );
  return response.data;
}

export async function markNotificationRead(
  id: string | number,
): Promise<ApiNotification> {
  const response = await apiClient.patch<ApiNotification>(
    `${normalizeApiPath(NOTIFICATION(id))}mark_read/`,
  );
  return response.data;
}

export async function markAllNotificationsRead(): Promise<{ status: string }> {
  const response = await apiClient.patch<{ status: string }>(
    normalizeApiPath(NOTIFICATIONS_MARK_ALL_READ),
  );
  return response.data;
}

export async function deleteNotification(id: string | number): Promise<void> {
  await apiClient.delete(normalizeApiPath(NOTIFICATION(id)));
}

export async function getUnreadNotificationsCount(): Promise<{
  unread_count: number;
}> {
  const response = await apiClient.get<{ unread_count: number }>(
    normalizeApiPath(NOTIFICATIONS_UNREAD_COUNT),
  );
  return response.data;
}
