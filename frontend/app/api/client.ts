import axios, { type AxiosInstance, type AxiosError } from "axios";
import { ApiException, getApiErrorMessage } from "./errors";
import type { ApiError } from "./errors";
import type { TokenResponse } from "~/types";

const API_BASE_URL = "http://localhost:8000";

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

const isBrowser = () => typeof window !== "undefined";

export const getToken = (): string | null => {
  if (!isBrowser()) return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const setToken = (token: string): void => {
  if (!isBrowser()) return;
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
};

export const getRefreshToken = (): string | null => {
  if (!isBrowser()) return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const setRefreshToken = (token: string): void => {
  if (!isBrowser()) return;
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
};

export const setTokens = (tokens: TokenResponse): void => {
  setToken(tokens.access_token);
  setRefreshToken(tokens.refresh_token);
};

export const removeTokens = (): void => {
  if (!isBrowser()) return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

export const removeToken = (): void => {
  removeTokens();
};

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const shouldSkipAuthRefresh = (url?: string) => {
  if (!url) return false;
  const authPaths = [
    "/auth/login",
    "/auth/register",
    "/auth/refresh_token",
  ];
  return authPaths.some((path) => url.includes(path));
};

const refreshAccessToken = async (): Promise<TokenResponse> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new ApiException(401, {
      message: "Сессия истекла. Войдите снова.",
    });
  }

  const response = await axios.post<TokenResponse>(
    `${API_BASE_URL}/auth/refresh_token`,
    { refresh_token: refreshToken },
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  return response.data;
};

let refreshPromise: Promise<TokenResponse> | null = null;

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const status = error.response?.status ?? 0;
    const originalRequest = error.config as
      | (typeof error.config & { _retry?: boolean })
      | undefined;

    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !shouldSkipAuthRefresh(originalRequest.url)
    ) {
      originalRequest._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = refreshAccessToken();
        }

        const tokens = await refreshPromise;
        setTokens(tokens);
        refreshPromise = null;

        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${tokens.access_token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        refreshPromise = null;
        removeTokens();

        if (refreshError instanceof ApiException) {
          throw refreshError;
        }

        const message =
          refreshError instanceof Error
            ? refreshError.message
            : "Сессия истекла. Войдите снова.";

        throw new ApiException(401, { message });
      }
    }

    if (status === 401) {
      removeTokens();
    }

    const errorData = error.response?.data;
    const message =
      getApiErrorMessage(errorData) ||
      error.message ||
      "Неизвестная ошибка";

    throw new ApiException(status || 500, {
      message,
      detail: errorData,
    });
  },
);

export default apiClient;
