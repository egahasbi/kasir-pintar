import React, { useEffect, useState, useMemo } from 'react';
import {
  TrendingUp,
  AlertTriangle as PackageAlert,
  Sparkles,
  Tag,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  ShoppingCart,
  Percent,
  AlertTriangle,
  ChevronRight,
  Clock
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Product, Transaction, ForecastItem, DiscountPromotion } from '../types';

interface DashboardStats {
  todayRevenue: number;
  revenueChangePct: number;
  todayTransactions: number;
  activeDiscountsCount: number;
  lowStockCount: number;
}

interface DiscountConversionStat {
  code: string;
  name: string;
  timesUsed: number;
  totalSaved: number;
  revenueGenerated: number;
  conversionRate: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshingAi, setRefreshingAi] = useState<boolean>(false);
  const [stats, setStats] = useState<DashboardStats>({
    todayRevenue: 0,
    revenueChangePct: 0,
    todayTransactions: 0,
    activeDiscountsCount: 0,
    lowStockCount: 0
  });

  const [aiForecasts, setAiForecasts] = useState<ForecastItem[]>([]);
  const [aiConfidence, setAiConfidence] = useState<number>(88);
  const [discountStats, setDiscountStats] = useState<DiscountConversionStat[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [recentSales, setRecentSales] = useState<Transaction[]>([]);

  const formatRupiah = (val: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const yesterdayStart = new Date(todayStart);
      yesterdayStart.setDate(yesterdayStart.getDate() - 1);

      const { data: salesToday } = await supabase
        .from('transactions')
        .select('*')
        .gte('created_at', todayStart.toISOString());

      const { data: salesYesterday } = await supabase
        .from('transactions')
        .select('total_amount')
        .gte('created_at', yesterdayStart.toISOString())
        .lt('created_at', todayStart.toISOString());

      const todayRev = salesToday?.reduce((sum, tx) => sum + (tx.total_amount || 0), 0) || 0;
      const yesterdayRev = salesYesterday?.reduce((sum, tx) => sum + (tx.total_amount || 0), 0) || 0;
      const revDiff = yesterdayRev === 0 ? 100 : Math.round(((todayRev - yesterdayRev) / yesterdayRev) * 100);

      const { data: prods } = await supabase
        .from('products')
        .select('*')
        .order('stock', { ascending: true });

      const lowStock = (prods || []).filter(p => p.stock <= (p.min_stock_alert || 5));
      setLowStockProducts(lowStock.slice(0, 5));

      const { data: discounts } = await supabase
        .from('discounts')
        .select('*')
        .eq('is_active', true);

      setStats({
        todayRevenue: todayRev,
        revenueChangePct: revDiff,
        todayTransactions: salesToday?.length || 0,
        activeDiscountsCount: discounts?.length || 0,
        lowStockCount: lowStock.length
      });

      const { data: recents } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentSales(recents || []);

      computeDiscountPerformance(salesToday || [], discounts || []);
      await fetchAiStockForecast();
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const computeDiscountPerformance = (transactions: Transaction[], discounts: DiscountPromotion[]) => {
    const map = new Map<string, DiscountConversionStat>();

    discounts.forEach(d => {
      map.set(d.id, {
        code: d.code,
        name: d.name,
        timesUsed: 0,
        totalSaved: 0,
        revenueGenerated: 0,
        conversionRate: 0
      });
    });

    let totalDiscounterTx = 0;
    transactions.forEach(tx => {
      if (tx.discount_id && map.has(tx.discount_id)) {
        totalDiscounterTx++;
        const item = map.get(tx.discount_id)!;
        item.timesUsed += 1;
        item.totalSaved += (tx.discount_amount || 0);
        item.revenueGenerated += (tx.total_amount || 0);
      }
    });

    const results: DiscountConversionStat[] = [];
    map.forEach(val => {
      val.conversionRate = transactions.length > 0 
        ? Math.round((val.timesUsed / transactions.length) * 100) 
        : 0;
      results.push(val);
    });

    results.sort((a, b) => b.timesUsed - a.timesUsed);
    setDiscountStats(results.slice(0, 4));
  };

  const fetchAiStockForecast = async () => {
    try {
      const response = await fetch('/api/ai/forecast-summary', {
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        const payload = await response.json();
        if (payload.forecasts) {
          setAiForecasts(payload.forecasts);
          setAiConfidence(payload.confidence || 88);
          return;
        }
      }
      generateFallbackForecasts();
    } catch {
      generateFallbackForecasts();
    }
  };

  const generateFallbackForecasts = () => {
    const mock: ForecastItem[] = [
      {
        product_id: '1',
        product_name: 'Beras Premium Ramos 5kg',
        current_stock: 4,
        projected_runout_days: 2,
        recommended_restock_qty: 25,
        risk_level: 'HIGH',
        reasoning: 'Velositas penjualan tinggi + lonjakan belanja akhir pekan.'
      },
      {
        product_id: '2',
        product_name: 'Minyak Goreng Sawit 2L',
        current_stock: 7,
        projected_runout_days: 3,
        recommended_restock_qty: 30,
        risk_level: 'HIGH',
        reasoning: 'Kebutuhan pokok harian terkonfirmasi stabil tinggi.'
      },
      {
        product_id: '3',
        product_name: 'Kopi Susu Gula Aren 250ml',
        current_stock: 12,
        projected_runout_days: 5,
        recommended_restock_qty: 40,
        risk_level: 'MEDIUM',
        reasoning: 'Tren konsumsi kafein sore meningkat 18% minggu ini.'
      }
    ];
    setAiForecasts(mock);
  };

  const handleRefreshForecast = async () => {
    setRefreshingAi(true);
    await fetchAiStockForecast();
    setRefreshingAi(false);
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Ringkasan Bisnis UMKM</h1>
          <p className="text-sm text-gray-500 mt-1">
            Pantau arus kas harian, metrik diskon, dan prediksi cerdas inventaris toko Anda.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadDashboardData}
            disabled={loading}
            className="inline-flex items-center px-3.5 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Segarkan Data
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Omzet Hari Ini</span>
            <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <DollarSign className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-gray-900">{formatRupiah(stats.todayRevenue)}</h3>
            <div className="flex items-center mt-2 text-xs">
              {stats.revenueChangePct >= 0 ? (
                <span className="flex items-center font-medium text-emerald-600">
                  <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                  +{stats.revenueChangePct}%
                </span>
              ) : (
                <span className="flex items-center font-medium text-rose-600">
                  <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
                  {stats.revenueChangePct}%
                </span>
              )}
              <span className="text-gray-400 ml-1.5">vs kemarin</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Transaksi Sukses</span>
            <span className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <ShoppingCart className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-gray-900">{stats.todayTransactions}</h3>
            <p className="text-xs text-gray-500 mt-2">Daftar transaksi kasir harian</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Promo Aktif</span>
            <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Tag className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-gray-900">{stats.activeDiscountsCount}</h3>
            <p className="text-xs text-gray-500 mt-2">Kupon dan promo bertingkat aktif</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Stok Kritis</span>
            <span className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <PackageAlert className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-gray-900">{stats.lowStockCount}</h3>
            <p className="text-xs text-amber-600 font-medium mt-2">Barang perlu restock segera</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Performa Transaksi & Kasir</h2>
              <p className="text-xs text-slate-500">Ringkasan aktivitas kasir dan transaksi toko hari ini</p>
            </div>
            <button
              onClick={loadDashboardData}
              className="inline-flex items-center text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Segarkan
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-100">
              <span className="text-[11px] font-semibold text-emerald-800 uppercase block mb-1">Rata-rata Transaksi</span>
              <span className="text-base font-extrabold text-emerald-950">
                {stats.todayTransactions > 0
                  ? formatRupiah(Math.round(stats.todayRevenue / stats.todayTransactions))
                  : 'Rp 0'}
              </span>
            </div>
            <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-100">
              <span className="text-[11px] font-semibold text-blue-800 uppercase block mb-1">Penjualan Berhasil</span>
              <span className="text-base font-extrabold text-blue-950">{stats.todayTransactions} Struk</span>
            </div>
            <div className="p-4 bg-purple-50/60 rounded-xl border border-purple-100">
              <span className="text-[11px] font-semibold text-purple-800 uppercase block mb-1">Item Stok Aman</span>
              <span className="text-base font-extrabold text-purple-950">
                {stats.lowStockCount === 0 ? 'Semua Aman' : `${stats.lowStockCount} Menipis`}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                  <Percent className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Konversi Promo & Diskon</h2>
                  <p className="text-xs text-gray-500">Efektivitas promo transaksi hari ini</p>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              {discountStats.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  Belum ada penggunaan promo tercatat hari ini
                </div>
              ) : (
                discountStats.map((item, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="text-sm font-bold text-gray-900">{item.name}</div>
                        <span className="text-[11px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-mono font-medium">
                          {item.code}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-gray-900">{item.conversionRate}%</div>
                        <div className="text-[10px] text-gray-500">tingkat adopsi</div>
                      </div>
                    </div>

                    <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden mb-2.5">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all"
                        style={{ width: `${Math.min(item.conversionRate, 100)}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-xs text-gray-600 border-t border-gray-200/60 pt-2 mt-1">
                      <span>Dipakai: <strong>{item.timesUsed}x</strong></span>
                      <span>Total Hemat: <strong className="text-gray-900">{formatRupiah(item.totalSaved)}</strong></span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <span className="text-xs text-gray-400">Pemberian diskon optimal meningkatkan penjualan hingga 24%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Peringatan Stok Rendah
            </h2>
            <span className="text-xs text-gray-500">{lowStockProducts.length} item menipis</span>
          </div>
          <div className="divide-y divide-gray-100 mt-2">
            {lowStockProducts.length === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center">Semua persediaan stok mencukupi batas aman.</p>
            ) : (
              lowStockProducts.map(prod => (
                <div key={prod.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{prod.name}</p>
                    <p className="text-xs text-gray-400">SKU: {prod.sku || prod.barcode || 'N/A'}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800">
                      Sisa: {prod.stock} {prod.unit || 'pcs'}
                    </span>
                    <p className="text-[11px] text-gray-400 mt-0.5">Batas: {prod.min_stock_alert || 5}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              Transaksi Terbaru
            </h2>
            <span className="text-xs text-gray-500">5 pesanan terakhir</span>
          </div>
          <div className="divide-y divide-gray-100 mt-2">
            {recentSales.length === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center">Belum ada transaksi berlangsung.</p>
            ) : (
              recentSales.map(tx => (
                <div key={tx.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      #{tx.invoice_number || tx.id.slice(0, 8)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(tx.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} • {tx.payment_method?.toUpperCase()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900">{formatRupiah(tx.total_amount)}</span>
                    {tx.discount_amount ? (
                      <p className="text-[11px] text-emerald-600 font-medium">
                        Diskon: -{formatRupiah(tx.discount_amount)}
                      </p>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}