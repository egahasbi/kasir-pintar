import React from 'react';
import { Camera, Printer, BarChart2, Layers } from 'lucide-react';

export const FeatureBanners: React.FC = () => {
  return (
    <section className="space-y-8">
      <div className="text-center space-y-2 max-w-xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
          Fitur Unggulan
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
          Semua Kebutuhan Kasir dalam Satu Aplikasi
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Didesain sesederhana mungkin agar staf kasir dan pemilik usaha langsung bisa mengoperasikannya tanpa pelatihan rumit.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Banner 1: Scan Barcode Kamera */}
        <div className="p-6 sm:p-8 bg-gradient-to-br from-[#7F4F24] via-[#673B1B] to-[#3B1E0C] text-white rounded-3xl shadow-lg relative overflow-hidden space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
            <Camera className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold">Kamera HP Berubah Jadi Scanner Barcode</h3>
            <p className="text-xs sm:text-sm text-[#F6ECE1] mt-1 leading-relaxed">
              Tinggal arahkan kamera belakang HP ke barcode produk (EAN-13, Code-128, atau QR). Item otomatis masuk ke keranjang belanja kasir seketika.
            </p>
          </div>
          <div className="pt-2 text-xs font-semibold text-[#D8B89E] flex items-center gap-2">
            <span>⚡ Responsif kilat & akurat</span>
          </div>
        </div>

        {/* Banner 2: Thermal Printer */}
        <div className="p-6 sm:p-8 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl shadow-lg relative overflow-hidden space-y-4 border border-slate-700">
          <div className="w-12 h-12 rounded-2xl bg-[#7F4F24]/30 backdrop-blur-md flex items-center justify-center border border-[#7F4F24]/40">
            <Printer className="w-6 h-6 text-[#D8B89E]" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold">Cetak Struk Thermal Cepat & Rapi</h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
              Kompatibel penuh dengan printer Bluetooth & USB thermal 58mm atau 80mm. Cetak nota penjualan profesional langsung dalam hitungan detik.
            </p>
          </div>
          <div className="pt-2 text-xs font-semibold text-[#D8B89E] flex items-center gap-2">
            <span>🖨️ Format standar 58mm & 80mm</span>
          </div>
        </div>

        {/* Banner 3: Laba & Rekap */}
        <div className="p-6 sm:p-8 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <BarChart2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900">Hitung Keuntungan Bersih Otomatis</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
              Berapa uang yang masuk hari ini? Berapa laba bersih setelah dipotong modal barang? Semua tersaji dalam grafik dan tabel siap download CSV Excel.
            </p>
          </div>
        </div>

        {/* Banner 4: Stock Opname */}
        <div className="p-6 sm:p-8 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900">Stock Opname & Koreksi Mudah</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
              Barang rusak, kadaluarsa, atau ada selisih hitung fisik? Lakukan stock opname langsung dari HP di gudang dengan catatan alasan jelas.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

