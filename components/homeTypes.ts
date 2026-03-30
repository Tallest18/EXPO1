export interface Notification {
  id: string;
  type:
    | "low_stock"
    | "out_of_stock"
    | "high_selling"
    | "zero_sales"
    | "daily_summary"
    | "weekly_summary"
    | "expense"
    | "expiry"
    | "backup"
    | "app_update"
    | "sale"
    | "product_added";
  title: string;
  actions?: string;
  message: string;
  status: "New" | "Read" | "Archived";
  time: string;
  isNew: boolean;
  isRead: boolean;
  productId?: string;
  dateAdded: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  barcode: string;
  image?: {
    uri: string;
    type?: string;
    fileName?: string;
    fileSize?: number;
  } | null;
  quantityType: string;
  unitsInStock: number;
  costPrice: number;
  sellingPrice: number;
  lowStockThreshold: number;
  expiryDate: string;
  supplier: {
    name: string;
    phone: string;
  };
  dateAdded: string;
  userId: string;
}

export interface SalesSummaryItem {
  id: string;
  image?: string;
  name: string;
  quantity: number;
  date: string;
  amount: number;
  profit: number;
}

export interface UserData {
  name: string;
  profileImage: string;
  todaySales: number;
  profit: number;
  transactions: number;
  stockLeft: number;
  salesSummary: SalesSummaryItem[];
}
