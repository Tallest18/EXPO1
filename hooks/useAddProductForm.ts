import {
  createProductWithImage,
  listCategories,
  listSuppliers,
} from "@/src/api";
// import { Alert, useState } from "react";
import {
  checkExpiringProducts,
  checkLowStock,
  notifyProductAdded,
} from "@/app/notificationHelpers";
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

      const [categories, suppliers] = await Promise.all([
        listCategories(),
        listSuppliers(),
      ]);

      const matchedCategory = categories.find(
        (c) => c.name.toLowerCase() === (formData.category || "").toLowerCase(),
      );
      const matchedSupplier = suppliers.find(
        (s) =>
          s.name.toLowerCase() === (formData.supplier.name || "").toLowerCase(),
      );

      if (!categories.length || !suppliers.length) {
        Alert.alert(
          "Error",
          "Categories or suppliers are not available from backend yet.",
        );
        return;
      }

      const apiProduct = await createProductWithImage(
        {
          name: formData.productName || "Untitled Product",
          category: matchedCategory?.id ?? categories[0].id,
          supplier: matchedSupplier?.id ?? suppliers[0].id,
          buying_price: String(finalCostPrice),
          selling_price: String(finalSellingPrice),
          quantity: unitsInStock,
          quantity_type: formData.quantityType || "Single Items",
          low_stock_threshold: parseInt(formData.lowStockThreshold) || 10,
          barcode: formData.sku || "",
          expiry_date:
            formData.expiryDate.month && formData.expiryDate.year
              ? `${formData.expiryDate.year}-${String(
                  Number(formData.expiryDate.month),
                ).padStart(2, "0")}-${String(
                  Number(formData.expiryDate.day || "1"),
                ).padStart(2, "0")}`
              : undefined,
          supplier_name: formData.supplier.name || undefined,
          supplier_phone: formData.supplier.phone || undefined,
        },
        formData.productImage,
      );

      const savedProduct: Product = {
        id: String(apiProduct.id),
        name: apiProduct.name,
        category: apiProduct.category_name || formData.category || "",
        barcode: apiProduct.barcode || apiProduct.code || "",
        image: apiProduct.image ? { uri: apiProduct.image } : null,
        quantityType: apiProduct.quantity_type || formData.quantityType,
        unitsInStock: apiProduct.quantity_left ?? apiProduct.quantity,
        costPrice: Number(apiProduct.buying_price || 0),
        sellingPrice: Number(apiProduct.selling_price || 0),
        lowStockThreshold: apiProduct.low_stock_threshold ?? 10,
        expiryDate: apiProduct.expiry_date || "",
        supplier: {
          name: apiProduct.supplier_name || apiProduct.supplier_obj_name || "",
          phone: apiProduct.supplier_phone || "",
        },
        dateAdded: apiProduct.created_at || new Date().toISOString(),
        userId: "api-user",
      } as Product;

      await notifyProductAdded(
        "api-user",
        String(apiProduct.id),
        savedProduct.name,
      );
      await checkLowStock(
        "api-user",
        String(apiProduct.id),
        savedProduct.name,
        savedProduct.unitsInStock,
        savedProduct.lowStockThreshold,
      );
      await checkExpiringProducts("api-user");

      onSaveProduct(savedProduct);
      setShowSuccessModal(true);
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
