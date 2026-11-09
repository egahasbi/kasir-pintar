import React, { useState, useEffect } from 'react';
import { Tag, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface DiscountItem {
  id: string;
  name: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  min_order_amount: number;
}

export default function Discounts() {
  const [discounts, setDiscounts] = useState<DiscountItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [type, setType] = useState<'percentage' | 'fixed'>('percentage');
  const [value, setValue] = useState<number | ''>('');
  const [minOrder, setMinOrder] = useState<number | ''>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchDiscounts = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('discounts').select('*').order('created_at', { ascending: false });
      if (data) setDiscounts(data as DiscountItem[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!name.trim() || !code.trim() || !value) {
      return setErrorMsg('Nama, kode, dan nilai wajib diisi.');
    }

    try {
      const { error } = await supabase.from('discounts').insert({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        type,
        value: Number(value),
        min_order_amount: Number(minOrder || 0),
        is_active: true,
      });

      if (error) throw error;
      setName('');
      setCode('');
      setValue('');
      setMinOrder('');
      fetchDiscounts();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menambahkan kupon.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus kupon ini?')) {
      await supabase.from('discounts').delete().eq('id', id);
      fetchDiscounts();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <Tag className="w-5 h-5 text-purple-600" />
        <h1 className="text-xl font-bold text-slate-900">Manajemen Kupon & Diskon</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <h2 className="text-xs font-bold uppercase mb-2">Buat Kupon</h2>
          {errorMsg && <div className="p-2 bg-red-50 text-red-700 text-xs rounded mb-2">{errorMsg}</div>}
          <form onSubmit={handleCreate} className="space-y-2 text-xs">
            <div>
              <label className="block mb-0.5">Nama Promo</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full p-1.5 border rounded" />
            </div>
            <div>
              <label className="block mb-0.5">Kode Kupon</label>
              <input type="text" required value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className="w-full p-1.5 border rounded font-mono uppercase" />
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <label className="block mb-0.5">Tipe</label>
                <select value={type} onChange={(e) => setType(e.target.value as any)} className="w-full p-1.5 border rounded bg-white">
                  <option value="percentage">Persen (%)</option>
                  <option value="fixed">Nominal (Rp)</option>
                </select>
              </div>
              <div>
                <label className="block mb-0.5">Nilai</label>
                <input type="number" required min="1" value={value} onChange={(e) => setValue(Number(e.target.value))} className="w-full p-1.5 border rounded" />
              </div>
            </div>
            <div>
              <label className="block mb-0.5">Min. Belanja</label>
              <input type="number" min="0" value={minOrder} onChange={(e) => setMinOrder(e.target.value === '' ? '' : Number(e.target.value))} className="w-full p-1.5 border rounded" />
            </div>
            <button type="submit" className="w-full py-2 bg-purple-600 text-white font-bold rounded flex items-center justify-center gap-1">
              <Plus className="w-4 h-4" /> Simpan Kupon
            </button>
          </form>
        </div>

        <div className="md:col-span-2 bg-white p-4 rounded-xl border border-slate-200 space-y-2">
          <h2 className="text-xs font-bold uppercase mb-2">Daftar Kupon Aktif</h2>
          {loading ? (
            <div className="text-xs text-slate-400 py-6 text-center">Memuat...</div>
          ) : discounts.length === 0 ? (
            <div className="text-xs text-slate-400 py-6 text-center">Belum ada kupon.</div>
          ) : (
            discounts.map((d) => (
              <div key={d.id} className="p-2.5 border rounded-lg flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold">{d.name}</span> <span className="font-mono px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded border">{d.code}</span>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {d.type === 'percentage' ? `${d.value}% OFF` : `Rp ${Number(d.value).toLocaleString('id-ID')} OFF`} • Min. Rp {Number(d.min_order_amount || 0).toLocaleString('id-ID')}
                  </div>
                </div>
                <button onClick={() => handleDelete(d.id)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
