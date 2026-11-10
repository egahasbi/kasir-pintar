import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { Product, CartItem, DiscountRule, Coupon } from '../types';
import { supabase } from '../lib/supabaseClient';

import { useAuth } from './AuthContext';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  activeDiscounts: DiscountRule[];
  appliedCoupon: Coupon | null;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
  taxRate: number;
  setTaxRate: (rate: number) => void;
  subtotal: number;
  totalDiscount: number;
  taxAmount: number;
  grandTotal: number;
  formatIDR: (value: number) => string;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const DEFAULT_PPN_RATE = 0.11;

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { profile, user } = useAuth();
  const userKey = profile?.id || user?.id || 'guest';
  const cartStorageKey = `kasir_cart_${userKey}`;
  const couponStorageKey = `kasir_coupon_${userKey}`;

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(cartStorageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(() => {
    try {
      const saved = localStorage.getItem(couponStorageKey);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // #10 BUG: Update keranjang saat akun / role berganti
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(cartStorageKey);
      setCart(savedCart ? JSON.parse(savedCart) : []);

      const savedCoupon = localStorage.getItem(couponStorageKey);
      setAppliedCoupon(savedCoupon ? JSON.parse(savedCoupon) : null);
    } catch {
      setCart([]);
      setAppliedCoupon(null);
    }
  }, [userKey]);

  const [taxRate, setTaxRate] = useState<number>(DEFAULT_PPN_RATE);
  const [activeDiscounts] = useState<DiscountRule[]>([
    {
      id: 'rule-tier-1',
      name: 'Grosir Tier 1',
      minQuantity: 5,
      discountPercent: 5,
      isActive: true,
    },
    {
      id: 'rule-tier-2',
      name: 'Grosir Tier 2',
      minQuantity: 12,
      discountPercent: 10,
      isActive: true,
    },
    {
      id: 'rule-tier-3',
      name: 'Partai Besar',
      minQuantity: 24,
      discountPercent: 15,
      isActive: true,
    },
  ]);

  useEffect(() => {
    try {
      localStorage.setItem(cartStorageKey, JSON.stringify(cart));
    } catch {
      // Ignore storage errors
    }
  }, [cart, cartStorageKey]);

  useEffect(() => {
    try {
      if (appliedCoupon) {
        localStorage.setItem(couponStorageKey, JSON.stringify(appliedCoupon));
      } else {
        localStorage.removeItem(couponStorageKey);
      }
    } catch {
      // Ignore storage errors
    }
  }, [appliedCoupon, couponStorageKey]);

  const addToCart = (product: Product, quantity = 1) => {
    if (quantity <= 0) return;

    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id);

      if (existingIndex > -1) {
        const updated = [...prev];
        const currentItem = updated[existingIndex];
        const newQty = Math.min(currentItem.quantity + quantity, product.stock);

        updated[existingIndex] = {
          ...currentItem,
          quantity: newQty,
        };
        return updated;
      }

      const initialQty = Math.min(quantity, product.stock);
      if (initialQty <= 0) return prev;

      return [...prev, { product, quantity: initialQty }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const validQty = Math.min(quantity, item.product.stock);
          return { ...item, quantity: validQty };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
  };

  const applyCoupon = async (code: string): Promise<{ success: boolean; message: string }> => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return { success: false, message: 'Masukkan kode kupon.' };

    try {
      const { data, error } = await supabase
        .from('discounts')
        .select('*')
        .eq('code', cleanCode)
        .eq('is_active', true)
        .maybeSingle();

      if (error || !data) {
        return { success: false, message: 'Kode kupon tidak valid atau sudah kadaluarsa.' };
      }

      const currentSubtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

      if (data.min_order_amount && currentSubtotal < Number(data.min_order_amount)) {
        return {
          success: false,
          message: `Minimal belanja Rp ${Number(data.min_order_amount).toLocaleString('id-ID')} untuk pakai kupon ini.`,
        };
      }

      const loadedCoupon: Coupon = {
        id: data.id,
        code: data.code,
        discountType: data.type === 'percentage' ? 'percentage' : 'fixed',
        discountValue: Number(data.value),
        minPurchase: Number(data.min_order_amount || 0),
        maxDiscount: data.max_discount_amount ? Number(data.max_discount_amount) : undefined,
        isActive: data.is_active,
      };

      setAppliedCoupon(loadedCoupon);
      return { success: true, message: `Kupon ${loadedCoupon.code} berhasil diterapkan!` };
    } catch {
      return { success: false, message: 'Gagal mengecek kupon.' };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  const formatIDR = (value: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.round(value));
  };

  const { subtotal, totalDiscount, taxAmount, grandTotal } = useMemo(() => {
    const rawSubtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

    let tierDiscounts = 0;
    cart.forEach((item) => {
      const applicableRule = activeDiscounts
        .filter((r) => r.isActive && item.quantity >= r.minQuantity)
        .sort((a, b) => b.minQuantity - a.minQuantity)[0];

      if (applicableRule) {
        const itemTotal = item.product.price * item.quantity;
        tierDiscounts += (itemTotal * applicableRule.discountPercent) / 100;
      }
    });

    let couponDiscount = 0;
    if (appliedCoupon && rawSubtotal >= (appliedCoupon.minPurchase || 0)) {
      if (appliedCoupon.discountType === 'percentage') {
        const calculated = ((rawSubtotal - tierDiscounts) * appliedCoupon.discountValue) / 100;
        couponDiscount = appliedCoupon.maxDiscount
          ? Math.min(calculated, appliedCoupon.maxDiscount)
          : calculated;
      } else {
        couponDiscount = appliedCoupon.discountValue;
      }
    }

    const combinedDiscount = Math.min(rawSubtotal, tierDiscounts + couponDiscount);
    const taxableBase = Math.max(0, rawSubtotal - combinedDiscount);
    const tax = Math.round(taxableBase * taxRate);
    const total = taxableBase + tax;

    return {
      subtotal: Math.round(rawSubtotal),
      totalDiscount: Math.round(combinedDiscount),
      taxAmount: tax,
      grandTotal: Math.round(total),
    };
  }, [cart, activeDiscounts, appliedCoupon, taxRate]);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        activeDiscounts,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        taxRate,
        setTaxRate,
        subtotal,
        totalDiscount,
        taxAmount,
        grandTotal,
        formatIDR,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};
export default CartContext;