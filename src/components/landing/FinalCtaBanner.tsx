import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

export const FinalCtaBanner: React.FC = () => {
  return (
    <section className="rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-8 sm:p-12 text-center space-y-6 shadow-xl relative overflow-hidden">
      <div className="max-w-2xl mx-auto space-y-3 relative z-10">
        <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
          Siap Tingkatkan Layanan Toko Jadi Lebih Cepat & Rapi?
        </h2>
        <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed font-normal">
          Daftarkan toko Anda sekarang dalam 1 menit. Dapatkan masa uji coba gratis 14 hari penuh tanpa syarat kartu kredit.
        </p>
        <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/register"
            className="w-full sm:w-auto px-8 py-3.5 bg-slate-950 hover:bg-slate-900 active:scale-95 text-white font-extrabold rounded-2xl shadow-lg transition flex items-center justify-center gap-2 text-sm"
          >
            <span>Daftar Gratis Sekarang</span>
            <ArrowRight className="w-4 h-4 text-emerald-400" />
          </Link>
          <Link
            to="/pos"
            className="w-full sm:w-auto px-8 py-3.5 bg-white/15 hover:bg-white/20 border border-white/25 active:scale-95 text-white font-bold rounded-2xl transition text-sm"
          >
            Coba Demo Kasir
          </Link>
        </div>
      </div>
    </section>
  );
};
