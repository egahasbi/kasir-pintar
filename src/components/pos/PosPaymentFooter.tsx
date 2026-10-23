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
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 whitespace-nowrap">Uang Diterima:</label>
          <input
            type="number"
            value={cashGiven || ''}
            onChange={(e) => setCashGiven(Number(e.target.value))}
            placeholder={grandTotal.toString()}
            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>
      )}

      <button
        disabled={disabled}
        onClick={onCheckout}
        className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 disabled:opacity-50 transition shadow-md flex items-center justify-center gap-2"
      >
        <Receipt className="w-4 h-4" />
        Bayar {formatIDR(grandTotal)}
      </button>
    </div>
  );
}
