import React, { useState } from 'react';
import { Trash2, Plus, Minus, ShoppingCart, Tag } from 'lucide-react';
import { DiscountSelector } from './DiscountSelector';

interface PosCartItemsProps {
  cart: any[];
  clearCart: () => void;
  updateQuantity: (id: string, qty: number) => void;
  formatIDR: (n: number) => string;
  subtotal: number;
  appliedCoupon: any;
  applyCoupon: (coupon: any) => void;
}

export function PosCartItems({
  cart,
  clearCart,
  updateQuantity,
  formatIDR,
  subtotal,
  appliedCoupon,
  applyCoupon
}: PosCartItemsProps) {
  const [isDiscountOpen, setIsDiscountOpen] = useState(false);

  return (
    <>
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-amber-600" />
          <h2 className="font-bold text-slate-900 text-sm">Keranjang Transaksi</h2>
        </div>
        {cart.length > 0 && (
          <button
            onClick={clearCart}
            className="text-xs text-red-600 hover:underline flex items-center gap-1 font-medium"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Kosongkan
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-6">
            <ShoppingCart className="w-12 h-12 stroke-[1.2] mb-2 opacity-50" />
            <p className="text-sm font-medium">Keranjang masih kosong</p>
            <p className="text-xs text-slate-400 mt-1">Pilih barang katalog atau scan barcode</p>
          </div>
        ) : (
          cart.map((item) => (
            <div
              key={item.product.id}
              className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50"
            >
              <div className="flex-1 min-w-0 pr-2">
                <h4 className="text-xs font-semibold text-slate-900 truncate">{item.product.name}</h4>
                <div className="text-[11px] text-slate-500">{formatIDR(item.product.price)}</div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center border border-slate-200 rounded-xl bg-white overflow-hidden shadow-xs">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 active:bg-slate-200 text-slate-700 transition touch-manipulation"
                    aria-label="Kurang"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center text-xs font-bold text-slate-900">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 active:bg-slate-200 text-slate-700 transition touch-manipulation"
                    aria-label="Tambah"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-xs font-extrabold text-slate-900 min-w-16 text-right">
                  {formatIDR(item.product.price * item.quantity)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-3 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between">
        <button
          onClick={() => setIsDiscountOpen(true)}
          className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1.5"
        >
          <Tag className="w-3.5 h-3.5" />
          {appliedCoupon ? `Kupon: ${appliedCoupon.name || appliedCoupon.code}` : '+ Tambah Diskon / Promo'}
        </button>

        <DiscountSelector
          isOpen={isDiscountOpen}
          onClose={() => setIsDiscountOpen(false)}
          subtotal={subtotal}
          appliedDiscount={appliedCoupon}
          onApplyDiscount={(d) => {
            applyCoupon(d);
            setIsDiscountOpen(false);
          }}
        />
      </div>
    </>
  );
}

