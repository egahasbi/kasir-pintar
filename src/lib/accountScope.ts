import { STORAGE_KEY_ACTIVE_PROFILE } from './authStore';

export const getActiveAccountKey = (): string => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACTIVE_PROFILE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.email) {
        return `acc_${parsed.email.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      }
      if (parsed.id) {
        return `acc_${parsed.id}`;
      }
    }
  } catch {}

  const mockRole = localStorage.getItem('kasir_mock_role');
  if (mockRole && mockRole !== 'logged_out') {
    return `acc_role_${mockRole}`;
  }

  return 'acc_default';
};

export const isDummySupabase = (): boolean => {
  const url = import.meta.env.VITE_SUPABASE_URL || '';
  return !url || url.includes('your-project-ref') || url.includes('placeholder.supabase.co');
};
