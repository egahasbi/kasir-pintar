import { Request, Response } from 'express';
import { supabase } from '../config/supabase.js';

export interface ProductParams {
  id: string;
}

export interface CreateProductBody {
  name: string;
  sku: string;
  barcode?: string | null;
  category: string;
  price: number;
  cost_price: number;
  stock: number;
  min_stock_alert?: number;
  unit?: string;
  image_url?: string | null;
}

export interface UpdateProductBody {
  name?: string;
  sku?: string;
  barcode?: string | null;
  category?: string;
  price?: number;
  cost_price?: number;
  stock?: number;
  min_stock_alert?: number;
  unit?: string;
  image_url?: string | null;
}

export interface StockAdjustmentBody {
  quantity: number;
  reason: 'sale' | 'restock' | 'damage' | 'loss' | 'correction';
  notes?: string;
}

export interface BatchCheckoutItem {
  id: string;
  quantity: number;
}

export interface BatchCheckoutBody {
  items: BatchCheckoutItem[];
  invoice_number?: string;
}

export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, search, low_stock } = req.query;

    let query = supabase.from('products').select('*').order('created_at', { ascending: false });

    if (category && typeof category === 'string') {
      query = query.eq('category', category);
    }

    if (search && typeof search === 'string') {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,barcode.ilike.%${search}%`);
    }

    if (low_stock === 'true') {
      query = query.filter('stock', 'lte', 'min_stock_alert');
    }

    const { data, error } = await query;

    if (error) {
      res.status(500).json({ error: 'Database fetch failed', message: error.message });
      return;
    }

    res.status(200).json({ success: true, data: data ?? [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown server error';
    res.status(500).json({ error: 'Internal server error', message });
  }
};

export const getProductById = async (req: Request<ProductParams>, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      res.status(400).json({ error: 'Invalid product ID' });
      return;
    }

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      res.status(404).json({ error: 'Product not found', message: error.message });
      return;
    }

    res.status(200).json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown server error';
    res.status(500).json({ error: 'Internal server error', message });
  }
};

export const createProduct = async (
  req: Request<Record<string, never>, unknown, CreateProductBody>,
  res: Response
): Promise<void> => {
  try {
    const { name, sku, category, price, cost_price, stock, barcode, min_stock_alert, unit, image_url } = req.body;

    if (!name || !sku || !category || price === undefined || cost_price === undefined || stock === undefined) {
      res.status(400).json({
        error: 'Missing required product fields: name, sku, category, price, cost_price, stock'
      });
      return;
    }

    if (price < 0 || cost_price < 0 || stock < 0) {
      res.status(400).json({ error: 'Numeric fields cannot be negative' });
      return;
    }

    const { data, error } = await supabase
      .from('products')
      .insert([
        {
          name: name.trim(),
          sku: sku.trim(),
          barcode: barcode ? barcode.trim() : null,
          category: category.trim(),
          price: Number(price),
          cost_price: Number(cost_price),
          stock: Number(stock),
          min_stock_alert: min_stock_alert !== undefined ? Number(min_stock_alert) : 10,
          unit: unit ? unit.trim() : 'pcs',
          image_url: image_url || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      const status = error.code === '23505' ? 409 : 400;
      res.status(status).json({ error: 'Product creation failed', message: error.message });
      return;
    }

    res.status(201).json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown server error';
    res.status(500).json({ error: 'Internal server error', message });
  }
};

export const updateProduct = async (
  req: Request<ProductParams, unknown, UpdateProductBody>,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!id || typeof id !== 'string') {
      res.status(400).json({ error: 'Invalid product ID' });
      return;
    }

    if (!updates || Object.keys(updates).length === 0) {
      res.status(400).json({ error: 'No update payload provided' });
      return;
    }

    if (updates.price !== undefined && updates.price < 0) {
      res.status(400).json({ error: 'Price cannot be negative' });
      return;
    }

    if (updates.stock !== undefined && updates.stock < 0) {
      res.status(400).json({ error: 'Stock cannot be negative' });
      return;
    }

    const { data, error } = await supabase
      .from('products')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      res.status(400).json({ error: 'Product update failed', message: error.message });
      return;
    }

    if (!data) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    res.status(200).json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown server error';
    res.status(500).json({ error: 'Internal server error', message });
  }
};

export const deleteProduct = async (req: Request<ProductParams>, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      res.status(400).json({ error: 'Invalid product ID' });
      return;
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      res.status(400).json({ error: 'Product deletion failed', message: error.message });
      return;
    }

    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown server error';
    res.status(500).json({ error: 'Internal server error', message });
  }
};

export const adjustStock = async (
  req: Request<ProductParams, unknown, StockAdjustmentBody>,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { quantity, reason, notes } = req.body;

    if (!id || typeof id !== 'string') {
      res.status(400).json({ error: 'Invalid product ID' });
      return;
    }

    if (quantity === undefined || typeof quantity !== 'number' || quantity === 0) {
      res.status(400).json({ error: 'Non-zero numeric quantity required' });
      return;
    }

    const validReasons = ['sale', 'restock', 'damage', 'loss', 'correction'];
    if (!reason || !validReasons.includes(reason)) {
      res.status(400).json({ error: `Invalid reason. Must be one of: ${validReasons.join(', ')}` });
      return;
    }

    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('stock')
      .eq('id', id)
      .single();

    if (fetchError || !product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const newStock = product.stock + quantity;
    if (newStock < 0) {
      res.status(400).json({
        error: 'Insufficient stock',
        current_stock: product.stock,
        attempted_deduction: Math.abs(quantity)
      });
      return;
    }

    const { data: updatedProduct, error: updateError } = await supabase
      .from('products')
      .update({
        stock: newStock,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      res.status(500).json({ error: 'Stock update failed', message: updateError.message });
      return;
    }

    await supabase.from('inventory_logs').insert([
      {
        product_id: id,
        delta: quantity,
        balance: newStock,
        reason,
        notes: notes || null,
        created_at: new Date().toISOString()
      }
    ]);

    res.status(200).json({ success: true, data: updatedProduct });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown server error';
    res.status(500).json({ error: 'Internal server error', message });
  }
};

export const batchCheckout = async (
  req: Request<Record<string, never>, unknown, BatchCheckoutBody>,
  res: Response
): Promise<void> => {
  try {
    const { items, invoice_number } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Cart items array cannot be empty' });
      return;
    }

    for (const item of items) {
      if (!item.id || typeof item.quantity !== 'number' || item.quantity <= 0) {
        res.status(400).json({
          error: 'Every item must contain a valid id and positive quantity',
          invalid_item: item
        });
        return;
      }
    }

    const productIds = items.map((i) => i.id);
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, name, stock')
      .in('id', productIds);

    if (fetchError || !products) {
      res.status(500).json({ error: 'Failed to verify inventory items', message: fetchError?.message });
      return;
    }

    if (products.length !== productIds.length) {
      const foundIds = new Set(products.map((p) => p.id));
      const missingIds = productIds.filter((id) => !foundIds.has(id));
      res.status(404).json({ error: 'Some products not found', missing_ids: missingIds });
      return;
    }

    const productMap = new Map(products.map((p) => [p.id, p]));
    const stockViolations: { id: string; name: string; requested: number; available: number }[] = [];

    for (const item of items) {
      const prod = productMap.get(item.id)!;
      if (prod.stock < item.quantity) {
        stockViolations.push({
          id: prod.id,
          name: prod.name,
          requested: item.quantity,
          available: prod.stock
        });
      }
    }

    if (stockViolations.length > 0) {
      res.status(409).json({
        error: 'Insufficient inventory for one or more items',
        violations: stockViolations
      });
      return;
    }

    const updatedResults = [];
    const logsPayload = [];
    const timestamp = new Date().toISOString();

    for (const item of items) {
      const prod = productMap.get(item.id)!;
      const targetStock = prod.stock - item.quantity;

      const { data: updated, error: updateErr } = await supabase
        .from('products')
        .update({
          stock: targetStock,
          updated_at: timestamp
        })
        .eq('id', item.id)
        .select()
        .single();

      if (updateErr) {
        res.status(500).json({
          error: `Failed to deduct stock for product ID: ${item.id}`,
          message: updateErr.message
        });
        return;
      }

      updatedResults.push(updated);
      logsPayload.push({
        product_id: item.id,
        delta: -item.quantity,
        balance: targetStock,
        reason: 'sale',
        notes: invoice_number ? `POS Checkout: ${invoice_number}` : 'POS Checkout',
        created_at: timestamp
      });
    }

    if (logsPayload.length > 0) {
      await supabase.from('inventory_logs').insert(logsPayload);
    }

    res.status(200).json({
      success: true,
      message: 'Batch checkout inventory sync complete',
      processed_count: updatedResults.length,
      data: updatedResults
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown server error';
    res.status(500).json({ error: 'Internal server error', message });
  }
};

export const getInventory = getProducts;
export const updateStock = adjustStock;

export const getLowStockAlerts = async (_req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .filter('stock', 'lte', 'min_stock_alert');

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(200).json({ success: true, data: data || [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown server error';
    res.status(500).json({ error: message });
  }
};
