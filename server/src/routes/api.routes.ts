import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.js';
import { handleAiChat, handleStockPrediction, handleBusinessInsights } from '../controllers/ai.controller.js';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email?: string;
    role?: string;
  };
}

interface CartItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  discount?: number;
  subtotal: number;
}

interface CreateTransactionBody {
  customer_name?: string;
  customer_phone?: string;
  payment_method: 'CASH' | 'QRIS' | 'TRANSFER' | 'DEBIT';
  total_amount: number;
  paid_amount: number;
  change_amount: number;
  items: CartItem[];
  notes?: string;
}

const router = Router();

const authenticateUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: 'Unauthorized: Missing token' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({ success: false, error: 'Unauthorized: Invalid token' });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.user_metadata?.role || 'cashier'
    };
    next();
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Auth failure' });
  }
};

const verifyWebhookSecret = (req: Request, res: Response, next: NextFunction): void => {
  const secretHeader = req.headers['x-webhook-secret'];
  const expectedSecret = process.env.SUPABASE_WEBHOOK_SECRET;

  if (expectedSecret && secretHeader !== expectedSecret) {
    res.status(403).json({ success: false, error: 'Forbidden: Invalid webhook secret' });
    return;
  }
  next();
};

router.post('/transactions', authenticateUser, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      customer_name,
      customer_phone,
      payment_method,
      total_amount,
      paid_amount,
      change_amount,
      items,
      notes
    } = req.body as CreateTransactionBody;

    if (!items || !items.length || !payment_method || total_amount == null) {
      res.status(400).json({ success: false, error: 'Invalid transaction payload' });
      return;
    }

    const invoiceNumber = `INV-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const productIds = items.map((i) => i.product_id);
    const { data: products, error: prodErr } = await supabase
      .from('products')
      .select('id, name, stock, price')
      .in('id', productIds);

    if (prodErr || !products) {
      res.status(500).json({ success: false, error: 'Failed to fetch stock verification data' });
      return;
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const item of items) {
      const prod = productMap.get(item.product_id);
      if (!prod) {
        res.status(404).json({ success: false, error: `Product ID ${item.product_id} not found` });
        return;
      }
      if (prod.stock < item.quantity) {
        res.status(400).json({
          success: false,
          error: `Stok tidak cukup untuk produk: ${prod.name}. Sisa: ${prod.stock}, diminta: ${item.quantity}`
        });
        return;
      }
    }

    const { data: tx, error: txErr } = await supabase
      .from('transactions')
      .insert({
        invoice_number: invoiceNumber,
        cashier_id: req.user?.id,
        customer_name: customer_name || 'Pelanggan Umum',
        customer_phone,
        payment_method,
        total_amount,
        paid_amount,
        change_amount,
        notes,
        status: 'COMPLETED'
      })
      .select()
      .single();

    if (txErr || !tx) {
      res.status(500).json({ success: false, error: txErr?.message || 'Transaction record failed' });
      return;
    }

    const txItemsPayload = items.map((item) => ({
      transaction_id: tx.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.subtotal
    }));

    const { error: itemsErr } = await supabase.from('transaction_items').insert(txItemsPayload);

    if (itemsErr) {
      await supabase.from('transactions').update({ status: 'FAILED' }).eq('id', tx.id);
      res.status(500).json({ success: false, error: itemsErr.message });
      return;
    }

    for (const item of items) {
      const prod = productMap.get(item.product_id)!;
      const updatedStock = prod.stock - item.quantity;
      await supabase
        .from('products')
        .update({ stock: updatedStock, updated_at: new Date().toISOString() })
        .eq('id', item.product_id);

      await supabase.from('stock_logs').insert({
        product_id: item.product_id,
        type: 'OUT',
        quantity: item.quantity,
        reference_id: tx.id,
        notes: `Penjualan ${invoiceNumber}`
      });
    }

    res.status(201).json({
      success: true,
      message: 'Transaksi berhasil disimpan',
      data: {
        transaction_id: tx.id,
        invoice_number: invoiceNumber,
        items_count: items.length,
        total_amount
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
});

router.get('/transactions', authenticateUser, async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('transactions')
      .select('*, transaction_items(*, products(name, barcode))', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (startDate) {
      query = query.gte('created_at', `${startDate}T00:00:00.000Z`);
    }
    if (endDate) {
      query = query.lte('created_at', `${endDate}T23:59:59.999Z`);
    }

    const { data, count, error } = await query;

    if (error) {
      res.status(500).json({ success: false, error: error.message });
      return;
    }

    res.json({
      success: true,
      data,
      meta: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/webhooks/stock-sync', verifyWebhookSecret, async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, table, record, old_record } = req.body;

    if (table !== 'stock_adjustments' && table !== 'purchase_orders') {
      res.json({ success: true, message: 'Event ignored: unrelated table' });
      return;
    }

    if (table === 'stock_adjustments' && (type === 'INSERT' || type === 'UPDATE')) {
      const { product_id, adjusted_quantity, reason } = record;

      if (product_id && adjusted_quantity != null) {
        const { error: stockErr } = await supabase
          .from('products')
          .update({ stock: adjusted_quantity, updated_at: new Date().toISOString() })
          .eq('id', product_id);

        if (stockErr) {
          res.status(500).json({ success: false, error: stockErr.message });
          return;
        }

        await supabase.from('stock_logs').insert({
          product_id,
          type: 'ADJUSTMENT',
          quantity: adjusted_quantity,
          notes: `Webhook Sync: ${reason || 'Manual Adjustment'}`
        });
      }
    }

    if (table === 'purchase_orders' && record?.status === 'RECEIVED' && old_record?.status !== 'RECEIVED') {
      const { data: poItems, error: poItemsErr } = await supabase
        .from('purchase_order_items')
        .select('product_id, quantity')
        .eq('purchase_order_id', record.id);

      if (!poItemsErr && poItems) {
        for (const item of poItems) {
          const { data: prod } = await supabase
            .from('products')
            .select('stock')
            .eq('id', item.product_id)
            .single();

          const currentStock = prod ? prod.stock : 0;
          await supabase
            .from('products')
            .update({ stock: currentStock + item.quantity, updated_at: new Date().toISOString() })
            .eq('id', item.product_id);

          await supabase.from('stock_logs').insert({
            product_id: item.product_id,
            type: 'IN',
            quantity: item.quantity,
            reference_id: record.id,
            notes: `Webhook Sync: PO Received #${record.id}`
          });
        }
      }
    }

    res.json({ success: true, message: 'Stock synchronized successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/reports/export', authenticateUser, async (req: Request, res: Response): Promise<void> => {
  try {
    const { format = 'csv', startDate, endDate, type = 'sales' } = req.query;

    if (type === 'sales') {
      let query = supabase
        .from('transactions')
        .select('id, invoice_number, created_at, customer_name, payment_method, total_amount, paid_amount, change_amount, status')
        .order('created_at', { ascending: false });

      if (startDate) {
        query = query.gte('created_at', `${startDate}T00:00:00.000Z`);
      }
      if (endDate) {
        query = query.lte('created_at', `${endDate}T23:59:59.999Z`);
      }

      const { data, error } = await query;
      if (error) {
        res.status(500).json({ success: false, error: error.message });
        return;
      }

      const rows = data || [];

      if (format === 'csv' || format === 'excel') {
        const headers = ['ID Invoice', 'Tanggal', 'Pelanggan', 'Metode Bayar', 'Total (IDR)', 'Bayar (IDR)', 'Kembali (IDR)', 'Status'];
        const csvRows = [
          headers.join(','),
          ...rows.map((r) => [
            `"${r.invoice_number}"`,
            `"${new Date(r.created_at).toLocaleString('id-ID')}"`,
            `"${(r.customer_name || '').replace(/"/g, '""')}"`,
            `"${r.payment_method}"`,
            r.total_amount,
            r.paid_amount,
            r.change_amount,
            `"${r.status}"`
          ].join(','))
        ];

        const csvString = csvRows.join('\r\n');
        const filename = `sales-report-${Date.now()}.${format === 'excel' ? 'csv' : 'csv'}`;

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.status(200).send('\uFEFF' + csvString);
        return;
      }
    } else if (type === 'inventory') {
      const { data, error } = await supabase
        .from('products')
        .select('barcode, name, category, cost_price, price, stock, min_stock')
        .order('name', { ascending: true });

      if (error) {
        res.status(500).json({ success: false, error: error.message });
        return;
      }

      const rows = data || [];
      const headers = ['Barcode', 'Nama Produk', 'Kategori', 'Harga Modal', 'Harga Jual', 'Stok', 'Min Stok'];
      const csvRows = [
        headers.join(','),
        ...rows.map((r) => [
          `"${r.barcode || ''}"`,
          `"${(r.name || '').replace(/"/g, '""')}"`,
          `"${r.category || ''}"`,
          r.cost_price || 0,
          r.price,
          r.stock,
          r.min_stock || 0
        ].join(','))
      ];

      const csvString = csvRows.join('\r\n');
      const filename = `inventory-report-${Date.now()}.csv`;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send('\uFEFF' + csvString);
      return;
    }

    res.status(400).json({ success: false, error: 'Invalid report type or format' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/ai/chat', authenticateUser, handleAiChat);
router.post('/ai/stock-prediction', authenticateUser, handleStockPrediction);
router.post('/ai/insights', authenticateUser, handleBusinessInsights);

export default router;