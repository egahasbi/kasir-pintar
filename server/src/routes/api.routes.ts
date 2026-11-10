import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import {
  getInventory,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStockAlerts,
  updateStock
} from '../controllers/inventory.controller.js';
import {
  askBusinessAssistant,
  getDemandForecast,
  suggestPricingOptimization
} from '../controllers/ai.controller.js';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Kasir Pintar AI Backend API'
  });
});

// Inventory routes
router.get('/inventory', getInventory);
router.get('/inventory/alerts', getLowStockAlerts);
router.get('/inventory/:id', getProductById);
router.post('/inventory', createProduct);
router.put('/inventory/:id', updateProduct);
router.patch('/inventory/:id/stock', updateStock);
router.delete('/inventory/:id', deleteProduct);

// AI Assistant & Analytics routes
router.post('/ai/chat', askBusinessAssistant);
router.get('/ai/forecast', getDemandForecast);
router.post('/ai/pricing-suggestions', suggestPricingOptimization);

// Sales & Transaction routes
router.get('/transactions', async (req: Request, res: Response) => {
  try {
    const { limit = '50', offset = '0', startDate, endDate } = req.query;

    let query = supabase
      .from('transactions')
      .select('*, transaction_items(*, products(*))')
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (startDate) {
      query = query.gte('created_at', String(startDate));
    }
    if (endDate) {
      query = query.lte('created_at', String(endDate));
    }

    const { data, error } = await query;

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch transactions';
    return res.status(500).json({ error: message });
  }
});

router.get('/transactions/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('transactions')
      .select('*, transaction_items(*, products(*))')
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    return res.status(200).json({ data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch transaction';
    return res.status(500).json({ error: message });
  }
});

router.post('/transactions', async (req: Request, res: Response) => {
  try {
    const {
      cashier_id,
      payment_method,
      total_amount,
      discount_amount = 0,
      tax_amount = 0,
      final_amount,
      items
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Transaction must contain at least one item' });
    }

    if (!payment_method || final_amount === undefined) {
      return res.status(400).json({ error: 'Payment method and final amount required' });
    }

    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert({
        cashier_id: cashier_id || null,
        payment_method,
        total_amount,
        discount_amount,
        tax_amount,
        final_amount,
        status: 'completed'
      })
      .select()
      .single();

    if (txError || !transaction) {
      return res.status(400).json({ error: txError?.message || 'Failed to create transaction' });
    }

    const transactionItems = items.map((item: {
      product_id: string;
      quantity: number;
      price_per_unit: number;
      subtotal: number;
    }) => ({
      transaction_id: transaction.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price_per_unit: item.price_per_unit,
      subtotal: item.subtotal
    }));

    const { error: itemsError } = await supabase
      .from('transaction_items')
      .insert(transactionItems);

    if (itemsError) {
      await supabase.from('transactions').delete().eq('id', transaction.id);
      return res.status(400).json({ error: itemsError.message });
    }

    for (const item of items) {
      const { data: product } = await supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', item.product_id)
        .single();

      if (product) {
        const nextStock = Math.max(0, product.stock_quantity - item.quantity);
        await supabase
          .from('products')
          .update({ stock_quantity: nextStock, updated_at: new Date().toISOString() })
          .eq('id', item.product_id);
      }
    }

    const { data: completeTransaction, error: fetchError } = await supabase
      .from('transactions')
      .select('*, transaction_items(*, products(*))')
      .eq('id', transaction.id)
      .single();

    if (fetchError) {
      return res.status(201).json({ data: transaction });
    }

    return res.status(201).json({ data: completeTransaction });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Transaction failed';
    return res.status(500).json({ error: message });
  }
});

// Centralized Sync Endpoints (for multi-device sharing: PC, Mobile HP, Tablet)
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve(process.cwd(), 'server', 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const USERS_FILE = path.join(DATA_DIR, 'users.json');
const STORE_DATA_FILE = path.join(DATA_DIR, 'store_data.json');

const readJson = (file: string, fallback: any) => {
  try {
    if (fs.existsSync(file)) {
      const raw = fs.readFileSync(file, 'utf-8');
      return JSON.parse(raw);
    }
  } catch {}
  return fallback;
};

const writeJson = (file: string, data: any) => {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to write JSON data:', e);
  }
};

router.get('/sync/users', (_req: Request, res: Response): void => {
  const users = readJson(USERS_FILE, []);
  res.status(200).json({ data: users });
});

router.post('/sync/users', (req: Request, res: Response): void => {
  const user = req.body;
  if (!user || !user.email) {
    res.status(400).json({ error: 'Invalid user payload' });
    return;
  }
  const users = readJson(USERS_FILE, []);
  const idx = users.findIndex((u: any) => u.email.toLowerCase() === user.email.toLowerCase());
  if (idx >= 0) {
    users[idx] = { ...users[idx], ...user };
  } else {
    users.push(user);
  }
  writeJson(USERS_FILE, users);
  res.status(200).json({ success: true, data: user });
});

router.delete('/sync/users/:id', (req: Request, res: Response): void => {
  const id = String(req.params.id);
  const users = readJson(USERS_FILE, []);
  const next = users.filter((u: any) => u.id !== id);
  writeJson(USERS_FILE, next);
  res.status(200).json({ success: true });
});

router.get('/sync/data/:key', (req: Request, res: Response): void => {
  const key = String(req.params.key);
  const store = readJson(STORE_DATA_FILE, {});
  res.status(200).json({ data: store[key] || null });
});

router.post('/sync/data/:key', (req: Request, res: Response): void => {
  const key = String(req.params.key);
  const { value } = req.body;
  const store = readJson(STORE_DATA_FILE, {});
  store[key] = value;
  writeJson(STORE_DATA_FILE, store);
  res.status(200).json({ success: true });
});

export default router;