import type {
  CreateMenuRequest,
  Menu,
  MenuDetail,
  UpdateMenuRequest,
} from "~/types";
import apiClient from "./client";

export async function getMenus(): Promise<Menu[]> {
  const response = await apiClient.get<Menu[]>("/menu");
  return response.data;
}

export async function getMenu(id: number): Promise<MenuDetail> {
  const response = await apiClient.get<MenuDetail>(`/menu/${id}`);
  return response.data;
}

export async function createMenu(data: CreateMenuRequest): Promise<Menu> {
  const response = await apiClient.post<Menu>("/menu", data);
  return response.data;
}

export async function updateMenu(
  id: number,
  data: UpdateMenuRequest,
): Promise<MenuDetail> {
  const response = await apiClient.patch<MenuDetail>(`/menu/${id}`, data);
  return response.data;
}

export async function deleteMenu(id: number): Promise<void> {
  await apiClient.delete(`/menu/${id}`);
}
