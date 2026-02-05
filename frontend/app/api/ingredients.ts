import type { Ingredient, PaginatedResponse } from "~/types";
import apiClient from "./client";

export interface GetIngredientsParams {
  search?: string;
  page?: number;
  limit?: number;
}

export async function getIngredients(
  params: GetIngredientsParams = {},
): Promise<PaginatedResponse<Ingredient>> {
  const response = await apiClient.get<PaginatedResponse<Ingredient>>(
    "/ingredients",
    {
      params: {
        search: params.search,
        page: params.page || 1,
        limit: params.limit || 50,
      },
    },
  );
  return response.data;
}

export async function getIngredient(id: number): Promise<Ingredient> {
  const response = await apiClient.get<Ingredient>(`/ingredients/${id}`);
  return response.data;
}
