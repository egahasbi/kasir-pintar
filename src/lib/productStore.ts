import { Product } from '../types';
import { supabase } from './supabaseClient';
import { getActiveAccountKey, isDummySupabase } from './accountScope';

export const DEFAULT_INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-001',
    sku: 'SKU-001',
    barcode: '8999999001',
    name: 'Kopi Susu Gula Aren 250ml',
    category: 'Minuman',
    cost_price: 10000,
    selling_price: 18000,
    price: 18000,
    stock: 25,
    min_stock_alert: 5,
    min_stock: 5,
    is_active: true,
  },
  {
    id: 'prod-002',
    sku: 'SKU-002',
    barcode: '8999999002',
    name: 'Beras Premium Ramos 5kg',
    category: 'Sembako',
    cost_price: 60000,
    selling_price: 72000,
    price: 72000,
    stock: 14,
    min_stock_alert: 5,
    min_stock: 5,
    is_active: true,
  },
  {
    id: 'prod-003',
    sku: 'SKU-003',
    barcode: '8999999003',
    name: 'Minyak Goreng Sawit 2L',
    category: 'Sembako',
    cost_price: 28000,
    selling_price: 34000,
    price: 34000,
    stock: 18,
    min_stock_alert: 4,
    min_stock: 4,
    is_active: true,
  },
  {
    id: 'prod-004',
    sku: 'SKU-004',
    barcode: '8999999004',
    name: 'Roti Bakar Coklat Keju',
    category: 'Makanan',
    cost_price: 12000,
    selling_price: 20000,
    price: 20000,
    stock: 10,
    min_stock_alert: 3,
    min_stock: 3,
    is_active: true,
  },
  {
    id: 'prod-005',
    sku: 'SKU-005',
    barcode: '8999999005',
    name: 'Teh Melati Botol 450ml',
    category: 'Minuman',
    cost_price: 3500,
    selling_price: 5500,
    price: 5500,
    stock: 30,
    min_stock_alert: 8,
    min_stock: 8,
    is_active: true,
  },
];

const getStorageKey = () => `kasir_products_${getActiveAccountKey()}`;

export const getLocalProducts = (): Product[] => {
  try {
    const key = getStorageKey();
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(DEFAULT_INITIAL_PRODUCTS));
      return DEFAULT_INITIAL_PRODUCTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_INITIAL_PRODUCTS;
  } catch {
    return DEFAULT_INITIAL_PRODUCTS;
  }
};

export const saveLocalProducts = (products: Product[]) => {
  const key = getStorageKey();
  try {
    localStorage.setItem(key, JSON.stringify(products));
  } catch (err) {
    console.error('Failed to save local products:', err);
  }

  fetch(`/api/sync/data/${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value: products }),
  }).catch(() => {});
};

export const fetchAllProducts = async (): Promise<Product[]> => {
  let local = getLocalProducts();
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
    const { data, error } = await supabase.from('products').select('*').order('name', { ascending: true });
    if (!error && data && data.length > 0) {
      const normalized: Product[] = data.map((item: any) => ({
        ...item,
        price: Number(item.selling_price ?? item.price ?? 0),
        selling_price: Number(item.selling_price ?? item.price ?? 0),
        cost_price: Number(item.cost_price ?? 0),
        stock: Number(item.stock ?? 0),
        min_stock: Number(item.min_stock_alert ?? item.min_stock ?? 5),
        min_stock_alert: Number(item.min_stock_alert ?? item.min_stock ?? 5),
      }));
      const map = new Map<string, Product>();
      local.forEach((p) => map.set(p.id, p));
      normalized.forEach((p) => map.set(p.id, p));
      const combined = Array.from(map.values());
      saveLocalProducts(combined);
      return combined;
    }
  } catch (err) {
    console.warn('Supabase product fetch warning:', err);
  }
  return local;
};

export const upsertProduct = async (productData: Partial<Product> & { name: string; price: number }): Promise<Product> => {
  const current = getLocalProducts();
  const now = new Date().toISOString();
  const id = productData.id || `prod-${Date.now()}`;
  const priceVal = Number(productData.price || productData.selling_price || 0);

  const productItem: Product = {
    id,
    sku: productData.sku || `SKU-${Date.now().toString().slice(-5)}`,
    barcode: productData.barcode || null,
    name: productData.name.trim(),
    category: productData.category || 'Umum',
    cost_price: Number(productData.cost_price || 0),
    selling_price: priceVal,
    price: priceVal,
    stock: Number(productData.stock || 0),
    min_stock_alert: Number(productData.min_stock_alert ?? 5),
    min_stock: Number(productData.min_stock_alert ?? 5),
    is_active: productData.is_active ?? true,
    created_at: productData.created_at || now,
    updated_at: now,
  };

  const idx = current.findIndex((p) => p.id === id);
  if (idx >= 0) current[idx] = productItem;
  else current.unshift(productItem);
  saveLocalProducts(current);

  try {
    const payload: any = {
      name: productItem.name,
      sku: productItem.sku,
      barcode: productItem.barcode,
      cost_price: productItem.cost_price,
      selling_price: productItem.price,
      stock: productItem.stock,
      min_stock_alert: productItem.min_stock_alert,
      is_active: productItem.is_active,
      updated_at: now,
    };
    if (productData.id) {
      await supabase.from('products').update(payload).eq('id', productData.id);
    } else {
      payload.created_at = now;
      await supabase.from('products').insert(payload);
    }
  } catch (e) {
    console.warn('DB sync warning:', e);
  }

  return productItem;
};

export const deleteProductLocal = async (id: string): Promise<void> => {
  const current = getLocalProducts().filter((p) => p.id !== id);
  saveLocalProducts(current);
  try {
    await supabase.from('products').delete().eq('id', id);
  } catch (e) {
    console.warn('DB delete warning:', e);
  }
};

export const deductProductsStock = async (items: Array<{ productId: string; quantity: number }>): Promise<void> => {
  const current = getLocalProducts();
  items.forEach(({ productId, quantity }) => {
    const p = current.find((item) => item.id === productId);
    if (p) {
      p.stock = Math.max(0, p.stock - quantity);
      p.updated_at = new Date().toISOString();
    }
  });
  saveLocalProducts(current);
};
