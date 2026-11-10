import React, { createContext, useContext, useEffect, useState, useMemo, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
import { UserProfile, UserRole } from '../types';
import {
  getInitialProfile,
  getRegisteredUsers,
  saveRegisteredUser,
  resetUserPassword,
  recordUserActivity,
  syncUsersWithServer,
  RegisteredAccount,
  INACTIVITY_TIMEOUT_MS,
  STORAGE_KEY_LAST_ACTIVITY,
  STORAGE_KEY_ACTIVE_PROFILE,
} from '../lib/authStore';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  role: UserRole | null;
  token: string | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isCashier: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  switchMockRole: (role: UserRole) => void;
  registerAccount: (account: RegisteredAccount) => void;
  resetPasswordLocal: (email: string, newPass: string) => boolean;
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(getInitialProfile);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const lastActivityRef = useRef<number>(Date.now());

  useEffect(() => {
    if (profile) {
      localStorage.setItem(STORAGE_KEY_ACTIVE_PROFILE, JSON.stringify(profile));
    } else {
      localStorage.removeItem(STORAGE_KEY_ACTIVE_PROFILE);
    }
  }, [profile]);

  // #9 REVISI: Inactivity timeout 30 Menit
  useEffect(() => {
    const updateActivity = () => {
      const now = Date.now();
      lastActivityRef.current = now;
      try {
        localStorage.setItem(STORAGE_KEY_LAST_ACTIVITY, String(now));
      } catch {}
    };

    updateActivity();
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach((ev) => window.addEventListener(ev, updateActivity, { passive: true }));

    const timer = setInterval(() => {
      const last = Number(localStorage.getItem(STORAGE_KEY_LAST_ACTIVITY) || lastActivityRef.current);
      if (Date.now() - last >= INACTIVITY_TIMEOUT_MS && profile) {
        signOut();
      }
    }, 15000);

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, updateActivity));
      clearInterval(timer);
    };
  }, [profile]);

  const fetchProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (!error && data) return data as UserProfile;
    } catch {}
    return null;
  };

  const refreshProfile = async () => {
    if (!user) return;
    const data = await fetchProfile(user.id);
    if (data) setProfile(data);
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        // Sync registered accounts from centralized server (e.g. PC to HP)
        await syncUsersWithServer();

        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (!mounted) return;

        setSession(initialSession);
        setUser(initialSession?.user ?? null);

        if (initialSession?.user) {
          const prof = await fetchProfile(initialSession.user.id);
          if (mounted) setProfile(prof);
        }
      } catch (err) {
        console.error('Auth initialization failed:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setProfile(null);
        } else if (currentSession?.user) {
          setSession(currentSession);
          setUser(currentSession.user);
          const prof = await fetchProfile(currentSession.user.id);
          if (prof) setProfile(prof);
        }
        setIsLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const registerAccount = (acc: RegisteredAccount) => {
    saveRegisteredUser(acc);
  };

  const resetPasswordLocal = (email: string, newPass: string): boolean => {
    return resetUserPassword(email, newPass);
  };

  const signIn = async (emailInput: string, passwordInput: string): Promise<{ error: Error | null }> => {
    setIsLoading(true);
    const cleanEmail = emailInput.trim().toLowerCase();

    // 0. Autentikasi langsung ke server backend sentral (sinkron langsung HP dan PC)
    try {
      const serverRes = await fetch('/api/sync/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: passwordInput }),
      });
      const serverData = await serverRes.json();
      if (serverRes.ok && serverData.success && serverData.user) {
        const u = serverData.user;
        saveRegisteredUser(u);
        const now = new Date().toISOString();
        const newProf: UserProfile = {
          id: u.id,
          email: u.email,
          full_name: u.full_name || 'Pengguna Toko',
          role: u.role || 'admin',
          store_id: u.store_name || 'default-store',
          created_at: u.created_at || now,
          updated_at: now,
        };
        setProfile(newProf);
        localStorage.setItem('kasir_mock_role', u.role);
        setIsLoading(false);
        return { error: null };
      }
      if (serverRes.status === 401 || serverRes.status === 403) {
        setIsLoading(false);
        return { error: new Error(serverData.error || 'Autentikasi gagal.') };
      }
    } catch {}

    // 1. Cek akun teregistrasi (termasuk super user admin@admin.com)
    let localUsers = getRegisteredUsers();
    let matched = localUsers.find((u) => u.email.toLowerCase() === cleanEmail);

    // Jika belum ada di local, sinkronkan seketika dengan server (misal baru dibuat di PC, mau login di HP)
    if (!matched) {
      try {
        localUsers = await syncUsersWithServer();
        matched = localUsers.find((u) => u.email.toLowerCase() === cleanEmail);
      } catch {}
    }

    if (matched) {
      if (matched.is_active === false) {
        setIsLoading(false);
        return { error: new Error('Akun ini telah dinonaktifkan oleh Administrator.') };
      }

      if (matched.password && matched.password !== passwordInput) {
        setIsLoading(false);
        return { error: new Error('Kata sandi salah. Silakan coba kembali.') };
      }

      recordUserActivity(matched.email);
      const now = new Date().toISOString();
      const newProf: UserProfile = {
        id: matched.id,
        email: matched.email,
        full_name: matched.full_name || 'Pengguna Toko',
        role: matched.role || 'admin',
        store_id: matched.store_name || 'default-store',
        created_at: matched.created_at || now,
        updated_at: now,
      };
      setProfile(newProf);
      localStorage.setItem('kasir_mock_role', matched.role);
      setIsLoading(false);
      return { error: null };
    }

    // 2. Supabase Auth (untuk user cloud)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: passwordInput,
      });

      if (!error && data.user) {
        setSession(data.session);
        setUser(data.user);
        const prof = await fetchProfile(data.user.id);
        if (prof) {
          setProfile(prof);
          recordUserActivity(prof.email);
        }
        setIsLoading(false);
        return { error: null };
      }

      if (error) {
        let msg = 'Email atau kata sandi tidak cocok. Silakan periksa kembali.';
        if (error.message.includes('Invalid login credentials')) {
          msg = 'Email atau kata sandi salah. Silakan periksa kembali atau daftar baru.';
        }
        setIsLoading(false);
        return { error: new Error(msg) };
      }
    } catch {}

    setIsLoading(false);
    return {
      error: new Error('Akun dengan email ini belum terdaftar. Silakan klik menu Daftar untuk membuat akun baru.'),
    };
  };

  const switchMockRole = (targetRole: UserRole) => {
    if (!profile) return;
    const updated = { ...profile, role: targetRole };
    setProfile(updated);
    localStorage.setItem('kasir_mock_role', targetRole);
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('SignOut error:', e);
    }
    localStorage.setItem('kasir_mock_role', 'logged_out');
    localStorage.removeItem(STORAGE_KEY_ACTIVE_PROFILE);
    setSession(null);
    setUser(null);
    setProfile(null);
    setIsLoading(false);
  };

  const role: UserRole | null = profile?.role ?? null;
  const isSuperAdmin = role === 'superadmin' || profile?.email === 'admin@admin.com';
  const isAdmin = role === 'admin' || role === 'owner' || role === 'manager' || isSuperAdmin;
  const isCashier = role === 'cashier' || isAdmin;
  const isAuthenticated = !!profile || !!session;
  const token = session?.access_token ?? null;

  const value = useMemo(
    () => ({
      session,
      user,
      profile,
      role,
      token,
      isAdmin,
      isSuperAdmin,
      isCashier,
      isAuthenticated,
      isLoading,
      signIn,
      signOut,
      refreshProfile,
      switchMockRole,
      registerAccount,
      resetPasswordLocal,
    }),
    [session, user, profile, role, token, isAdmin, isSuperAdmin, isCashier, isAuthenticated, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
export default AuthContext;