import React, { useContext } from "react";
import { FlatList, SafeAreaView } from "react-native";

import HomeHeader from "@/components/HomeHeader";
import NotificationFeed from "@/components/NotificationFeed";
import SalesSummary from "@/components/SalesSummary";
import StatCards from "@/components/StatCards";
import { homeStyles as styles, verticalScale } from "@/components/homeStyles";
import { AddProductContext } from "@/context/AddProductContext";
import { useHomeData } from "@/hooks/useHomeData";
import ActionButtons from "../../components/ActionButtons";

const Home = () => {
  const { openAddProduct } = useContext(AddProductContext);
  const { inventory, notifications, userData } = useHomeData();

  const renderHeader = () => (
    <>
      <HomeHeader name={userData.name} profileImage={userData.profileImage} />
      <StatCards
        todaySales={userData.todaySales}
        profit={userData.profit}
        transactions={userData.transactions}
        stockLeft={userData.stockLeft}
      />
      <ActionButtons onAddProduct={openAddProduct} />
      <SalesSummary salesSummary={userData.salesSummary} />
    </>
  );

  const renderFooter = () => <NotificationFeed notifications={notifications} />;

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
