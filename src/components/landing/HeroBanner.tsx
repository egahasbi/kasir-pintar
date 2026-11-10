import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, QrCode, Sparkles } from 'lucide-react';

export const HeroBanner: React.FC = () => {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-stone-900 to-[#2D1609] text-white p-6 sm:p-12 lg:p-16 border border-stone-800 shadow-2xl">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#7F4F24]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-[#9F6744]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
        {/* Badge Banner */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#7F4F24]/25 border border-[#D8B89E]/30 text-[#D8B89E] text-xs font-bold tracking-wide uppercase shadow-inner">
          <Sparkles className="w-3.5 h-3.5 text-[#BC8E69]" />
          <span>Aplikasi Kasir Modern untuk Toko & Cafe</span>
        </div>

        {/* Big Catchy Title */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15]">
          Tinggalkan Mesin Kasir Jadul. <br />
          <span className="bg-gradient-to-r from-[#E9D5C3] via-[#D8B89E] to-[#F6ECE1] bg-clip-text text-transparent">
            Kelola Toko & Kafe Langsung dari HP.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base lg:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
          Ubah smartphone Anda jadi mesin kasir handal. Scan barcode via kamera HP, cetak nota struk thermal instan, pantau stok barang, dan hitung laba bersih otomatis tanpa biaya perangkat mahal.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
          <Link
            to="/register"
            className="w-full sm:w-auto px-8 py-4 bg-[#7F4F24] hover:bg-[#673B1B] active:scale-95 text-white font-black rounded-2xl shadow-lg shadow-[#7F4F24]/25 transition flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <span>Coba Gratis 14 Hari</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            to="/pos"
            className="w-full sm:w-auto px-8 py-4 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 active:scale-95 text-slate-200 font-bold rounded-2xl transition flex items-center justify-center gap-2 text-sm sm:text-base backdrop-blur-sm"
          >
            <span>Lihat Demo Kasir</span>
          </Link>
        </div>

        {/* Visual Live POS Screen Mockup */}
        <div className="pt-4 max-w-xl mx-auto">
          <div className="rounded-2xl bg-slate-950/80 border border-slate-700/80 p-3 sm:p-4 text-left shadow-2xl backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5 font-bold text-slate-200">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                Mode Kasir Aktif
              </span>
              <span className="font-mono text-amber-400">#INV-90214</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                <div>
                  <div className="font-bold text-white text-xs">Kopi Susu Aren</div>
                  <div className="text-[10px] text-slate-400">2x @Rp 18.000</div>
                </div>
                <span className="font-extrabold text-amber-400">Rp 36.000</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                <div>
                  <div className="font-bold text-white text-xs">Croissant Butter</div>
                  <div className="text-[10px] text-slate-400">1x @Rp 22.000</div>
                </div>
                <span className="font-extrabold text-amber-400">Rp 22.000</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block">Total Tagihan</span>
                <span className="font-black text-base text-white">Rp 58.000</span>
              </div>
              <div className="px-3.5 py-1.5 bg-amber-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md">
                <span>Bayar Tunai / QRIS</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-medium">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-400" /> Tanpa Beli Mesin Tambahan
          </span>
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-400" /> Jalan di Android & iPhone
          </span>
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-400" /> Bebas Batalkan Kapan Saja
          </span>
        </div>
      </div>
    </section>
  );
};
