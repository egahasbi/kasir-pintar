import { Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import { generateInventoryForecast } from '../services/forecast.service.js';

interface StockLevelQuery {
  category?: string;
  lowStockOnly?: string;
  search?: string;
}

export const getDynamicStockLevels = async (req: Request<{}, {}, {}, StockLevelQuery>, res: Response): Promise<void> => {
  try {
    const { category, lowStockOnly, search } = req.query;

    let query = supabase
      .from('products')
      .select(`
        id,
        name,
        sku,
        category,
        price,
        cost_price,
        stock_quantity,
        min_stock_threshold,
        unit,
        updated_at,
        restock_alerts (
          id,
          status,
          priority,
          suggested_quantity,
          created_at
        )
      `)
      .order('stock_quantity', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
    }

    const { data: products, error } = await query;

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    const calculatedStock = (products || []).map((product) => {
      const stock = product.stock_quantity ?? 0;
      const minStock = product.min_stock_threshold ?? 10;
      const isLowStock = stock <= minStock;
      const stockDeficit = isLowStock ? minStock - stock : 0;
      const stockHealth = stock === 0 ? 'CRITICAL_OUT' : isLowStock ? 'LOW' : stock <= minStock * 1.5 ? 'WARNING' : 'HEALTHY';

      return {
        ...product,
        is_low_stock: isLowStock,
        stock_deficit: stockDeficit,
        stock_health: stockHealth,
        reorder_recommended: isLowStock
      };
    });

    const filtered = lowStockOnly === 'true' 
      ? calculatedStock.filter((p) => p.is_low_stock)
      : calculatedStock;

    res.status(200).json({
      success: true,
      count: filtered.length,
      data: filtered
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    res.status(500).json({ error: message });
  }
};

export const triggerRestockAlert = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId, suggestedQuantity, note, priority } = req.body;

    if (!productId) {
      res.status(400).json({ error: 'productId is required' });
      return;
    }

    const { data: product, error: fetchErr } = await supabase
      .from('products')
      .select('id, name, stock_quantity, min_stock_threshold')
      .eq('id', productId)
      .single();

    if (fetchErr || !product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const defaultQuantity = Math.max(
      (product.min_stock_threshold * 2) - product.stock_quantity,
      product.min_stock_threshold
    );

    const alertPayload = {
      product_id: product.id,
      current_stock: product.stock_quantity,
      threshold_stock: product.min_stock_threshold,
      suggested_quantity: suggestedQuantity && Number(suggestedQuantity) > 0 ? Number(suggestedQuantity) : defaultQuantity,
      priority: priority || (product.stock_quantity <= 0 ? 'CRITICAL' : 'HIGH'),
      status: 'PENDING',
      notes: note || `Manual restock alert triggered for ${product.name}`,
      created_at: new Date().toISOString()
    };

    const { data: alert, error: insertErr } = await supabase
      .from('restock_alerts')
      .insert(alertPayload)
      .select()
      .single();

    if (insertErr) {
      res.status(500).json({ error: insertErr.message });
      return;
    }

    res.status(201).json({
      success: true,
      message: 'Restock alert triggered successfully',
      data: alert
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    res.status(500).json({ error: message });
  }
};

export const getStockForecasting = async (req: Request, res: Response): Promise<void> => {
  try {
    const { days = '30', productId } = req.query;
    const forecastDays = Math.min(Math.max(parseInt(days as string, 10) || 30, 7), 90);

    const forecastData = await generateInventoryForecast(forecastDays, productId as string | undefined);

    res.status(200).json({
      success: true,
      forecast_horizon_days: forecastDays,
      data: forecastData
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to generate inventory forecast';
    res.status(500).json({ error: message });
  }
};

export const dismissRestockAlert = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { resolutionNotes } = req.body;

    if (!id) {
      res.status(400).json({ error: 'Alert ID is required' });
      return;
    }

    const { data: updated, error } = await supabase
      .from('restock_alerts')
      .update({
        status: 'RESOLVED',
        notes: resolutionNotes ? resolutionNotes : 'Dismissed by store manager',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(200).json({
      success: true,
      data: updated
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    res.status(500).json({ error: message });
  }
};

export const getRestockAlerts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status = 'PENDING' } = req.query;

    let query = supabase
      .from('restock_alerts')
      .select(`
        id,
        product_id,
        current_stock,
        threshold_stock,
        suggested_quantity,
        priority,
        status,
        notes,
        created_at,
        products (
          id,
          name,
          sku,
          price,
          category,
          stock_quantity
        )
      `)
      .order('created_at', { ascending: false });

    if (status !== 'ALL') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(200).json({
      success: true,
      count: data?.length || 0,
      data: data || []
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    res.status(500).json({ error: message });
  }
};