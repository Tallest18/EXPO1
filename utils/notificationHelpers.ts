import { createNotification, listProducts, listSales } from "@/src/api";

export const createAppNotification = async (
  type: string,
  title: string,
  message: string,
  productId?: string | number,
) => {
  try {
    await createNotification({
      type,
      title,
      message,
      product: productId ? Number(productId) : null,
    });
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};

export const checkLowStock = async (
  _userId: string,
  productId: string,
  productName: string,
  unitsInStock: number,
  lowStockThreshold: number,
) => {
  try {
    if (unitsInStock === 0) {
      await createAppNotification(
        "out_of_stock",
        "Out of Stock Alert",
        `${productName} is out of stock!`,
        productId,
      );
    } else if (unitsInStock <= lowStockThreshold) {
      await createAppNotification(
        "low_stock",
        "Low Stock Alert",
        `${productName} is low (${unitsInStock} left)`,
        productId,
      );
    }
  } catch (error) {
    console.error("Error checking low stock:", error);
  }
};

export const notifyProductAdded = async (
  _userId: string,
  productId: string,
  productName: string,
) => {
  await createAppNotification(
    "product_added",
    "Product Added",
    `${productName} has been added to inventory`,
    productId,
  );
};

export const checkHighSelling = async (
  _userId: string,
  productId: string,
  productName: string,
) => {
  try {
    const sales = await listSales();
    const productIdNum = Number(productId);
    const totalSold = sales.reduce((acc, sale) => {
      const qty = sale.items
        .filter((item) => item.product === productIdNum)
        .reduce((sum, item) => sum + Number(item.quantity || 0), 0);
      return acc + qty;
    }, 0);

    if (totalSold >= 20) {
      await createAppNotification(
        "high_selling",
        "High-Selling Item Alert",
        `${productName} sold ${totalSold} units today!`,
        productId,
      );
    }
  } catch (error) {
    console.error("Error checking high selling:", error);
  }
};

export const checkExpiringProducts = async (_userId: string) => {
  try {
    const products = await listProducts();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    for (const product of products) {
      if (!product.expiry_date) continue;
      const expiryDate = new Date(product.expiry_date);
      if (expiryDate <= threeDaysFromNow && expiryDate > new Date()) {
        const daysLeft = Math.ceil(
          (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
        );
        await createAppNotification(
          "expiry",
          "Stock Expiry Alert",
          `${product.name} expires in ${daysLeft} days!`,
          product.id,
        );
      }
    }
  } catch (error) {
    console.error("Error checking expiring products:", error);
  }
};

export const notifySaleCompleted = async (
  _userId: string,
  totalAmount: number,
  itemCount: number,
) => {
  await createAppNotification(
    "sale",
    "Sale Completed",
    `Successfully sold ${itemCount} items for ₦${totalAmount.toFixed(0)}`,
  );
};
