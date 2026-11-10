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
  last_activity_at?: string;
  is_active?: boolean;
  admin_id?: string;
}

export const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 Menit (QA #9)
export const STORAGE_KEY_LAST_ACTIVITY = 'kasir_last_activity';
export const STORAGE_KEY_USERS = 'kasir_registered_users';
export const STORAGE_KEY_ACTIVE_PROFILE = 'kasir_active_profile';

export const SUPER_USER_ACCOUNT: RegisteredAccount = {
  id: 'super-admin-001',
  email: 'admin@admin.com',
  password: 'admin',
  full_name: 'Super Administrator',
  role: 'superadmin',
  store_name: 'KASIRKITA Platform',
  phone: '0812-0000-0001',
  created_at: '2026-01-01T00:00:00.000Z',
  is_active: true,
  last_activity_at: new Date().toISOString(),
};

export const getRegisteredUsers = (): RegisteredAccount[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    let users: RegisteredAccount[] = raw ? JSON.parse(raw) : [];

    // Pastikan super user selalu terdaftar
    const hasSuper = users.some((u) => u.email.toLowerCase() === SUPER_USER_ACCOUNT.email.toLowerCase());
    if (!hasSuper) {
      users.unshift(SUPER_USER_ACCOUNT);
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    }
    return users;
  } catch {
    return [SUPER_USER_ACCOUNT];
  }
};

export const syncUsersWithServer = async (): Promise<RegisteredAccount[]> => {
  try {
    const res = await fetch('/api/sync/users');
    if (res.ok) {
      const { data } = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const local = getRegisteredUsers();
        const map = new Map<string, RegisteredAccount>();
        map.set(SUPER_USER_ACCOUNT.email.toLowerCase(), SUPER_USER_ACCOUNT);
        local.forEach((u) => map.set(u.email.toLowerCase(), u));
        data.forEach((u: RegisteredAccount) => map.set(u.email.toLowerCase(), { ...map.get(u.email.toLowerCase()), ...u }));
        const combined = Array.from(map.values());
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(combined));
        return combined;
      }
    }
  } catch {}
  return getRegisteredUsers();
};

export const saveRegisteredUser = (acc: RegisteredAccount) => {
  const users = getRegisteredUsers();
  const existingIdx = users.findIndex((u) => u.email.toLowerCase() === acc.email.toLowerCase());
  const now = new Date().toISOString();
  const item: RegisteredAccount = {
    ...acc,
    is_active: acc.is_active ?? true,
    last_activity_at: acc.last_activity_at || now,
  };

  if (existingIdx >= 0) {
    users[existingIdx] = { ...users[existingIdx], ...item };
  } else {
    users.push(item);
  }
  localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));

  // Sync to central backend server so other devices (HP, tablet) can login
  fetch('/api/sync/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  }).catch(() => {});
};

export const recordUserActivity = (emailOrId: string) => {
  try {
    const users = getRegisteredUsers();
    const clean = emailOrId.trim().toLowerCase();
    const user = users.find((u) => u.email.toLowerCase() === clean || u.id === emailOrId);
    if (user) {
      user.last_activity_at = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    }
  } catch {}
};

export const updateUserAccount = (id: string, updates: Partial<RegisteredAccount>): boolean => {
  const users = getRegisteredUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx >= 0) {
    users[idx] = { ...users[idx], ...updates };
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));

    fetch('/api/sync/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(users[idx]),
    }).catch(() => {});

    return true;
  }
  return false;
};

export const deleteUserAccount = (id: string): boolean => {
  const users = getRegisteredUsers();
  const target = users.find((u) => u.id === id);
  if (target?.email.toLowerCase() === SUPER_USER_ACCOUNT.email.toLowerCase()) {
    return false; // Lindungi superadmin dari terhapus
  }
  const next = users.filter((u) => u.id !== id);
  localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(next));

  fetch(`/api/sync/users/${id}`, { method: 'DELETE' }).catch(() => {});
  return true;
};

export const resetUserPassword = (targetEmail: string, newPass: string): boolean => {
  const users = getRegisteredUsers();
  const user = users.find((u) => u.email.toLowerCase() === targetEmail.trim().toLowerCase());
  if (user) {
    user.password = newPass;
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));

    fetch('/api/sync/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    }).catch(() => {});

    return true;
  }
  return false;
};

export const getInitialProfile = (): UserProfile | null => {
  try {
    const activeRaw = localStorage.getItem(STORAGE_KEY_ACTIVE_PROFILE);
    if (activeRaw) {
      const parsed = JSON.parse(activeRaw);
      if (parsed && parsed.email) return parsed;
    }
  } catch {}
  return null;
};

