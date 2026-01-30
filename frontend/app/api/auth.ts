import type { LoginRequest, RegisterRequest, TokenResponse, User } from "~/types";
import apiClient, { setToken, removeToken } from "./client";

export async function login(data: LoginRequest): Promise<TokenResponse> {
    const response = await apiClient.post<TokenResponse>("/auth/login", data);
    setToken(response.data.access_token);
    return response.data;
}

export async function register(data: RegisterRequest): Promise<User> {
    const response = await apiClient.post<User>("/auth/register", data);
    return response.data;    
}

export async function logout(): Promise<void> {
    try {
        await apiClient.post("auth/logout");
    } finally {
        removeToken();
    }
}

export async function getCurrentUser(): Promise<User> {
    const response = await apiClient.get<User>("/users/me");
    return response.data;
}