import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { Product, CartItem, DiscountRule, Coupon } from '../types';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  activeDiscounts: DiscountRule[];
  appliedCoupon: Coupon | null;
  applyCoupon: (code: string) => { success: boolean; message: string };
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

const STORAGE_KEY_CART = 'kasir_pintar_cart';
const STORAGE_KEY_COUPON = 'kasir_pintar_coupon';
const DEFAULT_PPN_RATE = 0.11;

const PRESET_COUPONS: Coupon[] = [
  {
    id: 'c-umkm-berkah',
    code: 'BERKAH10',
    discountType: 'percentage',
    discountValue: 10,
    minPurchase: 50000,
    maxDiscount: 25000,
    isActive: true,
  },
  {
    id: 'c-umkm-hemat',
    code: 'HEMAT20K',
    discountType: 'fixed',
    discountValue: 20000,
    minPurchase: 100000,
    isActive: true,
  },
  {
    id: 'c-umkm-merdeka',
    code: 'MERDEKA',
    discountType: 'percentage',
    discountValue: 17,
    minPurchase: 75000,
    maxDiscount: 50000,
    isActive: true,
  },
];

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CART);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_COUPON);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

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
      localStorage.setItem(STORAGE_KEY_CART, JSON.stringify(cart));
    } catch {
      // Ignore storage errors
    }
  }, [cart]);

  useEffect(() => {
    try {
      if (appliedCoupon) {
        localStorage.setItem(STORAGE_KEY_COUPON, JSON.stringify(appliedCoupon));
      } else {
        localStorage.removeItem(STORAGE_KEY_COUPON);
      }
    } catch {
      // Ignore storage errors
    }
  }, [appliedCoupon]);

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

  const applyCoupon = (code: string): { success: boolean; message: string } => {
    const cleanCode = code.trim().toUpperCase();
    const found = PRESET_COUPONS.find((c) => c.code === cleanCode && c.isActive);

    if (!found) {
      return { success: false, message: 'Kode kupon tidak valid atau kadaluarsa.' };
    }

    const currentSubtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

    if (found.minPurchase && currentSubtotal < found.minPurchase) {
      return {
        success: false,
        message: `Minimal belanja Rp ${found.minPurchase.toLocaleString('id-ID')} untuk pakai kupon ini.`,
      };
    }

    setAppliedCoupon(found);
    return { success: true, message: `Kupon ${found.code} berhasil diterapkan!` };
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