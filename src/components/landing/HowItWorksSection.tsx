import React from 'react';
import { UserPlus, PlusCircle, CreditCard } from 'lucide-react';

export const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      num: '01',
      icon: UserPlus,
      title: 'Daftar Akun Toko',
      desc: 'Masukkan nama usaha dan email Anda dalam 1 menit. Langsung dapat masa coba gratis 14 hari.',
    },
    {
      num: '02',
      icon: PlusCircle,
      title: 'Input Barang & Harga',
      desc: 'Tambahkan produk dan harga jual. Bisa scan barcode fisik langsung dengan kamera HP Anda.',
    },
    {
      num: '03',
      icon: CreditCard,
      title: 'Langsung Layani Pembeli',
      desc: 'Pilih pesanan, terima pembayaran tunai atau QRIS, lalu cetak struk nota belanja seketika.',
    },
  ];

  return (
    <section className="space-y-6">
      <div className="text-center space-y-2 max-w-xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
          Super Cepat
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
          Mulai Berjualan Hanya dalam 3 Langkah
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Tanpa instalasi rumit, tanpa konfigurasi teknis yang membingungkan.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {steps.map((st, i) => {
          const Icon = st.icon;
          return (
            <div key={i} className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3 relative overflow-hidden">
              <span className="text-4xl font-black text-slate-100 absolute top-3 right-4 select-none">
                {st.num}
              </span>
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">{st.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{st.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
