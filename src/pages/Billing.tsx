import React, { useState } from 'react';
import { CheckCircle2, QrCode } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export default function Billing() {
  const { settings, updateSettings } = useStore();
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'business'>('pro');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [simulatedSuccess, setSimulatedSuccess] = useState(false);

  const plans = {
    pro: { name: 'Paket Pro Bulanan', price: 49000, label: 'Rp 49.000 / bln' },
    business: { name: 'Paket Business Tahunan', price: 399000, label: 'Rp 399.000 / thn' },
  };

  const handleSimulatePayment = async () => {
    setSimulatedSuccess(true);
    await updateSettings({
      subscription_plan: selectedPlan,
      subscription_status: 'active',
    });
    setTimeout(() => {
      setIsModalOpen(false);
      setSimulatedSuccess(false);
    }, 1800);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-1">
        <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border">
          Status: {settings.subscription_plan?.toUpperCase() || 'TRIAL'} (Aktif)
        </span>
        <h1 className="text-2xl font-black text-slate-900">Upgrade Paket WECASH</h1>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">Tingkatkan performa kasir toko Anda tanpa batas transaksi.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl mx-auto">
        <div className={`p-5 rounded-2xl border-2 ${selectedPlan === 'pro' ? 'border-emerald-600 bg-white' : 'border-slate-200 bg-slate-50'}`}>
          <div className="font-bold text-sm mb-1">Paket Pro</div>
          <div className="text-2xl font-black text-emerald-600 mb-2">Rp 49.000 <span className="text-xs text-slate-400">/bulan</span></div>
          <ul className="text-xs space-y-1.5 text-slate-700 mb-4">
            <li className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Transaksi Tanpa Batas</li>
            <li className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Scan Barcode Kamera HP</li>
            <li className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Cetak Struk Thermal 58/80mm</li>
            <li className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Laporan Omset & Laba</li>
          </ul>
          <button onClick={() => { setSelectedPlan('pro'); setIsModalOpen(true); }} className="w-full py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs">Pilih Pro</button>
        </div>

        <div className={`p-5 rounded-2xl border-2 relative ${selectedPlan === 'business' ? 'border-emerald-600 bg-white' : 'border-slate-200 bg-slate-50'}`}>
          <span className="absolute top-3 right-3 px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full">Hemat 32%</span>
          <div className="font-bold text-sm mb-1">Paket Business</div>
          <div className="text-2xl font-black text-emerald-600 mb-2">Rp 399.000 <span className="text-xs text-slate-400">/tahun</span></div>
          <ul className="text-xs space-y-1.5 text-slate-700 mb-4">
            <li className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Semua Fitur Pro</li>
            <li className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Bebas Tambah Akun Kasir</li>
            <li className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Prioritas Support WhatsApp</li>
            <li className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Setup & Training Gratis</li>
          </ul>
          <button onClick={() => { setSelectedPlan('business'); setIsModalOpen(true); }} className="w-full py-2 bg-slate-900 text-white font-bold rounded-xl text-xs">Pilih Tahunan</button>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm p-5 space-y-3 text-xs text-center">
            <span className="px-2 py-0.5 bg-amber-50 text-amber-800 rounded font-mono text-[10px] font-bold border">SANDBOX PAYMENT SIMULATOR</span>
            <h3 className="font-bold text-sm">{plans[selectedPlan].name}</h3>
            <div className="text-lg font-black text-emerald-600">{plans[selectedPlan].label}</div>
            <div className="p-3 bg-slate-50 rounded-xl border flex flex-col items-center">
              <QrCode className="w-24 h-24 text-slate-800 mb-1" />
              <span className="text-[10px] text-slate-500">Scan QRIS Simulator</span>
            </div>
            {simulatedSuccess ? (
              <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl font-bold flex items-center justify-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Pembayaran Sukses!
              </div>
            ) : (
              <div className="space-y-1.5 pt-1">
                <button type="button" onClick={handleSimulatePayment} className="w-full py-2.5 bg-emerald-600 text-white font-bold rounded-xl">[Simulasikan Bayar Berhasil]</button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="w-full py-1.5 border rounded-xl text-slate-600">Batal</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
