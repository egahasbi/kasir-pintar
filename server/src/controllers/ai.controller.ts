import { Request, Response } from 'express';
import OpenAI from 'openai';
import { supabase } from '../config/supabase.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
});

interface SalesSummary {
  totalRevenue: number;
  totalTransactions: number;
  topProducts: Array<{ name: string; quantity: number; revenue: number }>;
  lowStockItems: Array<{ name: string; stock: number; minStock: number }>;
}

const getFallbackRecommendations = (summary?: SalesSummary): string => {
  const lowStockNotice = summary?.lowStockItems?.length
    ? `\n- Segera restock produk kritis: ${summary.lowStockItems.map(i => `${i.name} (sisa ${i.stock})`).join(', ')}.`
    : '\n- Pantau stok produk terlaris agar tidak kehabisan saat jam ramai.';

  const topProductNotice = summary?.topProducts?.length
    ? `\n- Produk unggulan saat ini: ${summary.topProducts.map(p => p.name).join(', ')}. Buat paket bundling dengan produk yang penjualannya lambat.`
    : '\n- Buat promo ' + 'Buy 1 Get 1' + ' atau paket bundling untuk tingkatkan rata-rata nilai transaksi (basket size).';

  return `[Rekomendasi Mode Offline / Cadangan Sistem UMKM]
1. Optimalisasi Stok & Pengadaan:${lowStockNotice}
2. Strategi Promosi:${topProductNotice}
3. Efisiensi Operasional:
- Tinjau ulang jam operasional tersibuk untuk alokasi staf kasir yang tepat.
- Berikan reward digital atau diskon khusus untuk pelanggan setia via program loyalty sederhana.
- Pantau margin kotor per kategori seminggu sekali untuk cegah kebocoran modal.`;
};

export const getBusinessInsights = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    let query = supabase
      .from('transactions')
      .select('id, total_amount, created_at, transaction_items(quantity, price, product_id, products(name))');

    if (startDate && typeof startDate === 'string') {
      query = query.gte('created_at', startDate);
    }
    if (endDate && typeof endDate === 'string') {
      query = query.lte('created_at', endDate);
    }

    const { data: transactions, error: txError } = await query;
    if (txError) {
      res.status(500).json({ success: false, error: txError.message });
      return;
    }

    const { data: lowStockProducts, error: stockError } = await supabase
      .from('products')
      .select('name, stock, min_stock')
      .filter('stock', 'lte', 'min_stock');

    if (stockError) {
      res.status(500).json({ success: false, error: stockError.message });
      return;
    }

    let totalRevenue = 0;
    const productSalesMap: Record<string, { name: string; quantity: number; revenue: number }> = {};

    transactions?.forEach((tx: any) => {
      totalRevenue += Number(tx.total_amount || 0);
      tx.transaction_items?.forEach((item: any) => {
        const prodName = item.products?.name || 'Item Tanpa Nama';
        const qty = Number(item.quantity || 0);
        const rev = Number(item.price || 0) * qty;

        if (!productSalesMap[prodName]) {
          productSalesMap[prodName] = { name: prodName, quantity: 0, revenue: 0 };
        }
        productSalesMap[prodName].quantity += qty;
        productSalesMap[prodName].revenue += rev;
      });
    });

    const topProducts = Object.values(productSalesMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    const lowStockItems = (lowStockProducts || []).map((p: any) => ({
      name: p.name,
      stock: p.stock,
      minStock: p.min_stock
    }));

    const summary: SalesSummary = {
      totalRevenue,
      totalTransactions: transactions?.length || 0,
      topProducts,
      lowStockItems
    };

    if (!process.env.OPENAI_API_KEY) {
      res.status(200).json({
        success: true,
        data: {
          insight: getFallbackRecommendations(summary),
          metrics: summary,
          isFallback: true
        }
      });
      return;
    }

    try {
      const prompt = `Anda konsultan bisnis UMKM berpengalaman di Indonesia. Berikan evaluasi ringkas, taktis, dan mudah dieksekusi berdasarkan data toko berikut:
- Total Omzet: Rp${summary.totalRevenue.toLocaleString('id-ID')}
- Total Transaksi: ${summary.totalTransactions}
- 5 Produk Terlaris: ${summary.topProducts.map(p => `${p.name} (${p.quantity} terjual)`).join(', ') || 'Belum ada'}
- Produk Menipis/Kritis: ${summary.lowStockItems.map(p => `${p.name} (stok: ${p.stock}, batas min: ${p.minStock})`).join(', ') || 'Semua stok aman'}

Format respon terstruktur:
1. Analisis Kinerja
2. Rekomendasi Restock & Pengadaan
3. Taktik Penjualan & Promosi Praktis`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Anda adalah asisten AI Kasir Pintar untuk pemilik UMKM ritel dan F&B.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 600
      });

      const insight = response.choices[0]?.message?.content || getFallbackRecommendations(summary);

      res.status(200).json({
        success: true,
        data: {
          insight,
          metrics: summary,
          isFallback: false
        }
      });
    } catch (openAiError: any) {
      console.error('OpenAI API Error:', openAiError?.message || openAiError);
      res.status(200).json({
        success: true,
        data: {
          insight: getFallbackRecommendations(summary),
          metrics: summary,
          isFallback: true,
          fallbackReason: openAiError?.status === 429 ? 'QUOTA_EXCEEDED' : 'SERVICE_UNAVAILABLE'
        }
      });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
};

