import { Request, Response } from 'express';
import OpenAI from 'openai';
import { supabase } from '../config/supabase.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
});

interface BusinessMetrics {
  totalRevenue: number;
  totalTransactions: number;
  averageOrderValue: number;
  topSellingProducts: Array<{ name: string; quantity: number; revenue: number }>;
  lowStockProducts: Array<{ name: string; stock: number; minStock: number }>;
  salesByPaymentMethod: Record<string, number>;
  recentTransactionsCount: number;
}

const fetchBusinessMetrics = async (): Promise<BusinessMetrics> => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

  const { data: transactions, error: txError } = await supabase
    .from('transactions')
    .select(`
      id,
      total_amount,
      payment_method,
      created_at,
      transaction_items (
        id,
        product_id,
        quantity,
        subtotal,
        product:products (
          id,
          name,
          stock,
          min_stock
        )
      )
    `)
    .gte('created_at', thirtyDaysAgoISO)
    .order('created_at', { ascending: false });

  if (txError) {
    throw new Error(`Transaction fetch failed: ${txError.message}`);
  }

  const { data: lowStockItems, error: stockError } = await supabase
    .from('products')
    .select('name, stock, min_stock')
    .lte('stock', supabase.rpc('get_min_stock_column', {}) || 5);

  const productSalesMap = new Map<string, { name: string; quantity: number; revenue: number }>();
  const paymentMethods: Record<string, number> = {};
  let totalRevenue = 0;

  for (const tx of transactions || []) {
    totalRevenue += Number(tx.total_amount) || 0;
    const method = tx.payment_method || 'UNKNOWN';
    paymentMethods[method] = (paymentMethods[method] || 0) + 1;

    for (const item of (tx.transaction_items as any[]) || []) {
      const prodName = item.product?.name || 'Unknown Product';
      const qty = Number(item.quantity) || 0;
      const rev = Number(item.subtotal) || 0;

      const current = productSalesMap.get(prodName) || { name: prodName, quantity: 0, revenue: 0 };
      current.quantity += qty;
      current.revenue += rev;
      productSalesMap.set(prodName, current);
    }
  }

  const sortedTopProducts = Array.from(productSalesMap.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  const totalTransactions = transactions?.length || 0;
  const averageOrderValue = totalTransactions > 0 ? Math.round(totalRevenue / totalTransactions) : 0;

  let resolvedLowStock: Array<{ name: string; stock: number; minStock: number }> = [];
  if (lowStockItems && !stockError) {
    resolvedLowStock = lowStockItems.map((p: any) => ({
      name: p.name,
      stock: p.stock,
      minStock: p.min_stock
    }));
  } else {
    const { data: allProducts } = await supabase
      .from('products')
      .select('name, stock, min_stock');

    resolvedLowStock = (allProducts || [])
      .filter((p: any) => p.stock <= (p.min_stock ?? 5))
      .map((p: any) => ({
        name: p.name,
        stock: p.stock,
        minStock: p.min_stock ?? 5
      }))
      .slice(0, 10);
  }

  return {
    totalRevenue,
    totalTransactions,
    averageOrderValue,
    topSellingProducts: sortedTopProducts,
    lowStockProducts: resolvedLowStock,
    salesByPaymentMethod: paymentMethods,
    recentTransactionsCount: totalTransactions
  };
};

export const streamBusinessInsights = async (req: Request, res: Response): Promise<void> => {
  const { question, customContext } = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  try {
    const metrics = await fetchBusinessMetrics();

    const systemPrompt = `Anda adalah Kasir Pintar AI, konsultan bisnis & keuangan profesional untuk pemilik UMKM di Indonesia.
Analisis data operasional toko berikut:

[DATA 30 HARI TERAKHIR]
- Omzet Total: Rp ${metrics.totalRevenue.toLocaleString('id-ID')}
- Total Transaksi: ${metrics.totalTransactions}
- Nilai Rata-rata Transaksi: Rp ${metrics.averageOrderValue.toLocaleString('id-ID')}
- Metode Pembayaran: ${JSON.stringify(metrics.salesByPaymentMethod)}
- Produk Terlaris: ${JSON.stringify(metrics.topSellingProducts)}
- Peringatan Stok Menipis: ${JSON.stringify(metrics.lowStockProducts)}

PEDOMAN ANALISIS:
1. Berikan rekomendasi konkret, ringkas, actionable untuk operasional harian warung/toko UMKM.
2. Gunakan Bahasa Indonesia profesional, bersahabat, mudah dipahami pelaku usaha.
3. Soroti efisiensi perputaran modal, mitigasi out-of-stock, peluang bundling produk terlaris.
4. Gunakan format markdown dengan bullet points dan heading terstruktur.`;

    const userPrompt = question
      ? `Pertanyaan Pengguna: ${question}${customContext ? `\nCatatan Tambahan: ${customContext}` : ''}`
      : 'Berikan evaluasi kesehatan bisnis, identifikasi risiko stok kritis, dan 3 langkah strategis meningkatkan omzet minggu ini.';

    const stream = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      stream: true,
      temperature: 0.6,
      max_tokens: 1500
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    const errorMessage = error?.message || 'Internal server error processing AI insight';
    res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
};

export const getAggregatedMetrics = async (_req: Request, res: Response): Promise<void> => {
  try {
    const metrics = await fetchBusinessMetrics();
    res.status(200).json({
      success: true,
      data: metrics
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to aggregate business metrics'
    });
  }
};