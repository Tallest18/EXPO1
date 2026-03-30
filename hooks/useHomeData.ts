import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";

import {
  ApiProduct,
  ApiSale,
  ApiSaleItem,
  getDashboardOverview,
  getProfile,
  listNotifications,
  listProducts,
  listSales,
} from "@/src/api";
import { Notification, Product, SalesSummaryItem, UserData } from "@/components/home/homeTypes";

const mapApiProduct = (product: ApiProduct): Product => ({
  id: String(product.id),
  name: product.name,
  category: product.category_name || "",
  barcode: product.barcode || "",
  image: product.image ? { uri: product.image } : null,
  quantityType: product.quantity_type || "Single Items",
  unitsInStock: product.quantity_left ?? product.quantity,
  costPrice: Number(product.buying_price || 0),
  sellingPrice: Number(product.selling_price || 0),
  lowStockThreshold: product.low_stock_threshold ?? 0,
  expiryDate: product.expiry_date || "",
  supplier: {
    name: product.supplier_name || product.supplier_obj_name || "",
    phone: product.supplier_phone || "",
  },
  dateAdded: product.created_at || new Date().toISOString(),
  userId: "api-user",
});

const toSalesSummary = (sales: ApiSale[]): SalesSummaryItem[] => {
  const summary: SalesSummaryItem[] = [];

  sales.forEach((sale) => {
    const items = Array.isArray(sale.items) ? sale.items : [];
    items.forEach((item: ApiSaleItem, index: number) => {
      summary.push({
        id: `${sale.id}-${item.product}-${index}`,
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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userData, setUserData] = useState<UserData>(DEFAULT_USER_DATA);

  const loadHomeData = useCallback(async () => {
    try {
      const [profile, overview, productsResponse, salesResponse, notificationsRes] =
        await Promise.all([
          getProfile(),
          getDashboardOverview(),
          listProducts(),
          listSales(),
          listNotifications(),
        ]);

      const mappedProducts = productsResponse.map(mapApiProduct);
      const salesSummary = toSalesSummary(salesResponse);
      const mappedNotifications: Notification[] = notificationsRes.map((n) => ({
        id: String(n.id),
        type: (n.type as Notification["type"]) || "daily_summary",
        title: n.title,
        message: n.message,
        time: getTimeAgo(n.created_at),
        isRead: n.is_read,
        productId: n.product ? String(n.product) : undefined,
        dateAdded: n.created_at ? new Date(n.created_at).getTime() : Date.now(),
      }));

      setInventory(mappedProducts);
      setNotifications(mappedNotifications);
      setUserData((prev) => ({
        ...prev,
        name: profile?.name || profile?.phone || "User",
        profileImage: profile?.profile_image || "",
        todaySales: Number(overview.today?.sales || 0),
        profit: Number(overview.today?.profit || 0),
        transactions: Number(overview.today?.transactions || 0),
        stockLeft: mappedProducts.reduce((sum, p) => sum + (p.unitsInStock || 0), 0),
        salesSummary,
      }));
    } catch (error) {
      console.error("Error loading home data:", error);
    }
  }, []);

  const handleAddProduct = async (productData: Omit<Product, "id">) => {
    try {
      const newProductWithId: Product = { ...productData, id: `temp-${Date.now()}` };
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
