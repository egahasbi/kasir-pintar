import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { BarcodeScanner } from '../components/pos/BarcodeScanner';
import { PosCatalog } from '../components/pos/PosCatalog';
import { PosCartItems } from '../components/pos/PosCartItems';
import { PosPaymentFooter } from '../components/pos/PosPaymentFooter';
import { ReceiptModal, ReceiptData } from '../components/pos/ReceiptModal';
import { Product } from '../types';

export default function PosPage() {
  const { profile } = useAuth();
  const {
    cart,
    addToCart,
    clearCart,
    updateQuantity,
    subtotal,
    totalDiscount,
    taxAmount,
    grandTotal,
    formatIDR,
    appliedCoupon,
    applyCoupon
  } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QRIS' | 'DEBIT'>('CASH');
  const [cashGiven, setCashGiven] = useState<number>(0);
  const [showReceipt, setShowReceipt] = useState(false);
  const [completedReceiptData, setCompletedReceiptData] = useState<ReceiptData | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setProducts((data as Product[]) || []);
    } catch (err) {
      console.error('Error fetching POS items:', err);
    } finally {
      setLoading(false);
    }
  };

  const categories: string[] = ['all', ...Array.from(new Set(products.map((p) => String(p.category || 'Umum'))))];

  const filteredProducts = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.barcode && p.barcode.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const handleCheckout = () => {
    if (cart.length === 0) return;

    const invoiceNum = `INV-${Date.now().toString().slice(-6)}`;
    const effectiveCash = paymentMethod === 'CASH' ? Math.max(cashGiven, grandTotal) : grandTotal;
    const change = effectiveCash - grandTotal;

    const receipt: ReceiptData = {
      transactionId: `tx-${Date.now()}`,
      invoiceNumber: invoiceNum,
      timestamp: new Date().toISOString(),
      cashierName: profile?.full_name || 'Kasir Toko',
      storeName: 'Kasir Pintar AI',
      storeAddress: 'Jl. Bisnis Pintar No. 8',
      storePhone: '0812-3456-7890',
      items: cart.map((i) => ({
        id: i.product.id,
        name: i.product.name,
        quantity: i.quantity,
        unitPrice: i.product.price,
        subtotal: i.product.price * i.quantity,
      })),
      subtotal,
      discounts: appliedCoupon
        ? [
            {
              id: appliedCoupon.id,
              name: appliedCoupon.code,
              type: appliedCoupon.discountType,
              value: appliedCoupon.discountValue,
              amountDeducted: totalDiscount,
            },
          ]
        : [],
      taxRate: 0.11,
      taxAmount,
      total: grandTotal,
      paymentMethod,
      amountPaid: effectiveCash,
      change: change > 0 ? change : 0,
    };

    setCompletedReceiptData(receipt);
    setShowReceipt(true);
    clearCart();
    setCashGiven(0);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[calc(100vh-6rem)]">
      {/* Kolom Katalog POS */}
      <div className="lg:col-span-7 flex flex-col space-y-4">
        <BarcodeScanner products={products} />
        <PosCatalog
          products={filteredProducts}
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onAddToCart={(p) => addToCart(p, 1)}
          formatIDR={formatIDR}
          loading={loading}
        />
      </div>

      {/* Kolom Keranjang Kasir */}
      <div className="lg:col-span-5 flex flex-col bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden h-[calc(100vh-6rem)]">
        <PosCartItems
          cart={cart}
          clearCart={clearCart}
          updateQuantity={updateQuantity}
          formatIDR={formatIDR}
          subtotal={subtotal}
          appliedCoupon={appliedCoupon}
          applyCoupon={applyCoupon}
        />
        <PosPaymentFooter
          subtotal={subtotal}
          totalDiscount={totalDiscount}
          taxAmount={taxAmount}
          grandTotal={grandTotal}
          formatIDR={formatIDR}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          cashGiven={cashGiven}
          setCashGiven={setCashGiven}
          disabled={cart.length === 0}
          onCheckout={handleCheckout}
        />
      </div>

      {completedReceiptData && (
        <ReceiptModal
          isOpen={showReceipt}
          onClose={() => setShowReceipt(false)}
          receiptData={completedReceiptData}
        />
      )}
    </div>
  );
}
