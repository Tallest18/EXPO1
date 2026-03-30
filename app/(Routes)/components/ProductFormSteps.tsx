import { FormData } from "@/hooks/useAddProductForm";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
const isSmall = width < 360;

const PRICE_CHIPS = ["100", "200", "500", "800", "1000"];

// ─── Shared sub-components ────────────────────────────────────────────────────

const FieldLabel: React.FC<{ label: string; required?: boolean }> = ({
  label,
  required,
}) => (
  <Text style={styles.label}>
    {label} {required && <Text style={styles.required}>*</Text>}
  </Text>
);

const PriceField: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
}> = ({ label, value, onChange }) => (
  <View style={styles.fieldGroup}>
    <FieldLabel label={label} required />
    <View style={styles.priceInputWrapper}>
      <Text style={styles.currency}>₦</Text>
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
          <Text style={styles.priceChipText}>₦{price}</Text>
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
}) => (
  <ScrollView
    style={styles.stepContent}
    contentContainerStyle={styles.stepContentContainer}
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
      <View style={styles.fieldGroup}>
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
      </View>

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
          <View style={styles.imageUploadBox}>
            <Image
              source={{ uri: formData.productImage.uri }}
              style={styles.uploadedImage}
              resizeMode="contain"
            />
            <TouchableOpacity
              style={styles.removeImageBtn}
              onPress={() => updateFormData("productImage", null)}
            >
              <Text style={styles.removeImageBtnText}>Remove</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* ── Empty upload state ── */
          <View style={styles.imageUploadBox}>
            {/* Mountain / image icon */}
            <View style={styles.imageIconCircle}>
              <Ionicons name="image" size={40} color="#1155CC" />
            </View>

            <Text style={styles.imageUploadTitle}>
              Click to take a picture, or select{"\n"}from gallery
            </Text>

            {/* Take Picture button */}
            <TouchableOpacity
              style={styles.takePictureBtn}
              onPress={() => onPickImage(true)}
              disabled={imageUploading}
            >
              <Text style={styles.takePictureBtnText}>Take Picture</Text>
            </TouchableOpacity>

            {/* Select from gallery link */}
            <TouchableOpacity
              onPress={() => onPickImage(false)}
              disabled={imageUploading}
            >
              <Text style={styles.selectGalleryLink}>Select from gallery</Text>
            </TouchableOpacity>

            {/* File info */}
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

// ─── Step 2: Pricing & Packaging ─────────────────────────────────────────────

interface PricingStepProps {
  formData: FormData;
  updateFormData: (field: string, value: any) => void;
}

export const PricingStep: React.FC<PricingStepProps> = ({
  formData,
  updateFormData,
}) => (
  <ScrollView
    style={styles.stepContent}
    contentContainerStyle={styles.stepContentContainer}
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

// ─── Step 3: Stock & Extras ───────────────────────────────────────────────────

interface StockExtrasStepProps {
  formData: FormData;
  updateFormData: (field: string, value: any) => void;
}

export const StockExtrasStep: React.FC<StockExtrasStepProps> = ({
  formData,
  updateFormData,
}) => (
  <ScrollView
    style={styles.stepContent}
    contentContainerStyle={styles.stepContentContainer}
    showsVerticalScrollIndicator={false}
  >
    {/* Card 1: Stock settings */}
    <View style={styles.card}>
      <View style={styles.fieldGroup}>
        <FieldLabel label="Low stock Threshold" required />
        <TextInput
          style={styles.input}
          placeholder="Select Number"
          placeholderTextColor="#CBD5E0"
          value={formData.lowStockThreshold}
          onChangeText={(v) => updateFormData("lowStockThreshold", v)}
          keyboardType="numeric"
        />
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

// ─── Summary ──────────────────────────────────────────────────────────────────

interface ProductSummaryProps {
  formData: FormData;
  saving: boolean;
  imageUploading: boolean;
  barcodeScanning?: boolean;
  onConfirm: () => void;
}

export const ProductSummary: React.FC<ProductSummaryProps> = ({
  formData,
  saving,
  imageUploading,
  barcodeScanning,
  onConfirm,
}) => {
  const totalUnits =
    (parseInt(formData.unitsPerCarton) || 0) *
    (parseInt(formData.numberOfCartons) || 0);

  const expiryDisplay =
    formData.expiryDate.month && formData.expiryDate.year
      ? `${getMonthName(formData.expiryDate.month)} ${formData.expiryDate.year}`
      : "N/A";

  return (
    <ScrollView
      style={styles.stepContent}
      contentContainerStyle={styles.stepContentContainer}
      showsVerticalScrollIndicator={false}
    >
      {formData.productImage && (
        <View style={styles.summaryImageContainer}>
          <Image
            source={{ uri: formData.productImage.uri }}
            style={styles.summaryImage}
            resizeMode="contain"
          />
        </View>
      )}

      {/* Product Info */}
      <View style={styles.card}>
        <Text style={styles.summaryHeader}>PRODUCT INFO</Text>
        <SummaryRow label="Name:" value={formData.productName || "N/A"} />
        <SummaryRow label="Category:" value={formData.category || "N/A"} />
        {formData.barcode ? (
          <SummaryRow label="Barcode:" value={formData.barcode} />
        ) : null}
      </View>

      {/* Quantity & Pricing */}
      <View style={styles.card}>
        <Text style={styles.summaryHeader}>QUANTITY & PRICING</Text>

        {formData.quantityType === "Single Items" && (
          <>
            <SummaryRow
              label="Units in Stock:"
              value={formData.numberOfItems || "0"}
            />
            <SummaryRow label="Unit Type:" value="Single" />
            <SummaryRow
              label="Cost Price:"
              value={`₦${formData.costPrice || "0.00"}`}
            />
            <SummaryRow
              label="Selling Price:"
              value={`₦${formData.sellingPrice || "0.00"}`}
            />
          </>
        )}

        {(formData.quantityType === "Carton" ||
          formData.quantityType === "Both") && (
          <>
            <SummaryRow
              label="Units per Carton:"
              value={formData.unitsPerCarton || "0"}
            />
            <SummaryRow
              label="Number of Cartons:"
              value={formData.numberOfCartons || "0"}
            />
            <SummaryRow label="Total Units:" value={String(totalUnits)} />
            <SummaryRow label="Unit Type:" value="Carton" />
            <SummaryRow
              label="Cost Price (per carton):"
              value={`₦${formData.costPricePerCarton || "0.00"}`}
            />
            <SummaryRow
              label="Selling Price (per carton):"
              value={`₦${formData.sellingPricePerCarton || "0.00"}`}
            />
          </>
        )}

        {formData.quantityType === "Both" && (
          <SummaryRow
            label="Selling Price (per unit):"
            value={`₦${formData.sellingPricePerUnit || "0.00"}`}
          />
        )}
      </View>

      {/* Stock Settings */}
      <View style={styles.card}>
        <Text style={styles.summaryHeader}>STOCK SETTINGS</Text>
        <SummaryRow
          label="Low Stock Threshold:"
          value={formData.lowStockThreshold || "10"}
        />
        <SummaryRow label="Expiry Date:" value={expiryDisplay} />
      </View>

      {/* Supplier Info */}
      <View style={styles.card}>
        <Text style={styles.summaryHeader}>SUPPLIER INFO</Text>
        <SummaryRow label="Name:" value={formData.supplier.name || "N/A"} />
        <SummaryRow
          label="Phone no:"
          value={formData.supplier.phone || "N/A"}
        />
      </View>

      {/* Save Product button */}
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
    </ScrollView>
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

const SummaryRow: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <View style={styles.summaryRow}>
    <Text style={styles.summaryLabel}>{label}</Text>
    <Text style={styles.summaryValue}>{value}</Text>
  </View>
);

// ─── Shared styles ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  stepContent: {
    flex: 1,
    paddingHorizontal: isSmall ? 10 : 16,
    paddingTop: isSmall ? 10 : 16,
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
  },
  label: {
    fontSize: isSmall ? 11 : 13,
    color: "#2D3748",
    marginBottom: 5,
    fontFamily: "DMSans_600SemiBold",
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
  imageIconCircle: {
    marginBottom: isSmall ? 8 : 10,
  },
  imageUploadTitle: {
    fontSize: isSmall ? 11 : 13,
    color: "#4A5568",
    marginBottom: isSmall ? 12 : 16,
    textAlign: "center",
    lineHeight: 20,
    fontFamily: "DMSans_500Medium",
  },
  // "Take Picture" — outlined button
  takePictureBtn: {
    borderWidth: 1,
    borderColor: "#1155CC",
    borderRadius: 6,
    paddingHorizontal: isSmall ? 20 : 32,
    paddingVertical: isSmall ? 8 : 10,
    marginBottom: isSmall ? 8 : 10,
  },
  takePictureBtnText: {
    fontSize: isSmall ? 11 : 13,
    color: "#1155CC",
    fontFamily: "DMSans_500Medium",
  },
  // "Select from gallery" — underlined text link
  selectGalleryLink: {
    fontSize: isSmall ? 11 : 13,
    color: "#1155CC",
    fontFamily: "DMSans_500Medium",
    textDecorationLine: "underline",
    marginBottom: isSmall ? 10 : 14,
  },
  imageUploadInfo: {
    fontSize: isSmall ? 9 : 11,
    color: "#718096",
    textAlign: "center",
    fontFamily: "DMSans_400Regular",
    lineHeight: 16,
    marginBottom: isSmall ? 6 : 8,
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
  uploadedImage: {
    width: "100%",
    height: isSmall ? 160 : 200,
    borderRadius: 6,
    marginBottom: isSmall ? 10 : 12,
  },
  removeImageBtn: {
    borderWidth: 1,
    borderColor: "#E53E3E",
    borderRadius: 6,
    paddingHorizontal: isSmall ? 24 : 40,
    paddingVertical: isSmall ? 8 : 10,
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
  priceInputWrapper: {
    flexDirection: "row",
    backgroundColor: "#EDF2F7",
    borderRadius: 6,
    alignItems: "center",
    paddingLeft: isSmall ? 8 : 12,
    marginBottom: 8,
  },
  currency: {
    fontSize: isSmall ? 11 : 13,
    color: "#718096",
    marginRight: 4,
    fontFamily: "DMSans_400Regular",
  },
  priceInput: {
    flex: 1,
    paddingVertical: isSmall ? 8 : 12,
    paddingLeft: 0,
    paddingRight: 10,
    fontSize: isSmall ? 11 : 13,
    color: "#2D3748",
    fontFamily: "DMSans_400Regular",
  },
  priceOptionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: isSmall ? 5 : 8,
  },
  priceChip: {
    backgroundColor: "#EDF2F7",
    borderRadius: 4,
    paddingHorizontal: isSmall ? 8 : 14,
    paddingVertical: isSmall ? 4 : 6,
  },
  priceChipText: {
    fontSize: isSmall ? 10 : 12,
    color: "#1155CC",
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
  summaryImageContainer: {
    alignItems: "center",
    marginBottom: isSmall ? 10 : 14,
  },
  summaryImage: {
    width: isSmall ? 80 : 100,
    height: isSmall ? 80 : 100,
    borderRadius: 10,
  },
  summaryHeader: {
    fontSize: isSmall ? 10 : 11,
    color: "#2D3748",
    marginBottom: 8,
    letterSpacing: 0.5,
    fontFamily: "DMSans_700Bold",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: isSmall ? 11 : 12,
    color: "#718096",
    flex: 1,
    fontFamily: "DMSans_400Regular",
  },
  summaryValue: {
    fontSize: isSmall ? 11 : 12,
    color: "#2D3748",
    flex: 1,
    textAlign: "right",
    fontFamily: "DMSans_500Medium",
  },
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
