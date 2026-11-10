import React from 'react';
import { Product } from '../../types';
import { Search, Plus, X } from 'lucide-react';

interface CatalogProps {
  products: Product[];
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  searchTerm: string;
  onSearchChange: (q: string) => void;
  onAddToCart: (p: Product) => void;
  formatIDR: (n: number) => string;
  loading: boolean;
}

export function PosCatalog({
  products,
  categories,
  selectedCategory,
  onSelectCategory,
  searchTerm,
  onSearchChange,
  onAddToCart,
  formatIDR,
  loading
}: CatalogProps) {
  return (
    <div className="flex flex-col space-y-3">
      {/* Search & Category Pills */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-sm space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari nama barang, barcode, SKU..."
            className="w-full pl-10 pr-9 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => onSelectCategory(c)}
              className={`px-3 py-1.5 rounded-xl capitalize font-semibold whitespace-nowrap transition touch-manipulation ${
                selectedCategory === c
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 active:bg-slate-300'
              }`}
            >
              {c === 'all' ? 'Semua Kategori' : c}
            </button>
          ))}
        </div>
      </div>

      {/* Catalog Grid */}
      <div className="flex-1 bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-sm overflow-y-auto max-h-[580px]">
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">Memuat katalog kasir...</div>
        ) : products.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            Barang tidak ditemukan.
            <div className="text-xs text-slate-400 mt-1">Gunakan tab "Input Manual" di atas untuk menambahkan barang baru.</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
            {products.map((p) => {
              const isOutOfStock = p.stock <= 0;
              return (
                <button
                  key={p.id}
                  disabled={isOutOfStock}
                  onClick={() => onAddToCart(p)}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition group relative select-none touch-manipulation min-h-[90px] ${
                    isOutOfStock
                      ? 'border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed'
                      : 'border-slate-200 hover:border-amber-500 hover:shadow-sm active:scale-[0.97] active:bg-amber-50/40 bg-white'
                  }`}
                >
                  <div className="w-full">
                    <div className="text-xs font-bold text-slate-800 line-clamp-2 leading-tight group-hover:text-amber-700">
                      {p.name}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 truncate">
                      SKU: {p.sku || '-'}
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between w-full">
                    <div>
                      <span className="font-extrabold text-slate-900 text-xs sm:text-sm block">
                        {formatIDR(p.price)}
                      </span>
                      <span
                        className={`text-[9px] font-semibold px-1 py-0.2 rounded ${
                          p.stock <= 5 ? 'bg-red-50 text-red-600' : 'text-slate-400'
                        }`}
                      >
                        {isOutOfStock ? 'Habis' : `Stok: ${p.stock}`}
                      </span>
                    </div>

                    {!isOutOfStock && (
                      <span className="w-6 h-6 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition">
                        <Plus className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
