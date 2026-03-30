import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Text, View } from "react-native";

import { formatCurrency, homeStyles as styles } from "./homeStyles";

interface StatCardsProps {
  todaySales: number;
  profit: number;
  transactions: number;
  stockLeft: number;
}

const StatCards: React.FC<StatCardsProps> = ({
  todaySales,
  profit,
  transactions,
  stockLeft,
}) => {
  return (
    <>
      {/* Today Sales Box with Gradient */}
      <LinearGradient
        colors={["#3167c4", "#1155CC"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.salesBox}
      >
        <View style={styles.salesTop}>
          <Text style={styles.salesLabel}>Today Sales</Text>
          <Text style={styles.salesRate}>+6.5%</Text>
        </View>
        <Text style={styles.salesAmount} numberOfLines={1} adjustsFontSizeToFit>
          {formatCurrency(todaySales)}
        </Text>
        <View style={styles.profitRow}>
          <Text style={styles.profitLabel}>Profit</Text>
          <Text style={styles.profitAmount} numberOfLines={1}>
            {formatCurrency(profit)}
          </Text>
        </View>
      </LinearGradient>

      {/* Transactions & Stock Row */}
      <View style={styles.row}>
        <View style={styles.infoBox}>
          <View style={styles.transactionRow}>
            <Text style={styles.infoLabel}>Transactions</Text>
            <Text style={styles.salesRate}>+6.5%</Text>
          </View>
          <Text style={styles.infoValue}>{transactions}</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Stock Left</Text>
          <Text style={styles.infoValue} numberOfLines={1} adjustsFontSizeToFit>
            {stockLeft} Items
          </Text>
        </View>
      </View>
    </>
  );
};

export default StatCards;
