import React, { useState } from 'react';
import { Store, Percent, Save, CheckCircle } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export default function Settings() {
  const { settings, updateSettings, loading } = useStore();
  const [storeName, setStoreName] = useState(settings.store_name);
  const [storeAddress, setStoreAddress] = useState(settings.store_address);
  const [storePhone, setStorePhone] = useState(settings.store_phone);
  const [taxRatePercent, setTaxRatePercent] = useState(Math.round(settings.tax_rate * 100));
  const [receiptFooter, setReceiptFooter] = useState(settings.receipt_footer);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings({
      store_name: storeName,
      store_address: storeAddress,
      store_phone: storePhone,
      tax_rate: Number(taxRatePercent) / 100,
      receipt_footer: receiptFooter,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
          <Store className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900">Pengaturan Toko</h1>
          <p className="text-xs text-slate-500">Sesuaikan identitas toko dan tarif pajak pada struk POS.</p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-amber-600" />
          <span>Pengaturan toko berhasil disimpan!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Toko *</label>
          <input
            type="text"
            required
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            className="w-full px-3 py-2 border rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Alamat Toko</label>
          <input
            type="text"
            value={storeAddress}
            onChange={(e) => setStoreAddress(e.target.value)}
            className="w-full px-3 py-2 border rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Telepon / WhatsApp</label>
          <input
            type="text"
            value={storePhone}
            onChange={(e) => setStorePhone(e.target.value)}
            className="w-full px-3 py-2 border rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Tarif Pajak PPN (%)</label>
          <div className="relative">
            <input
              type="number"
              min="0"
              max="50"
              value={taxRatePercent}
              onChange={(e) => setTaxRatePercent(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none pr-8"
            />
            <Percent className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Kaki Struk (Footer)</label>
          <input
            type="text"
            value={receiptFooter}
            onChange={(e) => setReceiptFooter(e.target.value)}
            className="w-full px-3 py-2 border rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-98 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 shadow-sm transition"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Perubahan</span>
          </button>
        </div>
      </form>
    </div>
  );
}
