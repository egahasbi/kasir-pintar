import React, { useState, useEffect } from 'react';
import { BarChart3, Download, RefreshCw } from 'lucide-react';
import { exportToCsv } from '../lib/exportCsv';
import { useAuth } from '../context/AuthContext';
import { fetchAllTransactions, StoredTransaction } from '../lib/transactionStore';

export default function Reports() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<StoredTransaction[]>([]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await fetchAllTransactions();
      setTransactions(data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();

    const handleCreated = () => fetchReports();
    window.addEventListener('kasir_transaction_created', handleCreated);
    return () => window.removeEventListener('kasir_transaction_created', handleCreated);
  }, [profile?.id, profile?.email, profile?.role]);

  const formatIDR = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

  const totalRevenue = transactions.reduce((sum, tx) => sum + (tx.final_amount || 0), 0);
  const totalTx = transactions.length;
  const aov = totalTx > 0 ? Math.round(totalRevenue / totalTx) : 0;

  let totalCost = 0;
  const productMap: Record<string, { name: string; qty: number; total: number }> = {};
  const methodMap: Record<string, number> = { cash: 0, qris: 0, debit: 0 };

  transactions.forEach((tx) => {
    const m = (tx.payment_method || 'cash').toLowerCase();
    methodMap[m] = (methodMap[m] || 0) + (tx.final_amount || 0);

    (tx.transaction_items || []).forEach((it: any) => {
      const c = (it.unit_cost || it.products?.cost_price || 0) * it.quantity;
      totalCost += c;

      const pName = it.products?.name || 'Item';
      if (!productMap[pName]) productMap[pName] = { name: pName, qty: 0, total: 0 };
      productMap[pName].qty += it.quantity;
      productMap[pName].total += it.subtotal;
    });
  });

  const grossProfit = Math.max(0, totalRevenue - totalCost);
  const topProducts = Object.values(productMap).sort((a, b) => b.qty - a.qty).slice(0, 8);

  const handleExportCsv = () => {
    const rows = transactions.map((tx) => ({
      Invoice: tx.invoice_number,
      Tanggal: new Date(tx.created_at).toLocaleString('id-ID'),
      Metode: tx.payment_method?.toUpperCase(),
      Subtotal: tx.total_amount,
      Diskon: tx.discount_amount,
      PPN: tx.tax_amount,
      Total: tx.final_amount,
    }));
    exportToCsv(`Laporan_Penjualan_${Date.now()}`, rows);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-emerald-600" />
          <h1 className="text-xl font-bold">Laporan Penjualan</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportCsv} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1">
            <Download className="w-3.5 h-3.5" /> Unduh CSV
          </button>
          <button onClick={fetchReports} className="p-1.5 border rounded-lg hover:bg-slate-50">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-white rounded-xl border">
          <span className="text-[10px] text-slate-500 uppercase block">Total Omset</span>
          <span className="text-sm font-extrabold">{formatIDR(totalRevenue)}</span>
        </div>
        <div className="p-3 bg-white rounded-xl border">
          <span className="text-[10px] text-slate-500 uppercase block">Laba Kotor</span>
          <span className="text-sm font-extrabold text-emerald-600">{formatIDR(grossProfit)}</span>
        </div>
        <div className="p-3 bg-white rounded-xl border">
          <span className="text-[10px] text-slate-500 uppercase block">Transaksi</span>
          <span className="text-sm font-extrabold">{totalTx} Struk</span>
        </div>
        <div className="p-3 bg-white rounded-xl border">
          <span className="text-[10px] text-slate-500 uppercase block">Rata-rata Order</span>
          <span className="text-sm font-extrabold">{formatIDR(aov)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white p-3 rounded-xl border space-y-2 text-xs">
          <h2 className="font-bold uppercase text-[10px] text-slate-500">Metode Bayar</h2>
          <div className="flex justify-between py-1 border-b"><span>Tunai</span><strong>{formatIDR(methodMap.cash || 0)}</strong></div>
          <div className="flex justify-between py-1 border-b"><span>QRIS</span><strong>{formatIDR(methodMap.qris || 0)}</strong></div>
          <div className="flex justify-between py-1"><span>Debit</span><strong>{formatIDR(methodMap.debit || 0)}</strong></div>
        </div>

        <div className="md:col-span-2 bg-white p-3 rounded-xl border space-y-2 text-xs">
          <h2 className="font-bold uppercase text-[10px] text-slate-500">Produk Terlaris</h2>
          {topProducts.length === 0 ? (
            <p className="text-slate-400 py-3 text-center">Belum ada data.</p>
          ) : (
            <div className="divide-y">
              {topProducts.map((p, idx) => (
                <div key={idx} className="py-1.5 flex justify-between">
                  <span>{idx + 1}. {p.name}</span>
                  <strong>{p.qty} pcs ({formatIDR(p.total)})</strong>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
