import OpenAI from 'openai';
import { supabase } from '../config/supabase.js';

interface StockForecastItem {
  productId: string;
  productName: string;
  currentStock: number;
  unit: string;
  avgDailySales: number;
  predictedDepletionDate: string | null;
  daysUntilDepletion: number | null;
  recommendedReorderPoint: number;
  recommendedOrderQuantity: number;
  urgency: 'critical' | 'warning' | 'normal' | 'overstocked';
  reasoning: string;
}

interface ForecastResponse {
  summary: string;
  generatedAt: string;
  forecasts: StockForecastItem[];
}

interface AggregatedSalesData {
  productId: string;
  productName: string;
  currentStock: number;
  minStock: number;
  unit: string;
  price: number;
  totalSoldLast30Days: number;
  daysWithSales: number;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
});

export async function generateStockForecast(): Promise<ForecastResponse> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const isoStartDate = thirtyDaysAgo.toISOString();

  const { data: products, error: prodErr } = await supabase
    .from('products')
    .select('id, name, stock, min_stock, unit, price')
    .order('name');

  if (prodErr || !products) {
    throw new Error(`Failed to load products: ${prodErr?.message || 'Empty product list'}`);
  }

  const { data: orderItems, error: itemsErr } = await supabase
    .from('order_items')
    .select(`
      product_id,
      quantity,
      created_at,
      orders!inner (
        status,
        created_at
      )
    `)
    .gte('created_at', isoStartDate)
    .eq('orders.status', 'completed');

  if (itemsErr) {
    throw new Error(`Failed to load historical transactions: ${itemsErr.message}`);
  }

  const salesByProduct = new Map<string, { totalSold: number; uniqueDates: Set<string> }>();

  for (const item of orderItems || []) {
    const pId = item.product_id;
    const qty = Number(item.quantity) || 0;
    const dateStr = item.created_at ? item.created_at.split('T')[0] : '';

    const current = salesByProduct.get(pId) || { totalSold: 0, uniqueDates: new Set<string>() };
    current.totalSold += qty;
    if (dateStr) {
      current.uniqueDates.add(dateStr);
    }
    salesByProduct.set(pId, current);
  }

  const aggregatedData: AggregatedSalesData[] = products.map((prod) => {
    const sales = salesByProduct.get(prod.id);
    return {
      productId: prod.id,
      productName: prod.name,
      currentStock: Number(prod.stock),
      minStock: Number(prod.min_stock) || 5,
      unit: prod.unit || 'pcs',
      price: Number(prod.price) || 0,
      totalSoldLast30Days: sales ? sales.totalSold : 0,
      daysWithSales: sales ? sales.uniqueDates.size : 0
    };
  });

  const promptPayload = {
    today: new Date().toISOString().split('T')[0],
    lookbackDays: 30,
    products: aggregatedData
  };

  const systemPrompt = `You are a supply chain and inventory forecasting engine for Indonesian MSMEs (UMKM).
Analyze historical 30-day aggregate sales and current inventory levels.
Predict exact stock depletion dates, assess stockout risk, and calculate reorder points.

Formula guidelines:
- Average Daily Sales (avgDailySales) = totalSoldLast30Days / 30.
- Days Until Depletion = currentStock / avgDailySales (null if avgDailySales == 0).
- Predicted Depletion Date = today + daysUntilDepletion in YYYY-MM-DD (null if avgDailySales == 0).
- Urgency:
  * "critical": daysUntilDepletion <= 3 OR currentStock <= minStock
  * "warning": daysUntilDepletion <= 7
  * "overstocked": currentStock > (avgDailySales * 45) AND avgDailySales > 0
  * "normal": healthy balance
- Recommended Reorder Point = ceiling(avgDailySales * leadTimeDays) + safetyStock, default lead time 3-7 days.
- Recommended Order Quantity = target 30-day buffer replenishment.

Always return strict JSON conforming to this schema:
{
  "summary": "String Indonesian language executive summary for business owner",
  "forecasts": [
    {
      "productId": "UUID",
      "productName": "String",
      "currentStock": Number,
      "unit": "String",
      "avgDailySales": Number,
      "predictedDepletionDate": "YYYY-MM-DD or null",
      "daysUntilDepletion": Number or null,
      "recommendedReorderPoint": Number,
      "recommendedOrderQuantity": Number,
      "urgency": "critical" | "warning" | "normal" | "overstocked",
      "reasoning": "Short Indonesian explanation"
    }
  ]
}`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    temperature: 0.2,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: JSON.stringify(promptPayload) }
    ]
  });

  const rawContent = completion.choices[0]?.message?.content;
  if (!rawContent) {
    throw new Error('OpenAI returned empty response for stock forecast.');
  }

  const parsed = JSON.parse(rawContent) as {
    summary: string;
    forecasts: StockForecastItem[];
  };

  return {
    summary: parsed.summary || 'Proyeksi inventaris berhasil dihitung.',
    generatedAt: new Date().toISOString(),
    forecasts: parsed.forecasts || []
  };
}

export async function getProductForecastById(productId: string): Promise<StockForecastItem | null> {
  const allForecasts = await generateStockForecast();
  return allForecasts.forecasts.find((f) => f.productId === productId) || null;
}