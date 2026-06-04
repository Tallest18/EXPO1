import { apiClient } from "@/src/api/client";
import { API_BASE_URL, API_PREFIX } from "@/src/api/constants";
import {
    PRODUCTS_USER_INVENTORY_ADD,
    PRODUCTS_USER_INVENTORY_ITEM,
} from "@/src/api/endpoints";
import { createRestock } from "@/src/api/products";
import { getAccessToken } from "@/src/api/tokenStorage";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Alert } from "react-native";

const normalizeApiPath = (path: string) => path.replace(/^\/api(?=\/)/, "");


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

interface AddProductFormOptions {
  isRestockMode?: boolean;
  restockInventoryId?: string;
  isEditMode?: boolean;
  editInventoryId?: string;
}

export function useAddProductForm(
  onSaveProduct: (product: Product) => void,
  options?: AddProductFormOptions,
) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const invalidateInventoryQueries = async () => {
    await queryClient.invalidateQueries({ queryKey: ["user-inventory"] });
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
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM);
    setShowSuccessModal(false);
  };

  const populateFromProduct = (product: Product) => {
    const rawExpiry = product.expiryDate || "";
    let day = "";
    let month = "";
    let year = "";

    if (rawExpiry.includes("-")) {
      const [y, m, d] = rawExpiry.split("-");
      year = y || "";
      month = m || "";
      day = d || "";
    } else if (rawExpiry.includes("/")) {
      const [m, d, y] = rawExpiry.split("/");
      month = m || "";
      day = d || "";
      year = y || "";
    }

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
      expiryDate: { day, month, year },
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
      if (options?.isRestockMode && options?.restockInventoryId) {
        const today = new Date().toISOString().split("T")[0];
        const expiryDate =
          formData.expiryDate.year && formData.expiryDate.month
            ? `${formData.expiryDate.year}-${String(
                Number(formData.expiryDate.month),
              ).padStart(2, "0")}-${String(
                Number(formData.expiryDate.day || "1"),
              ).padStart(2, "0")}`
            : undefined;

        const quantityAdded =
          parseInt(formData.numberOfItems) ||
          parseInt(formData.numberOfCartons) ||
          0;
        const buyingPrice =
          formData.costPrice || formData.costPricePerCarton || "0";
        const sellingPrice =
          formData.sellingPrice ||
          formData.sellingPricePerCarton ||
          formData.sellingPricePerUnit ||
          "0";

        await createRestock({
          inventoryId: Number(options.restockInventoryId),
          quantity_added: quantityAdded,
          buying_price: buyingPrice,
          supplier: 0,
          supplier_name: formData.supplier.name || "",
          quantity_type: formData.quantityType || "Single Items",
          cost_price: buyingPrice,
          selling_price: sellingPrice,
          low_stock_threshold: parseInt(formData.lowStockThreshold) || 0,
          supplier_phone: formData.supplier.phone || "",
          date_arrived: today,
          expiry_date: expiryDate,
          notes: "Restocked via app",
        });

        await invalidateInventoryQueries();
        setShowSuccessModal(true);
        return;
      }

      if (options?.isEditMode && options?.editInventoryId) {
        const expiryDate =
          formData.expiryDate.year && formData.expiryDate.month
            ? `${formData.expiryDate.year}-${String(
                Number(formData.expiryDate.month),
              ).padStart(2, "0")}-${String(
                Number(formData.expiryDate.day || "1"),
              ).padStart(2, "0")}`
            : undefined;

        const editPayload: Record<string, any> = {
          name: formData.productName,
          category: formData.category,
          barcode: formData.barcode || formData.sku || "",
          units_in_stock: parseInt(formData.numberOfItems) || 0,
          unit_type: formData.quantityType || "Single Items",
          cost_price: formData.costPrice || "0",
          selling_price: formData.sellingPrice || "0",
          low_stock_threshold: parseInt(formData.lowStockThreshold) || 0,
          expiry_date: expiryDate,
          supplier_name: formData.supplier.name || "",
          supplier_phone: formData.supplier.phone || "",
        };

        const editEndpoint = normalizeApiPath(
          PRODUCTS_USER_INVENTORY_ITEM(options.editInventoryId),
        );

        const localEditImage =
          formData.productImage?.uri &&
          !formData.productImage.uri.startsWith("http")
            ? formData.productImage
            : null;

        let updated: any;

        if (localEditImage) {
          // Single multipart PATCH: all fields + image together via fetch
          const token = await getAccessToken();
          const fd = new FormData();
          Object.entries(editPayload).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              fd.append(key, String(value));
            }
          });
          // buying_price is also required by the server
          fd.append("buying_price", editPayload.cost_price || "0");
          fd.append("image", {
            uri: localEditImage.uri,
            name: localEditImage.fileName || `product-${Date.now()}.jpg`,
            type: localEditImage.type || "image/jpeg",
          } as any);

          const fullUrl = `${API_BASE_URL}${API_PREFIX}${editEndpoint}`;
          const res = await fetch(fullUrl, {
            method: "PATCH",
            headers: { Authorization: `Bearer ${token}` },
            body: fd as any,
          });
          if (!res.ok) {
            const text = await res.text();
            throw new Error(`${res.status}: ${text}`);
          }
          updated = await res.json();
        } else {
          // No local image — plain JSON PATCH
          if (formData.productImage?.uri?.startsWith("http")) {
            editPayload.image_url = formData.productImage.uri;
          }
          const { data } = await apiClient.patch(editEndpoint, editPayload);
          updated = data;
        }

        await invalidateInventoryQueries();

        onSaveProduct({
          id: String(updated?.id ?? options.editInventoryId),
          name: updated?.name ?? formData.productName,
          category: updated?.category ?? formData.category,
          barcode: String(updated?.barcode ?? formData.barcode ?? ""),
          image: updated?.image_url
            ? { uri: updated.image_url }
            : formData.productImage,
          quantityType:
            updated?.quantity_type ||
            updated?.unit_type ||
            formData.quantityType ||
            "Single Items",
          unitsInStock: Number(
            updated?.units_in_stock ?? formData.numberOfItems ?? 0,
          ),
          costPrice: Number(updated?.cost_price ?? formData.costPrice ?? 0),
          sellingPrice: Number(
            updated?.selling_price ?? formData.sellingPrice ?? 0,
          ),
          lowStockThreshold: Number(
            updated?.low_stock_threshold ?? formData.lowStockThreshold ?? 0,
          ),
          expiryDate: updated?.expiry_date || expiryDate || "",
          supplier: {
            name: updated?.supplier_name ?? formData.supplier.name,
            phone: updated?.supplier_phone ?? formData.supplier.phone,
          },
          dateAdded:
            updated?.added_at ||
            updated?.updated_at ||
            new Date().toISOString(),
          userId: "api-user",
        });

        setShowSuccessModal(true);
        return;
      }

      const expiry =
        formData.expiryDate.year && formData.expiryDate.month
          ? `${formData.expiryDate.year}-${String(
              Number(formData.expiryDate.month),
            ).padStart(2, "0")}-${String(
              Number(formData.expiryDate.day || "1"),
            ).padStart(2, "0")}`
          : undefined;

      const buyingPrice = formData.costPrice || formData.costPricePerCarton || "0";
      const sellingPrice =
        formData.sellingPrice ||
        formData.sellingPricePerCarton ||
        formData.sellingPricePerUnit ||
        "0";
      const unitsInStock =
        parseInt(formData.numberOfItems) ||
        (parseInt(formData.numberOfCartons) || 0) *
          (parseInt(formData.unitsPerCarton) || 1);

      const payload: Record<string, any> = {
        name: formData.productName,
        category: formData.category,
        barcode: formData.barcode || formData.sku || "",
        units_in_stock: unitsInStock,
        unit_type: formData.quantityType || "Single Items",
        cost_price: buyingPrice,
        selling_price: sellingPrice,
        low_stock_threshold: parseInt(formData.lowStockThreshold) || 0,
        expiry_date: expiry,
        supplier_name: formData.supplier.name || "",
        supplier_phone: formData.supplier.phone || "",
      };

      const localImage =
        formData.productImage?.uri &&
        !formData.productImage.uri.startsWith("http")
          ? formData.productImage
          : null;

      if (localImage) {
        // Single multipart POST: all fields + image together via fetch
        const token = await getAccessToken();
        const fd = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            fd.append(key, String(value));
          }
        });
        fd.append("buying_price", buyingPrice);
        fd.append("image", {
          uri: localImage.uri,
          name: localImage.fileName || `product-${Date.now()}.jpg`,
          type: localImage.type || "image/jpeg",
        } as any);
        const fullUrl = `${API_BASE_URL}${API_PREFIX}${PRODUCTS_USER_INVENTORY_ADD}`;
        const res = await fetch(fullUrl, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd as any,
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`${res.status}: ${text}`);
        }
      } else {
        // No image — plain JSON POST
        await apiClient.post(PRODUCTS_USER_INVENTORY_ADD, payload);
      }

      await invalidateInventoryQueries();
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
