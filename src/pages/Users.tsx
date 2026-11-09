import React, { useState, useEffect } from 'react';
import { Users as UsersIcon, UserCheck, Shield } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface ProfileItem {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}

export default function Users() {
  const [users, setUsers] = useState<ProfileItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (data) setUsers(data as ProfileItem[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <UsersIcon className="w-5 h-5 text-blue-600" />
        <h1 className="text-xl font-bold text-slate-900">Manajemen Pengguna & Kasir</h1>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200">
        <h2 className="text-xs font-bold uppercase mb-3">Daftar Akun Kasir & Admin</h2>
        {loading ? (
          <div className="text-xs text-slate-400 py-6 text-center">Memuat pengguna...</div>
        ) : users.length === 0 ? (
          <div className="text-xs text-slate-400 py-6 text-center">Belum ada akun terdaftar di Supabase database. Gunakan mode demo atau daftarkan akun baru di menu Login.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {users.map((u) => (
              <div key={u.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-900">{u.full_name || 'Tanpa Nama'}</div>
                  <div className="text-[11px] text-slate-500">{u.email}</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    u.role === 'owner' || u.role === 'admin'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}>
                    {u.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
