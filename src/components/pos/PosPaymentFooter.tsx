import React from 'react';
import { Banknote, QrCode, CreditCard, Receipt } from 'lucide-react';

interface PosPaymentFooterProps {
  subtotal: number;
  totalDiscount: number;
  taxAmount: number;
  grandTotal: number;
  formatIDR: (n: number) => string;
  paymentMethod: 'CASH' | 'QRIS' | 'DEBIT';
  setPaymentMethod: (m: 'CASH' | 'QRIS' | 'DEBIT') => void;
  cashGiven: number;
  setCashGiven: (n: number) => void;
  customerName?: string;
  setCustomerName?: (s: string) => void;
  disabled: boolean;
  onCheckout: () => void;
}

export function PosPaymentFooter({
  subtotal,
  totalDiscount,
  taxAmount,
  grandTotal,
  formatIDR,
  paymentMethod,
  setPaymentMethod,
  cashGiven,
  setCashGiven,
  customerName = '',
  setCustomerName,
  disabled,
  onCheckout
}: PosPaymentFooterProps) {
  return (
    <div className="p-4 border-t border-slate-200 bg-white space-y-3">
      <div className="space-y-1.5 text-xs text-slate-600">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span className="font-semibold text-slate-900">{formatIDR(subtotal)}</span>
        </div>
        {totalDiscount > 0 && (
          <div className="flex justify-between text-emerald-600">
            <span>Diskon Kupon:</span>
            <span>-{formatIDR(totalDiscount)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>PPN (11%):</span>
          <span>{formatIDR(taxAmount)}</span>
        </div>
        <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-100">
          <span>Total Tagihan:</span>
          <span className="text-emerald-700">{formatIDR(grandTotal)}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 pt-1">
        <button
          onClick={() => setPaymentMethod('CASH')}
          className={`p-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 border transition ${
            paymentMethod === 'CASH'
              ? 'border-emerald-600 bg-emerald-50 text-emerald-700 font-bold'
              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Banknote className="w-3.5 h-3.5" />
          Tunai
        </button>
        <button
          onClick={() => setPaymentMethod('QRIS')}
          className={`p-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 border transition ${
            paymentMethod === 'QRIS'
              ? 'border-emerald-600 bg-emerald-50 text-emerald-700 font-bold'
              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <QrCode className="w-3.5 h-3.5" />
          QRIS
        </button>
        <button
          onClick={() => setPaymentMethod('DEBIT')}
          className={`p-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 border transition ${
            paymentMethod === 'DEBIT'
              ? 'border-emerald-600 bg-emerald-50 text-emerald-700 font-bold'
              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          Debit
        </button>
      </div>

      {paymentMethod === 'CASH' && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">Uang Tunai:</label>
            <input
              type="number"
              value={cashGiven || ''}
              onChange={(e) => setCashGiven(Number(e.target.value))}
              placeholder={grandTotal.toString()}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
            />
          </div>

          {/* Quick Cash Chips */}
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 text-[11px]">
            <button
              type="button"
              onClick={() => setCashGiven(grandTotal)}
              className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 hover:bg-emerald-100 whitespace-nowrap"
            >
              Uang Pas
            </button>
            {[20000, 50000, 100000].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setCashGiven(preset)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 whitespace-nowrap"
              >
                {preset / 1000}k
              </button>
            ))}
          </div>

          {cashGiven > grandTotal && (
            <div className="flex justify-between text-xs font-bold text-emerald-700 bg-emerald-50/60 p-2 rounded-lg border border-emerald-100">
              <span>Kembalian:</span>
              <span>{formatIDR(cashGiven - grandTotal)}</span>
            </div>
          )}
        </div>
      )}

      {setCustomerName && (
        <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
          <label className="text-[11px] text-slate-500 whitespace-nowrap">Pelanggan:</label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Nama pelanggan (opsional)..."
            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
          />
        </div>
      )}

      <button
        disabled={disabled}
        onClick={onCheckout}
        className="w-full py-3.5 bg-emerald-600 text-white rounded-xl font-bold text-sm sm:text-base hover:bg-emerald-700 active:scale-98 disabled:opacity-50 transition shadow-md flex items-center justify-center gap-2 touch-manipulation"
      >
        <Receipt className="w-4 h-4" />
        Bayar {formatIDR(grandTotal)}
      </button>
    </div>
  );
}
