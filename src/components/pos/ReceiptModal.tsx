import React, { useRef } from 'react';

export interface ReceiptItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface AppliedDiscount {
  id: string;
  name: string;
  type: 'percentage' | 'fixed';
  value: number;
  amountDeducted: number;
}

export interface ReceiptData {
  transactionId: string;
  invoiceNumber: string;
  timestamp: string;
  cashierName: string;
  customerName?: string;
  storeName: string;
  storeAddress: string;
  storePhone: string;
  items: ReceiptItem[];
  subtotal: number;
  discounts: AppliedDiscount[];
  taxRate: number; // e.g. 0.11 for 11% PPN
  taxAmount: number;
  total: number;
  paymentMethod: 'CASH' | 'QRIS' | 'DEBIT' | 'CREDIT';
  amountPaid: number;
  change: number;
  qrisTransactionId?: string;
  qrisNmid?: string;
}

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptData: ReceiptData;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  receiptData,
}) => {
  const receiptPrintRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatRupiah = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const totalDiscount = receiptData.discounts.reduce(
    (acc, d) => acc + d.amountDeducted,
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col my-8">
        {/* Header Modal Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 print:hidden">
          <h2 className="text-lg font-bold text-gray-800">Bukti Pembayaran</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
            aria-label="Tutup"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        {/* Printable Receipt Paper Container */}
        <div className="p-6 overflow-y-auto max-h-[75vh]" ref={receiptPrintRef}>
          <div className="receipt-paper font-mono text-xs text-gray-800 border border-dashed border-gray-300 p-4 bg-[#fffdfa] shadow-inner">
            {/* Store Information */}
            <div className="text-center mb-3">
              <h3 className="text-base font-extrabold uppercase tracking-wide text-gray-900">
                {receiptData.storeName}
              </h3>
              <p className="text-[11px] text-gray-600 mt-1 whitespace-pre-line">
                {receiptData.storeAddress}
              </p>
              <p className="text-[11px] text-gray-600">Telp: {receiptData.storePhone}</p>
            </div>

            <div className="border-t border-b border-dashed border-gray-400 py-2 my-2 space-y-1">
              <div className="flex justify-between">
                <span>No. Transaksi</span>
                <span className="font-semibold">{receiptData.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Waktu</span>
                <span>{receiptData.timestamp}</span>
              </div>
              <div className="flex justify-between">
                <span>Kasir</span>
                <span>{receiptData.cashierName}</span>
              </div>
              {receiptData.customerName && (
                <div className="flex justify-between">
                  <span>Pelanggan</span>
                  <span>{receiptData.customerName}</span>
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="py-2">
              <div className="flex justify-between font-bold border-b border-gray-200 pb-1 mb-2">
                <span>Menu/Item</span>
                <span>Total</span>
              </div>
              <div className="space-y-2">
                {receiptData.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-start">
                    <div className="max-w-[70%]">
                      <p className="font-medium text-gray-900 leading-tight">
                        {item.name}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {item.quantity} x {formatRupiah(item.unitPrice)}
                      </p>
                    </div>
                    <span className="font-medium whitespace-nowrap">
                      {formatRupiah(item.subtotal)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="border-t border-dashed border-gray-400 pt-2 mt-2 space-y-1">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatRupiah(receiptData.subtotal)}</span>
              </div>

              {/* Discount Breakdowns */}
              {receiptData.discounts.length > 0 && (
                <div className="py-1 border-y border-dotted border-gray-300 my-1 space-y-0.5">
                  <div className="text-[10px] font-bold text-gray-600">
                    DISKON TERAPLIKASI:
                  </div>
                  {receiptData.discounts.map((discount) => (
                    <div
                      key={discount.id}
                      className="flex justify-between text-red-600"
                    >
                      <span className="pl-2">
                        - {discount.name}{' '}
                        {discount.type === 'percentage' && `(${discount.value}%)`}
                      </span>
                      <span>-{formatRupiah(discount.amountDeducted)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-semibold text-red-700 pt-0.5">
                    <span>Total Diskon</span>
                    <span>-{formatRupiah(totalDiscount)}</span>
                  </div>
                </div>
              )}

              {/* Tax Information */}
              <div className="flex justify-between">
                <span>PPN ({(receiptData.taxRate * 100).toFixed(0)}%)</span>
                <span>{formatRupiah(receiptData.taxAmount)}</span>
              </div>

              {/* Final Amount */}
              <div className="flex justify-between text-sm font-bold border-t border-dashed border-gray-400 pt-1.5 mt-1 text-gray-950">
                <span>TOTAL AKHIR</span>
                <span>{formatRupiah(receiptData.total)}</span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="border-t border-dashed border-gray-400 pt-2 mt-2 space-y-1">
              <div className="flex justify-between font-semibold">
                <span>Metode Bayar</span>
                <span>{receiptData.paymentMethod}</span>
              </div>

              {/* QRIS Transaction Details */}
              {receiptData.paymentMethod === 'QRIS' && (
                <div className="bg-gray-100 p-2 rounded text-[10px] space-y-0.5 my-1.5 border border-gray-200">
                  <div className="flex justify-between">
                    <span className="text-gray-600">NMID</span>
                    <span className="font-semibold text-gray-800">
                      {receiptData.qrisNmid || 'ID1020000000000'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">QRIS Ref ID</span>
                    <span className="font-semibold text-gray-800">
                      {receiptData.qrisTransactionId || receiptData.transactionId}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status</span>
                    <span className="text-green-700 font-bold uppercase">BERHASIL / SETTLED</span>
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <span>Dibayar</span>
                <span>{formatRupiah(receiptData.amountPaid)}</span>
              </div>
              <div className="flex justify-between">
                <span>Kembalian</span>
                <span>{formatRupiah(receiptData.change)}</span>
              </div>
            </div>

            {/* Footer Notes */}
            <div className="text-center mt-5 text-[10px] text-gray-500 space-y-1">
              <p className="font-semibold text-gray-700">Terima kasih atas kunjungan Anda!</p>
              <p>Barang yang sudah dibeli tidak dapat ditukar atau dikembalikan.</p>
              <p className="text-[9px] text-gray-400">Powered by KASIRKITA</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 bg-white text-gray-700 text-xs font-semibold hover:bg-gray-100 transition-colors"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
            </svg>
            <span>Cetak Struk Thermal</span>
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .receipt-paper, .receipt-paper * {
            visibility: visible;
          }
          .receipt-paper {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
            margin: 0;
            padding: 10px;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
          }
        }
      `}} />
    </div>
  );
};

export default ReceiptModal;