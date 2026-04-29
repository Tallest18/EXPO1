import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { styles } from "./Checkout.styles";

import { apiClient } from "@/src/api";
import { PRODUCTS_ITEM, SALES, SALES_DEBTORS } from "@/src/api/endpoints";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
// Debtor API type
interface Debtor {
  id: number;
  customer_name: string;
  customer_phone?: string;
  amount_owed: number;
  due_date?: string;
  transaction_ref?: string;
}

// TanStack Query: fetch all debtors
function useDebtors() {
  return useQuery({
    queryKey: ["sales-debtors"],
    queryFn: async () => {
      const { data } = await apiClient.get(SALES_DEBTORS);
      return data;
    },
  });
}

// Types
interface Product {
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

interface CartItem {
  productId: string;
  quantity: number;
  product?: Product;
}

type PaymentMethod = "Cash" | "Transfer" | "POS" | "Credit (Debtor)";

const Checkout: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>("Cash");
  const [processing, setProcessing] = useState<boolean>(false);
  const [showDebtorModal, setShowDebtorModal] = useState<boolean>(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Debtor form state
  const [customerName, setCustomerName] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [amountOwed, setAmountOwed] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [toastMessage, setToastMessage] = useState<string>("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastAnim] = useState(() => new Animated.Value(0));

  const showAppToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);

    toastAnim.setValue(0);

    Animated.sequence([
      Animated.parallel([
        Animated.timing(toastAnim, {
          toValue: 1,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(1200),
      Animated.timing(toastAnim, {
        toValue: 0,
        duration: 260,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowToast(false);
    });
  };

  // Fetch product details for cart items

  // TanStack Query: fetch product details for each cart item
  useEffect(() => {
    const cartData: CartItem[] = params.cartData
      ? JSON.parse(params.cartData as string)
      : [];
    if (cartData.length === 0) {
      setCartItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all(
      cartData.map(async (item) => {
        try {
          const { data: product } = await apiClient.get(
            PRODUCTS_ITEM(item.productId),
          );
          if (product) {
            return {
              ...item,
              product: {
                id: String(product.id),
                name: product.name,
                category: product.category_name || "",
                barcode: product.barcode || "",
                image: product.image ? { uri: product.image } : null,
                quantityType: product.quantity_type || "Single Items",
                unitsInStock: product.quantity_left ?? product.quantity,
                costPrice: Number(product.buying_price || 0),
                sellingPrice: Number(product.selling_price || 0),
                lowStockThreshold: product.low_stock_threshold ?? 0,
                expiryDate: product.expiry_date || "",
                supplier: {
                  name:
                    product.supplier_name || product.supplier_obj_name || "",
                  phone: product.supplier_phone || "",
                },
                dateAdded: product.created_at || new Date().toISOString(),
                userId: "api-user",
              } as Product,
            };
          }
        } catch (error) {
          // fallback: skip product
        }
        return item;
      }),
    ).then((cartWithProducts) => {
      setCartItems(cartWithProducts);
      setLoading(false);
    });
  }, [params.cartData]);

  const calculateTotal = (): number => {
    return cartItems.reduce((total, item) => {
      if (item.product) {
        return total + item.product.sellingPrice * item.quantity;
      }
      return total;
    }, 0);
  };

  // TanStack Query: sale creation mutation
  const queryClient = useQueryClient();
  const saleMutation = useMutation({
    mutationFn: async (payload: any) => {
      return apiClient.post(SALES, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
    },
  });

  const handlePayment = async (): Promise<void> => {
    if (!selectedPayment) {
      Alert.alert("Error", "Please select a payment method");
      return;
    }
    if (cartItems.length === 0) {
      Alert.alert("Error", "Cart is empty");
      return;
    }
    // Validate debtor details if Credit (Debtor) is selected
    if (selectedPayment === "Credit (Debtor)") {
      if (!customerName.trim()) {
        Alert.alert("Error", "Please enter customer name");
        return;
      }
      if (!phoneNumber.trim()) {
        Alert.alert("Error", "Please enter phone number");
        return;
      }
      if (!amountOwed.trim() || parseFloat(amountOwed) <= 0) {
        Alert.alert("Error", "Please enter a valid amount owed");
        return;
      }
    }
    setProcessing(true);
    try {
      const paymentMethodMap: Record<PaymentMethod, string> = {
        Cash: "cash",
        Transfer: "transfer",
        POS: "pos",
        "Credit (Debtor)": "credit",
      };
      const total = calculateTotal();
      await saleMutation.mutateAsync({
        payment_method: paymentMethodMap[selectedPayment],
        notes: notes || undefined,
        customer_name:
          selectedPayment === "Credit (Debtor)" ? customerName : undefined,
        customer_phone:
          selectedPayment === "Credit (Debtor)" ? phoneNumber : undefined,
        amount_owed:
          selectedPayment === "Credit (Debtor)"
            ? String(parseFloat(amountOwed) || 0)
            : undefined,
        amount_paid:
          selectedPayment === "Credit (Debtor)" ? "0" : String(total),
        items: cartItems.map((item) => ({
          product: Number(item.productId),
          quantity: item.quantity,
        })),
      });
      setProcessing(false);
      showAppToast(
        `Checkout successful: ₦${calculateTotal().toLocaleString()} via ${selectedPayment}`,
        "success",
      );
      setTimeout(() => {
        router.replace("/(Main)/Home" as any);
      }, 900);
    } catch (error) {
      console.error("Error processing sale:", error);
      setProcessing(false);
      showAppToast("Failed to process sale. Please try again.", "error");
      Alert.alert("Error", "Failed to process sale. Please try again.", [
        { text: "OK" },
      ]);
    }
  };

  const handleSaveDebtor = (): void => {
    if (!customerName.trim()) {
      Alert.alert("Error", "Please enter customer name");
      return;
    }
    if (!phoneNumber.trim()) {
      Alert.alert("Error", "Please enter phone number");
      return;
    }
    if (!amountOwed.trim() || parseFloat(amountOwed) <= 0) {
      Alert.alert("Error", "Please enter a valid amount owed");
      return;
    }
    setShowDebtorModal(false);
  };

  const paymentMethods: PaymentMethod[] = [
    "Cash",
    "Transfer",
    "POS",
    "Credit (Debtor)",
  ];

  const quickAmountButtons = [100, 200, 500, 800, 1000];

  const renderPaymentOption = (method: PaymentMethod): React.ReactElement => {
    const isSelected = selectedPayment === method;

    return (
      <TouchableOpacity
        key={method}
        style={[
          styles.paymentOption,
          isSelected && styles.paymentOptionSelected,
        ]}
        onPress={() => {
          setSelectedPayment(method);
          if (method === "Credit (Debtor)") {
            setShowDebtorModal(true);
          }
        }}
      >
        <Text style={styles.paymentOptionText}>{method}</Text>
        <View
          style={[styles.radioButton, isSelected && styles.radioButtonSelected]}
        >
          {isSelected && <View style={styles.radioButtonInner} />}
        </View>
      </TouchableOpacity>
    );
  };

  if (processing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1155CC" />
          <Text style={styles.loadingText}>Processing sale...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1155CC" />
          <Text style={styles.loadingText}>Loading cart...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Checkout</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Payment Method Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>

          <View style={styles.paymentOptionsContainer}>
            {paymentMethods.map((method) => renderPaymentOption(method))}
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Footer with Done Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.doneButton}
          onPress={handlePayment}
          disabled={processing}
        >
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>

      {/* Debtor Modal */}
      <Modal
        visible={showDebtorModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDebtorModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Debtor details</Text>
              <TouchableOpacity
                onPress={() => setShowDebtorModal(false)}
                style={styles.closeButton}
              >
                <Feather name="x" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Customer Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Customer Name <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Type here..."
                  placeholderTextColor="#999"
                  value={customerName}
                  onChangeText={setCustomerName}
                />
              </View>

              {/* Phone Number */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Phone Number <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Type here..."
                  placeholderTextColor="#999"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                />
              </View>

              {/* Amount Owed */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Amount Owed{" "}
                  <Text style={styles.labelSubtext}>
                    (How much thm dey owe?)*
                  </Text>
                </Text>
                <View style={styles.amountInputContainer}>
                  <Text style={styles.currencySymbol}>₦</Text>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="0.00"
                    placeholderTextColor="#999"
                    value={amountOwed}
                    onChangeText={setAmountOwed}
                    keyboardType="numeric"
                  />
                </View>

                {/* Quick Amount Buttons */}
                <View style={styles.quickAmountsContainer}>
                  {quickAmountButtons.map((amount) => (
                    <TouchableOpacity
                      key={amount}
                      style={styles.quickAmountButton}
                      onPress={() => setAmountOwed(amount.toString())}
                    >
                      <Text style={styles.quickAmountText}>
                        ₦{amount.toLocaleString()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Notes */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Notes</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Type here..."
                  placeholderTextColor="#999"
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              {/* Save Button */}
              <TouchableOpacity
                style={styles.saveDebtorButton}
                onPress={handleSaveDebtor}
              >
                <Text style={styles.saveDebtorButtonText}>Save Debtor</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {showToast && (
        <Animated.View
          style={[
            styles.toastContainer,
            toastType === "error" ? styles.toastError : styles.toastSuccess,
            {
              opacity: toastAnim,
              transform: [
                {
                  translateY: toastAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-24, 0],
                  }),
                },
                {
                  scale: toastAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.95, 1],
                  }),
                },
              ],
            },
          ]}
          pointerEvents="none"
        >
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
};

export default Checkout;
