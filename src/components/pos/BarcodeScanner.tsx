import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera,
  CameraOff,
  Keyboard,
  AlertCircle,
  CheckCircle2,
  PlusCircle,
  Search,
  PackagePlus,
  QrCode,
  Plus,
  Minus
} from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { useCart } from '../../context/CartContext';
import { Product } from '../../types';

interface BarcodeScannerProps {
  products: Product[];
  onProductScanned?: (product: Product) => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ products, onProductScanned }) => {
  const { addToCart } = useCart();

  // Tab: 'scan' | 'manual'
  const [activeTab, setActiveTab] = useState<'scan' | 'manual'>('scan');

  // Scanner states
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [manualSku, setManualSku] = useState<string>('');
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [successStatus, setSuccessStatus] = useState<string | null>(null);

  // Manual Product Input states (#1, #2, #3)
  const [manualName, setManualName] = useState<string>('');
  const [manualPrice, setManualPrice] = useState<string>('');
  const [manualQty, setManualQty] = useState<number | ''>(1);
  const [manualCategory, setManualCategory] = useState<string>('Custom');

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerElementId = 'pos-html5-barcode-scanner';

  const showNotification = (success: string | null, error: string | null) => {
    setSuccessStatus(success);
    setErrorStatus(error);
    if (success) {
      setTimeout(() => {
        setSuccessStatus((current) => (current === success ? null : current));
      }, 4000);
    }
  };

  const handleProductMatch = useCallback((barcodeValue: string) => {
    const cleaned = barcodeValue.trim();
    if (!cleaned) return;

    const matched = products.find(
      (p) =>
        (p.barcode && p.barcode.toLowerCase() === cleaned.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase() === cleaned.toLowerCase()) ||
        p.name.toLowerCase() === cleaned.toLowerCase()
    );

    if (matched) {
      if (matched.stock <= 0) {
        showNotification(null, `Stok produk habis: ${matched.name}`);
        return;
      }
      addToCart(matched, 1);
      showNotification(`"${matched.name}" berhasil masuk keranjang!`, null);
      if (onProductScanned) {
        onProductScanned(matched);
      }
    } else {
      showNotification(null, `Barcode/SKU "${cleaned}" tidak ditemukan.`);
    }
  }, [products, addToCart, onProductScanned]);

  const stopCamera = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
      scannerRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  const startCamera = async () => {
    setErrorStatus(null);
    setSuccessStatus(null);
    await stopCamera();

    try {
      setIsCameraActive(true);

      setTimeout(async () => {
        try {
          const scanner = new Html5Qrcode(readerElementId, {
            formatsToSupport: [
              Html5QrcodeSupportedFormats.EAN_13,
              Html5QrcodeSupportedFormats.EAN_8,
              Html5QrcodeSupportedFormats.CODE_128,
              Html5QrcodeSupportedFormats.CODE_39,
              Html5QrcodeSupportedFormats.UPC_A,
              Html5QrcodeSupportedFormats.UPC_E,
              Html5QrcodeSupportedFormats.QR_CODE,
            ],
            verbose: false,
          });
          scannerRef.current = scanner;

          await scanner.start(
            { facingMode: 'environment' },
            {
              fps: 10,
              qrbox: { width: 250, height: 180 },
              aspectRatio: 1.333,
            },
            (decodedText) => {
              handleProductMatch(decodedText);
            },
            () => {}
          );
        } catch (camErr: any) {
          console.error('Html5Qrcode start error:', camErr);
          setIsCameraActive(false);
          const msg = String(camErr?.message || camErr || '');
          if (msg.includes('NotAllowedError') || msg.includes('Permission') || msg.includes('denied')) {
            showNotification(null, 'Izin kamera tidak diberikan. Mohon izinkan akses kamera pada pengaturan browser HP Anda.');
          } else if (msg.includes('NotFoundError') || msg.includes('DevicesNotFound')) {
            showNotification(null, 'Kamera tidak ditemukan pada perangkat Anda.');
          } else if (msg.includes('NotSupportedError') || msg.includes('secure context') || msg.includes('insecure')) {
            showNotification(null, 'Akses kamera membutuhkan izin browser atau koneksi HTTPS. Anda dapat menggunakan tab Input Manual.');
          } else {
            showNotification(null, 'Tidak dapat mengakses kamera HP. Silakan pastikan izin kamera aktif atau gunakan tab Input Manual.');
          }
        }
      }, 150);
    } catch (err: any) {
      setIsCameraActive(false);
      showNotification(null, 'Gagal mengaktifkan kamera. Silakan periksa izin kamera atau gunakan tab Input Manual.');
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {}).finally(() => {
          scannerRef.current?.clear();
        });
      }
    };
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualSku.trim()) return;
    handleProductMatch(manualSku.trim());
    setManualSku('');
  };

  const handleAddManualProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim()) {
      showNotification(null, 'Nama barang wajib diisi.');
      return;
    }
    const priceNum = parseFloat(manualPrice.replace(/[^0-9]/g, ''));
    if (isNaN(priceNum) || priceNum <= 0) {
      showNotification(null, 'Harga barang harus lebih dari Rp 0.');
      return;
    }

    if (manualQty === '' || Number(manualQty) <= 0) {
      showNotification(null, 'Jumlah (Qty) barang harus diisi minimal 1.');
      return;
    }

    const qty = Number(manualQty);

    const customProduct: Product = {
      id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: manualName.trim(),
      price: priceNum,
      cost_price: priceNum,
      stock: 9999,
      category: manualCategory.trim() || 'Manual',
      sku: `MAN-${Date.now().toString().slice(-4)}`,
      barcode: null,
      is_active: true,
    };

    addToCart(customProduct, qty);
    showNotification(`"${customProduct.name}" (${qty}x) ditambahkan ke keranjang!`, null);

    setManualName('');
    setManualPrice('');
    setManualQty(1);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 sm:p-4 space-y-3">
      {/* Tab Switcher: Scan Barcode vs Input Manual */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('scan')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              activeTab === 'scan'
                ? 'bg-white text-amber-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Scan Barcode</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('manual');
              if (isCameraActive) stopCamera();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              activeTab === 'manual'
                ? 'bg-white text-amber-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PackagePlus className="w-3.5 h-3.5" />
            <span>Input Manual</span>
          </button>
        </div>

        {activeTab === 'scan' && (
          <button
            type="button"
            onClick={isCameraActive ? stopCamera : startCamera}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs ${
              isCameraActive
                ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                : 'bg-amber-600 text-white hover:bg-amber-700 active:scale-95'
            }`}
          >
            {isCameraActive ? (
              <>
                <CameraOff className="w-4 h-4" />
                <span>Tutup</span>
              </>
            ) : (
              <>
                <Camera className="w-4 h-4" />
                <span>Kamera HP</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* TAB 1: SCAN BARCODE (KAMERA HP & INPUT SKU) */}
      {activeTab === 'scan' && (
        <div className="space-y-3">
          {isCameraActive && (
            <div className="relative w-full rounded-xl overflow-hidden bg-black border-2 border-amber-500 shadow-md">
              <div id={readerElementId} className="w-full" />
              <div className="p-2 bg-slate-900/90 text-center text-[11px] text-white flex items-center justify-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block mr-1"></span>
                Arahkan barcode produk ke tengah kamera HP
              </div>
            </div>
          )}

          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Keyboard className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={manualSku}
                onChange={(e) => setManualSku(e.target.value)}
                placeholder="Scan barcode fisik atau ketik SKU / Nama..."
                className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-slate-900 active:scale-95 transition flex items-center gap-1 shrink-0"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Cari</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: INPUT MANUAL BARANG CUSTOM (#1) */}
      {activeTab === 'manual' && (
        <form onSubmit={handleAddManualProduct} className="space-y-3 bg-slate-50/70 p-3 rounded-xl border border-slate-200">
          <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <PlusCircle className="w-4 h-4 text-amber-600" />
            <span>Input Barang Manual (Langsung Masuk Keranjang)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            <div className="sm:col-span-5">
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Nama Barang *</label>
              <input
                type="text"
                required
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                placeholder="Contoh: Es Teh Manis Jumbo"
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Harga Satuan (Rp) *</label>
              <input
                type="number"
                required
                min="0"
                step="500"
                value={manualPrice}
                onChange={(e) => setManualPrice(e.target.value)}
                placeholder="5000"
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-medium"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Qty *</label>
              <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white shadow-xs">
                <button
                  type="button"
                  onClick={() => setManualQty((prev) => (typeof prev === 'number' && prev > 1 ? prev - 1 : 1))}
                  className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 active:bg-slate-200 text-slate-600 transition"
                  title="Kurangi"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  min="1"
                  value={manualQty}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      setManualQty('');
                    } else {
                      const parsed = parseInt(val);
                      setManualQty(isNaN(parsed) ? '' : Math.max(0, parsed));
                    }
                  }}
                  placeholder="1"
                  className="w-full text-center py-1.5 text-xs sm:text-sm border-0 focus:outline-none font-bold bg-transparent"
                />
                <button
                  type="button"
                  onClick={() => setManualQty((prev) => (typeof prev === 'number' ? prev + 1 : 1))}
                  className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 active:bg-slate-200 text-slate-600 transition"
                  title="Tambah"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={manualQty === '' || Number(manualQty) <= 0 || !manualName.trim() || !manualPrice.trim()}
            className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 active:scale-98 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Tambah ke Keranjang</span>
          </button>
        </form>
      )}

      {/* Status Notifications */}
      {errorStatus && (
        <div className="flex items-center gap-2 p-2.5 bg-red-50 text-red-700 rounded-xl text-xs border border-red-200">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span className="flex-1">{errorStatus}</span>
        </div>
      )}

      {successStatus && (
        <div className="flex items-center gap-2 p-2.5 bg-amber-50 text-amber-800 rounded-xl text-xs border border-amber-200 font-medium animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-amber-600" />
          <span className="flex-1">{successStatus}</span>
        </div>
      )}
    </div>
  );
};

export default BarcodeScanner;