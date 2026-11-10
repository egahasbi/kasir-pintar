import React from 'react';
import { ShieldAlert, Users, UserPlus, RefreshCw } from 'lucide-react';

interface HeaderProps {
  total: number;
  activeOnline: number;
  onAdd: () => void;
  onRefresh: () => void;
  isSuperAdmin?: boolean;
}

export const UserStatsHeader: React.FC<HeaderProps> = ({ total, activeOnline, onAdd, onRefresh, isSuperAdmin = false }) => {
  return (
    <div className="space-y-4">
      <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-5 rounded-2xl text-white shadow-lg ${
        isSuperAdmin
          ? 'bg-gradient-to-r from-slate-900 to-indigo-950'
          : 'bg-gradient-to-r from-slate-900 to-amber-950'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
            {isSuperAdmin ? <ShieldAlert className="w-5 h-5 text-indigo-400" /> : <Users className="w-5 h-5 text-amber-400" />}
          </div>
          <div>
            <div className="inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase bg-white/15 text-white/90">
              {isSuperAdmin ? 'Super User Panel' : 'Panel Manajemen Toko'}
            </div>
            <h1 className="text-lg font-black">
              {isSuperAdmin ? 'Manajemen & Pemantauan Akun Platform' : 'Manajemen Kasir Toko'}
            </h1>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={onAdd} className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 rounded-xl text-xs font-bold flex items-center gap-1 shadow">
            <UserPlus className="w-3.5 h-3.5" />
            <span>{isSuperAdmin ? 'Tambah Pengguna' : 'Tambah Kasir'}</span>
          </button>
          <button onClick={onRefresh} className="p-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-white text-xs">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-3 rounded-xl border text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase">{isSuperAdmin ? 'Total Akun' : 'Total Kasir'}</span>
          <div className="text-xl font-black text-slate-900">{total}</div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-amber-200 bg-amber-50/30 text-center">
          <span className="text-[10px] font-bold text-amber-700 uppercase">Aktif Online</span>
          <div className="text-xl font-black text-amber-700">{activeOnline}</div>
        </div>
        <div className="bg-white p-3 rounded-xl border text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Inaktif</span>
          <div className="text-xl font-black text-slate-500">{total - activeOnline}</div>
        </div>
      </div>
    </div>
  );
};
