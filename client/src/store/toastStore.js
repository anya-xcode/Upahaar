import { create } from 'zustand';

let nextId = 1;

export const useToasts = create((set, get) => ({
  items: [],

  push(type, message, ttl = 3600) {
    const id = nextId++;
    set({ items: [...get().items, { id, type, message }] });
    setTimeout(() => get().dismiss(id), ttl);
    return id;
  },

  dismiss(id) {
    set({ items: get().items.filter((t) => t.id !== id) });
  },
}));

/** Imperative helper so stores and handlers can toast without a hook. */
export const toast = {
  success: (m) => useToasts.getState().push('success', m),
  error: (m) => useToasts.getState().push('error', m, 5000),
  info: (m) => useToasts.getState().push('info', m),
};

export default useToasts;
