import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, User, Store, KeyRound, ArrowRight } from 'lucide-react';
import { UserRole } from '../types';

export default function Login() {
  const { signIn, switchMockRole, role } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSupabaseLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      setErrorMsg(error.message || 'Login gagal. Silakan coba lagi.');
      return;
    }

    navigate('/');
  };

  const handleQuickDemoLogin = (targetRole: UserRole) => {
    switchMockRole(targetRole);
    if (targetRole === 'admin' || targetRole === 'owner') {
      navigate('/');
    } else {
      navigate('/pos');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-10 px-4">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-2xl shadow-md">
            K
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Kasir Pintar AI</h1>
          <p className="text-sm text-slate-500 mt-1">Pilih mode akses akun atau login dengan kredensial</p>
        </div>

        {/* Demo Fast Switch */}
        <div className="mb-6 bg-slate-50 border border-slate-200 rounded-xl p-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-3 text-center">
            Pilihan Mode Akses Instan (Demo / Cepat)
          </span>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('admin')}
              className="p-3 border rounded-xl flex flex-col items-center justify-center bg-white hover:border-emerald-500 hover:shadow-sm transition group text-center"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 group-hover:bg-emerald-600 group-hover:text-white transition">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold text-slate-800">Mode Admin</span>
              <span className="text-[11px] text-slate-500 mt-0.5">Setup AI, Inventori, Laba</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoLogin('cashier')}
              className="p-3 border rounded-xl flex flex-col items-center justify-center bg-white hover:border-blue-500 hover:shadow-sm transition group text-center"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-2 group-hover:bg-blue-600 group-hover:text-white transition">
                <User className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold text-slate-800">Mode Kasir</span>
              <span className="text-[11px] text-slate-500 mt-0.5">Transaksi, Barcode & Struk</span>
            </button>
          </div>
        </div>

        <div className="relative flex py-2 items-center mb-6">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-4 text-xs uppercase font-medium text-slate-400">atau login database</span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSupabaseLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Email Toko</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@toko.com"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Memeriksa Kredensial...' : 'Masuk dengan Akun'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
