import React, { useState, useEffect } from 'react';
import { Tag, X, Check, Search, Percent, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export interface DiscountItem {
  id: string;
  name: string;
  code: string | null;
  type: 'percentage' | 'fixed';
  value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

interface DiscountSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  subtotal: number;
  appliedDiscount: DiscountItem | null;
  onApplyDiscount: (discount: DiscountItem | null) => void;
}

export const DiscountSelector: React.FC<DiscountSelectorProps> = ({
  isOpen,
  onClose,
  subtotal,
  appliedDiscount,
  onApplyDiscount,
}) => {
  const [discounts, setDiscounts] = useState<DiscountItem[]>([]);
  const [promoCodeInput, setPromoCodeInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchActiveDiscounts = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from('discounts')
        .select('*')
        .eq('is_active', true)
        .lte('start_date', nowIso)
        .gte('end_date', nowIso)
        .order('value', { ascending: false });

      if (error) {
        throw error;
      }
      setDiscounts(data || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch discounts';
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchActiveDiscounts();
      setPromoCodeInput('');
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const calculateDiscountAmount = (discount: DiscountItem): number => {
    if (subtotal < discount.min_order_amount) {
      return 0;
    }
    let calculated = 0;
    if (discount.type === 'percentage') {
      calculated = (subtotal * discount.value) / 100;
      if (discount.max_discount_amount && calculated > discount.max_discount_amount) {
        calculated = discount.max_discount_amount;
      }
    } else {
      calculated = discount.value;
    }
    return Math.min(calculated, subtotal);
  };

  const handleSelectDiscount = (discount: DiscountItem) => {
    if (subtotal < discount.min_order_amount) {
      setErrorMsg(`Subtotal must be at least Rp ${discount.min_order_amount.toLocaleString('id-ID')}`);
      return;
    }
    onApplyDiscount(discount);
    setSuccessMsg(`Discount "${discount.name}" applied`);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleApplyPromoCode = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanCode = promoCodeInput.trim().toUpperCase();
    if (!cleanCode) {
      setErrorMsg('Enter valid promo code');
      return;
    }

    const matchedDiscount = discounts.find(
      (d) => d.code && d.code.toUpperCase() === cleanCode
    );

    if (!matchedDiscount) {
      setErrorMsg('Promo code not valid or expired');
      return;
    }

    if (subtotal < matchedDiscount.min_order_amount) {
      setErrorMsg(
        `Minimum spend Rp ${matchedDiscount.min_order_amount.toLocaleString('id-ID')} required for this promo`
      );
      return;
    }

    onApplyDiscount(matchedDiscount);
    setSuccessMsg(`Promo code "${matchedDiscount.code}" applied`);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleRemoveDiscount = () => {
    onApplyDiscount(null);
    setSuccessMsg('Discount removed');
    setTimeout(() => {
      onClose();
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-sm transition-opacity">
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <Tag className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-gray-900">Apply Discount & Promo</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Current subtotal reminder */}
          <div className="bg-indigo-50 px-6 py-3 border-b border-indigo-100 flex justify-between items-center text-sm">
            <span className="text-indigo-900 font-medium">Cart Subtotal:</span>
            <span className="text-indigo-900 font-bold">Rp {subtotal.toLocaleString('id-ID')}</span>
          </div>

          {/* Active Banner Feedback */}
          {errorMsg && (
            <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center space-x-2 text-sm text-emerald-700">
              <Check className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Promo code form */}
          <div className="p-6 border-b border-gray-100">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Have a Promo Code?
            </label>
            <form onSubmit={handleApplyPromoCode} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={promoCodeInput}
                  onChange={(e) => setPromoCodeInput(e.target.value)}
                  placeholder="e.g. DISKON50"
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold tracking-wide uppercase focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition"
              >
                Apply
              </button>
            </form>
          </div>

          {/* Active Applied Discount Indicator */}
          {appliedDiscount && (
            <div className="mx-6 mt-4 p-4 border border-indigo-200 bg-indigo-50/50 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide">
                  Active Discount Applied
                </span>
                <p className="text-sm font-bold text-gray-800">{appliedDiscount.name}</p>
                <p className="text-xs text-indigo-700">
                  -Rp {calculateDiscountAmount(appliedDiscount).toLocaleString('id-ID')}
                </p>
              </div>
              <button
                onClick={handleRemoveDiscount}
                className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline"
              >
                Remove
              </button>
            </div>
          )}

          {/* Campaign discounts list */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Available Campaigns
              </span>
              <button
                onClick={fetchActiveDiscounts}
                disabled={loading}
                className="text-gray-400 hover:text-indigo-600 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                <RefreshCw className="w-6 h-6 animate-spin mb-2" />
                <span className="text-xs">Loading campaign discounts...</span>
              </div>
            ) : discounts.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">
                No active campaigns available
              </div>
            ) : (
              discounts.map((discount) => {
                const isSelected = appliedDiscount?.id === discount.id;
                const isEligible = subtotal >= discount.min_order_amount;
                const savingAmount = calculateDiscountAmount(discount);

                return (
                  <div
                    key={discount.id}
                    onClick={() => handleSelectDiscount(discount)}
                    className={`border rounded-xl p-4 transition cursor-pointer relative ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/30 ring-1 ring-indigo-600'
                        : isEligible
                        ? 'border-gray-200 hover:border-indigo-300 hover:shadow-sm bg-white'
                        : 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-bold text-gray-900">{discount.name}</span>
                          {discount.code && (
                            <span className="text-[10px] font-mono bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded border">
                              {discount.code}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          Min spend: Rp {discount.min_order_amount.toLocaleString('id-ID')}
                          {discount.max_discount_amount &&
                            ` · Max: Rp ${discount.max_discount_amount.toLocaleString('id-ID')}`}
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800">
                          {discount.type === 'percentage' ? (
                            <>
                              <Percent className="w-3 h-3 mr-0.5" />
                              {discount.value}% OFF
                            </>
                          ) : (
                            `Rp ${discount.value.toLocaleString('id-ID')} OFF`
                          )}
                        </div>
                        {isEligible && (
                          <div className="text-xs text-gray-500 mt-1">
                            Save Rp {savingAmount.toLocaleString('id-ID')}
                          </div>
                        )}
                      </div>
                    </div>

                    {!isEligible && (
                      <div className="mt-2 pt-2 border-t border-gray-200 text-[11px] text-amber-700">
                        Add Rp {(discount.min_order_amount - subtotal).toLocaleString('id-ID')} more to apply
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 bg-white hover:bg-gray-100 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscountSelector;