import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AlertTriangle,
  RefreshCw,
  Search,
  Plus,
  Package,
  Clock,
  ArrowUpDown,
  CheckCircle,
  XCircle,
  Truck,
  Edit2,
  Trash2
} from 'lucide-react';
import { supabase } from '../config/supabase';
import { Product } from '../types';
import ProductFormModal from '../components/inventory/ProductFormModal';

interface InventoryItem extends Product {
  daily_sales_velocity?: number;
  days_until_depletion?: number;
}

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [reorderAmountMap, setReorderAmountMap] = useState<Record<string, number>>({});
  const [isSubmittingReorder, setIsSubmittingReorder] = useState<boolean>(false);
  const [reorderStatusMsg, setReorderStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modal State (#7 & #8 CRUD Produk)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      const { data: products, error: prodErr } = await supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true });

      if (prodErr) throw prodErr;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: sales, error: salesErr } = await supabase
        .from('transaction_items')
        .select('product_id, quantity, created_at')
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (salesErr) throw salesErr;

      const salesMap = (sales || []).reduce((acc: Record<string, number>, curr) => {
        acc[curr.product_id] = (acc[curr.product_id] || 0) + curr.quantity;
        return acc;
      }, {});

      const enriched: InventoryItem[] = (products || []).map((item) => {
        const soldLast30Days = salesMap[item.id] || 0;
        const dailyVelocity = soldLast30Days > 0 ? soldLast30Days / 30 : 0.1;
        const daysUntilDepletion = dailyVelocity > 0 ? Math.floor(item.stock / dailyVelocity) : 999;

        return {
          ...item,
          daily_sales_velocity: Number(dailyVelocity.toFixed(2)),
          days_until_depletion: daysUntilDepletion
        };
      });

      setItems(enriched);

      const defaultAmounts: Record<string, number> = {};
      enriched.forEach((p) => {
        const targetRestock = Math.max((p.min_stock || 10) * 2 - p.stock, 10);
        defaultAmounts[p.id] = targetRestock;
      });
      setReorderAmountMap(defaultAmounts);
    } catch (err: any) {
      console.error('Inventory fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => {
          fetchInventory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchInventory]);

  const categories = useMemo(() => {
    const cats = new Set(
      items
        .map((i) => (typeof i.category === 'object' && i.category ? (i.category as any).name : i.category))
        .filter(Boolean) as string[]
    );
    return ['all', ...Array.from(cats)];
  }, [items]);

  const lowStockItems = useMemo(() => {
    return items.filter((item) => item.stock <= (item.min_stock || 5));
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [items, searchTerm, selectedCategory]);

  const toggleSelectItem = (id: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAllLowStock = () => {
    const lowIds = lowStockItems.map((i) => i.id);
    setSelectedItems(new Set(lowIds));
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
  };

  const handleAmountChange = (productId: string, val: number) => {
    setReorderAmountMap((prev) => ({
      ...prev,
      [productId]: Math.max(1, val)
    }));
  };

  const executeBatchReorder = async () => {
    if (selectedItems.size === 0) return;

    try {
      setIsSubmittingReorder(true);
      setReorderStatusMsg(null);

      const payload = Array.from(selectedItems).map((id) => {
        const product = items.find((p) => p.id === id);
        return {
          product_id: id,
          current_stock: product?.stock || 0,
          quantity_ordered: reorderAmountMap[id] || 10,
          cost_price: product?.cost_price || 0,
          status: 'ordered',
          created_at: new Date().toISOString()
        };
      });

      const { error: poError } = await supabase.from('purchase_orders').insert(payload);

      if (poError) {
        for (const item of payload) {
          const currentProd = items.find((p) => p.id === item.product_id);
          const newStock = (currentProd?.stock || 0) + item.quantity_ordered;
          await supabase.from('products').update({ stock: newStock }).eq('id', item.product_id);
        }
      }

      setReorderStatusMsg({
        text: `Restock request logged for ${selectedItems.size} items.`,
        type: 'success'
      });
      setSelectedItems(new Set());
      await fetchInventory();
    } catch (err: any) {
      setReorderStatusMsg({
        text: `Restock failed: ${err.message}`,
        type: 'error'
      });
    } finally {
      setIsSubmittingReorder(false);
      setTimeout(() => setReorderStatusMsg(null), 5000);
    }
  };

  const getDepletionBadge = (days: number | undefined) => {
    if (days === undefined) return null;
    if (days <= 2) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200 animate-pulse">
          <Clock className="w-3 h-3 text-red-600" />
          {days === 0 ? 'Out of stock' : `${days}d left`}
        </span>
      );
    }
    if (days <= 7) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
          <Clock className="w-3 h-3 text-amber-600" />
          {days}d left
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
        <Clock className="w-3 h-3 text-emerald-500" />
        {days > 90 ? '>90d safe' : `${days}d safe`}
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Inventory Management</h1>
          <p className="text-sm text-slate-500">Real-time depletion alerts and automated stock controls.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditingProduct(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-600 text-sm font-bold text-white hover:bg-emerald-700 transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Tambah Produk
          </button>
          <button
            onClick={() => fetchInventory()}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Sync Stock
          </button>
        </div>
      </div>

      {reorderStatusMsg && (
        <div
          className={`flex items-center gap-2 p-4 rounded-lg border text-sm ${
            reorderStatusMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {reorderStatusMsg.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{reorderStatusMsg.text}</span>
        </div>
      )}

      {lowStockItems.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50/70 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-red-950">
                  Critical Low Stock: {lowStockItems.length} Products Require Immediate Action
                </h3>
                <p className="text-xs text-red-700">Stock levels below configured safety minimums.</p>
              </div>
            </div>
            <button
              onClick={selectAllLowStock}
              className="text-xs font-semibold px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md transition shadow-sm"
            >
              Select All Low Stock
            </button>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {lowStockItems.slice(0, 8).map((p) => (
              <span
                key={p.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-red-200 rounded-md text-xs font-medium text-slate-800 shadow-2xs"
              >
                <Package className="w-3.5 h-3.5 text-red-500" />
                {p.name}
                <strong className="text-red-600 font-bold">({p.stock} units)</strong>
              </span>
            ))}
            {lowStockItems.length > 8 && (
              <span className="text-xs text-red-800 font-medium self-center">
                +{lowStockItems.length - 8} more
              </span>
            )}
          </div>
        </div>
      )}

      {selectedItems.size > 0 && (
        <div className="sticky top-4 z-20 flex items-center justify-between px-4 py-3 bg-slate-900 text-white rounded-xl shadow-lg border border-slate-800">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-xs font-bold">
              {selectedItems.size}
            </span>
            <span className="text-sm font-medium">Selected for batch restock procurement</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={clearSelection}
              className="text-xs text-slate-300 hover:text-white underline font-medium"
            >
              Clear
            </button>
            <button
              disabled={isSubmittingReorder}
              onClick={executeBatchReorder}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition shadow-sm disabled:opacity-50"
            >
              <Truck className="w-4 h-4" />
              {isSubmittingReorder ? 'Processing...' : 'Trigger Batch Reorder'}
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, SKU, barcode..."
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize whitespace-nowrap transition ${
                selectedCategory === c
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4 w-12 text-center">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    checked={filteredItems.length > 0 && selectedItems.size === filteredItems.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItems(new Set(filteredItems.map((i) => i.id)));
                      } else {
                        clearSelection();
                      }
                    }}
                  />
                </th>
                <th className="py-3 px-4">Item Details</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Inventory Units</th>
                <th className="py-3 px-4">Velocity (30d)</th>
                <th className="py-3 px-4">Depletion Runway</th>
                <th className="py-3 px-4 text-right">Batch Order Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-400" />
                    Calculating inventory runtimes...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No inventory records match filters.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isLow = item.stock <= (item.min_stock || 5);
                  const isChecked = selectedItems.has(item.id);
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/70 transition-colors ${isChecked ? 'bg-blue-50/40' : ''}`}
                    >
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          checked={isChecked}
                          onChange={() => toggleSelectItem(item.id)}
                        />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{item.name}</div>
                        <div className="text-xs text-slate-400">
                          SKU: {item.sku || 'N/A'} • Barcode: {item.barcode}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 capitalize">
                        {typeof item.category === 'object' && item.category
                          ? (item.category as any).name
                          : item.category || 'Standard'}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-semibold ${
                              isLow ? 'text-red-600 font-bold' : 'text-slate-800'
                            }`}
                          >
                            {item.stock}
                          </span>
                          <span className="text-xs text-slate-400">/ min {item.min_stock || 5}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {item.daily_sales_velocity} units/day
                      </td>
                      <td className="py-3.5 px-4">
                        {getDepletionBadge(item.days_until_depletion)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            onClick={() => {
                              setEditingProduct(item);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 hover:text-emerald-600 transition"
                            title="Edit Produk"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={async () => {
                              if (confirm(`Hapus produk "${item.name}"?`)) {
                                await supabase.from('products').delete().eq('id', item.id);
                                fetchInventory();
                              }
                            }}
                            className="p-1.5 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-600 transition"
                            title="Hapus Produk"
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

      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={editingProduct}
        onSaved={fetchInventory}
      />
    </div>
  );
}