// src/api/endpoints.ts

// AUTH
export const AUTH_LOGOUT = "/api/auth/logout/";
export const AUTH_PROFILE = "/auth/profile/";
export const AUTH_REGISTER = "/api/auth/register/";
export const AUTH_REQUEST_OTP = "/api/auth/request-otp/";
export const AUTH_RESEND_OTP = "/api/auth/resend-otp/";
export const AUTH_VERIFY_OTP = "/api/auth/verify-otp/";
export const AUTH_TOKEN = "/api/token/";
export const AUTH_TOKEN_REFRESH = "/api/token/refresh/";

// PRODUCTS
export const PRODUCTS_CATEGORIES = "/products/categories/";
export const PRODUCTS_CATEGORY = (id: string | number) =>
  `/api/products/categories/${id}/`;
export const PRODUCTS_FINANCE_DAILY_SUMMARY = "/products/finance/daily-summary";
export const PRODUCTS_FINANCE_MONTHLY_REPORT =
  "/products/finance/monthly-report";
export const PRODUCTS_FINANCE_SEASONAL_INSIGHTS =
  "/products/finance/seasonal-insights";
export const PRODUCTS_FINANCE_SLOW_MOVING_STOCK =
  "/products/finance/slow-moving-stock";
export const PRODUCTS_FINANCE_STOCK_RECOMMENDATIONS =
  "/products/finance/stock-recommendations";
export const PRODUCTS_FINANCE_SUMMARY = "/products/finance/summary";
export const PRODUCTS_FINANCE_TOP_PRODUCTS = "/products/finance/top-products";
export const PRODUCTS_FINANCE_TRENDS = "/products/finance/trends";
export const PRODUCTS_ITEMS = "/products/items/";
export const PRODUCTS_ITEM = (id: string | number) =>
  `/api/products/items/${id}/`;
export const PRODUCTS_ITEMS_EXPIRING = "/api/products/items/expiring/";
export const PRODUCTS_ITEMS_LOW_STOCK = "/api/products/items/low_stock/";
export const PRODUCTS_ITEMS_OUT_OF_STOCK = "/api/products/items/out_of_stock/";
export const PRODUCTS_SUPPLIERS = "/api/products/suppliers/";
export const PRODUCTS_SUPPLIER = (id: string | number) =>
  `/api/products/suppliers/${id}/`;
export const PRODUCTS_USER_INVENTORY = "/products/user-inventory/";
export const PRODUCTS_USER_INVENTORY_ITEM = (id: string | number) =>
  `/api/products/user-inventory/${id}/`;
export const PRODUCTS_USER_INVENTORY_ADD = "/api/products/user-inventory/add/";

// SALES
export const SALES = "/api/products/sales/";
export const SALE = (id: string | number) => `/api/products/sales/${id}/`;
export const SALE_RECORD_PAYMENT = (id: string | number) =>
  `/api/products/sales/${id}/record_payment/`;
export const SALES_DEBTORS = "/api/products/sales/debtors/";
export const SALES_THIS_WEEK = "/api/products/sales/this_week/";
export const SALES_TODAY = "/api/products/sales/today/";

// RESTOCKS
export const RESTOCKS = "/api/products/restocks/";
export const RESTOCK = (id: string | number) => `/api/products/restocks/${id}/`;
export const RESTOCK_BY_PRODUCT = (id: string | number) =>
  `/api/products/restocks/${id}/by_product/`;
export const RESTOCKS_RECENT = "/api/products/restocks/recent/";

// NOTIFICATIONS
export const NOTIFICATIONS = "/api/products/notifications/";
export const NOTIFICATION = (id: string | number) =>
  `/api/products/notifications/${id}/`;
export const NOTIFICATION_MARK_READ = (id: string | number) =>
  `/api/products/notifications/${id}/mark_read/`;
export const NOTIFICATIONS_MARK_ALL_READ =
  "/api/products/notifications/mark_all_read/";
export const NOTIFICATIONS_UNREAD_COUNT =
  "/api/products/notifications/unread_count/";

// ANALYTICS
export const ANALYTICS_FINANCIAL_SUMMARY =
  "/api/products/analytics/financial-summary/";
export const ANALYTICS_REVENUE_TREND = "/api/products/analytics/revenue-trend/";
export const ANALYTICS_SLOW_MOVING = "/api/products/analytics/slow-moving/";
export const ANALYTICS_TOP_PRODUCTS = "/api/products/analytics/top-products/";

// DASHBOARD
export const DASHBOARD_OVERVIEW = "/api/products/dashboard/overview/";
