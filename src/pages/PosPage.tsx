import React, { useState, useEffect } from 'react';
import { ShoppingCart, LayoutGrid, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { BarcodeScanner } from '../components/pos/BarcodeScanner';
import { PosCatalog } from '../components/pos/PosCatalog';
import { PosCartItems } from '../components/pos/PosCartItems';
import { PosPaymentFooter } from '../components/pos/PosPaymentFooter';
import { ReceiptModal, ReceiptData } from '../components/pos/ReceiptModal';
import { Product } from '../types';

export default function PosPage() {
  const { profile, user } = useAuth();
  const { settings } = useStore();
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
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Mobile View Toggle: 'catalog' | 'cart' (#3 Mobile friendly)
  const [mobileTab, setMobileTab] = useState<'catalog' | 'cart'>('catalog');

  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QRIS' | 'DEBIT'>('CASH');
  const [cashGiven, setCashGiven] = useState<number>(0);
  const [showReceipt, setShowReceipt] = useState(false);
  const [completedReceiptData, setCompletedReceiptData] = useState<ReceiptData | null>(null);

  const totalCartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

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

  const handleCheckout = async () => {
    if (cart.length === 0 || isProcessingCheckout) return;

    setIsProcessingCheckout(true);

    const invoiceNum = `INV-${Date.now().toString().slice(-6)}`;
    const effectiveCash = paymentMethod === 'CASH' ? Math.max(cashGiven, grandTotal) : grandTotal;
    const change = effectiveCash - grandTotal;

    const receipt: ReceiptData = {
      transactionId: `tx-${Date.now()}`,
      invoiceNumber: invoiceNum,
      timestamp: new Date().toISOString(),
      cashierName: profile?.full_name || 'Kasir Toko',
      storeName: settings.store_name,
      storeAddress: settings.store_address,
      storePhone: settings.store_phone,
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
      taxRate: settings.tax_rate,
      taxAmount,
      total: grandTotal,
      paymentMethod,
      amountPaid: effectiveCash,
      change: change > 0 ? change : 0,
    };

    try {
      // 1. Simpan Transaksi ke Supabase (Database riil)
      const mappedMethod = paymentMethod.toLowerCase();
      const cashierUuid = user?.id || profile?.id;

      // Filter: hanya item ber-UUID asli yang link ke DB products
      const isUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

      const { data: createdTx, error: txErr } = await supabase
        .from('transactions')
        .insert({
          invoice_number: invoiceNum,
          cashier_id: cashierUuid && isUuid(cashierUuid) ? cashierUuid : null,
          total_amount: subtotal,
          tax_amount: taxAmount,
          discount_amount: totalDiscount,
          final_amount: grandTotal,
          payment_method: mappedMethod,
          payment_status: 'completed',
          amount_paid: effectiveCash,
          change_given: change > 0 ? change : 0,
        })
        .select()
        .single();

      if (!txErr && createdTx) {
        receipt.transactionId = createdTx.id;

        // 2. Insert transaction items
        const validDbItems = cart.filter((i) => isUuid(i.product.id));
        if (validDbItems.length > 0) {
          const itemsPayload = validDbItems.map((i) => ({
            transaction_id: createdTx.id,
            product_id: i.product.id,
            quantity: i.quantity,
            unit_cost: i.product.cost_price || 0,
            unit_price: i.product.price,
            subtotal: i.product.price * i.quantity,
          }));

          await supabase.from('transaction_items').insert(itemsPayload);

          // 3. Kurangi stok produk langsung di tabel products
          for (const item of validDbItems) {
            const nextStock = Math.max(0, item.product.stock - item.quantity);
            await supabase
              .from('products')
              .update({ stock: nextStock, updated_at: new Date().toISOString() })
              .eq('id', item.product.id);
          }
        }
      }
    } catch (err) {
      console.warn('DB transaction sync warning:', err);
    } finally {
      setIsProcessingCheckout(false);
      setCompletedReceiptData(receipt);
      setShowReceipt(true);
      clearCart();
      setCashGiven(0);
      fetchProducts(); // Refresh stok produk lokal
    }
  };

  return (
    <div className="flex flex-col space-y-3 pb-20 lg:pb-0">
      {/* Mobile Segmented Nav (Hanya di layar HP / < lg) */}
      <div className="lg:hidden flex bg-white p-1 rounded-2xl border border-slate-200 shadow-xs">
        <button
          type="button"
          onClick={() => setMobileTab('catalog')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
            mobileTab === 'catalog'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          <span>Katalog & Scan</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab('cart')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition relative ${
            mobileTab === 'cart'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Keranjang</span>
          {totalCartItemsCount > 0 && (
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                mobileTab === 'cart' ? 'bg-white text-emerald-700' : 'bg-emerald-600 text-white'
              }`}
            >
              {totalCartItemsCount}
            </span>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[calc(100vh-7rem)]">
        {/* Kolom Katalog POS (Desktop selalu tampil, Mobile sesuai tab) */}
        <div
          className={`lg:col-span-7 flex flex-col space-y-3.5 ${
            mobileTab === 'catalog' ? 'block' : 'hidden lg:flex'
          }`}
        >
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

        {/* Kolom Keranjang Kasir (Desktop selalu tampil, Mobile sesuai tab) */}
        <div
          className={`lg:col-span-5 flex flex-col bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden lg:h-[calc(100vh-7rem)] ${
            mobileTab === 'cart' ? 'block' : 'hidden lg:flex'
          }`}
        >
          {/* Mobile Back Button to Catalog */}
          <div className="lg:hidden p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setMobileTab('catalog')}
              className="text-xs font-semibold text-emerald-700 flex items-center gap-1 hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Tambah Barang Lainnya</span>
            </button>
            <span className="text-xs font-bold text-slate-500">
              {totalCartItemsCount} Item
            </span>
          </div>

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
            disabled={cart.length === 0 || isProcessingCheckout}
            onCheckout={handleCheckout}
          />
        </div>
      </div>

      {/* Floating Checkout Bar for Mobile when browsing catalog */}
      {mobileTab === 'catalog' && totalCartItemsCount > 0 && (
        <div className="lg:hidden fixed bottom-3 left-3 right-3 z-30">
          <button
            type="button"
            onClick={() => setMobileTab('cart')}
            className="w-full bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl flex items-center justify-between border border-slate-800 active:scale-[0.98] transition"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-xs">
                {totalCartItemsCount}
              </div>
              <div className="text-left">
                <div className="text-[11px] text-slate-300">Total Belanja</div>
                <div className="font-extrabold text-sm text-emerald-400">{formatIDR(grandTotal)}</div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold bg-emerald-600 px-3 py-2 rounded-xl">
              <span>Buka Keranjang</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>
        </div>
      )}

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
