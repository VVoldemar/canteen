import type {
  AttendanceStatisticsResponse,
  DishStatisticsResponse,
  PaymentStatisticsResponse,
} from "~/types";
import apiClient from "./client";

export interface StatisticsParams {
  date_from?: string;
  date_to?: string;
}

export async function getPaymentStatistics(
  params: StatisticsParams = {},
): Promise<PaymentStatisticsResponse> {
  const response = await apiClient.get<PaymentStatisticsResponse>(
    "/statistics/payments",
    { params },
  );
  return response.data;
}

export async function getAttendanceStatistics(
  params: StatisticsParams = {},
): Promise<AttendanceStatisticsResponse> {
  const response = await apiClient.get<AttendanceStatisticsResponse>(
    "/statistics/attendance",
    { params },
  );
  return response.data;
}

export async function getDishStatistics(
  params: StatisticsParams = {},
): Promise<DishStatisticsResponse> {
  const response = await apiClient.get<DishStatisticsResponse>(
    "/statistics/dishes",
    { params },
  );
  return response.data;
}
