import axios, { type AxiosInstance, AxiosError } from "axios";
import { ApiException } from "./errors";
import type { ApiError } from "./errors";

const API_BASE_URL = "http://localhost:8000/";
const TOKEN_KEY = "access_token";

export const getToken = (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
}

export const setToken = (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token)
}

export const removeToken = (): void => {
    localStorage.removeItem(TOKEN_KEY);
}


const apiClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

apiClient.interceptors.request.use((config) => {
    const token = getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
})

apiClient.interceptors.response.use(
    response => response,
    (error: AxiosError<ApiError>) => {
        if (error.response?.status === 401) {
            removeToken();
        }

        throw new ApiException(
            error.response?.status || 500,
            error.response?.data || { 
                code: "UNKNOWN_ERROR", 
                message: "Неизвестная ошибка" 
            }
        )
    }
)

export default apiClient;