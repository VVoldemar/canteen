import type { Notification } from "~/types";
import apiClient from "./client";

export async function getNotifications(): Promise<Notification[]> {
  const response = await apiClient.get<Notification[] | Notification | null>(
    "/notifications",
  );

  const data = response.data;
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return [data];
}

export async function getUnreadCount(): Promise<number> {
  const response = await apiClient.get<{ count: number }>(
    "/notifications/unread-count",
  );
  return response.data.count;
}

export async function markNotificationAsRead(
  notificationId: number,
): Promise<Notification> {
  const response = await apiClient.patch<Notification>(
    `/notifications/${notificationId}/read`,
  );
  return response.data;
}

export async function markAllNotificationsAsRead(): Promise<{ marked: number }> {
  const response = await apiClient.patch<{ marked: number }>(
    "/notifications/read-all",
  );
  return response.data;
}
