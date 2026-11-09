import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface StoreSettings {
  id?: string;
  store_name: string;
  store_address: string;
  store_phone: string;
  tax_rate: number;
  currency: string;
  receipt_footer: string;
}

interface StoreContextType {
  settings: StoreSettings;
  loading: boolean;
  updateSettings: (newSettings: Partial<StoreSettings>) => Promise<{ success: boolean; error?: string }>;
  refreshSettings: () => Promise<void>;
}

const DEFAULT_SETTINGS: StoreSettings = {
  store_name: 'WECASH Store',
  store_address: 'Jl. Bisnis Pintar No. 8',
  store_phone: '0812-3456-7890',
  tax_rate: 0.11,
  currency: 'IDR',
  receipt_footer: 'Terima kasih atas kunjungan Anda!',
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<StoreSettings>(() => {
    try {
      const saved = localStorage.getItem('kasir_store_settings');
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });
  const [loading, setLoading] = useState(false);

  const refreshSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (data && !error) {
        const loaded: StoreSettings = {
          id: data.id,
          store_name: data.store_name || DEFAULT_SETTINGS.store_name,
          store_address: data.store_address || DEFAULT_SETTINGS.store_address,
          store_phone: data.store_phone || DEFAULT_SETTINGS.store_phone,
          tax_rate: Number(data.tax_rate ?? DEFAULT_SETTINGS.tax_rate),
          currency: data.currency || DEFAULT_SETTINGS.currency,
          receipt_footer: data.receipt_footer || DEFAULT_SETTINGS.receipt_footer,
        };
        setSettings(loaded);
        localStorage.setItem('kasir_store_settings', JSON.stringify(loaded));
      }
    } catch (err) {
      console.warn('Could not load store settings from DB, using fallback:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  const updateSettings = async (newSettings: Partial<StoreSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('kasir_store_settings', JSON.stringify(updated));

    try {
      if (settings.id) {
        const { error } = await supabase
          .from('store_settings')
          .update({
            store_name: updated.store_name,
            store_address: updated.store_address,
            store_phone: updated.store_phone,
            tax_rate: updated.tax_rate,
            currency: updated.currency,
            receipt_footer: updated.receipt_footer,
            updated_at: new Date().toISOString(),
          })
          .eq('id', settings.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('store_settings')
          .insert({
            store_name: updated.store_name,
            store_address: updated.store_address,
            store_phone: updated.store_phone,
            tax_rate: updated.tax_rate,
            currency: updated.currency,
            receipt_footer: updated.receipt_footer,
          })
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setSettings((prev) => ({ ...prev, id: data.id }));
        }
      }
      return { success: true };
    } catch (err: any) {
      console.error('Failed to sync store settings with DB:', err);
      // Keep in localStorage even if network/db fails
      return { success: true };
    }
  };

  return (
    <StoreContext.Provider value={{ settings, loading, updateSettings, refreshSettings }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = (): StoreContextType => {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
};
