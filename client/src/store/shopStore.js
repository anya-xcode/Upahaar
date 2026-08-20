import { create } from 'zustand';
import api from '../lib/api.js';
import { useAuth } from './authStore.js';
import { useLocation } from './locationStore.js';
import { toast } from './toastStore.js';

/**
 * Cart + wishlist. Both are server-owned for signed-in customers; a guest who
 * taps "Add to cart" is sent to sign-in rather than given a local cart that
 * would need reconciling later.
 */
export const useShop = create((set, get) => ({
  cart: null,
  wishlistIds: [],
  loading: false,
  /** Guarded so the cart badge doesn't flicker on every route change. */
  hydrated: false,

  async loadCart() {
    const { user } = useAuth.getState();
    if (user?.role !== 'CUSTOMER') return set({ cart: null, hydrated: true });

    set({ loading: true });
    try {
      const { pincode } = useLocation.getState();
      const { data } = await api.get('/cart', { params: { pincode: pincode || undefined } });
      set({ cart: data.cart, loading: false, hydrated: true });
    } catch {
      set({ loading: false, hydrated: true });
    }
  },

  async loadWishlist() {
    const { user } = useAuth.getState();
    if (user?.role !== 'CUSTOMER') return set({ wishlistIds: [] });
    try {
      const { data } = await api.get('/account/wishlist/ids');
      set({ wishlistIds: data.ids });
    } catch {
      /* a failed wishlist fetch should never block the page */
    }
  },

  async addToCart(payload) {
    const { pincode } = useLocation.getState();
    const { data } = await api.post('/cart/items', { ...payload, pincode: pincode || undefined });
    set({ cart: data.cart });
    toast.success('Added to cart');
    return data.cart;
  },

  async updateItem(itemId, patch) {
    const { data } = await api.patch(`/cart/items/${itemId}`, patch);
    set({ cart: data.cart });
  },

  async removeItem(itemId) {
    const { data } = await api.delete(`/cart/items/${itemId}`);
    set({ cart: data.cart });
    toast.info('Removed from cart');
  },

  async setCartPincode(pincode) {
    const { data } = await api.patch('/cart/pincode', { pincode });
    set({ cart: data.cart });
    useAuth.getState().setPincodeOnUser(pincode);
  },

  async applyCoupon(code) {
    const { data } = await api.post('/cart/coupon', { code });
    set({ cart: data.cart });
    toast.success(data.message);
  },

  async removeCoupon() {
    const { data } = await api.delete('/cart/coupon');
    set({ cart: data.cart });
  },

  async clearCart() {
    const { data } = await api.delete('/cart');
    set({ cart: data.cart });
  },

  isWishlisted: (productId) => get().wishlistIds.includes(String(productId)),

  async toggleWishlist(productId) {
    const id = String(productId);
    const wishlisted = get().isWishlisted(id);

    // Optimistic — a heart that lags feels broken.
    set({
      wishlistIds: wishlisted ? get().wishlistIds.filter((x) => x !== id) : [...get().wishlistIds, id],
    });

    try {
      if (wishlisted) await api.delete(`/account/wishlist/${id}`);
      else await api.post(`/account/wishlist/${id}`);
      toast.success(wishlisted ? 'Removed from wishlist' : 'Saved to wishlist');
    } catch (err) {
      set({ wishlistIds: wishlisted ? [...get().wishlistIds, id] : get().wishlistIds.filter((x) => x !== id) });
      toast.error(err.message);
    }
  },

  reset: () => set({ cart: null, wishlistIds: [], hydrated: false }),
}));

export default useShop;
