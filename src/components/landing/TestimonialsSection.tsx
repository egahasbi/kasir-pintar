import React from 'react';
import { Star } from 'lucide-react';

export const TestimonialsSection: React.FC = () => {
  const reviews = [
    {
      name: 'Rian Pratama',
      role: 'Owner Kopi Senja Seduh',
      city: 'Bandung',
      text: 'Waktu antrean siang hari berkurang drastis sejak staf kasir bisa input pesanan langsung dari HP meja pelanggan. Struknya rapi dan transaksi jadi jauh lebih cepat.',
    },
    {
      name: 'Dewi Anggraini',
      role: 'Pengelola Butik Hijab Modis',
      city: 'Surabaya',
      text: 'Fitur scan barcode dari kamera HP sangat menghemat anggaran. Kami tidak perlu beli scanner laser terpisah, dan sisa stok baju langsung terlacak otomatis.',
    },
    {
      name: 'Haji Sutrisno',
      role: 'Toko Sembako Berkah Jaya',
      city: 'Semarang',
      text: 'Laporan laba harian sangat membantu. Setiap tutup toko malam, saya tahu persis margin keuntungan dan omset hari itu tanpa hitung nota manual.',
    },
  ];

  return (
    <section className="space-y-6">
      <div className="text-center space-y-2 max-w-xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          Kisah Nyata Pedagang
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
          Dipercaya Ratusan Usaha di Indonesia
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Dengarkan pengalaman nyata pemilik usaha yang omset dan operasionalnya meningkat bersama WECASH.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {reviews.map((r, i) => (
          <div key={i} className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex gap-1 text-amber-400">
                {[...Array(5)].map((_, starIdx) => (
                  <Star key={starIdx} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed italic">
                "{r.text}"
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <div className="font-extrabold text-xs text-slate-900">{r.name}</div>
              <div className="text-[11px] text-slate-400">{r.role} • {r.city}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
