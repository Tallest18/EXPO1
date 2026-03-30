import { Product, useAddProductForm } from "@/hooks/useAddProductForm";
import React, { useState } from "react";
import SuccessModal from "../../components/ui/SuccessModal";
import InitialChoiceSheet from "./components/InitialChoiceSheet";
import ProductFormModal from "./components/ProductFormModal";
import SearchProductModal from "./components/SearchProductModal";

interface AddProductFlowProps {
  visible: boolean;
  onClose: () => void;
  onSaveProduct: (productData: Product) => void;
}

const AddProductFlow: React.FC<AddProductFlowProps> = ({
  visible,
  onClose,
  onSaveProduct,
}) => {
  const [showInitialChoice, setShowInitialChoice] = useState(true);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);

  const {
    formData,
    saving,
    showSuccessModal,
    updateFormData,
    resetForm,
    populateFromProduct,
    handleSaveProduct,
    setShowSuccessModal,
  } = useAddProductForm(onSaveProduct);

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
    onClose();
    resetForm();
    setShowInitialChoice(true);
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    setShowFormModal(false);
    onClose();
    resetForm();
    setShowInitialChoice(true);
  };

  const handleClose = () => {
    onClose();
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
      />

      <SuccessModal
        visible={showSuccessModal}
        title="Product Added!"
        subtitle="Your product has been successfully added."
        iconName="checkmark-circle-outline"
        iconColor="#1BC47D"
        buttonText="Done"
        onClose={handleSuccessClose}
      />
    </>
  );
};

export default AddProductFlow;
