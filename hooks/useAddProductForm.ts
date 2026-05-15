import { apiClient } from "@/src/api/client";
// import { Alert, useState } from "react";
import { PRODUCTS_USER_INVENTORY_ADD } from "@/src/api/endpoints";
import { useState } from "react";
import { Alert } from "react-native";

export interface Product {
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

export interface FormData {
  productName: string;
  barcode: string;
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

export interface ImageAsset {
  uri: string;
  type?: string;
  fileName?: string;
  fileSize?: number;
  width?: number;
  height?: number;
}

const INITIAL_FORM: FormData = {
  productName: "",
  barcode: "",
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
};

export function useAddProductForm(onSaveProduct: (product: Product) => void) {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

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
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM);
    setShowSuccessModal(false);
  };

  const populateFromProduct = (product: Product) => {
    setFormData({
      productName: product.name,
      barcode: product.barcode,
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
  };

  const validateStep = (step: number): boolean => {
    if (step === 0) {
      if (!formData.productName || !formData.category) {
        Alert.alert(
          "Missing Information",
          "Please fill in all required fields for Product Info.",
        );
        return false;
      }
    } else if (step === 1) {
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
          return false;
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
          return false;
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
          return false;
        }
      }
    }
    return true;
  };

  const handleSaveProduct = async () => {
    if (saving) return;
    setSaving(true);

    try {
      const payload = {
        name: formData.productName,
        category: formData.category,
        barcode: formData.barcode || formData.sku || "",
        units_in_stock: parseInt(formData.numberOfItems) || 0,
        unit_type: formData.quantityType || "Single Items",
        cost_price: formData.costPrice || "0",
        selling_price: formData.sellingPrice || "0",
        low_stock_threshold: parseInt(formData.lowStockThreshold) || 0,
        expiry_date:
          formData.expiryDate.year && formData.expiryDate.month
            ? `${formData.expiryDate.year}-${String(
                Number(formData.expiryDate.month),
              ).padStart(2, "0")}-${String(
                Number(formData.expiryDate.day || "1"),
              ).padStart(2, "0")}`
            : undefined,
        supplier_name: formData.supplier.name || "",
        supplier_phone: formData.supplier.phone || "",
        image_url: formData.productImage?.uri || "",
      };

      console.log("[POST]", PRODUCTS_USER_INVENTORY_ADD, payload);
      await apiClient.post(PRODUCTS_USER_INVENTORY_ADD, payload);

      setShowSuccessModal(true);
    } catch (error) {
      console.error("Error adding product:", error);
      Alert.alert("Error", "Failed to add product. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return {
    formData,
    saving,
    showSuccessModal,
    updateFormData,
    resetForm,
    populateFromProduct,
    validateStep,
    handleSaveProduct,
    setShowSuccessModal,
  };
}
