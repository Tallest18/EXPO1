import { apiClient } from "./client";

export interface ApiSaleItem {
  id?: number;
  product: number;
  product_name?: string;
  product_code?: string;
  quantity: number;
  unit_price?: string;
  cost_price?: string;
  subtotal?: string;
  profit?: string;
}

export interface ApiSale {
  id: number;
  sale_date?: string;
  payment_method: string;
  notes?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  amount_owed?: string | null;
  amount_paid?: string | null;
  total_amount?: string;
  total_profit?: string;
  items: ApiSaleItem[];
  created_at?: string;
}

export interface CreateSalePayload {
  payment_method: string;
  notes?: string;
  customer_name?: string;
  customer_phone?: string;
  amount_owed?: string;
  amount_paid?: string;
  items: Array<{
    product: number;
    quantity: number;
  }>;
}

export async function listSales(): Promise<ApiSale[]> {
  const response = await apiClient.get<ApiSale[]>("/products/sales/");
  return response.data;
}

export async function getSale(id: string | number): Promise<ApiSale> {
  const response = await apiClient.get<ApiSale>(`/products/sales/${id}/`);
  return response.data;
}

export async function createSale(payload: CreateSalePayload): Promise<ApiSale> {
  const response = await apiClient.post<ApiSale>("/products/sales/", payload);
  return response.data;
}

export async function deleteSale(id: string | number): Promise<void> {
  await apiClient.delete(`/products/sales/${id}/`);
}

export async function recordSalePayment(
  id: string | number,
  amount: number,
): Promise<ApiSale> {
  const response = await apiClient.patch<ApiSale>(
    `/products/sales/${id}/record_payment/`,
    {
      amount,
    },
  );
  return response.data;
}
