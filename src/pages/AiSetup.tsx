import React, { useState } from 'react';
import { Bot, Save, CheckCircle, Cpu, Sliders } from 'lucide-react';

export default function AiSetup() {
  const [model, setModel] = useState<'gpt-4o-mini' | 'gpt-4o'>('gpt-4o-mini');
  const [temperature, setTemperature] = useState<number>(0.4);
  const [storePersonality, setStorePersonality] = useState<string>(
    'Ramah, solutif, proaktif memberi saran restock dan promosi diskon UMKM.'
  );
  const [restockSafetyMarginDays, setRestockSafetyMarginDays] = useState<number>(7);
  const [marginTargetPercent, setMarginTargetPercent] = useState<number>(25);
  const [autoPricingEnabled, setAutoPricingEnabled] = useState<boolean>(true);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const config = {
      model,
      temperature,
      storePersonality,
      restockSafetyMarginDays,
      marginTargetPercent,
      autoPricingEnabled,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem('kasir_pintar_ai_config', JSON.stringify(config));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Bot className="w-6 h-6" />
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Setup Mesin AI POS</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Konfigurasi parameter OpenAI, instruksi asisten toko, dan ambang batas saran harga.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 shadow-sm transition"
        >
          <Save className="w-4 h-4" />
          Simpan Konfigurasi
        </button>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          Konfigurasi sistem AI berhasil disimpan.
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Cpu className="w-5 h-5 text-indigo-600" />
            <h2 className="font-bold text-slate-900 text-base">Model & Intelegensi</h2>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
              Pilihan Model LLM
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value as any)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
            >
              <option value="gpt-4o-mini">GPT-4o Mini (Cepat & Hemat Token)</option>
              <option value="gpt-4o">GPT-4o (Akurasi Tinggi)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide block mb-1.5">
              Temperature ({temperature})
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-amber-600 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
              System Prompt Toko
            </label>
            <textarea
              rows={4}
              value={storePersonality}
              onChange={(e) => setStorePersonality(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Sliders className="w-5 h-5 text-amber-600" />
            <h2 className="font-bold text-slate-900 text-base">Aturan Inventori & Margin</h2>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
              Buffer Restock Otomatis (Hari)
            </label>
            <input
              type="number"
              min="1"
              max="30"
              value={restockSafetyMarginDays}
              onChange={(e) => setRestockSafetyMarginDays(parseInt(e.target.value) || 1)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
              Target Margin Keuntungan (%)
            </label>
            <input
              type="number"
              min="5"
              max="100"
              value={marginTargetPercent}
              onChange={(e) => setMarginTargetPercent(parseInt(e.target.value) || 5)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={autoPricingEnabled}
                onChange={(e) => setAutoPricingEnabled(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
              />
              <span className="text-sm font-semibold text-slate-800">Aktifkan Rekomendasi Bundling Otomatis</span>
            </label>
          </div>
        </div>
      </form>
    </div>
  );
}
