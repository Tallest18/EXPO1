import { apiClient } from "./client";

export interface ApiExpense {
  id: number;
  category: string;
  description?: string | null;
  amount: string;
  date: string;
  created_at?: string;
}

export async function listExpenses(): Promise<ApiExpense[]> {
  const response = await apiClient.get<ApiExpense[]>("/products/expenses/");
  return response.data;
}
