import type {
  Application,
  ApplicationDetail,
  ApplicationRejectRequest,
  CreateApplicationRequest,
  OrderStatus,
  PaginatedResponse,
} from "~/types";
import apiClient from "./client";

export interface GetApplicationsParams {
  page?: number;
  limit?: number;
  status?: OrderStatus;
}

export async function getApplications(
  params: GetApplicationsParams = {},
): Promise<PaginatedResponse<Application>> {
  const limit = Math.min(params.limit ?? 20, 100);
  const response = await apiClient.get<PaginatedResponse<Application>>(
    "/applications",
    {
      params: {
        page: params.page ?? 1,
        limit,
        status: params.status,
      },
    },
  );
  return response.data;
}

export async function getApplication(
  id: number,
): Promise<ApplicationDetail> {
  const response = await apiClient.get<ApplicationDetail>(
    `/applications/${id}`,
  );
  return response.data;
}

export async function createApplication(
  data: CreateApplicationRequest,
): Promise<Application> {
  const response = await apiClient.post<Application>("/applications", data);
  return response.data;
}

export async function approveApplication(id: number): Promise<Application> {
  const response = await apiClient.post<Application>(
    `/applications/${id}/approve`,
  );
  return response.data;
}

export async function rejectApplication(
  id: number,
  data: ApplicationRejectRequest,
): Promise<Application> {
  const response = await apiClient.post<Application>(
    `/applications/${id}/reject`,
    data,
  );
  return response.data;
}
