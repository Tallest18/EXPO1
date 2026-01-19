import { Ionicons } from "@expo/vector-icons";
import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  PermissionsAndroid,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Asset,
  ImagePickerResponse,
  launchCamera,
  launchImageLibrary,
  MediaType,
} from "react-native-image-picker";
import { auth, db, storage } from "../config/firebaseConfig";
import {
  checkExpiringProducts,
  checkLowStock,
  notifyProductAdded,
} from "../notificationHelpers";

const { width } = Dimensions.get("window");

const CATEGORIES = [
  "Foodstuffs",
  "Soft Drinks",
  "Beverages",
  "Noodles & Pasta",
  "Snacks & Biscuits",
];

interface Product {
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

interface AddProductFlowProps {
  visible: boolean;
  onClose: () => void;
  onSaveProduct: (productData: Product) => void;
}

interface FormData {
  productName: string;
  sku: string;
  category: string;
  productImage: {
    uri: string;
    type?: string;
    fileName?: string;
  } | null;
  quantityType: string;
  numberOfItems: string;
  costPrice: string;
  sellingPrice: string;
  lowStockThreshold: string;
  expiryDate: {
    day: string;
    month: string;
    year: string;
  };
  supplier: {
    name: string;
    phone: string;
  };
  unitsPerCarton: string;
  numberOfCartons: string;
  costPricePerCarton: string;
  sellingPricePerCarton: string;
  sellingPricePerUnit: string;
}

interface ImageAsset {
  uri: string;
  type?: string;
  fileName?: string;
  fileSize?: number;
  width?: number;
  height?: number;
}

const AddProductFlow: React.FC<AddProductFlowProps> = ({
  visible,
  onClose,
  onSaveProduct,
}) => {
  const [showInitialChoice, setShowInitialChoice] = useState(true);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [recentSearches] = useState<string[]>([
    "Indomitable",
    "Viva Soup",
    "Eva",
    "Shortbread Biscuit",
    "Flora Biscuit",
    "Bic Razor",
  ]);
  const [isSearching, setIsSearching] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    productName: "",
    sku: "",
    category: "",
    productImage: null,
    quantityType: "Single Items",
    numberOfItems: "",
    costPrice: "",
    sellingPrice: "",
    lowStockThreshold: "",
    expiryDate: {
      day: "",
      month: "",
      year: "",
    },
    supplier: {
      name: "",
      phone: "",
    },
    unitsPerCarton: "",
    numberOfCartons: "",
    costPricePerCarton: "",
    sellingPricePerCarton: "",
    sellingPricePerUnit: "",
  });

  const steps = ["Product Info", "Pricing & Packaging", "Stock & Extras"];

  const currentUser = auth.currentUser;

  useEffect(() => {
    if (visible) {
      setShowInitialChoice(true);
      setShowSearchModal(false);
      setSearchQuery("");
      setSearchResults([]);
      setShowCategoryDropdown(false);
    }
  }, [visible]);

  const handleSearch = async (searchText: string) => {
    if (!searchText.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);

    try {
      const productsRef = collection(db, "products");
      const q = query(productsRef, where("userId", "==", currentUser?.uid));

      const querySnapshot = await getDocs(q);
      const results: Product[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (
          data.name?.toLowerCase().includes(searchText.toLowerCase()) ||
          data.barcode?.includes(searchText)
        ) {
          results.push({
            id: doc.id,
            name: data.name,
            category: data.category,
            barcode: data.barcode,
            image: data.image,
            quantityType: data.quantityType,
            unitsInStock: data.unitsInStock,
            costPrice: data.costPrice,
            sellingPrice: data.sellingPrice,
            lowStockThreshold: data.lowStockThreshold,
            expiryDate: data.expiryDate,
            supplier: data.supplier,
            dateAdded: data.dateAdded,
            userId: data.userId,
          } as Product);
        }
      });

      setSearchResults(results);
    } catch (error) {
      console.error("Search error:", error);
      Alert.alert("Error", "Failed to search products");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectProduct = (product: Product) => {
    setFormData({
      productName: product.name,
      sku: product.barcode,
      category: product.category,
      productImage: product.image || null,
      quantityType: product.quantityType,
      numberOfItems: product.unitsInStock.toString(),
      costPrice: product.costPrice.toString(),
      sellingPrice: product.sellingPrice.toString(),
      lowStockThreshold: product.lowStockThreshold.toString(),
      expiryDate: {
        day: product.expiryDate.split("/")[1] || "",
        month: product.expiryDate.split("/")[0] || "",
        year: product.expiryDate.split("/")[2] || "",
      },
      supplier: product.supplier,
      unitsPerCarton: "",
      numberOfCartons: "",
      costPricePerCarton: "",
      sellingPricePerCarton: "",
      sellingPricePerUnit: "",
    });

    setShowSearchModal(false);
    setShowInitialChoice(false);
    setCurrentStep(0);
  };

  const handleAddManually = () => {
    setShowInitialChoice(false);
    setCurrentStep(0);
  };

  const handleSearchClick = () => {
    setShowInitialChoice(false);
    setShowSearchModal(true);
  };

  const updateFormData = (field: string, value: string | ImageAsset | null) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof FormData] as any),
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const uploadImage = async (uri: string): Promise<string> => {
    setImageUploading(true);
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const user = auth.currentUser;
      if (!user) {
        throw new Error("User not authenticated.");
      }
      const fileRef = ref(storage, `product_images/${user.uid}/${Date.now()}`);
      await uploadBytes(fileRef, blob);
      const downloadURL = await getDownloadURL(fileRef);
      return downloadURL;
    } catch (error) {
      console.error("Image upload error:", error);
      Alert.alert("Error", "Failed to upload image.");
      throw error;
    } finally {
      setImageUploading(false);
    }
  };

  const handlePickImage = async (useCamera: boolean) => {
    if (Platform.OS === "android") {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: "Camera Permission",
          message: "The app needs camera access to take pictures.",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK",
        },
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert(
          "Permission Denied",
          "You need to grant camera permission to use this feature.",
        );
        return;
      }
    }

    const options = {
      mediaType: "photo" as MediaType,
      includeBase64: false,
    };

    try {
      let response: ImagePickerResponse;
      if (useCamera) {
        response = await launchCamera(options);
      } else {
        response = await launchImageLibrary(options);
      }

      if (response.didCancel) {
        console.log("User cancelled image picker");
      } else if (response.errorCode) {
        console.log("Image picker error: ", response.errorCode);
        Alert.alert(
          "Error",
          response.errorMessage || "An unknown error occurred.",
        );
      } else if (response.assets && response.assets.length > 0) {
        const asset: Asset = response.assets[0];
        if (asset.uri) {
          updateFormData("productImage", {
            uri: asset.uri,
            type: asset.type,
            fileName: asset.fileName,
          });
        }
      }
    } catch (error) {
      console.log("Caught an unexpected error:", error);
      Alert.alert(
        "Unexpected Error",
        "An unexpected error occurred while picking an image.",
      );
    }
  };

  const nextStep = () => {
    if (currentStep === 0) {
      if (!formData.productName || !formData.category) {
        Alert.alert(
          "Missing Information",
          "Please fill in all required fields for Product Info.",
        );
        return;
      }
    } else if (currentStep === 1) {
      if (formData.quantityType === "Single Items") {
        if (
          !formData.numberOfItems ||
          !formData.costPrice ||
          !formData.sellingPrice
        ) {
          Alert.alert(
            "Missing Information",
            "Please fill in all required fields for Pricing & Packaging.",
          );
          return;
        }
      } else if (formData.quantityType === "Carton") {
        if (
          !formData.unitsPerCarton ||
          !formData.numberOfCartons ||
          !formData.costPricePerCarton ||
          !formData.sellingPricePerCarton
        ) {
          Alert.alert(
            "Missing Information",
            "Please fill in all required fields for Carton packaging.",
          );
          return;
        }
      } else if (formData.quantityType === "Both") {
        if (
          !formData.unitsPerCarton ||
          !formData.numberOfCartons ||
          !formData.costPricePerCarton ||
          !formData.sellingPricePerCarton ||
          !formData.sellingPricePerUnit
        ) {
          Alert.alert(
            "Missing Information",
            "Please fill in all required fields for Both packaging types.",
          );
          return;
        }
      }
    }

    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    } else {
      setCurrentStep(3);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const resetForm = () => {
    setCurrentStep(0);
    setShowInitialChoice(true);
    setShowSearchModal(false);
    setSearchQuery("");
    setSearchResults([]);
    setShowCategoryDropdown(false);
    setFormData({
      productName: "",
      sku: "",
      category: "",
      productImage: null,
      quantityType: "Single Items",
      numberOfItems: "",
      costPrice: "",
      sellingPrice: "",
      lowStockThreshold: "",
      expiryDate: { day: "", month: "", year: "" },
      supplier: { name: "", phone: "" },
      unitsPerCarton: "",
      numberOfCartons: "",
      costPricePerCarton: "",
      sellingPricePerCarton: "",
      sellingPricePerUnit: "",
    });
  };

  const handleSaveProduct = async () => {
    if (!currentUser) {
      Alert.alert("Authentication Error", "Please log in to add products.");
      return;
    }

    if (saving) {
      return;
    }

    setSaving(true);

    try {
      let imageUrl = null;
      if (formData.productImage) {
        imageUrl = await uploadImage(formData.productImage.uri);
      }

      let unitsInStock = 0;
      let finalCostPrice = 0;
      let finalSellingPrice = 0;

      if (formData.quantityType === "Single Items") {
        unitsInStock = parseInt(formData.numberOfItems) || 0;
        finalCostPrice = parseFloat(formData.costPrice) || 0;
        finalSellingPrice = parseFloat(formData.sellingPrice) || 0;
      } else if (formData.quantityType === "Carton") {
        const unitsPerCarton = parseInt(formData.unitsPerCarton) || 0;
        const numberOfCartons = parseInt(formData.numberOfCartons) || 0;
        unitsInStock = unitsPerCarton * numberOfCartons;
        finalCostPrice = parseFloat(formData.costPricePerCarton) || 0;
        finalSellingPrice = parseFloat(formData.sellingPricePerCarton) || 0;
      } else if (formData.quantityType === "Both") {
        const unitsPerCarton = parseInt(formData.unitsPerCarton) || 0;
        const numberOfCartons = parseInt(formData.numberOfCartons) || 0;
        unitsInStock = unitsPerCarton * numberOfCartons;
        finalCostPrice = parseFloat(formData.costPricePerCarton) || 0;
        finalSellingPrice = parseFloat(formData.sellingPricePerUnit) || 0;
      }

      const productData = {
        name: formData.productName || "Untitled Product",
        category: formData.category || "Foodstuffs",
        barcode: formData.sku || "",
        image: imageUrl ? { uri: imageUrl } : null,
        quantityType: formData.quantityType || "Single Items",
        unitsInStock: unitsInStock,
        costPrice: finalCostPrice,
        sellingPrice: finalSellingPrice,
        lowStockThreshold: parseInt(formData.lowStockThreshold) || 10,
        expiryDate:
          formData.expiryDate.month && formData.expiryDate.year
            ? `${formData.expiryDate.month}/${
                formData.expiryDate.day || "01"
              }/${formData.expiryDate.year}`
            : "12/01/2025",
        supplier: {
          name: formData.supplier.name || "Gideon Otuedor",
          phone: formData.supplier.phone || "+234 123 4567 890",
        },
        dateAdded: new Date().toISOString(),
        userId: currentUser.uid,
      };

      const docRef = await addDoc(collection(db, "products"), productData);

      const savedProduct: Product = {
        id: docRef.id,
        ...productData,
      } as Product;

      await notifyProductAdded(currentUser.uid, docRef.id, productData.name);
      await checkLowStock(
        currentUser.uid,
        docRef.id,
        productData.name,
        productData.unitsInStock,
        productData.lowStockThreshold,
      );
      await checkExpiringProducts(currentUser.uid);

      onSaveProduct(savedProduct);
      onClose();
      resetForm();
    } catch (error) {
      console.error("Error adding product:", error);
      Alert.alert(
        "Error",
        "Failed to add product. Please check your connection and try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      {steps.map((step, index) => (
        <View key={index} style={styles.stepItem}>
          <Text
            style={[
              styles.stepText,
              index <= currentStep
                ? styles.stepTextActive
                : styles.stepTextInactive,
            ]}
          >
            {step}
          </Text>
          <View
            style={[
              styles.progressBar,
              index <= currentStep
                ? styles.progressBarActive
                : styles.progressBarInactive,
            ]}
          />
        </View>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      {/* Card 1: Product Name and Category */}
      <View style={styles.card}>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            Product Name <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Type here..."
            placeholderTextColor="#CBD5E0"
            value={formData.productName}
            onChangeText={(value) => updateFormData("productName", value)}
          />
        </View>

        <View style={[styles.fieldGroup, { marginBottom: 0 }]}>
          <Text style={styles.label}>
            Product Category <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
          >
            <Text
              style={
                formData.category
                  ? styles.dropdownText
                  : styles.dropdownPlaceholder
              }
            >
              {formData.category || "Category"}
            </Text>
            <Ionicons
              name={showCategoryDropdown ? "chevron-up" : "chevron-down"}
              size={18}
              color="#718096"
            />
          </TouchableOpacity>

          {showCategoryDropdown && (
            <View style={styles.dropdownMenu}>
              {CATEGORIES.map((category, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.dropdownItem}
                  onPress={() => {
                    updateFormData("category", category);
                    setShowCategoryDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{category}</Text>
                  {formData.category === category && (
                    <Ionicons name="checkmark" size={18} color="#1155CC" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Card 2: Upload Product Image and Search Online */}
      <View style={styles.card}>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            Upload Product Image <Text style={styles.required}>*</Text>
          </Text>

          {formData.productImage ? (
            <View style={styles.uploadedImageWrapper}>
              <Image
                source={{ uri: formData.productImage.uri }}
                style={styles.uploadedImage}
              />
              <View style={styles.imageButtonsRow}>
                <TouchableOpacity
                  style={styles.imageBtnOutline}
                  onPress={() => handlePickImage(true)}
                >
                  <Text style={styles.imageBtnOutlineText}>Take Picture</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.imageBtnOutline}
                  onPress={() => handlePickImage(false)}
                >
                  <Text style={styles.imageBtnOutlineText}>
                    Select from gallery
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.imageUploadBox}>
              <View style={styles.imageIconCircle}>
                <Ionicons name="cloud-upload" size={40} color="#1155CC" />
              </View>
              <Text style={styles.imageUploadTitle}>
                Click to upload or select
              </Text>

              <View style={styles.imageButtonsRow}>
                <TouchableOpacity
                  style={styles.imageBtnOutline}
                  onPress={() => handlePickImage(true)}
                  disabled={imageUploading}
                >
                  <Text style={styles.imageBtnOutlineText}>Take Picture</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.imageBtnOutline}
                  onPress={() => handlePickImage(false)}
                  disabled={imageUploading}
                >
                  <Text style={styles.imageBtnOutlineText}>
                    Select from gallery
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.imageUploadInfo}>
                Files Supported: PNG, JPG, SVG.{"\n"}Maximum Size 1MB
              </Text>

              {imageUploading && (
                <ActivityIndicator
                  size="small"
                  color="#1155CC"
                  style={{ marginTop: 8 }}
                />
              )}
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.searchOnlineBtn}>
          <Ionicons name="search-outline" size={16} color="#1155CC" />
          <Text style={styles.searchOnlineText}>Search online</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            Quantity Type <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.radioGroup}>
            {["Single Items", "Carton", "Both"].map((type) => (
              <TouchableOpacity
                key={type}
                style={styles.radioOption}
                onPress={() => updateFormData("quantityType", type)}
              >
                <View
                  style={[
                    styles.radioCircle,
                    formData.quantityType === type && styles.radioCircleActive,
                  ]}
                >
                  {formData.quantityType === type && (
                    <View style={styles.radioInner} />
                  )}
                </View>
                <Text style={styles.radioText}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {formData.quantityType === "Single Items" && (
          <>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                No. of Items (Unit) <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="How many pieces dey inside one carton?"
                placeholderTextColor="#CBD5E0"
                value={formData.numberOfItems}
                onChangeText={(value) => updateFormData("numberOfItems", value)}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Cost Price (How much you buy am?){" "}
                <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.priceInputWrapper}>
                <Text style={styles.currency}>₦</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder="0.00"
                  placeholderTextColor="#CBD5E0"
                  value={formData.costPrice}
                  onChangeText={(value) => updateFormData("costPrice", value)}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.priceOptionsRow}>
                {["100", "200", "500", "800", "1000"].map((price) => (
                  <TouchableOpacity
                    key={price}
                    style={styles.priceChip}
                    onPress={() => updateFormData("costPrice", price)}
                  >
                    <Text style={styles.priceChipText}>₦{price}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Selling Price (How much you won sell am?){" "}
                <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.priceInputWrapper}>
                <Text style={styles.currency}>₦</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder="0.00"
                  placeholderTextColor="#CBD5E0"
                  value={formData.sellingPrice}
                  onChangeText={(value) =>
                    updateFormData("sellingPrice", value)
                  }
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.priceOptionsRow}>
                {["100", "200", "500", "800", "1000"].map((price) => (
                  <TouchableOpacity
                    key={price}
                    style={styles.priceChip}
                    onPress={() => updateFormData("sellingPrice", price)}
                  >
                    <Text style={styles.priceChipText}>₦{price}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}

        {formData.quantityType === "Carton" && (
          <>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Units per Carton <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="How many pieces dey inside one carton?"
                placeholderTextColor="#CBD5E0"
                value={formData.unitsPerCarton}
                onChangeText={(value) =>
                  updateFormData("unitsPerCarton", value)
                }
                keyboardType="numeric"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                No. of Cartons <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="How many carton?"
                placeholderTextColor="#CBD5E0"
                value={formData.numberOfCartons}
                onChangeText={(value) =>
                  updateFormData("numberOfCartons", value)
                }
                keyboardType="numeric"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Cost Price (How much you buy 1 carton?){" "}
                <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.priceInputWrapper}>
                <Text style={styles.currency}>₦</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder="0.00"
                  placeholderTextColor="#CBD5E0"
                  value={formData.costPricePerCarton}
                  onChangeText={(value) =>
                    updateFormData("costPricePerCarton", value)
                  }
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.priceOptionsRow}>
                {["100", "200", "500", "800", "1000"].map((price) => (
                  <TouchableOpacity
                    key={price}
                    style={styles.priceChip}
                    onPress={() => updateFormData("costPricePerCarton", price)}
                  >
                    <Text style={styles.priceChipText}>₦{price}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Selling Price (How much you won sell am?){" "}
                <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.priceInputWrapper}>
                <Text style={styles.currency}>₦</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder="0.00"
                  placeholderTextColor="#CBD5E0"
                  value={formData.sellingPricePerCarton}
                  onChangeText={(value) =>
                    updateFormData("sellingPricePerCarton", value)
                  }
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.priceOptionsRow}>
                {["100", "200", "500", "800", "1000"].map((price) => (
                  <TouchableOpacity
                    key={price}
                    style={styles.priceChip}
                    onPress={() =>
                      updateFormData("sellingPricePerCarton", price)
                    }
                  >
                    <Text style={styles.priceChipText}>₦{price}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}

        {formData.quantityType === "Both" && (
          <>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Units per Carton <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="How many pieces dey inside one carton?"
                placeholderTextColor="#CBD5E0"
                value={formData.unitsPerCarton}
                onChangeText={(value) =>
                  updateFormData("unitsPerCarton", value)
                }
                keyboardType="numeric"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                No. of Cartons <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="How many carton?"
                placeholderTextColor="#CBD5E0"
                value={formData.numberOfCartons}
                onChangeText={(value) =>
                  updateFormData("numberOfCartons", value)
                }
                keyboardType="numeric"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Cost Price (How much you buy 1 carton?){" "}
                <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.priceInputWrapper}>
                <Text style={styles.currency}>₦</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder="0.00"
                  placeholderTextColor="#CBD5E0"
                  value={formData.costPricePerCarton}
                  onChangeText={(value) =>
                    updateFormData("costPricePerCarton", value)
                  }
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.priceOptionsRow}>
                {["100", "200", "500", "800", "1000"].map((price) => (
                  <TouchableOpacity
                    key={price}
                    style={styles.priceChip}
                    onPress={() => updateFormData("costPricePerCarton", price)}
                  >
                    <Text style={styles.priceChipText}>₦{price}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Selling Price (for 1 carton?){" "}
                <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.priceInputWrapper}>
                <Text style={styles.currency}>₦</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder="0.00"
                  placeholderTextColor="#CBD5E0"
                  value={formData.sellingPricePerCarton}
                  onChangeText={(value) =>
                    updateFormData("sellingPricePerCarton", value)
                  }
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.priceOptionsRow}>
                {["100", "200", "500", "800", "1000"].map((price) => (
                  <TouchableOpacity
                    key={price}
                    style={styles.priceChip}
                    onPress={() =>
                      updateFormData("sellingPricePerCarton", price)
                    }
                  >
                    <Text style={styles.priceChipText}>₦{price}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Selling Price (for 1 unit item inside?){" "}
                <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.priceInputWrapper}>
                <Text style={styles.currency}>₦</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder="0.00"
                  placeholderTextColor="#CBD5E0"
                  value={formData.sellingPricePerUnit}
                  onChangeText={(value) =>
                    updateFormData("sellingPricePerUnit", value)
                  }
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.priceOptionsRow}>
                {["100", "200", "500", "800", "1000"].map((price) => (
                  <TouchableOpacity
                    key={price}
                    style={styles.priceChip}
                    onPress={() => updateFormData("sellingPricePerUnit", price)}
                  >
                    <Text style={styles.priceChipText}>₦{price}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );

  const renderStep3 = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            Low stock Threshold <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Select Number"
            placeholderTextColor="#CBD5E0"
            value={formData.lowStockThreshold}
            onChangeText={(value) => updateFormData("lowStockThreshold", value)}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Expiry Date</Text>
          <View style={styles.dateRow}>
            <TextInput
              style={styles.dateBox}
              placeholder="DD"
              placeholderTextColor="#CBD5E0"
              value={formData.expiryDate.day}
              onChangeText={(value) => updateFormData("expiryDate.day", value)}
              keyboardType="numeric"
              maxLength={2}
            />
            <TextInput
              style={styles.dateBox}
              placeholder="MM"
              placeholderTextColor="#CBD5E0"
              value={formData.expiryDate.month}
              onChangeText={(value) =>
                updateFormData("expiryDate.month", value)
              }
              keyboardType="numeric"
              maxLength={2}
            />
            <TextInput
              style={styles.dateBox}
              placeholder="YYYY"
              placeholderTextColor="#CBD5E0"
              value={formData.expiryDate.year}
              onChangeText={(value) => updateFormData("expiryDate.year", value)}
              keyboardType="numeric"
              maxLength={4}
            />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Supplier</Text>
          <TextInput
            style={styles.input}
            placeholder="Full Name..."
            placeholderTextColor="#CBD5E0"
            value={formData.supplier.name}
            onChangeText={(value) => updateFormData("supplier.name", value)}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Type here..."
            placeholderTextColor="#CBD5E0"
            value={formData.supplier.phone}
            onChangeText={(value) => updateFormData("supplier.phone", value)}
            keyboardType="phone-pad"
          />
        </View>
      </View>
    </ScrollView>
  );

  const renderSummary = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.summaryTitle}>Summary</Text>

      {formData.productImage && (
        <View style={styles.summaryImageContainer}>
          <Image
            source={{ uri: formData.productImage.uri }}
            style={styles.summaryImage}
          />
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.summaryHeader}>PRODUCT INFO</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Name:</Text>
          <Text style={styles.summaryValue}>{formData.productName}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Category:</Text>
          <Text style={styles.summaryValue}>{formData.category || "N/A"}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.summaryHeader}>QUANTITY & PRICING</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Quantity Type:</Text>
          <Text style={styles.summaryValue}>{formData.quantityType}</Text>
        </View>

        {formData.quantityType === "Single Items" && (
          <>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Units in Stock:</Text>
              <Text style={styles.summaryValue}>
                {formData.numberOfItems || "0"}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Cost Price:</Text>
              <Text style={styles.summaryValue}>
                ₦{formData.costPrice || "0.00"}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Selling Price:</Text>
              <Text style={styles.summaryValue}>
                ₦{formData.sellingPrice || "0.00"}
              </Text>
            </View>
          </>
        )}

        {formData.quantityType === "Carton" && (
          <>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Units per Carton:</Text>
              <Text style={styles.summaryValue}>
                {formData.unitsPerCarton || "0"}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Number of Cartons:</Text>
              <Text style={styles.summaryValue}>
                {formData.numberOfCartons || "0"}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Units:</Text>
              <Text style={styles.summaryValue}>
                {(parseInt(formData.unitsPerCarton) || 0) *
                  (parseInt(formData.numberOfCartons) || 0)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Cost Price (per carton):</Text>
              <Text style={styles.summaryValue}>
                ₦{formData.costPricePerCarton || "0.00"}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Selling Price (per carton):
              </Text>
              <Text style={styles.summaryValue}>
                ₦{formData.sellingPricePerCarton || "0.00"}
              </Text>
            </View>
          </>
        )}

        {formData.quantityType === "Both" && (
          <>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Units per Carton:</Text>
              <Text style={styles.summaryValue}>
                {formData.unitsPerCarton || "0"}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Number of Cartons:</Text>
              <Text style={styles.summaryValue}>
                {formData.numberOfCartons || "0"}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Units:</Text>
              <Text style={styles.summaryValue}>
                {(parseInt(formData.unitsPerCarton) || 0) *
                  (parseInt(formData.numberOfCartons) || 0)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Cost Price (per carton):</Text>
              <Text style={styles.summaryValue}>
                ₦{formData.costPricePerCarton || "0.00"}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Selling Price (per carton):
              </Text>
              <Text style={styles.summaryValue}>
                ₦{formData.sellingPricePerCarton || "0.00"}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Selling Price (per unit):</Text>
              <Text style={styles.summaryValue}>
                ₦{formData.sellingPricePerUnit || "0.00"}
              </Text>
            </View>
          </>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.summaryHeader}>STOCK SETTINGS</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Low Stock Threshold:</Text>
          <Text style={styles.summaryValue}>
            {formData.lowStockThreshold || "10"}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Expiry Date:</Text>
          <Text style={styles.summaryValue}>
            {formData.expiryDate.month && formData.expiryDate.year
              ? `${formData.expiryDate.month}/${
                  formData.expiryDate.day || "01"
                }/${formData.expiryDate.year}`
              : "N/A"}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.summaryHeader}>SUPPLIER INFO</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Name:</Text>
          <Text style={styles.summaryValue}>
            {formData.supplier.name || "N/A"}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Phone no:</Text>
          <Text style={styles.summaryValue}>
            {formData.supplier.phone || "N/A"}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.confirmBtn,
          (saving || imageUploading) && { opacity: 0.7 },
        ]}
        onPress={handleSaveProduct}
        disabled={saving || imageUploading}
      >
        {saving || imageUploading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <>
            <Text style={styles.confirmBtnText}>Confirm</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFF" />
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
  const renderInitialChoice = () => (
    <Modal
      visible={showInitialChoice}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalBackdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.bottomSheetContainer}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.bottomSheetContent}
          >
            <View style={styles.handleBar} />

            <Text style={styles.bottomSheetHeader}>Add Product</Text>

            <Text style={styles.initialChoiceTitle}>
              How would you like to{"\n"}add a product?
            </Text>
            <Text style={styles.initialChoiceSubtitle}>
              You can search from existing products or{"\n"}add a new one
              manually
            </Text>

            <TouchableOpacity
              style={styles.searchButtonInitial}
              onPress={handleSearchClick}
            >
              <Ionicons
                name="search-outline"
                size={20}
                color="#666"
                style={{ marginRight: 10 }}
              />
              <Text style={styles.searchButtonInitialText}>Search</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.addManuallyButton}
              onPress={handleAddManually}
            >
              <Ionicons
                name="add"
                size={20}
                color="#FFF"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.addManuallyButtonText}>Add Manually</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderSearchModal = () => (
    <Modal
      visible={showSearchModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => {
        setShowSearchModal(false);
        setShowInitialChoice(true);
      }}
    >
      <SafeAreaView style={styles.searchModalContainer}>
        <View style={styles.searchHeader}>
          <Text style={styles.searchHeaderTitle}>Search Product</Text>
          <TouchableOpacity
            onPress={() => {
              setShowSearchModal(false);
              setShowInitialChoice(true);
            }}
            style={styles.searchCloseButton}
          >
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
            onChangeText={(text) => {
              setSearchQuery(text);
              handleSearch(text);
            }}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery("");
                setSearchResults([]);
              }}
              style={styles.clearSearchButton}
            >
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView style={styles.searchContent}>
          {searchQuery.length === 0 && (
            <View style={styles.recentSearchesSection}>
              <Text style={styles.recentSearchesHeader}>Recent</Text>
              {recentSearches.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.recentSearchItem}
                  onPress={() => {
                    setSearchQuery(item);
                    handleSearch(item);
                  }}
                >
                  <Ionicons name="search-outline" size={18} color="#666" />
                  <Text style={styles.recentSearchText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {searchQuery.length > 0 && (
            <View style={styles.searchResultsSection}>
              <Text style={styles.searchResultsHeader}>
                Showing results for &quot;
                <Text style={styles.searchQueryText}>{searchQuery}</Text>&quot;
              </Text>

              {isSearching ? (
                <View style={styles.searchLoadingContainer}>
                  <ActivityIndicator size="large" color="#1155CC" />
                </View>
              ) : searchResults.length > 0 ? (
                searchResults.map((product) => (
                  <TouchableOpacity
                    key={product.id}
                    style={styles.searchResultItem}
                    onPress={() => handleSelectProduct(product)}
                  >
                    {product.image?.uri ? (
                      <Image
                        source={{ uri: product.image.uri }}
                        style={styles.searchResultImage}
                      />
                    ) : (
                      <View style={styles.searchResultImagePlaceholder}>
                        <Ionicons name="image-outline" size={24} color="#999" />
                      </View>
                    )}
                    <View style={styles.searchResultInfo}>
                      <Text style={styles.searchResultName}>
                        {product.name}
                      </Text>
                      <Text style={styles.searchResultButton}>Add Product</Text>
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

  if (!currentUser) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View
          style={[
            styles.container,
            { justifyContent: "center", alignItems: "center" },
          ]}
        >
          <Text style={styles.errorText}>Please log in to add products</Text>
          <TouchableOpacity style={styles.addManuallyButton} onPress={onClose}>
            <Text style={styles.addManuallyButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <>
      <Modal
        visible={visible && !showInitialChoice && !showSearchModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>New Product</Text>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => {
                onClose();
                resetForm();
              }}
            >
              <Ionicons name="close" size={22} color="#1A202C" />
            </TouchableOpacity>
          </View>

          {currentStep < 3 && renderProgressBar()}

          {currentStep === 0 && renderStep1()}
          {currentStep === 1 && renderStep2()}
          {currentStep === 2 && renderStep3()}
          {currentStep === 3 && renderSummary()}

          {currentStep < 3 && (
            <View style={styles.navigationButtons}>
              {currentStep > 0 && (
                <TouchableOpacity
                  style={styles.backBtn}
                  onPress={prevStep}
                  disabled={saving || imageUploading}
                >
                  <Ionicons name="arrow-back" size={18} color="#4A5568" />
                  <Text style={styles.backBtnText}>Back</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[
                  styles.nextBtn,
                  (saving || imageUploading) && { opacity: 0.7 },
                  currentStep === 0 && { flex: 1 },
                ]}
                onPress={nextStep}
                disabled={saving || imageUploading}
              >
                <Text style={styles.nextBtnText}>
                  {currentStep === 2 ? "Confirm" : "Next"}
                </Text>
                <Ionicons name="arrow-forward" size={18} color="#FFF" />
              </TouchableOpacity>
            </View>
          )}

          {(saving || imageUploading) && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#1155CC" />
              <Text style={styles.loadingText}>
                {imageUploading ? "Uploading image..." : "Saving product..."}
              </Text>
            </View>
          )}
        </SafeAreaView>
      </Modal>

      {visible && showInitialChoice && renderInitialChoice()}

      {visible && renderSearchModal()}
    </>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E7EEFA",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#E7EEFA",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1A202C",
    fontFamily: "Poppins-SemiBold",
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#E53E3E",
    textAlign: "center",
    marginBottom: 20,
    fontFamily: "Poppins-Regular",
  },
  progressContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    margin: 20,
    gap: 10,
  },
  stepItem: {
    flex: 1,
  },
  stepText: {
    fontSize: 12,
    fontWeight: "500",
    fontFamily: "Poppins-Medium",
    marginBottom: 6,
  },
  stepTextActive: {
    color: "#1155CC",
  },
  stepTextInactive: {
    color: "#A0AEC0",
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  progressBarActive: {
    backgroundColor: "#1155CC",
  },
  progressBarInactive: {
    backgroundColor: "#E2E8F0",
  },
  stepContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2D3748",
    marginBottom: 6,
    fontFamily: "Poppins-SemiBold",
  },
  required: {
    color: "#E53E3E",
  },
  input: {
    backgroundColor: "#EDF2F7",
    borderRadius: 6,
    padding: 12,
    fontSize: 13,
    color: "#2D3748",
    fontFamily: "Poppins-Regular",
  },
  dropdown: {
    backgroundColor: "#EDF2F7",
    borderRadius: 6,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownText: {
    fontSize: 13,
    color: "#2D3748",
    fontFamily: "Poppins-Regular",
  },
  dropdownPlaceholder: {
    fontSize: 13,
    color: "#CBD5E0",
    fontFamily: "Poppins-Regular",
  },
  dropdownMenu: {
    backgroundColor: "#FFF",
    borderRadius: 6,
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
  },
  dropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F7FAFC",
  },
  dropdownItemText: {
    fontSize: 13,
    color: "#2D3748",
    fontFamily: "Poppins-Regular",
  },
  imageUploadBox: {
    backgroundColor: "#FFF",
    borderRadius: 8,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  imageIconCircle: {
    marginBottom: 10,
  },
  imageUploadTitle: {
    fontSize: 13,
    color: "#4A5568",
    marginBottom: 14,
    fontFamily: "Poppins-Medium",
  },
  imageButtonsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  imageBtnOutline: {
    backgroundColor: "transparent",
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#CBD5E0",
  },
  imageBtnOutlineText: {
    fontSize: 12,
    color: "#4A5568",
    fontWeight: "500",
    fontFamily: "Poppins-Medium",
  },
  imageUploadInfo: {
    fontSize: 10,
    color: "#718096",
    textAlign: "center",
    fontFamily: "Poppins-Regular",
    lineHeight: 14,
  },
  uploadedImageWrapper: {
    alignItems: "center",
  },
  uploadedImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginBottom: 12,
  },
  searchOnlineBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EDF2F7",
    borderRadius: 6,
    paddingVertical: 12,
    gap: 6,
  },
  searchOnlineText: {
    fontSize: 13,
    color: "#1155CC",
    fontWeight: "500",
    fontFamily: "Poppins-Medium",
  },
  radioGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#CBD5E0",
    marginRight: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  radioCircleActive: {
    borderColor: "#1155CC",
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#1155CC",
  },
  radioText: {
    fontSize: 13,
    color: "#2D3748",
    fontFamily: "Poppins-Regular",
  },
  priceInputWrapper: {
    flexDirection: "row",
    backgroundColor: "#EDF2F7",
    borderRadius: 6,
    alignItems: "center",
    paddingLeft: 12,
    marginBottom: 10,
  },
  currency: {
    fontSize: 13,
    color: "#718096",
    marginRight: 6,
    fontFamily: "Poppins-Regular",
  },
  priceInput: {
    flex: 1,
    padding: 12,
    paddingLeft: 0,
    fontSize: 13,
    color: "#2D3748",
    fontFamily: "Poppins-Regular",
  },
  priceOptionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  priceChip: {
    backgroundColor: "#EDF2F7",
    borderRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  priceChipText: {
    fontSize: 12,
    color: "#1155CC",
    fontWeight: "500",
    fontFamily: "Poppins-Medium",
  },
  dateRow: {
    flexDirection: "row",
    gap: 10,
  },
  dateBox: {
    backgroundColor: "#EDF2F7",
    borderRadius: 6,
    padding: 12,
    fontSize: 13,
    color: "#2D3748",
    flex: 1,
    textAlign: "center",
    fontFamily: "Poppins-Regular",
  },
  navigationButtons: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  backBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingVertical: 12,
  },
  backBtnText: {
    fontSize: 14,
    color: "#4A5568",
    fontWeight: "500",
    fontFamily: "Poppins-Medium",
  },
  nextBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#1155CC",
    borderRadius: 8,
    paddingVertical: 12,
  },
  nextBtnText: {
    fontSize: 14,
    color: "#FFF",
    fontWeight: "600",
    fontFamily: "Poppins-SemiBold",
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A202C",
    paddingHorizontal: 4,
    marginBottom: 14,
    fontFamily: "Poppins-Bold",
  },
  summaryImageContainer: {
    alignItems: "center",
    marginBottom: 14,
  },
  summaryImage: {
    width: 90,
    height: 90,
    borderRadius: 10,
  },
  summaryHeader: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2D3748",
    marginBottom: 10,
    letterSpacing: 0.5,
    fontFamily: "Poppins-Bold",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#718096",
    flex: 1,
    fontFamily: "Poppins-Regular",
  },
  summaryValue: {
    fontSize: 12,
    color: "#2D3748",
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
    fontFamily: "Poppins-Medium",
  },
  confirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#1155CC",
    borderRadius: 8,
    paddingVertical: 14,
    marginTop: 8,
  },
  confirmBtnText: {
    fontSize: 14,
    color: "#FFF",
    fontWeight: "600",
    fontFamily: "Poppins-SemiBold",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#1155CC",
    fontWeight: "500",
    fontFamily: "Poppins-Medium",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  bottomSheetContainer: {
    justifyContent: "flex-end",
  },
  bottomSheetContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingBottom: 34,
    paddingTop: 8,
  },
  handleBar: {
    width: 60,
    height: 4,
    backgroundColor: "#1155CC",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  bottomSheetHeader: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1155CC",
    textAlign: "center",
    marginBottom: 20,
    fontFamily: "Poppins-SemiBold",
  },
  initialChoiceTitle: {
    fontSize: 19,
    fontWeight: "600",
    color: "#1A202C",
    textAlign: "center",
    marginBottom: 10,
    fontFamily: "Poppins-SemiBold",
  },
  initialChoiceSubtitle: {
    fontSize: 13,
    color: "#718096",
    textAlign: "center",
    marginBottom: 28,
    lineHeight: 19,
    fontFamily: "Poppins-Regular",
  },
  searchButtonInitial: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 50,
    paddingVertical: 13,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#1155CC",
  },
  searchButtonInitialText: {
    fontSize: 14,
    color: "#1C1C1C",
    fontWeight: "500",
    fontFamily: "Poppins-Medium",
  },
  addManuallyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    backgroundColor: "#1155CC",
    borderRadius: 50,
    paddingVertical: 13,
  },
  addManuallyButtonText: {
    fontSize: 14,
    color: "#FFF",
    fontWeight: "600",
    fontFamily: "Poppins-SemiBold",
  },
  searchModalContainer: {
    flex: 1,
    backgroundColor: "#F7FAFC",
  },
  searchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  searchHeaderTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1A202C",
    fontFamily: "Poppins-SemiBold",
  },
  searchCloseButton: {
    padding: 4,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    marginHorizontal: 16,
    marginVertical: 14,
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
    fontSize: 14,
    color: "#2D3748",
    fontFamily: "Poppins-Regular",
  },
  clearSearchButton: {
    padding: 4,
  },
  searchContent: {
    flex: 1,
  },
  recentSearchesSection: {
    backgroundColor: "#FFF",
    paddingVertical: 8,
  },
  recentSearchesHeader: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1155CC",
    paddingHorizontal: 20,
    paddingVertical: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontFamily: "Poppins-SemiBold",
  },
  recentSearchItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F7FAFC",
  },
  recentSearchText: {
    fontSize: 13,
    color: "#2D3748",
    marginLeft: 10,
    fontFamily: "Poppins-Regular",
  },
  searchResultsSection: {
    flex: 1,
  },
  searchResultsHeader: {
    fontSize: 12,
    color: "#718096",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#F7FAFC",
    fontFamily: "Poppins-Regular",
  },
  searchQueryText: {
    fontWeight: "600",
    color: "#1155CC",
    fontFamily: "Poppins-SemiBold",
  },
  searchLoadingContainer: {
    padding: 36,
    alignItems: "center",
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F7FAFC",
  },
  searchResultImage: {
    width: 46,
    height: 46,
    borderRadius: 6,
    marginRight: 12,
  },
  searchResultImagePlaceholder: {
    width: 46,
    height: 46,
    borderRadius: 6,
    backgroundColor: "#EDF2F7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  searchResultInfo: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  searchResultName: {
    fontSize: 13,
    fontWeight: "500",
    color: "#2D3748",
    flex: 1,
    fontFamily: "Poppins-Medium",
  },
  searchResultButton: {
    fontSize: 12,
    color: "#1155CC",
    fontWeight: "500",
    fontFamily: "Poppins-Medium",
  },
  noResultsContainer: {
    padding: 36,
    alignItems: "center",
  },
  noResultsText: {
    fontSize: 13,
    color: "#718096",
    textAlign: "center",
    fontFamily: "Poppins-Regular",
  },
});

export default AddProductFlow;
