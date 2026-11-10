import React from 'react';
import { XCircle, CheckCircle2 } from 'lucide-react';

export const ComparisonSection: React.FC = () => {
  return (
    <section className="space-y-6">
      <div className="text-center space-y-2 max-w-xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
          Kenapa Beralih ke KASIRKITA?
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Bandingkan biaya dan kerumitan sistem kasir konvensional dengan solusi cerdas KASIRKITA.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Cara Lama */}
        <div className="p-6 rounded-3xl bg-red-50/40 border border-red-200/60 space-y-4">
          <div className="flex items-center gap-2 text-red-700 font-extrabold text-sm uppercase tracking-wider">
            <XCircle className="w-5 h-5 text-red-600" />
            <span>Cara Lama (Ribet & Boros Modal)</span>
          </div>

          <ul className="space-y-3 text-xs sm:text-sm text-slate-600">
            <li className="flex items-start gap-2.5">
              <span className="text-red-500 font-bold">✕</span>
              <span>Harus beli mesin kasir, monitor POS, dan scanner laser senilai Rp 3-7 juta.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-red-500 font-bold">✕</span>
              <span>Printer kasir kabel ribet, instalasi driver rumit, dan rawan error saat jam ramai.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-red-500 font-bold">✕</span>
              <span>Stok barang sering selisih karena catatan nota kertas hilang atau tercecer.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-red-500 font-bold">✕</span>
              <span>Tidak tahu berapa laba bersih harian yang sebenarnya didapat.</span>
            </li>
          </ul>
        </div>

        {/* Dengan KASIRKITA */}
        <div className="p-6 rounded-3xl bg-emerald-50/50 border-2 border-emerald-500/50 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-sm uppercase tracking-wider">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Dengan KASIRKITA (Praktis, Cepat, Hemat)</span>
          </div>

          <ul className="space-y-3 text-xs sm:text-sm text-slate-700 font-medium">
            <li className="flex items-start gap-2.5">
              <span className="text-emerald-600 font-bold">✓</span>
              <span>Cukup pakai HP Android atau iPhone yang Anda punya. Nol biaya hardware.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-emerald-600 font-bold">✓</span>
              <span>Cetak struk thermal cepat & jelas via printer Bluetooth/USB 58mm atau 80mm.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-emerald-600 font-bold">✓</span>
              <span>Stok otomatis berkurang saat transaksi dan ada notifikasi saat barang mulai habis.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-emerald-600 font-bold">✓</span>
              <span>Laporan omset, laba kotor, dan produk terlaris otomatis terhitung secara realtime.</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
};
