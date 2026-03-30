import { Product } from "@/hooks/useAddProductForm";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    Image,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const { width } = Dimensions.get("window");
const isSmall = width < 360;

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
}

const SearchProductModal: React.FC<Props> = ({
  visible,
  onClose,
  onSelectProduct,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [recentSearches] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      // TODO: wire up your actual search API here
      setSearchResults([]);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClose = () => {
    setSearchQuery("");
    setSearchResults([]);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Search Product</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchInputContainer}>
          <Ionicons
            name="search-outline"
            size={20}
            color="#999"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for anything"
            value={searchQuery}
            onChangeText={handleSearch}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery("");
                setSearchResults([]);
              }}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView style={styles.content}>
          {searchQuery.length === 0 && recentSearches.length > 0 && (
            <View style={styles.recentSection}>
              <Text style={styles.recentHeader}>Recent</Text>
              {recentSearches.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.recentItem}
                  onPress={() => handleSearch(item)}
                >
                  <Ionicons name="search-outline" size={18} color="#666" />
                  <Text style={styles.recentText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {searchQuery.length > 0 && (
            <View style={styles.resultsSection}>
              <Text style={styles.resultsHeader}>
                Showing results for &quot;
                <Text style={styles.queryText}>{searchQuery}</Text>&quot;
              </Text>

              {isSearching ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#1155CC" />
                </View>
              ) : searchResults.length > 0 ? (
                searchResults.map((product) => (
                  <TouchableOpacity
                    key={product.id}
                    style={styles.resultItem}
                    onPress={() => onSelectProduct(product)}
                  >
                    {product.image?.uri ? (
                      <Image
                        source={{ uri: product.image.uri }}
                        style={styles.resultImage}
                      />
                    ) : (
                      <View style={styles.resultImagePlaceholder}>
                        <Ionicons name="image-outline" size={24} color="#999" />
                      </View>
                    )}
                    <View style={styles.resultInfo}>
                      <Text style={styles.resultName}>{product.name}</Text>
                      <Text style={styles.resultAction}>Add Product</Text>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.noResultsContainer}>
                  <Text style={styles.noResultsText}>
                    No products found for &quot;{searchQuery}&quot;
                  </Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7FAFC",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: isSmall ? 14 : 20,
    paddingVertical: 14,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerTitle: {
    fontSize: isSmall ? 15 : 17,
    color: "#1A202C",
    fontFamily: "DMSans_600SemiBold",
  },
  closeButton: {
    padding: 4,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    marginHorizontal: isSmall ? 10 : 16,
    marginVertical: 12,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: isSmall ? 13 : 14,
    color: "#2D3748",
    fontFamily: "DMSans_400Regular",
  },
  clearButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  recentSection: {
    backgroundColor: "#FFF",
    paddingVertical: 8,
  },
  recentHeader: {
    fontSize: 11,
    color: "#1155CC",
    paddingHorizontal: 20,
    paddingVertical: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontFamily: "DMSans_600SemiBold",
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F7FAFC",
  },
  recentText: {
    fontSize: isSmall ? 12 : 13,
    color: "#2D3748",
    marginLeft: 10,
    fontFamily: "DMSans_400Regular",
  },
  resultsSection: {
    flex: 1,
  },
  resultsHeader: {
    fontSize: isSmall ? 11 : 12,
    color: "#718096",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#F7FAFC",
    fontFamily: "DMSans_400Regular",
  },
  queryText: {
    color: "#1155CC",
    fontFamily: "DMSans_600SemiBold",
  },
  loadingContainer: {
    padding: 36,
    alignItems: "center",
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingHorizontal: isSmall ? 14 : 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F7FAFC",
  },
  resultImage: {
    width: 46,
    height: 46,
    borderRadius: 6,
    marginRight: 12,
  },
  resultImagePlaceholder: {
    width: 46,
    height: 46,
    borderRadius: 6,
    backgroundColor: "#EDF2F7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  resultInfo: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resultName: {
    fontSize: isSmall ? 12 : 13,
    color: "#2D3748",
    flex: 1,
    fontFamily: "DMSans_500Medium",
  },
  resultAction: {
    fontSize: isSmall ? 11 : 12,
    color: "#1155CC",
    fontFamily: "DMSans_500Medium",
  },
  noResultsContainer: {
    padding: 36,
    alignItems: "center",
  },
  noResultsText: {
    fontSize: isSmall ? 12 : 13,
    color: "#718096",
    textAlign: "center",
    fontFamily: "DMSans_400Regular",
  },
});

export default SearchProductModal;
