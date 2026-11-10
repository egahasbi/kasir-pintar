import { supabase } from './supabaseClient';
import { getActiveAccountKey, isDummySupabase } from './accountScope';

export interface StoredTransactionItem {
  id: string;
  product_id?: string;
  quantity: number;
  unit_cost: number;
  unit_price: number;
  subtotal: number;
  products?: {
    name: string;
    cost_price?: number;
  };
}

export interface StoredTransaction {
  id: string;
  invoice_number: string;
  cashier_id?: string | null;
  customer_name?: string | null;
  total_amount: number;
  tax_amount: number;
  discount_amount: number;
  final_amount: number;
  payment_method: string;
  payment_status: string;
  amount_paid: number;
  change_given: number;
  created_at: string;
  transaction_items: StoredTransactionItem[];
}

const getStorageKey = () => `kasir_transactions_${getActiveAccountKey()}`;

export const getLocalTransactions = (): StoredTransaction[] => {
  try {
    const raw = localStorage.getItem(getStorageKey());
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveLocalTransactions = (txs: StoredTransaction[]) => {
  const key = getStorageKey();
  try {
    localStorage.setItem(key, JSON.stringify(txs));
  } catch (err) {
    console.error('Failed to save local transactions:', err);
  }

  fetch(`/api/sync/data/${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value: txs }),
  }).catch(() => {});
};

export const addTransaction = async (tx: StoredTransaction): Promise<void> => {
  const current = getLocalTransactions();
  current.unshift(tx);
  saveLocalTransactions(current);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('kasir_transaction_created', { detail: tx }));
  }

  if (isDummySupabase()) return;

  try {
    const isUuid = (str?: string | null) =>
      Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));

    const { data: created, error } = await supabase
      .from('transactions')
      .insert({
        invoice_number: tx.invoice_number,
        cashier_id: isUuid(tx.cashier_id) ? tx.cashier_id : null,
        customer_name: tx.customer_name || null,
        total_amount: tx.total_amount,
        tax_amount: tx.tax_amount,
        discount_amount: tx.discount_amount,
        final_amount: tx.final_amount,
        payment_method: tx.payment_method.toLowerCase(),
        payment_status: tx.payment_status || 'completed',
        amount_paid: tx.amount_paid,
        change_given: tx.change_given,
      })
      .select()
      .single();

    if (!error && created) {
      const itemsPayload = tx.transaction_items
        .filter((it) => isUuid(it.product_id))
        .map((it) => ({
          transaction_id: created.id,
          product_id: it.product_id,
          quantity: it.quantity,
          unit_cost: it.unit_cost,
          unit_price: it.unit_price,
          subtotal: it.subtotal,
        }));

      if (itemsPayload.length > 0) {
        await supabase.from('transaction_items').insert(itemsPayload);
      }
    }
  } catch (err) {
    console.warn('Supabase transaction sync warning:', err);
  }
};

export const fetchAllTransactions = async (): Promise<StoredTransaction[]> => {
  let local = getLocalTransactions();
  const key = getStorageKey();

  // 1. Sync from server backend (cross-device sync between PC and Mobile HP)
  try {
    const res = await fetch(`/api/sync/data/${key}`);
    if (res.ok) {
      const { data } = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        localStorage.setItem(key, JSON.stringify(data));
        local = data;
      }
    }
  } catch {}

  if (isDummySupabase()) {
    return local;
  }

  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*, transaction_items(*, products(name, cost_price))')
      .order('created_at', { ascending: false })
      .limit(100);

    if (!error && data && data.length > 0) {
      const map = new Map<string, StoredTransaction>();
      local.forEach((tx) => map.set(tx.invoice_number, tx));
      data.forEach((tx: any) => {
        const mapped: StoredTransaction = {
          id: tx.id,
          invoice_number: tx.invoice_number,
          cashier_id: tx.cashier_id,
          customer_name: tx.customer_name,
          total_amount: Number(tx.total_amount || 0),
          tax_amount: Number(tx.tax_amount || 0),
          discount_amount: Number(tx.discount_amount || 0),
          final_amount: Number(tx.final_amount || 0),
          payment_method: (tx.payment_method || 'cash').toLowerCase(),
          payment_status: tx.payment_status || 'completed',
          amount_paid: Number(tx.amount_paid || tx.final_amount || 0),
          change_given: Number(tx.change_given || 0),
          created_at: tx.created_at,
          transaction_items: (tx.transaction_items || []).map((it: any) => ({
            id: it.id,
            product_id: it.product_id,
            quantity: Number(it.quantity || 1),
            unit_cost: Number(it.unit_cost || it.products?.cost_price || 0),
            unit_price: Number(it.unit_price || 0),
            subtotal: Number(it.subtotal || 0),
            products: it.products ? { name: it.products.name, cost_price: it.products.cost_price } : undefined,
          })),
        };
        map.set(mapped.invoice_number, mapped);
      });
      const combined = Array.from(map.values()).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      saveLocalTransactions(combined);
      return combined;
    }
  } catch (err) {
    console.warn('Supabase fetch transaction warning:', err);
  }
  return local;
};

