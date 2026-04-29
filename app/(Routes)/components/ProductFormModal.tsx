import { FormData } from "@/hooks/useAddProductForm";
import { useProductsData } from "@/hooks/useProductsData";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  PricingStep,
  ProductInfoStep,
  ProductSummary,
  StockExtrasStep,
} from "./ProductFormSteps";
import { useImagePicker } from "./useImagePicker";

const { width } = Dimensions.get("window");
const isSmall = width < 360;

const STEPS = ["Product Info", "Pricing & Packaging", "Stock & Extras"];

interface Props {
  visible: boolean;
  formData: FormData;
  saving: boolean;
  updateFormData: (field: string, value: any) => void;
  onSave: () => void;
  onClose: () => void;
  onScanBarcode?: () => void;
  title?: string;
}

const ProductFormModal: React.FC<Props> = ({
  visible,
  formData,
  saving,
  updateFormData,
  onSave,
  onClose,
  onScanBarcode,
  title,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [imageUploading] = useState(false);
  const { categories, dataLoading: categoriesLoading } = useProductsData();
  const availableCategories = (categories?.results || []).map((c: any) => ({
    id: c.id,
    name: c.name,
  }));
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const { pickImage } = useImagePicker((image) =>
    updateFormData("productImage", image),
  );

  // (category fetching now handled by TanStack Query)

  // Reset step when modal opens
  useEffect(() => {
    if (visible) setCurrentStep(0);
  }, [visible]);

  const validateStep = (step: number): boolean => {
    if (step === 0) {
      return !!(formData.productName && formData.category);
    }
    if (step === 1) {
      if (formData.quantityType === "Single Items") {
        return !!(
          formData.numberOfItems &&
          formData.costPrice &&
          formData.sellingPrice
        );
      }
      if (formData.quantityType === "Carton") {
        return !!(
          formData.unitsPerCarton &&
          formData.numberOfCartons &&
          formData.costPricePerCarton &&
          formData.sellingPricePerCarton
        );
      }
      if (formData.quantityType === "Both") {
        return !!(
          formData.unitsPerCarton &&
          formData.numberOfCartons &&
          formData.costPricePerCarton &&
          formData.sellingPricePerCarton &&
          formData.sellingPricePerUnit
        );
      }
    }
    return true;
  };

  const nextStep = () => {
    if (!validateStep(currentStep)) {
      return;
    }
    setCurrentStep((s) => Math.min(s + 1, 3));
  };

  const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 0));

  const renderProgressBar = () => (
    <View style={styles.progressBarWrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.progressContainer}
      >
        {STEPS.map((step, index) => (
          <View key={index} style={styles.stepItem}>
            <Text
              style={[
                styles.stepText,
                index <= currentStep
                  ? styles.stepTextActive
                  : styles.stepTextInactive,
              ]}
              numberOfLines={1}
            >
              {step}
            </Text>
            <View
              style={[
                styles.stepBar,
                index <= currentStep
                  ? styles.stepBarActive
                  : styles.stepBarInactive,
              ]}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{title}</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={22} color="#1A202C" />
          </TouchableOpacity>
        </View>

        {currentStep < 3 && renderProgressBar()}

        {currentStep === 0 && (
          <ProductInfoStep
            formData={formData}
            updateFormData={updateFormData}
            availableCategories={availableCategories}
            categoriesLoading={categoriesLoading}
            showCategoryDropdown={showCategoryDropdown}
            setShowCategoryDropdown={setShowCategoryDropdown}
            imageUploading={imageUploading}
            onPickImage={pickImage}
            onScanBarcode={onScanBarcode}
          />
        )}
        {currentStep === 1 && (
          <PricingStep formData={formData} updateFormData={updateFormData} />
        )}
        {currentStep === 2 && (
          <StockExtrasStep
            formData={formData}
            updateFormData={updateFormData}
          />
        )}
        {currentStep === 3 && (
          <ProductSummary
            formData={formData}
            saving={saving}
            imageUploading={imageUploading}
            onConfirm={onSave}
          />
        )}

        {currentStep < 3 && (
          <View style={styles.navigationButtons}>
            <TouchableOpacity
              style={[styles.backBtn, currentStep === 0 && { opacity: 0.5 }]}
              onPress={prevStep}
              disabled={saving || imageUploading}
            >
              <Ionicons name="arrow-back" size={18} color="#4A5568" />
              <Text style={styles.backBtnText}>Back</Text>
            </TouchableOpacity>

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
    paddingHorizontal: isSmall ? 14 : 20,
    paddingVertical: isSmall ? 10 : 16,
    backgroundColor: "#E7EEFA",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerTitle: {
    fontSize: isSmall ? 16 : 20,
    color: "#1A202C",
    fontFamily: "DMSans_600SemiBold",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  progressBarWrapper: {
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    marginHorizontal: isSmall ? 12 : 20,
    marginVertical: isSmall ? 8 : 14,
    paddingHorizontal: isSmall ? 10 : 20,
    paddingVertical: isSmall ? 10 : 14,
    borderRadius: 8,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: isSmall ? 6 : 10,
    minWidth: "100%",
  },
  stepItem: {
    alignItems: "center",
    minWidth: 100, // Ensures enough width for long text
    marginRight: isSmall ? 6 : 10,
  },
  stepText: {
    fontSize: isSmall ? 9 : 12,
    fontFamily: "DMSans_500Medium",
    marginBottom: 5,
    minWidth: 80,
    textAlign: "center",
  },
  stepTextActive: { color: "#1155CC" },
  stepTextInactive: { color: "#A0AEC0" },
  progressBar: {
    height: isSmall ? 5 : 8,
    borderRadius: 4,
  },
  progressBarActive: { backgroundColor: "#1155CC" },
  progressBarInactive: { backgroundColor: "#E2E8F0" },
  navigationButtons: {
    flexDirection: "row",
    gap: isSmall ? 8 : 10,
    paddingHorizontal: isSmall ? 12 : 20,
    paddingVertical: isSmall ? 10 : 14,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  backBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingVertical: isSmall ? 10 : 12,
  },
  backBtnText: {
    fontSize: isSmall ? 12 : 14,
    color: "#4A5568",
    fontFamily: "DMSans_500Medium",
  },
  nextBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: "#1155CC",
    borderRadius: 8,
    paddingVertical: isSmall ? 10 : 12,
  },
  nextBtnText: {
    fontSize: isSmall ? 12 : 14,
    color: "#FFF",
    fontFamily: "DMSans_600SemiBold",
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
    fontSize: isSmall ? 12 : 14,
    color: "#1155CC",
    fontFamily: "DMSans_500Medium",
  },

  progressLineBackground: {
    height: 4,
    backgroundColor: "#E2E8F0",
    borderRadius: 2,
    marginTop: 6,
    marginHorizontal: 8,
    overflow: "hidden",
  },
  progressLineFill: {
    height: 4,
    backgroundColor: "#1155CC",
    borderRadius: 2,
  },

  stepBar: {
    height: 4,
    width: "100%", // or adjust as needed for your design
    borderRadius: 2,
    marginTop: 4,
  },
  stepBarActive: {
    backgroundColor: "#1155CC",
  },
  stepBarInactive: {
    backgroundColor: "#E2E8F0",
  },
});

export default ProductFormModal;
