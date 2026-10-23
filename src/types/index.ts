export type UserRole = 'admin' | 'cashier' | 'manager';

export type PaymentMethod = 'cash' | 'qris' | 'transfer' | 'debit';

export type OrderStatus = 'completed' | 'pending' | 'cancelled';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  store_name?: string;
  created_at: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  created_at?: string;
}

export interface Product {
  id: string;
  barcode: string;
  name: string;
  description?: string;
  cost_price: number;
  price: number;
  stock: number;
  min_stock: number;
  unit: string;
  category_id?: string;
  category?: Category;
  image_url?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discount_amount: number;
  subtotal: number;
}

export interface Transaction {
  id: string;
  invoice_number: string;
  cashier_id: string;
  cashier?: UserProfile;
  total_amount: number;
  discount_total: number;
  tax_amount: number;
  final_amount: number;
  payment_method: PaymentMethod;
  amount_paid: number;
  change_amount: number;
  status: OrderStatus;
  notes?: string;
  created_at: string;
  items?: TransactionItem[];
}

export interface TransactionItem {
  id: string;
  transaction_id: string;
  product_id: string;
  product?: Product;
  product_name: string;
  unit_price: number;
  cost_price: number;
  quantity: number;
  subtotal: number;
  discount_amount: number;
  created_at?: string;
}

export type DiscountType = 'percentage' | 'fixed_amount';

export type DiscountTarget = 'all_products' | 'category' | 'specific_product' | 'minimum_spend';

export interface DiscountRule {
  id: string;
  name: string;
  code?: string;
  discount_type: DiscountType;
  discount_value: number;
  target_type: DiscountTarget;
  target_id?: string | null;
  min_purchase_amount?: number;
  max_discount_amount?: number | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
  usage_limit?: number | null;
  used_count: number;
  created_at?: string;
  updated_at?: string;
}

export type AlertSeverity = 'info' | 'warning' | 'critical';

export type AlertStatus = 'active' | 'acknowledged' | 'resolved';

export interface RestockAlert {
  id: string;
  product_id: string;
  product?: Product;
  current_stock: number;
  min_stock_threshold: number;
  suggested_order_quantity: number;
  severity: AlertSeverity;
  status: AlertStatus;
  supplier_name?: string | null;
  last_notified_at?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface AIStockForecastItem {
  product_id: string;
  product_name: string;
  predicted_demand: number;
  days_until_stockout: number;
  recommended_restock: number;
  confidence_score: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  reasoning: string;
}

export interface AIStockForecast {
  id: string;
  generated_at: string;
  period_days: number;
  total_sku_analyzed: number;
  forecast_items: AIStockForecastItem[];
  summary_insights: string;
  model_version?: string;
}

export interface SalesAnalyticsSummary {
  today_revenue: number;
  today_transactions: number;
  today_profit: number;
  low_stock_count: number;
  revenue_growth_percentage: number;
  top_selling_products: {
    product_id: string;
    product_name: string;
    total_qty: number;
    total_sales: number;
  }[];
}

export interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}