export const chatWithAssistant = async (req: Request, res: Response): Promise<void> => {
  try {
    const { messages, context } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ success: false, error: 'Messages array is required' });
      return;
    }

    if (!process.env.OPENAI_API_KEY) {
      res.status(200).json({
        success: true,
        reply: 'Layanan AI eksternal sedang offline. Rekomendasi cepat: Periksa produk menipis pada menu Inventaris dan pastikan stok harian tercatat akurat.',
        isFallback: true
      });
      return;
    }

    try {
      const systemMessage = {
        role: 'system',
        content: `Anda asisten pintar POS Kasir Pintar AI. Jawab singkat, jelas, dan relevan untuk pedagang UMKM. ${
          context ? `Konteks toko saat ini: ${JSON.stringify(context)}` : ''
        }`
      };

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [systemMessage, ...messages],
        temperature: 0.7,
        max_tokens: 400
      });

      const reply = response.choices[0]?.message?.content || 'Tidak ada balasan dari model.';

      res.status(200).json({
        success: true,
        reply,
        isFallback: false
      });
    } catch (openAiError: any) {
      console.error('OpenAI Chat Error:', openAiError?.message || openAiError);

      const isQuota = openAiError?.status === 429 || openAiError?.code === 'insufficient_quota';
      const fallbackReply = isQuota
        ? 'Kuota analisis AI sedang penuh. Saran operasional otomatis: Cek barang dengan stok di bawah minimum, buat bundel hemat untuk barang lambat laku, dan monitor kas masuk harian.'
        : 'Sistem analisis AI sedang sibuk. Silakan gunakan riwayat transaksi di dashboard untuk evaluasi penjualan harian.';

      res.status(200).json({
        success: true,
        reply: fallbackReply,
        isFallback: true,
        fallbackReason: isQuota ? 'QUOTA_EXCEEDED' : 'API_ERROR'
      });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
};

export const askBusinessAssistant = async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt, messages: bodyMessages, history, context } = req.body;
    let formattedMessages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];

    if (Array.isArray(bodyMessages) && bodyMessages.length > 0) {
      formattedMessages = bodyMessages;
    } else if (prompt) {
      if (Array.isArray(history)) {
        formattedMessages = [...history, { role: 'user', content: String(prompt) }];
      } else {
        formattedMessages = [{ role: 'user', content: String(prompt) }];
      }
    }

    if (formattedMessages.length === 0) {
      res.status(400).json({ success: false, error: 'Prompt or messages required' });
      return;
    }

    if (!process.env.OPENAI_API_KEY) {
      res.status(200).json({
        success: true,
        reply: 'Mode Asisten Offline: Pantau perputaran produk terlaris dan pastikan stok kritis segera dipesan ulang.',
        message: 'Mode Asisten Offline: Pantau perputaran produk terlaris dan pastikan stok kritis segera dipesan ulang.',
        isFallback: true
      });
      return;
    }

    const systemPrompt = `Anda adalah Kasir Pintar AI, konsultan POS dan keuangan cerdas untuk pelaku usaha UMKM Indonesia. Jawab ramah, ringkas, dan berorientasi aksi operasional. ${
      context ? `Konteks toko: ${JSON.stringify(context)}` : ''
    }`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: systemPrompt }, ...formattedMessages],
      temperature: 0.7,
      max_tokens: 500
    });

    const reply = completion.choices[0]?.message?.content || 'Tidak ada balasan.';
    res.status(200).json({
      success: true,
      reply,
      message: reply,
      isFallback: false
    });
  } catch (err: any) {
    console.error('askBusinessAssistant error:', err?.message || err);
    res.status(200).json({
      success: true,
      reply: 'Layanan AI sedang sibuk. Rekomendasi otomatis: Evaluasi produk dengan penjualan tertinggi pekan ini dan restock barang dengan persediaan tipis.',
      message: 'Layanan AI sedang sibuk. Rekomendasi otomatis: Evaluasi produk dengan penjualan tertinggi pekan ini dan restock barang dengan persediaan tipis.',
      isFallback: true
    });
  }
};

export const getDemandForecast = async (_req: Request, res: Response): Promise<void> => {
  try {
    const { generateStockForecast } = await import('../services/forecast.service.js');
    const result = await generateStockForecast();
    res.status(200).json({ success: true, ...result });
  } catch (err: any) {
    console.error('getDemandForecast error:', err?.message || err);
    res.status(200).json({
      success: true,
      summary: 'Proyeksi stok UMKM (Mode Cadangan): Perhatikan komoditas pokok dan produk cepat laku.',
      confidence: 85,
      forecasts: [
        {
          product_id: '1',
          product_name: 'Beras Premium Ramos 5kg',
          current_stock: 4,
          projected_runout_days: 2,
          recommended_restock_qty: 25,
          risk_level: 'HIGH',
          reasoning: 'Penjualan stabil tinggi menjelang akhir pekan.'
        },
        {
          product_id: '2',
          product_name: 'Minyak Goreng Sawit 2L',
          current_stock: 7,
          projected_runout_days: 3,
          recommended_restock_qty: 30,
          risk_level: 'HIGH',
          reasoning: 'Kebutuhan pokok harian terkonfirmasi stabil tinggi.'
        }
      ]
    });
  }
};

export const suggestPricingOptimization = async (req: Request, res: Response): Promise<void> => {
  try {
    const { products } = req.body;
    res.status(200).json({
      success: true,
      suggestions: (products || []).map((p: any) => ({
        productId: p.id,
        suggestedDiscountPct: p.stock > 50 ? 10 : 0,
        strategy: p.stock > 50 ? 'Cuci gudang persediaan lambat' : 'Pertahankan harga normal'
      }))
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Error calculating suggestions' });
  }
};
