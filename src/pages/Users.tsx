import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import {
  getRegisteredUsers,
  saveRegisteredUser,
  updateUserAccount,
  deleteUserAccount,
  RegisteredAccount,
  SUPER_USER_ACCOUNT,
} from '../lib/authStore';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { UserAccountModal } from '../components/superuser/UserAccountModal';
import { UserTable } from '../components/superuser/UserTable';
import { UserStatsHeader } from '../components/superuser/UserStatsHeader';

export default function Users() {
  const { isSuperAdmin, profile } = useAuth();
  const { settings } = useStore();
  const [accounts, setAccounts] = useState<RegisteredAccount[]>([]);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [isOpen, setIsOpen] = useState(false);
  const [editingAcc, setEditingAcc] = useState<RegisteredAccount | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => setAccounts([...getRegisteredUsers()]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  const adminStore = settings.store_name || profile?.store_id || 'Toko Saya';
  const adminId = profile?.id || '';

  const handleSave = (data: any) => {
    setError(null);
    const email = data.email.trim().toLowerCase();
    if (!email.includes('@')) return setError('Format email tidak valid.');
    if (data.password.length < 4) return setError('Kata sandi minimal 4 karakter.');

    const targetRole = isSuperAdmin ? data.role : 'cashier';
    const targetStore = isSuperAdmin ? (data.storeName.trim() || 'Toko') : adminStore;

    if (editingAcc) {
      updateUserAccount(editingAcc.id, {
        full_name: data.fullName.trim(),
        email,
        password: data.password.trim(),
        role: targetRole,
        store_name: targetStore,
        phone: data.phone.trim(),
        is_active: data.isActive,
      });
    } else {
      if (accounts.some((a) => a.email.toLowerCase() === email)) {
        return setError('Email ini sudah terdaftar.');
      }
      saveRegisteredUser({
        id: `user-${Date.now()}`,
        full_name: data.fullName.trim(),
        email,
        password: data.password.trim(),
        role: targetRole,
        store_name: targetStore,
        phone: data.phone.trim(),
        admin_id: adminId,
        created_at: new Date().toISOString(),
        is_active: data.isActive,
        last_activity_at: new Date().toISOString(),
      });
    }
    load();
    setIsOpen(false);
  };

  const handleDelete = (acc: RegisteredAccount) => {
    if (acc.email.toLowerCase() === SUPER_USER_ACCOUNT.email.toLowerCase()) {
      return alert('Akun Super Administrator tidak dapat dihapus.');
    }
    if (!isSuperAdmin && acc.role !== 'cashier') {
      return alert('Anda hanya dapat menghapus kasir toko Anda.');
    }
    if (confirm(`Hapus akun "${acc.full_name || acc.email}"?`)) {
      deleteUserAccount(acc.id);
      load();
    }
  };

  const handleToggle = (acc: RegisteredAccount) => {
    if (acc.email.toLowerCase() === SUPER_USER_ACCOUNT.email.toLowerCase()) return;
    if (!isSuperAdmin && acc.role !== 'cashier') return;
    updateUserAccount(acc.id, { is_active: !(acc.is_active ?? true) });
    load();
  };

  const isOnline = (dt?: string) => Boolean(dt && Date.now() - new Date(dt).getTime() < 30 * 60 * 1000);

  // #2 Admin ga bisa liat superuser dan user lain, admin hanya bisa liat kasir yang under dia aja
  const visibleAccounts = accounts.filter((a) => {
    if (isSuperAdmin) return true;
    if (a.role !== 'cashier') return false; // Hanya kasir
    return a.admin_id === adminId || a.store_name === adminStore || !a.admin_id;
  });

  const filtered = visibleAccounts.filter((a) => {
    const matchSearch = (a.email + (a.full_name || '') + (a.store_name || '')).toLowerCase().includes(search.toLowerCase());
    const matchRole = role === 'ALL' || a.role === role;
    const online = isOnline(a.last_activity_at);
    const matchStatus = status === 'ALL' || (status === 'ACTIVE' && online) || (status === 'INACTIVE' && !online) || (status === 'DISABLED' && a.is_active === false);
    return matchSearch && matchRole && matchStatus;
  });

  const activeOnline = visibleAccounts.filter((a) => isOnline(a.last_activity_at) && a.is_active !== false).length;

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <UserStatsHeader
        total={visibleAccounts.length}
        activeOnline={activeOnline}
        onAdd={() => { setEditingAcc(null); setError(null); setIsOpen(true); }}
        onRefresh={load}
        isSuperAdmin={isSuperAdmin}
      />

      <div className="bg-white p-3 rounded-xl border flex flex-col sm:flex-row gap-2 justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama, email, toko..." className="w-full pl-9 pr-3 py-1.5 border rounded-xl text-xs" />
        </div>
        <div className="flex gap-2 text-xs">
          {isSuperAdmin && (
            <select value={role} onChange={(e) => setRole(e.target.value)} className="p-1.5 border rounded-xl bg-white">
              <option value="ALL">Semua Peran</option>
              <option value="superadmin">Super Admin</option>
              <option value="admin">Admin Toko</option>
              <option value="cashier">Kasir</option>
            </select>
          )}
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="p-1.5 border rounded-xl bg-white">
            <option value="ALL">Semua Status</option>
            <option value="ACTIVE">Aktif Online</option>
            <option value="INACTIVE">Inaktif</option>
            <option value="DISABLED">Dinonaktifkan</option>
          </select>
        </div>
      </div>

      <UserTable accounts={filtered} onEdit={(a) => { setEditingAcc(a); setError(null); setIsOpen(true); }} onDelete={handleDelete} onToggle={handleToggle} />

      <UserAccountModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        account={editingAcc}
        onSave={handleSave}
        error={error}
        isSuperAdmin={isSuperAdmin}
        adminStoreName={adminStore}
      />
    </div>
  );
}

