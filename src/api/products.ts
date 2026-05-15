import { apiClient } from "./client";
import {
    PRODUCTS_ITEM,
    PRODUCTS_ITEMS,
    PRODUCTS_USER_INVENTORY,
    PRODUCTS_USER_INVENTORY_ITEM,
} from "./endpoints";

const normalizeEndpoint = (endpoint: string) =>
  endpoint.startsWith("/api/") ? endpoint.replace(/^\/api/, "") : endpoint;

type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

const toResultArray = <T>(data: PaginatedResponse<T> | T[]): T[] =>
  Array.isArray(data) ? data : data.results;

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

export interface ApiUserInventoryItem {
  id: number;
  product_id?: string;
  name: string;
  category: string;
  barcode?: string | null;
  units_in_stock: number;
  unit_type?: string;
  quantity_type?: string;
  cost_price: string;
  selling_price: string;
  low_stock_threshold?: number;
  expiry_date?: string | null;
  supplier_name?: string | null;
  supplier_phone?: string | null;
  image_url?: string | null;
  added_at?: string;
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
  page?: number;
  page_size?: number;
  category?: number;
}): Promise<ApiProduct[]> {
  const response = await apiClient.get<
    PaginatedResponse<ApiProduct> | ApiProduct[]
  >(normalizeEndpoint(PRODUCTS_ITEMS), {
    params,
  });
  return toResultArray(response.data);
}

export async function listUserInventory(params?: {
  search?: string;
  filter?: "inStock" | "outOfStock" | "expiring";
  page?: number;
  page_size?: number;
  category?: number;
}): Promise<PaginatedResponse<ApiUserInventoryItem>> {
  const response = await apiClient.get<
    PaginatedResponse<ApiUserInventoryItem> | ApiUserInventoryItem[]
  >(normalizeEndpoint(PRODUCTS_USER_INVENTORY), {
    params,
  });

  if (Array.isArray(response.data)) {
    return {
      count: response.data.length,
      next: null,
      previous: null,
      results: response.data,
    };
  }

  return response.data;
}

export async function getProduct(id: string | number): Promise<ApiProduct> {
  const response = await apiClient.get<ApiProduct>(
    normalizeEndpoint(PRODUCTS_ITEM(id)),
  );
  return response.data;
}

export async function createProduct(
  payload: ProductPayload,
): Promise<ApiProduct> {
  const response = await apiClient.post<ApiProduct>(
    normalizeEndpoint(PRODUCTS_ITEMS),
    payload,
  );
  return response.data;
}

export async function createProductWithImage(
  payload: ProductPayload,
  imageObj?: { uri: string; type?: string; fileName?: string } | null,
): Promise<ApiProduct> {
  if (!imageObj || !imageObj.uri) {
    return createProduct(payload);
  }

  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  });

  // Debug: log the image object before appending
  console.log("Uploading image object:", imageObj);
  formData.append("image", {
    uri: imageObj.uri,
    name: imageObj.fileName || `product-${Date.now()}.jpg`,
    type: imageObj.type || "image/jpeg",
  } as any);

  const response = await apiClient.post<ApiProduct>(
    normalizeEndpoint(PRODUCTS_ITEMS),
    formData,
    {
      headers: { "Content-Type": undefined },
      transformRequest: [(data: any) => data],
    },
  );
  return response.data;
}

export async function updateProduct(
  id: string | number,
  payload: Partial<ProductPayload>,
): Promise<ApiProduct> {
  const response = await apiClient.patch<ApiProduct>(
    normalizeEndpoint(PRODUCTS_USER_INVENTORY_ITEM(id)),
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
    normalizeEndpoint(PRODUCTS_USER_INVENTORY_ITEM(id)),
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  return response.data;
}

export async function deleteProduct(id: string | number): Promise<void> {
  await apiClient.delete(normalizeEndpoint(PRODUCTS_ITEM(id)));
}

// Support both array and paginated object responses
type Category = { id: number; name: string; description?: string | null };
type Supplier = { id: number; name: string; phone?: string | null };
type Paginated<T> = { results: T[] };

export async function listCategories(): Promise<
  Category[] | Paginated<Category>
> {
  const response = await apiClient.get("/products/categories/");
  return response.data;
}

export async function listSuppliers(): Promise<
  Supplier[] | Paginated<Supplier>
> {
  const response = await apiClient.get("/products/suppliers/");
  return response.data;
}
