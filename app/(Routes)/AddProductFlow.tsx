import { Product, useAddProductForm } from "@/hooks/useAddProductForm";
import { useEffect, useState } from "react";
import SuccessModal from "../../components/ui/SuccessModal";
import InitialChoiceSheet from "./components/InitialChoiceSheet";
import ProductFormModal from "./components/ProductFormModal";
import SearchProductModal from "./components/SearchProductModal";

interface AddProductFlowProps {
  visible: boolean;
  onClose: () => void;
  onSaveProduct: (productData: Product) => void;
  initialProduct?: Product; // <-- add this
}

const AddProductFlow: React.FC<AddProductFlowProps> = ({
  visible,
  onClose,
  onSaveProduct,
  initialProduct,
}) => {
  const [showInitialChoice, setShowInitialChoice] = useState(!initialProduct);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(!!initialProduct);
  const [hasPrefilled, setHasPrefilled] = useState(false);
  const isEditMode = !!initialProduct;
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
        title={isEditMode ? "Edit Product" : "Add Product"}
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
