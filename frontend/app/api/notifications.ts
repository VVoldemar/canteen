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
