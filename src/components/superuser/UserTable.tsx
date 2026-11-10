import React from 'react';
import { Clock, Edit2, Trash2, Mail } from 'lucide-react';
import { RegisteredAccount, SUPER_USER_ACCOUNT } from '../../lib/authStore';

interface TableProps {
  accounts: RegisteredAccount[];
  onEdit: (acc: RegisteredAccount) => void;
  onDelete: (acc: RegisteredAccount) => void;
  onToggle: (acc: RegisteredAccount) => void;
}

export const UserTable: React.FC<TableProps> = ({ accounts, onEdit, onDelete, onToggle }) => {
  const isOnline = (dt?: string) => Boolean(dt && Date.now() - new Date(dt).getTime() < 30 * 60 * 1000);

  const formatActivity = (dt?: string) => {
    if (!dt) return 'Belum pernah aktif';
    const min = Math.floor((Date.now() - new Date(dt).getTime()) / 60000);
    if (min < 1) return 'Baru saja aktif';
    if (min < 60) return `${min} menit yang lalu`;
    return new Date(dt).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-white rounded-2xl border overflow-hidden text-xs">
      <table className="w-full text-left">
        <thead className="bg-slate-50 border-b text-[10px] font-bold uppercase text-slate-600">
          <tr>
            <th className="py-2.5 px-3">Pengguna</th>
            <th className="py-2.5 px-3">Toko</th>
            <th className="py-2.5 px-3">Peran</th>
            <th className="py-2.5 px-3">Status Aktivitas</th>
            <th className="py-2.5 px-3 text-center">Status</th>
            <th className="py-2.5 px-3 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {accounts.map((acc) => {
            const online = isOnline(acc.last_activity_at);
            const isSuper = acc.email.toLowerCase() === SUPER_USER_ACCOUNT.email.toLowerCase();
            return (
              <tr key={acc.id} className="hover:bg-slate-50/60">
                <td className="py-2.5 px-3">
                  <div className="font-extrabold flex items-center gap-1">
                    {acc.full_name || 'Tanpa Nama'} {isSuper && <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1 rounded font-black">SUPER</span>}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1"><Mail className="w-3 h-3" /> {acc.email}</div>
                </td>
                <td className="py-2.5 px-3">
                  <div>{acc.store_name || '-'}</div>
                  <div className="text-[11px] text-slate-400">{acc.phone || '-'}</div>
                </td>
                <td className="py-2.5 px-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border bg-slate-100">{acc.role}</span>
                </td>
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-1 font-bold">
                    <span className={`w-2 h-2 rounded-full ${online ? 'bg-amber-500 animate-pulse' : 'bg-slate-300'}`}></span>
                    <span className={online ? 'text-amber-700' : 'text-slate-500'}>{online ? 'Aktif Online' : 'Inaktif'}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3" /> {formatActivity(acc.last_activity_at)}</div>
                </td>
                <td className="py-2.5 px-3 text-center">
                  <button onClick={() => onToggle(acc)} disabled={isSuper} className={`px-2 py-0.5 rounded text-[10px] font-bold border ${acc.is_active === false ? 'bg-red-50 text-red-600 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'} ${isSuper ? 'opacity-50' : ''}`}>
                    {acc.is_active === false ? 'Nonaktif' : 'Aktif'}
                  </button>
                </td>
                <td className="py-2.5 px-3 text-right">
                  <div className="inline-flex gap-1">
                    <button onClick={() => onEdit(acc)} className="p-1 border rounded hover:bg-slate-100"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => onDelete(acc)} disabled={isSuper} className={`p-1 border rounded hover:bg-red-50 text-red-600 ${isSuper ? 'opacity-30' : ''}`}><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
