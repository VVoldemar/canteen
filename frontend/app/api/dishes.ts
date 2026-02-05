import type {
  CreateDishRequest,
  Dish,
  DishDetail,
  PaginatedResponse,
  UpdateDishRequest,
} from "~/types";
import apiClient from "./client";

export interface GetDishesParams {
  search?: string;
  page?: number;
  limit?: number;
}

export async function getDishes(
  params: GetDishesParams = {},
): Promise<PaginatedResponse<Dish>> {
  const response = await apiClient.get<PaginatedResponse<Dish>>("/dishes", {
    params: {
      search: params.search,
      page: params.page ?? 1,
      limit: params.limit ?? 20,
    },
  });
  return response.data;
}

export async function getDish(id: number): Promise<DishDetail> {
  const response = await apiClient.get<DishDetail>(`/dishes/${id}`);
  return response.data;
}

export async function createDish(
  data: CreateDishRequest,
): Promise<Dish> {
  const response = await apiClient.post<Dish>("/dishes", data);
  return response.data;
}

export async function updateDish(
  id: number,
  data: UpdateDishRequest,
): Promise<DishDetail> {
  const response = await apiClient.patch<DishDetail>(`/dishes/${id}`, data);
  return response.data;
}

export async function deleteDish(id: number): Promise<void> {
  await apiClient.delete(`/dishes/${id}`);
}
