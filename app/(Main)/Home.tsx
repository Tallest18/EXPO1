import React, { useContext } from "react";
import { Alert, FlatList, SafeAreaView } from "react-native";

import HomeHeader from "@/components/HomeHeader";
import NotificationFeed from "@/components/NotificationFeed";
import SalesSummary from "@/components/SalesSummary";
import StatCards from "@/components/StatCards";
import { homeStyles as styles, verticalScale } from "@/components/homeStyles";
import { AddProductContext } from "@/context/AddProductContext";
import { useHomeData } from "@/hooks/useHomeData";
import { getUserInventoryItem } from "@/src/api";
import ActionButtons from "../../components/ActionButtons";

const Home = () => {
  const { openAddProduct, openRestockProduct } = useContext(AddProductContext);
  const { inventory, notifications, userData } = useHomeData();

  const toAddProductModel = (item: any) => ({
    id: String(item.id),
    name: item.name || "",
    category: item.category || "",
    barcode: item.barcode || "",
    image: item.image_url ? { uri: item.image_url } : null,
    quantityType: item.quantity_type || item.unit_type || "Single Items",
    unitsInStock: Number(item.units_in_stock || 0),
    costPrice: Number(item.cost_price || 0),
    sellingPrice: Number(item.selling_price || 0),
    lowStockThreshold: Number(item.low_stock_threshold || 0),
    expiryDate: item.expiry_date || "",
    supplier: {
      name: item.supplier_name || "",
      phone: item.supplier_phone || "",
    },
    dateAdded: item.added_at || item.updated_at || new Date().toISOString(),
    userId: "api-user",
  });

  const handleRestockById = async (productId: string) => {
    try {
      const found = inventory.find((p) => String(p.id) === String(productId));
      if (found) {
        openRestockProduct(found);
        return;
      }

      const item = await getUserInventoryItem(productId);
      openRestockProduct(toAddProductModel(item));
    } catch (error) {
      console.error("Failed to load restock product:", error);
      Alert.alert(
        "Product not found",
        "This product could not be loaded for restock.",
      );
    }
  };

  const renderHeader = () => (
    <>
      <HomeHeader name={userData.name} profileImage={userData.profileImage} />
      <StatCards
        todaySales={userData.todaySales}
        profit={userData.profit}
        transactions={userData.transactions}
        stockLeft={userData.stockLeft}
        dailyPercentageIncrease={userData.dailyPercentageIncrease}
      />
      <ActionButtons onAddProduct={openAddProduct} />
      <SalesSummary salesSummary={userData.salesSummary} />
    </>
  );

  const renderFooter = () => (
    <NotificationFeed
      notifications={notifications}
      inventory={inventory}
      onRestockProduct={openRestockProduct}
      onRestockById={handleRestockById}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={[]}
        keyExtractor={() => "main-list"}
        renderItem={null}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        contentContainerStyle={{ paddingBottom: verticalScale(40) }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

export default Home;
