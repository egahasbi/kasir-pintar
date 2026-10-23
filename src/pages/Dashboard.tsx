import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../config/supabase';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Award, 
  ArrowUpRight, 
  Calendar, 
  RefreshCw,
  Sparkles,
  BarChart3
} from 'lucide-react';

interface MetricSummary {
  omzet: number;
  grossProfit: number;
  totalTransactions: number;
  avgOrderValue: number;
}

interface TrendPoint {
  label: string;
  omzet: number;
  profit: number;
}

interface BestSellerProduct {
  id: string;
  name: string;
  sku: string;
  category: string;
  soldQty: number;
  revenue: number;
  profit: number;
}

export const Dashboard: React.FC = () => {
  const [period, setPeriod] = useState<'daily' | 'monthly'>('daily');
  const [loading, setLoading] = useState<boolean>(true);
  const [aiInsight, setAiInsight] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState<boolean>(false);
  
  const [metrics, setMetrics] = useState<MetricSummary>({
    omzet: 0,
    grossProfit: 0,
    totalTransactions: 0,
    avgOrderValue: 0,
  });
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [topProducts, setTopProducts] = useState<BestSellerProduct[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const now = new Date();
      let startDate = new Date();

      if (period === 'daily') {
        startDate.setDate(now.getDate() - 14); // Last 14 days
      } else {
        startDate.setMonth(now.getMonth() - 6); // Last 6 months
      }

      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select(`
          id,
          total_amount,
          created_at,
          sale_items (
            quantity,
            price,
            product_id,
            products (
              id,
              name,
              sku,
              category,
              cost_price
            )
          )
        `)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (salesError) throw salesError;

      let totalRevenue = 0;
      let totalCost = 0;
      const productMap = new Map<string, BestSellerProduct>();
      const trendMap = new Map<string, { omzet: number; profit: number }>();

      (sales || []).forEach((sale: any) => {
        totalRevenue += Number(sale.total_amount || 0);

        const date = new Date(sale.created_at);
        const label = period === 'daily'
          ? `${date.getDate()}/${date.getMonth() + 1}`
          : `${date.toLocaleString('id-ID', { month: 'short' })} ${date.getFullYear()}`;

        if (!trendMap.has(label)) {
          trendMap.set(label, { omzet: 0, profit: 0 });
        }
        const point = trendMap.get(label)!;
        point.omzet += Number(sale.total_amount || 0);

        (sale.sale_items || []).forEach((item: any) => {
          const qty = Number(item.quantity || 0);
          const sellPrice = Number(item.price || 0);
          const costPrice = Number(item.products?.cost_price || 0);
          const itemCost = costPrice * qty;
          const itemProfit = (sellPrice * qty) - itemCost;

          totalCost += itemCost;
          point.profit += itemProfit;

          const prodId = item.product_id;
          if (prodId) {
            const existing = productMap.get(prodId) || {
              id: prodId,
              name: item.products?.name || 'Produk Dihapus',
              sku: item.products?.sku || '-',
              category: item.products?.category || 'Umum',
              soldQty: 0,
              revenue: 0,
              profit: 0,
            };

            existing.soldQty += qty;
            existing.revenue += sellPrice * qty;
            existing.profit += itemProfit;
            productMap.set(prodId, existing);
          }
        });
      });

      const grossProfit = totalRevenue - totalCost;
      const totalCount = sales ? sales.length : 0;

      setMetrics({
        omzet: totalRevenue,
        grossProfit,
        totalTransactions: totalCount,
        avgOrderValue: totalCount > 0 ? Math.round(totalRevenue / totalCount) : 0,
      });

      const trendPoints: TrendPoint[] = Array.from(trendMap.entries()).map(([label, val]) => ({
        label,
        omzet: val.omzet,
        profit: val.profit,
      }));
      setTrendData(trendPoints);

      const sortedProducts = Array.from(productMap.values())
        .sort((a, b) => b.soldQty - a.soldQty)
        .slice(0, 5);
      setTopProducts(sortedProducts);

    } catch (err) {
      console.error('Fetch dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getAiBusinessAdvice = async () => {
    setLoadingAi(true);
    try {
      const response = await fetch('/api/ai/analytics-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics, topProducts }),
      });
      const resData = await response.json();
      setAiInsight(resData.insight || 'Performa stabil. Maksimalkan promosi pada produk terlaris.');
    } catch {
      setAiInsight('Performa margin sehat. Naikkan stok produk unggulan dan buat bundling hemat untuk tingkatkan nilai transaksi.');
    } finally {
      setLoadingAi(false);
    }
  };

  const maxTrendOmzet = useMemo(() => {
    return Math.max(...trendData.map((d) => d.omzet), 1);
  }, [trendData]);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen text-slate-800">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard Eksekutif</h1>
          <p className="text-sm text-slate-500">Analitik performa finansial & inventaris UMKM real-time</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-200 p-1 rounded-lg">
            <button
              onClick={() => setPeriod('daily')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                period === 'daily'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Harian (14 Hari)
            </button>
            <button
              onClick={() => setPeriod('monthly')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                period === 'monthly'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bulanan (6 Bulan)
            </button>
          </div>

          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-600 disabled:opacity-50"
            title="Muat ulang data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase">Total Omzet</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold mt-2 text-slate-900">
            {formatRupiah(metrics.omzet)}
          </div>
          <div className="flex items-center text-xs text-emerald-600 font-medium mt-1">
            <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
            Pendapatan kotor tercatat
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase">Gross Profit (Laba Kotor)</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold mt-2 text-slate-900">
            {formatRupiah(metrics.grossProfit)}
          </div>
          <div className="flex items-center text-xs text-indigo-600 font-medium mt-1">
            Margin: {metrics.omzet > 0 ? ((metrics.grossProfit / metrics.omzet) * 100).toFixed(1) : 0}%
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase">Total Transaksi</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold mt-2 text-slate-900">
            {metrics.totalTransactions.toLocaleString('id-ID')}
          </div>
          <div className="text-xs text-slate-400 mt-1">Struk keluar terverifikasi</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase">Rata-rata Order (AOV)</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold mt-2 text-slate-900">
            {formatRupiah(metrics.avgOrderValue)}
          </div>
          <div className="text-xs text-slate-400 mt-1">Per transaksi checkout</div>
        </div>
      </div>

      {/* AI Business Assistant Section */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white rounded-xl p-5 mb-6 shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center backdrop-blur-sm">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base font-semibold">KasirPintar AI Business Advisor</h2>
              <p className="text-xs text-indigo-200">Analisis metrik otomatis berbasis GPT engine untuk keputusan taktis UMKM</p>
            </div>
          </div>

          <button
            onClick={getAiBusinessAdvice}
            disabled={loadingAi}
            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 disabled:bg-indigo-700 text-xs font-bold rounded-lg shadow-sm transition-all"
          >
            {loadingAi ? 'Menganalisis...' : 'Generate Rekomendasi'}
          </button>
        </div>

        {aiInsight && (
          <div className="mt-4 p-4 bg-white/10 rounded-lg text-sm leading-relaxed border border-white/10 backdrop-blur-sm">
            {aiInsight}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-semibold text-slate-900">Tren Penjualan & Laba Bersih</h2>
              <p className="text-xs text-slate-400">Komparasi pendapatan kotor vs gross profit</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
                <span>Omzet</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
                <span>Laba Kotor</span>
              </div>
            </div>
          </div>

          {trendData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
              <Calendar className="w-8 h-8 mb-2 opacity-50" />
              Tidak ada data penjualan pada rentang waktu ini
            </div>
          ) : (
            <div className="h-64 flex items-end gap-2 pt-6 pb-2 px-1 border-b border-slate-100">
              {trendData.map((d, idx) => {
                const omzetHeight = Math.round((d.omzet / maxTrendOmzet) * 100);
                const profitHeight = Math.round((d.profit / maxTrendOmzet) * 100);

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                    {/* Tooltip */}
                    <div className="absolute -top-14 hidden group-hover:flex flex-col items-center bg-slate-900 text-white text-[10px] py-1 px-2 rounded z-20 whitespace-nowrap shadow-lg">
                      <span>{d.label}</span>
                      <span>Omzet: {formatRupiah(d.omzet)}</span>
                      <span>Laba: {formatRupiah(d.profit)}</span>
                    </div>

                    {/* Bars container */}
                    <div className="w-full flex items-end justify-center gap-1 h-full">
                      <div
                        style={{ height: `${omzetHeight}%` }}
                        className="w-full max-w-[14px] bg-indigo-500 rounded-t transition-all hover:bg-indigo-600"
                      />
                      <div
                        style={{ height: `${profitHeight}%` }}
                        className="w-full max-w-[14px] bg-emerald-400 rounded-t transition-all hover:bg-emerald-500"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-2 truncate w-full text-center">
                      {d.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Best Sellers List */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-slate-900">Produk Terlaris</h2>
              <p className="text-xs text-slate-400">Berdasarkan volume unit terjual</p>
            </div>
            <Award className="w-5 h-5 text-amber-500" />
          </div>

          <div className="flex-1 flex flex-col divide-y divide-slate-100">
            {topProducts.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Belum ada transaksi terekam
              </div>
            ) : (
              topProducts.map((p, index) => (
                <div key={p.id} className="py-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        index === 0
                          ? 'bg-amber-100 text-amber-700'
                          : index === 1
                          ? 'bg-slate-200 text-slate-700'
                          : index === 2
                          ? 'bg-amber-700/10 text-amber-800'
                          : 'bg-slate-50 text-slate-500'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <div className="truncate">
                      <p className="text-sm font-medium text-slate-800 truncate">{p.name}</p>
                      <p className="text-xs text-slate-400">
                        {p.category} | SKU: {p.sku}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-slate-900">{p.soldQty} terjual</div>
                    <div className="text-xs text-emerald-600 font-medium">
                      +{formatRupiah(p.profit)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;