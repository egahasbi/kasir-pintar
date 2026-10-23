import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { Product, CartItem } from '../types';

interface CartContextType {
  cart: CartItem[];
  subtotal: number;
  discountRate: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  itemCount: number;
  addToCart: (product: Product, quantity?: number) => { success: boolean; message?: string };
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => { success: boolean; message?: string };
  setDiscountRate: (rate: number) => void;
  setTaxRate: (rate: number) => void;
  clearCart: () => void;
}

const STORAGE_KEY = 'kasir_pintar_cart';
const DEFAULT_TAX_RATE = 11;

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const savedCart = localStorage.getItem(STORAGE_KEY);
      return savedCart ? JSON.parse(savedCart) : [];
    } catch {
      return [];
    }
  });

  const [discountRate, setDiscountRateState] = useState<number>(0);
  const [taxRate, setTaxRateState] = useState<number>(DEFAULT_TAX_RATE);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // Storage unavailable or quota exceeded
    }
  }, [cart]);

  const addToCart = (product: Product, quantity: number = 1): { success: boolean; message?: string } => {
    if (quantity <= 0) {
      return { success: false, message: 'Jumlah produk tidak valid.' };
    }

    if (product.stock <= 0) {
      return { success: false, message: `Stok produk ${product.name} telah habis.` };
    }

    const existingIndex = cart.findIndex((item) => item.product.id === product.id);

    if (existingIndex > -1) {
      const existingItem = cart[existingIndex];
      const newQuantity = existingItem.quantity + quantity;

      if (newQuantity > product.stock) {
        return {
          success: false,
          message: `Stok tidak mencukupi. Sisa stok: ${product.stock}, sudah di keranjang: ${existingItem.quantity}.`
        };
      }

      const updatedCart = [...cart];
      updatedCart[existingIndex] = {
        ...existingItem,
        quantity: newQuantity,
        subtotal: newQuantity * product.price
      };

      setCart(updatedCart);
      return { success: true };
    }

    if (quantity > product.stock) {
      return {
        success: false,
        message: `Stok tidak mencukupi. Maksimal stok tersedia: ${product.stock}.`
      };
    }

    const newItem: CartItem = {
      product,
      quantity,
      subtotal: quantity * product.price
    };

    setCart((prev) => [...prev, newItem]);
    return { success: true };
  };

  const updateQuantity = (productId: string, quantity: number): { success: boolean; message?: string } => {
    const existingIndex = cart.findIndex((item) => item.product.id === productId);

    if (existingIndex === -1) {
      return { success: false, message: 'Produk tidak ditemukan di keranjang.' };
    }

    if (quantity <= 0) {
      removeFromCart(productId);
      return { success: true };
    }

    const currentItem = cart[existingIndex];
    if (quantity > currentItem.product.stock) {
      return {
        success: false,
        message: `Jumlah melebihi stok tersedia (${currentItem.product.stock}).`
      };
    }

    const updatedCart = [...cart];
    updatedCart[existingIndex] = {
      ...currentItem,
      quantity,
      subtotal: quantity * currentItem.product.price
    };

    setCart(updatedCart);
    return { success: true };
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountRateState(0);
    setTaxRateState(DEFAULT_TAX_RATE);
  };

  const setDiscountRate = (rate: number) => {
    const safeRate = Math.max(0, Math.min(100, isNaN(rate) ? 0 : rate));
    setDiscountRateState(safeRate);
  };

  const setTaxRate = (rate: number) => {
    const safeRate = Math.max(0, isNaN(rate) ? 0 : rate);
    setTaxRateState(safeRate);
  };

  const calculations = useMemo(() => {
    const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
    const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

    const discountAmount = Math.round((subtotal * discountRate) / 100);
    const baseAfterDiscount = Math.max(0, subtotal - discountAmount);

    const taxAmount = Math.round((baseAfterDiscount * taxRate) / 100);
    const total = baseAfterDiscount + taxAmount;

    return {
      subtotal,
      itemCount,
      discountAmount,
      taxAmount,
      total
    };
  }, [cart, discountRate, taxRate]);

  return (
    <CartContext.Provider
      value={{
        cart,
        subtotal: calculations.subtotal,
        discountRate,
        discountAmount: calculations.discountAmount,
        taxRate,
        taxAmount: calculations.taxAmount,
        total: calculations.total,
        itemCount: calculations.itemCount,
        addToCart,
        removeFromCart,
        updateQuantity,
        setDiscountRate,
        setTaxRate,
        clearCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};