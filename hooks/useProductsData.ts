import { apiClient } from "@/src/api/client";
import * as endpoints from "@/src/api/endpoints";
import {
    createProduct,
    ProductPayload,
    updateProduct,
} from "@/src/api/products";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useProductsData(search?: string) {
  const queryClient = useQueryClient();
  // Product categories
  const { data: categories, isLoading: loadingCategories } = useQuery({
    queryKey: ["product-categories"],
    queryFn: async () =>
      (await apiClient.get(endpoints.PRODUCTS_CATEGORIES)).data,
  });

  // All products (optionally filtered by search)
  const { data: products, isLoading: loadingProducts } = useQuery({
    queryKey: ["products", search],
    queryFn: async () => {
      const params = search ? { search } : {};
      return (await apiClient.get(endpoints.PRODUCTS_ITEMS, { params })).data;
    },
  });

  // User inventory (optionally filtered by search)
  const { data: userInventory, isLoading: loadingInventory } = useQuery({
    queryKey: ["user-inventory", search],
    queryFn: async () => {
      const params = search ? { search } : {};
      return (
        await apiClient.get(endpoints.PRODUCTS_USER_INVENTORY, { params })
      ).data;
    },
  });

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: async (payload: ProductPayload) => {
      return createProduct(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  // Patch product mutation
  const patchProductMutation = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: number | string;
      payload: Partial<ProductPayload>;
    }) => {
      return updateProduct(id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  // Delete user inventory mutation
  const deleteUserInventoryMutation = useMutation({
    mutationFn: async (id: number | string) => {
      await apiClient.delete(`${endpoints.PRODUCTS_USER_INVENTORY}/${id}/`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-inventory"] });
    },
  });

  // Patch user inventory mutation
  const patchUserInventoryMutation = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: number | string;
      payload: any;
    }) => {
      const { data } = await apiClient.patch(
        `${endpoints.PRODUCTS_USER_INVENTORY}/${id}/`,
        payload,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-inventory"] });
    },
  });

  // Add to user inventory mutation
  const addToUserInventoryMutation = useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await apiClient.post(
        endpoints.PRODUCTS_USER_INVENTORY,
        payload,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-inventory"] });
    },
  });

  const dataLoading = loadingCategories || loadingProducts || loadingInventory;

  return {
    dataLoading,
    categories,
    products,
    userInventory,
    createProductMutation,
    patchProductMutation,
    deleteUserInventoryMutation,
    patchUserInventoryMutation,
    addToUserInventoryMutation,
  };
}
