import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

export const FaqSection: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Printer apa saja yang didukung oleh KASIRKITA?',
      a: 'KASIRKITA mendukung semua printer thermal Bluetooth & USB standar ukuran kertas 58mm maupun 80mm. Anda cukup menghubungkan printer ke HP atau laptop, lalu tekan Cetak Struk saat transaksi selesai.',
    },
    {
      q: 'Bisa dijalankan di HP apa saja?',
      a: 'Bisa di semua smartphone Android dan iPhone/iPad yang memiliki browser (Chrome/Safari) dan kamera. Tampilan kasir otomatis menyesuaikan layar HP.',
    },
    {
      q: 'Bagaimana jika toko saya punya 2 kasir atau cabang?',
      a: 'Paket Business mendukung multi-akun kasir. Setiap kasir dapat memproses transaksi serentak, dan seluruh laporan penjualan otomatis terkumpul ke dashboard pemilik toko secara realtime.',
    },
    {
      q: 'Apakah data toko saya aman dan terpisah dari toko lain?',
      a: 'Sangat aman. KASIRKITA menggunakan arsitektur database multi-tenant dengan Row Level Security terenkripsi. Data stok, harga modal, dan omset toko Anda 100% terisolasi dan hanya bisa diakses oleh Anda.',
    },
  ];

  return (
    <section className="max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
          Pertanyaan yang Sering Diajukan
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Semua jawaban atas keraguan Anda sebelum mulai menggunakan KASIRKITA.
        </p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition"
            >
              <button
                type="button"
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-3 font-bold text-xs sm:text-sm text-slate-900"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform ${
                    isOpen ? 'rotate-180 text-amber-600' : ''
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
