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
// Import YOUR notification helpers
import {
  checkExpiringProducts,
  checkLowStock,
  notifyProductAdded
} from "../notificationHelpers";

const { width } = Dimensions.get("window");

// Types
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
}

interface ImageAsset {
  uri: string;
  type?: string;
  fileName?: string;
  fileSize?: number;
  width?: number;
  height?: number;
}

// Main Component
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

  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0.33);
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  const [hasScannerPermission, setHasScannerPermission] = useState<
    boolean | null
  >(null);
  const [scannerScanned, setScannerScanned] = useState(false);

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
  });

  const [showScanner, setShowScanner] = useState(false);

  const steps = ["Product Info", "Pricing & Packaging", "Stock & Extras"];

  const currentUser = auth.currentUser;

  useEffect(() => {
    if (visible) {
      setShowInitialChoice(true);
      setShowSearchModal(false);
      setSearchQuery("");
      setSearchResults([]);
    }
  }, [visible]);

  useEffect(() => {
    const getBarCodeScannerPermissions = async () => {
      // Barcode scanner permission logic
    };

    if (showScanner) {
      getBarCodeScannerPermissions();
    }
  }, [showScanner]);

  useEffect(() => {
    const calculateProgress = () => {
      let filledFields = 0;
      let totalFields = 0;

      if (currentStep === 0) {
        totalFields = 4;
        if (formData.productName) filledFields++;
        if (formData.sku) filledFields++;
        if (formData.category) filledFields++;
        if (formData.productImage) filledFields++;
      } else if (currentStep === 1) {
        totalFields = 4;
        if (formData.quantityType) filledFields++;
        if (formData.numberOfItems) filledFields++;
        if (formData.costPrice) filledFields++;
        if (formData.sellingPrice) filledFields++;
      } else if (currentStep === 2) {
        totalFields = 5;
        if (formData.lowStockThreshold) filledFields++;
        if (formData.expiryDate.month && formData.expiryDate.year)
          filledFields++;
        if (formData.supplier.name) filledFields++;
        if (formData.supplier.phone) filledFields++;
        filledFields++;
      }

      const stepProgress = filledFields / totalFields;
      const baseProgress = currentStep * 0.33;
      const currentProgress = baseProgress + stepProgress * 0.33;
      setProgress(Math.min(currentProgress, 1));
    };

    calculateProgress();
  }, [formData, currentStep]);

  const handleSearch = async (searchText: string) => {
    if (!searchText.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);

    try {
      const productsRef = collection(db, "products");
      const q = query(
        productsRef,
        where("userId", "==", currentUser?.uid)
      );

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
        }
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert(
          "Permission Denied",
          "You need to grant camera permission to use this feature."
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
          response.errorMessage || "An unknown error occurred."
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
        "An unexpected error occurred while picking an image."
      );
    }
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      "Select Product Image",
      "Choose how you would like to upload a new photo.",
      [
        {
          text: "Take Photo",
          onPress: () => handlePickImage(true),
        },
        {
          text: "Choose from Gallery",
          onPress: () => handlePickImage(false),
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  const nextStep = () => {
    if (currentStep === 0) {
      if (!formData.productName || !formData.sku || !formData.category) {
        Alert.alert(
          "Missing Information",
          "Please fill in all required fields for Product Info."
        );
        return;
      }
    } else if (currentStep === 1) {
      if (
        !formData.numberOfItems ||
        !formData.costPrice ||
        !formData.sellingPrice
      ) {
        Alert.alert(
          "Missing Information",
          "Please fill in all required fields for Pricing & Packaging."
        );
        return;
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

      const productData = {
        name: formData.productName || "Untitled Product",
        category: formData.category || "Food",
        barcode: formData.sku || "",
        image: imageUrl ? { uri: imageUrl } : null,
        quantityType: formData.quantityType || "Single Items",
        unitsInStock: parseInt(formData.numberOfItems) || 0,
        costPrice: parseFloat(formData.costPrice) || 0,
        sellingPrice: parseFloat(formData.sellingPrice) || 0,
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

      console.log("Saving product with userId:", currentUser.uid);

      const docRef = await addDoc(collection(db, "products"), productData);
      console.log("Product saved with ID:", docRef.id);

      const savedProduct: Product = {
        id: docRef.id,
        ...productData,
      } as Product;

      // ===== NOTIFICATION INTEGRATION USING YOUR SYSTEM =====
      
      // 1. Notify that product was added
      await notifyProductAdded(
        currentUser.uid,
        docRef.id,
        productData.name
      );

      // 2. Check for low stock or out of stock
      await checkLowStock(
        currentUser.uid,
        docRef.id,
        productData.name,
        productData.unitsInStock,
        productData.lowStockThreshold
      );

      // 3. Check for expiring products (runs check on all products)
      await checkExpiringProducts(currentUser.uid);

      console.log("✅ All notifications created successfully");

      onSaveProduct(savedProduct);
      onClose();
      resetForm();
    } catch (error) {
      console.error("Error adding product:", error);
      Alert.alert(
        "Error",
        "Failed to add product. Please check your connection and try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // All render functions remain exactly the same as in the complete version
  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      {steps.map((step, index) => (
        <View key={index} style={styles.stepContainer}>
          <View
            style={[
              styles.stepIndicator,
              {
                backgroundColor: index <= currentStep ? "#007AFF" : "#E0E0E0",
                width:
                  index === 0
                    ? width * 0.25
                    : index === 1
                    ? width * 0.35
                    : width * 0.25,
              },
            ]}
          >
            {index === currentStep && (
              <View
                style={[styles.progressFill, { width: `${progress * 100}%` }]}
              />
            )}
            {index < currentStep && (
              <View style={[styles.progressFill, { width: "100%" }]} />
            )}
          </View>
          <Text
            style={[
              styles.stepText,
              { color: index <= currentStep ? "#007AFF" : "#999" },
            ]}
          >
            {step}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <ScrollView style={styles.stepContent}>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Product Name <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Type here..."
          value={formData.productName}
          onChangeText={(value) => updateFormData("productName", value)}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          SKU / Barcode <Text style={styles.required}>*</Text>
        </Text>
        <View style={styles.inputWithButton}>
          <TextInput
            style={[styles.input, { flex: 1, marginRight: 10 }]}
            placeholder="Type 8-13 digits here..."
            value={formData.sku}
            onChangeText={(value) => updateFormData("sku", value)}
            keyboardType="numeric"
          />
          <TouchableOpacity
            style={styles.scanButton}
            onPress={() => {
              setScannerScanned(false);
              setShowScanner(true);
            }}
          >
            <Ionicons name="barcode" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Product Category <Text style={styles.required}>*</Text>
        </Text>
        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => updateFormData("category", "Food")}
        >
          <Text
            style={
              formData.category
                ? styles.dropdownText
                : styles.dropdownPlaceholder
            }
          >
            {formData.category || "Select Category (e.g., Food)"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Upload Product Image <Text style={styles.required}>*</Text>
        </Text>
        <TouchableOpacity
          onPress={showImagePickerOptions}
          style={styles.imageUploadContainer}
          disabled={imageUploading}
        >
          {formData.productImage ? (
            <View style={styles.uploadedImageContainer}>
              <Image
                source={{ uri: formData.productImage.uri }}
                style={styles.uploadedImage}
              />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => updateFormData("productImage", null)}
              >
                <Text style={styles.removeButtonText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.imageUploadArea}>
              <Text style={styles.imageUploadIcon}>📷</Text>
              <Text style={styles.imageUploadText}>
                Tap to take a picture, or select from gallery
              </Text>
              {imageUploading && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={{ color: "#fff", marginTop: 5, fontFamily: "Poppins-Regular" }}>
                    Uploading...
                  </Text>
                </View>
              )}
              <Text style={styles.imageUploadInfo}>
                Files Supported: PNG, JPG, SVG.
              </Text>
              <Text style={styles.imageUploadInfo}>Maximum Size 1MB</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView style={styles.stepContent}>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Quantity Type: <Text style={styles.required}>*</Text>
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
                  {
                    backgroundColor:
                      formData.quantityType === type ? "#007AFF" : "#FFF",
                  },
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

      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          No. of Items (Unit) <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          placeholder="How many pieces dey inside one carton?"
          value={formData.numberOfItems}
          onChangeText={(value) => updateFormData("numberOfItems", value)}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Cost Price (How much you buy am?){" "}
          <Text style={styles.required}>*</Text>
        </Text>
        <View style={styles.priceInput}>
          <Text style={styles.currency}>₦</Text>
          <TextInput
            style={styles.priceTextInput}
            placeholder="0.00"
            value={formData.costPrice}
            onChangeText={(value) => updateFormData("costPrice", value)}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.priceOptions}>
          {["100", "200", "500", "800", "1000"].map((price) => (
            <TouchableOpacity
              key={price}
              style={styles.priceOption}
              onPress={() => updateFormData("costPrice", price)}
            >
              <Text style={styles.priceOptionText}>₦{price}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Selling Price (How much you won sell am?){" "}
          <Text style={styles.required}>*</Text>
        </Text>
        <View style={styles.priceInput}>
          <Text style={styles.currency}>₦</Text>
          <TextInput
            style={styles.priceTextInput}
            placeholder="0.00"
            value={formData.sellingPrice}
            onChangeText={(value) => updateFormData("sellingPrice", value)}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.priceOptions}>
          {["100", "200", "500", "800", "1000"].map((price) => (
            <TouchableOpacity
              key={price}
              style={styles.priceOption}
              onPress={() => updateFormData("sellingPrice", price)}
            >
              <Text style={styles.priceOptionText}>₦{price}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  const renderStep3 = () => (
    <ScrollView style={styles.stepContent}>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Low stock Threshold <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Enter threshold number"
          value={formData.lowStockThreshold}
          onChangeText={(value) => updateFormData("lowStockThreshold", value)}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Expiry Date</Text>
        <View style={styles.dateInputs}>
          <TextInput
            style={[styles.dateInput, { marginHorizontal: 0, marginRight: 10 }]}
            placeholder="DD"
            value={formData.expiryDate.day}
            onChangeText={(value) => updateFormData("expiryDate.day", value)}
            keyboardType="numeric"
            maxLength={2}
          />
          <TextInput
            style={styles.dateInput}
            placeholder="MM"
            value={formData.expiryDate.month}
            onChangeText={(value) => updateFormData("expiryDate.month", value)}
            keyboardType="numeric"
            maxLength={2}
          />
          <TextInput
            style={[styles.dateInput, { marginLeft: 10, marginHorizontal: 0 }]}
            placeholder="YYYY"
            value={formData.expiryDate.year}
            onChangeText={(value) => updateFormData("expiryDate.year", value)}
            keyboardType="numeric"
            maxLength={4}
          />
        </View>
      </View>

      <View style={styles.supplierSection}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Supplier (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Full Name..."
            value={formData.supplier.name}
            onChangeText={(value) => updateFormData("supplier.name", value)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Type here..."
            value={formData.supplier.phone}
            onChangeText={(value) => updateFormData("supplier.phone", value)}
            keyboardType="phone-pad"
          />
        </View>
      </View>
    </ScrollView>
  );

  const renderSummary = () => (
    <ScrollView style={styles.summaryContent}>
      <Text style={styles.summaryTitle}>Summary</Text>

      {formData.productImage && (
        <View style={styles.summaryImageContainer}>
          <Image
            source={{ uri: formData.productImage.uri }}
            style={styles.summaryImage}
          />
        </View>
      )}

      <View style={styles.summarySection}>
        <Text style={styles.summaryHeader}>PRODUCT INFO</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Name:</Text>
          <Text style={styles.summaryValue}>{formData.productName}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Category:</Text>
          <Text style={styles.summaryValue}>{formData.category || "N/A"}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Barcode:</Text>
          <Text style={styles.summaryValue}>{formData.sku || "N/A"}</Text>
        </View>
      </View>

      <View style={styles.summarySection}>
        <Text style={styles.summaryHeader}>QUANTITY & PRICING</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Units in Stock:</Text>
          <Text style={styles.summaryValue}>
            {formData.numberOfItems || "0"}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Unit Type:</Text>
          <Text style={styles.summaryValue}>{formData.quantityType}</Text>
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
      </View>

      <View style={styles.summarySection}>
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

      <View style={styles.summarySection}>
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
          styles.saveProductButton,
          (saving || imageUploading) && { opacity: 0.7 },
        ]}
        onPress={handleSaveProduct}
        disabled={saving || imageUploading}
      >
        {saving || imageUploading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Text style={styles.saveProductButtonText}>Save Product ✓</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );

  const renderBarcodeScanner = () => {
    if (hasScannerPermission === null) {
      return (
        <View style={styles.scannerMessageContainer}>
          <Text style={styles.scannerMessageText}>
            Requesting camera permission...
          </Text>
        </View>
      );
    }
    if (hasScannerPermission === false) {
      return (
        <View style={styles.scannerMessageContainer}>
          <Text style={[styles.scannerMessageText, { color: "#FF3B30" }]}>
            No access to camera. Please grant permission in device settings.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.scannerContainer}>
        <View style={styles.scanTargetOverlay}>
          <Text style={styles.scanTargetText}>
            Align the Barcode/SKU within this frame
          </Text>
        </View>
        {scannerScanned && (
          <View style={styles.scannerScannedOverlay}>
            <ActivityIndicator size="large" color="#FFF" />
            <Text style={styles.scannerScannedText}>Barcode detected...</Text>
          </View>
        )}
      </View>
    );
  };

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
              You can search from existing products or{"\n"}add a new one manually
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
                Showing results for &quot;<Text style={styles.searchQueryText}>{searchQuery}</Text>&quot;
              </Text>

              {isSearching ? (
                <View style={styles.searchLoadingContainer}>
                  <ActivityIndicator size="large" color="#007AFF" />
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
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
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
              style={styles.closeButton}
              onPress={() => {
                onClose();
                resetForm();
              }}
            >
              <Text style={styles.closeButtonText}>✕</Text>
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
                  style={styles.backButton}
                  onPress={prevStep}
                  disabled={saving || imageUploading}
                >
                  <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[
                  styles.nextButton,
                  (saving || imageUploading) && { opacity: 0.7 },
                ]}
                onPress={nextStep}
                disabled={saving || imageUploading}
              >
                <Text style={styles.nextButtonText}>
                  {currentStep === 2 ? "Confirm" : "Next"} →
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {(saving || imageUploading) && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#2046AE" />
              <Text style={styles.loadingText}>
                {imageUploading ? "Uploading image..." : "Saving product..."}
              </Text>
            </View>
          )}
        </SafeAreaView>
      </Modal>

      {visible && showInitialChoice && renderInitialChoice()}

      {visible && renderSearchModal()}

      <Modal visible={showScanner} transparent animationType="slide">
        <SafeAreaView style={styles.scannerModalContainer}>
          <View style={styles.scannerModalHeader}>
            <Text style={styles.scannerModalTitle}>Scan Barcode</Text>
            <TouchableOpacity
              onPress={() => {
                setShowScanner(false);
                setScannerScanned(false);
              }}
            >
              <Ionicons name="close" size={30} color="#FFF" />
            </TouchableOpacity>
          </View>
          {renderBarcodeScanner()}
        </SafeAreaView>
      </Modal>
    </>
  );
};

// Styles - Same as complete version with Poppins fonts
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    fontFamily: "Poppins-SemiBold",
  },
  closeButton: {
    padding: 5,
    backgroundColor: "#F0F0F0",
    borderRadius: 8,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    fontSize: 16,
    color: "#666",
    fontFamily: "Poppins-Regular",
  },
  errorText: {
    fontSize: 18,
    color: "#FF3B30",
    textAlign: "center",
    marginBottom: 20,
    fontFamily: "Poppins-Regular",
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
    width: 100,
    height: 4,
    backgroundColor: "black",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  bottomSheetHeader: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007AFF",
    textAlign: "center",
    marginBottom: 24,
    fontFamily: "Poppins-SemiBold",
  },
  initialChoiceTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
    textAlign: "center",
    marginBottom: 12,
    fontFamily: "Poppins-SemiBold",
  },
  initialChoiceSubtitle: {
    fontSize: 14,
    color: "#8E8E93",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 20,
    fontFamily: "Poppins-Regular",
  },
  searchButtonInitial: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 50,
    paddingVertical: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  searchButtonInitialText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
    fontFamily: "Poppins-Medium",
  },
  addManuallyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    backgroundColor: "#007AFF",
    borderRadius: 50,
    paddingVertical: 16,
  },
  addManuallyButtonText: {
    fontSize: 16,
    color: "#FFF",
    fontWeight: "600",
    fontFamily: "Poppins-SemiBold",
  },
  searchModalContainer: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  searchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  searchHeaderTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    fontFamily: "Poppins-SemiBold",
  },
  searchCloseButton: {
    padding: 5,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    marginHorizontal: 15,
    marginVertical: 15,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#000",
    fontFamily: "Poppins-Regular",
  },
  clearSearchButton: {
    padding: 5,
  },
  searchContent: {
    flex: 1,
  },
  recentSearchesSection: {
    backgroundColor: "#FFF",
    paddingVertical: 10,
  },
  recentSearchesHeader: {
    fontSize: 12,
    fontWeight: "600",
    color: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontFamily: "Poppins-SemiBold",
  },
  recentSearchItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  recentSearchText: {
    fontSize: 15,
    color: "#000",
    marginLeft: 15,
    fontFamily: "Poppins-Regular",
  },
  searchResultsSection: {
    flex: 1,
  },
  searchResultsHeader: {
    fontSize: 14,
    color: "#666",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#F5F7FA",
    fontFamily: "Poppins-Regular",
  },
  searchQueryText: {
    fontWeight: "600",
    color: "#007AFF",
    fontFamily: "Poppins-SemiBold",
  },
  searchLoadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  searchResultImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 15,
  },
  searchResultImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  searchResultInfo: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  searchResultName: {
    fontSize: 15,
    fontWeight: "500",
    color: "#000",
    flex: 1,
    fontFamily: "Poppins-Medium",
  },
  searchResultButton: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "500",
    fontFamily: "Poppins-Medium",
  },
  noResultsContainer: {
    padding: 40,
    alignItems: "center",
  },
  noResultsText: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    fontFamily: "Poppins-Regular",
  },
  progressContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  stepContainer: {
    flex: 1,
    alignItems: "center",
  },
  stepIndicator: {
    height: 4,
    borderRadius: 2,
    marginBottom: 8,
    backgroundColor: "#E0E0E0",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#007AFF",
    borderRadius: 2,
  },
  stepText: {
    fontSize: 12,
    fontWeight: "500",
    fontFamily: "Poppins-Medium",
  },
  stepContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
    fontFamily: "Poppins-SemiBold",
  },
  required: {
    color: "#FF3B30",
  },
  input: {
    backgroundColor: "#F0F4F8",
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    color: "#000",
    fontFamily: "Poppins-Regular",
  },
  inputWithButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  scanButton: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#007AFF",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  dropdown: {
    backgroundColor: "#F0F4F8",
    borderRadius: 8,
    padding: 15,
  },
  dropdownText: {
    fontSize: 16,
    color: "#000",
    fontFamily: "Poppins-Regular",
  },
  dropdownPlaceholder: {
    fontSize: 16,
    color: "#999",
    fontFamily: "Poppins-Regular",
  },
  imageUploadContainer: {
    borderWidth: 2,
    borderColor: "#E0E0E0",
    borderStyle: "dashed",
    borderRadius: 8,
    padding: 20,
    alignItems: "center",
  },
  uploadedImageContainer: {
    alignItems: "center",
  },
  uploadedImage: {
    width: 150,
    height: 150,
    borderRadius: 8,
    marginBottom: 10,
  },
  removeButton: {
    borderWidth: 1,
    borderColor: "#FF3B30",
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  removeButtonText: {
    color: "#FF3B30",
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Poppins-Medium",
  },
  imageUploadArea: {
    alignItems: "center",
  },
  imageUploadIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  imageUploadText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 15,
    fontFamily: "Poppins-Regular",
  },
  imageUploadInfo: {
    fontSize: 12,
    color: "#999",
    marginBottom: 5,
    fontFamily: "Poppins-Regular",
  },
  radioGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
    marginBottom: 10,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#007AFF",
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFF",
  },
  radioText: {
    fontSize: 14,
    color: "#000",
    fontFamily: "Poppins-Regular",
  },
  priceInput: {
    flexDirection: "row",
    backgroundColor: "#F0F4F8",
    borderRadius: 8,
    alignItems: "center",
    paddingLeft: 15,
    marginBottom: 15,
  },
  currency: {
    fontSize: 16,
    color: "#666",
    marginRight: 5,
    fontFamily: "Poppins-Regular",
  },
  priceTextInput: {
    flex: 1,
    padding: 15,
    paddingLeft: 0,
    fontSize: 16,
    color: "#000",
    fontFamily: "Poppins-Regular",
  },
  priceOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  priceOption: {
    backgroundColor: "#F0F4F8",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  priceOptionText: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "500",
    fontFamily: "Poppins-Medium",
  },
  dateInputs: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: -5,
  },
  dateInput: {
    backgroundColor: "#F0F4F8",
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    color: "#000",
    flex: 1,
    marginHorizontal: 5,
    textAlign: "center",
    fontFamily: "Poppins-Regular",
  },
  supplierSection: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 20,
    marginTop: 10,
  },
  navigationButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  backButton: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingHorizontal: 30,
    paddingVertical: 15,
    flex: 1,
    marginRight: 10,
    alignItems: "center",
  },
  backButtonText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
    fontFamily: "Poppins-Medium",
  },
  nextButton: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    paddingHorizontal: 30,
    paddingVertical: 15,
    flex: 1,
    marginLeft: 10,
    alignItems: "center",
  },
  nextButtonText: {
    fontSize: 16,
    color: "#FFF",
    fontWeight: "600",
    fontFamily: "Poppins-SemiBold",
  },
  summaryContent: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  summaryTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
    padding: 20,
    paddingBottom: 10,
    fontFamily: "Poppins-Bold",
  },
  summaryImageContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  summaryImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  summarySection: {
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 12,
    padding: 20,
  },
  summaryHeader: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000",
    marginBottom: 15,
    letterSpacing: 0.5,
    fontFamily: "Poppins-Bold",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#666",
    flex: 1,
    fontFamily: "Poppins-Regular",
  },
  summaryValue: {
    fontSize: 14,
    color: "#000",
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
    fontFamily: "Poppins-Medium",
  },
  saveProductButton: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    marginHorizontal: 20,
    marginVertical: 20,
    paddingVertical: 18,
    alignItems: "center",
  },
  saveProductButtonText: {
    fontSize: 16,
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
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 18,
    color: "#2046AE",
    fontWeight: "500",
    fontFamily: "Poppins-Medium",
  },
  uploadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  scannerModalContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  scannerModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  scannerModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFF",
    fontFamily: "Poppins-SemiBold",
  },
  scannerContainer: {
    flex: 1,
  },
  scannerMessageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  scannerMessageText: {
    fontSize: 18,
    color: "#FFF",
    textAlign: "center",
    padding: 20,
    fontFamily: "Poppins-Regular",
  },
  scanTargetOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: width / 2,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  scanTargetText: {
    backgroundColor: "rgba(0,0,0,0.5)",
    color: "#FFF",
    padding: 10,
    borderRadius: 5,
    marginTop: 100,
    fontFamily: "Poppins-Regular",
  },
  scannerScannedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 122, 255, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  scannerScannedText: {
    marginTop: 10,
    fontSize: 18,
    color: "#FFF",
    fontWeight: "bold",
    fontFamily: "Poppins-Bold",
  },
});

export default AddProductFlow;