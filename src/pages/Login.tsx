import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, User, Store, KeyRound, ArrowRight, Eye, EyeOff, LogOut } from 'lucide-react';
import { UserRole } from '../types';

export default function Login() {
  const { signIn, switchMockRole, role, profile, isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="min-h-[85vh] flex items-center justify-center py-6 px-3 sm:px-6">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl shadow-xl p-5 sm:p-8">
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-extrabold text-2xl shadow-md">
            W
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            WE<span className="text-emerald-600">CASH</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Masuk sebagai Kasir atau Admin Toko</p>
        </div>

        {/* Status login aktif jika ada */}
        {isAuthenticated && profile && (
          <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
            <div>
              <div className="text-[10px] text-emerald-700 font-bold uppercase">Sedang Login:</div>
              <div className="text-xs sm:text-sm font-bold text-slate-900">
                {profile.full_name} ({role === 'admin' ? 'Admin' : 'Kasir'})
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate(role === 'admin' ? '/' : '/pos')}
              className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition"
            >
              Lanjutkan →
            </button>
          </div>
        )}

        {/* Pilihan Cepat: Admin atau Kasir */}
        <div className="mb-6 bg-slate-50 border border-slate-200 rounded-2xl p-3.5 sm:p-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-3 text-center">
            Pilih Akses Cepat (Mode Demo / Toko)
          </span>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('admin')}
              className="p-3.5 border-2 rounded-2xl flex flex-col items-center justify-center bg-white hover:border-emerald-500 hover:shadow-md active:scale-95 transition group text-center touch-manipulation"
            >
              <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2 group-hover:bg-emerald-600 group-hover:text-white transition">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <span className="text-sm font-extrabold text-slate-900">Mode Admin</span>
              <span className="text-[10px] text-slate-500 mt-0.5 leading-tight">Dashboard & Stok</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoLogin('cashier')}
              className="p-3.5 border-2 rounded-2xl flex flex-col items-center justify-center bg-white hover:border-blue-500 hover:shadow-md active:scale-95 transition group text-center touch-manipulation"
            >
              <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-2 group-hover:bg-blue-600 group-hover:text-white transition">
                <User className="w-6 h-6" />
              </div>
              <span className="text-sm font-extrabold text-slate-900">Mode Kasir</span>
              <span className="text-[10px] text-slate-500 mt-0.5 leading-tight">POS, Scan, Struk</span>
            </button>
          </div>
        </div>

        <div className="relative flex py-2 items-center mb-5">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-3 text-[11px] uppercase font-semibold text-slate-400">atau login database</span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSupabaseLogin} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Toko</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@toko.com"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-3.5 pr-10 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-slate-900 text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-slate-800 active:scale-98 transition flex items-center justify-center gap-2 disabled:opacity-50 touch-manipulation shadow-md"
          >
            {loading ? 'Memeriksa Kredensial...' : 'Masuk dengan Akun Toko'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {isAuthenticated && (
          <div className="mt-4 pt-4 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={() => signOut()}
              className="text-xs text-red-600 hover:underline inline-flex items-center gap-1 font-semibold"
            >
              <LogOut className="w-3.5 h-3.5" />
              Keluar / Ganti Akun
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
