export interface Product {
  id: string;
  name: string;
  category: string;
  barcode: string;
  image?: { uri: string } | null;
  quantityType: string;
  unitsInStock: number;
  profitPerUnit?: number;
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

export const DUMMY_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Apple iPhone 15",
    category: "Electronics",
    barcode: "1234567890",
    image: null,
    quantityType: "Single Items",
    unitsInStock: 10,
    profitPerUnit: 150000,
    costPrice: 800000,
    sellingPrice: 950000,
    lowStockThreshold: 3,
    expiryDate: "",
    supplier: { name: "Apple Inc.", phone: "+1 800 555 1234" },
    dateAdded: new Date().toISOString(),
    userId: "dummy-user",
  },
  {
    id: "2",
    name: "Banana",
    category: "Groceries",
    barcode: "0987654321",
    image: null,
    quantityType: "Bunch",
    unitsInStock: 0,
    profitPerUnit: 300,
    costPrice: 500,
    sellingPrice: 800,
    lowStockThreshold: 2,
    expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    supplier: { name: "Fruit Supplier", phone: "+234 800 123 4567" },
    dateAdded: new Date().toISOString(),
    userId: "dummy-user",
  },
  {
    id: "3",
    name: "Milk",
    category: "Dairy",
    barcode: "1122334455",
    image: null,
    quantityType: "Carton",
    unitsInStock: 5,
    profitPerUnit: 300,
    costPrice: 1200,
    sellingPrice: 1500,
    lowStockThreshold: 2,
    expiryDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
    supplier: { name: "Dairy Best", phone: "+234 800 987 6543" },
    dateAdded: new Date().toISOString(),
    userId: "dummy-user",
  },
];
