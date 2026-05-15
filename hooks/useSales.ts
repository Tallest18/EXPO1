import { apiClient } from "@/src/api/client";
import {
    SALES_DEBTORS,
    SALES_THIS_WEEK,
    SALES_TODAY
} from "@/src/api/endpoints";
import {
    getSale,
    listSalesPaginated,
    type PaginatedResponse,
    type ApiSale as Sale,
} from "@/src/api/sales";
import { useQuery } from "@tanstack/react-query";

const normalizeEndpoint = (endpoint: string) =>
  endpoint.startsWith("/api/") ? endpoint.replace(/^\/api/, "") : endpoint;

export type SalesResponse = PaginatedResponse<Sale>;

export interface SalesQueryParams {
  search?: string;
  page?: number;
  page_size?: number;
}

export interface Debtor {
  id: number;
  customer_name: string;
  customer_phone?: string;
  amount_owed: number;
  due_date?: string;
  transaction_ref?: string;
}

export interface DebtorsResponse {
  count: number;
  results: Debtor[];
}

// Fetch all sales
export function useSales(params?: SalesQueryParams) {
  return useQuery<SalesResponse>({
    queryKey: [
      "sales",
      params?.search ?? "",
      params?.page ?? 0,
      params?.page_size ?? 10,
    ],
    queryFn: async () => {
      return listSalesPaginated(params);
    },
  });
}

// Fetch sale detail
export function useSaleDetail(id: number | string) {
  return useQuery<Sale>({
    queryKey: ["sale", id],
    queryFn: async () => getSale(id),
    enabled: !!id,
  });
}

// Fetch today's sales
export function useSalesToday() {
  return useQuery<SalesResponse>({
    queryKey: ["sales-today"],
    queryFn: async () => {
      const { data } = await apiClient.get<SalesResponse>(
        normalizeEndpoint(SALES_TODAY),
      );
      return data;
    },
  });
}

// Fetch this week's sales
export function useSalesThisWeek() {
  return useQuery<SalesResponse>({
    queryKey: ["sales-this-week"],
    queryFn: async () => {
      const { data } = await apiClient.get<SalesResponse>(
        normalizeEndpoint(SALES_THIS_WEEK),
      );
      return data;
    },
  });
}

// Fetch all debtors
export function useDebtors() {
  return useQuery<DebtorsResponse>({
    queryKey: ["sales-debtors"],
    queryFn: async () => {
      const { data } = await apiClient.get<DebtorsResponse>(
        normalizeEndpoint(SALES_DEBTORS),
      );
      return data;
    },
  });
}
