import {
  SALE,
  SALES,
  SALES_DEBTORS,
  SALES_THIS_WEEK,
  SALES_TODAY,
} from "@/src/api/endpoints";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

// Types matching API contract
export interface SaleItem {
  id: number;
  product: { id: number; name: string; barcode?: string } | string;
  quantity: number;
  unit_price: number;
  cost_price?: number;
  product_name?: string;
}

export interface Sale {
  id: number;
  customer_name: string;
  customer_phone?: string;
  total_amount: number;
  amount_paid?: number;
  amount_due?: number;
  created_at: string;
  updated_at?: string;
  transaction_ref?: string;
  items: SaleItem[];
  is_fully_paid?: boolean;
}

export interface SalesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Sale[];
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
export function useSales(search?: string) {
  return useQuery<SalesResponse>({
    queryKey: ["sales", search],
    queryFn: async () => {
      const params = search ? { search } : {};
      const response = await axios.get(SALES, { params });
      console.log("Full response:", response);
      return response.data;
    },
  });
}

// Fetch sale detail
export function useSaleDetail(id: number | string) {
  return useQuery<Sale>({
    queryKey: ["sale", id],
    queryFn: async () => {
      const { data } = await axios.get(SALE(id));
      return data;
    },
    enabled: !!id,
  });
}

// Fetch today's sales
export function useSalesToday() {
  return useQuery<SalesResponse>({
    queryKey: ["sales-today"],
    queryFn: async () => {
      const { data } = await axios.get(SALES_TODAY);
      return data;
    },
  });
}

// Fetch this week's sales
export function useSalesThisWeek() {
  return useQuery<SalesResponse>({
    queryKey: ["sales-this-week"],
    queryFn: async () => {
      const { data } = await axios.get(SALES_THIS_WEEK);
      return data;
    },
  });
}

// Fetch all debtors
export function useDebtors() {
  return useQuery<DebtorsResponse>({
    queryKey: ["sales-debtors"],
    queryFn: async () => {
      const { data } = await axios.get(SALES_DEBTORS);
      return data;
    },
  });
}
