import type {
  User,
  UpdateUserRequest,
  AddAllergyRequest,
  Ingredient,
} from "~/types";
import apiClient from "./client";

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
