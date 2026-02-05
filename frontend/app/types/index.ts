export type OrderStatus = "paid" | "served" | "cancelled";

export type Measure = "Kg" | "L";

export type UserRole = "student" | "cook" | "admin";

export interface User {
  id: number;
  name: string;
  surname: string;
  patronymic?: string;
  role: UserRole;
  email?: string;
  registered_at?: string;
  banned?: boolean;
  subscription_start?: string | null;
  subscription_days?: number | null;
  balance?: number;
  is_banned?: boolean;
  allergies?: Ingredient[];
}

export interface UpdateUserRequest {
  name?: string;
  surname?: string;
  patronymic?: string;
  password?: string;
}

export interface AdminUpdateUserRequest {
  role?: UserRole;
  banned?: boolean;
}

export interface AddAllergyRequest {
  ingredient_id: number;
}

export interface Ingredient {
  id: number;
  name: string;
  price: number;
  measure: Measure;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  surname: string;
  patronymic?: string;
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}
