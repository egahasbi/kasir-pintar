import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';

export const PricingSection: React.FC = () => {
  return (
    <section className="space-y-6">
      <div className="text-center space-y-2 max-w-xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          Biaya Transparan
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
          Investasi Terjangkau untuk Bisnis Anda
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Coba gratis 14 hari penuh. Tanpa kontrak kaku, upgrade atau batalkan kapan saja.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
        {/* Starter Plan */}
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="font-extrabold text-sm text-slate-900">Starter Trial</div>
            <div className="text-3xl font-black text-slate-900">
              Rp 0 <span className="text-xs text-slate-400 font-normal">/ 14 Hari</span>
            </div>
            <p className="text-xs text-slate-500">Coba seluruh fitur lengkap WECASH tanpa dipungut biaya sepeser pun.</p>
            <ul className="text-xs space-y-2 text-slate-700 border-t border-slate-100 pt-3">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Transaksi Kasir POS Realtime</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Scan Barcode Kamera HP</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Cetak Struk Thermal 58/80mm</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Pengaturan Identitas Toko</li>
            </ul>
          </div>
          <Link
            to="/register"
            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-center rounded-2xl text-xs transition"
          >
            Mulai Uji Coba Gratis
          </Link>
        </div>

        {/* Pro Monthly Plan */}
        <div className="p-6 bg-white rounded-3xl border-2 border-emerald-600 shadow-xl flex flex-col justify-between space-y-4 relative">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-emerald-600 text-white text-[10px] font-extrabold rounded-full uppercase tracking-wider shadow-sm">
            Paling Populer
          </span>
          <div className="space-y-3">
            <div className="font-extrabold text-sm text-slate-900">Paket Pro Bulanan</div>
            <div className="text-3xl font-black text-emerald-600">
              Rp 49.000 <span className="text-xs text-slate-400 font-normal">/bulan</span>
            </div>
            <p className="text-xs text-slate-500">Cocok untuk toko ritel, cafe, kedai kuliner, dan stand aktif.</p>
            <ul className="text-xs space-y-2 text-slate-700 border-t border-slate-100 pt-3">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Seluruh Fitur Starter</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Transaksi Tanpa Batas Jumlah</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Rekap Laba Kotor & Omset Harian</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Stock Opname & Koreksi Fisik</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Export Laporan Penjualan CSV</li>
            </ul>
          </div>
          <Link
            to="/register"
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-center rounded-2xl text-xs shadow-md transition"
          >
            Pilih Paket Pro
          </Link>
        </div>

        {/* Business Yearly Plan */}
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4 relative">
          <span className="absolute top-4 right-4 px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-extrabold rounded-full">
            Hemat 32%
          </span>
          <div className="space-y-3">
            <div className="font-extrabold text-sm text-slate-900">Business Tahunan</div>
            <div className="text-3xl font-black text-slate-900">
              Rp 399.000 <span className="text-xs text-slate-400 font-normal">/tahun</span>
            </div>
            <p className="text-xs text-slate-500">Paling hemat untuk bisnis yang ingin kepastian operasional jangka panjang.</p>
            <ul className="text-xs space-y-2 text-slate-700 border-t border-slate-100 pt-3">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Seluruh Fitur Paket Pro</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Multi Akun Kasir Bebas Tambah</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Prioritas Support via WhatsApp</li>
            </ul>
          </div>
          <Link
            to="/register"
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-center rounded-2xl text-xs transition"
          >
            Daftar Paket Tahunan
          </Link>
        </div>
      </div>
    </section>
  );
};
