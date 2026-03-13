import axios, {
    AxiosError,
    AxiosHeaders,
    InternalAxiosRequestConfig,
} from "axios";

import { API_BASE_URL, API_PREFIX } from "./constants";
import {
    clearTokens,
    getAccessToken,
    getRefreshToken,
    saveTokens,
} from "./tokenStorage";
import type { RefreshTokenResponse } from "./types";

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}${API_PREFIX}`,
  headers: {
    "Content-Type": "application/json",
  },
});

const refreshClient = axios.create({
  baseURL: `${API_BASE_URL}${API_PREFIX}`,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(async (config) => {
  const accessToken = await getAccessToken();

  if (accessToken) {
    const headers =
      config.headers instanceof AxiosHeaders
        ? config.headers
        : new AxiosHeaders(config.headers);

    headers.set("Authorization", `Bearer ${accessToken}`);
    config.headers = headers;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (
      !originalRequest ||
      error.response?.status !== 401 ||
      originalRequest._retry
    ) {
      return Promise.reject(error);
    }

    if ((originalRequest.url || "").includes("/token/refresh/")) {
      await clearTokens();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const refreshToken = await getRefreshToken();

      if (!refreshToken) {
        await clearTokens();
        return Promise.reject(error);
      }

      const response = await refreshClient.post<RefreshTokenResponse>(
        "/token/refresh/",
        {
          refresh: refreshToken,
        },
      );

      await saveTokens(response.data.access, response.data.refresh);

      const headers =
        originalRequest.headers instanceof AxiosHeaders
          ? originalRequest.headers
          : new AxiosHeaders(originalRequest.headers);
      headers.set("Authorization", `Bearer ${response.data.access}`);
      originalRequest.headers = headers;

      return apiClient(originalRequest);
    } catch (refreshError) {
      await clearTokens();
      return Promise.reject(refreshError);
    }
  },
);
