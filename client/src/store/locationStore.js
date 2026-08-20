import { create } from 'zustand';
import api from '../lib/api.js';

const PIN_KEY = 'upahaar_pincode';

/**
 * The customer's location is the most important piece of state in the app —
 * almost every catalogue request is scoped by it, so it is persisted and
 * restored before the first render that needs it.
 */
export const useLocation = create((set, get) => ({
  pincode: localStorage.getItem(PIN_KEY) || '',
  info: null, // { city, state, tiers, sellerCount, … }
  checking: false,
  error: '',
  /** Opens the location modal from anywhere (header, empty states, checkout). */
  pickerOpen: false,

  openPicker: () => set({ pickerOpen: true, error: '' }),
  closePicker: () => set({ pickerOpen: false }),

  async check(pincode, { persist = true } = {}) {
    const code = String(pincode || '').trim();
    if (!/^\d{6}$/.test(code)) {
      set({ error: 'Please enter a valid 6-digit PIN code' });
      return null;
    }

    set({ checking: true, error: '' });
    try {
      const { data } = await api.get('/location/check', { params: { pincode: code } });

      if (!data.serviceable) {
        // Keep the previous working pincode rather than stranding the customer
        // on an empty catalogue.
        set({ checking: false, error: data.message, info: data });
        return data;
      }

      if (persist) localStorage.setItem(PIN_KEY, code);
      set({ pincode: code, info: data, checking: false, error: '', pickerOpen: false });
      return data;
    } catch (err) {
      set({ checking: false, error: err.message });
      return null;
    }
  },

  /** Re-runs the check on boot so tier availability is never stale. */
  async refresh() {
    const { pincode } = get();
    if (pincode) await get().check(pincode);
  },

  clear() {
    localStorage.removeItem(PIN_KEY);
    set({ pincode: '', info: null, error: '' });
  },
}));

export default useLocation;
