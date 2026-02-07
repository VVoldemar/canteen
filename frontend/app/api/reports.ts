import type { CostsReportResponse, NutritionReportResponse } from "~/types";
import apiClient from "./client";

export interface ReportParams {
  date_from?: string;
  date_to?: string;
}

export async function getCostsReport(
  params: ReportParams = {},
): Promise<CostsReportResponse> {
  const response = await apiClient.get<CostsReportResponse>("/reports/costs", {
    params,
  });
  return response.data;
}

export async function getNutritionReport(
  params: ReportParams = {},
): Promise<NutritionReportResponse> {
  const response = await apiClient.get<NutritionReportResponse>(
    "/reports/nutrition",
    { params },
  );
  return response.data;
}
