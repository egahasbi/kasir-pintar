import dotenv from 'dotenv';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseUrl.trim()) {
  throw new Error('Environment variable SUPABASE_URL missing or empty');
}

if (!supabaseServiceRoleKey || !supabaseServiceRoleKey.trim()) {
  throw new Error('Environment variable SUPABASE_SERVICE_ROLE_KEY missing or empty');
}

try {
  new URL(supabaseUrl);
} catch {
  throw new Error(`Invalid SUPABASE_URL format: ${supabaseUrl}`);
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: 'owner' | 'manager' | 'cashier';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          role?: 'owner' | 'manager' | 'cashier';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: 'owner' | 'manager' | 'cashier';
          created_at?: string;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          barcode: string;
          name: string;
          category_id: string | null;
          cost_price: number;
          selling_price: number;
          stock: number;
          min_stock_alert: number;
          unit: string;
          image_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          barcode: string;
          name: string;
          category_id?: string | null;
          cost_price?: number;
          selling_price?: number;
          stock?: number;
          min_stock_alert?: number;
          unit?: string;
          image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          barcode?: string;
          name?: string;
          category_id?: string | null;
          cost_price?: number;
          selling_price?: number;
          stock?: number;
          min_stock_alert?: number;
          unit?: string;
          image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          invoice_number: string;
          cashier_id: string;
          subtotal: number;
          discount_amount: number;
          tax_amount: number;
          total_amount: number;
          payment_method: 'cash' | 'qris' | 'debit' | 'transfer';
          payment_status: 'paid' | 'pending' | 'cancelled';
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          invoice_number: string;
          cashier_id: string;
          subtotal?: number;
          discount_amount?: number;
          tax_amount?: number;
          total_amount?: number;
          payment_method?: 'cash' | 'qris' | 'debit' | 'transfer';
          payment_status?: 'paid' | 'pending' | 'cancelled';
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          invoice_number?: string;
          cashier_id?: string;
          subtotal?: number;
          discount_amount?: number;
          tax_amount?: number;
          total_amount?: number;
          payment_method?: 'cash' | 'qris' | 'debit' | 'transfer';
          payment_status?: 'paid' | 'pending' | 'cancelled';
          notes?: string | null;
          created_at?: string;
        };
      };
      transaction_items: {
        Row: {
          id: string;
          transaction_id: string;
          product_id: string;
          quantity: number;
          unit_cost: number;
          unit_price: number;
          subtotal: number;
          discount: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          transaction_id: string;
          product_id: string;
          quantity: number;
          unit_cost?: number;
          unit_price?: number;
          subtotal?: number;
          discount?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          transaction_id?: string;
          product_id?: string;
          quantity?: number;
          unit_cost?: number;
          unit_price?: number;
          subtotal?: number;
          discount?: number;
          created_at?: string;
        };
      };
      discounts: {
        Row: {
          id: string;
          code: string;
          name: string;
          type: 'percentage' | 'fixed';
          value: number;
          min_purchase: number;
          max_discount: number | null;
          start_date: string;
          end_date: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          type: 'percentage' | 'fixed';
          value: number;
          min_purchase?: number;
          max_discount?: number | null;
          start_date: string;
          end_date: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          type?: 'percentage' | 'fixed';
          value?: number;
          min_purchase?: number;
          max_discount?: number | null;
          start_date?: string;
          end_date?: string;
          is_active?: boolean;
          created_at?: string;
        };
      };
      stock_movements: {
        Row: {
          id: string;
          product_id: string;
          user_id: string | null;
          type: 'in' | 'out' | 'adjustment' | 'sale';
          quantity: number;
          previous_stock: number;
          current_stock: number;
          reference_id: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          user_id?: string | null;
          type: 'in' | 'out' | 'adjustment' | 'sale';
          quantity: number;
          previous_stock: number;
          current_stock: number;
          reference_id?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          user_id?: string | null;
          type?: 'in' | 'out' | 'adjustment' | 'sale';
          quantity?: number;
          previous_stock?: number;
          current_stock?: number;
          reference_id?: string | null;
          notes?: string | null;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

export type TypedSupabaseClient = SupabaseClient<Database>;

export const supabase: TypedSupabaseClient = createClient<Database>(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export default supabase;