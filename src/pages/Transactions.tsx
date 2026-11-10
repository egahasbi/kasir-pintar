import React, { useState, useEffect } from 'react';
import { Search, Receipt, Printer, RefreshCw } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { ReceiptModal, ReceiptData } from '../components/pos/ReceiptModal';
import { fetchAllTransactions, StoredTransaction } from '../lib/transactionStore';

export default function Transactions() {
  const { profile } = useAuth();
  const { settings } = useStore();
  const [transactions, setTransactions] = useState<StoredTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [method, setMethod] = useState('ALL');
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const data = await fetchAllTransactions();
      setTransactions(data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();

    const handleCreated = () => fetchTransactions();
    window.addEventListener('kasir_transaction_created', handleCreated);
    return () => window.removeEventListener('kasir_transaction_created', handleCreated);
  }, [profile?.id, profile?.email, profile?.role]);

  const formatIDR = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

  const filtered = transactions.filter((tx) => {
    const matchSearch = tx.invoice_number?.toLowerCase().includes(search.toLowerCase());
    const matchMethod = method === 'ALL' || tx.payment_method?.toLowerCase() === method.toLowerCase();
    return matchSearch && matchMethod;
  });

  const handleReprint = (tx: any) => {
    const receipt: ReceiptData = {
      transactionId: tx.id,
      invoiceNumber: tx.invoice_number,
      timestamp: tx.created_at,
      cashierName: 'Kasir',
      storeName: settings.store_name,
      storeAddress: settings.store_address,
      storePhone: settings.store_phone,
      items: (tx.transaction_items || []).map((it: any) => ({
        id: it.id,
        name: it.products?.name || 'Item',
        quantity: it.quantity,
        unitPrice: it.unit_price,
        subtotal: it.subtotal,
      })),
      subtotal: tx.total_amount,
      discounts: tx.discount_amount > 0 ? [{ id: '1', name: 'Diskon', type: 'fixed', value: tx.discount_amount, amountDeducted: tx.discount_amount }] : [],
      taxRate: settings.tax_rate,
      taxAmount: tx.tax_amount,
      total: tx.final_amount,
      paymentMethod: (tx.payment_method?.toUpperCase() as any) || 'CASH',
      amountPaid: tx.amount_paid || tx.final_amount,
      change: tx.change_given || 0,
    };
    setSelectedReceipt(receipt);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Receipt className="w-5 h-5 text-emerald-600" />
          <h1 className="text-xl font-bold">Riwayat Transaksi</h1>
        </div>
        <button onClick={fetchTransactions} className="p-1.5 border rounded-lg hover:bg-slate-50 text-xs flex items-center gap-1">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Segarkan
        </button>
      </div>

      <div className="bg-white p-3 rounded-xl border flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari invoice..."
            className="w-full pl-9 pr-3 py-1.5 border rounded text-xs"
          />
        </div>
        <div className="flex gap-1 text-xs">
          {['ALL', 'CASH', 'QRIS', 'DEBIT'].map((m) => (
            <button
              key={m}
              onClick={() => setMethod(m)}
              className={`px-3 py-1 rounded text-xs font-bold ${method === m ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-x-auto shadow-xs">
        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Memuat...</div>
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">Belum ada transaksi.</div>
        ) : (
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b text-slate-500 uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Invoice</th>
                <th className="py-2.5 px-3">Waktu</th>
                <th className="py-2.5 px-3">Metode</th>
                <th className="py-2.5 px-3 text-right">Total</th>
                <th className="py-2.5 px-3 text-center">Struk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-bold">{tx.invoice_number}</td>
                  <td className="py-2.5 px-3 text-slate-500">{new Date(tx.created_at).toLocaleString('id-ID')}</td>
                  <td className="py-2.5 px-3 uppercase font-bold text-emerald-700">{tx.payment_method}</td>
                  <td className="py-2.5 px-3 text-right font-bold">{formatIDR(tx.final_amount)}</td>
                  <td className="py-2.5 px-3 text-center">
                    <button onClick={() => handleReprint(tx)} className="p-1 text-slate-600 hover:text-emerald-600">
                      <Printer className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedReceipt && (
        <ReceiptModal isOpen={!!selectedReceipt} onClose={() => setSelectedReceipt(null)} receiptData={selectedReceipt} />
      )}
    </div>
  );
}
