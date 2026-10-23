import React, { useState } from 'react';
import { Product } from '../../types';
import { Search } from 'lucide-react';

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
    <div className="flex flex-col space-y-4">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari menu, SKU, atau barcode..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => onSelectCategory(c)}
              className={`px-3 py-1.5 rounded-lg capitalize font-medium whitespace-nowrap transition ${
                selectedCategory === c
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 bg-white p-4 rounded-xl border border-slate-200 shadow-sm overflow-y-auto max-h-[580px]">
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">Memuat katalog kasir...</div>
        ) : products.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">Barang tidak ditemukan.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {products.map((p) => {
              const isOutOfStock = p.stock <= 0;
              return (
                <button
                  key={p.id}
                  disabled={isOutOfStock}
                  onClick={() => onAddToCart(p)}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition group relative ${
                    isOutOfStock
                      ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                      : 'border-slate-200 hover:border-emerald-500 hover:shadow-sm bg-white'
                  }`}
                >
                  <div>
                    <div className="text-xs font-semibold text-slate-800 line-clamp-1 group-hover:text-emerald-600">
                      {p.name}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">SKU: {p.sku || '-'}</div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs">{formatIDR(p.price)}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        p.stock <= 5 ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      Sisa {p.stock}
                    </span>
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
