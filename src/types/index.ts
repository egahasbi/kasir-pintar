export type Role = 'owner' | 'manager' | 'cashier';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  phone?: string | null;
  avatar_url?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface Product {
  id: string;
  sku: string;
  barcode?: string | null;
  name: string;
  description?: string | null;
  category_id?: string | null;
  category?: Category | null;
  price: number;
  cost_price: number;
  stock: number;
  min_stock_alert: number;
  unit: string;
  image_url?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discount_percentage?: number;
  discount_amount?: number;
  subtotal: number;
  notes?: string;
}

export type PaymentMethod = 'cash' | 'qris' | 'transfer' | 'debit' | 'credit';

export type TransactionStatus = 'pending' | 'completed' | 'canceled' | 'refunded';

export interface TransactionItem {
  id: string;
  transaction_id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  price: number;
  cost_price: number;
  quantity: number;
  subtotal: number;
  discount_amount: number;
  created_at?: string;
}

export interface Transaction {
  id: string;
  invoice_number: string;
  cashier_id: string;
  cashier?: User | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  payment_method: PaymentMethod;
  status: TransactionStatus;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  amount_paid: number;
  change_amount: number;
  notes?: string | null;
  items: TransactionItem[];
  created_at: string;
  updated_at?: string;
}

export interface SalesSummary {
  date: string;
  total_sales: number;
  total_profit: number;
  transaction_count: number;
}

export interface TopSellingProduct {
  product_id: string;
  product_name: string;
  total_quantity: number;
  total_revenue: number;
}

export interface LowStockAlert {
  product_id: string;
  product_name: string;
  current_stock: number;
  min_stock_alert: number;
  unit: string;
}

export interface PaymentDistribution {
  method: PaymentMethod;
  count: number;
  total_amount: number;
}

export interface DashboardMetrics {
  total_revenue_today: number;
  total_profit_today: number;
  total_transactions_today: number;
  growth_revenue_percentage: number;
  growth_transactions_percentage: number;
  sales_chart: SalesSummary[];
  top_products: TopSellingProduct[];
  low_stock_items: LowStockAlert[];
  payment_distribution: PaymentDistribution[];
}

export interface AiBusinessInsight {
  id: string;
  generated_at: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  stock_predictions: {
    product_name: string;
    estimated_days_left: number;
    action_required: string;
  }[];
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}