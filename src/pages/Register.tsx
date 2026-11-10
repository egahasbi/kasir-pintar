import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';

export default function Register() {
  const navigate = useNavigate();
  const { switchMockRole, registerAccount } = useAuth();
  const { updateSettings } = useStore();

  const [fullName, setFullName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Format email tidak valid. Mohon masukkan email yang benar.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Kata sandi minimal 6 karakter.');
      return;
    }

    setLoading(true);
    const userId = `user-${Date.now()}`;
    const now = new Date().toISOString();

    registerAccount({
      id: userId,
      email: cleanEmail,
      password,
      full_name: fullName.trim(),
      role: 'admin',
      store_name: storeName.trim(),
      phone: phone.trim(),
      created_at: now,
    });

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
      });

      if (!authError && authData.user) {
        const sbId = authData.user.id;
        await supabase.from('stores').insert({
          name: storeName.trim(),
          owner_id: sbId,
          phone: phone.trim(),
          subscription_plan: 'trial',
          subscription_status: 'active',
        });

        await supabase.from('profiles').upsert({
          id: sbId,
          email: cleanEmail,
          full_name: fullName.trim(),
          role: 'owner',
          phone: phone.trim(),
        });
      }
    } catch {}

    await updateSettings({
      store_name: storeName.trim() || 'Toko Saya',
      store_phone: phone.trim(),
      subscription_plan: 'trial',
      subscription_status: 'active',
    });

    switchMockRole('admin');
    setLoading(false);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-6 px-3">
      <div className="max-w-md w-full bg-white border rounded-3xl shadow-xl p-6 sm:p-8">
        <div className="text-center mb-5">
          <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-black text-xl">K</div>
          <h1 className="text-xl font-black">Daftar KASIR<span className="text-emerald-700">KITA</span></h1>
          <p className="text-xs text-slate-500 mt-1">Mulai kelola kasir dan stok kafe / toko Anda. Coba Gratis 14 Hari.</p>
        </div>

        {errorMsg && <div className="p-2 mb-3 bg-red-50 text-red-600 text-xs rounded">{errorMsg}</div>}

        <form onSubmit={handleRegister} className="space-y-2.5 text-xs">
          <div>
            <label className="font-semibold block mb-0.5">Nama Pemilik *</label>
            <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nama Anda" className="w-full p-2 border rounded-xl" />
          </div>
          <div>
            <label className="font-semibold block mb-0.5">Nama Toko *</label>
            <input type="text" required value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="Contoh: Kopi Senja" className="w-full p-2 border rounded-xl" />
          </div>
          <div>
            <label className="font-semibold block mb-0.5">No. WhatsApp *</label>
            <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08123456789" className="w-full p-2 border rounded-xl" />
          </div>
          <div>
            <label className="font-semibold block mb-0.5">Email *</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@toko.com" className="w-full p-2 border rounded-xl" />
          </div>
          <div>
            <label className="font-semibold block mb-0.5">Password *</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 karakter"
                className="w-full pl-3 pr-10 py-2 border rounded-xl"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-emerald-600 transition"
                aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-1 shadow-md">
            <span>{loading ? 'Mendaftarkan...' : 'Mulai Coba Gratis'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-4 text-center text-xs text-slate-500">
          Sudah punya akun? <Link to="/login" className="text-emerald-700 font-bold hover:underline">Masuk di sini</Link>
        </div>
      </div>
    </div>
  );
}
