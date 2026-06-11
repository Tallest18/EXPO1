import { FormData } from "@/hooks/useAddProductForm";
import { formatCurrency, formatNumber } from "@/utils/formatters";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ProductSummaryView, {
  SummaryRowData,
  SummarySection,
} from "./ProductSummaryView";

const { width } = Dimensions.get("window");
const isSmall = width < 360;

const PRICE_CHIPS = ["100", "500", "1000", "5000", "10000", "15000"];

const LOW_STOCK_OPTIONS = ["5", "10", "15", "20", "25", "50", "100"];

// ─── Shared sub-components ────────────────────────────────────────────────────

const FieldLabel: React.FC<{ label: string; required?: boolean }> = ({
  label,
  required,
}) => {
  const hintIndex = label.indexOf("(");
  const mainLabel =
    hintIndex >= 0 ? label.slice(0, hintIndex).trimEnd() : label;
  const hintLabel = hintIndex >= 0 ? label.slice(hintIndex) : "";
  return (
    <Text style={styles.label}>
      {mainLabel}
      {hintLabel ? <Text style={styles.labelHint}> {hintLabel}</Text> : null}
      {required && <Text style={styles.required}> *</Text>}
    </Text>
  );
};

const PriceField: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
}> = ({ label, value, onChange }) => (
  <View style={styles.fieldGroup}>
    <FieldLabel label={label} required />
    <View style={styles.priceInputRow}>
      <View style={styles.currencyBox}>
        <Text style={styles.currency}>₦</Text>
      </View>
      <TextInput
        style={styles.priceInput}
        placeholder="0.00"
        placeholderTextColor="#CBD5E0"
        value={value}
        onChangeText={onChange}
        keyboardType="numeric"
      />
    </View>
    <View style={styles.priceOptionsRow}>
      {PRICE_CHIPS.map((price) => (
        <TouchableOpacity
          key={price}
          style={styles.priceChip}
          onPress={() => onChange(price)}
        >
          <Text style={styles.priceChipText}>₦{formatNumber(price)}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

const NumericField: React.FC<{
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}> = ({ label, placeholder, value, onChange }) => (
  <View style={styles.fieldGroup}>
    <FieldLabel label={label} required />
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      placeholderTextColor="#CBD5E0"
      value={value}
      onChangeText={onChange}
      keyboardType="numeric"
    />
  </View>
);

// ─── Step 1: Product Info ─────────────────────────────────────────────────────

interface ProductInfoStepProps {
  formData: FormData;
  updateFormData: (field: string, value: any) => void;
  availableCategories: Array<{ id: number; name: string }>;
  categoriesLoading: boolean;
  showCategoryDropdown: boolean;
  setShowCategoryDropdown: (v: boolean) => void;
  imageUploading: boolean;
  onPickImage: (useCamera: boolean) => void;
  onScanBarcode?: () => void;
}

export const ProductInfoStep: React.FC<ProductInfoStepProps> = ({
  formData,
  updateFormData,
  availableCategories,
  categoriesLoading,
  showCategoryDropdown,
  setShowCategoryDropdown,
  imageUploading,
  onPickImage,
  onScanBarcode,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.stepContent}
      contentContainerStyle={[
        styles.stepContentContainer,
        { paddingBottom: 36 + insets.bottom },
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Card 1: Product Name, SKU, and Category */}
      <View style={styles.card}>
        {/* Product Name */}
        <View style={styles.fieldGroup}>
          <FieldLabel label="Product Name" required />
          <TextInput
            style={styles.input}
            placeholder="Type here..."
            placeholderTextColor="#CBD5E0"
            value={formData.productName}
            onChangeText={(v) => updateFormData("productName", v)}
          />
        </View>

        {/* SKU / Barcode */}
        {/* <View style={styles.fieldGroup}>
        <FieldLabel label="SKU / Barcode" required />
        <View style={styles.skuRow}>
          <TextInput
            style={[styles.input, styles.skuInput]}
            placeholder="Type 8 – 13 digits here..."
            placeholderTextColor="#CBD5E0"
            value={formData.barcode}
            onChangeText={(v) => updateFormData("barcode", v)}
            keyboardType="numeric"
          />
          <TouchableOpacity style={styles.scanButton} onPress={onScanBarcode}>
            <Ionicons name="camera-outline" size={18} color="#1155CC" />
            <Text style={styles.scanButtonText}>Scan</Text>
          </TouchableOpacity>
        </View>
      </View> */}

        {/* Product Category */}
        <View style={[styles.fieldGroup, { marginBottom: 0 }]}>
          <FieldLabel label="Product Category" required />
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() =>
              !categoriesLoading &&
              availableCategories.length > 0 &&
              setShowCategoryDropdown(!showCategoryDropdown)
            }
          >
            <Text
              style={
                formData.category
                  ? styles.dropdownText
                  : styles.dropdownPlaceholder
              }
            >
              {categoriesLoading
                ? "Loading categories..."
                : formData.category || "Category"}
            </Text>
            <Ionicons
              name={showCategoryDropdown ? "chevron-up" : "chevron-down"}
              size={18}
              color="#718096"
            />
          </TouchableOpacity>

          {showCategoryDropdown && (
            <View style={styles.dropdownMenu}>
              {availableCategories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={styles.dropdownItem}
                  onPress={() => {
                    updateFormData("category", category.name);
                    setShowCategoryDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{category.name}</Text>
                  {formData.category === category.name && (
                    <Ionicons name="checkmark" size={18} color="#1155CC" />
                  )}
                </TouchableOpacity>
              ))}
              {!availableCategories.length && (
                <View style={styles.dropdownItem}>
                  <Text style={styles.dropdownItemText}>
                    No categories available
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Card 2: Upload Product Image */}
      <View style={styles.card}>
        <View style={styles.fieldGroup}>
          <FieldLabel label="Upload Product Image" required />

          {formData.productImage ? (
            /* ── Image uploaded state ── */
            <View>
              <View style={styles.uploadedImageWrap}>
                <Image
                  source={{ uri: formData.productImage.uri }}
                  style={styles.uploadedImage}
                  resizeMode="cover"
                />
              </View>
              <View style={styles.imageActionsRow}>
                <TouchableOpacity
                  style={styles.changeImageBtn}
                  onPress={() => onPickImage(false)}
                  disabled={imageUploading}
                >
                  <Ionicons name="crop-outline" size={16} color="#1155CC" />
                  <Text style={styles.changeImageBtnText}>Change / Crop</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.removeImageBtn}
                  onPress={() => updateFormData("productImage", null)}
                  disabled={imageUploading}
                >
                  <Ionicons name="trash-outline" size={16} color="#E53E3E" />
                  <Text style={styles.removeImageBtnText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* ── Empty upload state ── */
            <View style={styles.imageUploadBox}>
              {/* Image icon */}
              <Ionicons
                name="image-outline"
                size={40}
                color="#1155CC"
                style={styles.imageIcon}
              />

              <Text style={styles.imageUploadTitle}>
                Click to take a picture, or select{"\n"}from gallery
              </Text>

              {/* Take Picture — single outlined button */}
              <TouchableOpacity
                style={styles.takePictureBtn}
                onPress={() => onPickImage(true)}
                disabled={imageUploading}
              >
                <Text style={styles.takePictureBtnText}>Take Picture</Text>
              </TouchableOpacity>

              {/* Select from gallery — text link */}
              <TouchableOpacity
                onPress={() => onPickImage(false)}
                disabled={imageUploading}
                hitSlop={8}
              >
                <Text style={styles.galleryLinkText}>Select from gallery</Text>
              </TouchableOpacity>

              {/* File info */}
              <Text style={styles.imageUploadInfo}>
                Files Supported:{" "}
                <Text style={styles.imageUploadInfoBold}>PNG, JPG, SVG</Text>.
                {"\n"}Maximum Size{" "}
                <Text style={styles.imageUploadInfoBold}>1MB</Text>
              </Text>

              {imageUploading && (
                <ActivityIndicator
                  size="small"
                  color="#1155CC"
                  style={{ marginTop: 8 }}
                />
              )}

              <Text style={styles.orSeparator}>or</Text>

              {/* Search online inside the dashed box */}
              <View style={styles.searchOnlineInner}>
                <Ionicons name="search-outline" size={16} color="#718096" />
                <Text style={styles.searchOnlineInnerText}>Search online</Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

// ─── Step 2: Pricing & Packaging ─────────────────────────────────────────────

interface PricingStepProps {
  formData: FormData;
  updateFormData: (field: string, value: any) => void;
}

export const PricingStep: React.FC<PricingStepProps> = ({
  formData,
  updateFormData,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.stepContent}
      contentContainerStyle={[
        styles.stepContentContainer,
        { paddingBottom: 36 + insets.bottom },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.card}>
        <View style={styles.fieldGroup}>
          <FieldLabel label="Quantity Type:" required />
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
            <NumericField
              label="No. of Items (Unit)"
              placeholder="How many pieces dey inside one carton?"
              value={formData.numberOfItems}
              onChange={(v) => updateFormData("numberOfItems", v)}
            />
            <PriceField
              label="Cost Price (How much you buy am?)"
              value={formData.costPrice}
              onChange={(v) => updateFormData("costPrice", v)}
            />
            <PriceField
              label="Selling Price (How much you won sell am?)"
              value={formData.sellingPrice}
              onChange={(v) => updateFormData("sellingPrice", v)}
            />
          </>
        )}

        {(formData.quantityType === "Carton" ||
          formData.quantityType === "Both") && (
          <>
            <NumericField
              label="Units per Carton"
              placeholder="How many pieces dey inside one carton?"
              value={formData.unitsPerCarton}
              onChange={(v) => updateFormData("unitsPerCarton", v)}
            />
            <NumericField
              label="No. of Cartons"
              placeholder="How many carton?"
              value={formData.numberOfCartons}
              onChange={(v) => updateFormData("numberOfCartons", v)}
            />
            <PriceField
              label="Cost Price (How much you buy 1 carton?)"
              value={formData.costPricePerCarton}
              onChange={(v) => updateFormData("costPricePerCarton", v)}
            />
            <PriceField
              label={
                formData.quantityType === "Both"
                  ? "Selling Price (for 1 carton?)"
                  : "Selling Price (How much you won sell am?)"
              }
              value={formData.sellingPricePerCarton}
              onChange={(v) => updateFormData("sellingPricePerCarton", v)}
            />
          </>
        )}

        {formData.quantityType === "Both" && (
          <PriceField
            label="Selling Price (for 1 unit item inside?)"
            value={formData.sellingPricePerUnit}
            onChange={(v) => updateFormData("sellingPricePerUnit", v)}
          />
        )}
      </View>
    </ScrollView>
  );
};

// ─── Step 3: Stock & Extras ───────────────────────────────────────────────────

interface StockExtrasStepProps {
  formData: FormData;
  updateFormData: (field: string, value: any) => void;
}

export const StockExtrasStep: React.FC<StockExtrasStepProps> = ({
  formData,
  updateFormData,
}) => {
  const insets = useSafeAreaInsets();
  const [showThresholdDropdown, setShowThresholdDropdown] = useState(false);

  return (
    <ScrollView
      style={styles.stepContent}
      contentContainerStyle={[
        styles.stepContentContainer,
        { paddingBottom: 36 + insets.bottom },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Card 1: Stock settings */}
      <View style={styles.card}>
        <View style={styles.fieldGroup}>
          <FieldLabel label="Low stock Threshold" required />
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowThresholdDropdown(!showThresholdDropdown)}
          >
            <Text
              style={
                formData.lowStockThreshold
                  ? styles.dropdownText
                  : styles.dropdownPlaceholder
              }
            >
              {formData.lowStockThreshold || "Select Number"}
            </Text>
            <Ionicons
              name={showThresholdDropdown ? "chevron-up" : "chevron-down"}
              size={18}
              color="#718096"
            />
          </TouchableOpacity>

          {showThresholdDropdown && (
            <View style={styles.dropdownMenu}>
              {LOW_STOCK_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={styles.dropdownItem}
                  onPress={() => {
                    updateFormData("lowStockThreshold", option);
                    setShowThresholdDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{option}</Text>
                  {formData.lowStockThreshold === option && (
                    <Ionicons name="checkmark" size={18} color="#1155CC" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={[styles.fieldGroup, { marginBottom: 0 }]}>
          <Text style={styles.label}>Expiry Date</Text>
          <View style={styles.dateRow}>
            <TextInput
              style={styles.dateBox}
              placeholder="DD"
              placeholderTextColor="#CBD5E0"
              value={formData.expiryDate.day}
              onChangeText={(v) => updateFormData("expiryDate.day", v)}
              keyboardType="numeric"
              maxLength={2}
            />
            <TextInput
              style={styles.dateBox}
              placeholder="MM"
              placeholderTextColor="#CBD5E0"
              value={formData.expiryDate.month}
              onChangeText={(v) => updateFormData("expiryDate.month", v)}
              keyboardType="numeric"
              maxLength={2}
            />
            <TextInput
              style={styles.dateBox}
              placeholder="YYYY"
              placeholderTextColor="#CBD5E0"
              value={formData.expiryDate.year}
              onChangeText={(v) => updateFormData("expiryDate.year", v)}
              keyboardType="numeric"
              maxLength={4}
            />
          </View>
        </View>
      </View>

      {/* Card 2: Supplier info — separate card as per UI */}
      <View style={styles.card}>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Supplier</Text>
          <TextInput
            style={styles.input}
            placeholder="Full Name..."
            placeholderTextColor="#CBD5E0"
            value={formData.supplier.name}
            onChangeText={(v) => updateFormData("supplier.name", v)}
          />
        </View>

        <View style={[styles.fieldGroup, { marginBottom: 0 }]}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Type here..."
            placeholderTextColor="#CBD5E0"
            value={formData.supplier.phone}
            onChangeText={(v) => updateFormData("supplier.phone", v)}
            keyboardType="phone-pad"
          />
        </View>
      </View>
    </ScrollView>
  );
};

// ─── Summary ──────────────────────────────────────────────────────────────────

interface ProductSummaryProps {
  visible: boolean;
  formData: FormData;
  saving: boolean;
  imageUploading: boolean;
  barcodeScanning?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const ProductSummary: React.FC<ProductSummaryProps> = ({
  visible,
  formData,
  saving,
  imageUploading,
  barcodeScanning,
  onConfirm,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const totalUnits =
    (parseInt(formData.unitsPerCarton) || 0) *
    (parseInt(formData.numberOfCartons) || 0);

  const expiryDisplay =
    formData.expiryDate.month && formData.expiryDate.year
      ? `${getMonthName(formData.expiryDate.month)} ${formData.expiryDate.year}`
      : "N/A";

  // Product Info
  const infoRows: SummaryRowData[] = [
    { label: "Name:", value: formData.productName || "N/A" },
    { label: "Category:", value: formData.category || "N/A" },
  ];
  if (formData.barcode) {
    infoRows.push({ label: "Barcode:", value: formData.barcode });
  }

  // Quantity & Pricing (varies by quantity type)
  const pricingRows: SummaryRowData[] = [];
  if (formData.quantityType === "Single Items") {
    pricingRows.push(
      { label: "Units in Stock:", value: formatNumber(formData.numberOfItems) },
      { label: "Unit Type:", value: "Single" },
      { label: "Cost Price:", value: formatCurrency(formData.costPrice) },
      {
        label: "Selling Price:",
        value: formatCurrency(formData.sellingPrice),
      },
    );
  }
  if (
    formData.quantityType === "Carton" ||
    formData.quantityType === "Both"
  ) {
    pricingRows.push(
      {
        label: "Units per Carton:",
        value: formatNumber(formData.unitsPerCarton),
      },
      {
        label: "Number of Cartons:",
        value: formatNumber(formData.numberOfCartons),
      },
      { label: "Total Units:", value: formatNumber(totalUnits) },
      { label: "Unit Type:", value: "Carton" },
      {
        label: "Cost Price (per carton):",
        value: formatCurrency(formData.costPricePerCarton),
      },
      {
        label: "Selling Price (per carton):",
        value: formatCurrency(formData.sellingPricePerCarton),
      },
    );
  }
  if (formData.quantityType === "Both") {
    pricingRows.push({
      label: "Selling Price (per unit):",
      value: formatCurrency(formData.sellingPricePerUnit),
    });
  }

  const sections: SummarySection[] = [
    { title: "Product Info", rows: infoRows },
    { title: "Quantity & Pricing", rows: pricingRows },
    {
      title: "Stock Settings",
      rows: [
        {
          label: "Low Stock Threshold:",
          value: formData.lowStockThreshold || "10",
        },
        { label: "Expiry Date:", value: expiryDisplay },
      ],
    },
    {
      title: "Supplier Info",
      rows: [
        { label: "Name:", value: formData.supplier.name || "N/A" },
        { label: "Phone no:", value: formData.supplier.phone || "N/A" },
      ],
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.summaryOverlay}>
        <View style={[styles.summarySheet, { height: "94%" }]}>
          {/* Grabber handle */}
          <View style={styles.summaryGrabber} />

          {/* Header */}
          <View style={styles.summarySheetHeader}>
            <Text style={styles.summarySheetTitle}>Summary</Text>
            <TouchableOpacity
              style={styles.summaryCloseBtn}
              onPress={onClose}
              hitSlop={10}
            >
              <Ionicons name="close" size={24} color="#1A202C" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.summaryScroll}
            contentContainerStyle={{ paddingBottom: 32 + insets.bottom }}
            showsVerticalScrollIndicator={false}
          >
            <ProductSummaryView
              imageUri={formData.productImage?.uri}
              sections={sections}
              footer={
                <TouchableOpacity
                  style={[
                    styles.confirmBtn,
                    (saving || imageUploading) && { opacity: 0.7 },
                  ]}
                  onPress={onConfirm}
                  disabled={saving || imageUploading}
                >
                  {saving || imageUploading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Text style={styles.confirmBtnText}>Save Product</Text>
                      <Ionicons name="checkmark" size={20} color="#FFF" />
                    </>
                  )}
                </TouchableOpacity>
              }
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function getMonthName(month: string): string {
  const m = parseInt(month, 10);
  if (m >= 1 && m <= 12) return MONTH_NAMES[m - 1];
  return month;
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  stepContent: {
    flex: 1,
    paddingHorizontal: isSmall ? 10 : 16,
    paddingTop: isSmall ? 10 : 16,
  },
  // Review/summary step renders the shared ProductSummaryView (white sections),
  // so it uses a plain white scroll surface like the ProductDetails screen.
  summaryScroll: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  // Summary bottom-sheet modal
  summaryOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  summarySheet: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  summaryGrabber: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#CBD5E0",
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 4,
  },
  summarySheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  summarySheetTitle: {
    fontSize: 24,
    color: "#1C1C1C",
    fontFamily: "DMSans_700Bold",
  },
  summaryCloseBtn: {
    padding: 4,
  },
  stepContentContainer: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: isSmall ? 12 : 16,
    marginBottom: isSmall ? 10 : 16,
  },
  fieldGroup: {
    marginBottom: isSmall ? 10 : 16,
    display: "flex",
    flexDirection: "column",
    gap: isSmall ? 6 : 8,
  },
  label: {
    fontSize: isSmall ? 11 : 13,
    color: "#2D3748",
    marginBottom: 5,
    fontFamily: "DMSans_600SemiBold",
  },
  labelHint: {
    color: "#718096",
    fontFamily: "DMSans_400Regular",
  },
  required: {
    color: "#E53E3E",
  },
  input: {
    backgroundColor: "#EDF2F7",
    borderRadius: 6,
    paddingVertical: isSmall ? 8 : 12,
    paddingHorizontal: isSmall ? 10 : 12,
    fontSize: isSmall ? 11 : 13,
    color: "#2D3748",
    fontFamily: "DMSans_400Regular",
  },

  // SKU row
  skuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: isSmall ? 6 : 10,
  },
  skuInput: {
    flex: 1,
  },
  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderWidth: 1.5,
    borderColor: "#1155CC",
    borderRadius: 8,
    paddingHorizontal: isSmall ? 10 : 14,
    paddingVertical: isSmall ? 8 : 12,
    backgroundColor: "#FFF",
  },
  scanButtonText: {
    fontSize: isSmall ? 11 : 13,
    color: "#1155CC",
    fontFamily: "DMSans_600SemiBold",
  },

  // Dropdown
  dropdown: {
    backgroundColor: "#EDF2F7",
    borderRadius: 6,
    paddingVertical: isSmall ? 8 : 12,
    paddingHorizontal: isSmall ? 10 : 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownText: {
    fontSize: isSmall ? 11 : 13,
    color: "#2D3748",
    fontFamily: "DMSans_400Regular",
    flex: 1,
  },
  dropdownPlaceholder: {
    fontSize: isSmall ? 11 : 13,
    color: "#CBD5E0",
    fontFamily: "DMSans_400Regular",
    flex: 1,
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
    paddingVertical: isSmall ? 8 : 12,
    paddingHorizontal: isSmall ? 10 : 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F7FAFC",
  },
  dropdownItemText: {
    fontSize: isSmall ? 11 : 13,
    color: "#2D3748",
    fontFamily: "DMSans_400Regular",
  },

  // Image upload box — dashed border
  imageUploadBox: {
    borderWidth: 1.5,
    borderColor: "#CBD5E0",
    borderStyle: "dashed",
    borderRadius: 8,
    paddingVertical: isSmall ? 16 : 24,
    paddingHorizontal: isSmall ? 12 : 16,
    alignItems: "center",
  },
  imageIcon: {
    marginBottom: isSmall ? 8 : 12,
  },
  imageUploadTitle: {
    fontSize: isSmall ? 12 : 14,
    color: "#94A3B8",
    marginBottom: isSmall ? 14 : 18,
    textAlign: "center",
    lineHeight: 22,
    fontFamily: "DMSans_400Regular",
  },
  // "Take Picture" — single outlined button, centered
  takePictureBtn: {
    alignSelf: "center",
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#1155CC",
    borderRadius: 8,
    paddingVertical: isSmall ? 10 : 12,
    paddingHorizontal: isSmall ? 32 : 48,
    marginBottom: isSmall ? 12 : 16,
  },
  takePictureBtnText: {
    fontSize: isSmall ? 13 : 15,
    color: "#1155CC",
    fontFamily: "DMSans_500Medium",
    textAlign: "center",
  },
  // "Select from gallery" — underlined text link
  galleryLinkText: {
    fontSize: isSmall ? 12 : 14,
    color: "#1155CC",
    fontFamily: "DMSans_500Medium",
    textDecorationLine: "underline",
    marginBottom: isSmall ? 14 : 18,
  },
  imageUploadInfo: {
    fontSize: isSmall ? 9 : 11,
    color: "#94A3B8",
    textAlign: "center",
    fontFamily: "DMSans_400Regular",
    lineHeight: 16,
    marginBottom: isSmall ? 6 : 8,
  },
  imageUploadInfoBold: {
    color: "#4A5568",
    fontFamily: "DMSans_600SemiBold",
  },
  orSeparator: {
    fontSize: isSmall ? 10 : 12,
    color: "#A0AEC0",
    fontFamily: "DMSans_400Regular",
    marginVertical: isSmall ? 6 : 8,
  },
  // "Search online" pill inside dashed box
  searchOnlineInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#EDF2F7",
    borderRadius: 10,
    paddingHorizontal: isSmall ? 16 : 24,
    paddingVertical: isSmall ? 8 : 10,
  },
  searchOnlineInnerText: {
    fontSize: isSmall ? 11 : 13,
    color: "#718096",
    fontFamily: "DMSans_500Medium",
  },

  // Uploaded image state
  uploadedImageWrap: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  uploadedImage: {
    width: "100%",
    height: "100%",
  },
  imageActionsRow: {
    flexDirection: "row",
    width: "100%",
    gap: isSmall ? 8 : 12,
    marginTop: isSmall ? 10 : 12,
    marginBottom: isSmall ? 10 : 12,
  },
  changeImageBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#1155CC",
    borderRadius: 8,
    paddingVertical: isSmall ? 9 : 11,
  },
  changeImageBtnText: {
    fontSize: isSmall ? 12 : 14,
    color: "#1155CC",
    fontFamily: "DMSans_500Medium",
  },
  removeImageBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#E53E3E",
    borderRadius: 8,
    paddingVertical: isSmall ? 9 : 11,
  },
  removeImageBtnText: {
    fontSize: isSmall ? 12 : 14,
    color: "#E53E3E",
    fontFamily: "DMSans_500Medium",
  },

  // Radio
  radioGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: isSmall ? 8 : 14,
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
    marginRight: 5,
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
    fontSize: isSmall ? 11 : 13,
    color: "#2D3748",
    fontFamily: "DMSans_400Regular",
  },

  // Price fields
  priceInputRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: isSmall ? 6 : 10,
    marginBottom: isSmall ? 10 : 12,
  },
  currencyBox: {
    width: isSmall ? 44 : 56,
    backgroundColor: "#EDF2F7",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  currency: {
    fontSize: isSmall ? 13 : 15,
    color: "#4A5568",
    fontFamily: "DMSans_500Medium",
  },
  priceInput: {
    flex: 1,
    backgroundColor: "#EDF2F7",
    borderRadius: 6,
    paddingVertical: isSmall ? 10 : 14,
    paddingHorizontal: isSmall ? 12 : 14,
    fontSize: isSmall ? 12 : 14,
    color: "#2D3748",
    fontFamily: "DMSans_400Regular",
  },
  priceOptionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: isSmall ? 8 : 12,
  },
  priceChip: {
    width: "31.5%",
    backgroundColor: "#EDF2F7",
    borderRadius: 6,
    paddingVertical: isSmall ? 10 : 14,
    alignItems: "center",
    justifyContent: "center",
  },
  priceChipText: {
    fontSize: isSmall ? 11 : 13,
    color: "#4A5568",
    fontFamily: "DMSans_500Medium",
  },

  // Date fields
  dateRow: {
    flexDirection: "row",
    gap: isSmall ? 5 : 10,
  },
  dateBox: {
    backgroundColor: "#EDF2F7",
    borderRadius: 6,
    paddingVertical: isSmall ? 8 : 12,
    paddingHorizontal: isSmall ? 2 : 8,
    fontSize: isSmall ? 11 : 13,
    color: "#2D3748",
    flex: 1,
    textAlign: "center",
    fontFamily: "DMSans_400Regular",
    minWidth: 0,
  },

  // Summary
  confirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#1155CC",
    borderRadius: 10,
    paddingVertical: isSmall ? 14 : 16,
    marginTop: 4,
    marginBottom: 8,
  },
  confirmBtnText: {
    fontSize: isSmall ? 13 : 15,
    color: "#FFF",
    fontFamily: "DMSans_600SemiBold",
  },
});
