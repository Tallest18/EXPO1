import { Product, useAddProductForm } from "@/hooks/useAddProductForm";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import SuccessModal from "../../components/ui/SuccessModal";
import InitialChoiceSheet from "./components/InitialChoiceSheet";
import ProductFormModal from "./components/ProductFormModal";
import SearchProductModal from "./components/SearchProductModal";

interface AddProductFlowProps {
  visible?: boolean;
  onClose?: () => void;
  onSaveProduct?: (productData: Product) => void;
  initialProduct?: Product; // <-- add this
  startStep?: number;
}

const AddProductFlow: React.FC<AddProductFlowProps> = ({
  visible = true,
  onClose,
  onSaveProduct = () => {},
  initialProduct,
  startStep = 0,
}) => {
  const router = useRouter();
  const [showInitialChoice, setShowInitialChoice] = useState(!initialProduct);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(!!initialProduct);
  const [hasPrefilled, setHasPrefilled] = useState(false);
  const isRestockMode = !!initialProduct && startStep === 1;
  const isEditMode = !!initialProduct && !isRestockMode;
  const {
    formData,
    saving,
    showSuccessModal,
    updateFormData,
    resetForm,
    populateFromProduct,
    handleSaveProduct,
    setShowSuccessModal,
  } = useAddProductForm(onSaveProduct, {
    isRestockMode,
    restockInventoryId: initialProduct?.id,
    isEditMode,
    editInventoryId: initialProduct?.id,
  });

  const closeFlow = () => {
    if (onClose) {
      onClose();
      return;
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/(Main)/Inventory");
  };

  useEffect(() => {
    if (initialProduct && !hasPrefilled && visible) {
      populateFromProduct(initialProduct);
      setShowInitialChoice(false);
      setShowFormModal(true);
      setHasPrefilled(true);
    }
    // Reset flag when modal closes
    if (!visible && hasPrefilled) {
      setHasPrefilled(false);
    }
  }, [initialProduct, visible, hasPrefilled, populateFromProduct]);

  const handleAddManually = () => {
    setShowInitialChoice(false);
    setShowFormModal(true);
  };

  const handleSearchClick = () => {
    setShowInitialChoice(false);
    setShowSearchModal(true);
  };

  const handleSelectProduct = (product: Product) => {
    populateFromProduct(product);
    setShowSearchModal(false);
    setShowFormModal(true);
  };

  const handleSearchClose = () => {
    setShowSearchModal(false);
    setShowInitialChoice(true);
  };

  const handleFormClose = () => {
    setShowFormModal(false);
    closeFlow();
    resetForm();
    setShowInitialChoice(true);
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    setShowFormModal(false);
    closeFlow();
    resetForm();
    setShowInitialChoice(true);
  };

  const handleClose = () => {
    closeFlow();
    resetForm();
    setShowInitialChoice(true);
    setShowSearchModal(false);
    setShowFormModal(false);
  };

  return (
    <>
      {visible && showInitialChoice && (
        <InitialChoiceSheet
          visible
          onClose={handleClose}
          onSearchClick={handleSearchClick}
          onAddManually={handleAddManually}
        />
      )}

      <SearchProductModal
        visible={visible && showSearchModal}
        onClose={handleSearchClose}
        onSelectProduct={handleSelectProduct}
      />

      <ProductFormModal
        visible={visible && showFormModal}
        formData={formData}
        saving={saving}
        updateFormData={updateFormData}
        onSave={handleSaveProduct}
        onClose={handleFormClose}
        title={
          isRestockMode
            ? "Restock Product"
            : isEditMode
              ? "Edit Product"
              : "Add Product"
        }
        initialStep={startStep}
      />

      <SuccessModal
        visible={showSuccessModal}
        title={
          isRestockMode
            ? "Product Restocked!"
            : isEditMode
              ? "Product Updated!"
              : "Product Added!"
        }
        subtitle={
          isRestockMode
            ? "Your inventory has been successfully restocked."
            : isEditMode
              ? "Your product details have been successfully updated."
              : "Your product has been successfully added."
        }
        iconName="checkmark-circle-outline"
        iconColor="#1BC47D"
        buttonText="Done"
        onClose={handleSuccessClose}
      />
    </>
  );
};

export default AddProductFlow;
