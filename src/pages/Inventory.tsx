import React, { useState, useEffect, useMemo, ChangeEvent, FormEvent } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Product, ProductCategory } from '../types';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  Edit2,
  Trash2,
  UploadCloud,
  X,
  RefreshCw,
  ArrowUpDown,
  Filter,
  CheckCircle2,
  Barcode
} from 'lucide-react';

interface ProductFormData {
  name: string;
  barcode: string;
  category_id: string;
  buy_price: number;
  sell_price: number;
  stock: number;
  min_stock_alert: number;
  image_url: string;
  unit: string;
}

const INITIAL_FORM: ProductFormData = {
  name: '',
  barcode: '',
  category_id: '',
  buy_price: 0,
  sell_price: 0,
  stock: 0,
  min_stock_alert: 5,
  image_url: '',
  unit: 'pcs',
};

export default function Inventory() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'critical' | 'available'>('all');
  const [sortField, setSortField] = useState<'name' | 'stock' | 'sell_price'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(INITIAL_FORM);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [quickRestockProduct, setQuickRestockProduct] = useState<Product | null>(null);
  const [restockAmount, setRestockAmount] = useState<number>(10);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      setCategories(data || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat kategori';
      console.error(msg);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(*)')
        .order('name', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat daftar produk';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const criticalProducts = useMemo(() => {
    return products.filter((p) => Number(p.stock) <= Number(p.min_stock_alert));
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const query = searchQuery.toLowerCase();
        const matchesQuery =
          p.name.toLowerCase().includes(query) ||
          (p.barcode && p.barcode.toLowerCase().includes(query));
        const matchesCategory =
          selectedCategoryFilter === 'all' || p.category_id === selectedCategoryFilter;
        const isCritical = Number(p.stock) <= Number(p.min_stock_alert);
        const matchesStock =
          stockStatusFilter === 'all' ||
          (stockStatusFilter === 'critical' && isCritical) ||
          (stockStatusFilter === 'available' && !isCritical);

        return matchesQuery && matchesCategory && matchesStock;
      })
      .sort((a, b) => {
        let compare = 0;
        if (sortField === 'name') {
          compare = a.name.localeCompare(b.name);
        } else if (sortField === 'stock') {
          compare = Number(a.stock) - Number(b.stock);
        } else if (sortField === 'sell_price') {
          compare = Number(a.sell_price) - Number(b.sell_price);
        }
        return sortOrder === 'asc' ? compare : -compare;
      });
  }, [products, searchQuery, selectedCategoryFilter, stockStatusFilter, sortField, sortOrder]);

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData({
      ...INITIAL_FORM,
      category_id: categories.length > 0 ? categories[0].id : '',
    });
    setSelectedFile(null);
    setImagePreview(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      barcode: product.barcode || '',
      category_id: product.category_id || '',
      buy_price: Number(product.buy_price) || 0,
      sell_price: Number(product.sell_price) || 0,
      stock: Number(product.stock) || 0,
      min_stock_alert: Number(product.min_stock_alert) || 5,
      image_url: product.image_url || '',
      unit: product.unit || 'pcs',
    });
    setSelectedFile(null);
    setImagePreview(product.image_url || null);
    setIsModalOpen(true);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadProductImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `products/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, { cacheControl: '3600', upsert: true });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage.from('product-images').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMsg(null);

    try {
      let finalImageUrl = formData.image_url;

      if (selectedFile) {
        finalImageUrl = await uploadProductImage(selectedFile);
      }

      const payload = {
        name: formData.name.trim(),
        barcode: formData.barcode.trim() || null,
        category_id: formData.category_id || null,
        buy_price: formData.buy_price,
        sell_price: formData.sell_price,
        stock: formData.stock,
        min_stock_alert: formData.min_stock_alert,
        image_url: finalImageUrl,
        unit: formData.unit.trim() || 'pcs',
        updated_at: new Date().toISOString(),
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', editingProduct.id);

        if (error) throw error;
        setSuccessMsg('Produk berhasil diperbarui.');
      } else {
        const { error } = await supabase.from('products').insert([payload]);
        if (error) throw error;
        setSuccessMsg('Produk baru berhasil ditambahkan.');
      }

      setIsModalOpen(false);
      await fetchProducts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan produk';
      setErrorMsg(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    setActionLoading(true);
    setErrorMsg(null);
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      setSuccessMsg('Produk berhasil dihapus.');
      setDeleteConfirmId(null);
      await fetchProducts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghapus produk';
      setErrorMsg(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleQuickRestockSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!quickRestockProduct) return;
    setActionLoading(true);
    setErrorMsg(null);

    try {
      const newStock = Number(quickRestockProduct.stock) + Number(restockAmount);
      const { error } = await supabase
        .from('products')
        .update({ stock: newStock, updated_at: new Date().toISOString() })
        .eq('id', quickRestockProduct.id);

      if (error) throw error;

      setSuccessMsg(`Stok ${quickRestockProduct.name} bertambah ${restockAmount} ${quickRestockProduct.unit || 'pcs'}.`);
      setQuickRestockProduct(null);
      await fetchProducts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal restock produk';
      setErrorMsg(msg);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen text-slate-800">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Package className="w-7 h-7 text-indigo-600" />
              Manajemen Stok & Inventaris
            </h1>
            <p className="text-sm text-slate-500">
              Kelola katalog barang, update stok, atur harga, dan pantau batas minimum persediaan.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchProducts()}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Muat Ulang
            </button>
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              Tambah Produk
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="flex items-center justify-between p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg text-red-700">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{errorMsg}</p>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-red-500 hover:text-red-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center justify-between p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-lg text-emerald-700">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{successMsg}</p>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {criticalProducts.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2 text-amber-900 font-semibold">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                Peringatan Stok Kritis ({criticalProducts.length} Produk Butuh Restock Segera)
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {criticalProducts.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-amber-200 rounded-lg p-3 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start gap-1">
                      <p className="text-sm font-medium text-slate-900 truncate" title={item.name}>
                        {item.name}
                      </p>
                      <span className="inline-flex px-1.5 py-0.5 text-xs font-semibold rounded bg-red-100 text-red-800">
                        {item.stock} {item.unit || 'pcs'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Min Alert: {item.min_stock_alert} {item.unit || 'pcs'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setQuickRestockProduct(item);
                      setRestockAmount(10);
                    }}
                    className="mt-3 w-full py-1.5 px-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded transition text-center"
                  >
                    Restock Cepat
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari berdasarkan nama produk atau barcode..."
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="w-full py-2 px-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="all">Semua Kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={stockStatusFilter}
                onChange={(e) => setStockStatusFilter(e.target.value as 'all' | 'critical' | 'available')}
                className="w-full py-2 px-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="all">Semua Status Stok</option>
                <option value="critical">Stok Kritis / Habis</option>
                <option value="available">Stok Aman</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span>Urutkan:</span>
              <button
                onClick={() => {
                  if (sortField === 'name') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  else {
                    setSortField('name');
                    setSortOrder('asc');
                  }
                }}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded border ${
                  sortField === 'name' ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-medium' : 'border-slate-200'
                }`}
              >
                Nama
                <ArrowUpDown className="w-3 h-3" />
              </button>
              <button
                onClick={() => {
                  if (sortField === 'stock') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  else {
                    setSortField('stock');
                    setSortOrder('asc');
                  }
                }}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded border ${
                  sortField === 'stock' ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-medium' : 'border-slate-200'
                }`}
              >
                Jumlah Stok
                <ArrowUpDown className="w-3 h-3" />
              </button>
              <button
                onClick={() => {
                  if (sortField === 'sell_price') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  else {
                    setSortField('sell_price');
                    setSortOrder('asc');
                  }
                }}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded border ${
                  sortField === 'sell_price' ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-medium' : 'border-slate-200'
                }`}
              >
                Harga Jual
                <ArrowUpDown className="w-3 h-3" />
              </button>
            </div>
            <div>
              Total: <strong className="text-slate-800">{filteredProducts.length}</strong> produk
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-xs tracking-wider">
                <tr>
                  <th className="py-3 px-4">Barang</th>
                  <th className="py-3 px-4">Barcode</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4 text-right">Harga Beli</th>
                  <th className="py-3 px-4 text-right">Harga Jual</th>
                  <th className="py-3 px-4 text-center">Stok</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                      Memuat data inventaris...
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      Tidak ada produk ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const isCritical = Number(p.stock) <= Number(p.min_stock_alert);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex-shrink-0 overflow-hidden flex items-center justify-center">
                              {p.image_url ? (
                                <img
                                  src={p.image_url}
                                  alt={p.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <Package className="w-6 h-6 text-slate-400" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-slate-900 leading-snug">{p.name}</div>
                              <div className="text-xs text-slate-400 mt-0.5">Satuan: {p.unit || 'pcs'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-slate-600">
                          {p.barcode ? (
                            <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded">
                              <Barcode className="w-3.5 h-3.5" />
                              {p.barcode}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {p.categories?.name || categories.find((c) => c.id === p.category_id)?.name || '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-slate-700">
                          Rp {Number(p.buy_price || 0).toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-slate-900">
                          Rp {Number(p.sell_price || 0).toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`font-bold ${
                              isCritical ? 'text-red-600' : 'text-slate-800'
                            }`}
                          >
                            {p.stock}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isCritical ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                              <AlertTriangle className="w-3 h-3" />
                              Kritis
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                              Aman
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setQuickRestockProduct(p);
                                setRestockAmount(10);
                              }}
                              title="Restock Cepat"
                              className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(p)}
                              title="Edit Produk"
                              className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(p.id)}
                              title="Hapus Produk"
                              className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">
                {editingProduct ? 'Edit Informasi Produk' : 'Tambah Produk Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Nama Produk *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="Contoh: Kopi Susu Gula Aren 250ml"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Barcode / SKU
                  </label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="89912345678"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Kategori
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                  >
                    <option value="">-- Pilih Kategori --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Harga Beli (Modal) Rp *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.buy_price}
                    onChange={(e) => setFormData({ ...formData, buy_price: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Harga Jual Rp *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.sell_price}
                    onChange={(e) => setFormData({ ...formData, sell_price: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Stok Tersedia *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Peringatan Minimum Stok *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.min_stock_alert}
                    onChange={(e) => setFormData({ ...formData, min_stock_alert: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Satuan
                  </label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="pcs, botol, pack, kg"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Foto Produk
                  </label>
                  <div className="flex items-center gap-4 border border-dashed border-slate-300 rounded-lg p-3">
                    {imagePreview ? (
                      <div className="w-16 h-16 rounded-md bg-slate-100 overflow-hidden relative border border-slate-200 flex-shrink-0">