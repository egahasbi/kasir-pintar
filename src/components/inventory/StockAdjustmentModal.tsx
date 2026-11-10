import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { Product } from '../../types';
import { upsertProduct } from '../../lib/productStore';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onSaved: () => void;
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  onClose,
  product,
  onSaved,
}) => {
  const [newStock, setNewStock] = useState<number | ''>('');
  const [reason, setReason] = useState('Koreksi Hitung (Stock Opname)');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !product) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newStock === '' || Number(newStock) < 0) return;

    setLoading(true);
    try {
      const targetStock = Number(newStock);
      await upsertProduct({
        ...product,
        stock: targetStock,
      });

      onSaved();
      onClose();
    } catch {
      alert('Gagal memperbarui stok. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden text-xs">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50">
          <h3 className="font-bold text-slate-800">Koreksi Stok (Stock Opname)</h3>
          <button type="button" onClick={onClose}><X className="w-4 h-4 text-slate-400" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div>
            <div className="text-[11px] text-slate-500">Nama Produk:</div>
            <div className="font-bold text-slate-900 text-sm">{product.name}</div>
            <div className="text-[11px] text-slate-400">Stok Saat Ini: <strong className="text-slate-800">{product.stock} pcs</strong></div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Stok Fisik Baru (Hasil Opname) *</label>
            <input
              type="number"
              min="0"
              required
              value={newStock}
              onChange={(e) => setNewStock(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="Masukkan jumlah fisik..."
              className="w-full p-2 border rounded-lg text-sm font-bold text-emerald-700"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Alasan Penyesuaian</label>
            <select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full p-2 border rounded-lg bg-white">
              <option value="Koreksi Hitung (Stock Opname)">Koreksi Hitung (Stock Opname)</option>
              <option value="Barang Rusak / Kadaluarsa">Barang Rusak / Kadaluarsa</option>
              <option value="Barang Hilang / Selisih">Barang Hilang / Selisih</option>
              <option value="Restock Tambahan">Restock Tambahan</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button type="button" onClick={onClose} className="px-3 py-1.5 border rounded-lg">Batal</button>
            <button type="submit" disabled={loading} className="px-3 py-1.5 bg-emerald-600 text-white font-bold rounded-lg flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> <span>{loading ? 'Menyimpan...' : 'Perbarui Stok'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default StockAdjustmentModal;
