import React, { useState, useEffect } from 'react';
import { RegisteredAccount } from '../../lib/authStore';
import { UserRole } from '../../types';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: RegisteredAccount | null;
  onSave: (data: {
    fullName: string;
    email: string;
    password: string;
    role: UserRole;
    storeName: string;
    phone: string;
    isActive: boolean;
  }) => void;
  error: string | null;
  isSuperAdmin?: boolean;
  adminStoreName?: string;
}

export const UserAccountModal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  account,
  onSave,
  error,
  isSuperAdmin = false,
  adminStoreName = 'Toko',
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('cashier');
  const [storeName, setStoreName] = useState('');
  const [phone, setPhone] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (account) {
      setFullName(account.full_name || '');
      setEmail(account.email);
      setPassword(account.password || '');
      setRole(account.role === 'owner' ? 'admin' : account.role);
      setStoreName(account.store_name || adminStoreName);
      setPhone(account.phone || '');
      setIsActive(account.is_active ?? true);
    } else {
      setFullName('');
      setEmail('');
      setPassword('');
      setRole('cashier');
      setStoreName(isSuperAdmin ? '' : adminStoreName);
      setPhone('');
      setIsActive(true);
    }
  }, [account, isOpen, isSuperAdmin, adminStoreName]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs">
        <div className="flex items-center justify-between pb-3 mb-4 border-b">
          <h3 className="font-extrabold text-sm text-slate-900">
            {account ? 'Edit Akun' : isSuperAdmin ? 'Tambah Pengguna Baru' : 'Tambah Kasir Toko'}
          </h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        {error && <div className="p-2.5 mb-3 bg-red-50 border border-red-200 text-red-600 rounded-xl font-medium">{error}</div>}

        <form onSubmit={(e) => { e.preventDefault(); onSave({ fullName, email, password, role: isSuperAdmin ? role : 'cashier', storeName: storeName || adminStoreName, phone, isActive }); }} className="space-y-3">
          <div>
            <label className="font-bold block mb-1 text-slate-700">Nama Lengkap *</label>
            <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nama pengguna" className="w-full p-2.5 border rounded-xl" />
          </div>

          <div>
            <label className="font-bold block mb-1 text-slate-700">Email Login *</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@toko.com" className="w-full p-2.5 border rounded-xl" />
          </div>

          <div>
            <label className="font-bold block mb-1 text-slate-700">Kata Sandi (Password) *</label>
            <input type="text" required minLength={4} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 4 karakter" className="w-full p-2.5 border rounded-xl" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold block mb-1 text-slate-700">Peran (Role) *</label>
              {isSuperAdmin ? (
                <select value={role} onChange={(e) => setRole(e.target.value as UserRole)} className="w-full p-2.5 border rounded-xl bg-white">
                  <option value="cashier">Kasir</option>
                  <option value="admin">Admin Toko</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              ) : (
                <div className="w-full p-2.5 border rounded-xl bg-slate-100 font-bold text-slate-700">
                  Kasir
                </div>
              )}
            </div>
            <div>
              <label className="font-bold block mb-1 text-slate-700">Status Akun *</label>
              <select value={isActive ? 'true' : 'false'} onChange={(e) => setIsActive(e.target.value === 'true')} className="w-full p-2.5 border rounded-xl bg-white">
                <option value="true">Aktif</option>
                <option value="false">Nonaktifkan</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold block mb-1 text-slate-700">Nama Toko</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Nama Toko"
                disabled={!isSuperAdmin}
                className={`w-full p-2.5 border rounded-xl ${!isSuperAdmin ? 'bg-slate-100 text-slate-600' : ''}`}
              />
            </div>
            <div>
              <label className="font-bold block mb-1 text-slate-700">No. WhatsApp</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="081234..." className="w-full p-2.5 border rounded-xl" />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-xl font-bold text-slate-600 hover:bg-slate-50">Batal</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md">{account ? 'Simpan' : 'Buat Akun'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
