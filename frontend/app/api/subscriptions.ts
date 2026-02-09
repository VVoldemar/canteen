import type { PurchaseSubscriptionRequest, Subscription } from "~/types";
import apiClient from "./client";

export async function getMySubscription(): Promise<Subscription> {
  const response = await apiClient.get<Subscription>("/subscriptions/my");
  return response.data;
}

export async function purchaseSubscription(
  data: PurchaseSubscriptionRequest,
): Promise<Subscription> {
  const response = await apiClient.post<Subscription>(
    "/subscriptions/purchase",
    data,
  );
  return response.data;
}
