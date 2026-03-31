export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  StockScanner: undefined;
  StockCheck: { barcode?: string };
  StockList: undefined;
  StockDetail: { stockId: string };
};

export interface User {
  id: string;
  username: string;
  name: string;
  role: 'checker' | 'admin' | 'supervisor';
  token: string;
}

export interface StockItem {
  id: string;
  barcode: string;
  name: string;
  sku: string;
  location: string;
  zone: string;
  shelf: string;
  quantity: number;
  expectedQuantity: number;
  unit: string;
  category: string;
  lastChecked?: string;
  checkedBy?: string;
  status: 'matched' | 'mismatch' | 'not_found' | 'pending';
  notes?: string;
}

export interface StockCheckInput {
  stockId: string;
  actualQuantity: number;
  notes?: string;
  status: 'matched' | 'mismatch' | 'damaged' | 'missing';
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
