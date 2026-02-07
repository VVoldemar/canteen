import type {
  AdminUpdateUserRequest,
  PaginatedResponse,
  User,
  UpdateUserRequest,
  AddAllergyRequest,
  Ingredient,
  UserRole,
} from "~/types";
import apiClient from "./client";

export interface GetUsersParams {
  page?: number;
  limit?: number;
  role?: UserRole;
}

export async function getUsers(
  params: GetUsersParams = {},
): Promise<PaginatedResponse<User>> {
  const response = await apiClient.get<PaginatedResponse<User>>("/users", {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      role: params.role,
    },
  });
  return response.data;
}

export async function getUser(userId: number): Promise<User> {
  const response = await apiClient.get<User>(`/users/${userId}`);
  return response.data;
}

export async function updateUserAdmin(
  userId: number,
  data: AdminUpdateUserRequest,
): Promise<User> {
  const response = await apiClient.patch<User>(`/users/${userId}`, data);
  return response.data;
}

export async function updateProfile(data: UpdateUserRequest): Promise<User> {
  const response = await apiClient.patch<User>("/users/me", data);
  return response.data;
}

export async function getAllergies(): Promise<Ingredient[]> {
  const response = await apiClient.get<Ingredient[]>("/users/me/allergies");
  return response.data;
}

export async function addAllergy(data: AddAllergyRequest): Promise<Ingredient> {
  const response = await apiClient.post<Ingredient>(
    "/users/me/allergies",
    data,
  );
  return response.data;
}

export async function removeAllergy(ingredientId: number): Promise<void> {
  await apiClient.delete("/users/me/allergies", {
    params: { ingredient_id: ingredientId },
  });
}
