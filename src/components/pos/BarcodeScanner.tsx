import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, CameraOff, Keyboard, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { Product } from '../../types';

interface BarcodeDetectorInterface {
  detect(image: ImageBitmapSource): Promise<Array<{ rawValue: string }>>;
}

declare global {
  interface Window {
    BarcodeDetector?: {
      new (options?: { formats: string[] }): BarcodeDetectorInterface;
      getSupportedFormats(): Promise<string[]>;
    };
  }
}

interface BarcodeScannerProps {
  products: Product[];
  onProductScanned?: (product: Product) => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ products, onProductScanned }) => {
  const { addToCart } = useCart();
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [manualSku, setManualSku] = useState<string>('');
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [successStatus, setSuccessStatus] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleProductMatch = useCallback((barcodeValue: string) => {
    const cleaned = barcodeValue.trim();
    if (!cleaned) return;

    const matched = products.find(
      (p) =>
        (p.barcode && p.barcode.toLowerCase() === cleaned.toLowerCase()) ||
        p.sku.toLowerCase() === cleaned.toLowerCase()
    );

    if (matched) {
      if (matched.stock <= 0) {
        setErrorStatus(`Stok produk habis: ${matched.name}`);
        setSuccessStatus(null);
        return;
      }
      addToCart(matched, 1);
      setSuccessStatus(`Berhasil ditambahkan: ${matched.name}`);
      setErrorStatus(null);
      if (onProductScanned) {
        onProductScanned(matched);
      }
    } else {
      setErrorStatus(`Produk barcode "${cleaned}" tidak ditemukan.`);
      setSuccessStatus(null);
    }
  }, [products, addToCart, onProductScanned]);

  const stopCamera = useCallback(() => {
    if (scanIntervalRef.current) {
      window.clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  const startCamera = async () => {
    setErrorStatus(null);
    setSuccessStatus(null);

    if (!('BarcodeDetector' in window)) {
      setIsSupported(false);
      setErrorStatus('Barcode Detection API tidak didukung browser ini. Gunakan input manual atau Chrome Android/Desktop flag.');
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraActive(true);
      }

      const barcodeDetector = new window.BarcodeDetector!({
        formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'qr_code'],
      });

      let lastScannedCode = '';
      let scanCooldown = 0;

      scanIntervalRef.current = window.setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) return;

        const now = Date.now();
        if (now < scanCooldown) return;

        try {
          const barcodes = await barcodeDetector.detect(videoRef.current);
          if (barcodes.length > 0) {
            const code = barcodes[0].rawValue;
            if (code && code !== lastScannedCode) {
              lastScannedCode = code;
              scanCooldown = now + 1500;
              handleProductMatch(code);
            }
          }
        } catch {
          // Frame drop safe to ignore
        }
      }, 250);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Akses kamera ditolak atau perangkat tidak tersedia';
      setErrorStatus(`Gagal mengaktifkan kamera: ${message}`);
      stopCamera();
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualSku.trim()) return;
    handleProductMatch(manualSku.trim());
    setManualSku('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-indigo-600" />
          <h3 className="font-semibold text-gray-800 text-sm md:text-base">Scanner Barcode / SKU</h3>
        </div>
        <button
          type="button"
          onClick={isCameraActive ? stopCamera : startCamera}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            isCameraActive
              ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
              : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200'
          }`}
        >
          {isCameraActive ? (
            <>
              <CameraOff className="w-4 h-4" />
              Tutup Kamera
            </>
          ) : (
            <>
              <Camera className="w-4 h-4" />
              Aktifkan Kamera
            </>
          )}
        </button>
      </div>

      {isCameraActive && (
        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border border-gray-300">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />
          <div className="absolute inset-0 border-2 border-indigo-500/50 pointer-events-none flex items-center justify-center">
            <div className="w-3/4 h-1/2 border-2 border-dashed border-white/80 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs bg-black/60 px-2 py-1 rounded">
                Arahkan Barcode ke Sini
              </span>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleManualSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Keyboard className="w-4 h-4" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={manualSku}
            onChange={(e) => setManualSku(e.target.value)}
            placeholder="Scan barcode fisik atau ketik SKU..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Cari
        </button>
      </form>

      {errorStatus && (
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-xs md:text-sm border border-red-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="truncate">{errorStatus}</span>
        </div>
      )}

      {successStatus && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-700 rounded-lg text-xs md:text-sm border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="truncate">{successStatus}</span>
        </div>
      )}

      {!isSupported && (
        <p className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded border border-amber-200">
          Browser tidak mendukung Shape Detection API secara native. Scanner keyboard USB/Bluetooth dapat langsung digunakan melalui input teks di atas.
        </p>
      )}
    </div>
  );
};

export default BarcodeScanner;