import React, { useState } from 'react';
import { Trash2, Plus, Minus, ShoppingCart, Tag, AlertTriangle } from 'lucide-react';
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
  const [itemToDelete, setItemToDelete] = useState<any | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleDecreaseQuantity = (item: any) => {
    if (item.quantity <= 1) {
      setItemToDelete(item);
    } else {
      updateQuantity(item.product.id, item.quantity - 1);
    }
  };

  return (
    <>
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-amber-600" />
          <h2 className="font-bold text-slate-900 text-sm">Keranjang Transaksi</h2>
        </div>
        {cart.length > 0 && (
          <button
            type="button"
            onClick={() => setShowClearConfirm(true)}
            className="text-xs text-red-600 hover:text-red-700 hover:underline flex items-center gap-1 font-semibold transition"
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
                    onClick={() => handleDecreaseQuantity(item)}
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

      {/* #4 MODAL KONFIRMASI: Hapus Item saat Qty 1 */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 text-xs space-y-3 animate-fadeIn">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
              <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h3>Hapus Barang dari Keranjang?</h3>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Jumlah barang saat ini 1. Mengurangi jumlah akan menghapus <strong className="text-slate-900 font-bold">"{itemToDelete?.product?.name}"</strong> dari keranjang transaksi. Lanjutkan?
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-3.5 py-2 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  updateQuantity(itemToDelete.product.id, 0);
                  setItemToDelete(null);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-xs transition"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* #5 MODAL KONFIRMASI: Kosongkan Keranjang */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 text-xs space-y-3 animate-fadeIn">
            <div className="flex items-center gap-2 text-red-700 font-bold text-sm">
              <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <h3>Kosongkan Keranjang?</h3>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Seluruh barang yang ada di dalam keranjang transaksi akan dihapus. Lanjutkan?
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-3.5 py-2 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  clearCart();
                  setShowClearConfirm(false);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-xs transition"
              >
                Ya, Kosongkan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

