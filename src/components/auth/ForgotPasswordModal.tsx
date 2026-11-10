import React, { useState } from 'react';
import { KeyRound, CheckCircle2, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmail?: string;
  onSuccess: (email: string) => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  defaultEmail = '',
  onSuccess,
}) => {
  const { resetPasswordLocal } = useAuth();
  const [email, setEmail] = useState(defaultEmail);
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  if (!isOpen) return null;

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (!email.trim() || !newPassword.trim()) {
      setMsg({ text: 'Mohon isi email dan kata sandi baru.', type: 'error' });
      return;
    }
    if (newPassword.length < 6) {
      setMsg({ text: 'Kata sandi minimal 6 karakter.', type: 'error' });
      return;
    }

    const success = resetPasswordLocal(email.trim(), newPassword);
    if (success) {
      setMsg({ text: 'Kata sandi berhasil diperbarui! Silakan masuk.', type: 'success' });
      setTimeout(() => {
        onSuccess(email.trim());
        onClose();
      }, 1200);
    } else {
      setMsg({ text: 'Email belum terdaftar di sistem. Silakan periksa kembali atau buat akun.', type: 'error' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between mb-3 border-b pb-2">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-amber-600" />
            <h3 className="font-bold text-sm text-slate-800">Lupa Kata Sandi</h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-500 mb-3">
          Masukkan email terdaftar dan kata sandi baru untuk memulihkan akses Anda.
        </p>

        {msg && (
          <div
            className={`p-2.5 mb-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 ${
              msg.type === 'success'
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-red-50 text-red-600 border border-red-200'
            }`}
          >
            {msg.type === 'success' && <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
            <span>{msg.text}</span>
          </div>
        )}

        <form onSubmit={handleReset} className="space-y-3 text-xs">
          <div>
            <label className="font-semibold block mb-1 text-slate-700">Email Akun</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@toko.com"
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-semibold block mb-1 text-slate-700">Kata Sandi Baru (Min. 6 Karakter)</label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Kata sandi baru"
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 border rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 shadow-sm"
            >
              Simpan Kata Sandi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
