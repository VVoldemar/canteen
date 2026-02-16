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
  const limit = Math.min(params.limit ?? 20, 100);
  const response = await apiClient.get<PaginatedResponse<Dish>>("/dishes", {
    params: {
      search: params.search,
      page: params.page ?? 1,
      limit,
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
  image?: File,
): Promise<Dish> {
  const formData = new FormData();
  formData.append("dish_data", JSON.stringify(data));
  if (image) {
    formData.append("image", image);
  }
  const response = await apiClient.post<Dish>("/dishes", formData);
  return response.data;
}

export async function updateDish(
  id: number,
  data: UpdateDishRequest,
  image?: File,
): Promise<DishDetail> {
  const formData = new FormData();
  formData.append("dish_data", JSON.stringify(data));
  if (image) {
    formData.append("image", image);
  }
  const response = await apiClient.patch<DishDetail>(`/dishes/${id}`, formData);
  return response.data;
}

export async function deleteDish(id: number): Promise<void> {
  await apiClient.delete(`/dishes/${id}`);
}
