import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Product } from '../../types';
import { upsertProduct } from '../../lib/productStore';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  onSaved: () => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  product,
  onSaved,
}) => {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [sellingPrice, setSellingPrice] = useState<number | ''>('');
  const [stock, setStock] = useState<number | ''>('');
  const [minStockAlert, setMinStockAlert] = useState<number | ''>(5);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (product) {
        setName(product.name || '');
        setSku(product.sku || '');
        setBarcode(product.barcode || '');
        setCostPrice(product.cost_price ?? '');
        setSellingPrice(product.price ?? product.selling_price ?? '');
        setStock(product.stock ?? '');
        setMinStockAlert(product.min_stock_alert ?? 5);
      } else {
        setName('');
        setSku(`SKU-${Date.now().toString().slice(-5)}`);
        setBarcode('');
        setCostPrice('');
        setSellingPrice('');
        setStock(10);
        setMinStockAlert(5);
      }
      setErrorMsg(null);
    }
  }, [isOpen, product]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // #12 BUG: User-friendly error message
    if (!name.trim()) {
      return setErrorMsg('Nama produk wajib diisi.');
    }
    const priceNum = Number(sellingPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      return setErrorMsg('Harga jual harus lebih besar dari Rp 0.');
    }
    const costNum = Number(costPrice || 0);
    if (costNum < 0) {
      return setErrorMsg('Harga modal tidak boleh kurang dari Rp 0.');
    }

    setLoading(true);
    try {
      // #4 & #13 BUG: Gunakan upsertProduct (tersimpan lokal + sync cloud)
      await upsertProduct({
        id: product?.id,
        name: name.trim(),
        sku: sku.trim() || `SKU-${Date.now().toString().slice(-5)}`,
        barcode: barcode.trim() || null,
        cost_price: costNum,
        selling_price: priceNum,
        price: priceNum,
        stock: Number(stock || 0),
        min_stock_alert: Number(minStockAlert || 5),
        is_active: true,
      });

      onSaved();
      onClose();
    } catch {
      setErrorMsg('Terjadi kendala saat menyimpan produk. Silakan periksa kembali data Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50">
          <h3 className="text-xs font-bold text-slate-800">{product ? 'Edit Produk' : 'Tambah Produk'}</h3>
          <button type="button" onClick={onClose}><X className="w-4 h-4 text-slate-400" /></button>
        </div>
        {errorMsg && <div className="p-2 text-xs text-red-600 bg-red-50 m-2 rounded">{errorMsg}</div>}
        <form onSubmit={handleSubmit} className="p-3 space-y-2 text-xs">
          <div>
            <label className="font-semibold block mb-0.5">Nama *</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full p-1.5 border rounded" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="block mb-0.5">SKU</label><input type="text" value={sku} onChange={(e) => setSku(e.target.value)} className="w-full p-1.5 border rounded" /></div>
            <div><label className="block mb-0.5">Barcode</label><input type="text" value={barcode} onChange={(e) => setBarcode(e.target.value)} className="w-full p-1.5 border rounded" /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="block mb-0.5">Modal</label><input type="number" min="0" value={costPrice} onChange={(e) => setCostPrice(e.target.value === '' ? '' : Number(e.target.value))} className="w-full p-1.5 border rounded" /></div>
            <div><label className="block mb-0.5 font-bold text-amber-700">Jual *</label><input type="number" required min="1" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value === '' ? '' : Number(e.target.value))} className="w-full p-1.5 border rounded font-bold text-amber-700" /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="block mb-0.5">Stok</label><input type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value === '' ? '' : Number(e.target.value))} className="w-full p-1.5 border rounded" /></div>
            <div><label className="block mb-0.5">Min Alert</label><input type="number" min="0" value={minStockAlert} onChange={(e) => setMinStockAlert(e.target.value === '' ? '' : Number(e.target.value))} className="w-full p-1.5 border rounded" /></div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <button type="button" onClick={onClose} className="px-3 py-1 border rounded">Batal</button>
            <button type="submit" disabled={loading} className="px-3 py-1 bg-amber-600 text-white rounded font-bold">{loading ? 'Simpan...' : 'Simpan'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default ProductFormModal;
