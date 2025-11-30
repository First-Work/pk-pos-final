
export interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  imageUrl?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface SaleRecord {
  id: string;
  date: string;
  items: CartItem[];
  total: number;
  paymentMethod: string;
  customerName: string;
  amountPaid: number;
  notes?: string;
}

export enum SheetView {
  INVENTORY = 'INVENTORY',
  SALES_LOG = 'SALES_LOG',
  DASHBOARD = 'DASHBOARD',
  LEDGER = 'LEDGER'
}

export interface CellPosition {
  row: number;
  col: string; // 'A', 'B', etc.
}

export interface User {
  firstName: string;
  lastName: string;
  userId: string;
  password: string; // In a real app, this should be hashed
}

export type AuthStep = 'CREATOR_CHECK' | 'LOGIN' | 'SIGNUP' | 'APP' | 'RECOVERY';
