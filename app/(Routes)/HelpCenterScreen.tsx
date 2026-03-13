import { listNotifications } from "@/src/api";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface HelpTopic {
  id: string;
  title: string;
  icon: any;
}

const iconByType: Record<string, any> = {
  low_stock: require("../../assets/images/image.png"),
  out_of_stock: require("../../assets/images/image 1776.png"),
  sale: require("../../assets/images/image 1776 (5).png"),
  product_added: require("../../assets/images/image 1776 (2).png"),
  expiry: require("../../assets/images/image 1776 (4).png"),
  general: require("../../assets/images/image 1776 (3).png"),
};

const HelpCenterScreen = () => {
  const [topics, setTopics] = useState<HelpTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    const loadTopics = async () => {
      try {
        const notifications = await listNotifications();
        const mappedTopics = notifications
          .map((item) => ({
            id: String(item.id),
            title: item.title || item.message || "Untitled",
            icon: iconByType[item.type || "general"] || iconByType.general,
          }))
          .filter(
            (item, index, self) =>
              index === self.findIndex((x) => x.title === item.title),
          );
        setTopics(mappedTopics);
      } catch (error) {
        console.error("Error loading help topics:", error);
        setTopics([]);
      } finally {
        setLoading(false);
      }
    };

    loadTopics();
  }, []);

  const filteredTopics = useMemo(() => {
    if (!searchText.trim()) return topics;
    return topics.filter((topic) =>
      topic.title.toLowerCase().includes(searchText.trim().toLowerCase()),
    );
  }, [searchText, topics]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push("./SettingsScreen")}>
            <Ionicons name="chevron-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Help Center</Text>
          <View /> {/* Spacer */}
        </View>

        {/* Search Bar */}
        <View style={styles.searchBarContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#777"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Topic"
            placeholderTextColor="#777"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        {/* Help Topics */}
        <View style={styles.topicsGrid}>
          {loading && (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="small" color="#24A19C" />
            </View>
          )}
          {!loading &&
            filteredTopics.map((topic) => (
              <TouchableOpacity
                key={topic.id}
                style={styles.topicCard}
                onPress={() => console.log(`Open ${topic.title}`)}
              >
                <View style={styles.topicIconContainer}>
                  <Image
                    source={topic.icon}
                    style={styles.topicIcon}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.topicTitle}>{topic.title}</Text>
              </TouchableOpacity>
            ))}
          {!loading && filteredTopics.length === 0 && (
            <Text style={styles.emptyText}>No topics available from API</Text>
          )}
        </View>

        {/* More Topics Button */}
        <TouchableOpacity
          style={styles.moreTopicsButton}
          onPress={() => console.log("More Topics")}
        >
          <Text style={styles.moreTopicsButtonText}>More Topics</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F9F9F9",
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    paddingTop: 30,
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    paddingVertical: 12,
  },
  topicsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  loadingWrap: {
    width: "100%",
    paddingVertical: 20,
    alignItems: "center",
  },
  emptyText: {
    width: "100%",
    textAlign: "center",
    color: "#777",
    paddingVertical: 20,
  },
  topicCard: {
    width: "48%", // Roughly two cards per row with some spacing
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  topicIconContainer: {
    backgroundColor: "#F0F0F0",
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  topicIcon: {
    width: 40,
    height: 40,
  },
  topicTitle: {
    fontSize: 14,
    color: "#333",
    textAlign: "center",
  },
  moreTopicsButton: {
    backgroundColor: "#24A19C",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  moreTopicsButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default HelpCenterScreen;
