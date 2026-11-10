import React from 'react';
import { Coffee, Utensils, ShoppingBag, Store } from 'lucide-react';

export const UseCasesSection: React.FC = () => {
  const cases = [
    {
      icon: Coffee,
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      title: 'Cafe & Coffee Shop',
      desc: 'Pesanan minuman cepat, antrean terurai, kasir bisa mobile melayani pelanggan langsung di meja.',
    },
    {
      icon: Utensils,
      color: 'bg-orange-50 text-orange-700 border-orange-200',
      title: 'Resto & Stand Kuliner',
      desc: 'Bayar via QRIS atau Tunai dengan kalkulasi kembalian otomatis. Rekap menu terlaris tiap malam.',
    },
    {
      icon: ShoppingBag,
      color: 'bg-pink-50 text-pink-700 border-pink-200',
      title: 'Butik & Toko Fashion',
      desc: 'Scan barcode hangtag pakaian, cek stok ukuran yang tersisa di gudang tanpa perlu bolak-balik.',
    },
    {
      icon: Store,
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      title: 'Kelontong & Ritel',
      desc: 'Katalog ratusan barang sembako, cetak struk untuk pembeli grosir, dan kontrol stok kritis.',
    },
  ];

  return (
    <section className="space-y-6">
      <div className="text-center space-y-2 max-w-xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
          Satu Aplikasi untuk Berbagai Bidang Usaha
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Apapun bisnis yang Anda jalankan, KASIRKITA menyesuaikan dengan alur penjualan Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cases.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${c.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">{c.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{c.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
