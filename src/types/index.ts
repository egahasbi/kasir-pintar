export type UserRole = 'owner' | 'manager' | 'cashier' | 'admin' | 'superadmin';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  store_id: string;
  created_at: string;
  updated_at: string;
}

export interface Store {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  currency: string;
  tax_rate: number;
  created_at: string;
}

export interface Category {
  id: string;
  store_id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  store_id?: string;
  category_id?: string | null;
  category?: Category | string;
  sku?: string;
  barcode?: string | null;
  name: string;
  description?: string | null;
  cost_price: number;
  selling_price?: number;
  price: number;
  stock_quantity?: number;
  stock: number;
  min_stock?: number;
  min_stock_alert?: number;
  unit?: string;
  image_url?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minPurchase?: number;
  maxDiscount?: number;
  isActive: boolean;
}

export interface ForecastItem {
  product_id: string;
  product_name: string;
  current_stock: number;
  projected_runout_days: number;
  recommended_restock_qty: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reasoning: string;
}

export interface DiscountPromotion {
  id: string;
  code: string;
  name: string;
  type?: 'percentage' | 'fixed';
  discount_percent?: number;
  discount_amount?: number;
  is_active: boolean;
}

export interface DiscountRule {
  id: string;
  store_id?: string;
  code?: string | null;
  name: string;
  type?: 'percentage' | 'fixed_amount';
  value?: number;
  discountPercent?: number;
  minQuantity?: number;
  min_purchase_amount?: number;
  max_discount_amount?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  is_active?: boolean;
  isActive?: boolean;
  created_at?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unit_price?: number;
  discount_amount?: number;
  subtotal?: number;
  notes?: string;
}

export type PaymentMethod = 'cash' | 'qris' | 'debit_card' | 'credit_card' | 'bank_transfer';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type TransactionStatus = 'draft' | 'completed' | 'cancelled' | 'refunded';

export interface TransactionItem {
  id: string;
  transaction_id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  cost_price: number;
  unit_price: number;
  quantity: number;
  discount_amount: number;
  subtotal: number;
  created_at: string;
}

export interface Transaction {
  id: string;
  store_id: string;
  cashier_id: string;
  cashier_name?: string;
  invoice_number: string;
  customer_name: string | null;
  customer_phone: string | null;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  discount_id: string | null;
  discount?: DiscountRule;
  total_amount: number;
  amount_paid: number;
  change_amount: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  status: TransactionStatus;
  notes: string | null;
  items?: TransactionItem[];
  created_at: string;
  updated_at: string;
}

export interface CreateTransactionDTO {
  store_id: string;
  cashier_id: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  discount_id?: string | null;
  discount_amount: number;
  tax_amount: number;
  subtotal: number;
  total_amount: number;
  amount_paid: number;
  change_amount: number;
  payment_method: PaymentMethod;
  notes?: string | null;
  items: {
    product_id: string;
    product_name: string;
    product_sku: string;
    cost_price: number;
    unit_price: number;
    quantity: number;
    discount_amount: number;
    subtotal: number;
  }[];
}

export interface StockMovement {
  id: string;
  store_id: string;
  product_id: string;
  product?: Product;
  user_id: string;
  change_type: 'in' | 'out' | 'adjustment' | 'sale' | 'return';
  quantity: number;
  remaining_stock: number;
  reference_id: string | null;
  reason: string | null;
  created_at: string;
}

export interface InventoryRestockAlert {
  product_id: string;
  product_name: string;
  sku: string;
  current_stock: number;
  min_stock_alert: number;
  suggested_order_qty: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

export interface SalesAnalyticsSummary {
  total_revenue: number;
  total_profit: number;
  total_transactions: number;
  average_order_value: number;
  cash_revenue: number;
  qris_revenue: number;
  card_revenue: number;
  date_start: string;
  date_end: string;
}

export interface TopSellingProduct {
  product_id: string;
  product_name: string;
  sku: string;
  units_sold: number;
  total_revenue: number;
  total_profit: number;
}

export interface SalesForecastPoint {
  date: string;
  predicted_revenue: number;
  confidence_lower: number;
  confidence_upper: number;
  trend: 'up' | 'down' | 'stable';
}

export interface StockForecastResult {
  product_id: string;
  product_name: string;
  current_stock: number;
  days_until_stockout: number;
  estimated_stockout_date: string | null;
  reorder_recommended: boolean;
  recommended_order_quantity: number;
}

export interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  context_data?: Record<string, unknown>;
}

export interface AiRecommendation {
  type: 'stock_replenishment' | 'pricing_optimization' | 'promotion_opportunity' | 'dead_stock_alert';
  title: string;
  description: string;
  impact_score: number;
  action_payload?: Record<string, unknown>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ReceiptData {
  store_name: string;
  store_address: string | null;
  store_phone: string | null;
  invoice_number: string;
  cashier_name: string;
  customer_name: string | null;
  date: string;
  items: {
    name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
  }[];
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  amount_paid: number;
  change_amount: number;
  payment_method: PaymentMethod;
  notes: string | null;
}