import { apiClient } from "./client";
import { SALE, SALES, SALE_RECORD_PAYMENT } from "./endpoints";

const normalizeEndpoint = (endpoint: string) =>
  endpoint.startsWith("/api/") ? endpoint.replace(/^\/api/, "") : endpoint;

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiSaleItem {
  id?: number;
  inventory?: number;
  product?: number;
  product_name?: string;
  product_code?: string;
  category_name?: string;
  quantity: number;
  unit_price?: string | number;
  cost_price?: string | number;
  subtotal?: string | number;
  profit?: string | number;
  product_image?: string | null;
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
  total_amount?: string | number;
  total_profit?: string | number;
  sold_by?: number;
  sold_by_name?: string;
  success_message?: string;
  transaction_ref?: string;
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

const normalizeSales = (sales: ApiSale[]): ApiSale[] =>
  sales.map((sale) => ({
    ...sale,
    items: (sale.items || []).map((item) => {
      const resolvedProduct = item.product ?? item.inventory;
      return {
        ...item,
        product: resolvedProduct,
      };
    }),
  }));

export async function listSalesPaginated(params?: {
  search?: string;
  page?: number;
  page_size?: number;
}): Promise<PaginatedResponse<ApiSale>> {
  const response = await apiClient.get<PaginatedResponse<ApiSale> | ApiSale[]>(
    normalizeEndpoint(SALES),
    { params },
  );

  if (Array.isArray(response.data)) {
    const results = normalizeSales(response.data);
    return {
      count: results.length,
      next: null,
      previous: null,
      results,
    };
  }

  return {
    ...response.data,
    results: normalizeSales(response.data.results || []),
  };
}

export async function listSales(params?: {
  search?: string;
  page?: number;
  page_size?: number;
}): Promise<ApiSale[]> {
  const response = await listSalesPaginated(params);
  return response.results;
}

export async function getSale(id: string | number): Promise<ApiSale> {
  const response = await apiClient.get<ApiSale>(normalizeEndpoint(SALE(id)));
  return response.data;
}

export async function createSale(payload: CreateSalePayload): Promise<ApiSale> {
  const response = await apiClient.post<ApiSale>(
    normalizeEndpoint(SALES),
    payload,
  );
  return response.data;
}

export async function deleteSale(id: string | number): Promise<void> {
  await apiClient.delete(normalizeEndpoint(SALE(id)));
}

export async function recordSalePayment(
  id: string | number,
  amount: number,
): Promise<ApiSale> {
  const response = await apiClient.patch<ApiSale>(
    normalizeEndpoint(SALE_RECORD_PAYMENT(id)),
    { amount },
  );
  return response.data;
}
