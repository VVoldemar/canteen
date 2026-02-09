import type {
  LoginRequest,
  RegisterRequest,
  TokenResponse,
  User,
} from "~/types";
import apiClient, {
  getRefreshToken,
  removeTokens,
  setTokens,
} from "./client";
import { ApiException } from "./errors";

export async function login(data: LoginRequest): Promise<TokenResponse> {
  const response = await apiClient.post<TokenResponse>("/auth/login", data);
  setTokens(response.data);
  return response.data;
}

export async function register(
  data: RegisterRequest,
): Promise<TokenResponse> {
  const response = await apiClient.post<TokenResponse>("/auth/register", data);
  setTokens(response.data);
  return response.data;
}

export async function logout(): Promise<void> {
  try {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      await apiClient.post("/auth/logout", { refresh_token: refreshToken });
    }
  } finally {
    removeTokens();
  }
}

export async function refreshSession(): Promise<TokenResponse> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new ApiException(401, {
      message: "Сессия истекла. Войдите снова.",
    });
  }

  const response = await apiClient.post<TokenResponse>("/auth/refresh_token", {
    refresh_token: refreshToken,
  });
  setTokens(response.data);
  return response.data;
}

export async function getCurrentUser(): Promise<User> {
  const response = await apiClient.get<User>("/users/me");
  const user = response.data;

  if (typeof user.banned === "boolean" && user.is_banned === undefined) {
    user.is_banned = user.banned;
  }

  try {
    const allergiesResponse = await apiClient.get("/users/me/allergies");
    user.allergies = allergiesResponse.data || [];
  } catch {
    user.allergies = [];
  }

  return user;
}
