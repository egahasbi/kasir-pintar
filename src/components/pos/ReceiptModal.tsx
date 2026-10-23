import React, { useRef, useState } from 'react';
import { Transaction, StoreSettings } from '../../types';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction;
  storeSettings?: StoreSettings;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  transaction,
  storeSettings = {
    name: 'KASIR PINTAR AI',
    address: 'Jl. Pemuda Bisnis No. 12, Jakarta',
    phone: '0812-3456-7890',
    footerNote: 'Terima kasih atas kunjungan Anda!',
  },
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [printingBluetooth, setPrintingBluetooth] = useState<boolean>(false);
  const [printStatus, setPrintStatus] = useState<string>('');

  if (!isOpen) return null;

  const formatCurrency = (val: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatDate = (dateStr: string): string => {
    const d = new Date(dateStr);
    return d.toLocaleString('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const handleNativePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    if (!receiptRef.current) return;
    const content = receiptRef.current.innerHTML;
    const printWindow = window.open('', '', 'width=400,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Struk-${transaction.receiptNumber}</title>
          <style>
            @page { size: 58mm auto; margin: 0; }
            body {
              font-family: monospace, 'Courier New', Courier;
              width: 58mm;
              padding: 4mm;
              font-size: 11px;
              line-height: 1.25;
              color: #000;
              margin: 0;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .border-b { border-bottom: 1px dashed #000; padding-bottom: 4px; margin-bottom: 4px; }
            .border-t { border-top: 1px dashed #000; padding-top: 4px; margin-top: 4px; }
            .flex-between { display: flex; justify-content: space-between; }
            .item-line { margin: 2px 0; }
          </style>
        </head>
        <body>
          ${content}
          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const encodeEscPos = (): Uint8Array => {
    const encoder = new TextEncoder();
    const chunks: Uint8Array[] = [];

    const append = (bytes: number[]) => chunks.push(new Uint8Array(bytes));
    const appendText = (text: string) => chunks.push(encoder.encode(text));

    append([0x1b, 0x40]);
    append([0x1b, 0x61, 0x01]);
    append([0x1b, 0x45, 0x01]);
    appendText(`${storeSettings.name}\n`);
    append([0x1b, 0x45, 0x00]);
    appendText(`${storeSettings.address}\nTelp: ${storeSettings.phone}\n`);
    appendText('--------------------------------\n');

    append([0x1b, 0x61, 0x00]);
    appendText(`No: ${transaction.receiptNumber}\n`);
    appendText(`Tgl: ${formatDate(transaction.createdAt)}\n`);
    appendText(`Kasir: ${transaction.cashierName || 'Staff'}\n`);
    appendText('--------------------------------\n');

    transaction.items.forEach((item) => {
      const lineTotal = item.price * item.quantity;
      const title = item.name.length > 32 ? item.name.substring(0, 29) + '...' : item.name;
      appendText(`${title}\n`);
      const details = `  ${item.quantity} x ${item.price.toLocaleString('id-ID')}`;
      const totalStr = lineTotal.toLocaleString('id-ID');
      const padLen = Math.max(1, 32 - details.length - totalStr.length);
      appendText(`${details}${' '.repeat(padLen)}${totalStr}\n`);
    });

    appendText('--------------------------------\n');
    const writePair = (label: string, val: number) => {
      const strVal = val.toLocaleString('id-ID');
      const padLen = Math.max(1, 32 - label.length - strVal.length);
      appendText(`${label}${' '.repeat(padLen)}${strVal}\n`);
    };

    writePair('Subtotal', transaction.subtotal);
    if (transaction.tax > 0) writePair('PPN', transaction.tax);
    if (transaction.discount > 0) writePair('Diskon', -transaction.discount);

    append([0x1b, 0x45, 0x01]);
    writePair('TOTAL', transaction.totalAmount);
    append([0x1b, 0x45, 0x00]);

    writePair('Bayar (' + transaction.paymentMethod + ')', transaction.amountPaid);
    writePair('Kembali', transaction.changeAmount);

    appendText('--------------------------------\n');
    append([0x1b, 0x61, 0x01]);
    appendText(`${storeSettings.footerNote}\n`);
    appendText('KASIR PINTAR AI\n\n\n\n');

    append([0x1d, 0x56, 0x42, 0x00]);

    const totalLength = chunks.reduce((acc, curr) => acc + curr.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    return result;
  };

  const handleBluetoothPrint = async () => {
    if (!navigator.bluetooth) {
      setPrintStatus('Browser tidak mendukung Web Bluetooth');
      return;
    }

    try {
      setPrintingBluetooth(true);
      setPrintStatus('Mencari printer thermal...');

      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: ['000018f0-0000-1000-8000-00805f9b34fb'] },
          { namePrefix: 'RP' },
          { namePrefix: 'POS' },
          { namePrefix: 'MPT' },
          { namePrefix: 'Printer' },
        ],
        optionalServices: [
          '000018f0-0000-1000-8000-00805f9b34fb',
          '49535343-fe7d-4ae5-8fa9-9fafd205e455',
          'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
        ],
      });

      setPrintStatus('Menghubungkan printer...');
      const server = await device.gatt?.connect();
      if (!server) throw new Error('Gagal menghubungkan GATT Server');

      const primaryService = await server.getPrimaryServices();
      if (!primaryService.length) throw new Error('Service Bluetooth tidak ditemukan');

      const characteristics = await primaryService[0].getCharacteristics();
      const writeChar = characteristics.find(
        (c) => c.properties.write || c.properties.writeWithoutResponse
      );

      if (!writeChar) throw new Error('Karakteristik cetak tidak ditemukan');

      setPrintStatus('Mengirim data struk...');
      const payload = encodeEscPos();

      const chunkSize = 100;
      for (let i = 0; i < payload.length; i += chunkSize) {
        const slice = payload.slice(i, i + chunkSize);
        if (writeChar.properties.writeWithoutResponse) {
          await writeChar.writeValueWithoutResponse(slice);
        } else {
          await writeChar.writeValue(slice);
        }
      }

      setPrintStatus('Berhasil dicetak');
      setTimeout(() => {
        setPrintStatus('');
        device.gatt?.disconnect();
      }, 1500);
    } catch (err: any) {
      setPrintStatus(err?.message || 'Gagal koneksi Bluetooth');
    } finally {
      setPrintingBluetooth(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">
            Struk Transaksi
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Receipt Preview */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100 dark:bg-slate-950 flex justify-center">
          <div
            ref={receiptRef}
            className="w-full max-w-[320px] bg-white text-slate-900 p-5 rounded shadow font-mono text-xs leading-relaxed border border-slate-300"
          >
            {/* Store Details */}
            <div className="text-center pb-3 border-b border-dashed border-slate-400">
              <div className="font-bold text-sm tracking-wider uppercase">{storeSettings.name}</div>
              <div className="text-slate-600 mt-1">{storeSettings.address}</div>
              <div className="text-slate-600">Telp: {storeSettings.phone}</div>
            </div>

            {/* Meta */}
            <div className="py-2 border-b border-dashed border-slate-400 text-slate-700 space-y-0.5">
              <div className="flex justify-between">
                <span>No:</span>
                <span className="font-semibold">{transaction.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Waktu:</span>
                <span>{formatDate(transaction.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span>Kasir:</span>
                <span>{transaction.cashierName || 'Staff'}</span>
              </div>
              <div className="flex justify-between">
                <span>Metode:</span>
                <span className="uppercase font-semibold">{transaction.paymentMethod}</span>
              </div>
            </div>

            {/* Item List */}
            <div className="py-2 border-b border-dashed border-slate-400 space-y-2">
              {transaction.items.map((item, idx) => (
                <div key={idx}>
                  <div className="font-semibold text-slate-900 truncate">{item.name}</div>
                  <div className="flex justify-between text-slate-600">
                    <span>
                      {item.quantity} x {formatCurrency(item.price)}
                    </span>
                    <span className="font-medium text-slate-900">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Calculations */}
            <div className="py-2 border-b border-dashed border-slate-400 space-y-1 text-slate-700">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(transaction.subtotal)}</span>
              </div>
              {transaction.tax > 0 && (
                <div className="flex justify-between">
                  <span>PPN</span>
                  <span>{formatCurrency(transaction.tax)}</span>
                </div>
              )}
              {transaction.discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Diskon</span>
                  <span>-{formatCurrency(transaction.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-200">
                <span>TOTAL</span>
                <span>{formatCurrency(transaction.totalAmount)}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span>Bayar</span>
                <span>{formatCurrency(transaction.amountPaid)}</span>
              </div>
              <div className="flex justify-between">
                <span>Kembali</span>
                <span>{formatCurrency(transaction.changeAmount)}</span>
              </div>
            </div>

            {/* Footer Note */}
            <div className="pt-3 text-center text-slate-600">
              <p>{storeSettings.footerNote}</p>
              <p className="mt-2 text-[10px] text-slate-400 font-sans tracking-wide">
                POWERED BY KASIR PINTAR AI
              </p>
            </div>
          </div>
        </div>

        {/* Status message */}
        {printStatus && (
          <div className="px-6 py-2 bg-slate-50 dark:bg-slate-800 text-center text-xs font-medium text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800">
            {printStatus}
          </div>
        )}

        {/* Actions */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 grid grid-cols-3 gap-2">
          <button
            onClick={handleNativePrint}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition font-medium text-xs gap-1"
          >
            <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </button>

          <button
            onClick={handleDownloadPdf}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition font-medium text-xs gap-1"
          >
            <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Unduh PDF
          </button>

          <button
            onClick={handleBluetoothPrint}
            disabled={printingBluetooth}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white transition font-medium text-xs gap-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.5 7.5l7 7m0-7l-7 7m3.5-9.5v18l5-5-5-5" />
            </svg>
            {printingBluetooth ? 'Koneksi...' : 'Thermal BT'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;