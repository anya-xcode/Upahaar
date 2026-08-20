import { useEffect, useState } from 'react';
import api from '../../lib/api.js';
import { useLocation as useLocationStore } from '../../store/locationStore.js';
import { useShop } from '../../store/shopStore.js';
import { useAuth } from '../../store/authStore.js';
import { Modal, Badge, Spinner } from '../common/ui.jsx';
import { MapPin, Search, Check, Bolt } from '../common/Icons.jsx';

/**
 * The PIN code modal. Reachable from the header, empty states and checkout —
 * changing location here re-scopes the entire catalogue.
 */
export default function LocationPicker() {
  const { pickerOpen, closePicker, check, checking, error, pincode } = useLocationStore();
  const [value, setValue] = useState(pincode || '');
  const [suggestions, setSuggestions] = useState([]);
  const user = useAuth((s) => s.user);
  const { setCartPincode, loadCart } = useShop();

  useEffect(() => {
    if (pickerOpen) setValue(pincode || '');
  }, [pickerOpen, pincode]);

  // Debounced suggestion lookup so typing a 6-digit code doesn't fire 6 calls.
  useEffect(() => {
    if (!pickerOpen) return undefined;
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get('/location/suggest', { params: { q: value } });
        setSuggestions(data.pincodes);
      } catch {
        setSuggestions([]);
      }
    }, 220);
    return () => clearTimeout(t);
  }, [value, pickerOpen]);

  async function apply(code) {
    const result = await check(code);
    if (!result?.serviceable) return;

    // Keep the cart's delivery location in step with the browsing location.
    if (user?.role === 'CUSTOMER') {
      try {
        await setCartPincode(code);
      } catch {
        await loadCart();
      }
    }
  }

  return (
    <Modal
      open={pickerOpen}
      onClose={closePicker}
      title="Where should we deliver?"
      subtitle="We only show gifts that can actually reach you."
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          apply(value);
        }}
        className="space-y-3"
      >
        <div className="relative">
          <MapPin size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-rose-400" />
          <input
            autoFocus
            inputMode="numeric"
            maxLength={6}
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/\D/g, ''))}
            placeholder="Enter your PIN code"
            className="input !py-3.5 pl-11 text-base"
          />
        </div>

        {error && (
          <p className="rounded-xl bg-[#FEF6F5] px-4 py-2.5 text-sm font-medium text-[#B3261E]">{error}</p>
        )}

        <button type="submit" disabled={checking || value.length !== 6} className="btn-primary w-full !py-3">
          {checking ? <Spinner size={16} /> : <Search size={16} />}
          Find Gifts Near Me
        </button>
      </form>

      {suggestions.length > 0 && (
        <div className="mt-6">
          <p className="mb-2.5 text-xs font-bold uppercase tracking-[0.15em] text-ink-faint">
            {value ? 'Matching areas' : 'Popular areas we serve'}
          </p>
          <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
            {suggestions.map((s) => (
              <button
                key={s.code}
                onClick={() => apply(s.code)}
                className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-blush"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-ink">
                    {s.code}
                    {pincode === s.code && <Check size={13} className="ml-1.5 inline text-rose-500" />}
                  </span>
                  <span className="block truncate text-xs text-ink-muted">
                    {s.area}, {s.city}
                  </span>
                </span>
                {s.express60Available && (
                  <Badge tone="rose" className="shrink-0 !text-[10px]">
                    <Bolt size={10} /> 60 MIN
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}
