import { apiClient } from "./client";

export interface ApiProduct {
  id: number;
  name: string;
  code?: string;
  barcode?: string | null;
  description?: string | null;
  category?: number;
  category_name?: string;
  supplier?: number;
  supplier_obj_name?: string;
  buying_price: string;
  selling_price: string;
  profit_per_unit?: string;
  quantity: number;
  quantity_sold?: number;
  quantity_left?: number;
  quantity_type?: string;
  low_stock_threshold?: number;
  supplier_name?: string | null;
  supplier_phone?: string | null;
  date_arrived?: string | null;
  expiry_date?: string | null;
  image?: string | null;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProductPayload {
  name: string;
  category: number;
  supplier: number;
  buying_price: string;
  selling_price: string;
  quantity: number;
  quantity_type?: string;
  low_stock_threshold?: number;
  barcode?: string;
  description?: string;
  date_arrived?: string;
  expiry_date?: string;
  supplier_name?: string;
  supplier_phone?: string;
}

export async function listProducts(params?: {
  search?: string;
  filter?: "inStock" | "outOfStock" | "expiring";
}): Promise<ApiProduct[]> {
  const response = await apiClient.get<ApiProduct[]>("/products/items/", {
    params,
  });
  return response.data;
}

export async function getProduct(id: string | number): Promise<ApiProduct> {
  const response = await apiClient.get<ApiProduct>(`/products/items/${id}/`);
  return response.data;
}

export async function createProduct(
  payload: ProductPayload,
): Promise<ApiProduct> {
  const response = await apiClient.post<ApiProduct>(
    "/products/items/",
    payload,
  );
  return response.data;
}

export async function createProductWithImage(
  payload: ProductPayload,
  imageUri?: string | null,
): Promise<ApiProduct> {
  if (!imageUri) {
    return createProduct(payload);
  }

  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  });

  if (imageUri.startsWith("http")) {
    formData.append("image", imageUri);
  } else {
    formData.append("image", {
      uri: imageUri,
      name: `product-${Date.now()}.jpg`,
      type: "image/jpeg",
    } as any);
  }

  const response = await apiClient.post<ApiProduct>(
    "/products/items/",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  return response.data;
}

export async function updateProduct(
  id: string | number,
  payload: Partial<ProductPayload>,
): Promise<ApiProduct> {
  const response = await apiClient.patch<ApiProduct>(
    `/products/items/${id}/`,
    payload,
  );
  return response.data;
}

export async function updateProductWithImage(
  id: string | number,
  payload: Partial<ProductPayload>,
  imageUri?: string | null,
): Promise<ApiProduct> {
  if (!imageUri) {
    return updateProduct(id, payload);
  }

  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  });

  if (imageUri.startsWith("http")) {
    formData.append("image", imageUri);
  } else {
    formData.append("image", {
      uri: imageUri,
      name: `product-${Date.now()}.jpg`,
      type: "image/jpeg",
    } as any);
  }

  const response = await apiClient.patch<ApiProduct>(
    `/products/items/${id}/`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  return response.data;
}

export async function deleteProduct(id: string | number): Promise<void> {
  await apiClient.delete(`/products/items/${id}/`);
}

export async function listCategories(): Promise<
  Array<{ id: number; name: string; description?: string | null }>
> {
  const response = await apiClient.get<
    Array<{ id: number; name: string; description?: string | null }>
  >("/products/categories/");
  return response.data;
}

export async function listSuppliers(): Promise<
  Array<{ id: number; name: string; phone?: string | null }>
> {
  const response = await apiClient.get<
    Array<{ id: number; name: string; phone?: string | null }>
  >("/products/suppliers/");
  return response.data;
}
