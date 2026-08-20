import { create } from 'zustand';
import api, { TOKEN_KEY } from '../lib/api.js';

export const useAuth = create((set, get) => ({
  user: null,
  loading: true,

  /** Called once on boot to restore the session behind a stored token. */
  async bootstrap() {
    if (!localStorage.getItem(TOKEN_KEY)) return set({ loading: false });
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data.user, loading: false });
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      set({ user: null, loading: false });
    }
  },

  async login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem(TOKEN_KEY, data.token);
    set({ user: data.user });
    return data.user;
  },

  async adminLogin(email, password) {
    const { data } = await api.post('/auth/admin/login', { email, password });
    localStorage.setItem(TOKEN_KEY, data.token);
    set({ user: data.user });
    return data.user;
  },

  async register(payload) {
    const { data } = await api.post('/auth/register', payload);
    localStorage.setItem(TOKEN_KEY, data.token);
    set({ user: data.user });
    return data.user;
  },

  async registerSeller(payload) {
    const { data } = await api.post('/auth/seller/register', payload);
    localStorage.setItem(TOKEN_KEY, data.token);
    set({ user: data.user });
    return data.user;
  },

  async updateProfile(payload) {
    const { data } = await api.patch('/auth/me', payload);
    set({ user: data.user });
    return data.user;
  },

  /** Keeps the store in step when another slice changes the saved pincode. */
  setPincodeOnUser(pincode) {
    const { user } = get();
    if (user) set({ user: { ...user, defaultPincode: pincode } });
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    set({ user: null });
  },

  isCustomer: () => get().user?.role === 'CUSTOMER',
  isSeller: () => get().user?.role === 'SELLER',
  isAdmin: () => get().user?.role === 'ADMIN',
}));

export default useAuth;
