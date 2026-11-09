import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  role: UserRole | null;
  token: string | null;
  isAdmin: boolean;
  isCashier: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  switchMockRole: (role: UserRole) => void;
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('kasir_mock_role');
    const now = new Date().toISOString();
    if (saved === 'admin' || saved === 'owner' || saved === 'manager') {
      return {
        id: 'admin-user-id',
        email: 'admin@kasirpintar.id',
        full_name: 'Administrator Toko',
        role: saved as UserRole,
        store_id: 'default-store',
        created_at: now,
        updated_at: now
      };
    }
    if (saved === 'cashier') {
      return {
        id: 'cashier-user-id',
        email: 'kasir@kasirpintar.id',
        full_name: 'Kasir Toko (Shift 1)',
        role: 'cashier',
        store_id: 'default-store',
        created_at: now,
        updated_at: now
      };
    }
    // Default to admin for seamless first load if demo preference is set, or null if logged out
    if (saved === 'logged_out') {
      return null;
    }
    // If first time visit with no preference, give cashier default so POS works right away
    return {
      id: 'cashier-user-id',
      email: 'kasir@kasirpintar.id',
      full_name: 'Kasir Toko (Shift 1)',
      role: 'cashier',
      store_id: 'default-store',
      created_at: now,
      updated_at: now
    };
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error.message);
        return null;
      }
      return data as UserProfile;
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
      return null;
    }
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
      async (_event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          const prof = await fetchProfile(currentSession.user.id);
          setProfile(prof);
        } else {
          setProfile(null);
        }
        setIsLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setIsLoading(false);
      return { error };
    }
    return { error: null };
  };

  const switchMockRole = (targetRole: UserRole) => {
    localStorage.setItem('kasir_mock_role', targetRole);
    const now = new Date().toISOString();
    setProfile({
      id: targetRole === 'admin' ? 'admin-user' : 'cashier-user',
      email: targetRole === 'admin' ? 'admin@kasirpintar.id' : 'kasir@kasirpintar.id',
      full_name: targetRole === 'admin' ? 'Admin Toko' : 'Kasir Shift 1',
      role: targetRole,
      store_id: 'default-store',
      created_at: now,
      updated_at: now
    });
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('SignOut error:', e);
    }
    localStorage.setItem('kasir_mock_role', 'logged_out');
    setSession(null);
    setUser(null);
    setProfile(null);
    setIsLoading(false);
  };

  const role: UserRole | null = profile?.role ?? null;
  const isAdmin = role === 'admin' || role === 'owner' || role === 'manager';
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
      isCashier,
      isAuthenticated,
      isLoading,
      signIn,
      signOut,
      refreshProfile,
      switchMockRole,
    }),
    [session, user, profile, role, token, isAdmin, isCashier, isAuthenticated, isLoading]
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