import type { Product } from "@/hooks/useAddProductForm";
import React from "react";

interface AddProductContextType {
  openAddProduct: () => void;
  openRestockProduct: (product: Product) => void;
}

export const AddProductContext = React.createContext<AddProductContextType>({
  openAddProduct: () => {},
  openRestockProduct: () => {},
});
