// app/utils/notificationHelpers.ts
import { addDoc, collection, getDocs, query, Timestamp, where } from "firebase/firestore";
import { db } from "./config/firebaseConfig";

// Helper to create notification
export const createNotification = async (
  userId: string,
  type: string,
  title: string,
  message: string,
  productId?: string
) => {
  try {
    await addDoc(collection(db, "notifications"), {
      userId,
      type,
      title,
      message,
      time: getTimeAgo(Date.now()),
      isRead: false,
      productId: productId || null,
      dateAdded: Date.now(),
      createdAt: Timestamp.now(),
    });
    console.log(`✅ Notification created: ${title}`);
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};

// Format time ago
const getTimeAgo = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}min ago`;
  if (hours < 24) return `${hours}hr ago`;
  return `${days}d ago`;
};

// Check and notify for low stock
export const checkLowStock = async (
  userId: string,
  productId: string,
  productName: string,
  unitsInStock: number,
  lowStockThreshold: number
) => {
  try {
    if (unitsInStock === 0) {
      await createNotification(
        userId,
        "out_of_stock",
        "Out of Stock Alert",
        `${productName} is out of stock!`,
        productId
      );
    } else if (unitsInStock <= lowStockThreshold) {
      await createNotification(
        userId,
        "low_stock",
        "Low Stock Alert",
        `${productName} is low (${unitsInStock} left)`,
        productId
      );
    }
  } catch (error) {
    console.error("Error checking low stock:", error);
  }
};

// Notify when product is added
export const notifyProductAdded = async (
  userId: string,
  productId: string,
  productName: string
) => {
  await createNotification(
    userId,
    "product_added",
    "Product Added",
    `${productName} has been added to inventory`,
    productId
  );
};

// Check for high-selling products
export const checkHighSelling = async (
  userId: string,
  productId: string,
  productName: string
) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const salesQuery = query(
      collection(db, "sales"),
      where("productId", "==", productId),
      where("userId", "==", userId)
    );

    const salesSnapshot = await getDocs(salesQuery);
    let totalSoldToday = 0;

    salesSnapshot.forEach((doc) => {
      const sale = doc.data();
      const saleDate = sale.createdAt?.toDate ? sale.createdAt.toDate() : new Date(sale.createdAt);
      if (saleDate >= today) {
        totalSoldToday += sale.quantity || 0;
      }
    });

    // If sold 20+ units today, create high-selling notification
    if (totalSoldToday >= 20) {
      await createNotification(
        userId,
        "high_selling",
        "High-Selling Item Alert",
        `${productName} sold ${totalSoldToday} units today! 🔥`,
        productId
      );
    }
  } catch (error) {
    console.error("Error checking high selling:", error);
  }
};

// Check for expiring products
export const checkExpiringProducts = async (userId: string) => {
  try {
    const productsQuery = query(
      collection(db, "products"),
      where("userId", "==", userId)
    );

    const productsSnapshot = await getDocs(productsQuery);
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    for (const productDoc of productsSnapshot.docs) {
      const product = productDoc.data();
      
      if (!product.expiryDate) continue;

      const expiryDate = new Date(product.expiryDate);

      if (expiryDate <= threeDaysFromNow && expiryDate > new Date()) {
        const daysLeft = Math.ceil(
          (expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );

        await createNotification(
          userId,
          "expiry",
          "Stock Expiry Alert",
          `${product.name} expires in ${daysLeft} days!`,
          productDoc.id
        );
      }
    }
  } catch (error) {
    console.error("Error checking expiring products:", error);
  }
};

// Generate daily summary
export const generateDailySummary = async (userId: string) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const salesQuery = query(
      collection(db, "sales"),
      where("userId", "==", userId)
    );

    const salesSnapshot = await getDocs(salesQuery);
    let totalProfit = 0;
    let totalSales = 0;
    let todayTransactions = 0;

    salesSnapshot.forEach((doc) => {
      const sale = doc.data();
      const saleDate = sale.createdAt?.toDate ? sale.createdAt.toDate() : new Date(sale.createdAt);
      if (saleDate >= today) {
        totalProfit += sale.profit || 0;
        totalSales += sale.amount || 0;
        todayTransactions++;
      }
    });

    if (todayTransactions > 0) {
      await createNotification(
        userId,
        "daily_summary",
        "Daily Summary Report",
        `You made ₦${totalProfit.toFixed(0)} in profit today.`
      );
    } else {
      await createNotification(
        userId,
        "zero_sales",
        "Zero Sales Alert",
        "No sales recorded today – check your..."
      );
    }
  } catch (error) {
    console.error("Error generating daily summary:", error);
  }
};

// Notify when sale is completed
export const notifySaleCompleted = async (
  userId: string,
  totalAmount: number,
  itemCount: number
) => {
  await createNotification(
    userId,
    "sale",
    "Sale Completed",
    `Successfully sold ${itemCount} items for ₦${totalAmount.toFixed(0)}`
  );
};