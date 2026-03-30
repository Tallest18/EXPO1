import React from "react";

interface AddProductContextType {
  openAddProduct: () => void;
}

export const AddProductContext = React.createContext<AddProductContextType>({
  openAddProduct: () => {},
});
