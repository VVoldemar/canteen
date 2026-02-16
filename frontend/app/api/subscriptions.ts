import type { CancelSubscriptionResponse, PurchaseSubscriptionRequest, PurchaseSubscriptionResponse, Subscription } from "~/types";
import apiClient from "./client";

export async function getMySubscription(): Promise<Subscription> {
  const response = await apiClient.get<Subscription>("/subscriptions/my");
  return response.data;
}

export async function purchaseSubscription(
  data: PurchaseSubscriptionRequest,
): Promise<PurchaseSubscriptionResponse> {
  const response = await apiClient.post<PurchaseSubscriptionResponse>(
    "/subscriptions/purchase",
    data,
  );
  return response.data;
}

export async function cancelSubscription(): Promise<CancelSubscriptionResponse> {
  const response = await apiClient.post<CancelSubscriptionResponse>(
    "/subscriptions/cancel",
  );
  return response.data;
}
