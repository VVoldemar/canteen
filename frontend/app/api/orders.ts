import type {
  CreateOrderRequest,
  Order,
  OrderDetail,
  OrderStatus,
  PaginatedResponse,
} from "~/types";
import apiClient from "./client";

export interface GetOrdersParams {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  user_id?: number;
  date_from?: string;
  date_to?: string;
}

export async function getOrders(
  params: GetOrdersParams = {},
): Promise<PaginatedResponse<Order>> {
  const response = await apiClient.get<PaginatedResponse<Order>>("/orders", {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      status: params.status,
      user_id: params.user_id,
      date_from: params.date_from,
      date_to: params.date_to,
    },
  });
  return response.data;
}

export async function getOrder(orderId: number): Promise<OrderDetail> {
  const response = await apiClient.get<OrderDetail>(`/orders/${orderId}`);
  return response.data;
}

export async function createOrder(
  data: CreateOrderRequest,
): Promise<OrderDetail> {
  const response = await apiClient.post<OrderDetail>("/orders", data);
  return response.data;
}

export async function cancelOrder(orderId: number): Promise<OrderDetail> {
  const response = await apiClient.post<OrderDetail>(
    `/orders/${orderId}/cancel`,
  );
  return response.data;
}

export async function confirmOrderReceipt(
  orderId: number,
): Promise<OrderDetail> {
  const response = await apiClient.post<OrderDetail>(
    `/orders/${orderId}/confirm-receipt`,
  );
  return response.data;
}

export async function serveOrder(orderId: number): Promise<OrderDetail> {
  const response = await apiClient.post<OrderDetail>(
    `/orders/${orderId}/serve`,
  );
  return response.data;
}
