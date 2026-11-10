import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, User, Store, KeyRound, ArrowRight, Eye, EyeOff, LogOut } from 'lucide-react';
import { UserRole } from '../types';
import { ForgotPasswordModal } from '../components/auth/ForgotPasswordModal';

export default function Login() {
  const { signIn, switchMockRole, role, profile, isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isForgotOpen, setIsForgotOpen] = useState(false);

  const handleSupabaseLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      setErrorMsg(error.message || 'Email atau kata sandi tidak sesuai. Silakan coba kembali.');
      return;
    }

    const clean = email.trim().toLowerCase();
    if (clean === 'admin@admin.com') {
      navigate('/super-admin');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-6 px-3 sm:px-6">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl shadow-xl p-5 sm:p-8">
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-amber-700 to-amber-600 text-white flex items-center justify-center font-extrabold text-2xl shadow-md">
            K
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            KASIR<span className="text-amber-700">KITA</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Sistem Kasir & Manajemen Kafe Modern</p>
        </div>

        {/* Status login aktif jika ada */}
        {isAuthenticated && profile && (
          <div className="mb-5 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between">
            <div>
              <div className="text-[10px] text-amber-700 font-bold uppercase">Sedang Login:</div>
              <div className="text-xs sm:text-sm font-bold text-slate-900">
                {profile.full_name} ({profile.role === 'superadmin' ? 'Super Admin' : profile.role === 'cashier' ? 'Kasir' : 'Admin / Owner'})
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate(profile.role === 'superadmin' ? '/super-admin' : '/dashboard')}
              className="px-3 py-1.5 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 transition"
            >
              Lanjutkan →
            </button>
          </div>
        )}

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
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">Password</label>
              {/* #6 REVISI: Lupa Password */}
              <button
                type="button"
                onClick={() => setIsForgotOpen(true)}
                className="text-xs text-amber-600 hover:underline font-semibold"
              >
                Lupa Password?
              </button>
            </div>
            {/* #5 REVISI: Icon view password toggle */}
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-3.5 pr-11 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-amber-600 transition"
                aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
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

        <div className="mt-4 text-center text-xs text-slate-500">
          Belum punya akun toko?{' '}
          <Link to="/register" className="text-amber-600 font-bold hover:underline">
            Daftar Sekarang
          </Link>
        </div>

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

      <ForgotPasswordModal
        isOpen={isForgotOpen}
        onClose={() => setIsForgotOpen(false)}
        defaultEmail={email}
        onSuccess={(em) => {
          setEmail(em);
          setPassword('');
        }}
      />
    </div>
  );
}
