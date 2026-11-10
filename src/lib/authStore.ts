import { UserProfile, UserRole } from '../types';

export interface RegisteredAccount {
  id: string;
  email: string;
  password?: string;
  full_name: string;
  role: UserRole;
  store_name?: string;
  phone?: string;
  created_at: string;
}

export const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 Menit (QA #9)
export const STORAGE_KEY_LAST_ACTIVITY = 'kasir_last_activity';
export const STORAGE_KEY_USERS = 'kasir_registered_users';
export const STORAGE_KEY_ACTIVE_PROFILE = 'kasir_active_profile';

export const getRegisteredUsers = (): RegisteredAccount[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveRegisteredUser = (acc: RegisteredAccount) => {
  const users = getRegisteredUsers();
  const existingIdx = users.findIndex((u) => u.email.toLowerCase() === acc.email.toLowerCase());
  if (existingIdx >= 0) {
    users[existingIdx] = { ...users[existingIdx], ...acc };
  } else {
    users.push(acc);
  }
  localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
};

export const resetUserPassword = (targetEmail: string, newPass: string): boolean => {
  const users = getRegisteredUsers();
  const user = users.find((u) => u.email.toLowerCase() === targetEmail.trim().toLowerCase());
  if (user) {
    user.password = newPass;
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    return true;
  }
  return false;
};

export const getInitialProfile = (): UserProfile | null => {
  try {
    const activeRaw = localStorage.getItem(STORAGE_KEY_ACTIVE_PROFILE);
    if (activeRaw) return JSON.parse(activeRaw);
  } catch {}

  const saved = localStorage.getItem('kasir_mock_role');
  const now = new Date().toISOString();
  if (saved === 'admin' || saved === 'owner' || saved === 'manager') {
    return {
      id: 'admin-user-id',
      email: 'admin@kasirpintar.id',
      full_name: 'Administrator Toko',
      role: (saved as UserRole) || 'admin',
      store_id: 'default-store',
      created_at: now,
      updated_at: now,
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
      updated_at: now,
    };
  }
  return null;
};
