import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";

import {
  Notification,
  Product,
  SalesSummaryItem,
  UserData,
} from "@/components/homeTypes";
import {
  ApiNotification,
  ApiProduct,
  ApiSale,
  ApiSaleItem,
  getDashboardOverview,
  getProfile,
  listNotifications,
  listSales,
  listUserInventory,
} from "@/src/api";
import type { ApiUserInventoryItem } from "@/src/api/products";

const isUserInventoryProduct = (
  product: ApiProduct | ApiUserInventoryItem,
): product is ApiUserInventoryItem => {
  return "units_in_stock" in product;
};

const mapApiProduct = (
  product: ApiProduct | ApiUserInventoryItem,
): Product => ({
  id: String(product.id),
  name: product.name,
  category: isUserInventoryProduct(product)
    ? product.category || ""
    : product.category_name || String(product.category || ""),
  barcode: product.barcode || "",
  image: isUserInventoryProduct(product)
    ? product.image_url
      ? { uri: product.image_url }
      : null
    : product.image
      ? { uri: product.image }
      : null,
  quantityType:
    product.quantity_type ||
    ("unit_type" in product ? product.unit_type || "" : "") ||
    "Single Items",
  unitsInStock:
    "units_in_stock" in product
      ? Number(product.units_in_stock || 0)
      : ((product as ApiProduct).quantity_left ??
        (product as ApiProduct).quantity),
  costPrice:
    "cost_price" in product
      ? Number(product.cost_price || 0)
      : Number((product as ApiProduct).buying_price || 0),
  sellingPrice: Number(product.selling_price || 0),
  lowStockThreshold: product.low_stock_threshold ?? 0,
  expiryDate: product.expiry_date || "",
  supplier: {
    name:
      product.supplier_name ||
      ("supplier_obj_name" in product ? product.supplier_obj_name || "" : ""),
    phone: product.supplier_phone || "",
  },
  dateAdded:
    ("created_at" in product ? product.created_at : undefined) ||
    ("added_at" in product ? product.added_at : undefined) ||
    ("updated_at" in product ? product.updated_at : undefined) ||
    new Date().toISOString(),
  userId: "api-user",
});

const toSalesSummary = (sales: ApiSale[]): SalesSummaryItem[] => {
  const summary: SalesSummaryItem[] = [];

  sales.forEach((sale) => {
    const items = Array.isArray(sale.items) ? sale.items : [];

    if (items.length === 0) {
      summary.push({
        id: String(sale.id),
        image: "",
        name: "Sale",
        quantity: 1,
        date: sale.sale_date || sale.created_at || new Date().toISOString(),
        amount: Number(sale.total_amount || 0),
        profit: Number(sale.total_profit || 0),
      });
      return;
    }

    items.forEach((item: ApiSaleItem, index: number) => {
      summary.push({
        id: `${sale.id}-${item.product ?? item.inventory ?? index}-${index}`,
        image: "",
        name: item.product_name || "Unknown Product",
        quantity: Number(item.quantity || 0),
        date: sale.sale_date || sale.created_at || new Date().toISOString(),
        amount: Number(item.subtotal || 0),
        profit: Number(item.profit || 0),
      });
    });
  });

  return summary.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
};

const getTimeAgo = (dateString?: string): string => {
  if (!dateString) return "Just now";
  const date = new Date(dateString).getTime();
  const diff = Math.max(0, Date.now() - date);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return "Just now";
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  return `${Math.floor(diff / day)}d ago`;
};

const DEFAULT_USER_DATA: UserData = {
  name: "",
  profileImage: "",
  todaySales: 0,
  profit: 0,
  transactions: 0,
  stockLeft: 0,
  salesSummary: [],
};

export const useHomeData = () => {
  const [inventory, setInventory] = useState<Product[]>([]);
  const [userData, setUserData] = useState<UserData>(DEFAULT_USER_DATA);

  const getNotificationActions = (
    type?: string,
    productId?: string,
  ): Notification["actions"] => {
    switch (type) {
      case "low_stock":
      case "out_of_stock":
        return [
          { label: "Tap to restock", type: "restock", productId },
          { label: "View product page", type: "view_product", productId },
        ];
      case "daily_summary":
        return [
          { label: "Tap to open Daily Sales Summary", type: "view_summary" },
        ];
      default:
        return [];
    }
  };

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["home-notifications", 0, 3],
    queryFn: async () => {
      const response = await listNotifications({ page: 0, page_size: 3 });
      return response.results.map((n: ApiNotification) => {
        const createdAt = n.created_at || new Date().toISOString();
        const status = (n.status || "New") as Notification["status"];
        const isRead =
          typeof n.is_read === "boolean"
            ? n.is_read
            : status.toLowerCase() === "read";

        return {
          id: String(n.id),
          type: (n.type as Notification["type"]) || "daily_summary",
          title: n.title,
          message: n.description || n.message || "",
          time: getTimeAgo(createdAt),
          isRead,
          productId: n.product ? String(n.product) : undefined,
          dateAdded: createdAt,
          actions: getNotificationActions(
            n.type,
            n.product ? String(n.product) : undefined,
          ),
          status,
          isNew: !isRead,
        };
      });
    },
    refetchInterval: 15000,
  });

  const loadHomeData = useCallback(async () => {
    const [profileResult, overviewResult, inventoryResult, salesResult] =
      await Promise.allSettled([
        getProfile(),
        getDashboardOverview(),
        listUserInventory({ page: 0, page_size: 50 }),
        listSales({ page: 0, page_size: 10 }),
      ]);

    const profile =
      profileResult.status === "fulfilled" ? profileResult.value : null;
    const overview =
      overviewResult.status === "fulfilled" ? overviewResult.value : null;
    const inventoryResponse =
      inventoryResult.status === "fulfilled" ? inventoryResult.value : null;
    const salesResponse =
      salesResult.status === "fulfilled" ? salesResult.value : [];

    const mappedProducts = (inventoryResponse?.results || []).map(
      mapApiProduct,
    );
    const salesSummary = toSalesSummary(salesResponse || []);

    setInventory(mappedProducts);
    setUserData((prev) => ({
      ...prev,
      name: profile?.name || profile?.phone || "User",
      profileImage: profile?.profile_image || "",
      todaySales: Number(overview?.today?.sales || 0),
      profit: Number(overview?.today?.profit || 0),
      transactions: Number(overview?.today?.transactions || 0),
      stockLeft: mappedProducts.reduce((sum: number, p: Product) => {
        return sum + (p.unitsInStock || 0);
      }, 0),
      salesSummary,
    }));
  }, []);

  const handleAddProduct = async (productData: Omit<Product, "id">) => {
    try {
      const newProductWithId: Product = {
        ...productData,
        id: `temp-${Date.now()}`,
      };
      setInventory((prev) => [...prev, newProductWithId]);
      setUserData((prev) => ({
        ...prev,
        stockLeft: prev.stockLeft + (productData.unitsInStock || 0),
      }));
      Alert.alert("Success", "Product added successfully!");
      await loadHomeData();
    } catch (error) {
      console.error("Error adding product:", error);
      Alert.alert("Error", "Failed to add product. Please try again.");
    }
  };

  useEffect(() => {
    loadHomeData();
    const interval = setInterval(loadHomeData, 15000);
    return () => clearInterval(interval);
  }, [loadHomeData]);

  return { inventory, notifications, userData, handleAddProduct, loadHomeData };
};
