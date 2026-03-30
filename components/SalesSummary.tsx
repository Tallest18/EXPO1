import { Feather } from "@expo/vector-icons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import React from "react";
import { FlatList, Image, Text, TouchableOpacity, View } from "react-native";

import {
  formatCurrency,
  moderateScale,
  homeStyles as styles,
} from "./homeStyles";
import { SalesSummaryItem } from "./homeTypes";

interface SalesSummaryProps {
  salesSummary: SalesSummaryItem[];
}

const formatSalesDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Recent";
  }
};

const SalesSummary: React.FC<SalesSummaryProps> = ({ salesSummary }) => {
  const router = useRouter();
  console.log("SalesSummary rendered with data:", salesSummary);

  return (
    <View style={styles.salesSummarySection}>
      <View style={styles.salesSummaryHeader}>
        <View style={styles.salesSummaryHeaderLeft}>
          <View style={styles.dollarIconCircle}>
            <Feather name="dollar-sign" size={moderateScale(20)} color="#000" />
          </View>
          <View style={styles.salesSummaryHeaderTextContainer}>
            <Text style={styles.salesSummaryHeaderTitle}>Sales Summary</Text>
            <Text style={styles.salesSummaryHeaderSubtitle}>
              Items sold are captured here
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.arrowIconCircle}
          onPress={() =>
            router.push({
              pathname: "/(Main)/Sell" as any,
              params: { tab: "history" },
            })
          }
          activeOpacity={0.7}
        >
          <Feather
            name="arrow-up-right"
            size={moderateScale(20)}
            color="#fff"
          />
        </TouchableOpacity>
      </View>

      <FlatList
        data={salesSummary.slice(0, 3)}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.salesSummaryCard}
            onPress={() =>
              router.push({
                pathname: "/(Routes)/SalesDetailScreen" as any,
                params: { sale: JSON.stringify(item) },
              })
            }
            activeOpacity={0.7}
          >
            <View style={styles.productImageContainer}>
              {item.image ? (
                <Image
                  source={{ uri: item.image }}
                  style={styles.productThumbnail}
                />
              ) : (
                <View style={styles.productPlaceholder}>
                  <Feather
                    name="package"
                    size={moderateScale(20)}
                    color="#666"
                  />
                </View>
              )}
            </View>

            <View style={styles.salesSummaryContent}>
              <Text style={styles.salesSummaryProductName} numberOfLines={1}>
                {item.name}{" "}
                <Text
                  style={{
                    color: "#FFBA00",
                    display: "flex",
                    alignItems: "center",
                    textAlign: "center",
                  }}
                >
                  <MaterialIcons name="close" size={12} color="#FFBA00" />{" "}
                  {item.quantity || ""}
                </Text>
              </Text>
              <Text style={styles.salesSummaryDate}>
                {formatSalesDate(item.date)}
              </Text>
            </View>

            <View style={styles.salesSummaryRight}>
              <Text
                style={styles.salesSummaryAmount}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {formatCurrency(item.amount)}
              </Text>
              <Text style={styles.salesSummaryLabel}>Cost</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No sales recorded yet</Text>
        }
        scrollEnabled={false}
      />
    </View>
  );
};

export default SalesSummary;
