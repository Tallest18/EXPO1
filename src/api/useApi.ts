// src/api/useApi.ts

import {
    QueryKey,
    useMutation,
    UseMutationOptions,
    useQuery,
    UseQueryOptions,
} from "@tanstack/react-query";
import { apiClient } from "./client";

// Generic GET query hook
export function useApiQuery<T = any>(
  key: QueryKey,
  endpoint: string,
  options?: UseQueryOptions<T>,
) {
  return useQuery<T>({
    queryKey: key,
    queryFn: async () => {
      const response = await apiClient.get<T>(endpoint);
      return response.data ?? response;
    },
    ...options,
  });
}

// Generic mutation hook (POST, PUT, PATCH, DELETE)
export function useApiMutation<T = any, TVariables = any>(
  method: "post" | "put" | "patch" | "delete",
  endpoint: string,
  options?: UseMutationOptions<T, unknown, TVariables>,
) {
  return useMutation<T, unknown, TVariables>({
    mutationFn: async (variables: TVariables) => {
      // For delete, variables can be params or body
      if (method === "delete") {
        const response = await apiClient.delete<T>(endpoint, {
          data: variables,
        });
        return response.data ?? response;
      }
      const response = await apiClient[method]<T>(endpoint, variables);
      return response.data ?? response;
    },
    ...options,
  });
}

// Usage Example:
// const { data, isLoading } = useApiQuery(['products'], PRODUCTS_ITEMS);
// const mutation = useApiMutation('post', PRODUCTS_ITEMS);
